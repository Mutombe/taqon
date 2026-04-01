import logging

from django.db import transaction
from django.db.models import Prefetch, Count
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from .models import (
    SolarComponent,
    SolarPackageTemplate,
    PackageComponent,
    SolarConfiguration,
    ConfigurationItem,
    PackageFamily,
    Appliance,
)
from .serializers import (
    SolarComponentSerializer,
    SolarComponentListSerializer,
    SolarPackageTemplateSerializer,
    SolarPackageListSerializer,
    PackageComponentSerializer,
    SolarConfigurationSerializer,
    SolarConfigurationListSerializer,
    ConfigurationItemSerializer,
    ConfigurationItemCreateSerializer,
    CreateConfigurationSerializer,
    UpdateConfigItemsSerializer,
    AdminSolarPackageCreateUpdateSerializer,
    AdminSolarComponentCreateUpdateSerializer,
    ApplianceSerializer,
    RecommendRequestSerializer,
    PackageFamilySerializer,
    PackageFamilyListSerializer,
    PriceBreakdownSerializer,
    AdminApplianceCreateUpdateSerializer,
    AdminPackageFamilyCreateUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════
# Appliances (public)
# ══════════════════════════════════════════════

class ApplianceListView(generics.ListAPIView):
    """List all active appliances, filterable by category."""
    permission_classes = [AllowAny]
    serializer_class = ApplianceSerializer
    pagination_class = None  # ~90 items, return all

    def get_queryset(self):
        qs = Appliance.objects.filter(is_active=True, is_deleted=False)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
            )

        return qs


class ApplianceCategoriesView(APIView):
    """Return available appliance categories with counts."""
    permission_classes = [AllowAny]

    # Customer-facing category order (how sales reps ask questions)
    CATEGORY_ORDER = ['lounge', 'kitchen', 'bedroom', 'bathroom', 'laundry', 'office', 'garage', 'outdoor', 'security', 'other']

    def get(self, request):
        categories = (
            Appliance.objects
            .filter(is_active=True, is_deleted=False)
            .values('category')
            .annotate(count=Count('id'))
        )
        order_map = {v: i for i, v in enumerate(self.CATEGORY_ORDER)}
        categories = sorted(categories, key=lambda c: order_map.get(c['category'], 99))
        result = [
            {
                'value': c['category'],
                'label': dict(Appliance.CATEGORY_CHOICES).get(c['category'], c['category']),
                'count': c['count'],
            }
            for c in categories
        ]
        return Response(result)


# ══════════════════════════════════════════════
# Package Families (public)
# ══════════════════════════════════════════════

class PackageFamilyListView(generics.ListAPIView):
    """List all active package families with nested packages."""
    permission_classes = [AllowAny]
    serializer_class = PackageFamilyListSerializer
    pagination_class = None

    def get_queryset(self):
        return PackageFamily.objects.filter(
            is_active=True, is_deleted=False
        ).prefetch_related(
            Prefetch(
                'packages',
                queryset=SolarPackageTemplate.objects.filter(
                    is_active=True, is_deleted=False
                ).order_by('price'),
            ),
        )


class PackageFamilyDetailView(generics.RetrieveAPIView):
    """Retrieve a package family by slug with full nested packages."""
    permission_classes = [AllowAny]
    serializer_class = PackageFamilySerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return PackageFamily.objects.filter(
            is_active=True, is_deleted=False
        ).prefetch_related(
            Prefetch(
                'packages',
                queryset=SolarPackageTemplate.objects.filter(
                    is_active=True, is_deleted=False
                ).select_related('family').order_by('price'),
            ),
        )


# ══════════════════════════════════════════════
# Recommendation Engine (public)
# ══════════════════════════════════════════════

class RecommendView(APIView):
    """
    POST: Generate 3-tier package recommendations based on appliance selections.

    Body: { appliances: [{appliance_id, quantity}], distance_km: 10 }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecommendRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        distance_km = data.get('distance_km', 10)

        # Resolve appliances
        appliance_ids = [item['appliance_id'] for item in data['appliances']]
        appliances_map = {
            str(a.pk): a
            for a in Appliance.objects.filter(
                pk__in=appliance_ids, is_active=True, is_deleted=False
            )
        }

        missing = [str(aid) for aid in appliance_ids if str(aid) not in appliances_map]
        if missing:
            return Response(
                {'detail': f'Appliances not found: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build (appliance, quantity) pairs
        selections = []
        for item in data['appliances']:
            appliance = appliances_map[str(item['appliance_id'])]
            selections.append((appliance, item['quantity']))

        # Extract preferences
        preferences = data.get('preferences', {})
        if preferences and hasattr(preferences, 'items'):
            preferences = dict(preferences)
        else:
            preferences = {}

        # Run recommendation engine
        from .engine.recommender import recommend_packages
        result = recommend_packages(selections, distance_km=distance_km, preferences=preferences)

        # Serialize response
        response_data = {
            'total_pp': str(result['total_pp']),
            'total_ep': str(result['total_ep']),
            'distance_km': str(result['distance_km']),
            'tiers': {},
        }

        for tier_name, tier_data in result['tiers'].items():
            pkg = tier_data['package']
            response_data['tiers'][tier_name] = {
                'package': SolarPackageListSerializer(pkg).data if pkg else None,
                'score': tier_data.get('score', 0),
                'pp_fit': tier_data.get('pp_fit', 0),
                'ep_fit': tier_data.get('ep_fit', 0),
                'inverter_kva': str(tier_data.get('inverter_kva', '')),
                'battery_kwh': str(tier_data.get('battery_kwh', '')),
                'adjusted_pp': str(tier_data.get('adjusted_pp', 0)),
                'adjusted_ep': str(tier_data.get('adjusted_ep', 0)),
                'price_breakdown': {
                    k: str(v) for k, v in tier_data['price_breakdown'].items()
                } if tier_data.get('price_breakdown') else None,
            }

        return Response(response_data)


class InstantQuoteView(APIView):
    """
    POST: Generate an instant PDF quotation for a specific package.
    No auth required — anyone can get a quote.

    Body: { package_slug, distance_km, customer_name, customer_email, customer_phone?, customer_address? }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        from django.utils import timezone
        import uuid

        slug = request.data.get('package_slug')
        distance_km = float(request.data.get('distance_km', 10))
        customer_name = request.data.get('customer_name', '').strip()
        customer_email = request.data.get('customer_email', '').strip()
        customer_phone = request.data.get('customer_phone', '').strip()
        customer_address = request.data.get('customer_address', '').strip()
        tier_label = request.data.get('tier_label', '')

        if not slug or not customer_name or not customer_email:
            return Response(
                {'error': 'package_slug, customer_name, and customer_email are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            package = SolarPackageTemplate.objects.select_related('family').prefetch_related(
                'items__component'
            ).get(slug=slug)
        except SolarPackageTemplate.DoesNotExist:
            return Response({'error': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Calculate pricing
        from .engine.recommender import calculate_price
        price = calculate_price(package, distance_km)

        # Group components by category
        CATEGORY_ORDER = ['inverter', 'battery', 'panel', 'charger', 'mounting', 'cable', 'accessory']
        CATEGORY_LABELS = {
            'inverter': 'Inverters',
            'battery': 'Batteries',
            'panel': 'Solar Panels',
            'charger': 'Charge Controllers',
            'mounting': 'Mounting & Structures',
            'cable': 'Cables & Wiring',
            'accessory': 'Accessories',
        }

        # Categories shown as individual line items (with full detail)
        DETAIL_CATS = {'inverter', 'battery', 'panel'}

        detail_items = {}   # cat -> list of items (shown individually)
        grouped_totals = {} # cat -> summed total (shown as one line)

        for pc in package.items.all():
            cat = pc.component.category
            line_total = float(pc.component.price * pc.quantity)

            if cat in DETAIL_CATS:
                if cat not in detail_items:
                    detail_items[cat] = []
                specs_parts = []
                if pc.component.wattage:
                    specs_parts.append(f'{pc.component.wattage}W')
                if pc.component.capacity_kwh:
                    specs_parts.append(f'{pc.component.capacity_kwh}kWh')
                if pc.component.voltage:
                    specs_parts.append(f'{pc.component.voltage}V')
                if pc.component.warranty_years:
                    specs_parts.append(f'{pc.component.warranty_years}yr warranty')

                detail_items[cat].append({
                    'name': pc.component.name,
                    'brand': pc.component.brand or '',
                    'specs': ' | '.join(specs_parts),
                    'qty': pc.quantity,
                    'unit_price': f'{float(pc.component.price):,.2f}',
                    'total': f'{line_total:,.2f}',
                })
            else:
                grouped_totals[cat] = grouped_totals.get(cat, 0) + line_total

        # Build ordered item groups
        item_groups = []
        counter = 1

        # First: detailed items (inverters, batteries, panels)
        for cat in ['inverter', 'battery', 'panel']:
            if cat in detail_items:
                for item in detail_items[cat]:
                    item['num'] = counter
                    counter += 1
                item_groups.append({
                    'label': CATEGORY_LABELS.get(cat, cat.title()),
                    'items': detail_items[cat],
                })

        # Then: grouped items (mounting, cables, accessories, etc.) as single lines
        other_items = []
        for cat in ['charger', 'mounting', 'cable', 'accessory']:
            if cat in grouped_totals:
                other_items.append({
                    'num': counter,
                    'name': CATEGORY_LABELS.get(cat, cat.title()),
                    'brand': '',
                    'specs': '',
                    'qty': 1,
                    'unit_price': f'{grouped_totals[cat]:,.2f}',
                    'total': f'{grouped_totals[cat]:,.2f}',
                })
                counter += 1

        if other_items:
            item_groups.append({
                'label': 'Other Components',
                'items': other_items,
            })

        ref_number = f'TQ-{timezone.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'

        context = {
            'package_name': package.family.name if package.family else package.name,
            'date': timezone.now().strftime('%d %B %Y'),
            'ref_number': ref_number,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
            'customer_address': customer_address,
            'inverter_kva': package.inverter_kva or '',
            'battery_kwh': package.battery_capacity_kwh or '',
            'panel_count': package.panel_count or '',
            'tier_label': tier_label or package.tier or '',
            'item_groups': item_groups,
            'material_total': f'{float(price["material"]):,.2f}',
            'sundries_total': f'{float(price["sundries"]):,.2f}',
            'labour_total': f'{float(price["labour"]):,.2f}',
            'transport_total': f'{float(price["transport"]):,.2f}',
            'grand_total': f'{float(price["total"]):,.2f}',
            'distance_km': int(distance_km),
        }

        html_string = render_to_string('pdfs/instant_quote.html', context)

        from apps.quotations.pdf import _render_pdf
        pdf_bytes = _render_pdf(html_string)
        is_pdf = pdf_bytes[:4] == b'%PDF'
        content_type = 'application/pdf' if is_pdf else 'text/html'
        ext = 'pdf' if is_pdf else 'html'
        response = HttpResponse(pdf_bytes, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{ref_number}.{ext}"'
        return response


class PackagePriceView(APIView):
    """
    GET: Calculate price breakdown for a package with custom distance.

    Query params: ?distance_km=25
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            package = SolarPackageTemplate.objects.prefetch_related(
                'items__component'
            ).get(slug=slug, is_active=True, is_deleted=False)
        except SolarPackageTemplate.DoesNotExist:
            return Response(
                {'detail': 'Package not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        distance_km = request.query_params.get('distance_km', 10)
        try:
            distance_km = float(distance_km)
        except (TypeError, ValueError):
            distance_km = 10

        from .engine.pricing import calculate_price
        breakdown = calculate_price(package, distance_km=distance_km)

        return Response({
            'package_slug': slug,
            'package_name': package.name,
            'distance_km': str(distance_km),
            'material': str(breakdown['material']),
            'sundries': str(breakdown['sundries']),
            'labour': str(breakdown['labour']),
            'transport': str(breakdown['transport']),
            'total': str(breakdown['total']),
        })


# ══════════════════════════════════════════════
# Components (public)
# ══════════════════════════════════════════════

class ComponentListView(generics.ListAPIView):
    """List all active solar components, filterable by category."""
    permission_classes = [AllowAny]
    serializer_class = SolarComponentListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = SolarComponent.objects.filter(is_active=True, is_deleted=False)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        brand = self.request.query_params.get('brand')
        if brand:
            qs = qs.filter(brand__icontains=brand)

        voltage = self.request.query_params.get('voltage')
        if voltage:
            qs = qs.filter(compatible_voltages__contains=[int(voltage)])

        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)

        shop_visible = self.request.query_params.get('shop_visible')
        if shop_visible == 'true':
            qs = qs.filter(shop_visible=True)

        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(model_number__icontains=search)
                | Q(description__icontains=search)
            )

        ordering = self.request.query_params.get('ordering', 'sort_order')
        allowed = ['price', '-price', 'wattage', '-wattage', 'name', '-name', 'sort_order']
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs


class ComponentDetailView(generics.RetrieveAPIView):
    """Retrieve a single component by slug."""
    permission_classes = [AllowAny]
    serializer_class = SolarComponentSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return SolarComponent.objects.filter(is_active=True, is_deleted=False)


class ComponentCategoriesView(APIView):
    """Return available component categories with counts."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = (
            SolarComponent.objects
            .filter(is_active=True, is_deleted=False)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('category')
        )
        result = [
            {'value': c['category'], 'label': dict(SolarComponent.CATEGORY_CHOICES).get(c['category'], c['category']), 'count': c['count']}
            for c in categories
        ]
        return Response(result)


# ══════════════════════════════════════════════
# Package Templates (public)
# ══════════════════════════════════════════════

class PackageListView(generics.ListAPIView):
    """List all active package templates."""
    permission_classes = [AllowAny]
    serializer_class = SolarPackageListSerializer
    pagination_class = None

    def get_queryset(self):
        qs = SolarPackageTemplate.objects.filter(
            is_active=True, is_deleted=False
        ).select_related('family')

        tier = self.request.query_params.get('tier')
        if tier:
            qs = qs.filter(tier=tier)

        suitable = self.request.query_params.get('suitable_for')
        if suitable:
            qs = qs.filter(suitable_for__contains=[suitable])

        family = self.request.query_params.get('family')
        if family:
            qs = qs.filter(family__slug=family)

        return qs


class PackageDetailView(generics.RetrieveAPIView):
    """Retrieve a package template with all components."""
    permission_classes = [AllowAny]
    serializer_class = SolarPackageTemplateSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            SolarPackageTemplate.objects
            .filter(is_active=True, is_deleted=False)
            .select_related('family')
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=PackageComponent.objects.select_related('component')
                    .order_by('component__category', 'component__sort_order'),
                ),
            )
        )


# ══════════════════════════════════════════════
# User Configurations (authenticated)
# ══════════════════════════════════════════════

class ConfigurationListView(generics.ListAPIView):
    """List the current user's solar configurations."""
    permission_classes = [IsAuthenticated]
    serializer_class = SolarConfigurationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return SolarConfiguration.objects.filter(user=self.request.user)


class ConfigurationDetailView(generics.RetrieveAPIView):
    """Retrieve a single configuration with all items."""
    permission_classes = [IsAuthenticated]
    serializer_class = SolarConfigurationSerializer

    def get_queryset(self):
        return (
            SolarConfiguration.objects
            .filter(user=self.request.user)
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component')
                    .order_by('component__category', 'component__sort_order'),
                ),
            )
        )


class CreateConfigurationView(APIView):
    """
    Create a new solar configuration.

    - Optionally from a package template (copies all components).
    - Optionally with an explicit list of items.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateConfigurationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            config = SolarConfiguration.objects.create(
                user=request.user,
                name=data['name'],
                description=data.get('description', ''),
                system_voltage=data['system_voltage'],
            )

            # If based on a template, copy its items
            template_id = data.get('template_id')
            if template_id:
                try:
                    template = SolarPackageTemplate.objects.prefetch_related(
                        Prefetch(
                            'items',
                            queryset=PackageComponent.objects.select_related('component'),
                        ),
                    ).get(pk=template_id, is_active=True, is_deleted=False)
                except SolarPackageTemplate.DoesNotExist:
                    return Response(
                        {'detail': 'Package template not found.'},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                config.based_on_template = template
                config.save(update_fields=['based_on_template', 'updated_at'])

                items_to_create = [
                    ConfigurationItem(
                        configuration=config,
                        component=pkg_item.component,
                        quantity=pkg_item.quantity,
                    )
                    for pkg_item in template.items.all()
                ]
                ConfigurationItem.objects.bulk_create(items_to_create)

            # If explicit items provided (and no template)
            elif data.get('items'):
                component_ids = [item['component_id'] for item in data['items']]
                components = {
                    str(c.pk): c
                    for c in SolarComponent.objects.filter(pk__in=component_ids, is_active=True, is_deleted=False)
                }

                missing = [str(cid) for cid in component_ids if str(cid) not in components]
                if missing:
                    return Response(
                        {'detail': f'Components not found: {", ".join(missing)}'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                items_to_create = [
                    ConfigurationItem(
                        configuration=config,
                        component=components[str(item['component_id'])],
                        quantity=item['quantity'],
                    )
                    for item in data['items']
                ]
                ConfigurationItem.objects.bulk_create(items_to_create)

            # Recalculate system specs
            config.recalculate()

        # Re-fetch with prefetched items
        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(
            SolarConfigurationSerializer(config).data,
            status=status.HTTP_201_CREATED,
        )


class UpdateConfigurationView(APIView):
    """Update configuration name, description, or system voltage."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = request.data.get('name')
        if name:
            config.name = name

        description = request.data.get('description')
        if description is not None:
            config.description = description

        voltage = request.data.get('system_voltage')
        if voltage and voltage in (12, 24, 48):
            config.system_voltage = voltage

        config_status = request.data.get('status')
        if config_status and config_status in ('draft', 'saved'):
            config.status = config_status

        config.save()
        config.recalculate()

        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(SolarConfigurationSerializer(config).data)


class DeleteConfigurationView(APIView):
    """Delete a configuration."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateConfigItemsView(APIView):
    """
    Replace all items in a configuration.

    Accepts a list of {component_id, quantity} and replaces the current items.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateConfigItemsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data['items']

        component_ids = [item['component_id'] for item in items_data]
        components = {
            str(c.pk): c
            for c in SolarComponent.objects.filter(pk__in=component_ids, is_active=True, is_deleted=False)
        }

        missing = [str(cid) for cid in component_ids if str(cid) not in components]
        if missing:
            return Response(
                {'detail': f'Components not found: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Remove existing items
            config.items.all().delete()

            # Create new items
            items_to_create = [
                ConfigurationItem(
                    configuration=config,
                    component=components[str(item['component_id'])],
                    quantity=item['quantity'],
                )
                for item in items_data
            ]
            ConfigurationItem.objects.bulk_create(items_to_create)

            # Recalculate
            config.recalculate()

        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(SolarConfigurationSerializer(config).data)


class AddConfigItemView(APIView):
    """Add a single component to a configuration."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConfigurationItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        component_id = serializer.validated_data['component_id']
        quantity = serializer.validated_data['quantity']

        try:
            component = SolarComponent.objects.get(pk=component_id, is_active=True, is_deleted=False)
        except SolarComponent.DoesNotExist:
            return Response(
                {'detail': 'Component not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # If component already exists in config, update quantity
        item, created = ConfigurationItem.objects.get_or_create(
            configuration=config,
            component=component,
            defaults={'quantity': quantity},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity', 'updated_at'])

        config.recalculate()

        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(
            SolarConfigurationSerializer(config).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RemoveConfigItemView(APIView):
    """Remove a component from a configuration."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, item_pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item = ConfigurationItem.objects.get(pk=item_pk, configuration=config)
        except ConfigurationItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in this configuration.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        item.delete()
        config.recalculate()

        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(SolarConfigurationSerializer(config).data)


class UpdateConfigItemQuantityView(APIView):
    """Update the quantity of a single item in a configuration."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, item_pk):
        try:
            config = SolarConfiguration.objects.get(pk=pk, user=request.user)
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item = ConfigurationItem.objects.get(pk=item_pk, configuration=config)
        except ConfigurationItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in this configuration.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        quantity = request.data.get('quantity')
        if not quantity or not isinstance(quantity, int) or quantity < 1:
            return Response(
                {'detail': 'Quantity must be a positive integer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save(update_fields=['quantity', 'updated_at'])
        config.recalculate()

        config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=config.pk)
        )
        return Response(SolarConfigurationSerializer(config).data)


class DuplicateConfigurationView(APIView):
    """Duplicate an existing configuration."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            original = (
                SolarConfiguration.objects
                .prefetch_related(
                    Prefetch(
                        'items',
                        queryset=ConfigurationItem.objects.select_related('component'),
                    ),
                )
                .get(pk=pk, user=request.user)
            )
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            new_config = SolarConfiguration.objects.create(
                user=request.user,
                name=f"{original.name} (Copy)",
                description=original.description,
                based_on_template=original.based_on_template,
                system_voltage=original.system_voltage,
                status='draft',
            )

            items_to_create = [
                ConfigurationItem(
                    configuration=new_config,
                    component=item.component,
                    quantity=item.quantity,
                )
                for item in original.items.all()
            ]
            ConfigurationItem.objects.bulk_create(items_to_create)
            new_config.recalculate()

        new_config = (
            SolarConfiguration.objects
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=ConfigurationItem.objects.select_related('component'),
                ),
            )
            .get(pk=new_config.pk)
        )
        return Response(
            SolarConfigurationSerializer(new_config).data,
            status=status.HTTP_201_CREATED,
        )


class ConvertConfigToQuoteView(APIView):
    """
    Convert a solar configuration into a quotation request.

    Requires the quotations app to be installed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            config = (
                SolarConfiguration.objects
                .prefetch_related(
                    Prefetch(
                        'items',
                        queryset=ConfigurationItem.objects.select_related('component'),
                    ),
                )
                .get(pk=pk, user=request.user)
            )
        except SolarConfiguration.DoesNotExist:
            return Response(
                {'detail': 'Configuration not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Build a description of the configuration
        lines = [f"Solar Configuration: {config.name}"]
        lines.append(f"System Voltage: {config.system_voltage}V")
        lines.append(f"Total Wattage: {config.total_wattage}W")
        lines.append(f"Battery Capacity: {config.battery_capacity_kwh} kWh")
        lines.append(f"Estimated Daily Output: {config.estimated_daily_kwh} kWh")
        lines.append(f"Estimated Backup: {config.estimated_backup_hours} hours")
        lines.append("")
        lines.append("Components:")
        for item in config.items.all():
            lines.append(f"  - {item.component.name} x{item.quantity} (${item.line_total})")
        lines.append("")
        lines.append(f"Total Price: ${config.total_price}")

        description = "\n".join(lines)

        try:
            from apps.quotations.models import QuotationRequest
            quote_request = QuotationRequest.objects.create(
                user=request.user,
                name=request.user.get_full_name() or request.user.email,
                email=request.user.email,
                phone=getattr(request.user, 'phone', ''),
                property_type='residential',
                budget_range=f"${config.total_price}",
                additional_notes=description,
            )
            config.status = 'quoted'
            config.save(update_fields=['status', 'updated_at'])

            return Response({
                'detail': 'Quotation request created from configuration.',
                'quotation_request_id': str(quote_request.pk),
                'configuration_id': str(config.pk),
            }, status=status.HTTP_201_CREATED)

        except ImportError:
            return Response(
                {'detail': 'Quotation system not available.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ══════════════════════════════════════════════
# Admin views
# ══════════════════════════════════════════════

class AdminComponentListView(generics.ListAPIView):
    """Admin: list all components including inactive."""
    permission_classes = [IsAdmin]
    serializer_class = SolarComponentSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return SolarComponent.objects.filter(is_deleted=False)


class AdminPackageListView(generics.ListAPIView):
    """Admin: list all packages including inactive."""
    permission_classes = [IsAdmin]
    serializer_class = SolarPackageTemplateSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            SolarPackageTemplate.objects
            .filter(is_deleted=False)
            .select_related('family')
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=PackageComponent.objects.select_related('component'),
                ),
            )
        )


class AdminConfigurationListView(generics.ListAPIView):
    """Admin: list all user configurations."""
    permission_classes = [IsAdmin]
    serializer_class = SolarConfigurationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = SolarConfiguration.objects.select_related('user').all()

        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)

        config_status = self.request.query_params.get('status')
        if config_status:
            qs = qs.filter(status=config_status)

        return qs


class AdminPackageCreateView(generics.CreateAPIView):
    """Admin: create a new solar package template."""
    permission_classes = [IsAdmin]
    serializer_class = AdminSolarPackageCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminPackageUpdateView(generics.RetrieveUpdateAPIView):
    """Admin: retrieve or update a solar package template by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            SolarPackageTemplate.objects
            .filter(is_deleted=False)
            .select_related('family')
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=PackageComponent.objects.select_related('component'),
                ),
            )
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminSolarPackageCreateUpdateSerializer
        return SolarPackageTemplateSerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AdminPackageDeleteView(APIView):
    """Admin: soft-delete a solar package template by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            package = SolarPackageTemplate.objects.get(slug=slug, is_deleted=False)
        except SolarPackageTemplate.DoesNotExist:
            return Response(
                {'detail': 'Package not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        package.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminComponentCreateView(generics.CreateAPIView):
    """Admin: create a new solar component."""
    permission_classes = [IsAdmin]
    serializer_class = AdminSolarComponentCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminComponentUpdateView(generics.RetrieveUpdateAPIView):
    """Admin: retrieve or update a solar component by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return SolarComponent.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminSolarComponentCreateUpdateSerializer
        return SolarComponentSerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AdminComponentDeleteView(APIView):
    """Admin: soft-delete a solar component by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            component = SolarComponent.objects.get(slug=slug, is_deleted=False)
        except SolarComponent.DoesNotExist:
            return Response(
                {'detail': 'Component not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        component.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin Appliances ──

class AdminApplianceListView(generics.ListAPIView):
    """Admin: list all appliances."""
    permission_classes = [IsAdmin]
    serializer_class = ApplianceSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Appliance.objects.filter(is_deleted=False)


class AdminApplianceCreateView(generics.CreateAPIView):
    """Admin: create a new appliance."""
    permission_classes = [IsAdmin]
    serializer_class = AdminApplianceCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminApplianceUpdateView(generics.RetrieveUpdateAPIView):
    """Admin: retrieve or update an appliance by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return Appliance.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminApplianceCreateUpdateSerializer
        return ApplianceSerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AdminApplianceDeleteView(APIView):
    """Admin: soft-delete an appliance by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            appliance = Appliance.objects.get(slug=slug, is_deleted=False)
        except Appliance.DoesNotExist:
            return Response(
                {'detail': 'Appliance not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        appliance.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin Families ──

class AdminFamilyListView(generics.ListAPIView):
    """Admin: list all package families."""
    permission_classes = [IsAdmin]
    serializer_class = PackageFamilySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return PackageFamily.objects.filter(is_deleted=False).prefetch_related('packages')


class AdminFamilyCreateView(generics.CreateAPIView):
    """Admin: create a new package family."""
    permission_classes = [IsAdmin]
    serializer_class = AdminPackageFamilyCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminFamilyUpdateView(generics.RetrieveUpdateAPIView):
    """Admin: retrieve or update a package family by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return PackageFamily.objects.filter(is_deleted=False).prefetch_related('packages')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminPackageFamilyCreateUpdateSerializer
        return PackageFamilySerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AdminFamilyDeleteView(APIView):
    """Admin: soft-delete a package family by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            family = PackageFamily.objects.get(slug=slug, is_deleted=False)
        except PackageFamily.DoesNotExist:
            return Response(
                {'detail': 'Family not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        family.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
