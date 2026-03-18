import React from 'react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator,
  Sun,
  Lightning,
  CurrencyDollar,
  Leaf,
  TrendUp,
  ArrowRight,
  ChartBar,
  Clock,
  SquaresFour,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { calculateSolarSystem, calculateFromKwh, formatCurrency } from '../utils/solarCalculator';

export default function SavingsCalculator() {
  const [inputMode, setInputMode] = useState('bill'); // 'bill' or 'kwh'
  const [monthlyBill, setMonthlyBill] = useState(80);
  const [monthlyKwh, setMonthlyKwh] = useState(800);

  const result = useMemo(() => {
    if (inputMode === 'bill') {
      return calculateSolarSystem(monthlyBill);
    }
    return calculateFromKwh(monthlyKwh);
  }, [inputMode, monthlyBill, monthlyKwh]);

  // Chart calculations
  const chartWidth = 700;
  const chartHeight = 260;
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const maxSavings = Math.max(...result.yearlyProjection, 0);
  const minSavings = Math.min(...result.yearlyProjection, 0);
  const range = maxSavings - minSavings || 1;

  const getX = (i) => chartPadding.left + (i / 24) * plotWidth;
  const getY = (val) => chartPadding.top + plotHeight - ((val - minSavings) / range) * plotHeight;

  const linePath = result.yearlyProjection
    .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${getX(24)} ${getY(0) < chartPadding.top + plotHeight ? chartPadding.top + plotHeight : getY(0)} L ${getX(0)} ${chartPadding.top + plotHeight} Z`;

  // Zero line Y position
  const zeroY = minSavings < 0 ? getY(0) : chartPadding.top + plotHeight;

  return (
    <>
      <SEO
        title="Solar Savings Calculator"
        description="Calculate how much you can save with solar power in Zimbabwe. Get instant estimates for system size, cost, payback period, and 25-year savings projection."
        keywords="solar savings calculator Zimbabwe, solar ROI calculator, ZESA bill savings, solar payback period, solar cost estimate"
        canonical="https://www.taqon.co.zw/calculator"
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Savings Calculator
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
              How Much Can <span className="text-gradient">Solar</span> Save You?
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              Enter your current electricity bill or usage and see your estimated solar savings, system size,
              and 25-year financial projection — tailored for Zimbabwe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Input Panel */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center">
                      <Calculator size={24} className="text-taqon-orange" />
                    </div>
                    <h2 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                      Your Energy Usage
                    </h2>
                  </div>

                  {/* Toggle */}
                  <div className="flex bg-gray-100 dark:bg-taqon-dark rounded-xl p-1 mb-8">
                    <button
                      onClick={() => setInputMode('bill')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        inputMode === 'bill'
                          ? 'bg-taqon-orange text-white shadow-md'
                          : 'text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white'
                      }`}
                    >
                      Monthly Bill ($)
                    </button>
                    <button
                      onClick={() => setInputMode('kwh')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        inputMode === 'kwh'
                          ? 'bg-taqon-orange text-white shadow-md'
                          : 'text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white'
                      }`}
                    >
                      Monthly kWh
                    </button>
                  </div>

                  {/* Bill Input */}
                  {inputMode === 'bill' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-taqon-charcoal dark:text-white/80">
                          Monthly ZESA Bill
                        </label>
                        <span className="text-2xl font-bold font-syne text-taqon-orange">
                          ${monthlyBill}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={monthlyBill}
                        onChange={(e) => setMonthlyBill(Number(e.target.value))}
                        className="w-full accent-taqon-orange"
                      />
                      <div className="flex justify-between text-xs text-taqon-muted mt-1">
                        <span>$10</span>
                        <span>$500</span>
                      </div>
                    </div>
                  )}

                  {/* kWh Input */}
                  {inputMode === 'kwh' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-taqon-charcoal dark:text-white/80">
                          Monthly Usage
                        </label>
                        <span className="text-2xl font-bold font-syne text-taqon-orange">
                          {monthlyKwh} kWh
                        </span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="5000"
                        step="50"
                        value={monthlyKwh}
                        onChange={(e) => setMonthlyKwh(Number(e.target.value))}
                        className="w-full accent-taqon-orange"
                      />
                      <div className="flex justify-between text-xs text-taqon-muted mt-1">
                        <span>100 kWh</span>
                        <span>5,000 kWh</span>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-taqon-orange/5 to-taqon-amber/5 dark:from-taqon-orange/10 dark:to-transparent border border-taqon-orange/10">
                    <p className="text-sm text-taqon-muted dark:text-white/50 mb-1">Estimated system</p>
                    <p className="text-3xl font-bold font-syne text-gradient">
                      {result.systemSizeKw} kW
                    </p>
                    <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">
                      {result.panelCount} x 550W panels
                    </p>
                  </div>

                  <Link
                    to="/quote"
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-taqon-orange text-white py-4 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
                  >
                    Get a Free Quote <ArrowRight size={16} />
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Result Cards Grid */}
              <AnimatedSection>
                <h3 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                  Your Solar <span className="text-gradient">Estimate</span>
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Sun,
                      label: 'System Size',
                      value: `${result.systemSizeKw} kW`,
                      sub: `${result.panelCount} panels`,
                    },
                    {
                      icon: SquaresFour,
                      label: 'Panel Count',
                      value: `${result.panelCount}`,
                      sub: '550W each',
                    },
                    {
                      icon: CurrencyDollar,
                      label: 'Estimated Cost',
                      value: `${formatCurrency(result.costMin)} - ${formatCurrency(result.costMax)}`,
                      sub: 'Installed',
                    },
                    {
                      icon: Clock,
                      label: 'Payback Period',
                      value: `${result.paybackYears} years`,
                      sub: 'Return on investment',
                    },
                    {
                      icon: Lightning,
                      label: 'Monthly Savings',
                      value: `$${result.monthlySavings}`,
                      sub: 'On electricity bill',
                    },
                    {
                      icon: Leaf,
                      label: 'CO2 Saved Yearly',
                      value: `${result.co2SavedKg.toLocaleString()} kg`,
                      sub: 'Carbon offset',
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="bg-white dark:bg-taqon-charcoal rounded-2xl p-6 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-taqon-muted dark:text-white/50 uppercase tracking-wider">
                            {card.label}
                          </p>
                          <p className="mt-2 text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                            {card.value}
                          </p>
                          <p className="text-xs text-taqon-muted dark:text-white/40 mt-1">{card.sub}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                          <card.icon size={18} className="text-taqon-orange" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatedSection>

              {/* 25-Year Projection Chart */}
              <AnimatedSection delay={0.2}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                      <ChartBar size={20} className="text-taqon-orange" />
                    </div>
                    <div>
                      <h4 className="font-bold font-syne text-taqon-charcoal dark:text-white">
                        25-Year Savings Projection
                      </h4>
                      <p className="text-xs text-taqon-muted dark:text-white/50">
                        Cumulative net savings over system lifetime
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px]">
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                        const y = chartPadding.top + plotHeight * (1 - frac);
                        const val = minSavings + range * frac;
                        return (
                          <g key={frac}>
                            <line
                              x1={chartPadding.left}
                              y1={y}
                              x2={chartPadding.left + plotWidth}
                              y2={y}
                              stroke="currentColor"
                              className="text-gray-200 dark:text-white/10"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={chartPadding.left - 8}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-current text-taqon-muted dark:text-white/40"
                            >
                              ${Math.round(val / 1000)}k
                            </text>
                          </g>
                        );
                      })}

                      {/* Zero line */}
                      {minSavings < 0 && (
                        <line
                          x1={chartPadding.left}
                          y1={zeroY}
                          x2={chartPadding.left + plotWidth}
                          y2={zeroY}
                          stroke="currentColor"
                          className="text-taqon-muted/40"
                          strokeWidth="1"
                        />
                      )}

                      {/* X-axis labels */}
                      {[0, 4, 9, 14, 19, 24].map((i) => (
                        <text
                          key={i}
                          x={getX(i)}
                          y={chartPadding.top + plotHeight + 25}
                          textAnchor="middle"
                          className="text-[10px] fill-current text-taqon-muted dark:text-white/40"
                        >
                          Yr {i + 1}
                        </text>
                      ))}

                      {/* Area fill */}
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        d={areaPath}
                        fill="url(#savingsGradient)"
                        opacity="0.3"
                      />

                      {/* Line */}
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
                        d={linePath}
                        fill="none"
                        stroke="#F26522"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data points */}
                      {result.yearlyProjection.map((val, i) =>
                        i % 5 === 4 || i === 0 ? (
                          <motion.circle
                            key={i}
                            initial={{ opacity: 0, r: 0 }}
                            animate={{ opacity: 1, r: 4 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            cx={getX(i)}
                            cy={getY(val)}
                            fill="#F26522"
                            stroke="white"
                            strokeWidth="2"
                          />
                        ) : null
                      )}

                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F26522" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#F26522" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Chart legend */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <TrendUp size={14} className="text-taqon-orange" />
                      <span className="text-xs text-taqon-muted dark:text-white/50">
                        Accounts for 0.5% annual panel degradation &amp; 8% electricity inflation
                      </span>
                    </div>
                    <span className="text-sm font-bold font-syne text-taqon-orange">
                      {formatCurrency(result.yearlyProjection[24])} net
                    </span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Note */}
              <AnimatedSection delay={0.3}>
                <div className="bg-taqon-orange/5 dark:bg-taqon-orange/10 border border-taqon-orange/10 rounded-2xl p-5">
                  <p className="text-sm text-taqon-muted dark:text-white/60 leading-relaxed">
                    <strong className="text-taqon-charcoal dark:text-white">Disclaimer:</strong> These estimates are
                    based on average Zimbabwe conditions (5.5 peak sun hours/day, ZESA rate ~$0.10/kWh). Actual results
                    may vary based on location, roof orientation, shading, and electricity tariff changes. Contact us for
                    a precise, site-specific assessment.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready to Start Saving?
            </h2>
            <p className="mt-3 text-gray-500 dark:text-white/50 max-w-lg mx-auto">
              Get a personalised quote from our engineers and start your solar journey today.
            </p>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold mt-8 hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
            >
              Get Your Free Quote <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
