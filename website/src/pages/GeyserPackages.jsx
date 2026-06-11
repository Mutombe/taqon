import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Sun, Drop, Lightning, Check, ArrowRight, Sparkle, ShieldCheck, Wrench, SpinnerGap,
} from '@phosphor-icons/react';
import SEO from '../components/SEO';
import AnimatedSection from '../components/AnimatedSection';
import { geysersApi } from '../api/geysers';

const fmt = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const SYSTEMS = [
  { key: 'all', label: 'All' },
  { key: 'gravity', label: 'Gravity (Non-Pressure)' },
  { key: 'pressure', label: 'Pressure' },
];
const VARIANTS = [
  { key: 'all', label: 'All' },
  { key: 'standard', label: 'Standard' },
  { key: 'smart', label: 'Smart' },
];

function GeyserCard({ p }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="group relative bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6 flex flex-col hover:shadow-xl hover:shadow-taqon-orange/5 hover:-translate-y-1 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${p.system_type === 'pressure' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          {p.system_type === 'pressure' ? 'Pressure' : 'Gravity'}
        </span>
        {p.is_smart && (
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-taqon-orange/15 text-taqon-orange flex items-center gap-1">
            <Sparkle size={11} weight="fill" /> Smart
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-syne font-extrabold text-3xl text-taqon-dark dark:text-white">{p.capacity_litres}L</span>
        <span className="text-sm text-taqon-dark/50 dark:text-white/50">{p.brand}</span>
      </div>
      <h3 className="font-syne font-bold text-base text-taqon-dark dark:text-white">{p.name}</h3>
      <p className="text-sm text-taqon-dark/60 dark:text-white/60 mt-1 flex-1">{p.short_description}</p>
      <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-taqon-dark/40 dark:text-white/40 uppercase tracking-wide">Installed price</p>
          <p className="font-syne font-extrabold text-2xl text-taqon-orange">{fmt(p.price)}</p>
        </div>
        <Link to={`/solar-geysers/${p.slug}`} className="flex items-center gap-1 text-sm font-semibold text-taqon-dark dark:text-white group-hover:text-taqon-orange transition-colors">
          View <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function GeyserPackages() {
  const [system, setSystem] = useState('all');
  const [variant, setVariant] = useState('all');

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['geyserPackages'],
    queryFn: () => geysersApi.getPackages().then((r) => r.data),
  });

  const filtered = useMemo(() => packages.filter(
    (p) => (system === 'all' || p.system_type === system) && (variant === 'all' || p.variant === variant),
  ), [packages, system, variant]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark">
      <SEO
        title="Solar Geyser Packages"
        description="16 complete solar geyser packages — gravity & pressure, 100L–300L, standard & smart. Free hot water from the sun, supplied and installed across Zimbabwe by Taqon Electrico."
        keywords="solar geyser Zimbabwe, solar geyser packages, solar water heater Harare, pressure solar geyser, gravity solar geyser, smart solar geyser, Suntask, Ecosolar, 100L 150L 200L 300L solar geyser price"
        image="/geysers/solar-geyser-01.jpg"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/geysers/solar-geyser-01.jpg" alt="Solar geyser installation in Zimbabwe" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/80 via-taqon-dark/70 to-taqon-dark/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-taqon-orange bg-taqon-orange/15 px-3 py-1.5 rounded-full">
              <Sun size={14} weight="fill" /> Solar Geysers
            </span>
            <h1 className="font-syne font-extrabold text-4xl sm:text-6xl text-white mt-5 leading-tight">
              Free Hot Water<br />From the Sun
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto mt-5 text-lg">
              16 complete solar geyser packages — gravity &amp; pressure, 100L to 300L, in Standard and Smart versions.
              Supplied and professionally installed across Zimbabwe.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a href="#packages" className="px-6 py-3 rounded-full bg-taqon-orange text-white font-semibold hover:bg-taqon-orange/90 transition-colors">Browse packages</a>
              <Link to="/inquiry?source=solar-geysers" className="px-6 py-3 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Get a quote</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advisor — coming soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 shadow-xl shadow-black/5">
          <div className="w-14 h-14 rounded-2xl bg-taqon-orange/15 flex items-center justify-center flex-shrink-0">
            <Sparkle size={26} className="text-taqon-orange" weight="fill" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-syne font-bold text-lg text-taqon-dark dark:text-white">Solar Geyser Advisor</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-taqon-orange/15 text-taqon-orange">Coming soon</span>
            </div>
            <p className="text-sm text-taqon-dark/60 dark:text-white/60 mt-1">
              Answer a few quick questions and we'll recommend the perfect geyser for your household. In the meantime, browse the packages below or ask our team.
            </p>
          </div>
          <Link to="/inquiry?source=solar-geysers" className="px-5 py-2.5 rounded-full bg-taqon-dark dark:bg-white text-white dark:text-taqon-dark font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
            Ask our team
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Sun, t: 'Cut your power bill', d: 'Heat water with free sunshine, not the grid.' },
            { icon: ShieldCheck, t: 'Quality collectors', d: 'Suntask, Ecosolar & Electrosales with local support.' },
            { icon: Wrench, t: 'Fully installed', d: 'Plumbing, mounting & commissioning all included.' },
          ].map((b) => (
            <div key={b.t} className="flex items-start gap-3 p-4 rounded-2xl bg-white/60 dark:bg-white/5">
              <b.icon size={22} className="text-taqon-orange flex-shrink-0 mt-0.5" weight="duotone" />
              <div>
                <p className="font-semibold text-sm text-taqon-dark dark:text-white">{b.t}</p>
                <p className="text-xs text-taqon-dark/55 dark:text-white/55">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <AnimatedSection>
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl text-taqon-dark dark:text-white">Choose your package</h2>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-1">
                {SYSTEMS.map((s) => (
                  <button key={s.key} onClick={() => setSystem(s.key)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${system === s.key ? 'bg-white dark:bg-taqon-charcoal text-taqon-orange shadow' : 'text-taqon-dark/60 dark:text-white/60'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-1">
                {VARIANTS.map((v) => (
                  <button key={v.key} onClick={() => setVariant(v.key)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${variant === v.key ? 'bg-white dark:bg-taqon-charcoal text-taqon-orange shadow' : 'text-taqon-dark/60 dark:text-white/60'}`}>
                    {v.key === 'smart' && <Sparkle size={12} weight="fill" />}{v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20 text-taqon-orange"><SpinnerGap size={32} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-taqon-dark/50 dark:text-white/50 py-20">No packages match that filter.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((p) => <GeyserCard key={p.id} p={p} />)}
            </div>
          )}
        </AnimatedSection>

        {/* Smart explainer */}
        <AnimatedSection>
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-taqon-orange/10 to-transparent border border-taqon-orange/15 p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkle size={20} className="text-taqon-orange" weight="fill" />
              <h3 className="font-syne font-bold text-xl text-taqon-dark dark:text-white">What makes a Smart geyser smart?</h3>
            </div>
            <p className="text-sm text-taqon-dark/65 dark:text-white/65 max-w-3xl">
              The Smart versions add an intelligent solar geyser controller for hands-off comfort and bigger savings:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {[
                'Intelligent temperature management',
                'Automatic water temperature maintenance',
                'Up to 5 programmable heating schedules per day',
                'Improved electricity savings and comfort',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={18} className="text-taqon-orange flex-shrink-0 mt-0.5" weight="bold" />
                  <span className="text-sm text-taqon-dark/75 dark:text-white/75">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
