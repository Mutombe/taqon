// Zimbabwe-specific solar calculation constants

export const PEAK_SUN_HOURS = 5.5; // Average daily peak sun hours in Zimbabwe
export const ZESA_RATE_PER_KWH = 0.10; // ZESA electricity rate in USD per kWh
export const PANEL_WATTAGE = 550; // Standard panel wattage (watts)
export const SYSTEM_COST_PER_WATT = 1.20; // Average installed cost per watt (USD)
export const CO2_PER_KWH = 0.92; // kg CO2 offset per kWh of solar (Zimbabwe grid factor)
export const AVG_DEGRADATION_RATE = 0.005; // 0.5% annual panel degradation
export const ELECTRICITY_INFLATION_RATE = 0.08; // 8% annual electricity price increase estimate

// Appliance data for energy estimation
export const COMMON_APPLIANCES = [
  { name: 'LED Lights (10 bulbs)', kwhPerMonth: 30, icon: 'Lightbulb' },
  { name: 'Refrigerator', kwhPerMonth: 45, icon: 'Refrigerator' },
  { name: 'Television', kwhPerMonth: 20, icon: 'Tv' },
  { name: 'Washing Machine', kwhPerMonth: 25, icon: 'WashingMachine' },
  { name: 'Microwave', kwhPerMonth: 15, icon: 'Microwave' },
  { name: 'Electric Stove', kwhPerMonth: 90, icon: 'Flame' },
  { name: 'Air Conditioner', kwhPerMonth: 120, icon: 'Wind' },
  { name: 'Water Heater (Geyser)', kwhPerMonth: 150, icon: 'Droplets' },
  { name: 'Desktop Computer', kwhPerMonth: 30, icon: 'Monitor' },
  { name: 'Iron', kwhPerMonth: 20, icon: 'Shirt' },
  { name: 'Borehole Pump', kwhPerMonth: 80, icon: 'Droplets' },
  { name: 'Security System', kwhPerMonth: 15, icon: 'Shield' },
];

// Property types for quote wizard
export const PROPERTY_TYPES = [
  {
    id: 'residential',
    label: 'Residential',
    description: 'Houses, townhouses, and apartments',
    avgUsageKwh: 300,
  },
  {
    id: 'commercial',
    label: 'Commercial',
    description: 'Offices, shops, and retail spaces',
    avgUsageKwh: 800,
  },
  {
    id: 'institutional',
    label: 'Institutional',
    description: 'Schools, churches, and NGOs',
    avgUsageKwh: 600,
  },
  {
    id: 'farm',
    label: 'Farm',
    description: 'Agricultural and irrigation use',
    avgUsageKwh: 500,
  },
];

// Roof types for quote wizard
export const ROOF_TYPES = [
  {
    id: 'pitched',
    label: 'Pitched Roof',
    description: 'Angled roof with tiles or metal sheets',
    multiplier: 1.0,
  },
  {
    id: 'flat',
    label: 'Flat Roof',
    description: 'Flat concrete or membrane roof',
    multiplier: 1.05,
  },
  {
    id: 'ground',
    label: 'Ground Mount',
    description: 'Ground-level frame installation',
    multiplier: 1.15,
  },
];

// Budget ranges for quote wizard
export const BUDGET_RANGES = [
  { id: 'budget-1', label: '$1,000 - $3,000', min: 1000, max: 3000 },
  { id: 'budget-2', label: '$3,000 - $5,000', min: 3000, max: 5000 },
  { id: 'budget-3', label: '$5,000 - $8,000', min: 5000, max: 8000 },
  { id: 'budget-4', label: '$8,000+', min: 8000, max: 25000 },
];

// Financing plans
export const FINANCING_PLANS = [
  {
    id: 'plan-6',
    months: 6,
    interestRate: 0,
    label: '6 Months',
    description: 'Interest-free for 6 months',
    badge: 'Best Value',
  },
  {
    id: 'plan-12',
    months: 12,
    interestRate: 0.05,
    label: '12 Months',
    description: '5% total interest over 12 months',
    badge: 'Most Popular',
  },
  {
    id: 'plan-24',
    months: 24,
    interestRate: 0.10,
    label: '24 Months',
    description: '10% total interest over 24 months',
    badge: 'Low Monthly',
  },
];

// Payment methods
export const PAYMENT_METHODS = [
  { name: 'EcoCash', icon: 'Smartphone' },
  { name: 'InnBucks', icon: 'Wallet' },
  { name: 'Bank Transfer', icon: 'Building' },
  { name: 'Cash', icon: 'Banknote' },
];
