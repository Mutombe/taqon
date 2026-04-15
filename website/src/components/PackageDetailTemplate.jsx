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
  FileText,
  DownloadSimple,
  SpinnerGap,
  User,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import AnimatedSection from './AnimatedSection';
import { autoLink, confirmExternalNavigation } from './ContentLink';
import { getGemFamily, getGemByKva } from '../data/gemFamilies';
import { solarConfigApi } from '../api/solarConfig';
import { quotationsApi } from '../api/quotations';
import useAuthStore from '../stores/authStore';
import DepositModal from './DepositModal';
import { getSavedLocation, saveLocation } from '../data/locationSession';

// Icon map for the includes section
const iconMap = {
  SolarPanel: SolarPanel,
  Lightning: Lightning,
  Battery: BatteryCharging,
  Wrench: Wrench,
  BookOpen: BookOpen,
};

/* ─── Quote Modal ─── */

function QuoteModal({ pkg, gem, onClose }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState(() => {
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    const saved = getSavedLocation();
    return {
      name: name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: saved?.area || '',
    };
  });
  const [generating, setGenerating] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pkgSlug = pkg._apiData?.slug || pkg.slug;
  const pkgName = pkg._apiData?.family?.name || pkg._apiData?.name || pkg.name;
  const distanceKm = parseFloat(pkg._apiData?.distance_km || 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!form.address.trim()) {
      toast.error('Please enter the installation location.');
      return;
    }
    saveLocation({ area: form.address.trim(), distanceKm });
    setGenerating(true);
    try {
      const res = await solarConfigApi.getInstantQuote({
        package_slug: pkgSlug,
        distance_km: distanceKm,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_address: form.address,
        tier_label: pkg._apiData?.tier || pkg.tier || 'Standard',
      });
      const contentType = res.headers['content-type'] || 'application/pdf';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taqon-Quote-${pkgName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Quote downloaded!');

      // Background: submit QuotationRequest so admin has a record
      quotationsApi.submitRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: `Instant quote requested from package detail page for ${pkgName}. Address: ${form.address || 'N/A'}`,
        property_type: 'residential',
        roof_type: 'pitched',
        monthly_bill: 0,
        budget_range: '$1000-$3000',
        appliances: [],
      }).catch(() => {}); // silent

      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate quote');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gem accent */}
        <div className="relative p-6 border-b border-gray-100 dark:border-white/10">
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, transparent, ${gem.accent}, transparent)` }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors"
          >
            <X size={14} weight="bold" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)` }}
            >
              <FileText size={20} style={{ color: gem.accent }} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">
                Get Your Quote
              </h3>
              <p className="text-xs text-taqon-muted dark:text-white/50 mt-0.5">
                {pkgName} &middot; {pkg.price}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-taqon-muted dark:text-white/60 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="John Doe"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-taqon-muted dark:text-white/60 uppercase tracking-wider mb-1.5">
              Email *
            </label>
            <div className="relative">
              <EnvelopeSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-taqon-muted dark:text-white/60 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+263..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-taqon-muted dark:text-white/60 uppercase tracking-wider mb-1.5">
                Installation location *
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="e.g. Borrowdale, Harare"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-taqon-muted dark:text-white/40">Pre-filled if you've already chosen an area in the Solar Advisor.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: gem.accent, boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}` }}
            >
              {generating ? (
                <><SpinnerGap size={14} className="animate-spin" /> Generating...</>
              ) : (
                <><DownloadSimple size={14} weight="bold" /> Download Quote</>
              )}
            </button>
          </div>

          <p className="text-[10px] text-taqon-muted dark:text-white/40 text-center pt-1">
            Your quote includes all components, labour, and transport to your area.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function PackageDetailTemplate({ package: pkg, allPackages }) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Resolve gem identity from family slug or kVA
  const apiData = pkg._apiData;
  const gem = apiData
    ? getGemFamily(apiData.family_slug || apiData.slug) || getGemByKva(apiData.inverter_kva)
    : getGemByKva(parseFloat(pkg.kvaRating));

  const priceBreakdown = pkg._priceBreakdown;
  const siblings = pkg._siblings || [];

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 600);
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
      <section className="relative bg-taqon-dark pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        {/* Gem-colored glow orb */}
        <div
          className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: gem.accent }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link to="/packages" className="text-white/50 hover:text-taqon-orange transition-colors">
              Packages
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white font-medium truncate">{pkg.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left column — Info */}
            <div>
              {/* Gem + tier badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <span className={`gem-badge ${gem.badgeBg} ${gem.badgeText}`}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: gem.accent }} />
                  {gem.gem}
                </span>
                {pkg.popular && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">
                    <Star size={12} weight="fill" className="text-amber-400" /> Popular
                  </span>
                )}
              </motion.div>

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
              {pkg.fullDescription && pkg.fullDescription !== pkg.description && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4">
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
                    className="mt-2 flex items-center gap-1 text-sm font-semibold hover:underline transition-colors"
                    style={{ color: gem.accent }}
                  >
                    {expanded ? 'Read Less' : 'Read More'}
                    {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                  </button>
                </motion.div>
              )}

              {/* Price */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <span className="text-4xl font-bold font-syne text-white">{pkg.price}</span>
                {priceBreakdown && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/40">
                    <span>Materials: <span className="text-white/60 tabular-nums">${parseFloat(priceBreakdown.material).toLocaleString()}</span></span>
                    <span>Labour &amp; Transport: <span className="text-white/60 tabular-nums">${(parseFloat(priceBreakdown.labour) + parseFloat(priceBreakdown.transport)).toLocaleString()}</span></span>
                  </div>
                )}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl transition-all shadow-lg hover:brightness-110 active:scale-[0.98]"
                  style={{ backgroundColor: gem.accent, boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}` }}
                >
                  <DownloadSimple size={16} weight="bold" /> Get a Quote
                </button>
                {priceBreakdown?.total > 0 && (
                  <button
                    onClick={() => setDepositModalOpen(true)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-taqon-charcoal font-semibold rounded-xl transition-all shadow-lg hover:bg-white/90 active:scale-[0.98]"
                  >
                    Pay 20% Deposit · USD {(parseFloat(priceBreakdown.total) * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </button>
                )}
                <a
                  href="tel:+263772771036"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all font-medium"
                >
                  <Phone size={16} /> +263 77 277 1036
                </a>
              </motion.div>
            </div>

            {/* Right column — Specs card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-3xl p-8 border-2 bg-white dark:bg-taqon-charcoal overflow-hidden"
              style={{ borderColor: `color-mix(in srgb, ${gem.accent} 30%, transparent)` }}
            >
              {/* Subtle gem gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gem.gradient} pointer-events-none`} />

              <div className="relative z-10">
                {/* Specs grid */}
                {apiData && (
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className={`gem-spec ${gem.specBg} !p-4 text-center`}>
                      <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white tabular-nums">
                        {apiData.inverter_kva || '—'}
                      </p>
                      <p className="text-xs text-taqon-muted dark:text-white/40 font-medium mt-1">kVA</p>
                    </div>
                    <div className={`gem-spec ${gem.specBg} !p-4 text-center`}>
                      <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white tabular-nums">
                        {apiData.battery_capacity_kwh || '—'}
                      </p>
                      <p className="text-xs text-taqon-muted dark:text-white/40 font-medium mt-1">kWh</p>
                    </div>
                    {apiData.panel_count > 0 && (
                      <div className={`gem-spec ${gem.specBg} !p-4 text-center`}>
                        <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white tabular-nums">
                          {apiData.panel_count}
                        </p>
                        <p className="text-xs text-taqon-muted dark:text-white/40 font-medium mt-1">Panels</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Power capacity bar */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4 uppercase tracking-wider">
                    Power Capacity
                  </h3>
                  <div className="relative">
                    <div className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10 w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pkg.capacityPercent}%` }}
                        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${gem.accentLight}, ${gem.accent}, ${gem.accentDark})` }}
                      />
                    </div>
                    <motion.div
                      initial={{ left: 0, opacity: 0 }}
                      animate={{ left: `${pkg.capacityPercent}%`, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full ring-4"
                      style={{ backgroundColor: gem.accent, ringColor: `color-mix(in srgb, ${gem.accent} 25%, transparent)` }}
                    />
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
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)` }}
                        >
                          <Check size={12} weight="bold" style={{ color: gem.accent }} />
                        </div>
                        <span className="text-sm text-taqon-charcoal/80 dark:text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variant siblings */}
                {siblings.length > 1 && (
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                    <h3 className="text-xs font-semibold text-taqon-muted dark:text-white/40 uppercase tracking-wider mb-3">
                      Other Variants
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {siblings.map((s) => (
                        <Link
                          key={s.slug}
                          to={`/packages/${s.slug}`}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            s.slug === pkg.slug
                              ? 'text-white'
                              : 'bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                          }`}
                          style={s.slug === pkg.slug ? { backgroundColor: gem.accent } : undefined}
                        >
                          {s.variant_name || s.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigate between packages */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between">
                  {prevPackage ? (
                    <Link
                      to={`/packages/${prevPackage.slug}`}
                      className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50 hover:text-taqon-orange transition-colors"
                    >
                      <ArrowLeft size={14} /> {prevPackage.name}
                    </Link>
                  ) : <span />}
                  {nextPackage ? (
                    <Link
                      to={`/packages/${nextPackage.slug}`}
                      className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50 hover:text-taqon-orange transition-colors"
                    >
                      {nextPackage.name} <ArrowRight size={14} />
                    </Link>
                  ) : <span />}
                </div>
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
            {pkg.includes.slice(0, 2).map((item, i) => {
              const IconComponent = iconMap[item.icon] || Lightning;
              return (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative p-8 rounded-3xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10 h-full overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gem.gradient} pointer-events-none opacity-50`} />
                    <div className="relative z-10">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                        style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 12%, transparent)` }}
                      >
                        <IconComponent size={24} style={{ color: gem.accent }} />
                      </div>
                      <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">{item.name}</h3>
                      <p className="mt-3 text-taqon-charcoal/70 dark:text-white/60 leading-relaxed">{autoLink(item.description)}</p>
                      <div
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 10%, transparent)`, color: gem.accent }}
                      >
                        {item.warranty}
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Bottom items — smaller cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {pkg.includes.slice(2).map((item, i) => {
              const IconComponent = iconMap[item.icon] || Lightning;
              return (
                <AnimatedSection key={i} delay={(i + 2) * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative p-6 rounded-3xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10 h-full"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 12%, transparent)` }}
                    >
                      <IconComponent size={20} style={{ color: gem.accent }} />
                    </div>
                    <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">{item.name}</h3>
                    <p className="mt-2 text-sm text-taqon-charcoal/70 dark:text-white/60 leading-relaxed">{autoLink(item.description)}</p>
                    <div
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 10%, transparent)`, color: gem.accent }}
                    >
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

          <div className="mt-12">
            <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Check size={16} weight="bold" style={{ color: gem.accent }} />
              Included Appliances
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pkg.appliances.map((appliance, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-taqon-charcoal border border-gray-100 dark:border-white/10">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 12%, transparent)` }}
                    >
                      <Check size={14} weight="bold" style={{ color: gem.accent }} />
                    </div>
                    <span className="text-sm font-medium text-taqon-charcoal dark:text-white">{appliance}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

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
                      <span className="text-sm font-medium text-taqon-charcoal dark:text-white">{appliance}</span>
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
        <section
          className="py-12 border-y"
          style={{
            backgroundColor: `color-mix(in srgb, ${gem.accent} 8%, var(--tw-bg-taqon-charcoal, #1A1A1A))`,
            borderColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)`,
          }}
        >
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
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all font-semibold text-sm border"
              style={{
                borderColor: `color-mix(in srgb, ${gem.accent} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)`,
              }}
            >
              Compare All Packages <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Quote CTA ── */}
      <section className="py-20 lg:py-28 bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark-mesh opacity-50" />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] opacity-15 pointer-events-none"
          style={{ background: gem.accent }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <span style={{ color: gem.accent }} className="text-sm font-semibold uppercase tracking-[0.15em]">
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
              <button
                onClick={() => setQuoteModalOpen(true)}
                className="inline-flex items-center gap-2 px-10 py-4 text-white font-bold rounded-xl transition-all shadow-lg text-lg hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: gem.accent, boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}` }}
              >
                <DownloadSimple size={18} weight="bold" /> Get Your Quote
              </button>
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
            {[
              { icon: MapPin, title: 'Visit Us', lines: ['203 Sherwood Drive, Strathaven, Harare'] },
              { icon: Phone, title: 'Call Us', lines: ['+263 77 277 1036'] },
              { icon: WhatsappLogo, title: 'WhatsApp', lines: ['+263 77 277 1036'] },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 12%, transparent)` }}
                  >
                    <item.icon size={20} style={{ color: gem.accent }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-taqon-charcoal dark:text-white text-sm">{item.title}</h4>
                    {item.lines.map((line, j) => (
                      <p key={j} className="text-sm text-taqon-muted dark:text-white/50">{line}</p>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
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
                <p className="text-sm font-bold text-taqon-charcoal dark:text-white font-syne">{pkg.price}</p>
                <p className="text-xs text-taqon-muted dark:text-white/50">{pkg.name}</p>
              </div>
              <button
                onClick={() => setQuoteModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-semibold rounded-xl transition-all shadow-lg text-sm hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: gem.accent, boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}` }}
              >
                <DownloadSimple size={14} weight="bold" /> Get Quote
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quote Modal ── */}
      <AnimatePresence>
        {quoteModalOpen && (
          <QuoteModal
            pkg={pkg}
            gem={gem}
            onClose={() => setQuoteModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {depositModalOpen && pkg._apiData && (
          <DepositModal
            pkg={{
              slug: pkg._apiData.slug,
              name: pkg._apiData.name,
              family_name: pkg._apiData.family?.name || pkg._apiData.name,
              tier: pkg._apiData.tier,
            }}
            tierLabel={pkg._apiData.tier || ''}
            packageTotal={parseFloat(priceBreakdown?.total || 0)}
            distanceKm={parseFloat(pkg._apiData?.distance_km || 10)}
            onClose={() => setDepositModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
