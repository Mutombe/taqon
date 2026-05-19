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
    InstantQuoteDownload,
    RecommendationSession,
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
    AdminPackageItemSerializer,
    InstantQuoteDownloadSerializer,
    InstantQuoteDownloadDetailSerializer,
    RecommendationSessionSerializer,
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

    # Room order by actual daily usage frequency:
    # Kitchen first (24/7 fridge + daily cooking), Lounge (daily evenings/weekends),
    # Bedroom (nightly sleep + AC/fans), Bathroom (daily geyser + 2-3 uses/day),
    # then weekly/occasional rooms.
    CATEGORY_ORDER = ['kitchen', 'lounge', 'bedroom', 'bathroom', 'laundry', 'office', 'outdoor', 'security', 'garage', 'other']

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

        # Track session — store full appliance selection so admin can
        # see exactly what the customer picked.
        session_id = None
        try:
            from .models import RecommendationSession
            tiers = result.get('tiers', {})
            appliances_snapshot = [
                {
                    'id': str(appliance.id),
                    'name': appliance.name,
                    'category': appliance.category,
                    'quantity': qty,
                    'pp': float(appliance.power_points or 0),
                    'ep': float(appliance.energy_points or 0),
                }
                for appliance, qty in selections
            ]
            session = RecommendationSession.objects.create(
                total_pp=result.get('total_pp', 0),
                total_ep=result.get('total_ep', 0),
                distance_km=distance_km,
                appliance_count=sum(qty for _, qty in selections),
                budget_package=tiers.get('budget', {}).get('package', None) and tiers['budget']['package'].name or '',
                good_fit_package=tiers.get('good_fit', {}).get('package', None) and tiers['good_fit']['package'].name or '',
                excellent_package=tiers.get('excellent', {}).get('package', None) and tiers['excellent']['package'].name or '',
                priority=preferences.get('priority', ''),
                use_style=preferences.get('use_style', ''),
                ip_address=request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip(),
                appliances=appliances_snapshot,
            )
            session_id = str(session.id)
        except Exception:
            pass  # Never fail the recommendation due to tracking

        # Serialize response
        response_data = {
            'total_pp': str(result['total_pp']),
            'total_ep': str(result['total_ep']),
            'distance_km': str(result['distance_km']),
            'best_match_tier': result.get('best_match_tier', 'good_fit'),
            'session_id': session_id,  # Frontend passes this back when downloading a quote
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
                'best_match': tier_data.get('best_match', False),
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
        session_id = request.data.get('session_id')  # Optional — links to the advisor session

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

        # Embed the company logo as base64 data URI — most portable way
        # to include images in xhtml2pdf output regardless of server paths.
        import base64
        import os
        logo_data_uri = ''
        try:
            logo_path = os.path.join(
                os.path.dirname(__file__), '..', 'quotations', 'static',
                'pdf_assets', 'taqon-electrico-logo.jpg',
            )
            with open(logo_path, 'rb') as f:
                logo_data_uri = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('ascii')
        except Exception:
            pass  # Logo missing — template will show text fallback

        # Per-kW / per-kWh indicators give the customer industry-relative
        # context without exposing per-component pricing (the new non-itemized
        # template hides line totals, so these become the comparison anchor).
        total_num = float(price['total'])
        panel_w_total = sum(
            (pc.component.wattage or 0) * pc.quantity
            for pc in package.items.all()
            if pc.component.category == 'panel'
        )
        system_size_kw = round(panel_w_total / 1000, 1) if panel_w_total else None
        battery_kwh_num = float(package.battery_capacity_kwh) if package.battery_capacity_kwh else None
        usd_per_kw = (
            f'{(total_num / system_size_kw):,.2f}' if system_size_kw else ''
        )
        usd_per_kwh = (
            f'{(total_num / battery_kwh_num):,.2f}' if battery_kwh_num else ''
        )

        context = {
            'logo_data_uri': logo_data_uri,
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
            # Labour + transport are merged on the PDF for simpler customer-facing display
            'labour_transport_total': f'{float(price["labour"]) + float(price["transport"]):,.2f}',
            'grand_total': f'{float(price["total"]):,.2f}',
            'distance_km': int(distance_km),
            # Non-itemized template extras — leave VAT-related fields blank
            # so the template falls back to its 'VAT Included' presentation.
            'subtotal_excl_vat': '',
            'vat_amount': '',
            'system_size_kw': str(system_size_kw) if system_size_kw else '',
            'usd_per_kw': usd_per_kw,
            'usd_per_kwh': usd_per_kwh,
            'project_description': '',  # template generates fallback from package_name
            'warranties': [],            # template uses default Taqon warranty block
        }

        # Track download + link to advisor session if provided
        try:
            from .models import InstantQuoteDownload, RecommendationSession
            session = None
            appliances_snapshot = []
            if session_id:
                try:
                    session = RecommendationSession.objects.get(pk=session_id)
                    appliances_snapshot = session.appliances or []
                except (RecommendationSession.DoesNotExist, ValueError, TypeError):
                    session = None

            InstantQuoteDownload.objects.create(
                package=package,
                package_name=package.family.name if package.family else package.name,
                tier_label=tier_label,
                distance_km=distance_km,
                total_price=price['total'],
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                customer_address=customer_address,
                session=session,
                appliances=appliances_snapshot,
            )
        except Exception:
            pass  # Never fail the quote due to tracking

        # ── Render the quote via ReportLab platypus (replaces the
        # xhtml2pdf / WeasyPrint HTML path). Native flowable layout
        # gives us predictable typography, fast renders, and brand-
        # true colours straight from apps.documents.styles. ──
        try:
            from apps.documents.quotation import build_quotation_pdf
            pdf_bytes = build_quotation_pdf(
                package_name=context['package_name'],
                ref_number=ref_number,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                customer_address=customer_address,
                item_groups=item_groups,
                material_total=context['material_total'],
                labour_transport_total=context['labour_transport_total'],
                grand_total=context['grand_total'],
                inverter_kva=context['inverter_kva'],
                battery_kwh=context['battery_kwh'],
                panel_count=context['panel_count'],
                tier_label=context['tier_label'],
                system_size_kw=context['system_size_kw'],
                usd_per_kw=context['usd_per_kw'],
                usd_per_kwh=context['usd_per_kwh'],
                distance_km=distance_km,
            )
            is_pdf = pdf_bytes[:4] == b'%PDF'
        except Exception:
            logger.exception('ReportLab quote build failed — falling back to HTML pipeline')
            html_string = render_to_string('pdfs/instant_quote.html', context)
            from apps.quotations.pdf import _render_pdf
            pdf_bytes = _render_pdf(html_string)
            is_pdf = pdf_bytes[:4] == b'%PDF'

        content_type = 'application/pdf' if is_pdf else 'text/html'
        ext = 'pdf' if is_pdf else 'html'
        response = HttpResponse(pdf_bytes, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{ref_number}.{ext}"'

        # Record the download — fire-and-forget; never breaks the response.
        from apps.downloads.services import record_download
        record_download(
            request,
            kind='instant_quote',
            surface=request.data.get('source') or 'package_detail',
            target_slug=package.slug,
            target_label=package.family.name if package.family else package.name,
            target_id=package.id,
            customer_name=customer_name,
            customer_email=customer_email,
            file_size_bytes=len(pdf_bytes),
            success=is_pdf,
            failure_reason='' if is_pdf else 'renderer fell back to HTML',
            metadata={
                'ref_number': ref_number,
                'tier_label': tier_label,
                'distance_km': float(distance_km),
                'system_size_kw': system_size_kw,
                'grand_total': str(price.get('total', '')),
            },
        )
        return response


class BusinessProfileView(APIView):
    """
    GET: Generate Taqon's company / business profile PDF.

    Open access — used by Contact, About, About-dropdown nav, and CTAs.
    Pulls live `PackageFamily` rows for the packages section; everything
    else (services, testimonials, stats, brands, company info) is sourced
    from constants in this view to keep it self-contained.
    """
    permission_classes = [AllowAny]

    # ── Static profile content (kept in code so it ships with the deploy
    # rather than depending on a CMS table; tweak copy here when needed).
    SERVICES = [
        {'title': 'Solar Installations', 'description': 'Complete residential and commercial solar PV system design, supply and installation.', 'icon_unicode_or_letter': 'S'},
        {'title': 'Solar System Maintenance', 'description': 'Preventative servicing, fault diagnosis, and rapid response on existing solar installations.', 'icon_unicode_or_letter': 'M'},
        {'title': 'Electrical Maintenance', 'description': 'Domestic and commercial electrical maintenance, faults, and compliance work.', 'icon_unicode_or_letter': 'E'},
        {'title': 'Borehole Pump Installations', 'description': 'Solar-powered water pumping for homes, farms and institutions.', 'icon_unicode_or_letter': 'B'},
        {'title': 'Electrical Hardware Supply', 'description': 'Premium-grade equipment supply from world-leading brands.', 'icon_unicode_or_letter': 'H'},
        {'title': 'Lighting Solutions', 'description': 'Custom interior, exterior and security lighting design and installation.', 'icon_unicode_or_letter': 'L'},
    ]

    # Real Taqon installs sourced from website/src/data/projectsData.js. Each
    # `image_url` is fetched at PDF-render time by WeasyPrint, so it must be
    # publicly reachable (production URL works for both prod and dev).
    SITE_PUBLIC_BASE = 'https://www.taqon.co.zw'

    # Both image_url and hero_image_url are populated on every project so
    # the WeasyPrint template can fall back from one to the other without
    # tripping Django's strict variable lookup. The first project is
    # rendered as the full-bleed 16:9 hero on the projects page.
    PROJECTS = [
        # First entry is rendered as the hero (full-bleed 16:9) by the template.
        {
            'title': 'Kadoma 24kVA Commercial Solar System',
            'location': 'Kadoma',
            'kva': '24kVA',
            'category': 'Commercial',
            'description': 'Large-scale 24 kVA commercial installation cutting reliance on the national grid. Canadian monocrystalline panels, lithium-ion storage, off-grid capable.',
            'image_url': f'{SITE_PUBLIC_BASE}/kadoma-24kva-1.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/kadoma-24kva-1.jpg',
        },
        {
            'title': 'Bulawayo 16kVA Residential System',
            'location': 'Bulawayo',
            'kva': '16kVA',
            'category': 'Residential',
            'description': '36 × 535 W panels, 16 kVA Sunsynk inverter, 4 × 100 Ah lithium batteries — powers a full two-storey home through load shedding.',
            'image_url': f'{SITE_PUBLIC_BASE}/bulawayo-16kva-2.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/bulawayo-16kva-2.jpg',
        },
        {
            'title': 'Thuli Service Station — Willowvale',
            'location': 'Harare · Willowvale Rd',
            'kva': '16kVA',
            'category': 'Commercial',
            'description': '16 kVA commercial system keeping a 24/7 service station running at full capacity through national grid outages.',
            'image_url': f'{SITE_PUBLIC_BASE}/thuli-willowvale-16kva-2.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/thuli-willowvale-16kva-2.jpg',
        },
        {
            'title': 'Nedbank Borrowdale 8kVA Backup',
            'location': 'Borrowdale, Harare',
            'kva': '8kVA',
            'category': 'Commercial',
            'description': '8 kVA hybrid backup keeping the branch online and core banking systems live during grid outages.',
            'image_url': f'{SITE_PUBLIC_BASE}/nedbank-borrowdale-8kva-1.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/nedbank-borrowdale-8kva-1.jpg',
        },
        {
            'title': 'Chisipiti 10kVA Hybrid System',
            'location': 'Chisipiti, Harare',
            'kva': '10kVA',
            'category': 'Commercial',
            'description': '10 kVA hybrid solar system delivering daily savings on grid draw plus reliable load-shedding cover.',
            'image_url': f'{SITE_PUBLIC_BASE}/chisipiti-10kva-1.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/chisipiti-10kva-1.jpg',
        },
        {
            'title': 'Nedbank Harare CBD 12kVA',
            'location': 'Jason Moyo Ave, CBD',
            'kva': '12kVA',
            'category': 'Commercial',
            'description': '12 kVA commercial solar at the Harare CBD branch — peak-demand cover during business hours.',
            'image_url': f'{SITE_PUBLIC_BASE}/nedbank-harare-12kva-1.jpg',
            'hero_image_url': f'{SITE_PUBLIC_BASE}/nedbank-harare-12kva-1.jpg',
        },
    ]

    BRANDS = ['Sunsynk', 'Growatt', 'JA Solar', 'Jinko Solar', 'Pylontech', 'Dyness', 'Kodak', 'Deye']

    STATS = [
        {'value': '500+', 'label': 'Projects Completed'},
        {'value': '3000', 'label': 'kWp PV Installed'},
        {'value': '5000+', 'label': 'kWh Battery Storage'},
        {'value': '5+', 'label': 'Years Experience'},
    ]

    TESTIMONIALS = [
        {'name': 'Tendai Moyo', 'role': 'Homeowner, Borrowdale', 'text': "Taqon Electrico transformed our home with a complete solar installation. We haven't worried about load shedding since. Their team was professional, punctual, and the system works flawlessly."},
        {'name': 'City Plastics Harare', 'role': 'Manufacturing Company', 'text': "Our factory's energy costs have dropped significantly since Taqon installed our commercial solar system. The ROI has been excellent and their maintenance team keeps everything running perfectly."},
        {'name': 'Rev. Blessing Chuma', 'role': 'Church Administrator', 'text': "The solar system installed at our church has been a blessing. We can now hold evening services without worrying about power outages. Taqon's team understood our needs perfectly."},
    ]

    ABOUT = (
        'Taqon Electrico is a Harare-based solar and electrical solutions company '
        'delivering reliable, premium-grade renewable energy systems across Zimbabwe. '
        'We design, supply, install, and maintain residential, commercial and '
        'institutional installations end-to-end.'
    )
    MISSION = (
        'To deliver dependable, world-class solar and electrical systems to every '
        'Zimbabwean home and business — combining premium components, certified '
        'workmanship, and customer-first service.'
    )
    CTA_PARAGRAPH = (
        "Whether you're sizing your first home back-up system or commissioning a "
        "commercial-scale installation, our team is ready to help. Reach us through "
        "the channels below and we'll arrange a free consultation and site survey."
    )

    def get(self, request):
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        from django.utils import timezone
        import base64
        import os
        import uuid

        # Logo
        logo_data_uri = ''
        try:
            logo_path = os.path.join(
                os.path.dirname(__file__), '..', 'quotations', 'static',
                'pdf_assets', 'taqon-electrico-logo.jpg',
            )
            with open(logo_path, 'rb') as f:
                logo_data_uri = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('ascii')
        except Exception:
            pass

        # Live package families. Wrapped defensively so a transient DB
        # hiccup still produces a valid profile (the template has an
        # {% empty %} fallback for the families table).
        families = []
        try:
            for f in PackageFamily.objects.filter(
                is_active=True, is_deleted=False
            ).prefetch_related('packages').order_by('kva_rating'):
                cheapest = f.packages.filter(is_active=True, is_deleted=False).order_by('price').first()
                families.append({
                    'name': f.name,
                    'kva': str(f.kva_rating).rstrip('0').rstrip('.') if f.kva_rating else '',
                    'short_description': f.short_description or '',
                    'suitable_for': ', '.join(f.suitable_for) if isinstance(f.suitable_for, list) else (f.suitable_for or ''),
                    'system_size_kw': str(cheapest.system_size_kw) if cheapest and cheapest.system_size_kw else '',
                    'battery_kwh': str(cheapest.battery_capacity_kwh) if cheapest and cheapest.battery_capacity_kwh else '',
                })
        except Exception as exc:
            logger.warning('BusinessProfile: package family lookup failed (%s)', exc)

        ref_number = f'PROFILE-{timezone.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'

        context = {
            'logo_data_uri': logo_data_uri,
            'generated_date': timezone.now().strftime('%d %B %Y'),
            'ref_number': ref_number,
            'company': {
                'name': 'TAQON ELECTRICO',
                'tagline': 'Customer is King!',
                'address': '203 Sherwood Drive, Strathaven, Harare',
                'phone': '+263 77 277 1036',
                'email': 'info@taqon.co.zw',
                'website': 'www.taqon.co.zw',
                'founding_year': '2020',
                'registration_no': 'Licensed Electrical Contractor · ZERA-Recommended',
            },
            'about_paragraph': self.ABOUT,
            'mission_paragraph': self.MISSION,
            'cta_paragraph': self.CTA_PARAGRAPH,
            'services': self.SERVICES,
            'families': families,
            'projects': self.PROJECTS,
            'brands': self.BRANDS,
            'stats': self.STATS,
            'testimonials': self.TESTIMONIALS,
        }

        try:
            from apps.documents.profile import build_profile_pdf
            pdf_bytes = build_profile_pdf(
                company=context['company'],
                about_paragraph=context['about_paragraph'],
                mission_paragraph=context['mission_paragraph'],
                cta_paragraph=context['cta_paragraph'],
                services=context['services'],
                stats=context['stats'],
                projects=context['projects'],
                brands=context['brands'],
                testimonials=context['testimonials'],
                ref_number=ref_number,
                generated_date=context['generated_date'],
            )
            is_pdf = pdf_bytes[:4] == b'%PDF'
        except Exception:
            logger.exception('ReportLab profile build failed — falling back to HTML pipeline')
            html_string = render_to_string('pdfs/business_profile.html', context)
            from apps.quotations.pdf import _render_pdf
            pdf_bytes = _render_pdf(html_string)
            is_pdf = pdf_bytes[:4] == b'%PDF'
        content_type = 'application/pdf' if is_pdf else 'text/html'
        ext = 'pdf' if is_pdf else 'html'
        response = HttpResponse(pdf_bytes, content_type=content_type)
        response['Content-Disposition'] = (
            f'attachment; filename="Taqon-Electrico-Company-Profile.{ext}"'
        )

        from apps.downloads.services import record_download
        record_download(
            request,
            kind='business_profile',
            surface=request.GET.get('source', 'other'),
            target_slug='company-profile',
            target_label='Taqon Electrico Company Profile',
            file_size_bytes=len(pdf_bytes),
            success=is_pdf,
            failure_reason='' if is_pdf else 'renderer fell back to HTML',
            metadata={'ref_number': ref_number},
        )
        return response


class PackagesCatalogueView(APIView):
    """
    GET: Generate the universal Packages Catalogue PDF.

    Pulls every active PackageFamily live, so the document automatically
    reflects whatever's currently in the catalogue. Used by the
    'Download Full Catalogue' CTA on /packages.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        from django.utils import timezone
        import uuid

        try:
            return self._build(request)
        except Exception:
            # An unhandled 500 here drops CORS headers in some Django
            # configurations, which the browser surfaces as a confusing
            # "blocked by CORS policy" error. Catch everything and
            # return a clear text response so the operator can see the
            # actual failure in the network tab.
            logger.exception('PackagesCatalogue: top-level render failed')
            return Response(
                {'detail': 'Catalogue render failed — please try again or contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # In-process cache for the rendered PDF — 15 minutes is fresh enough
    # for catalogue use (families change rarely) and avoids re-rendering
    # for every visitor. First request after a deploy still has to do
    # the work; the second is instant.
    _CACHE_TTL_SECONDS = 60 * 15

    def _cached_pdf(self):
        from django.core.cache import cache
        return cache.get('packages_catalogue_pdf_v4')

    def _set_cached_pdf(self, pdf_bytes):
        from django.core.cache import cache
        cache.set('packages_catalogue_pdf_v4', pdf_bytes, self._CACHE_TTL_SECONDS)

    def _build(self, request):
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        from django.utils import timezone
        from django.db.models import Prefetch
        import uuid

        # Serve cached bytes if we have them. Saves the 9-15s WeasyPrint
        # render on every subsequent request.
        cached = self._cached_pdf()
        if cached:
            response = HttpResponse(cached, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="Taqon-Electrico-Packages-Catalogue.pdf"'
            self._track(request, len(cached), True, cache_hit=True)
            return response

        # Single, efficient query: families with their active packages
        # already filtered & ordered, and each package's BoM items
        # prefetched. Replaces an N+1 of ~30 queries.
        active_pkg_qs = (
            SolarPackageTemplate.objects
            .filter(is_active=True, is_deleted=False)
            .order_by('price')
            .prefetch_related(Prefetch('items', queryset=PackageComponent.objects.select_related('component')))
        )
        family_qs = (
            PackageFamily.objects
            .filter(is_active=True, is_deleted=False)
            .order_by('kva_rating')
            .prefetch_related(Prefetch('packages', queryset=active_pkg_qs, to_attr='active_pkgs'))
        )

        families = []
        try:
            for f in family_qs:
                variants = []
                inverter_brand = ''
                for p in f.active_pkgs:
                    try:
                        items = list(p.items.all()) if hasattr(p, 'items') else []
                    except Exception:
                        items = []
                    inv_items = [i for i in items if i.component and i.component.category == 'inverter']
                    bat_items = [i for i in items if i.component and i.component.category == 'battery']
                    pan_items = [i for i in items if i.component and i.component.category == 'panel']

                    inv_label = ''
                    try:
                        if inv_items:
                            c = inv_items[0].component
                            inv_label = ' '.join(filter(None, [c.brand or '', c.name or ''])).strip()
                            if not inverter_brand and c.brand:
                                inverter_brand = c.brand
                    except Exception:
                        pass

                    bat_label = ''
                    try:
                        if bat_items:
                            total_kwh = float(sum(
                                float(i.component.capacity_kwh or 0) * (i.quantity or 0)
                                for i in bat_items
                            ))
                            if total_kwh > 0:
                                bat_label = f'{total_kwh:g} kWh'
                            else:
                                bat_label = bat_items[0].component.name or ''
                    except Exception:
                        pass

                    pan_label = ''
                    try:
                        if pan_items:
                            total_panels = sum((i.quantity or 0) for i in pan_items)
                            watt = pan_items[0].component.wattage if pan_items[0].component else None
                            if total_panels and watt:
                                pan_label = f'{total_panels} × {watt} W'
                            elif total_panels:
                                pan_label = f'{total_panels} panels'
                    except Exception:
                        pass

                    # Format price as 'USD 3,115' — the catalogue is a
                    # marketing doc so we round to the dollar.
                    price_str = ''
                    try:
                        if p.price is not None:
                            price_str = f'USD {int(round(float(p.price))):,}'
                    except Exception:
                        pass

                    variants.append({
                        'name': p.name,
                        'inverter_kva': str(p.inverter_kva).rstrip('0').rstrip('.') if p.inverter_kva else '',
                        'inverter_label': inv_label,
                        'battery_label': bat_label,
                        'panel_label': pan_label,
                        'battery_kwh': str(p.battery_capacity_kwh) if p.battery_capacity_kwh else '',
                        'panel_count': p.panel_count or '',
                        'phase': p.phase or '',
                        'tier': p.tier or '',
                        'price': price_str,
                    })

                families.append({
                    'name': f.name,
                    'kva': str(f.kva_rating).rstrip('0').rstrip('.') if f.kva_rating else '',
                    'short_description': f.short_description or '',
                    'description': f.description or '',
                    'suitable_for': ', '.join(f.suitable_for) if isinstance(f.suitable_for, list) else (f.suitable_for or ''),
                    'inverter_brand': inverter_brand,
                    'variants': variants,
                    'variant_count': len(variants),
                })
        except Exception:
            logger.exception('PackagesCatalogue: family lookup failed — catalogue will render with empty families')

        ref_number = f'CAT-{timezone.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'
        total_variants = sum(f.get('variant_count', 0) for f in families)

        context = {
            'generated_date': timezone.now().strftime('%d %B %Y'),
            'ref_number': ref_number,
            'year': timezone.now().strftime('%Y'),
            'families': families,
            'total_variants': total_variants,
            'company': {
                'name': 'TAQON ELECTRICO',
                'tagline': 'Customer is King!',
                'address': '203 Sherwood Drive, Strathaven, Harare',
                'phone': '+263 77 277 1036',
                'email': 'info@taqon.co.zw',
                'website': 'www.taqon.co.zw',
            },
        }

        try:
            from apps.documents.catalogue import build_catalogue_pdf
            pdf_bytes = build_catalogue_pdf(
                families=families,
                ref_number=ref_number,
                generated_date=context['generated_date'],
                family_count=len(families),
                variant_count=total_variants,
            )
            is_pdf = pdf_bytes[:4] == b'%PDF'
        except Exception:
            logger.exception('ReportLab catalogue build failed — falling back to HTML pipeline')
            html_string = render_to_string('pdfs/packages_catalogue.html', context)
            from apps.quotations.pdf import _render_pdf
            pdf_bytes = _render_pdf(html_string)
            is_pdf = pdf_bytes[:4] == b'%PDF'
        content_type = 'application/pdf' if is_pdf else 'text/html'
        ext = 'pdf' if is_pdf else 'html'

        # Cache only successful PDFs so a transient render failure
        # doesn't get baked in for 15 minutes.
        if is_pdf:
            self._set_cached_pdf(pdf_bytes)

        response = HttpResponse(pdf_bytes, content_type=content_type)
        response['Content-Disposition'] = (
            f'attachment; filename="Taqon-Electrico-Packages-Catalogue.{ext}"'
        )

        self._track(
            request, len(pdf_bytes), is_pdf,
            metadata={
                'ref_number': ref_number,
                'family_count': len(families),
                'variant_count': total_variants,
            },
            failure_reason='' if is_pdf else 'renderer fell back to HTML',
        )
        return response

    def _track(self, request, size, success, metadata=None, failure_reason='', cache_hit=False):
        from apps.downloads.services import record_download
        md = dict(metadata or {})
        md['cache_hit'] = cache_hit
        record_download(
            request,
            kind='packages_catalogue',
            surface=request.GET.get('source', 'packages_page'),
            target_slug='packages-catalogue',
            target_label='Taqon Electrico Packages Catalogue',
            file_size_bytes=size,
            success=success,
            failure_reason=failure_reason,
            metadata=md,
        )


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
    """Admin: list all appliances. Supports search, category and active filters."""
    permission_classes = [IsAdmin]
    serializer_class = ApplianceSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        from django.db.models import Q
        qs = Appliance.objects.filter(is_deleted=False)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(description__icontains=search)
            )

        category = self.request.query_params.get('category', '').strip()
        if category:
            qs = qs.filter(category=category)

        is_active = self.request.query_params.get('is_active', '').strip().lower()
        if is_active in ('true', '1', 'yes'):
            qs = qs.filter(is_active=True)
        elif is_active in ('false', '0', 'no'):
            qs = qs.filter(is_active=False)

        smart_load = self.request.query_params.get('smart_load_eligible', '').strip().lower()
        if smart_load in ('true', '1', 'yes'):
            qs = qs.filter(smart_load_eligible=True)
        elif smart_load in ('false', '0', 'no'):
            qs = qs.filter(smart_load_eligible=False)

        ordering = self.request.query_params.get('ordering', 'sort_order').strip()
        allowed = {
            'sort_order', '-sort_order', 'name', '-name', 'category', '-category',
            'typical_wattage', '-typical_wattage',
            'power_points', '-power_points', 'energy_points', '-energy_points',
            'created_at', '-created_at',
        }
        if ordering in allowed:
            qs = qs.order_by(ordering, 'name')
        else:
            qs = qs.order_by('sort_order', 'name')

        return qs


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


# ── Admin Package Items (Components within a Package) ──

class AdminPackageItemsView(APIView):
    """Admin: list and add components to a package."""
    permission_classes = [IsAdmin]

    def _get_package(self, slug):
        try:
            return SolarPackageTemplate.objects.prefetch_related(
                Prefetch('items', queryset=PackageComponent.objects.select_related('component'))
            ).get(slug=slug, is_deleted=False)
        except SolarPackageTemplate.DoesNotExist:
            return None

    def get(self, request, slug):
        pkg = self._get_package(slug)
        if not pkg:
            return Response({'detail': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PackageComponentSerializer(pkg.items.all(), many=True).data)

    def post(self, request, slug):
        """Add a component to the package (or update quantity if it already exists)."""
        pkg = self._get_package(slug)
        if not pkg:
            return Response({'detail': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminPackageItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        component_id = serializer.validated_data['component_id']
        quantity = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')

        try:
            component = SolarComponent.objects.get(pk=component_id, is_deleted=False)
        except SolarComponent.DoesNotExist:
            return Response({'detail': 'Component not found.'}, status=status.HTTP_404_NOT_FOUND)

        item, created = PackageComponent.objects.update_or_create(
            package=pkg,
            component=component,
            defaults={'quantity': quantity, 'notes': notes},
        )
        pkg.recalculate_price()
        return Response(
            PackageComponentSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class AdminPackageItemDetailView(APIView):
    """Admin: update or remove a specific component from a package."""
    permission_classes = [IsAdmin]

    def patch(self, request, slug, item_id):
        """Update quantity or swap component."""
        try:
            item = PackageComponent.objects.select_related('package', 'component').get(
                pk=item_id,
                package__slug=slug,
                package__is_deleted=False,
            )
        except PackageComponent.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        quantity = request.data.get('quantity')
        notes = request.data.get('notes')
        new_component_id = request.data.get('component_id')

        if quantity is not None:
            if int(quantity) < 1:
                return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = int(quantity)

        if notes is not None:
            item.notes = notes

        if new_component_id:
            try:
                new_component = SolarComponent.objects.get(pk=new_component_id, is_deleted=False)
            except SolarComponent.DoesNotExist:
                return Response({'detail': 'Component not found.'}, status=status.HTTP_404_NOT_FOUND)
            # Check for duplicate
            if PackageComponent.objects.filter(package=item.package, component=new_component).exclude(pk=item.pk).exists():
                return Response({'detail': 'This component is already in the package.'}, status=status.HTTP_400_BAD_REQUEST)
            item.component = new_component

        item.save()
        item.package.recalculate_price()
        return Response(PackageComponentSerializer(item).data)

    def delete(self, request, slug, item_id):
        """Remove a component from the package."""
        try:
            item = PackageComponent.objects.select_related('package').get(
                pk=item_id,
                package__slug=slug,
                package__is_deleted=False,
            )
        except PackageComponent.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

        pkg = item.package
        item.delete()
        pkg.recalculate_price()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPackageRecalculateView(APIView):
    """Admin: force recalculate a package's price."""
    permission_classes = [IsAdmin]

    def post(self, request, slug):
        try:
            pkg = SolarPackageTemplate.objects.get(slug=slug, is_deleted=False)
        except SolarPackageTemplate.DoesNotExist:
            return Response({'detail': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)

        distance_km = request.data.get('distance_km')
        pkg.recalculate_price(distance_km=distance_km)
        return Response({
            'price': str(pkg.price),
            'material_cost': str(pkg.material_cost),
            'sundries_cost': str(pkg.sundries_cost),
            'labour_cost': str(pkg.labour_cost),
            'transport_cost': str(pkg.transport_cost),
        })


# ── Admin: Instant Quotes & Advisor Sessions ──

class AdminInstantQuotesView(generics.ListAPIView):
    """Admin: list all instant quote downloads."""
    permission_classes = [IsAdmin]
    serializer_class = InstantQuoteDownloadSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = InstantQuoteDownload.objects.all()
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(customer_email__icontains=search) |
                Q(package_name__icontains=search)
            )
        tier = self.request.query_params.get('tier')
        if tier:
            qs = qs.filter(tier_label__icontains=tier)
        return qs


class AdminInstantQuoteDetailView(generics.RetrieveAPIView):
    """Admin: retrieve full details for a single instant quote, including
    the appliances list (if the quote was downloaded from Solar Advisor)."""
    permission_classes = [IsAdmin]
    serializer_class = InstantQuoteDownloadDetailSerializer
    queryset = InstantQuoteDownload.objects.select_related('session').all()


class AdminAdvisorSessionsView(generics.ListAPIView):
    """Admin: list all Solar Advisor recommendation sessions."""
    permission_classes = [IsAdmin]
    serializer_class = RecommendationSessionSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return RecommendationSession.objects.all()


class AdminAdvisorSessionDetailView(generics.RetrieveAPIView):
    """Admin: retrieve full details for a single advisor session."""
    permission_classes = [IsAdmin]
    serializer_class = RecommendationSessionSerializer
    queryset = RecommendationSession.objects.all()
