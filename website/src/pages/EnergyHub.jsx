import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sun, Lightning, BatteryFull, House, ArrowRight, CaretDown, CaretUp,
  CheckCircle, XCircle, Lightbulb, Calculator, Globe
} from '@phosphor-icons/react';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import { autoLink } from '../components/ContentLink';
import SEO from '../components/SEO';

const systemTypes = [
  {
    key: 'grid-tied',
    name: 'Grid-Tied',
    icon: Globe,
    description:
      'A grid-tied system connects your solar panels directly to the utility grid through an inverter. Excess energy generated during the day is fed back to the grid, and you draw from the grid when solar production is insufficient. This is the simplest and most cost-effective type of solar system, but it does not provide backup power during outages.',
    pros: [
      'Lowest upfront cost (no batteries needed)',
      'Net metering potential for bill credits',
      'Simple installation and minimal maintenance',
      'Best return on investment in areas with reliable grid',
    ],
    cons: [
      'No power during grid outages',
      'Dependent on grid availability',
      'Net metering not yet widely available in Zimbabwe',
    ],
    bestFor:
      'Homes and businesses in areas with relatively reliable grid supply who want to reduce electricity bills with the lowest initial investment.',
  },
  {
    key: 'off-grid',
    name: 'Off-Grid',
    icon: BatteryFull,
    description:
      'An off-grid system operates completely independently of the utility grid. Solar panels charge a battery bank during the day, and the batteries supply power when the sun is not shining. This type requires careful sizing to ensure sufficient generation and storage for all your energy needs, including multiple days of cloudy weather.',
    pros: [
      'Complete energy independence',
      'Works anywhere — no grid connection required',
      'Immune to load shedding and grid failures',
      'Ideal for rural and remote locations',
    ],
    cons: [
      'Higher upfront cost due to battery storage',
      'Requires careful load management',
      'Battery replacement costs over time',
      'Must be sized for worst-case scenarios',
    ],
    bestFor:
      'Rural properties without grid access, farms, lodges, and anyone who wants complete independence from ZETDC and the utility grid.',
  },
  {
    key: 'hybrid',
    name: 'Hybrid',
    icon: Lightning,
    description:
      'A hybrid system combines the best of both worlds. It connects to the grid and includes battery storage. Solar power is used first, excess charges the batteries, and the grid serves as a backup. During outages, the batteries provide seamless backup power. This is the most versatile and popular option in Zimbabwe.',
    pros: [
      'Battery backup during load shedding',
      'Optimises solar self-consumption',
      'Grid serves as additional backup',
      'Ready for future net metering',
      'Expandable — add batteries or panels later',
    ],
    cons: [
      'Higher cost than grid-tied (batteries required)',
      'More complex installation',
      'Battery maintenance and eventual replacement',
    ],
    bestFor:
      'Most Zimbabwean homes and businesses. Ideal for anyone who wants reliable power with load shedding protection while staying connected to the grid for additional security.',
  },
];

const componentCards = [
  {
    key: 'panel',
    icon: Sun,
    name: 'Solar Panel',
    shortDesc: 'Converts sunlight into DC electricity',
    details: {
      howItWorks:
        'Solar panels contain photovoltaic cells made from silicon that generate direct current (DC) electricity when exposed to sunlight. Multiple cells are connected in series within each panel to produce usable voltage levels. Modern mono-crystalline panels achieve 20-22% efficiency.',
      types: 'Mono-crystalline (highest efficiency, most popular), Poly-crystalline (slightly lower efficiency, more affordable), Thin-film (flexible, lower efficiency, niche applications).',
      lifespan: '25-30 years with minimal degradation. Most panels retain over 80% output after 25 years.',
      maintenance: 'Clean every 4-6 weeks with water and soft cloth. Professional inspection twice yearly.',
      brands: 'Jinko Solar, JA Solar — both available at Taqon Electrico.',
    },
  },
  {
    key: 'inverter',
    icon: Lightning,
    name: 'Inverter',
    shortDesc: 'Converts DC to AC power for your home',
    details: {
      howItWorks:
        'The inverter converts direct current (DC) from your solar panels and batteries into alternating current (AC) that your household appliances use. Modern hybrid inverters also manage battery charging, grid interaction, and load prioritisation through built-in MPPT charge controllers.',
      types: 'Off-grid (standalone), Grid-tied (synchronises with utility), Hybrid (combines both with battery management). Hybrid inverters are most popular in Zimbabwe.',
      lifespan: '10-15 years. Typically the first major component to need replacement in a solar system.',
      maintenance: 'Keep ventilated and dust-free. Monitor display for error codes weekly. Professional service annually.',
      brands: 'Kodak OG and OG PLUS series, Deye — available at Taqon Electrico.',
    },
  },
  {
    key: 'battery',
    icon: BatteryFull,
    name: 'Battery',
    shortDesc: 'Stores energy for use when the sun is not shining',
    details: {
      howItWorks:
        'Solar batteries store excess energy generated during the day for use at night or during power outages. Lithium Iron Phosphate (LiFePO4) batteries are the current gold standard, offering 6,000+ charge cycles, 80% usable depth of discharge, and built-in battery management systems for safety.',
      types: 'LiFePO4 Lithium (recommended, longest life, most efficient), Lead-acid AGM (lower cost, shorter life), Gel (similar to AGM, better heat tolerance).',
      lifespan: 'LiFePO4: 10+ years / 6,000+ cycles. Lead-acid: 3-5 years / 800-1,200 cycles.',
      maintenance: 'Lithium: minimal — check ventilation and temperature. Lead-acid: monthly electrolyte checks, terminal cleaning.',
      brands: 'Pylontech, Dyness, Deye — all available at Taqon Electrico.',
    },
  },
];

const funFacts = [
  {
    emoji: '1',
    fact: 'Zimbabwe receives over 3,000 hours of sunshine per year, making it one of the most solar-rich countries in the world.',
  },
  {
    emoji: '2',
    fact: 'A single 555W solar panel in Harare can generate over 900 kWh of electricity per year — enough to power LED lighting for an entire household.',
  },
  {
    emoji: '3',
    fact: 'Zimbabwe has set a target of 1,100 MW of renewable energy capacity by 2030, with solar playing a central role in the national energy strategy.',
  },
  {
    emoji: '4',
    fact: 'The cost of solar panels has dropped by over 90% since 2010, making solar energy more affordable than grid electricity for most Zimbabwean households.',
  },
  {
    emoji: '5',
    fact: 'A typical residential solar installation in Zimbabwe pays for itself within 3-5 years through electricity savings, with panels continuing to generate power for 25+ years.',
  },
];

function SolarDiagram() {
  return (
    <div className="relative w-full max-w-3xl mx-auto py-8">
      <svg viewBox="0 0 800 200" className="w-full h-auto" fill="none">
        {/* Sun */}
        <motion.circle
          cx="80"
          cy="100"
          r="40"
          fill="#F59E0B"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        />
        <motion.g
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 80 + Math.cos(rad) * 48;
            const y1 = 100 + Math.sin(rad) * 48;
            const x2 = 80 + Math.cos(rad) * 58;
            const y2 = 100 + Math.sin(rad) * 58;
            return (
              <motion.line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
              />
            );
          })}
        </motion.g>
        <text x="80" y="107" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16">
          SUN
        </text>

        {/* Sun to Panel line */}
        <motion.line
          x1="130"
          y1="100"
          x2="220"
          y2="100"
          stroke="#F26522"
          strokeWidth="3"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
        <motion.polygon
          points="218,94 230,100 218,106"
          fill="#F26522"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
        />

        {/* Panel */}
        <motion.rect
          x="240"
          y="70"
          width="80"
          height="60"
          rx="6"
          fill="#1a3a5c"
          stroke="#F26522"
          strokeWidth="2"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.4 }}
          style={{ transformOrigin: '280px 100px' }}
        />
        <motion.line x1="280" y1="70" x2="280" y2="130" stroke="#4a7a9c" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }} transition={{ delay: 1.3 }} />
        <motion.line x1="260" y1="70" x2="260" y2="130" stroke="#4a7a9c" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }} transition={{ delay: 1.3 }} />
        <motion.line x1="300" y1="70" x2="300" y2="130" stroke="#4a7a9c" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }} transition={{ delay: 1.3 }} />
        <motion.line x1="240" y1="90" x2="320" y2="90" stroke="#4a7a9c" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }} transition={{ delay: 1.3 }} />
        <motion.line x1="240" y1="110" x2="320" y2="110" stroke="#4a7a9c" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 0.5 }} viewport={{ once: true }} transition={{ delay: 1.3 }} />
        <text x="280" y="155" textAnchor="middle" fill="currentColor" fontWeight="bold" fontSize="13" className="fill-taqon-charcoal dark:fill-white">
          PANEL
        </text>

        {/* Panel to Inverter line */}
        <motion.line
          x1="330"
          y1="100"
          x2="420"
          y2="100"
          stroke="#F26522"
          strokeWidth="3"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.5, duration: 0.5 }}
        />
        <motion.polygon
          points="418,94 430,100 418,106"
          fill="#F26522"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.9 }}
        />
        <text x="375" y="88" textAnchor="middle" fill="#F26522" fontSize="10" fontWeight="bold">DC</text>

        {/* Inverter */}
        <motion.rect
          x="440"
          y="70"
          width="80"
          height="60"
          rx="8"
          fill="#F26522"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.8, duration: 0.4 }}
          style={{ transformOrigin: '480px 100px' }}
        />
        <motion.text x="480" y="95" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.1 }}>
          DC → AC
        </motion.text>
        <motion.text x="480" y="110" textAnchor="middle" fill="white" fontSize="9" opacity="0.8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.1 }}>
          INVERTER
        </motion.text>
        <text x="480" y="155" textAnchor="middle" fill="currentColor" fontWeight="bold" fontSize="13" className="fill-taqon-charcoal dark:fill-white">
          INVERTER
        </text>

        {/* Inverter to Home line */}
        <motion.line
          x1="530"
          y1="100"
          x2="620"
          y2="100"
          stroke="#F26522"
          strokeWidth="3"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2.3, duration: 0.5 }}
        />
        <motion.polygon
          points="618,94 630,100 618,106"
          fill="#F26522"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2.7 }}
        />
        <text x="575" y="88" textAnchor="middle" fill="#F26522" fontSize="10" fontWeight="bold">AC</text>

        {/* Home */}
        <motion.g
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 2.5, duration: 0.4 }}
          style={{ transformOrigin: '690px 100px' }}
        >
          {/* Roof */}
          <polygon points="640,85 690,55 740,85" fill="#FF8C42" />
          {/* Walls */}
          <rect x="650" y="85" width="80" height="50" fill="#FFE0C0" rx="2" />
          {/* Door */}
          <rect x="680" y="105" width="20" height="30" fill="#8B6914" rx="2" />
          {/* Window */}
          <rect x="658" y="95" width="16" height="14" fill="#87CEEB" rx="1" />
          <line x1="666" y1="95" x2="666" y2="109" stroke="white" strokeWidth="1" />
          <line x1="658" y1="102" x2="674" y2="102" stroke="white" strokeWidth="1" />
        </motion.g>
        <text x="690" y="155" textAnchor="middle" fill="currentColor" fontWeight="bold" fontSize="13" className="fill-taqon-charcoal dark:fill-white">
          HOME
        </text>
      </svg>
    </div>
  );
}

export default function EnergyHub() {
  const [activeSystem, setActiveSystem] = useState('hybrid');
  const [expandedCard, setExpandedCard] = useState(null);

  return (
    <>
      <SEO
        title="Learn About Solar Energy"
        description="Interactive solar energy education hub. Learn how solar works, explore system types, understand components, and discover solar facts about Zimbabwe."
        keywords="how solar works, solar education, solar system types, grid-tied vs off-grid, solar components, Zimbabwe solar facts"
        canonical="https://www.taqon.co.zw/learn"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Energy Hub
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Learn About <span className="text-gradient">Solar Energy</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              {autoLink('Everything you need to know about solar power, from how it works to choosing the right system for your home or business in Zimbabwe.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* How Solar Works */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient dark:dark-mesh opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              The Basics
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              How Solar <span className="text-gradient">Works</span>
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              {autoLink('Solar energy conversion is simple and elegant. Sunlight hits your panels, is converted to electricity, and powers your home. Here is the process visualized.')}
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-6 lg:p-10 border border-gray-100 dark:border-white/10">
              <SolarDiagram />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                {[
                  { step: '1', title: 'Sunlight', desc: 'Solar radiation reaches your panels at an average of 5-6 peak hours per day in Zimbabwe.' },
                  { step: '2', title: 'DC Generation', desc: 'Photovoltaic cells in the panel convert sunlight into direct current (DC) electricity.' },
                  { step: '3', title: 'Inversion', desc: 'The inverter converts DC to alternating current (AC) that your appliances use.' },
                  { step: '4', title: 'Power Your Home', desc: 'Clean electricity flows to your lights, fridge, TV, and all other household appliances.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center p-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-taqon-orange text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <h4 className="font-bold font-syne text-taqon-charcoal dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-sm text-taqon-muted mt-1">{autoLink(item.desc)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Types of Systems */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              System Types
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Types of Solar <span className="text-gradient">Systems</span>
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              {autoLink('Each system type has its strengths. Choose the one that best fits your location, budget, and energy needs.')}
            </p>
          </AnimatedSection>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 dark:bg-white/10 rounded-2xl p-1.5">
              {systemTypes.map((sys) => (
                <button
                  key={sys.key}
                  onClick={() => setActiveSystem(sys.key)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    activeSystem === sys.key
                      ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                      : 'text-taqon-charcoal dark:text-white/70 hover:text-taqon-orange'
                  }`}
                >
                  <sys.icon size={16} />
                  {sys.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {systemTypes
              .filter((s) => s.key === activeSystem)
              .map((sys) => (
                <motion.div
                  key={sys.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-taqon-cream dark:bg-taqon-dark rounded-3xl p-8 lg:p-10 border border-gray-100 dark:border-white/10"
                >
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                          <sys.icon size={24} className="text-taqon-orange" />
                        </div>
                        <h3 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
                          {sys.name} System
                        </h3>
                      </div>
                      <p className="text-taqon-muted leading-relaxed">{autoLink(sys.description)}</p>

                      <div className="mt-6 p-4 bg-taqon-orange/5 dark:bg-taqon-orange/10 rounded-xl border border-taqon-orange/10">
                        <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm flex items-center gap-2">
                          <Lightbulb size={16} className="text-taqon-orange" />
                          Best For
                        </h4>
                        <p className="mt-1 text-sm text-taqon-muted">{autoLink(sys.bestFor)}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Pros */}
                      <div>
                        <h4 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
                          Advantages
                        </h4>
                        <ul className="space-y-2">
                          {sys.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle
                                size={16}
                                className="text-green-500 flex-shrink-0 mt-0.5"
                              />
                              <span className="text-taqon-charcoal/80 dark:text-white/70">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons */}
                      <div>
                        <h4 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
                          Considerations
                        </h4>
                        <ul className="space-y-2">
                          {sys.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <XCircle
                                size={16}
                                className="text-red-400 flex-shrink-0 mt-0.5"
                              />
                              <span className="text-taqon-charcoal/80 dark:text-white/70">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Component Cards */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient dark:dark-mesh opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Key Components
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Solar System <span className="text-gradient">Components</span>
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              {autoLink('Click on each component to learn how it works, the types available, and what we recommend for Zimbabwean installations.')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {componentCards.map((card, i) => {
              const isExpanded = expandedCard === card.key;
              return (
                <AnimatedSection key={card.key} delay={i * 0.1}>
                  <motion.div
                    layout
                    className={`bg-white dark:bg-taqon-charcoal rounded-3xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                      isExpanded
                        ? 'border-taqon-orange shadow-xl shadow-taqon-orange/10 md:col-span-3'
                        : 'border-gray-100 dark:border-white/10 hover:border-taqon-orange/30 hover:shadow-lg'
                    }`}
                    onClick={() => setExpandedCard(isExpanded ? null : card.key)}
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center">
                            <card.icon size={24} className="text-taqon-orange" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                              {card.name}
                            </h3>
                            <p className="text-sm text-taqon-muted">{card.shortDesc}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CaretDown size={20} className="text-taqon-muted" />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                              {Object.entries(card.details).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="text-sm font-semibold text-taqon-orange uppercase tracking-wider mb-1">
                                    {key === 'howItWorks'
                                      ? 'How It Works'
                                      : key.charAt(0).toUpperCase() + key.slice(1)}
                                  </h4>
                                  <p className="text-sm text-taqon-charcoal/80 dark:text-white/70 leading-relaxed">
                                    {autoLink(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sizing Guide Link */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark:dark-mesh" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-taqon-orange/10 rounded-full blur-[120px]"
        />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="w-20 h-20 rounded-full bg-taqon-orange/20 flex items-center justify-center mx-auto mb-6">
              <Calculator size={32} className="text-taqon-orange" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready to Size <span className="text-gradient">Your System</span>?
            </h2>
            <p className="mt-4 text-gray-500 dark:text-white/50 text-lg max-w-2xl mx-auto">
              {autoLink('Use our interactive savings calculator to estimate the right system size based on your energy consumption, and see how much you could save.')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/calculator"
                className="group inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Open Savings Calculator
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/visualizer"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-all border border-gray-200 dark:border-white/10"
              >
                Try System Visualizer
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Zimbabwe Solar Facts */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Did You Know?
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Zimbabwe Solar <span className="text-gradient">Facts</span>
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {funFacts.map((item, i) => (
              <StaggerItem
                key={i}
                className={i === funFacts.length - 1 && funFacts.length % 3 === 2 ? 'md:col-span-2 lg:col-span-1' : ''}
              >
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-6 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 transition-all h-full">
                  <div className="w-10 h-10 rounded-full bg-taqon-orange text-white font-bold text-lg flex items-center justify-center mb-4">
                    {item.emoji}
                  </div>
                  <p className="text-taqon-charcoal/80 dark:text-white/70 text-sm leading-relaxed">
                    {autoLink(item.fact)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready to Start Your Solar Journey?
            </h2>
            <p className="mt-3 text-taqon-muted max-w-lg mx-auto">
              {autoLink('Now that you understand how solar works, let our experts design the perfect system for your home or business.')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Get a Free Quote <ArrowRight size={16} />
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
              >
                Read Our Blog
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
