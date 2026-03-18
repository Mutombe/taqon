"""
Management command to seed blog posts from the frontend's blogData.js data.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


BLOG_DATA = [
    {
        'category': {'name': 'Education', 'slug': 'education'},
        'title': 'Understanding Solar Panel Efficiency: What the Numbers Mean',
        'slug': 'understanding-solar-panel-efficiency',
        'excerpt': (
            'When shopping for solar panels, you\'ll encounter efficiency ratings ranging '
            'from 15% to over 22%. But what do these numbers actually mean for your home?'
        ),
        'content': (
            '<h2>What is Solar Panel Efficiency?</h2>'
            '<p>Solar panel efficiency refers to the percentage of sunlight that a solar panel '
            'can convert into usable electricity. A panel with 20% efficiency means that 20% of '
            'the sunlight hitting its surface is converted to electrical energy.</p>'
            '<h2>Why Efficiency Matters</h2>'
            '<p>Higher efficiency panels produce more power per square meter of surface area. '
            'This is especially important in Zimbabwe where roof space may be limited. '
            'A high-efficiency panel can generate the same amount of power in a smaller footprint.</p>'
            '<h2>Monocrystalline vs Polycrystalline</h2>'
            '<p>Monocrystalline panels (made from single-crystal silicon) typically achieve '
            '18-22% efficiency, while polycrystalline panels (made from multiple silicon fragments) '
            'achieve 15-17%. The difference in cost is generally worth it for residential installations.</p>'
            '<h2>Real-World Performance</h2>'
            '<p>In Zimbabwe\'s climate, with an average of 5.5 peak sun hours per day, a 400W panel '
            'at 20% efficiency will produce approximately 2.2 kWh per day under ideal conditions. '
            'Dust, shading, and temperature can reduce this by 10-20%.</p>'
        ),
        'tags': ['solar panels', 'efficiency', 'education', 'technology'],
        'image_url': '/blog/solar-efficiency.jpg',
        'read_time': '5 min read',
        'is_published': True,
    },
    {
        'category': {'name': 'Technology', 'slug': 'technology'},
        'title': 'Lithium vs Lead-Acid Batteries: Which is Right for Your Solar System?',
        'slug': 'lithium-vs-lead-acid-batteries',
        'excerpt': (
            'Battery storage is the backbone of any off-grid or hybrid solar system. '
            'Choosing between lithium and lead-acid batteries can significantly impact '
            'your system\'s performance and long-term costs.'
        ),
        'content': (
            '<h2>Lead-Acid Batteries</h2>'
            '<p>Lead-acid batteries have been used for over 150 years and remain the most '
            'affordable option for solar storage. They come in flooded (FLA), absorbed glass '
            'mat (AGM), and gel variants.</p>'
            '<p><strong>Pros:</strong> Lower upfront cost, widely available, proven technology. '
            '<strong>Cons:</strong> Heavier, shorter lifespan (3-5 years), require regular '
            'maintenance, and should not be discharged below 50%.</p>'
            '<h2>Lithium Iron Phosphate (LiFePO4) Batteries</h2>'
            '<p>LiFePO4 batteries represent the gold standard for modern solar storage systems. '
            'They offer superior performance across virtually every metric.</p>'
            '<p><strong>Pros:</strong> Longer lifespan (10-15 years), 95%+ efficiency, '
            'can be discharged to 80-100%, lightweight, no maintenance required. '
            '<strong>Cons:</strong> Higher upfront cost (2-3x lead-acid).</p>'
            '<h2>Total Cost of Ownership</h2>'
            '<p>Despite the higher upfront cost, lithium batteries typically offer better '
            'value over a 10-year period. A lithium battery bank may cost $3,000 compared '
            'to $1,000 for lead-acid, but you\'ll replace the lead-acid bank 2-3 times '
            'in that same period.</p>'
        ),
        'tags': ['batteries', 'lithium', 'lead-acid', 'solar storage', 'technology'],
        'image_url': '/blog/battery-comparison.jpg',
        'read_time': '7 min read',
        'is_published': True,
    },
    {
        'category': {'name': 'Guide', 'slug': 'guide'},
        'title': 'The Complete Guide to Sizing Your Solar System for Zimbabwe',
        'slug': 'sizing-solar-system-zimbabwe',
        'excerpt': (
            'Sizing a solar system correctly ensures you have enough power without '
            'overspending. This guide walks you through calculating your energy needs '
            'and selecting the right components for Zimbabwean conditions.'
        ),
        'content': (
            '<h2>Step 1: Calculate Your Energy Consumption</h2>'
            '<p>Start by listing all your electrical appliances and their wattage ratings. '
            'Multiply each appliance\'s wattage by the hours per day you use it to get '
            'daily watt-hours (Wh). Add all appliances together to get your total daily '
            'energy consumption.</p>'
            '<p>Example: Refrigerator (150W x 24h x 0.33 duty cycle = 1,188 Wh), '
            'LED lights (20W x 6h = 120 Wh), TV (100W x 4h = 400 Wh). '
            'Total: approximately 1,708 Wh per day.</p>'
            '<h2>Step 2: Account for Zimbabwe\'s Solar Resource</h2>'
            '<p>Zimbabwe enjoys excellent solar resources, averaging 5.5 peak sun hours '
            'per day across most of the country. Bulawayo and Masvingo receive slightly '
            'more, while the Eastern Highlands receive slightly less.</p>'
            '<h2>Step 3: Calculate Panel Requirements</h2>'
            '<p>Divide your daily energy consumption by the peak sun hours and add a '
            '25% safety factor: 1,708 Wh ÷ 5.5 hours × 1.25 = 388W of panels. '
            'Round up to the nearest standard size — in this case, a single 400W panel.</p>'
            '<h2>Step 4: Size Your Battery Bank</h2>'
            '<p>For a typical off-grid system with 1-2 days of autonomy: '
            '1,708 Wh × 2 days ÷ 0.85 (efficiency) = 4,018 Wh of usable capacity. '
            'For lithium batteries at 80% depth of discharge: 4,018 ÷ 0.80 = 5,022 Wh '
            '≈ two 100Ah 24V batteries.</p>'
            '<h2>Step 5: Select Your Inverter</h2>'
            '<p>Your inverter should handle your peak load (all appliances running simultaneously) '
            'plus a 25% safety margin. For our example, assume a peak load of 800W: '
            '800W × 1.25 = 1,000VA minimum inverter size.</p>'
        ),
        'tags': ['sizing', 'guide', 'zimbabwe', 'solar system', 'how-to'],
        'image_url': '/blog/solar-sizing-guide.jpg',
        'read_time': '10 min read',
        'is_published': True,
    },
    {
        'category': {'name': 'Maintenance', 'slug': 'maintenance'},
        'title': 'Solar Panel Maintenance: Keeping Your System at Peak Performance',
        'slug': 'solar-panel-maintenance-guide',
        'excerpt': (
            'Solar panels require minimal maintenance, but regular cleaning and '
            'inspection can increase energy output by up to 25%. Here\'s your '
            'complete maintenance checklist.'
        ),
        'content': (
            '<h2>How Often Should You Clean Solar Panels?</h2>'
            '<p>In Zimbabwe\'s dry season (May-October), dust accumulation on panels '
            'is the biggest performance killer. We recommend cleaning panels every '
            '4-6 weeks during the dry season and after heavy dust storms. '
            'During the rainy season, natural rainfall usually keeps panels clean.</p>'
            '<h2>Safe Cleaning Procedure</h2>'
            '<p>1. Clean panels early morning or evening when they\'re cool — '
            'never clean hot panels as thermal shock can cause micro-cracks. '
            '2. Use clean, soft water (avoid hard water which leaves mineral deposits). '
            '3. Use a soft cloth or sponge — never abrasive materials. '
            '4. If using cleaning agents, use pH-neutral soap only. '
            '5. For ground-mounted arrays, a garden hose usually suffices.</p>'
            '<h2>Annual Inspection Checklist</h2>'
            '<p>Have a qualified electrician inspect your system annually: '
            'Check all electrical connections for corrosion or loosening, '
            'inspect mounting hardware for rust or mechanical stress, '
            'review inverter error logs, test battery health and capacity, '
            'clean battery terminals and check electrolyte levels (lead-acid only).</p>'
            '<h2>Warning Signs to Watch For</h2>'
            '<p>Contact a technician if you notice: hotspots on panels (visible as '
            'discoloration), drop in daily production greater than 20%, '
            'frequent inverter faults, battery not holding charge as long as usual.</p>'
        ),
        'tags': ['maintenance', 'cleaning', 'performance', 'solar panels', 'tips'],
        'image_url': '/blog/solar-maintenance.jpg',
        'read_time': '6 min read',
        'is_published': True,
    },
    {
        'category': {'name': 'News', 'slug': 'news'},
        'title': 'Zimbabwe\'s Solar Revolution: How Renewable Energy is Powering Growth',
        'slug': 'zimbabwe-solar-revolution-2024',
        'excerpt': (
            'Zimbabwe is experiencing a solar energy revolution. With ZESA load-shedding '
            'pushing businesses and homeowners to seek alternatives, solar adoption has '
            'surged by over 300% in the past three years.'
        ),
        'content': (
            '<h2>The State of Solar in Zimbabwe</h2>'
            '<p>Zimbabwe currently has an installed capacity gap of approximately 1,000 MW, '
            'leading to load-shedding that can exceed 18 hours per day in some areas. '
            'This crisis has catalysed a rapid adoption of solar energy across all sectors.</p>'
            '<h2>Government Initiatives</h2>'
            '<p>The Government of Zimbabwe has introduced several incentives to encourage '
            'solar adoption: import duty exemptions on solar equipment, accelerated '
            'depreciation for businesses investing in solar, and the Net Metering '
            'Regulations 2020 which allow grid-connected solar owners to sell excess '
            'energy back to ZESA.</p>'
            '<h2>The Business Case</h2>'
            '<p>For businesses, the economics are compelling. A commercial solar system '
            'with a payback period of 3-4 years is now commonplace. Many businesses '
            'report reducing their energy costs by 60-80% after installing solar, '
            'while also gaining reliable power that supports productivity.</p>'
            '<h2>Residential Adoption</h2>'
            '<p>Residential solar installations have grown from approximately 5,000 in 2021 '
            'to an estimated 20,000+ by end of 2024. The average home solar system in '
            'Zimbabwe is a 3-5 kW hybrid system with 5-10 kWh of battery storage, '
            'costing between $3,000-$8,000.</p>'
            '<h2>Looking Ahead</h2>'
            '<p>With falling equipment costs, improving financing options, and the ongoing '
            'grid crisis, Zimbabwe\'s solar sector is set for continued rapid growth. '
            'Taqon Electrico is proud to be part of this revolution, bringing affordable '
            'solar solutions to Zimbabwean homes and businesses.</p>'
        ),
        'tags': ['zimbabwe', 'solar energy', 'renewable energy', 'news', 'growth'],
        'image_url': '/blog/zimbabwe-solar-revolution.jpg',
        'read_time': '8 min read',
        'is_published': True,
    },
    {
        'category': {'name': 'Tips', 'slug': 'tips'},
        'title': '10 Ways to Maximise the ROI on Your Solar Investment',
        'slug': 'maximise-solar-investment-roi',
        'excerpt': (
            'A solar installation is a significant investment. These 10 practical tips '
            'will help you get the maximum return on your investment through smart '
            'usage, maintenance, and optimization.'
        ),
        'content': (
            '<h2>1. Shift High-Consumption Tasks to Peak Solar Hours</h2>'
            '<p>Run your washing machine, dishwasher, and pool pump between 10am and 3pm '
            'when your solar generation is at its peak. This maximises direct solar consumption '
            'and reduces reliance on battery storage.</p>'
            '<h2>2. Use Smart Energy Monitoring</h2>'
            '<p>Invest in an energy monitoring system to track your production and consumption '
            'in real-time. Understanding your energy patterns helps you make smarter decisions '
            'about when to run appliances.</p>'
            '<h2>3. Keep Panels Clean</h2>'
            '<p>As discussed in our maintenance guide, clean panels produce up to 25% more '
            'energy than dirty ones. Regular cleaning is the easiest way to boost your ROI.</p>'
            '<h2>4. Optimise Your Battery Depth of Discharge</h2>'
            '<p>For lithium batteries, keeping discharge between 20-80% (rather than 0-100%) '
            'can more than double the battery lifespan, significantly improving long-term ROI.</p>'
            '<h2>5. Reduce Phantom Loads</h2>'
            '<p>Electronics on standby can consume 5-10% of household energy. Use smart '
            'power strips or plug-in timers to eliminate phantom loads from TVs, '
            'gaming consoles, and appliances.</p>'
            '<h2>6. Upgrade to LED Lighting Throughout</h2>'
            '<p>If you haven\'t already, replace all incandescent and CFL bulbs with LED. '
            'LEDs use 75% less energy and last 25x longer, reducing both consumption '
            'and maintenance costs.</p>'
            '<h2>7. Consider a Hybrid Inverter Upgrade</h2>'
            '<p>If you\'re on a basic off-grid system, upgrading to a hybrid inverter '
            'allows you to add grid connection or expand your battery capacity in the '
            'future, giving your system more flexibility.</p>'
            '<h2>8. Insulate Your Home</h2>'
            '<p>Poor insulation means your air conditioning and heating systems work harder. '
            'Improving roof and wall insulation can reduce cooling/heating loads by 20-30%, '
            'making your solar system more effective.</p>'
            '<h2>9. Size Up Slightly When Installing</h2>'
            '<p>The marginal cost of adding an extra panel or extra battery capacity during '
            'initial installation is much lower than adding it later. Plan for future '
            'energy needs from the start.</p>'
            '<h2>10. Take Advantage of Net Metering</h2>'
            '<p>If you\'re grid-connected in Zimbabwe, register for ZESA\'s net metering '
            'scheme to earn credits for excess energy you export to the grid. '
            'This can further reduce your payback period.</p>'
        ),
        'tags': ['roi', 'tips', 'solar investment', 'optimization', 'savings'],
        'image_url': '/blog/solar-roi-tips.jpg',
        'read_time': '9 min read',
        'is_published': True,
    },
]


class Command(BaseCommand):
    help = 'Seed blog posts and categories from frontend blogData.js data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing blog data before seeding',
        )

    def handle(self, *args, **options):
        from apps.blog.models import BlogCategory, BlogPost

        if options['clear']:
            self.stdout.write('Clearing existing blog data...')
            BlogPost.all_objects.all().delete()
            BlogCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared.'))

        # Get or create admin user for authorship
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin_user = User.objects.filter(role__in=('admin', 'superadmin')).first()

        if not admin_user:
            self.stdout.write(self.style.WARNING(
                'No admin user found. Blog posts will have no author.'
            ))

        created_count = 0
        updated_count = 0

        for post_data in BLOG_DATA:
            cat_data = post_data.pop('category')
            category, _ = BlogCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name'], 'is_active': True},
            )

            post, created = BlogPost.objects.update_or_create(
                slug=post_data['slug'],
                defaults={
                    **post_data,
                    'category': category,
                    'author': admin_user,
                    'published_at': timezone.now() if post_data.get('is_published') else None,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Blog seeding complete: {created_count} created, {updated_count} updated.'
        ))
