import {
  PEAK_SUN_HOURS,
  ZESA_RATE_PER_KWH,
  PANEL_WATTAGE,
  SYSTEM_COST_PER_WATT,
  CO2_PER_KWH,
  AVG_DEGRADATION_RATE,
  ELECTRICITY_INFLATION_RATE,
} from '../data/calculatorData';

/**
 * Calculate the recommended solar system based on monthly electricity bill in USD.
 * Returns system size, panel count, cost range, payback period, savings, and projections.
 */
export function calculateSolarSystem(monthlyBillUSD) {
  const bill = Math.max(0, Number(monthlyBillUSD) || 0);

  // Monthly kWh consumption derived from bill
  const monthlyKwh = bill / ZESA_RATE_PER_KWH;

  // Daily kWh requirement
  const dailyKwh = monthlyKwh / 30;

  // Required system size in kW (based on peak sun hours)
  const systemSizeKw = Math.round((dailyKwh / PEAK_SUN_HOURS) * 100) / 100;

  // Number of panels needed (rounded up)
  const panelCount = Math.max(1, Math.ceil((systemSizeKw * 1000) / PANEL_WATTAGE));

  // Actual system size from panels
  const actualSystemKw = (panelCount * PANEL_WATTAGE) / 1000;

  // Cost range (80% to 120% of base estimate to account for variation)
  const baseCost = actualSystemKw * 1000 * SYSTEM_COST_PER_WATT;
  const costMin = Math.round(baseCost * 0.85);
  const costMax = Math.round(baseCost * 1.20);

  // Monthly savings (what the system would produce in value)
  const monthlyProductionKwh = actualSystemKw * PEAK_SUN_HOURS * 30;
  const monthlySavings = Math.round(monthlyProductionKwh * ZESA_RATE_PER_KWH * 100) / 100;

  // 25-year cumulative savings projection
  const yearlyProjection = generate25YearProjection(actualSystemKw, baseCost);

  // Payback period in years
  const paybackYears = calculatePaybackYears(yearlyProjection, baseCost);

  // Annual CO2 saved (kg)
  const annualProductionKwh = monthlyProductionKwh * 12;
  const co2SavedKg = Math.round(annualProductionKwh * CO2_PER_KWH);

  return {
    systemSizeKw: Math.round(actualSystemKw * 100) / 100,
    panelCount,
    costMin,
    costMax,
    paybackYears,
    monthlySavings,
    yearlyProjection,
    co2SavedKg,
    monthlyKwh: Math.round(monthlyKwh),
    dailyKwh: Math.round(dailyKwh * 10) / 10,
  };
}

/**
 * Calculate solar system from monthly kWh usage instead of bill.
 */
export function calculateFromKwh(monthlyKwh) {
  const bill = monthlyKwh * ZESA_RATE_PER_KWH;
  return calculateSolarSystem(bill);
}

/**
 * Generate 25-year cumulative savings projection.
 * Accounts for panel degradation and electricity price inflation.
 */
function generate25YearProjection(systemKw, systemCost) {
  const projection = [];
  let cumulativeSavings = 0;

  for (let year = 1; year <= 25; year++) {
    // Panel degradation reduces output each year
    const degradationFactor = Math.pow(1 - AVG_DEGRADATION_RATE, year - 1);

    // Electricity inflation increases savings value each year
    const inflationFactor = Math.pow(1 + ELECTRICITY_INFLATION_RATE, year - 1);

    // Annual production in kWh
    const annualProductionKwh = systemKw * PEAK_SUN_HOURS * 365 * degradationFactor;

    // Value of production in current inflated dollars
    const annualSavingsUSD = annualProductionKwh * ZESA_RATE_PER_KWH * inflationFactor;

    cumulativeSavings += annualSavingsUSD;

    // Net savings (cumulative savings minus system cost)
    projection.push(Math.round(cumulativeSavings - systemCost));
  }

  return projection;
}

/**
 * Calculate payback period in years from yearly projection.
 */
function calculatePaybackYears(projection, systemCost) {
  for (let i = 0; i < projection.length; i++) {
    if (projection[i] >= 0) {
      // Interpolate for a more accurate payback time
      if (i === 0) return 1;
      const prevNet = projection[i - 1];
      const currNet = projection[i];
      const fraction = Math.abs(prevNet) / (Math.abs(prevNet) + currNet);
      return Math.round((i + fraction) * 10) / 10;
    }
  }
  return 25; // If payback exceeds 25 years
}

/**
 * Calculate monthly payment for a financing plan.
 */
export function calculateMonthlyPayment(systemCost, months, interestRate) {
  const cost = Math.max(0, Number(systemCost) || 0);
  const totalCost = cost * (1 + interestRate);
  const interestAmount = cost * interestRate;
  const monthlyPayment = totalCost / months;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
  };
}

/**
 * Generate a simulated daily production curve (for dashboard demo).
 * Returns array of { hour, production } from 5am to 7pm.
 */
export function generateDailyProductionCurve(systemKw) {
  const hours = [];
  for (let h = 5; h <= 19; h++) {
    // Bell curve peaking at noon (hour 12)
    const x = (h - 12) / 3.5;
    const production = systemKw * Math.exp(-0.5 * x * x);
    hours.push({
      hour: h,
      label: h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
      production: Math.round(production * 100) / 100,
    });
  }
  return hours;
}

/**
 * Format currency in USD.
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with cents.
 */
export function formatCurrencyDetailed(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
