from decimal import Decimal

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.utils import generate_unique_slug


class PackageFamily(SoftDeleteModel):
    """
    Groups solar package variants into families.
    E.g. "Home Luxury 5kVA" family may have V1.0, V2.1, Performance variants.
    """

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    kva_rating = models.DecimalField(max_digits=6, decimal_places=1, help_text='kVA rating (e.g. 3.0, 5.0, 8.0)')
    family_code = models.CharField(max_length=20, unique=True, help_text='e.g. "3kva", "5kva", "8kva"')
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    image_url = models.URLField(blank=True)
    suitable_for = models.JSONField(default=list, blank=True, help_text='e.g. ["residential", "small_business"]')
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'kva_rating']
        verbose_name_plural = 'Package Families'

    def __str__(self):
        return f"{self.name} ({self.kva_rating} kVA)"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(PackageFamily, self.name)
        super().save(*args, **kwargs)


class Appliance(SoftDeleteModel):
    """
    A household/commercial appliance with PP/EP scoring for the recommendation engine.
    ~90 appliances seeded from the PDF reference data.
    """

    CATEGORY_CHOICES = [
        ('lounge', 'Lounge'),
        ('kitchen', 'Kitchen'),
        ('bedroom', 'Bedroom'),
        ('bathroom', 'Bathroom'),
        ('laundry', 'Laundry'),
        ('office', 'Office'),
        ('garage', 'Garage & Workshop'),
        ('outdoor', 'Outdoor'),
        ('security', 'Security'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    icon_name = models.CharField(max_length=50, blank=True, help_text='Phosphor icon name for frontend')
    typical_wattage = models.PositiveIntegerField(default=0, help_text='Typical wattage draw')
    power_points = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='PP score')
    energy_points = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='EP score')
    concurrency_factor = models.DecimalField(max_digits=3, decimal_places=2, default=1, help_text='Concurrency factor (0-1)')
    night_use_factor = models.DecimalField(max_digits=3, decimal_places=2, default=0, help_text='Night use factor (0-1)')
    smart_load_eligible = models.BooleanField(default=False, help_text='Can be deferred/scheduled')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['category', 'sort_order', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.typical_wattage}W, PP:{self.power_points}, EP:{self.energy_points})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Appliance, self.name)
        super().save(*args, **kwargs)


class SolarComponent(SoftDeleteModel):
    """
    A solar component that can be used in system configurations.
    Covers panels, inverters, batteries, and accessories.
    """

    CATEGORY_CHOICES = [
        ('panel', 'Solar Panel'),
        ('inverter', 'Inverter'),
        ('battery', 'Battery'),
        ('charger', 'Charge Controller'),
        ('mounting', 'Mounting Structure'),
        ('cable', 'Cable & Wiring'),
        ('accessory', 'Accessory'),
    ]

    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    brand = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')

    # Linked shop product (optional)
    product = models.ForeignKey(
        'shop.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='solar_components',
    )

    # Technical specifications (flexible JSON)
    specifications = models.JSONField(default=dict, blank=True)

    # Key specs as dedicated fields for filtering/sorting
    wattage = models.PositiveIntegerField(default=0, help_text='Watts (panels: peak watts, inverters: VA rating)')
    voltage = models.DecimalField(max_digits=6, decimal_places=1, default=0, help_text='Nominal voltage')
    capacity_ah = models.DecimalField(max_digits=8, decimal_places=1, default=0, help_text='Battery capacity in Ah')
    capacity_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text='Battery capacity in kWh')
    efficiency = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Efficiency percentage')
    warranty_years = models.PositiveIntegerField(default=0)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=1, default=0)

    # Compatibility
    compatible_voltages = models.JSONField(
        default=list, blank=True,
        help_text='List of compatible system voltages [12, 24, 48]',
    )

    # Shop visibility — only panels/inverters/batteries visible in shop
    shop_visible = models.BooleanField(default=False, db_index=True, help_text='Visible in the shop frontend')

    # Idempotent seeding key
    xlsx_row_key = models.CharField(max_length=200, blank=True, db_index=True, help_text='Key for XLSX seeding')

    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'category', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['wattage']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(SolarComponent, self.name)
        super().save(*args, **kwargs)


class SolarPackageTemplate(SoftDeleteModel):
    """
    Pre-configured solar packages (e.g., Home Quick Access, Home Luxury).
    Consists of a set of components with quantities.
    """

    TIER_CHOICES = [
        ('starter', 'Starter'),
        ('popular', 'Popular'),
        ('premium', 'Premium'),
        ('commercial', 'Commercial'),
    ]

    PHASE_CHOICES = [
        ('1P', 'Single Phase'),
        ('3P', 'Three Phase'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='starter')
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    image_url = models.URLField(blank=True)

    # Family grouping
    family = models.ForeignKey(
        PackageFamily, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='packages',
    )
    variant_name = models.CharField(max_length=100, blank=True, help_text='e.g. "V1.0", "V2.1", "Performance"')

    # System specs
    system_size_kw = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    inverter_rating_va = models.PositiveIntegerField(default=0, help_text='Inverter VA rating')
    inverter_kva = models.DecimalField(max_digits=6, decimal_places=1, default=0, help_text='Inverter kVA rating')
    battery_capacity_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_daily_output_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    backup_hours = models.DecimalField(max_digits=5, decimal_places=1, default=0, help_text='Estimated backup hours at average load')
    panel_count = models.PositiveIntegerField(default=0)
    phase = models.CharField(max_length=5, choices=PHASE_CHOICES, default='1P')

    # Pricing — dynamic breakdown
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    material_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sundries_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    distance_km = models.DecimalField(max_digits=8, decimal_places=1, default=10)

    # Features list (for marketing display)
    features = models.JSONField(default=list, blank=True)

    # Suitable for
    suitable_for = models.JSONField(
        default=list, blank=True,
        help_text='e.g., ["residential", "small_business"]',
    )

    # Capability bands (for recommendation engine v2)
    variant_code = models.CharField(max_length=10, blank=True, db_index=True, help_text='e.g. HE-1, HL-1')
    pp_min = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Minimum PP this package serves')
    pp_max = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Maximum PP this package serves')
    ep_min = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Minimum EP this package serves')
    ep_max = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Maximum EP this package serves')
    smart_load_supported = models.BooleanField(default=False, help_text='Inverter supports smart load scheduling')
    inverter_brand = models.CharField(max_length=50, blank=True, help_text='must, growatt, sunsynk')

    RECHARGE_CHOICES = [
        ('basic', 'Basic'), ('moderate', 'Moderate'), ('balanced', 'Balanced'),
        ('strong', 'Strong'), ('premium', 'Premium'),
    ]
    COMFORT_CHOICES = [
        ('budget', 'Budget'), ('balanced', 'Balanced'), ('premium', 'Premium'),
    ]
    MGMT_CHOICES = [
        ('high', 'High'), ('medium', 'Medium'), ('low', 'Low'),
    ]
    recharge_class = models.CharField(max_length=20, choices=RECHARGE_CHOICES, default='moderate')
    comfort_class = models.CharField(max_length=20, choices=COMFORT_CHOICES, default='balanced')
    management_tolerance = models.CharField(max_length=20, choices=MGMT_CHOICES, default='medium')

    is_active = models.BooleanField(default=True, db_index=True)
    is_popular = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'price']

    def __str__(self):
        return f"{self.name} ({self.tier})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(SolarPackageTemplate, self.name)
        super().save(*args, **kwargs)

    def recalculate_price(self, distance_km=None):
        """
        Recalculate price AND spec aggregates from the current component items.
        Price = material + sundries(0.5%) + labour(8%) + transport($0.65/km).
        Specs (battery kWh, panel count, system kW) are also summed from
        the actual component items so stored values never drift from reality.
        """
        from .engine.constants import PRICING

        if distance_km is not None:
            self.distance_km = Decimal(str(distance_km))

        items = list(self.items.select_related('component').all())

        # Pricing
        material = sum((item.component.price * item.quantity for item in items), Decimal('0'))
        sundries = material * PRICING['sundries_rate']
        labour = (material + sundries) * PRICING['labour_rate']
        transport = self.distance_km * PRICING['transport_per_km']

        self.material_cost = material
        self.sundries_cost = sundries
        self.labour_cost = labour
        self.transport_cost = transport
        self.price = material + labour + transport

        # Spec aggregates from components
        battery_kwh = sum(
            ((item.component.capacity_kwh or Decimal('0')) * item.quantity for item in items if item.component.category == 'battery'),
            Decimal('0'),
        )
        panel_count = sum(
            (item.quantity for item in items if item.component.category == 'panel'),
            0,
        )
        panel_watts = sum(
            ((item.component.wattage or 0) * item.quantity for item in items if item.component.category == 'panel'),
            0,
        )

        self.battery_capacity_kwh = battery_kwh
        self.panel_count = panel_count
        # Only overwrite system_size_kw if we have real panel wattage data
        if panel_watts > 0:
            self.system_size_kw = Decimal(str(panel_watts)) / Decimal('1000')

        update_fields = [
            'material_cost', 'sundries_cost', 'labour_cost',
            'transport_cost', 'distance_km', 'price',
            'battery_capacity_kwh', 'panel_count', 'updated_at',
        ]
        if panel_watts > 0:
            update_fields.append('system_size_kw')

        self.save(update_fields=update_fields)


class PackageComponent(TimeStampedModel):
    """A component within a package template, with quantity."""

    package = models.ForeignKey(SolarPackageTemplate, on_delete=models.CASCADE, related_name='items')
    component = models.ForeignKey(SolarComponent, on_delete=models.CASCADE, related_name='package_uses')
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ['package', 'component']
        ordering = ['component__category', 'component__sort_order']

    def __str__(self):
        return f"{self.component.name} x{self.quantity} in {self.package.name}"

    @property
    def line_total(self):
        return self.component.price * self.quantity


class SolarConfiguration(TimeStampedModel):
    """
    A user's saved solar system configuration (custom build).
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('saved', 'Saved'),
        ('quoted', 'Converted to Quote'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='solar_configurations',
    )
    name = models.CharField(max_length=200, default='My Solar System')
    description = models.TextField(blank=True)

    # Based on a template (optional)
    based_on_template = models.ForeignKey(
        SolarPackageTemplate, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='derived_configs',
    )

    # Calculated totals (updated on save)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_wattage = models.PositiveIntegerField(default=0, help_text='Total panel wattage')
    system_voltage = models.PositiveIntegerField(default=48, help_text='System voltage (12/24/48)')
    estimated_daily_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_backup_hours = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    battery_capacity_kwh = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Compatibility flags
    has_warnings = models.BooleanField(default=False)
    warnings = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} - {self.user.email}"

    def recalculate(self):
        """Recalculate system specs from components."""
        items = list(self.items.select_related('component').all())

        total_price = 0
        total_panel_watts = 0
        total_battery_kwh = 0
        inverter_va = 0
        warnings = []

        for item in items:
            comp = item.component
            total_price += comp.price * item.quantity

            if comp.category == 'panel':
                total_panel_watts += comp.wattage * item.quantity
            elif comp.category == 'battery':
                total_battery_kwh += float(comp.capacity_kwh) * item.quantity
            elif comp.category == 'inverter':
                inverter_va = max(inverter_va, comp.wattage)

        # Check panel-to-inverter ratio
        if inverter_va > 0 and total_panel_watts > inverter_va * 1.5:
            warnings.append('Panel wattage exceeds 150% of inverter capacity. Consider a larger inverter.')

        if total_panel_watts > 0 and inverter_va == 0:
            warnings.append('No inverter selected. An inverter is required to convert DC to AC power.')

        if total_battery_kwh == 0 and total_panel_watts > 0:
            warnings.append('No battery selected. Batteries are recommended for backup power.')

        # Estimated daily output (Zimbabwe avg 5.5 peak sun hours, 80% system efficiency)
        daily_kwh = round(total_panel_watts * 5.5 * 0.80 / 1000, 2)

        # Backup hours (assuming 50% average load of inverter rating)
        avg_load_kw = (inverter_va * 0.5 / 1000) if inverter_va else 0
        backup_hours = round(total_battery_kwh / avg_load_kw, 1) if avg_load_kw > 0 else 0

        self.total_price = total_price
        self.total_wattage = total_panel_watts
        self.estimated_daily_kwh = daily_kwh
        self.battery_capacity_kwh = total_battery_kwh
        self.estimated_backup_hours = backup_hours
        self.warnings = warnings
        self.has_warnings = len(warnings) > 0
        self.save(update_fields=[
            'total_price', 'total_wattage', 'estimated_daily_kwh',
            'battery_capacity_kwh', 'estimated_backup_hours',
            'warnings', 'has_warnings', 'updated_at',
        ])


class ConfigurationItem(TimeStampedModel):
    """A component in a user's configuration, with quantity."""

    configuration = models.ForeignKey(SolarConfiguration, on_delete=models.CASCADE, related_name='items')
    component = models.ForeignKey(SolarComponent, on_delete=models.CASCADE, related_name='config_uses')
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ['configuration', 'component']
        ordering = ['component__category', 'component__sort_order']

    def __str__(self):
        return f"{self.component.name} x{self.quantity}"

    @property
    def line_total(self):
        return self.component.price * self.quantity


class InstantQuoteDownload(TimeStampedModel):
    """Tracks every instant quote PDF downloaded from the Solar Advisor
    or from a package detail page."""

    package = models.ForeignKey(
        SolarPackageTemplate, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='quote_downloads',
    )
    package_name = models.CharField(max_length=200)
    tier_label = models.CharField(max_length=50, blank=True)
    distance_km = models.DecimalField(max_digits=8, decimal_places=1, default=10)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=30, blank=True)
    customer_address = models.CharField(max_length=300, blank=True)

    # Link to the Solar Advisor session — null if downloaded from package
    # detail page (where no appliances were selected).
    session = models.ForeignKey(
        'RecommendationSession', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='quote_downloads',
    )

    # Snapshot of appliances at quote time — duplicated from session so the
    # record is self-contained even if the session is deleted later.
    # Format: [{"id": uuid, "name": str, "quantity": int, "category": str}]
    appliances = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.customer_name} — {self.package_name} ({self.tier_label})'


class RecommendationSession(TimeStampedModel):
    """Tracks each Solar Advisor recommendation request."""

    total_pp = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_ep = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    distance_km = models.DecimalField(max_digits=8, decimal_places=1, default=10)
    appliance_count = models.PositiveIntegerField(default=0)

    budget_package = models.CharField(max_length=200, blank=True)
    good_fit_package = models.CharField(max_length=200, blank=True)
    excellent_package = models.CharField(max_length=200, blank=True)

    priority = models.CharField(max_length=30, blank=True)
    use_style = models.CharField(max_length=30, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)

    # Full appliance selections at time of recommendation
    # Format: [{"id": uuid, "name": str, "quantity": int, "category": str, "pp": float, "ep": float}]
    appliances = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Session PP={self.total_pp} EP={self.total_ep} ({self.created_at:%Y-%m-%d %H:%M})'
