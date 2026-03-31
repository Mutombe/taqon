import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightning, Plus, Minus, ArrowRight, ArrowLeft,
  MapPin, Check, Star, Lightbulb, CookingPot, Television,
  Thermometer, TShirt, Drop, Desktop, ShieldCheck,
  Tree, DotsThree, MagnifyingGlass, SpinnerGap,
  CaretDown, CaretUp, Info, X, CaretLeft, CaretRight,
  Terminal, BatteryCharging, Cpu, CurrencyDollar,
  CheckCircle, GearSix, Funnel, FileText, DownloadSimple,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { solarConfigApi } from '../api/solarConfig';
import { quotationsApi } from '../api/quotations';

/* ─── Constants ─── */

const NAVBAR_HEIGHT = 80; // lg:h-20 = 80px
const SIDEBAR_TOP = NAVBAR_HEIGHT + 24; // 24px breathing room below navbar

const categoryIcons = {
  lighting: Lightbulb,
  kitchen: CookingPot,
  entertainment: Television,
  cooling: Thermometer,
  laundry: TShirt,
  water: Drop,
  office: Desktop,
  security: ShieldCheck,
  outdoor: Tree,
  other: DotsThree,
};

const tierLabels = { budget: 'Budget', good_fit: 'Good Fit', excellent: 'Excellent' };
const tierColors = {
  budget: 'border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5',
  good_fit: 'border-taqon-orange ring-2 ring-taqon-orange/20 bg-taqon-orange/5 dark:bg-taqon-orange/10',
  excellent: 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5',
};
const tierBadgeColors = {
  budget: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  good_fit: 'bg-taqon-orange/10 text-taqon-orange',
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
};

const stepTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};


/* ─── Horizontally scrollable category tabs with edge-fade indicators ─── */

function CategoryTabs({ categories, activeCategory, onSelect, onClearSearch }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, categories]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-4 sm:mb-6">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-10 z-10 bg-gradient-to-r from-taqon-cream dark:from-taqon-dark to-transparent pointer-events-none lg:hidden" />
      )}
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-taqon-charcoal shadow-md border border-gray-200 dark:border-white/10 flex items-center justify-center text-taqon-muted hover:text-taqon-orange transition-colors lg:hidden"
          aria-label="Scroll categories left"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.solar-tabs::-webkit-scrollbar { display: none; }`}</style>
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.value] || DotsThree;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => { onSelect(cat.value); onClearSearch(); }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 min-h-[44px] ${
                isActive
                  ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                  : 'bg-white dark:bg-taqon-charcoal text-taqon-muted dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
              }`}
            >
              <Icon size={16} />
              {cat.label}
              <span className={`text-[10px] ml-0.5 ${isActive ? 'text-white/70' : 'opacity-50'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-10 z-10 bg-gradient-to-l from-taqon-cream dark:from-taqon-dark to-transparent pointer-events-none lg:hidden" />
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-taqon-charcoal shadow-md border border-gray-200 dark:border-white/10 flex items-center justify-center text-taqon-muted hover:text-taqon-orange transition-colors lg:hidden"
          aria-label="Scroll categories right"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}


/* ─── Mobile Bottom Bar (expandable) ─── */

function MobileBottomBar({ totals, hasSelections, selections, appliances, onNext, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const selectedItems = Object.entries(selections).filter(([, qty]) => qty > 0);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Expandable selected items panel */}
      <AnimatePresence>
        {expanded && selectedItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-taqon-charcoal border-t border-x border-gray-200 dark:border-white/10 rounded-t-2xl overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold font-syne text-taqon-charcoal dark:text-white">
                  Selected Appliances ({selectedItems.length})
                </h4>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white transition-colors"
                  aria-label="Close selection panel"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
                {selectedItems.map(([id, qty]) => {
                  const a = appliances.find((app) => app.id === id);
                  return a ? (
                    <div
                      key={id}
                      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-taqon-charcoal dark:text-white/80 truncate mr-3 flex-1">
                        {a.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-taqon-muted dark:text-white/40 font-semibold tabular-nums">
                          x{qty}
                        </span>
                        <button
                          onClick={() => onRemove(id)}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center active:scale-95 transition-all"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar — with safe area padding for iOS */}
      <div
        className="bg-white dark:bg-taqon-charcoal border-t border-gray-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="px-4 pt-3 pb-1">
          {/* Score summary row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              disabled={!hasSelections}
              className="flex items-center gap-3 min-w-0 disabled:opacity-50 min-h-[44px]"
              aria-label={expanded ? 'Collapse selection' : 'Expand selection'}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-taqon-orange/10 flex items-center justify-center">
                  <Lightning size={18} className="text-taqon-orange" />
                </div>
                {totals.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-taqon-orange text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {totals.count}
                  </span>
                )}
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-taqon-orange tabular-nums">PP {totals.pp}</span>
                  <span className="text-gray-300 dark:text-white/20">|</span>
                  <span className="text-sm font-bold text-taqon-orange tabular-nums">EP {totals.ep}</span>
                </div>
                <p className="text-xs text-taqon-muted dark:text-white/40 truncate">
                  {hasSelections
                    ? `${totals.count} appliance${totals.count !== 1 ? 's' : ''} selected`
                    : 'No appliances selected'}
                </p>
              </div>
              {hasSelections && (
                <span className="shrink-0 ml-1">
                  {expanded
                    ? <CaretDown size={14} className="text-taqon-muted" />
                    : <CaretUp size={14} className="text-taqon-muted" />
                  }
                </span>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasSelections}
              className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm disabled:opacity-40 shadow-lg shadow-taqon-orange/25 active:scale-95 transition-all min-h-[44px]"
            >
              Next <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          {/* Mini progress bars */}
          {hasSelections && (
            <div className="flex gap-2 mt-2.5">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-taqon-muted dark:text-white/30 mb-0.5">
                  <span>Power</span>
                  <span>{totals.pp}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-taqon-orange transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(totals.pp) / 30) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-taqon-muted dark:text-white/30 mb-0.5">
                  <span>Energy</span>
                  <span>{totals.ep}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-taqon-orange transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(totals.ep) / 35) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Desktop Sticky Sidebar ─── */

function DesktopSidebar({ totals, hasSelections, selections, appliances, onUpdateQty, onNext }) {
  return (
    <div className="hidden lg:block w-[280px] shrink-0">
      <div
        className="sticky"
        style={{
          top: `${SIDEBAR_TOP}px`,
          maxHeight: `calc(100vh - ${SIDEBAR_TOP + 24}px)`,
        }}
      >
        <div className="rounded-2xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col"
          style={{ maxHeight: `calc(100vh - ${SIDEBAR_TOP + 24}px)` }}
        >
          {/* Header — always visible */}
          <div className="px-5 pt-5 pb-0 shrink-0">
            <h3 className="font-bold font-syne text-sm text-taqon-charcoal dark:text-white mb-3 flex items-center gap-2">
              <Lightning size={16} className="text-taqon-orange" />
              Your Selection
            </h3>

            {/* Score meters — compact */}
            <div className="space-y-2.5 mb-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-taqon-muted dark:text-white/50">Power Points</span>
                  <span className="font-bold text-taqon-orange tabular-nums">{totals.pp}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-taqon-orange to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(totals.pp) / 30) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-taqon-muted dark:text-white/50">Energy Points</span>
                  <span className="font-bold text-taqon-orange tabular-nums">{totals.ep}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 via-taqon-orange to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(totals.ep) / 35) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs py-2 border-t border-gray-100 dark:border-white/10">
              <span className="text-taqon-muted dark:text-white/50">Appliances</span>
              <span className="font-semibold text-taqon-charcoal dark:text-white tabular-nums">{totals.count}</span>
            </div>
          </div>

          {/* Selected items — scrollable region */}
          {hasSelections && (
            <div className="px-5 flex-1 min-h-0 overflow-y-auto">
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-0.5 pb-1">
                {Object.entries(selections)
                  .filter(([, qty]) => qty > 0)
                  .map(([id, qty]) => {
                    const a = appliances.find((app) => app.id === id);
                    return a ? (
                      <div
                        key={id}
                        className="flex items-center justify-between py-1 text-[11px] group"
                      >
                        <span className="text-taqon-charcoal dark:text-white/70 truncate mr-2 flex-1">
                          {a.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-taqon-muted dark:text-white/40 font-medium tabular-nums">
                            x{qty}
                          </span>
                          <button
                            onClick={() => onUpdateQty(id, -qty)}
                            className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-all"
                            title="Remove"
                            aria-label={`Remove ${a.name}`}
                          >
                            <X size={8} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>
          )}

          {/* Footer CTA — always visible */}
          <div className="px-5 py-4 shrink-0 border-t border-gray-100 dark:border-white/10">
            <button
              onClick={onNext}
              disabled={!hasSelections}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Continue <ArrowRight size={14} weight="bold" />
            </button>

            {!hasSelections && (
              <p className="mt-2 text-[10px] text-center text-taqon-muted dark:text-white/30">
                Select appliances to get started
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─── Instant Quote Modal ─── */

function QuoteModal({ pkg, tierKey, distanceKm, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [generating, setGenerating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setGenerating(true);
    try {
      const res = await solarConfigApi.getInstantQuote({
        package_slug: pkg.slug,
        distance_km: distanceKm,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_address: form.address,
        tier_label: tierLabels[tierKey] || tierKey,
      });
      const contentType = res.headers['content-type'] || 'application/pdf';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taqon-Quote-${pkg.family_name || pkg.name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Quote downloaded!');

      // Background: submit QuotationRequest so admin has a record
      quotationsApi.submitRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: `Instant quote for ${pkg.family_name || pkg.name} (${tierLabels[tierKey]}) at ${distanceKm}km. Address: ${form.address || 'N/A'}`,
        property_type: 'residential',
        roof_type: 'pitched',
        monthly_bill: 0,
        budget_range: '$1000-$3000',
        appliances: [],
      }).catch(() => {}); // silent — don't block the user

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors"
        >
          <X size={14} weight="bold" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-taqon-orange" />
            <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">
              Get Instant Quote
            </h3>
          </div>
          <p className="text-sm text-taqon-muted dark:text-white/50">
            {pkg.family_name || pkg.name} &bull; {tierLabels[tierKey]}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="+263 77 123 4567"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="Harare, Zimbabwe"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 disabled:opacity-60 min-h-[44px]"
          >
            {generating ? (
              <SpinnerGap size={18} className="animate-spin" />
            ) : (
              <><DownloadSimple size={16} weight="bold" /> Download Quote PDF</>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}


/* ─── Recommendation Card (Step 3) ─── */

function RecommendationCard({ tierKey, tier, isHighlighted, distanceKm }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const pkg = tier.package;

  return (
    <AnimatedSection delay={tierKey === 'budget' ? 0 : tierKey === 'good_fit' ? 0.1 : 0.2}>
      <div
        className={`relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 transition-all h-full flex flex-col ${tierColors[tierKey]} ${
          isHighlighted ? 'shadow-xl md:scale-[1.02]' : ''
        }`}
      >
        {isHighlighted && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-taqon-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-taqon-orange/30 whitespace-nowrap">
            <Star size={12} weight="fill" /> Recommended
          </div>
        )}

        {/* Tier badge + package name */}
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${tierBadgeColors[tierKey]}`}>
            {tierLabels[tierKey]}
          </span>
          <h3 className="text-lg sm:text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
            {pkg.family_name || pkg.name}
          </h3>
          {pkg.variant_name && (
            <p className="text-xs text-taqon-muted dark:text-white/40 mt-0.5">{pkg.variant_name}</p>
          )}
        </div>

        {/* Specs grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 text-center">
            <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
              {pkg.inverter_kva || tier.inverter_kva}
            </p>
            <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">kVA</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 text-center">
            <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
              {pkg.battery_capacity_kwh || tier.battery_kwh}
            </p>
            <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">kWh</p>
          </div>
          {pkg.panel_count > 0 && (
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 text-center">
              <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                {pkg.panel_count}
              </p>
              <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">Panels</p>
            </div>
          )}
        </div>

        {/* Price breakdown — always visible on all devices */}
        {tier.price_breakdown && (
          <div className="mt-4 flex-1">
            {/* Mobile: collapsible breakdown */}
            <div className="md:hidden">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between py-2.5 min-h-[44px]"
              >
                <span className="text-2xl font-bold text-taqon-orange tabular-nums">
                  ${parseFloat(tier.price_breakdown.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="flex items-center gap-1 text-xs text-taqon-muted dark:text-white/40 font-medium">
                  {showBreakdown ? 'Hide' : 'Show'} breakdown
                  {showBreakdown
                    ? <CaretUp size={12} weight="bold" />
                    : <CaretDown size={12} weight="bold" />
                  }
                </span>
              </button>
              <AnimatePresence>
                {showBreakdown && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pb-2">
                      <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                        <span>Materials</span>
                        <span className="tabular-nums">${parseFloat(tier.price_breakdown.material).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                        <span>Labour (8%)</span>
                        <span className="tabular-nums">${parseFloat(tier.price_breakdown.labour).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                        <span>Transport ({distanceKm}km)</span>
                        <span className="tabular-nums">${parseFloat(tier.price_breakdown.transport).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop: always-visible breakdown */}
            <div className="hidden md:block space-y-2">
              <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                <span>Materials</span>
                <span className="tabular-nums">${parseFloat(tier.price_breakdown.material).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                <span>Labour (8%)</span>
                <span className="tabular-nums">${parseFloat(tier.price_breakdown.labour).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                <span>Transport ({distanceKm}km)</span>
                <span className="tabular-nums">${parseFloat(tier.price_breakdown.transport).toLocaleString()}</span>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-gray-200 dark:border-white/10 flex justify-between items-baseline">
                <span className="font-semibold text-sm text-taqon-charcoal dark:text-white">Total</span>
                <span className="text-2xl font-bold text-taqon-orange tabular-nums">
                  ${parseFloat(tier.price_breakdown.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-5 space-y-2">
          <Link
            to={`/packages/${pkg.slug}`}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all min-h-[44px] ${
              isHighlighted
                ? 'bg-taqon-orange text-white hover:bg-taqon-orange/90 shadow-lg shadow-taqon-orange/25'
                : 'bg-taqon-charcoal dark:bg-white/10 text-white hover:bg-taqon-charcoal/90 dark:hover:bg-white/20'
            }`}
          >
            View Details <ArrowRight size={14} weight="bold" />
          </Link>
          <button
            onClick={() => setShowQuoteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <FileText size={14} /> Get Instant Quote
          </button>
        </div>
      </div>

      {/* Quote Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <QuoteModal
            pkg={pkg}
            tierKey={tierKey}
            distanceKm={distanceKm}
            onClose={() => setShowQuoteModal(false)}
          />
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}


/* ─── Calculation Analysis Log ─── */

const LOG_AGENT_COLORS = {
  SYSTEM: 'text-gray-400',
  SCANNER: 'text-blue-400',
  PP_ENGINE: 'text-yellow-400',
  EP_ENGINE: 'text-cyan-400',
  RECOMMENDER: 'text-purple-400',
  ROUTER: 'text-indigo-300',
  MATCHER: 'text-taqon-orange',
  PRICING: 'text-emerald-400',
};

const LOG_TYPE_STYLES = {
  system: 'text-white/50',
  scan: 'text-white/60',
  detail: 'text-white/40 text-[10px] sm:text-xs',
  compute: 'text-white/60',
  result: 'text-emerald-400 font-semibold',
  route: 'text-indigo-300',
  match: 'text-taqon-orange font-semibold',
  price: 'text-white/60',
  success: 'text-emerald-400 font-bold',
  error: 'text-red-400 font-semibold',
};

function getAgentIcon(agent) {
  switch (agent) {
    case 'SYSTEM': return GearSix;
    case 'SCANNER': return MagnifyingGlass;
    case 'PP_ENGINE': return Lightning;
    case 'EP_ENGINE': return BatteryCharging;
    case 'RECOMMENDER': return Cpu;
    case 'ROUTER': return Funnel;
    case 'MATCHER': return CheckCircle;
    case 'PRICING': return CurrencyDollar;
    default: return GearSix;
  }
}

const AGENT_ABBREV = {
  SYSTEM: 'SYS', SCANNER: 'SCAN', PP_ENGINE: 'PP', EP_ENGINE: 'EP',
  RECOMMENDER: 'REC', ROUTER: 'RTR', MATCHER: 'MTCH', PRICING: 'PRC',
};

function CalculationLog({ selections, appliances, totals, distanceKm, recommendation, error, onComplete }) {
  const [entries, setEntries] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState('running'); // running | collapsing | done
  const [expanded, setExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('0.0');
  const scrollRef = useRef(null);
  const phase2Started = useRef(false);
  const phase2Timers = useRef([]);
  const startTime = useRef(Date.now());

  const getTs = useCallback(() => `${((Date.now() - startTime.current) / 1000).toFixed(2)}s`, []);

  const addEntry = useCallback((entry) => {
    setEntries((prev) => [...prev, { ...entry, id: `${Date.now()}-${Math.random()}`, ts: getTs() }]);
  }, [getTs]);

  // Auto-scroll log
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, waiting]);

  // Phase 1: Frontend-computed entries (immediate)
  useEffect(() => {
    const selected = Object.entries(selections).filter(([, q]) => q > 0);
    const selectedApps = selected.map(([id, qty]) => {
      const a = appliances.find((x) => x.id === id);
      return a ? { ...a, qty } : null;
    }).filter(Boolean);

    const byCategory = {};
    selectedApps.forEach((a) => {
      if (!byCategory[a.category]) byCategory[a.category] = [];
      byCategory[a.category].push(a);
    });

    const timers = [];
    let d = 0;
    const q = (delay, entry) => { d += delay; timers.push(setTimeout(() => addEntry(entry), d)); };

    q(100, { agent: 'SYSTEM', type: 'system', text: 'Initializing Taqon Solar Analysis Engine v2.0...' });
    q(600, { agent: 'SCANNER', type: 'scan', text: `Scanning ${totals.count} appliance${totals.count !== 1 ? 's' : ''} across ${Object.keys(byCategory).length} categories...` });

    Object.entries(byCategory).slice(0, 6).forEach(([cat, items]) => {
      const names = items.slice(0, 3).map((i) => `${i.name} x${i.qty}`).join(', ');
      const more = items.length > 3 ? ` +${items.length - 3} more` : '';
      q(250, { agent: 'SCANNER', type: 'detail', text: `  ${cat}: ${names}${more}` });
    });

    q(400, { agent: 'PP_ENGINE', type: 'compute', text: 'Computing Power Points (PP) — concurrent load analysis...' });
    q(650, { agent: 'PP_ENGINE', type: 'result', text: `Total Power Points: ${totals.pp}` });
    q(350, { agent: 'EP_ENGINE', type: 'compute', text: 'Computing Energy Points (EP) — daily consumption model...' });
    q(650, { agent: 'EP_ENGINE', type: 'result', text: `Total Energy Points: ${totals.ep}` });
    q(400, { agent: 'SYSTEM', type: 'system', text: 'Submitting to 3-tier recommendation engine...' });

    d += 300;
    timers.push(setTimeout(() => setWaiting(true), d));

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 2: API-dependent entries
  // NOTE: Timers stored in ref to survive re-renders (setWaiting(false) causes
  // the effect to re-run and its cleanup would destroy all pending timers).
  useEffect(() => {
    if (!recommendation || !waiting || phase2Started.current) return;
    phase2Started.current = true;
    setWaiting(false);

    let d = 0;
    const q = (delay, entry) => { d += delay; phase2Timers.current.push(setTimeout(() => addEntry(entry), d)); };

    q(0, { agent: 'SYSTEM', type: 'system', text: 'Response received from recommendation engine...' });
    q(400, { agent: 'RECOMMENDER', type: 'compute', text: 'Running philosophy-based recommendation algorithm...' });

    const tierInfo = {
      budget: { label: 'Budget', mult: 'PP x0.9, EP x0.85' },
      good_fit: { label: 'Good Fit', mult: 'PP x1.0, EP x1.0' },
      excellent: { label: 'Excellent', mult: 'PP x1.1, EP x1.2' },
    };

    ['budget', 'good_fit', 'excellent'].forEach((tierKey) => {
      const tier = recommendation.tiers?.[tierKey];
      if (!tier) return;
      const info = tierInfo[tierKey];
      q(350, { agent: 'RECOMMENDER', type: 'compute', text: `${info.label} tier — applying ${info.mult} multipliers...` });
      q(280, { agent: 'ROUTER', type: 'route', text: `  PP ${parseFloat(tier.adjusted_pp).toFixed(1)} \u2192 ${tier.inverter_kva}kVA inverter | EP ${parseFloat(tier.adjusted_ep).toFixed(1)} \u2192 ${tier.battery_kwh}kWh battery` });
      if (tier.package) {
        q(220, { agent: 'MATCHER', type: 'match', text: `  Matched: ${tier.package.family_name || tier.package.name}` });
      }
    });

    q(400, { agent: 'PRICING', type: 'price', text: `Calculating pricing \u2014 materials + 8% labour + ${distanceKm}km transport...` });

    ['budget', 'good_fit', 'excellent'].forEach((tierKey) => {
      const tier = recommendation.tiers?.[tierKey];
      if (!tier?.price_breakdown) return;
      q(180, { agent: 'PRICING', type: 'result', text: `  ${tierInfo[tierKey].label}: $${parseFloat(tier.price_breakdown.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}` });
    });

    q(500, { agent: 'SYSTEM', type: 'success', text: 'Analysis complete \u2014 3 solar packages recommended!' });

    d += 1000;
    phase2Timers.current.push(setTimeout(() => {
      setElapsedTime(((Date.now() - startTime.current) / 1000).toFixed(1));
      setStatus('collapsing');
    }, d));
    d += 700;
    phase2Timers.current.push(setTimeout(() => { setStatus('done'); onComplete(); }, d));
  }, [recommendation, waiting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup Phase 2 timers only on unmount
  useEffect(() => {
    return () => phase2Timers.current.forEach(clearTimeout);
  }, []);

  // Handle API errors
  useEffect(() => {
    if (!error) return;
    setWaiting(false);
    addEntry({ agent: 'SYSTEM', type: 'error', text: `Error: ${error}` });
    addEntry({ agent: 'SYSTEM', type: 'error', text: 'Please go back and try again.' });
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timeout: if API hasn't responded after 20s of waiting
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setWaiting(false);
      addEntry({ agent: 'SYSTEM', type: 'error', text: 'Request timed out. Please go back and try again.' });
    }, 20000);
    return () => clearTimeout(timer);
  }, [waiting, addEntry]);

  const renderEntry = (entry, animated = true) => {
    const Icon = getAgentIcon(entry.agent);
    const Wrapper = animated ? motion.div : 'div';
    const wrapperProps = animated
      ? { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.15 } }
      : {};
    return (
      <Wrapper key={entry.id} {...wrapperProps} className="flex items-start gap-1 sm:gap-2">
        <span className="text-white/15 shrink-0 tabular-nums select-none hidden sm:inline">[{entry.ts}]</span>
        <Icon
          size={13}
          className={`shrink-0 mt-[2px] ${LOG_AGENT_COLORS[entry.agent] || 'text-gray-400'}`}
          weight={entry.type === 'result' || entry.type === 'success' || entry.type === 'match' ? 'fill' : 'regular'}
        />
        <span className={`shrink-0 ${LOG_AGENT_COLORS[entry.agent] || 'text-gray-400'} font-semibold text-[10px] sm:text-[13px]`}>
          <span className="sm:hidden">{AGENT_ABBREV[entry.agent] || entry.agent}</span>
          <span className="hidden sm:inline min-w-[90px]">{entry.agent}</span>
        </span>
        <span className={LOG_TYPE_STYLES[entry.type] || 'text-white/50'}>
          {entry.text}
        </span>
      </Wrapper>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mb-6">
      {/* Running / Collapsing terminal */}
      {status !== 'done' && (
        <motion.div
          animate={status === 'collapsing' ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden rounded-2xl"
        >
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl shadow-black/20">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#161B22] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <Terminal size={14} className="text-white/40 ml-2" />
              <span className="text-xs font-mono text-white/40">solar-analysis-engine</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'collapsing' ? 'bg-emerald-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-[10px] font-mono text-emerald-400/60">
                  {status === 'collapsing' ? 'complete' : 'running'}
                </span>
              </div>
            </div>

            {/* Log body */}
            <div
              ref={scrollRef}
              className="p-3 sm:p-4 max-h-[260px] sm:max-h-[380px] overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="space-y-0.5 sm:space-y-1 font-mono text-[11px] sm:text-[13px] leading-relaxed">
                {entries.map((entry) => renderEntry(entry, true))}

                {waiting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 mt-1"
                  >
                    <SpinnerGap size={13} className="text-taqon-orange animate-spin" />
                    <span className="text-taqon-orange/60 font-mono">Processing recommendations...</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Collapsed summary bar */}
      {status === 'done' && (
        <>
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0D1117] border-l-2 border-emerald-400 border border-white/[0.06] hover:border-white/10 transition-colors cursor-pointer group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-emerald-400">
              Analysis complete
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-xs font-mono text-white/30 hidden sm:inline">{entries.length} steps</span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-xs font-mono text-white/30 hidden sm:inline">{elapsedTime}s</span>
            <span className="ml-auto">
              {expanded
                ? <CaretUp size={14} className="text-white/30 group-hover:text-white/50 transition-colors shrink-0" />
                : <CaretDown size={14} className="text-white/30 group-hover:text-white/50 transition-colors shrink-0" />
              }
            </span>
          </motion.button>

          {/* Expandable static log */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#161B22] border-b border-white/[0.06]">
                    <Terminal size={12} className="text-white/30" />
                    <span className="text-[10px] font-mono text-white/30">analysis log</span>
                  </div>
                  <div
                    className="p-3 sm:p-4 max-h-[250px] overflow-y-auto"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    <div className="space-y-0.5 sm:space-y-1 font-mono text-[11px] sm:text-[13px] leading-relaxed">
                      {entries.map((entry) => renderEntry(entry, false))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}


/* ─── Main Component ─── */

export default function SolarAdvisor() {
  const [step, setStep] = useState(1);
  const [appliances, setAppliances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selections, setSelections] = useState({});
  const [distanceKm, setDistanceKm] = useState(10);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAppliances, setLoadingAppliances] = useState(true);
  const [search, setSearch] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [recommendRun, setRecommendRun] = useState(0);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Fetch appliances and categories on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [appRes, catRes] = await Promise.all([
          solarConfigApi.getAppliances(),
          solarConfigApi.getApplianceCategories(),
        ]);
        setAppliances(appRes.data);
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].value);
        }
      } catch (err) {
        console.error('Failed to load appliances:', err);
      } finally {
        setLoadingAppliances(false);
      }
    };
    load();
  }, []);

  // Filter appliances by category and search
  const filteredAppliances = useMemo(() => {
    let filtered = appliances;
    if (activeCategory) {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [appliances, activeCategory, search]);

  // Running totals
  const totals = useMemo(() => {
    let pp = 0;
    let ep = 0;
    let count = 0;
    for (const [id, qty] of Object.entries(selections)) {
      if (qty <= 0) continue;
      const a = appliances.find((app) => app.id === id);
      if (!a) continue;
      pp += parseFloat(a.power_points) * qty * parseFloat(a.concurrency_factor);
      ep += parseFloat(a.energy_points) * qty * (1 + parseFloat(a.night_use_factor));
      count += qty;
    }
    return { pp: pp.toFixed(1), ep: ep.toFixed(1), count };
  }, [selections, appliances]);

  const updateQty = (id, delta) => {
    setSelections((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const [recommendError, setRecommendError] = useState(null);

  const handleRecommend = async () => {
    setAnalysisComplete(false);
    setRecommendation(null);
    setRecommendError(null);
    setRecommendRun((prev) => prev + 1);
    setStep(3);

    try {
      const applianceList = Object.entries(selections)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ appliance_id: id, quantity: qty }));

      const res = await solarConfigApi.getRecommendation({
        appliances: applianceList,
        distance_km: distanceKm,
      });
      setRecommendation(res.data);
    } catch (err) {
      console.error('Recommendation failed:', err);
      setRecommendError(err.response?.data?.detail || err.message || 'Failed to get recommendations');
    }
  };

  const hasSelections = Object.values(selections).some((q) => q > 0);

  return (
    <>
      <SEO
        title="Solar Advisor"
        description="Find your perfect solar package. Select your appliances and get personalized recommendations with transparent pricing."
        keywords="solar advisor, solar recommendation, solar calculator Zimbabwe, find solar package"
        canonical="https://www.taqon.co.zw/solar-advisor"
      />

      {/* ─── Hero ─── */}
      <section className="relative bg-taqon-dark pt-24 pb-6 lg:pt-32 lg:pb-10 overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-xs sm:text-sm font-semibold uppercase tracking-[0.15em]">
              Solar Advisor
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold font-syne text-white leading-tight">
              Find Your <span className="text-gradient">Perfect System</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-white/60 text-base sm:text-lg max-w-xl">
              Tell us what you want to power. We'll recommend the right solar package with transparent pricing.
            </p>
          </motion.div>

          {/* Step indicators */}
          <div className="mt-6 sm:mt-8 flex items-center gap-2 sm:gap-3">
            {[
              { num: 1, label: 'Appliances' },
              { num: 2, label: 'Location' },
              { num: 3, label: 'Results' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (num < step) { setStep(num); if (num < 3) setAnalysisComplete(false); }
                  }}
                  disabled={num > step}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                    step >= num
                      ? 'bg-taqon-orange text-white'
                      : 'bg-white/10 text-white/40'
                  } ${num < step ? 'cursor-pointer hover:ring-2 hover:ring-taqon-orange/50' : ''}`}
                  aria-label={`Step ${num}: ${label}`}
                >
                  {step > num ? <Check size={14} weight="bold" /> : num}
                </button>
                <span className={`text-xs sm:text-sm hidden sm:inline transition-colors ${
                  step >= num ? 'text-white' : 'text-white/30'
                }`}>
                  {label}
                </span>
                {num < 3 && (
                  <div className={`w-6 sm:w-8 h-0.5 rounded-full transition-colors ${
                    step > num ? 'bg-taqon-orange' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="py-6 lg:py-10 bg-taqon-cream dark:bg-taqon-dark min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════
                Step 1: Select Appliances
                ═══════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="step1" {...stepTransition}>
                <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-start">

                  {/* ── Main content area ── */}
                  <div className="pb-44 sm:pb-40 lg:pb-0 flex-1 min-w-0">
                    {/* Search input */}
                    <div className="relative mb-4">
                      <MagnifyingGlass
                        size={18}
                        className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-taqon-muted pointer-events-none"
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search appliances..."
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-sm sm:text-base text-taqon-charcoal dark:text-white placeholder:text-taqon-muted focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none transition-all"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white transition-colors"
                          aria-label="Clear search"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      )}
                    </div>

                    {/* Category tabs */}
                    {loadingAppliances ? (
                      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-10 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse shrink-0" style={{ width: `${80 + i * 15}px` }} />
                        ))}
                      </div>
                    ) : (
                      <CategoryTabs
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                        onClearSearch={() => setSearch('')}
                      />
                    )}

                    {/* Appliance cards grid */}
                    {loadingAppliances ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-taqon-charcoal p-2.5 sm:p-3 animate-pulse">
                            <div className="flex items-start justify-between gap-1.5 mb-3">
                              <div className="flex-1">
                                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-1.5" />
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/3" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
                              <div className="flex gap-1">
                                <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-white/10" />
                                <div className="w-5 h-7" />
                                <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-white/10" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredAppliances.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <MagnifyingGlass size={40} className="text-taqon-muted/30" />
                        <p className="text-sm text-taqon-muted dark:text-white/40">
                          No appliances found{search ? ` for "${search}"` : ' in this category'}
                        </p>
                        {search && (
                          <button
                            onClick={() => setSearch('')}
                            className="text-sm text-taqon-orange hover:underline"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
                        {filteredAppliances.map((appliance) => {
                          const qty = selections[appliance.id] || 0;
                          return (
                            <div
                              key={appliance.id}
                              className={`relative rounded-xl border transition-all ${
                                qty > 0
                                  ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10 ring-1 ring-taqon-orange/20'
                                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-taqon-charcoal hover:border-gray-300 dark:hover:border-white/20'
                              }`}
                            >
                              {/* Quantity badge */}
                              {qty > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-taqon-orange text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm tabular-nums z-10">
                                  {qty}
                                </div>
                              )}

                              {/* Compact card: name row + controls row */}
                              <div className="p-2.5 sm:p-3">
                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-[11px] sm:text-xs text-taqon-charcoal dark:text-white leading-tight line-clamp-2">
                                      {appliance.name}
                                    </h4>
                                  </div>
                                  <span className="text-[9px] sm:text-[10px] text-taqon-muted dark:text-white/40 tabular-nums shrink-0 mt-0.5">
                                    {appliance.typical_wattage}W
                                  </span>
                                </div>

                                {/* Controls row: minus / qty / plus */}
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-2 text-[9px] text-taqon-muted dark:text-white/30 tabular-nums">
                                    <span>PP:{appliance.power_points}</span>
                                    <span>EP:{appliance.energy_points}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => updateQty(appliance.id, -1)}
                                      disabled={qty === 0}
                                      className="w-7 h-7 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white disabled:opacity-20 hover:bg-gray-200 dark:hover:bg-white/20 active:scale-90 transition-all"
                                      aria-label={`Decrease ${appliance.name} quantity`}
                                    >
                                      <Minus size={11} weight="bold" />
                                    </button>
                                    <span className="w-5 text-center text-xs font-bold text-taqon-charcoal dark:text-white tabular-nums">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => updateQty(appliance.id, 1)}
                                      className="w-7 h-7 rounded-md bg-taqon-orange/10 flex items-center justify-center text-taqon-orange hover:bg-taqon-orange/20 active:scale-90 transition-all"
                                      aria-label={`Increase ${appliance.name} quantity`}
                                    >
                                      <Plus size={11} weight="bold" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Desktop sticky sidebar ── */}
                  <DesktopSidebar
                    totals={totals}
                    hasSelections={hasSelections}
                    selections={selections}
                    appliances={appliances}
                    onUpdateQty={updateQty}
                    onNext={() => setStep(2)}
                  />
                </div>

                {/* ── Mobile sticky bottom bar ── */}
                <MobileBottomBar
                  totals={totals}
                  hasSelections={hasSelections}
                  selections={selections}
                  appliances={appliances}
                  onNext={() => setStep(2)}
                  onRemove={(id) => updateQty(id, -(selections[id] || 0))}
                />
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                Step 2: Location & Distance
                ═══════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="step2" {...stepTransition} className="max-w-xl mx-auto">
                <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-5 sm:p-8 shadow-sm">
                  <h2 className="text-xl sm:text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-5 sm:mb-6">
                    Location & Distance
                  </h2>

                  <div className="space-y-5 sm:space-y-6">
                    {/* Distance slider */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-taqon-charcoal dark:text-white mb-4">
                        <MapPin size={16} className="text-taqon-orange" />
                        Distance from Harare (km)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="5"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="w-full accent-taqon-orange h-2 rounded-full cursor-pointer"
                      />
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xs text-taqon-muted">0 km</span>
                        <span className="text-2xl font-bold text-taqon-orange tabular-nums">{distanceKm} km</span>
                        <span className="text-xs text-taqon-muted">500 km</span>
                      </div>

                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>Transport is charged at $0.65/km. Harare-based installations are cheapest.</span>
                        </p>
                      </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="p-4 rounded-xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">
                        Your Selection Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { value: totals.count, label: 'Appliances' },
                          { value: totals.pp, label: 'Power Points' },
                          { value: totals.ep, label: 'Energy Points' },
                        ].map(({ value, label }) => (
                          <div key={label} className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-taqon-orange tabular-nums">{value}</p>
                            <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="mt-6 sm:mt-8 flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all text-sm min-h-[44px]"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={handleRecommend}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 min-h-[44px]"
                    >
                      Get Recommendations
                      <ArrowRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                Step 3: Analysis + Recommendations
                ═══════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="step3" {...stepTransition}>
                {/* Calculation Log */}
                <CalculationLog
                  key={recommendRun}
                  selections={selections}
                  appliances={appliances}
                  totals={totals}
                  distanceKm={distanceKm}
                  recommendation={recommendation}
                  error={recommendError}
                  onComplete={() => setAnalysisComplete(true)}
                />

                {/* Recommendations (appear after analysis completes) */}
                {analysisComplete && recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-10">
                      <h2 className="text-2xl sm:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
                        Your <span className="text-gradient">Recommendations</span>
                      </h2>
                      <p className="mt-2 text-sm sm:text-base text-taqon-muted dark:text-white/50">
                        Based on {totals.count} appliance{totals.count !== 1 ? 's' : ''} at {distanceKm}km from Harare
                      </p>
                    </div>

                    {/* Tier cards — deduplicated, responsive grid */}
                    {(() => {
                      const seen = new Set();
                      const uniqueTiers = ['budget', 'good_fit', 'excellent'].filter((tierKey) => {
                        const tier = recommendation.tiers[tierKey];
                        if (!tier?.package) return false;
                        const pkgId = tier.package.id || tier.package.slug;
                        if (seen.has(pkgId)) return false;
                        seen.add(pkgId);
                        return true;
                      });
                      return (
                        <div className={`grid grid-cols-1 gap-4 sm:gap-6 max-w-5xl mx-auto ${
                          uniqueTiers.length === 1 ? 'md:grid-cols-1 max-w-lg' :
                          uniqueTiers.length === 2 ? 'md:grid-cols-2 max-w-3xl' :
                          'md:grid-cols-3'
                        }`}>
                          {uniqueTiers.map((tierKey) => (
                            <RecommendationCard
                              key={tierKey}
                              tierKey={tierKey}
                              tier={recommendation.tiers[tierKey]}
                              isHighlighted={tierKey === 'good_fit' || uniqueTiers.length === 1}
                              distanceKm={distanceKm}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Bottom actions */}
                    <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                      <button
                        onClick={() => { setStep(1); setAnalysisComplete(false); }}
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all min-h-[44px]"
                      >
                        <ArrowLeft size={14} /> Modify Appliances
                      </button>
                      <button
                        onClick={() => { setStep(2); setAnalysisComplete(false); }}
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all min-h-[44px]"
                      >
                        <MapPin size={14} /> Change Distance
                      </button>
                      <Link
                        to="/packages"
                        className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-taqon-orange/10 text-taqon-orange font-semibold text-sm hover:bg-taqon-orange/20 active:scale-[0.98] transition-all min-h-[44px]"
                      >
                        Browse All Packages <ArrowRight size={14} weight="bold" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
