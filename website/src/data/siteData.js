// Products data
export const products = [
  {
    id: 1,
    name: "Kodak 5.6KVA /48V High Voltage Inverter OGS5.6",
    category: "inverters",
    price: 750,
    originalPrice: null,
    onSale: false,
    image: "/image.jpg",
    warranty: "5 Years",
    brand: "Kodak",
    specs: ["5.6KVA Output", "48V DC Input", "High Voltage", "MPPT Charge Controller"],
  },
  {
    id: 2,
    name: "Deye 104ah/51.2v Lithium-ion Solar Battery",
    category: "batteries",
    price: 1250,
    originalPrice: 1350,
    onSale: true,
    image: "/1.jpg",
    warranty: "5 Years",
    brand: "Deye",
    specs: ["104Ah Capacity", "51.2V", "Lithium-ion", "Long Cycle Life"],
  },
  {
    id: 3,
    name: "Pylontech Lithium Battery 24V UP2500",
    category: "batteries",
    price: 1100,
    originalPrice: null,
    onSale: false,
    image: "/image.png",
    warranty: "5 Years",
    brand: "Pylontech",
    specs: ["24V System", "2.5kWh", "LiFePO4", "Stackable Design"],
  },
  {
    id: 4,
    name: "Pylontech Lithium Ion US3000 Solar Batteries",
    category: "batteries",
    price: 1250,
    originalPrice: null,
    onSale: false,
    image: "/image.png",
    warranty: "5 Years",
    brand: "Pylontech",
    specs: ["48V System", "3.5kWh", "6000+ Cycles", "10 Year Design Life"],
  },
  {
    id: 5,
    name: "Pylontech Lithium Ion UP5000 Solar Batteries",
    category: "batteries",
    price: 1350,
    originalPrice: 1450,
    onSale: true,
    image: "/2.jpg",
    warranty: "5 Years",
    brand: "Pylontech",
    specs: ["48V System", "4.8kWh", "Scalable", "Smart BMS"],
  },
  {
    id: 6,
    name: "Dyness 100ah/48v Lithium ion Solar Battery",
    category: "batteries",
    price: 1250,
    originalPrice: 1350,
    onSale: true,
    image: "/4.jpg",
    warranty: "5 Years",
    brand: "Dyness",
    specs: ["100Ah", "48V", "Lithium-ion", "Wall Mount"],
  },
  {
    id: 7,
    name: "415w Jinko Solar Panel",
    category: "panels",
    price: 90,
    originalPrice: 130,
    onSale: true,
    image: "/5.jpg",
    warranty: "25 Years",
    brand: "Jinko",
    specs: ["415W Output", "Mono-crystalline", "Half-cell", "25 Year Warranty"],
  },
  {
    id: 8,
    name: "555w JA Solar Panel",
    category: "panels",
    price: 135,
    originalPrice: 140,
    onSale: true,
    image: "/6.jpg",
    warranty: "25 Years",
    brand: "JA Solar",
    specs: ["555W Output", "Mono-crystalline", "Bi-facial", "High Efficiency"],
  },
  {
    id: 9,
    name: "Kodak 6.2KVA /48V OG PLUS6.2 High Voltage Inverter",
    category: "inverters",
    price: 650,
    originalPrice: 800,
    onSale: true,
    image: "/image.jpg",
    warranty: "5 Years",
    brand: "Kodak",
    specs: ["6.2KVA Output", "48V DC", "OG PLUS Series", "Dual MPPT"],
  },
];

// Services data
export const services = [
  {
    id: 1,
    title: "Solar Installations",
    slug: "solar-installations",
    shortDesc: "Complete solar system design, supply and installation for homes, businesses and institutions.",
    description: "We offer dependable solar installation services for systems of all sizes. Our solar setups range from low-voltage systems that power lights and a small television to large high-voltage systems that energise the entire household, school, small to medium-sized farms, or office complexes.",
    icon: "Sun",
    features: ["Home solar systems", "Commercial solar systems", "Solar pumping systems", "System design & sizing"],
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  },
  {
    id: 2,
    title: "Electrical Maintenance",
    slug: "electrical-maintenance",
    shortDesc: "Professional electrical maintenance for homes, companies, institutions and industries.",
    description: "We maintain boreholes, lights, plugs, house wiring, meter boxes, solar installations and electrical machinery in industries. As a result of our reliable electrical engineering services, we are trusted by our customers.",
    icon: "Zap",
    features: ["Electrical circuits & separations", "House & office wiring", "Power upgrades", "24 Hour fault response"],
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
  },
  {
    id: 3,
    title: "Borehole Pump Installations",
    slug: "borehole-installations",
    shortDesc: "Solar-powered borehole pump solutions for reliable water supply.",
    description: "The availability of solar borehole pump technology for pumping water from boreholes has now become a regular feature in both the domestic water supply and farming water supply scenarios.",
    icon: "Droplets",
    features: ["AC borehole pump sizing & fitting", "Digital borehole control boxing", "Booster pump systems", "Solar-powered pumping"],
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
  },
  {
    id: 4,
    title: "Lighting Solutions",
    slug: "lighting-solutions",
    shortDesc: "Expert lighting design, supply and installation for any environment.",
    description: "Our lighting experts will assist you with your lighting projects by providing expert advice, a customised product selection, and exceptional service.",
    icon: "Lightbulb",
    features: ["Custom lighting design", "LED installations", "Commercial lighting", "Outdoor & security lights"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
  },
  {
    id: 5,
    title: "Solar System Maintenance",
    slug: "solar-maintenance",
    shortDesc: "Keep your solar system performing at peak efficiency with our maintenance services.",
    description: "A good Solar Panel Cleaning and Solar System Maintenance Service ensures that your system is running as effectively and safely as possible to help your solar system deliver reliable clean energy for a longer period.",
    icon: "Wrench",
    features: ["Panel cleaning", "Inverter calibration", "Battery maintenance", "Technical reports"],
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
  },
  {
    id: 6,
    title: "Electrical Hardware Supply",
    slug: "electrical-hardware",
    shortDesc: "Quality electrical hardware and equipment at competitive prices.",
    description: "Being relatively smaller than the larger companies, Taqon Electrico offers 'the personal touch', coupled with extensive levels of stock and efficient delivery schedules.",
    icon: "Package",
    features: ["Solar panels", "Batteries & inverters", "Borehole pumps", "Cabling & accessories"],
    image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80",
  },
];

// Packages data
export const packages = [
  {
    id: 1,
    name: "Home Quick Access",
    tier: "starter",
    price: "From $1,200",
    description: "Perfect entry-level solar system for basic household needs.",
    features: ["Lights & TV", "Phone charging", "Small appliances", "Basic battery backup"],
    popular: false,
  },
  {
    id: 2,
    name: "Home Luxury",
    tier: "popular",
    price: "From $2,500",
    description: "Mid-range system for comfortable living with solar power.",
    features: ["Full lighting", "TV & entertainment", "Fridge", "Multiple outlets", "Extended backup"],
    popular: true,
  },
  {
    id: 3,
    name: "Home Luxury Beta",
    tier: "premium",
    price: "From $3,500",
    description: "Enhanced system with greater capacity for growing families.",
    features: ["All Luxury features", "Washing machine", "Microwave", "Water heater", "Longer backup time"],
    popular: false,
  },
  {
    id: 4,
    name: "Home Deluxe 5kVA",
    tier: "premium",
    price: "From $5,000",
    description: "Full-house solar solution powering all your household needs.",
    features: ["Whole house power", "All appliances", "Air conditioning", "5kVA inverter", "Premium batteries"],
    popular: false,
  },
  {
    id: 5,
    name: "8KVA Ultra Power",
    tier: "commercial",
    price: "From $8,000",
    description: "High-capacity system for large homes and small businesses.",
    features: ["8KVA capacity", "Heavy appliances", "Multiple zones", "Smart monitoring", "Expandable"],
    popular: false,
  },
  {
    id: 6,
    name: "10KVA Premium Power",
    tier: "commercial",
    price: "From $12,000",
    description: "Commercial-grade power for businesses and institutions.",
    features: ["10KVA capacity", "Office complexes", "Industrial use", "Remote monitoring", "Priority support"],
    popular: false,
  },
];

// Testimonials
export const testimonials = [
  {
    id: 1,
    name: "Tendai Moyo",
    role: "Homeowner, Borrowdale",
    text: "Taqon Electrico transformed our home with a complete solar installation. We haven't worried about load shedding since. Their team was professional, punctual, and the system works flawlessly.",
    rating: 5,
  },
  {
    id: 2,
    name: "City Plastics Harare",
    role: "Manufacturing Company",
    text: "Our factory's energy costs have dropped significantly since Taqon installed our commercial solar system. The ROI has been excellent and their maintenance team keeps everything running perfectly.",
    rating: 5,
  },
  {
    id: 3,
    name: "Rev. Blessing Chuma",
    role: "Church Administrator",
    text: "The solar system installed at our church has been a blessing. We can now hold evening services without worrying about power outages. Taqon's team understood our needs perfectly.",
    rating: 5,
  },
  {
    id: 4,
    name: "Clinton Health Access Initiative",
    role: "NGO",
    text: "We needed reliable power for our health facilities and Taqon delivered beyond expectations. Their expertise in large-scale installations is unmatched in Zimbabwe.",
    rating: 5,
  },
];

// Gallery projects
export const projects = [
  {
    id: 1,
    title: "Residential Solar - Borrowdale",
    category: "residential",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    description: "10kW residential solar installation",
  },
  {
    id: 2,
    title: "Commercial Installation - City Plastics",
    category: "commercial",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
    description: "50kW commercial rooftop system",
  },
  {
    id: 3,
    title: "School Solar Project - Childline",
    category: "institutional",
    image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80",
    description: "Complete power solution for NGO facility",
  },
  {
    id: 4,
    title: "Farm Borehole Pump - Marondera",
    category: "borehole",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
    description: "Solar-powered irrigation system",
  },
  {
    id: 5,
    title: "Residential - Mount Pleasant",
    category: "residential",
    image: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&q=80",
    description: "8kVA home solar system with battery backup",
  },
  {
    id: 6,
    title: "Office Complex - Eastlea",
    category: "commercial",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80",
    description: "20kW office complex installation",
  },
  {
    id: 7,
    title: "Church Installation - Hatfield",
    category: "institutional",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    description: "5kVA system for community church",
  },
  {
    id: 8,
    title: "Keepnet Offices",
    category: "commercial",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80",
    description: "Commercial solar installation with monitoring",
  },
];

// Career positions
export const careers = [
  {
    id: 1,
    title: "Solar Installation Technician",
    department: "Installations",
    type: "Full-time",
    location: "Harare, Zimbabwe",
    description: "Join our team of expert solar installers. You'll work on residential and commercial solar installations across Zimbabwe.",
    requirements: ["Electrical engineering diploma or equivalent", "2+ years solar installation experience", "Valid driver's license", "Physical fitness for rooftop work"],
  },
  {
    id: 2,
    title: "Electrical Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "Harare, Zimbabwe",
    description: "Lead electrical design and installation projects for our growing client base.",
    requirements: ["BSc in Electrical Engineering", "Professional registration with ZIE", "3+ years experience", "Project management skills"],
  },
  {
    id: 3,
    title: "Sales Representative",
    department: "Sales",
    type: "Full-time",
    location: "Harare, Zimbabwe",
    description: "Drive solar adoption by connecting with potential clients and presenting our solutions.",
    requirements: ["Sales experience in energy/tech sector", "Strong communication skills", "Own vehicle", "Knowledge of solar systems preferred"],
  },
];

// Stats
export const stats = [
  { value: "500+", label: "Projects Completed", suffix: "" },
  { value: "3000", label: "kWp PV Modules Installed", suffix: "kWp" },
  { value: "5000+", label: "kWh Battery Storage", suffix: "" },
  { value: "5+", label: "Years Experience", suffix: "" },
];

// Brand partners
export const brands = [
  "Jinko Solar", "Pylontech", "Dyness", "Kodak", "JA Solar", "Deye"
];

// Company info
export const companyInfo = {
  name: "TAQON ELECTRICO",
  tagline: "Customer is King!",
  address: "203 Sherwood Drive, Strathaven, Harare",
  visitAddress: "876 Ringwood Drive, Strathaven, Harare",
  phone: ["+263 8644 290072", "+263 772 771 036", "+263 719 771 036"],
  landline: "+263 242 304860",
  email: "info@taqon.co.zw",
  website: "www.taqon.co.zw",
  mapLink: "https://goo.gl/maps/gEBWUQoo4cgKEym2A",
  social: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
    linkedin: "#",
  },
  hours: {
    weekday: "08:00 - 16:30",
    saturday: "08:00 - 13:00",
    sunday: "Closed",
  },
};

// FAQ Data
export const faqs = [
  {
    question: "How long does a solar installation take?",
    answer: "A typical residential installation takes 1-3 days depending on system size. Commercial installations may take 1-2 weeks. We always provide a detailed timeline before starting any project."
  },
  {
    question: "What size solar system do I need for my home?",
    answer: "The right system size depends on your energy consumption, available roof space, and budget. Our engineers conduct a free energy audit to recommend the perfect system for your needs."
  },
  {
    question: "Do you offer financing or payment plans?",
    answer: "Yes! We offer flexible payment plans to make solar accessible. Contact us to discuss options that work within your budget."
  },
  {
    question: "What warranties do your products come with?",
    answer: "Solar panels come with up to 25-year warranties, batteries with up to 5-year warranties, and inverters with up to 5-year warranties. We also warranty our workmanship."
  },
  {
    question: "Can I expand my solar system later?",
    answer: "Absolutely! We design systems with scalability in mind. You can add more panels, batteries, or upgrade your inverter as your energy needs grow."
  },
  {
    question: "Do you service systems installed by other companies?",
    answer: "Yes, we offer maintenance and repair services for all solar systems regardless of who installed them. Contact us to schedule a maintenance visit."
  },
];

// Video testimonials
export const videoTestimonials = [
  {
    id: 1,
    name: 'Solar Panel Care',
    role: 'Taqon Electrico Tips',
    quote: 'How to make your solar panels last longer — essential maintenance tips from our experts.',
    thumbnail: '/40.jpeg',
    videoUrl: 'https://www.youtube.com/embed/YC5FgZPe1o0',
    platform: 'youtube',
  },
  {
    id: 2,
    name: 'Energy Saving Tips',
    role: 'Taqon Electrico Tips',
    quote: 'Home energy wasting habits — discover what\'s costing you money and how to stop it.',
    thumbnail: '/51.jpeg',
    videoUrl: 'https://www.youtube.com/embed/gkUOhNN_-1Y',
    platform: 'youtube',
  },
  {
    id: 3,
    name: 'Taqon In Action',
    role: 'Taqon Electrico',
    quote: 'Watch our team in action — delivering quality solar installations across Zimbabwe.',
    thumbnail: '/projects/kadoma-24kva/1.jpg',
    videoUrl: 'https://www.facebook.com/share/r/17dt3R1mMv/',
    platform: 'facebook',
  },
];

// Before/After project showcases
export const beforeAfterProjects = [
  {
    id: 1,
    title: 'Borrowdale Residence',
    beforeImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
    description: '10kW residential solar installation',
  },
  {
    id: 2,
    title: 'City Plastics Factory',
    beforeImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
    description: '50kW commercial rooftop system',
  },
  {
    id: 3,
    title: 'Marondera Farm',
    beforeImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&q=80',
    description: 'Solar-powered borehole irrigation system',
  },
];

// Financing plans
export const financingPlans = [
  {
    id: 1,
    name: '6-Month Plan',
    duration: 6,
    interestRate: 0,
    description: 'Interest-free short-term plan for those who want to pay off quickly.',
    badge: 'No Interest',
  },
  {
    id: 2,
    name: '12-Month Plan',
    duration: 12,
    interestRate: 5,
    description: 'Affordable monthly payments spread over a year.',
    badge: 'Most Popular',
    popular: true,
  },
  {
    id: 3,
    name: '24-Month Plan',
    duration: 24,
    interestRate: 10,
    description: 'Extended payments for maximum affordability.',
    badge: 'Lowest Monthly',
  },
];

// Payment methods
export const paymentMethods = [
  { name: 'EcoCash', icon: 'Smartphone' },
  { name: 'InnBucks', icon: 'Smartphone' },
  { name: 'Bank Transfer', icon: 'Building' },
  { name: 'Cash', icon: 'Banknote' },
  { name: 'USD', icon: 'DollarSign' },
];

// Certifications
export const certifications = [
  {
    id: 1,
    name: 'ZERA Recommended',
    issuer: 'Zimbabwe Energy Regulatory Authority',
    description: 'Officially recommended solar installation company by the Zimbabwe Energy Regulatory Authority.',
    icon: 'Shield',
  },
  {
    id: 2,
    name: 'Licensed Electrical Contractor',
    issuer: 'Ministry of Energy and Power Development',
    description: 'Fully licensed to perform electrical installations and maintenance across Zimbabwe.',
    icon: 'Award',
  },
  {
    id: 3,
    name: 'Quality Management',
    issuer: 'Standards Association of Zimbabwe',
    description: 'Committed to maintaining the highest quality standards in all installations.',
    icon: 'CheckCircle',
  },
];

// Brand partners with descriptions
export const brandPartners = [
  { name: 'Jinko Solar', description: 'World-leading solar panel manufacturer with 25-year warranties.', logo: '/jinko.png' },
  { name: 'Pylontech', description: 'Premium lithium battery solutions with 10+ year design life.', logo: '/pylontech.jpg' },
  { name: 'Dyness', description: 'High-performance energy storage for residential and commercial use.', logo: '/Dyness.png' },
  { name: 'Kodak', description: 'Reliable hybrid inverters with advanced MPPT technology.', logo: null },
  { name: 'JA Solar', description: 'Tier-1 solar panels with industry-leading efficiency ratings.', logo: null },
  { name: 'Deye', description: 'Smart inverters and battery systems for modern solar installations.', logo: null },
];

// Team member expertise
export const teamMembers = [
  {
    id: 1,
    name: 'Engineering Team',
    role: 'Solar & Electrical Engineers',
    description: 'Licensed electrical engineers with 5+ years of combined experience in solar system design and installation.',
    icon: 'Wrench',
  },
  {
    id: 2,
    name: 'Installation Crew',
    role: 'Certified Technicians',
    description: 'Skilled technicians trained in rooftop and ground-mount solar installations, borehole pumps, and electrical wiring.',
    icon: 'HardHat',
  },
  {
    id: 3,
    name: 'Customer Support',
    role: 'Client Relations Team',
    description: 'Dedicated team providing project consultation, after-sales support, and maintenance scheduling.',
    icon: 'HeadphonesIcon',
  },
];

// Solar tips / blog posts
export const solarTips = [
  {
    id: 1,
    title: "Understanding Solar Panel Efficiency",
    excerpt: "Learn how temperature, angle, and cleaning affect your solar panel output and what you can do to maximise energy production.",
    category: "Education",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
    date: "2026-01-15",
  },
  {
    id: 2,
    title: "Battery Storage: LiFePO4 vs Lead Acid",
    excerpt: "Compare the two most popular battery technologies for solar systems and find out which is right for your installation.",
    category: "Technology",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&q=80",
    date: "2026-01-28",
  },
  {
    id: 3,
    title: "How to Size Your Solar System",
    excerpt: "A step-by-step guide to calculating the right solar system size for your home or business in Zimbabwe.",
    category: "Guide",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=80",
    date: "2026-02-05",
  },
  {
    id: 4,
    title: "Maintaining Your Solar System",
    excerpt: "Regular maintenance tips to keep your solar system running at peak performance for years to come.",
    category: "Maintenance",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&q=80",
    date: "2026-02-10",
  },
];
