import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SolarPanel,
  Lightning,
  BatteryCharging,
  Wrench,
  BookOpen,
  CaretDown,
  CaretUp,
  Phone,
  WhatsappLogo,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Star,
} from '@phosphor-icons/react';
import AnimatedSection from './AnimatedSection';
import { autoLink, confirmExternalNavigation } from './ContentLink';

// Icon map for the includes section
const iconMap = {
  SolarPanel: SolarPanel,
  Lightning: Lightning,
  Battery: BatteryCharging,
  Wrench: Wrench,
  BookOpen: BookOpen,
};

// Tier badge config
const tierConfig = {
  starter: {
    label: 'Starter',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  },
  popular: {
    label: 'Most Popular',
    className: 'bg-taqon-orange/10 text-taqon-orange dark:bg-taqon-orange/20 dark:text-taqon-orange',
  },
  premium: {
    label: 'Premium',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  },
  commercial: {
    label: 'Commercial',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
};

export default function PackageDetailTemplate({ package: pkg, allPackages }) {
  const [expanded, setExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const tier = tierConfig[pkg.tier] || tierConfig.starter;

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Find related packages
  const prevPackage = pkg.relatedPackages[0]
    ? allPackages.find((p) => p.slug === pkg.relatedPackages[0])
    : null;
  const nextPackage = pkg.relatedPackages[1]
    ? allPackages.find((p) => p.slug === pkg.relatedPackages[1])
    : null;

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative bg-taqon-dark pt-28 pb-16 lg:pt-36 lg:pb-20">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link
              to="/packages"
              className="text-white/50 hover:text-taqon-orange transition-colors"
            >
              Packages
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white font-medium truncate">
              {pkg.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left column — Info */}
            <div>
              {/* Tier badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.className}`}
              >
                {pkg.popular && <Star size={12} weight="fill" />}
                {tier.label}
              </motion.span>

              {/* Package name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-4xl lg:text-5xl font-bold font-syne text-white"
              >
                {pkg.name}
              </motion.h1>

              {/* kVA subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-2 text-lg text-white/50"
              >
                {pkg.kvaRating} Solar Power System
              </motion.p>

              {/* Short description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-white/70 leading-relaxed"
              >
                {autoLink(pkg.description)}
              </motion.p>

              {/* Expandable full description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-4"
              >
                <AnimatePresence>
                  {expanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="text-white/60 leading-relaxed overflow-hidden"
                    >
                      {autoLink(pkg.fullDescription, { maxLinks: 5 })}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 flex items-center gap-1 text-taqon-orange text-sm font-semibold hover:underline transition-colors"
                >
                  {expanded ? 'Read Less' : 'Read More'}
                  {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                </button>
              </motion.div>

              {/* Price */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <span className="text-4xl font-bold font-syne text-white">
                  {pkg.price}
                </span>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <Link
                  to="/solar-advisor"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-taqon-orange text-white font-semibold rounded-xl hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25"
                >
                  Get a Quote <ArrowRight size={16} />
                </Link>
                <a
                  href="tel:+263242304860"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all font-medium"
                >
                  <Phone size={16} /> +263 242 304860
                </a>
              </motion.div>
            </div>

            {/* Right column — Capacity bar & features */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm"
            >
              {/* Capacity bar */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4 uppercase tracking-wider">
                  Power Capacity
                </h3>
                <div className="relative">
                  {/* Bar background */}
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 w-full">
                    {/* Filled portion */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pkg.capacityPercent}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-taqon-orange to-red-500"
                    />
                  </div>
                  {/* Dot indicator */}
                  <motion.div
                    initial={{ left: 0, opacity: 0 }}
                    animate={{ left: `${pkg.capacityPercent}%`, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-taqon-orange ring-4 ring-taqon-orange/20"
                  />
                  {/* Labels */}
                  <div className="flex justify-between mt-3 text-xs text-taqon-muted dark:text-white/40">
                    <span>Starter</span>
                    <span>{pkg.capacityPercent}%</span>
                    <span>Commercial</span>
                  </div>
                </div>
              </div>

              {/* Key features */}
              <div>
                <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4 uppercase tracking-wider">
                  Key Features
                </h3>
                <div className="space-y-3">
                  {pkg.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-taqon-orange" weight="bold" />
                      </div>
                      <span className="text-sm text-taqon-charcoal/80 dark:text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigate between packages */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between">
                {prevPackage ? (
                  <Link
                    to={`/packages/${prevPackage.slug}`}
                    className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50 hover:text-taqon-orange transition-colors"
                  >
                    <ArrowLeft size={14} /> {prevPackage.name}
                  </Link>
                ) : (
                  <span />
                )}
                {nextPackage ? (
                  <Link
                    to={`/packages/${nextPackage.slug}`}
                    className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50 hover:text-taqon-orange transition-colors"
                  >
                    {nextPackage.name} <ArrowRight size={14} />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="py-16 lg:py-24 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white text-center">
              What's <span className="text-gradient">Included</span>
            </h2>
            <p className="mt-3 text-taqon-muted dark:text-white/50 text-center max-w-xl mx-auto">
              {autoLink('Every package comes with everything you need for a complete solar installation.')}
            </p>
          </AnimatedSection>

          {/* Bento grid: 2 large top, 3 bottom */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First 2 items — large cards */}
            {pkg.includes.slice(0, 2).map((item, i) => {
              const IconComponent = iconMap[item.icon] || Lightning;
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative p-8 rounded-3xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10 h-full"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-5">
                      <IconComponent size={24} className="text-taqon-orange" />
                    </div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-taqon-charcoal/70 dark:text-white/60 leading-relaxed">
                      {autoLink(item.description)}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-taqon-orange bg-taqon-orange/10 px-3 py-1 rounded-full">
                      {item.warranty}
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Bottom 3 items — smaller cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {pkg.includes.slice(2).map((item, i) => {
              const IconComponent = iconMap[item.icon] || Lightning;
              return (
                <AnimatedSection key={i} delay={(i + 2) * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative p-6 rounded-3xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10 h-full"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-4">
                      <IconComponent size={20} className="text-taqon-orange" />
                    </div>
                    <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-taqon-charcoal/70 dark:text-white/60 leading-relaxed">
                      {autoLink(item.description)}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-taqon-orange bg-taqon-orange/10 px-3 py-1 rounded-full">
                      {item.warranty}
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Appliances It Can Power ── */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white text-center">
              What It Can <span className="text-gradient">Power</span>
            </h2>
            <p className="mt-3 text-taqon-muted dark:text-white/50 text-center max-w-xl mx-auto">
              {autoLink('Here\'s everything this package can handle — and what you\'d need to upgrade for.')}
            </p>
          </AnimatedSection>

          {/* Powered appliances */}
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Check size={16} className="text-emerald-500" weight="bold" />
              Included Appliances
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pkg.appliances.map((appliance, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-taqon-charcoal border border-gray-100 dark:border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-emerald-500" weight="bold" />
                    </div>
                    <span className="text-sm font-medium text-taqon-charcoal dark:text-white">
                      {appliance}
                    </span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Can't power */}
          {pkg.cantPower && pkg.cantPower.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight size={16} className="text-taqon-muted" />
                Upgrade Required
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {pkg.cantPower.map((appliance, i) => (
                  <AnimatedSection key={i} delay={i * 0.05}>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 dark:bg-taqon-charcoal/50 border border-gray-100 dark:border-white/5 opacity-40">
                      <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <X size={14} className="text-gray-400 dark:text-white/30" weight="bold" />
                      </div>
                      <span className="text-sm font-medium text-taqon-charcoal dark:text-white">
                        {appliance}
                      </span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Comparison Strip ── */}
      <AnimatedSection>
        <section className="py-12 bg-taqon-charcoal dark:bg-taqon-dark border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold font-syne text-white">
                Not sure if this is the right package?
              </h3>
              <p className="mt-1 text-white/50 text-sm">
                {autoLink('Compare all packages side by side to find your perfect match.')}
              </p>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-semibold text-sm border border-white/20"
            >
              Compare All Packages <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Quote CTA ── */}
      <section className="py-20 lg:py-28 bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark-mesh opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Ready to go solar?
            </span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-bold font-syne text-white">
              Get Your {pkg.name}
            </h2>
            <p className="mt-4 text-white/60 max-w-lg mx-auto">
              Starting at{' '}
              <span className="text-white font-bold text-2xl">{pkg.price}</span>
              . Our team will design a system perfectly tailored to your property.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/solar-advisor"
                className="inline-flex items-center gap-2 px-10 py-4 bg-taqon-orange text-white font-bold rounded-xl hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25 text-lg"
              >
                Get Your Quote <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/263772771036"
                onClick={(e) => confirmExternalNavigation('https://wa.me/263772771036', e)}
                className="inline-flex items-center gap-2 px-6 py-4 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all font-semibold cursor-pointer"
              >
                <WhatsappLogo size={20} /> WhatsApp Us
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Contact Info ── */}
      <section className="py-12 bg-taqon-cream dark:bg-taqon-charcoal border-t border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-taqon-orange" />
                </div>
                <div>
                  <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm">
                    Visit Us
                  </h4>
                  <p className="mt-1 text-sm text-taqon-muted dark:text-white/50">
                    876 Ringwood Drive, Strathaven, Harare
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-taqon-orange" />
                </div>
                <div>
                  <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm">
                    Call Us
                  </h4>
                  <p className="mt-1 text-sm text-taqon-muted dark:text-white/50">
                    +263 242 304860
                    <br />
                    +263 8644 290 072
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                  <WhatsappLogo size={20} className="text-taqon-orange" />
                </div>
                <div>
                  <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm">
                    WhatsApp
                  </h4>
                  <p className="mt-1 text-sm text-taqon-muted dark:text-white/50">
                    +263 772 771 036
                    <br />
                    +263 8644 290 072
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-taqon-charcoal border-t border-gray-200 dark:border-white/10 px-4 py-3 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-taqon-charcoal dark:text-white font-syne">
                  {pkg.price}
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/50">{pkg.name}</p>
              </div>
              <Link
                to="/solar-advisor"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-taqon-orange text-white font-semibold rounded-xl hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25 text-sm"
              >
                Get Quote <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
