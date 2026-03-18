import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun,
  Lightning,
  CurrencyDollar,
  Leaf,
  Pulse,
  Warning,
  CheckCircle,
  Info,
  ArrowRight,
  BatteryFull,
  Gauge,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { generateDailyProductionCurve } from '../utils/solarCalculator';

// Simulated dashboard data
const DEMO_SYSTEM_KW = 5.5;
const CURRENT_HOUR = new Date().getHours();

// Simulate current production based on time of day
function getCurrentProduction(systemKw) {
  if (CURRENT_HOUR < 6 || CURRENT_HOUR > 18) return 0;
  const x = (CURRENT_HOUR - 12) / 3.5;
  return Math.round(systemKw * Math.exp(-0.5 * x * x) * 100) / 100;
}

const ALERTS = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    title: 'System performing optimally',
    time: '2 hours ago',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    id: 2,
    type: 'info',
    icon: Info,
    title: 'Monthly production report available',
    time: '1 day ago',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 3,
    type: 'warning',
    icon: Warning,
    title: 'Panel cleaning recommended — due in 14 days',
    time: '3 days ago',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 4,
    type: 'success',
    icon: CheckCircle,
    title: 'BatteryFull fully charged',
    time: '5 hours ago',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    id: 5,
    type: 'info',
    icon: Info,
    title: 'Firmware update applied successfully',
    time: '1 week ago',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
];

function CircularGauge({ value, max, label, unit }) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-white/10"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F26522" />
              <stop offset="50%" stopColor="#FF8C42" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white"
          >
            {value.toFixed(1)}
          </motion.span>
          <span className="text-sm text-taqon-muted dark:text-white/50">{unit}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-taqon-charcoal dark:text-white/80">{label}</p>
    </div>
  );
}

export default function CustomerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const productionCurve = useMemo(() => generateDailyProductionCurve(DEMO_SYSTEM_KW), []);
  const currentProduction = getCurrentProduction(DEMO_SYSTEM_KW);
  const totalToday = productionCurve
    .filter((h) => h.hour <= CURRENT_HOUR)
    .reduce((sum, h) => sum + h.production, 0);

  // Chart dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = { top: 15, right: 15, bottom: 35, left: 45 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const maxProd = Math.max(...productionCurve.map((h) => h.production));

  const getX = (i) => padding.left + (i / (productionCurve.length - 1)) * plotW;
  const getY = (val) => padding.top + plotH - (val / (maxProd || 1)) * plotH;

  const areaPath = productionCurve
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(h.production)}`)
    .join(' ')
    + ` L ${getX(productionCurve.length - 1)} ${padding.top + plotH} L ${getX(0)} ${padding.top + plotH} Z`;

  const linePath = productionCurve
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(h.production)}`)
    .join(' ');

  const statCards = [
    {
      icon: Sun,
      label: 'Production Today',
      value: `${totalToday.toFixed(1)} kWh`,
      change: '+12% vs yesterday',
      changePositive: true,
    },
    {
      icon: CurrencyDollar,
      label: 'Savings This Month',
      value: '$42.80',
      change: '+8% vs last month',
      changePositive: true,
    },
    {
      icon: Pulse,
      label: 'System Health',
      value: '98.5%',
      change: 'All systems normal',
      changePositive: true,
    },
    {
      icon: Leaf,
      label: 'CO2 Offset',
      value: '127 kg',
      change: 'This month',
      changePositive: true,
    },
  ];

  return (
    <>
      <SEO
        title="Solar Dashboard Demo"
        description="Experience our solar monitoring dashboard. Every Taqon Electrico installation includes real-time monitoring for system health, production, and savings."
        keywords="solar monitoring dashboard, solar system monitoring Zimbabwe, real-time solar tracking, energy monitoring"
        canonical="https://www.taqon.co.zw/dashboard"
      />

      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Solar Dashboard
            </span>
            <h1 className="mt-3 text-4xl lg:text-5xl font-bold font-syne text-white">
              Monitor Your <span className="text-gradient">Solar System</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Real-time monitoring of system performance, energy production, and savings.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-taqon-orange to-taqon-amber py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
          <Info size={16} className="text-white flex-shrink-0" />
          <p className="text-white text-sm font-medium text-center">
            This is a demo dashboard — real-time portal access is included with every Taqon Electrico installation.
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <section className="py-10 lg:py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
                System Overview
              </h2>
              <p className="text-sm text-taqon-muted dark:text-white/50">
                {DEMO_SYSTEM_KW}kW System &bull; {currentTime.toLocaleDateString('en-ZW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">System Online</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, i) => (
              <AnimatedSection key={card.label} delay={i * 0.1}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                      <card.icon size={18} className="text-taqon-orange" />
                    </div>
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                      {card.change}
                    </span>
                  </div>
                  <p className="text-xs text-taqon-muted dark:text-white/50 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">{card.value}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Production Chart */}
            <AnimatedSection className="lg:col-span-2">
              <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-white/10 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">Daily Production</h3>
                    <p className="text-xs text-taqon-muted dark:text-white/50">Energy output throughout the day</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded bg-taqon-orange" />
                    <span className="text-taqon-muted dark:text-white/50">kW output</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[450px]">
                    {/* Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                      const y = padding.top + plotH * (1 - frac);
                      const val = maxProd * frac;
                      return (
                        <g key={frac}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + plotW}
                            y2={y}
                            stroke="currentColor"
                            className="text-gray-100 dark:text-white/5"
                          />
                          <text
                            x={padding.left - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="text-[10px] fill-current text-taqon-muted dark:text-white/40"
                          >
                            {val.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X labels */}
                    {productionCurve.map((h, i) => (
                      i % 2 === 0 && (
                        <text
                          key={h.hour}
                          x={getX(i)}
                          y={padding.top + plotH + 22}
                          textAnchor="middle"
                          className="text-[10px] fill-current text-taqon-muted dark:text-white/40"
                        >
                          {h.label}
                        </text>
                      )
                    ))}

                    {/* Area */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1 }}
                      d={areaPath}
                      fill="url(#prodGradient)"
                    />

                    {/* Line */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      d={linePath}
                      fill="none"
                      stroke="#F26522"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Current hour indicator */}
                    {CURRENT_HOUR >= 5 && CURRENT_HOUR <= 19 && (() => {
                      const idx = CURRENT_HOUR - 5;
                      if (idx >= 0 && idx < productionCurve.length) {
                        return (
                          <g>
                            <line
                              x1={getX(idx)}
                              y1={padding.top}
                              x2={getX(idx)}
                              y2={padding.top + plotH}
                              stroke="#F26522"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                              opacity="0.5"
                            />
                            <motion.circle
                              initial={{ r: 0 }}
                              animate={{ r: 5 }}
                              transition={{ delay: 1, duration: 0.5 }}
                              cx={getX(idx)}
                              cy={getY(productionCurve[idx].production)}
                              fill="#F26522"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <text
                              x={getX(idx)}
                              y={getY(productionCurve[idx].production) - 12}
                              textAnchor="middle"
                              className="text-[11px] fill-current font-bold text-taqon-orange"
                            >
                              Now
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })()}

                    <defs>
                      <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F26522" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#F26522" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </AnimatedSection>

            {/* Power Gauge */}
            <AnimatedSection delay={0.2}>
              <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Gauge size={18} className="text-taqon-orange" />
                  <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">Current Output</h3>
                </div>
                <CircularGauge
                  value={currentProduction}
                  max={DEMO_SYSTEM_KW}
                  label="Live Power Output"
                  unit="kW"
                />
                <div className="mt-6 flex items-center gap-4 text-xs text-taqon-muted dark:text-white/50">
                  <div className="flex items-center gap-1.5">
                    <BatteryFull size={14} className="text-green-500" />
                    <span>BatteryFull: 94%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lightning size={14} className="text-taqon-orange" />
                    <span>Grid: Off</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Alerts */}
          <AnimatedSection delay={0.3} className="mt-6">
            <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-white/10">
              <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-5">Recent Alerts</h3>
              <div className="space-y-3">
                {ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-4 p-4 rounded-xl ${alert.bg}`}
                  >
                    <div className="flex-shrink-0">
                      <alert.icon size={18} className={alert.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${alert.color}`}>{alert.title}</p>
                    </div>
                    <span className="text-xs text-taqon-muted dark:text-white/40 flex-shrink-0">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Want Your Own Dashboard?
            </h2>
            <p className="mt-3 text-gray-500 dark:text-white/50 max-w-lg mx-auto">
              Every Taqon Electrico installation includes access to your personalised solar monitoring portal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                to="/quote"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Get a Free Quote <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border border-gray-300 dark:border-white/20 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
