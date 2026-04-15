import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightning, Plus, Minus, ArrowRight, ArrowLeft,
  MapPin, Check, Star, Lightbulb, CookingPot, Television,
  Thermometer, TShirt, Drop, Desktop, ShieldCheck,
  Tree, DotsThree, MagnifyingGlass, SpinnerGap, Couch, Bed, Bathtub, Wrench,
  CaretDown, CaretUp, Info, X, CaretLeft, CaretRight,
  Terminal, BatteryCharging, Cpu, CurrencyDollar,
  CheckCircle, GearSix, Funnel, FileText, DownloadSimple,
  Sparkle, SquaresFour,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { solarConfigApi } from '../api/solarConfig';
import { quotationsApi } from '../api/quotations';
import useAuthStore from '../stores/authStore';
import DepositModal from '../components/DepositModal';
import { getSavedLocation, saveLocation } from '../data/locationSession';

/* ─── Helpers ─── */

// Build prefill defaults from auth user
function prefillFromUser(user) {
  if (!user) return { name: '', email: '', phone: '', address: '' };
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return {
    name: name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: '',
  };
}

/* ─── Constants ─── */

const NAVBAR_HEIGHT = 80; // lg:h-20 = 80px
const SIDEBAR_TOP = NAVBAR_HEIGHT + 24; // 24px breathing room below navbar

const categoryIcons = {
  lounge: Couch,
  kitchen: CookingPot,
  bedroom: Bed,
  bathroom: Bathtub,
  laundry: TShirt,
  office: Desktop,
  garage: Wrench,
  outdoor: Tree,
  security: ShieldCheck,
  other: DotsThree,
};

import { getGemFamily, TIER_GEMS } from '../data/gemFamilies';
import { ZIMBABWE_AREAS, getDistanceByArea, getAreaCoords, findNearestArea, haversineKm, HQ_COORDS } from '../data/zimbabweAreas';
import DistanceMap from '../components/DistanceMap';

const tierLabels = { budget: 'Budget', good_fit: 'Recommended', excellent: 'Excellent' };
const tierBadgeColors = {
  budget: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  good_fit: 'bg-taqon-orange/10 text-taqon-orange',
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

const stepTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};


/* ─── Category Tabs with edge-fade scroll & "All" meta-pill ─── */

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
    if (el) el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const totalCount = categories.reduce((sum, c) => sum + (c.count || 0), 0);
  const isAllActive = activeCategory === null || activeCategory === 'all';

  // Dynamic mask: fade only on sides that have overflow content
  const maskLeft = canScrollLeft ? 'transparent' : 'black';
  const maskRight = canScrollRight ? 'transparent' : 'black';
  const maskImage = `linear-gradient(to right, ${maskLeft} 0%, black 48px, black calc(100% - 48px), ${maskRight} 100%)`;

  return (
    <div className="relative mb-4 sm:mb-6 -mx-1 sm:mx-0">
      {/* Left arrow — overlays the fade zone */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18 }}
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-taqon-charcoal/95 backdrop-blur-sm shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.4)] border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white hover:text-taqon-orange hover:border-taqon-orange/40 hover:shadow-[0_4px_18px_rgba(242,101,34,0.18)] transition-all duration-200"
            aria-label="Scroll categories left"
          >
            <CaretLeft size={15} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable row — no horizontal padding, masked edges */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-1 sm:px-0 py-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitMaskImage: maskImage,
          maskImage: maskImage,
          transition: 'mask-image 0.25s ease, -webkit-mask-image 0.25s ease',
        }}
      >
        {/* "All Categories" meta-pill — first, always */}
        <button
          onClick={() => { onSelect(null); onClearSearch(); }}
          className={`group relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 min-h-[44px] overflow-hidden ${
            isAllActive
              ? 'bg-gradient-to-br from-taqon-orange to-[#E0541A] text-white shadow-[0_6px_20px_-4px_rgba(242,101,34,0.55)] ring-1 ring-taqon-orange/40'
              : 'bg-gradient-to-br from-white to-gray-50 dark:from-taqon-charcoal dark:to-taqon-charcoal/60 text-taqon-charcoal dark:text-white border border-taqon-orange/25 dark:border-taqon-orange/30 hover:border-taqon-orange/50 hover:shadow-[0_4px_14px_-4px_rgba(242,101,34,0.25)]'
          }`}
        >
          {isAllActive && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          )}
          <Sparkle
            size={15}
            weight={isAllActive ? 'fill' : 'duotone'}
            className={isAllActive ? 'text-white' : 'text-taqon-orange'}
          />
          <span className="relative">All Categories</span>
          <span className={`relative text-[10px] ml-0.5 px-1.5 py-0.5 rounded-md tabular-nums ${
            isAllActive
              ? 'bg-white/20 text-white'
              : 'bg-taqon-orange/10 text-taqon-orange dark:bg-taqon-orange/15'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* Slim divider between meta and regular */}
        <div className="shrink-0 w-px self-stretch my-2 bg-gray-200 dark:bg-white/10" aria-hidden="true" />

        {categories.map((cat) => {
          const Icon = categoryIcons[cat.value] || DotsThree;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => { onSelect(cat.value); onClearSearch(); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 min-h-[44px] ${
                isActive
                  ? 'bg-taqon-orange text-white shadow-[0_6px_18px_-4px_rgba(242,101,34,0.5)] ring-1 ring-taqon-orange/30'
                  : 'bg-white dark:bg-taqon-charcoal text-taqon-muted dark:text-white/60 hover:text-taqon-charcoal dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
              {cat.label}
            </button>
          );
        })}

        {/* Trailing spacer so last pill clears the right fade/arrow cleanly */}
        <div className="shrink-0 w-2" aria-hidden="true" />
      </div>

      {/* Right arrow — overlays the fade zone */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.18 }}
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-taqon-charcoal/95 backdrop-blur-sm shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.4)] border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white hover:text-taqon-orange hover:border-taqon-orange/40 hover:shadow-[0_4px_18px_rgba(242,101,34,0.18)] transition-all duration-200"
            aria-label="Scroll categories right"
          >
            <CaretRight size={15} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ─── Mobile Bottom Bar (expandable) ─── */

function MobileBottomBar({ step, totals, hasSelections, selections, appliances, onNext, onBack, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const selectedItems = Object.entries(selections).filter(([, qty]) => qty > 0);

  // Step-specific config
  const showBack = step > 1;
  const nextLabel = step === 3 ? 'Get Results' : 'Next';
  const nextDisabled = step === 1 ? !hasSelections : false;

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
                  Selected ({selectedItems.length})
                </h4>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-taqon-muted"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedItems.map(([id, qty]) => {
                  const a = appliances.find((app) => app.id === id);
                  return a ? (
                    <div key={id} className="flex items-center justify-between py-1.5 px-2 rounded-lg">
                      <span className="text-xs text-taqon-charcoal dark:text-white/80 truncate mr-2 flex-1">{a.name}</span>
                      <span className="text-xs text-taqon-muted tabular-nums mr-2">x{qty}</span>
                      <button onClick={() => onRemove(id)} className="w-6 h-6 rounded text-red-400 flex items-center justify-center">
                        <X size={10} weight="bold" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div
        className="bg-white dark:bg-taqon-charcoal border-t border-gray-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div className="px-4 py-2.5">
          {/* Row 1: Scores + selected count (only on step 1) */}
          {step === 1 && hasSelections && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-taqon-orange tabular-nums">
                  <Lightning size={12} className="text-yellow-500" />{totals.pp}
                </div>
                <span className="text-gray-300 dark:text-white/20 text-xs">|</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-taqon-orange tabular-nums">
                  <BatteryCharging size={12} className="text-blue-400" />{totals.ep}
                </div>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-taqon-orange font-medium flex items-center gap-1"
              >
                {totals.count} selected {expanded ? <CaretDown size={10} /> : <CaretUp size={10} />}
              </button>
            </div>
          )}

          {/* Row 2: Action buttons */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm active:scale-95 transition-all min-h-[44px]"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm disabled:opacity-40 shadow-lg shadow-taqon-orange/25 active:scale-95 transition-all min-h-[44px]"
            >
              {nextLabel} <ArrowRight size={14} weight="bold" />
            </button>
          </div>
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
                  <span className="text-taqon-muted dark:text-white/50 flex items-center gap-1"><Lightning size={12} className="text-yellow-500" /> Power Need</span>
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
                  <span className="text-taqon-muted dark:text-white/50 flex items-center gap-1"><BatteryCharging size={12} className="text-blue-400" /> Battery Need</span>
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


/* ─── Casino-style Slot Number ─── */

function SlotNumber({ finalValue, settled, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (settled) {
      setDisplay(finalValue);
      return;
    }
    const interval = setInterval(() => {
      setDisplay(Math.floor(Math.random() * (finalValue * 3 || 20)) + 1);
    }, 60);
    return () => clearInterval(interval);
  }, [settled, finalValue]);

  return (
    <span className={`tabular-nums transition-colors duration-300 ${settled ? 'text-taqon-charcoal dark:text-white' : 'text-taqon-orange'}`}>
      {prefix}{typeof finalValue === 'number' ? display.toLocaleString() : display}{suffix}
    </span>
  );
}

function RecommendationSlotCards({ settled }) {
  const tiers = [
    { key: 'budget', label: 'Budget', color: 'border-blue-300 dark:border-blue-500/30', badgeBg: 'bg-blue-100 dark:bg-blue-500/20', badgeText: 'text-blue-700 dark:text-blue-300' },
    { key: 'good_fit', label: 'Good Fit', color: 'border-taqon-orange ring-2 ring-taqon-orange/20', badgeBg: 'bg-taqon-orange/10', badgeText: 'text-taqon-orange' },
    { key: 'excellent', label: 'Excellent', color: 'border-emerald-300 dark:border-emerald-500/30', badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20', badgeText: 'text-emerald-700 dark:text-emerald-300' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 max-w-5xl mx-auto mt-6">
      {tiers.map(({ key, label, color, badgeBg, badgeText }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
          className={`relative overflow-visible border-2 bg-white dark:bg-taqon-charcoal/50 ${color}
            rounded-xl md:rounded-3xl p-3 md:p-6
            ${key === 'good_fit' ? 'shadow-xl md:scale-[1.02] pt-8 md:pt-10' : ''}`}
        >
          {key === 'good_fit' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-taqon-orange text-white text-[11px] md:text-sm font-bold px-4 md:px-6 py-1 md:py-2 rounded-full flex items-center gap-1.5 shadow-lg shadow-taqon-orange/30 whitespace-nowrap z-10">
              <Star size={12} weight="fill" /> Recommended
            </div>
          )}

          {/* Mobile: compact horizontal layout */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeBg} ${badgeText}`}>
                {key === 'good_fit' ? 'Best Fit' : label}
              </span>
              <div className={`h-3.5 rounded w-20 ${settled ? 'bg-transparent' : 'bg-gray-200 dark:bg-white/10 animate-pulse'}`} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 text-center">
                  <div className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-sm font-bold font-syne leading-tight">
                      <SlotNumber finalValue={key === 'budget' ? 3 : key === 'good_fit' ? 5 : 8} settled={settled} />
                    </p>
                    <p className="text-[8px] text-taqon-muted dark:text-white/40 font-medium">kVA</p>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-sm font-bold font-syne leading-tight">
                      <SlotNumber finalValue={key === 'budget' ? 5 : key === 'good_fit' ? 10 : 15} settled={settled} />
                    </p>
                    <p className="text-[8px] text-taqon-muted dark:text-white/40 font-medium">kWh</p>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-sm font-bold font-syne leading-tight">
                      <SlotNumber finalValue={key === 'budget' ? 4 : key === 'good_fit' ? 8 : 12} settled={settled} />
                    </p>
                    <p className="text-[8px] text-taqon-muted dark:text-white/40 font-medium">Panels</p>
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold font-syne shrink-0">
                <SlotNumber
                  finalValue={key === 'budget' ? 1800 : key === 'good_fit' ? 3200 : 5500}
                  settled={settled}
                  prefix="$"
                />
              </p>
            </div>
          </div>

          {/* Desktop: full vertical layout */}
          <div className="hidden md:block">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${badgeBg} ${badgeText}`}>
              {key === 'good_fit' ? 'Best Fit' : label}
            </div>
            <div className={`h-6 rounded-lg w-3/4 mb-1 ${settled ? 'bg-transparent' : 'bg-gray-200 dark:bg-white/10 animate-pulse'}`} />
            <div className={`h-3 rounded w-1/2 mb-4 ${settled ? 'bg-transparent' : 'bg-gray-100 dark:bg-white/5 animate-pulse'}`} />
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-xl font-bold font-syne">
                  <SlotNumber finalValue={key === 'budget' ? 3 : key === 'good_fit' ? 5 : 8} settled={settled} />
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">kVA</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-xl font-bold font-syne">
                  <SlotNumber finalValue={key === 'budget' ? 5 : key === 'good_fit' ? 10 : 15} settled={settled} />
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">kWh</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-xl font-bold font-syne">
                  <SlotNumber finalValue={key === 'budget' ? 4 : key === 'good_fit' ? 8 : 12} settled={settled} />
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">Panels</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
              <div className={`h-4 rounded w-1/3 mb-2 ${settled ? 'bg-transparent' : 'bg-gray-100 dark:bg-white/5 animate-pulse'}`} />
              <p className="text-2xl font-bold font-syne">
                <SlotNumber
                  finalValue={key === 'budget' ? 1800 : key === 'good_fit' ? 3200 : 5500}
                  settled={settled}
                  prefix="$"
                />
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <div className={`h-11 rounded-xl ${settled ? 'bg-transparent' : key === 'good_fit' ? 'bg-taqon-orange/20 animate-pulse' : 'bg-gray-200 dark:bg-white/10 animate-pulse'}`} />
              <div className={`h-11 rounded-xl ${settled ? 'bg-transparent' : 'bg-gray-100 dark:bg-white/5 animate-pulse'}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


/* ─── Instant Quote Modal ─── */

function QuoteModal({ pkg, tierKey, distanceKm, sessionId, onClose }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState(() => {
    // Prefill customer fields from auth, address from any prior location
    // the user has already filled in (advisor step 2 or another quote flow).
    const base = prefillFromUser(user);
    const saved = getSavedLocation();
    return { ...base, address: base.address || saved?.area || '' };
  });
  const [generating, setGenerating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (!form.address?.trim()) {
      toast.error('Please enter the installation location.');
      return;
    }
    // Persist the location the user entered so the next quote flow picks it up
    saveLocation({ area: form.address.trim(), distanceKm });
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
        session_id: sessionId,
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

      // Track quote download
      try {
        const events = JSON.parse(localStorage.getItem('taqon-advisor-events') || '[]');
        events.push({
          event: 'quote_downloaded',
          timestamp: new Date().toISOString(),
          package: pkg.family_name || pkg.name,
          tier: tierKey,
          customer_email: form.email,
          distance_km: distanceKm,
        });
        localStorage.setItem('taqon-advisor-events', JSON.stringify(events));
      } catch {}

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
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Installation location *</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="e.g. Borrowdale, Harare"
            />
            <p className="mt-1 text-[11px] text-taqon-muted dark:text-white/40">Where the system will be installed. Pre-filled if you've selected an area earlier.</p>
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


/* ─── Fixed Package Explanations (per kVA range, never change) ─── */

function getPackageExplanation(pkg) {
  const kva = parseFloat(pkg.inverter_kva) || 0;
  if (kva <= 3) return { bestFor: 'Small homes needing essential backup power for lights, TV, WiFi and a fridge.', howItWorks: 'Provides basic backup during outages. Best used with manual load management to extend battery life.', whyUpgrade: 'Consider upgrading if you need to run kitchen appliances, washing machines or air conditioning.' };
  if (kva <= 6) return { bestFor: 'Medium homes with standard daily appliances including a fridge, TV, lights and small kitchen equipment.', howItWorks: 'Handles everyday household loads comfortably. Solar panels recharge batteries during the day for overnight use.', whyUpgrade: 'Consider upgrading if you have a geyser, air conditioning, or multiple heavy appliances running simultaneously.' };
  if (kva <= 8) return { bestFor: 'Larger homes wanting reliable power across most rooms including kitchen, laundry and entertainment.', howItWorks: 'Powers most home appliances with good battery reserves. Smart load management available on Sunsynk inverters.', whyUpgrade: 'Consider upgrading if you want full energy independence or have very heavy loads like welders or commercial equipment.' };
  if (kva <= 12) return { bestFor: 'Large homes, home offices or small businesses needing comprehensive power coverage.', howItWorks: 'Full backup capability with strong solar recharging. Supports heavy appliances, geysers, and multiple air conditioners.', whyUpgrade: 'Consider upgrading for commercial-scale operations or properties requiring three-phase power.' };
  if (kva <= 16) return { bestFor: 'Large properties, lodges, retail stores or light commercial operations.', howItWorks: 'Commercial-grade inverter with extensive battery storage and solar array. Handles sustained heavy loads throughout the day.', whyUpgrade: 'Consider upgrading for enterprise-scale power demands or full off-grid independence.' };
  return { bestFor: 'Commercial enterprises, institutions, multi-storey buildings and large industrial properties.', howItWorks: 'Enterprise-level solar system providing maximum power output, extensive battery reserves and full solar independence.', whyUpgrade: null };
}

/* ─── Dynamic "Why this matches you" (only for highlighted card) ─── */

const PRIORITY_TEXT = {
  lowest_cost: 'You selected lowest cost as your priority, so this system focuses on delivering the most affordable workable solution.',
  balanced: 'You selected best balance, so this system provides a good mix of affordability and performance.',
  max_comfort: 'You selected maximum comfort, so this system prioritizes stronger performance with fewer limitations.',
};

const LOAD_BEHAVIOR_TEXT = {
  true: 'Since you are comfortable managing heavy appliances when needed, this system allows some manual control to keep costs lower.',
  false: 'Since you prefer full convenience, this system is designed to run more appliances without needing manual control.',
};

const SYSTEM_GOAL_TEXT = {
  backup: 'This configuration is optimized mainly to provide backup power during outages.',
  backup_solar: 'This configuration supports both reliable backup and daily electricity savings.',
  independence: 'This configuration is designed to maximize solar usage and reduce reliance on grid power.',
};

function getWhyThisMatchesYou(preferences) {
  const priority = PRIORITY_TEXT[preferences.priority] || PRIORITY_TEXT.balanced;
  const loadBehavior = LOAD_BEHAVIOR_TEXT[String(preferences.willing_to_manage)] || LOAD_BEHAVIOR_TEXT.false;
  const goal = SYSTEM_GOAL_TEXT[preferences.use_style] || SYSTEM_GOAL_TEXT.backup_solar;
  return { priority, loadBehavior, goal };
}


/* ─── Recommendation Card (Step 3) — Gem-styled ─── */

function RecommendationCard({ tierKey, tier, isHighlighted, distanceKm, clientDetails, detailsCollected, onRequestDetails, preferences, sessionId }) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [downloadingQuote, setDownloadingQuote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pkg = tier.package;
  const totalForDeposit = tier.price_breakdown ? parseFloat(tier.price_breakdown.total) : 0;
  const explanation = getPackageExplanation(pkg);
  const matchReason = isHighlighted && preferences ? getWhyThisMatchesYou(preferences) : null;
  const tierGem = TIER_GEMS[tierKey];
  const familyGem = getGemFamily(pkg.family_slug || pkg.slug);
  const totalPrice = tier.price_breakdown ? parseFloat(tier.price_breakdown.total).toLocaleString(undefined, { maximumFractionDigits: 0 }) : null;

  return (
    <AnimatedSection delay={tierKey === 'budget' ? 0 : tierKey === 'good_fit' ? 0.1 : 0.2}>
      <div
        className={`gem-rec-card relative rounded-xl md:rounded-3xl border-2 flex flex-col bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm ${tierGem.borderColor} ${
          isHighlighted ? 'gem-rec-highlighted' : ''
        }`}
        style={{
          '--gem-border': tierGem.glowColor,
          '--gem-glow': tierGem.glowColorSubtle,
          '--gem-shimmer': tierGem.shimmerColor,
        }}
      >
        <div className="gem-rec-inner">
          <div className={`absolute inset-0 bg-gradient-to-br ${tierGem.gradient} pointer-events-none`} />
          <div className="gem-shimmer" />
        </div>

        {/* Highlighted badge */}
        {isHighlighted && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-0.5 md:py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: tierGem.accent,
              boxShadow: `0 4px 14px -2px ${tierGem.glowColor}`,
            }}
          >
            <Star size={10} weight="fill" /> Best Match
          </div>
        )}

        {/* ── Mobile layout ── */}
        <div className="md:hidden relative z-10">
          {/* Tappable header row */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full text-left p-3 ${isHighlighted ? 'pt-5' : ''}`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`gem-badge !text-[10px] !px-1.5 !py-0 ${tierGem.badgeBg} ${tierGem.badgeText}`}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierGem.accent }} />
                {tierGem.label}
              </span>
              <span className={`gem-badge !text-[10px] !px-1.5 !py-0 ${familyGem.badgeBg} ${familyGem.badgeText}`}>
                {familyGem.gem}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold font-syne text-taqon-charcoal dark:text-white leading-tight truncate">
                  {pkg.family_name || pkg.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-taqon-muted dark:text-white/40">
                    {pkg.inverter_kva || tier.inverter_kva} kVA
                  </span>
                  <span className="text-[10px] text-taqon-muted dark:text-white/30">|</span>
                  <span className="text-[10px] text-taqon-muted dark:text-white/40">
                    {tier.battery_kwh && tier.battery_kwh !== '0.00' ? tier.battery_kwh : (pkg.battery_capacity_kwh || '—')} kWh
                  </span>
                  {pkg.panel_count > 0 && (
                    <>
                      <span className="text-[10px] text-taqon-muted dark:text-white/30">|</span>
                      <span className="text-[10px] text-taqon-muted dark:text-white/40">{pkg.panel_count} panels</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {totalPrice && (
                  <span className="text-base font-bold tabular-nums font-syne" style={{ color: tierGem.accent }}>
                    ${totalPrice}
                  </span>
                )}
                <span className="text-taqon-muted dark:text-white/40">
                  {expanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                </span>
              </div>
            </div>
          </button>

          {/* Accordion content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {/* Specs grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className={`gem-spec ${tierGem.specBg} !p-2`}>
                      <p className="text-base font-bold text-taqon-charcoal dark:text-white tabular-nums">
                        {pkg.inverter_kva || tier.inverter_kva}
                      </p>
                      <p className="text-[9px] text-taqon-muted dark:text-white/40 font-medium">kVA</p>
                    </div>
                    <div className={`gem-spec ${tierGem.specBg} !p-2`}>
                      <p className="text-base font-bold text-taqon-charcoal dark:text-white tabular-nums">
                        {tier.battery_kwh && tier.battery_kwh !== '0.00' ? tier.battery_kwh : (pkg.battery_capacity_kwh || '—')}
                      </p>
                      <p className="text-[9px] text-taqon-muted dark:text-white/40 font-medium">kWh</p>
                    </div>
                    {pkg.panel_count > 0 && (
                      <div className={`gem-spec ${tierGem.specBg} !p-2`}>
                        <p className="text-base font-bold text-taqon-charcoal dark:text-white tabular-nums">
                          {pkg.panel_count}
                        </p>
                        <p className="text-[9px] text-taqon-muted dark:text-white/40 font-medium">Panels</p>
                      </div>
                    )}
                  </div>

                  {/* Price breakdown */}
                  {tier.price_breakdown && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-taqon-muted dark:text-white/40">
                        <span>Materials</span>
                        <span className="tabular-nums">${parseFloat(tier.price_breakdown.material).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-taqon-muted dark:text-white/40">
                        <span>Labour and Transport</span>
                        <span className="tabular-nums">${(parseFloat(tier.price_breakdown.labour) + parseFloat(tier.price_breakdown.transport)).toLocaleString()}</span>
                      </div>
                      <div
                        className="pt-2 mt-1.5 flex justify-between items-baseline"
                        style={{ borderTop: `1px solid color-mix(in srgb, ${tierGem.accent} 20%, transparent)` }}
                      >
                        <span className="font-semibold text-xs text-taqon-charcoal dark:text-white">Total</span>
                        <span className="text-lg font-bold tabular-nums font-syne" style={{ color: tierGem.accent }}>
                          ${totalPrice}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 space-y-1">
                    <p className="text-[11px] text-taqon-charcoal dark:text-white/70">
                      <span className="font-semibold">Best for:</span> {explanation.bestFor}
                    </p>
                    <p className="text-[11px] text-taqon-muted dark:text-white/50">
                      <span className="font-semibold text-taqon-charcoal dark:text-white/70">How it works:</span> {explanation.howItWorks}
                    </p>
                  </div>

                  {/* Why this matches you */}
                  {matchReason && (
                    <div className="p-2.5 rounded-lg border border-taqon-orange/20 bg-taqon-orange/5 dark:bg-taqon-orange/10 space-y-1">
                      <p className="text-[11px] font-bold text-taqon-orange flex items-center gap-1">
                        <Star size={10} weight="fill" /> Why this matches you
                      </p>
                      <p className="text-[11px] text-taqon-charcoal dark:text-white/80">{matchReason.priority}</p>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="flex gap-2">
                    <Link
                      to={`/packages/${pkg.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs text-white active:scale-[0.98] transition-all"
                      style={{
                        backgroundColor: tierGem.accent,
                        boxShadow: `0 4px 14px -2px ${tierGem.glowColorSubtle}`,
                      }}
                    >
                      View Details <ArrowRight size={12} weight="bold" />
                    </Link>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!detailsCollected) {
                          onRequestDetails?.();
                          return;
                        }
                        setDownloadingQuote(true);
                        try {
                          const res = await solarConfigApi.getInstantQuote({
                            package_slug: pkg.slug,
                            distance_km: distanceKm,
                            customer_name: clientDetails.name,
                            customer_email: clientDetails.email,
                            customer_phone: clientDetails.phone,
                            customer_address: clientDetails.area,
                            tier_label: tierLabels[tierKey] || tierKey,
                            session_id: sessionId,
                          });
                          const contentType = res.headers['content-type'] || 'application/pdf';
                          const ext = contentType.includes('html') ? 'html' : 'pdf';
                          const blob = new Blob([res.data], { type: contentType });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Taqon-Quote-${pkg.family_name || pkg.name}.${ext}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success('Quote downloaded!');
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Failed to generate quote');
                        } finally {
                          setDownloadingQuote(false);
                        }
                      }}
                      disabled={downloadingQuote}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-xs active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {downloadingQuote ? (
                        <SpinnerGap size={14} className="animate-spin" />
                      ) : (
                        <><DownloadSimple size={12} /> {detailsCollected ? 'Quote' : 'Get Quote'}</>
                      )}
                    </button>
                  </div>
                  {totalForDeposit > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDepositModal(true); }}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-taqon-charcoal dark:bg-white/10 text-white font-semibold text-xs hover:bg-taqon-charcoal/90 dark:hover:bg-white/15 active:scale-[0.98] transition-all"
                    >
                      <CurrencyDollar size={12} weight="bold" /> Pay 20% Deposit · USD {(totalForDeposit * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden md:flex md:flex-col md:flex-1 relative z-10 p-6">
          {/* Tier + Gem badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`gem-badge ${tierGem.badgeBg} ${tierGem.badgeText}`}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: tierGem.accent }}
              />
              {tierGem.label}
            </span>
            <span className={`gem-badge ${familyGem.badgeBg} ${familyGem.badgeText}`}>
              {familyGem.gem}
            </span>
          </div>

          {/* Package name */}
          <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
            {pkg.family_name || pkg.name}
          </h3>
          {pkg.variant_name && (
            <p className="text-xs text-taqon-muted dark:text-white/40 mt-0.5">{pkg.variant_name}</p>
          )}

          {/* Specs grid */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className={`gem-spec ${tierGem.specBg}`}>
              <p className="text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                {pkg.inverter_kva || tier.inverter_kva}
              </p>
              <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">kVA</p>
            </div>
            <div className={`gem-spec ${tierGem.specBg}`}>
              <p className="text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                {tier.battery_kwh && tier.battery_kwh !== '0.00' ? tier.battery_kwh : (pkg.battery_capacity_kwh || '—')}
              </p>
              <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">kWh</p>
            </div>
            {pkg.panel_count > 0 && (
              <div className={`gem-spec ${tierGem.specBg}`}>
                <p className="text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                  {pkg.panel_count}
                </p>
                <p className="text-xs text-taqon-muted dark:text-white/40 font-medium">Panels</p>
              </div>
            )}
          </div>

          {/* Price breakdown */}
          {tier.price_breakdown && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                <span>Materials</span>
                <span className="tabular-nums">${parseFloat(tier.price_breakdown.material).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-taqon-muted dark:text-white/40">
                <span>Labour and Transport</span>
                <span className="tabular-nums">${(parseFloat(tier.price_breakdown.labour) + parseFloat(tier.price_breakdown.transport)).toLocaleString()}</span>
              </div>
              <div
                className="pt-2.5 mt-2.5 flex justify-between items-baseline"
                style={{ borderTop: `1px solid color-mix(in srgb, ${tierGem.accent} 20%, transparent)` }}
              >
                <span className="font-semibold text-sm text-taqon-charcoal dark:text-white">Total</span>
                <span className="text-2xl font-bold tabular-nums font-syne" style={{ color: tierGem.accent }}>
                  ${totalPrice}
                </span>
              </div>
            </div>
          )}

          {/* Package explanation */}
          <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 space-y-1.5">
            <p className="text-xs text-taqon-charcoal dark:text-white/70">
              <span className="font-semibold">Best for:</span> {explanation.bestFor}
            </p>
            <p className="text-xs text-taqon-muted dark:text-white/50">
              <span className="font-semibold text-taqon-charcoal dark:text-white/70">How it works:</span> {explanation.howItWorks}
            </p>
            {explanation.whyUpgrade && (
              <p className="text-xs text-taqon-muted dark:text-white/50">
                <span className="font-semibold text-taqon-charcoal dark:text-white/70">Why upgrade:</span> {explanation.whyUpgrade}
              </p>
            )}
          </div>

          {/* Why this matches you */}
          {matchReason && (
            <div className="mt-3 p-3 rounded-xl border border-taqon-orange/20 bg-taqon-orange/5 dark:bg-taqon-orange/10 space-y-2">
              <p className="text-xs font-bold text-taqon-orange flex items-center gap-1.5">
                <Star size={12} weight="fill" /> Why this matches you
              </p>
              <p className="text-xs text-taqon-charcoal dark:text-white/80 leading-relaxed">
                {matchReason.priority}
              </p>
              <ul className="text-xs text-taqon-muted dark:text-white/60 space-y-1 pl-3">
                <li className="flex items-start gap-1.5">
                  <span className="text-taqon-orange mt-0.5 shrink-0">•</span>
                  {matchReason.loadBehavior}
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-taqon-orange mt-0.5 shrink-0">•</span>
                  {matchReason.goal}
                </li>
              </ul>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-5 space-y-2">
            <Link
              to={`/packages/${pkg.slug}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white active:scale-[0.98] transition-all min-h-[44px]"
              style={{
                backgroundColor: tierGem.accent,
                boxShadow: `0 4px 14px -2px ${tierGem.glowColorSubtle}`,
              }}
            >
              View Details <ArrowRight size={14} weight="bold" />
            </Link>
            <button
              onClick={async () => {
                if (!detailsCollected) {
                  onRequestDetails?.();
                  return;
                }
                setDownloadingQuote(true);
                try {
                  const res = await solarConfigApi.getInstantQuote({
                    package_slug: pkg.slug,
                    distance_km: distanceKm,
                    customer_name: clientDetails.name,
                    customer_email: clientDetails.email,
                    customer_phone: clientDetails.phone,
                    customer_address: clientDetails.area,
                    tier_label: tierLabels[tierKey] || tierKey,
                    session_id: sessionId,
                  });
                  const contentType = res.headers['content-type'] || 'application/pdf';
                  const ext = contentType.includes('html') ? 'html' : 'pdf';
                  const blob = new Blob([res.data], { type: contentType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Taqon-Quote-${pkg.family_name || pkg.name}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Quote downloaded!');
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Failed to generate quote');
                } finally {
                  setDownloadingQuote(false);
                }
              }}
              disabled={downloadingQuote}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-60"
            >
              {downloadingQuote ? (
                <SpinnerGap size={16} className="animate-spin" />
              ) : (
                <><DownloadSimple size={14} /> {detailsCollected ? 'Download Quote' : 'Get Instant Quote'}</>
              )}
            </button>
            {totalForDeposit > 0 && (
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-charcoal dark:bg-white/10 text-white font-semibold text-sm hover:bg-taqon-charcoal/90 dark:hover:bg-white/15 active:scale-[0.98] transition-all min-h-[44px] shadow-lg"
              >
                <CurrencyDollar size={14} weight="bold" />
                Pay 20% Deposit · USD {(totalForDeposit * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </button>
            )}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-[2px] rounded-b-xl md:rounded-b-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${tierGem.accent}, transparent)`,
            opacity: isHighlighted ? 0.6 : 0.25,
          }}
        />
      </div>

      {/* Quote Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <QuoteModal
            pkg={pkg}
            tierKey={tierKey}
            distanceKm={distanceKm}
            sessionId={sessionId}
            onClose={() => setShowQuoteModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            pkg={pkg}
            tierLabel={tierLabels[tierKey] || tierKey}
            packageTotal={totalForDeposit}
            distanceKm={distanceKm}
            onClose={() => setShowDepositModal(false)}
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

    q(400, { agent: 'PP_ENGINE', type: 'compute', text: 'Computing Power (PP) — concurrent load analysis...' });
    q(650, { agent: 'PP_ENGINE', type: 'result', text: `Total Power: ${totals.pp}` });
    q(350, { agent: 'EP_ENGINE', type: 'compute', text: 'Computing Energy (EP) — daily consumption model...' });
    q(650, { agent: 'EP_ENGINE', type: 'result', text: `Total Energy: ${totals.ep}` });
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

    q(400, { agent: 'PRICING', type: 'price', text: `Calculating pricing \u2014 materials, labour and transport...` });

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

// ── Session storage helpers ──
const SESSION_KEY = 'taqon-advisor-draft';
function loadDraft() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveDraft(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

export default function SolarAdvisor() {
  const draft = useRef(loadDraft());
  const { user } = useAuthStore();

  const [step, setStepRaw] = useState(draft.current?.step || 1);
  const [appliances, setAppliances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selections, setSelections] = useState(draft.current?.selections || {});
  const [distanceKm, setDistanceKm] = useState(draft.current?.distanceKm || 10);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAppliances, setLoadingAppliances] = useState(true);
  const [search, setSearch] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [recommendRun, setRecommendRun] = useState(0);
  const [preferences, setPreferences] = useState(draft.current?.preferences || {
    priority: 'balanced',
    willing_to_manage: false,
    use_style: 'backup_solar',
    wants_smart: false,
  });
  const [selectedArea, setSelectedArea] = useState(draft.current?.selectedArea || '');
  // customCoords is used when user clicks the map somewhere that isn't a known area
  const [customCoords, setCustomCoords] = useState(draft.current?.customCoords || null);
  const [clientDetails, setClientDetails] = useState(() => {
    const fromDraft = draft.current?.clientDetails;
    if (fromDraft && (fromDraft.name || fromDraft.phone || fromDraft.email)) return fromDraft;
    const pref = prefillFromUser(user);
    return { name: pref.name, phone: pref.phone, email: pref.email, area: fromDraft?.area || '' };
  });
  const [detailsCollected, setDetailsCollected] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

  // Handle map clicks — snap to nearest known area if close, else use custom coords
  const handleMapClick = useCallback((coords) => {
    const { area, snapped } = findNearestArea(coords, 3);
    if (snapped && area) {
      setSelectedArea(area.name);
      setCustomCoords(null);
      setDistanceKm(area.distance);
    } else {
      // Unknown location — use raw click coords, compute great-circle km to HQ
      setSelectedArea('Custom location');
      setCustomCoords(coords);
      const km = Math.max(1, Math.round(haversineKm(HQ_COORDS, coords)));
      setDistanceKm(km);
    }
  }, []);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // ── Persist draft to sessionStorage ──
  useEffect(() => {
    saveDraft({ step, selections, distanceKm, preferences, selectedArea, customCoords, clientDetails });
  }, [step, selections, distanceKm, preferences, selectedArea, customCoords, clientDetails]);

  // Auto-sync area from step 2 selection into client details (so the
  // quote download doesn't ask for it again).
  useEffect(() => {
    if (selectedArea && clientDetails.area !== selectedArea) {
      setClientDetails(d => ({ ...d, area: selectedArea }));
    }
  }, [selectedArea]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mirror the chosen location into the cross-page session helper so the
  // package detail page and deposit modal pre-fill it automatically.
  useEffect(() => {
    if (selectedArea) {
      saveLocation({ area: selectedArea, distanceKm, coords: customCoords });
    }
  }, [selectedArea, distanceKm, customCoords]);

  // ── Browser back/forward support ──
  const setStep = useCallback((newStep) => {
    setStepRaw(newStep);
    window.history.pushState({ step: newStep }, '', `#step-${newStep}`);
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.step) {
        setStepRaw(e.state.step);
      }
    };
    window.addEventListener('popstate', handlePopState);
    // Set initial history state
    window.history.replaceState({ step }, '', `#step-${step}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        // Default to "All Categories" (activeCategory stays null)
      } catch (err) {
        console.error('Failed to load appliances:', err);
      } finally {
        setLoadingAppliances(false);
      }
    };
    load();
  }, []);

  // Filter & sort appliances by category, search, and usage frequency.
  // Sort key: concurrency + night_use (higher = more frequently used).
  // This puts "always-on" items (fridge, router, CCTV, lights) at the
  // top and occasional-use items (hair dryer, toaster, pool pump) at
  // the bottom — matches how people pick appliances in practice.
  // Room order = category order (kitchen first -> other last). Matches
  // the category tabs above so when the user scans "All Categories" they
  // see kitchen appliances first, then lounge, then bedroom, etc.
  const CATEGORY_PRIORITY = useMemo(() => ({
    kitchen: 0, lounge: 1, bedroom: 2, bathroom: 3, laundry: 4,
    office: 5, outdoor: 6, security: 7, garage: 8, other: 9,
  }), []);

  const filteredAppliances = useMemo(() => {
    let filtered = appliances;
    if (activeCategory) {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q));
    }
    const usageScore = (a) => parseFloat(a.concurrency_factor || 0) + parseFloat(a.night_use_factor || 0);
    return [...filtered].sort((a, b) => {
      // Primary: group by room in the same order as the category tabs
      const catDiff = (CATEGORY_PRIORITY[a.category] ?? 99) - (CATEGORY_PRIORITY[b.category] ?? 99);
      if (catDiff !== 0) return catDiff;
      // Secondary within a room: usage frequency (most-used first)
      const usageDiff = usageScore(b) - usageScore(a);
      if (usageDiff !== 0) return usageDiff;
      // Tiebreakers
      const epDiff = parseFloat(b.energy_points || 0) - parseFloat(a.energy_points || 0);
      if (epDiff !== 0) return epDiff;
      return a.name.localeCompare(b.name);
    });
  }, [appliances, activeCategory, search, CATEGORY_PRIORITY]);

  // Running totals — with Zimbabwe market adjustment factors
  const ZIM_PP_FACTOR = 1.25;
  const ZIM_EP_FACTOR = 1.25;

  const totals = useMemo(() => {
    let pp = 0;
    let ep = 0;
    let count = 0;
    for (const [id, qty] of Object.entries(selections)) {
      if (qty <= 0) continue;
      const a = appliances.find((app) => app.id === id);
      if (!a) continue;
      pp += parseFloat(a.power_points) * qty * parseFloat(a.concurrency_factor);
      ep += parseFloat(a.energy_points) * qty * parseFloat(a.night_use_factor);
      count += qty;
    }
    // Apply Zimbabwe market factors
    pp *= ZIM_PP_FACTOR;
    ep *= ZIM_EP_FACTOR;
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

  // ── Analytics tracking ──
  const trackEvent = useCallback((event, data = {}) => {
    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        session_id: sessionStorage.getItem('taqon-session-id') || (() => {
          const id = `sa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          sessionStorage.setItem('taqon-session-id', id);
          return id;
        })(),
        ...data,
      };
      // Store locally for dashboard retrieval
      const events = JSON.parse(localStorage.getItem('taqon-advisor-events') || '[]');
      events.push(payload);
      // Keep last 200 events
      if (events.length > 200) events.splice(0, events.length - 200);
      localStorage.setItem('taqon-advisor-events', JSON.stringify(events));
      // Also fire to backend analytics (fire-and-forget)
      navigator.sendBeacon?.(
        '/api/v1/analytics/advisor-event/',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch {}
  }, []);

  // Track step progression
  useEffect(() => {
    trackEvent('step_view', { step });
  }, [step, trackEvent]);

  const handleRecommend = async ({ changeStep = true } = {}) => {
    setAnalysisComplete(false);
    setRecommendation(null);
    setRecommendError(null);
    setRecommendRun((prev) => prev + 1);
    if (changeStep) setStep(4);

    try {
      const applianceList = Object.entries(selections)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ appliance_id: id, quantity: qty }));

      const res = await solarConfigApi.getRecommendation({
        appliances: applianceList,
        distance_km: distanceKm,
        preferences,
      });
      setRecommendation(res.data);
      // Let slot numbers spin for a moment before settling
      setTimeout(() => setAnalysisComplete(true), 2500);
      // Track successful recommendation
      trackEvent('recommendation_complete', {
        total_pp: res.data.total_pp,
        total_ep: res.data.total_ep,
        tiers: Object.keys(res.data.tiers),
        appliance_count: applianceList.length,
        distance_km: distanceKm,
        preferences,
      });
    } catch (err) {
      console.error('Recommendation failed:', err);
      setRecommendError(err.response?.data?.detail || err.message || 'Failed to get recommendations');
      setAnalysisComplete(true); // stop spinner so error UI can render
    }
  };

  const hasSelections = Object.values(selections).some((q) => q > 0);

  // ── Session resume recovery ──
  // If a user lands on step 4 from a restored session, the recommendation
  // state was not persisted. Auto re-fetch once appliances have loaded
  // so the slot cards don't spin forever. If there are no selections,
  // fall back to step 1.
  const didResumeRef = useRef(false);
  useEffect(() => {
    if (didResumeRef.current) return;
    if (loadingAppliances) return;
    if (step !== 4) return;
    didResumeRef.current = true;

    if (!hasSelections) {
      setStepRaw(1);
      return;
    }
    if (!recommendation) {
      handleRecommend({ changeStep: false });
    }
  }, [loadingAppliances, step, hasSelections, recommendation]); // eslint-disable-line react-hooks/exhaustive-deps

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
              { num: 3, label: 'Preferences' },
              { num: 4, label: 'Results' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    if (num < step) { setStep(num); if (num < 4) setAnalysisComplete(false); }
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
                {num < 4 && (
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
                              onClick={() => updateQty(appliance.id, 1)}
                              className={`relative rounded-xl border cursor-pointer select-none transition-all active:scale-[0.97] ${
                                qty > 0
                                  ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10 ring-1 ring-taqon-orange/20 shadow-sm shadow-taqon-orange/10'
                                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-taqon-charcoal hover:border-taqon-orange/30 hover:shadow-md'
                              }`}
                            >
                              {/* Quantity badge */}
                              {qty > 0 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-taqon-orange text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md tabular-nums z-10">
                                  {qty}
                                </div>
                              )}

                              <div className="p-3 sm:p-3.5">
                                {/* Name + wattage */}
                                <h4 className="font-semibold text-xs sm:text-sm text-taqon-charcoal dark:text-white leading-snug line-clamp-2 mb-2">
                                  {appliance.name}
                                </h4>

                                {/* Controls */}
                                <div className="flex items-center justify-between">

                                  {qty > 0 ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => updateQty(appliance.id, -1)}
                                        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-taqon-charcoal dark:text-white hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 active:scale-90 transition-all"
                                        aria-label={`Remove one ${appliance.name}`}
                                      >
                                        <Minus size={12} weight="bold" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-bold text-taqon-orange tabular-nums">
                                        {qty}
                                      </span>
                                      <button
                                        onClick={() => updateQty(appliance.id, 1)}
                                        className="w-7 h-7 rounded-lg bg-taqon-orange/10 flex items-center justify-center text-taqon-orange hover:bg-taqon-orange/20 active:scale-90 transition-all"
                                        aria-label={`Add one more ${appliance.name}`}
                                      >
                                        <Plus size={12} weight="bold" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-taqon-orange font-medium">Tap to add</span>
                                  )}
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

                {/* Mobile bottom bar rendered outside steps */}
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
                    {/* Area / suburb dropdown */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-taqon-charcoal dark:text-white mb-4">
                        <MapPin size={16} className="text-taqon-orange" />
                        Your Area / Suburb
                      </label>

                      {/* Searchable dropdown */}
                      <div className="relative">
                        <div
                          onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-taqon-orange/40 transition-colors"
                        >
                          <span className={`text-sm ${selectedArea ? 'text-taqon-charcoal dark:text-white' : 'text-gray-400'}`}>
                            {selectedArea || 'Select your area...'}
                          </span>
                          {areaDropdownOpen
                            ? <CaretUp size={14} className="text-taqon-muted shrink-0" />
                            : <CaretDown size={14} className="text-taqon-muted shrink-0" />
                          }
                        </div>

                        <AnimatePresence>
                          {areaDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-[1000] mt-1.5 w-full bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
                            >
                              {/* Search inside dropdown */}
                              <div className="p-2 border-b border-gray-100 dark:border-white/10">
                                <div className="relative">
                                  <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted pointer-events-none" />
                                  <input
                                    type="text"
                                    value={areaSearch}
                                    onChange={(e) => setAreaSearch(e.target.value)}
                                    placeholder="Search area..."
                                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>

                              {/* Grouped area list */}
                              <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                {(() => {
                                  const q = areaSearch.toLowerCase();
                                  const filtered = q
                                    ? ZIMBABWE_AREAS.filter(a => a.name.toLowerCase().includes(q) || a.province.toLowerCase().includes(q))
                                    : ZIMBABWE_AREAS;
                                  const grouped = {};
                                  filtered.forEach(a => {
                                    if (!grouped[a.province]) grouped[a.province] = [];
                                    grouped[a.province].push(a);
                                  });
                                  const provinces = Object.keys(grouped);
                                  if (provinces.length === 0) {
                                    return (
                                      <div className="px-4 py-6 text-center text-sm text-taqon-muted dark:text-white/40">
                                        No areas found
                                      </div>
                                    );
                                  }
                                  return provinces.map(prov => (
                                    <div key={prov}>
                                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-taqon-muted dark:text-white/30 bg-gray-50 dark:bg-white/5 sticky top-0">
                                        {prov}
                                      </div>
                                      {grouped[prov].map(area => (
                                        <button
                                          key={area.name}
                                          onClick={() => {
                                            setSelectedArea(area.name);
                                            setCustomCoords(null);
                                            setDistanceKm(getDistanceByArea(area.name));
                                            setAreaDropdownOpen(false);
                                            setAreaSearch('');
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-taqon-orange/5 dark:hover:bg-taqon-orange/10 transition-colors flex items-center justify-between ${
                                            selectedArea === area.name ? 'bg-taqon-orange/10 text-taqon-orange font-medium' : 'text-taqon-charcoal dark:text-white/80'
                                          }`}
                                        >
                                          <span>{area.name}</span>
                                          <span className="text-xs text-taqon-muted dark:text-white/30 tabular-nums">{area.distance}km</span>
                                        </button>
                                      ))}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Subtle reassurance — no per-km math exposed */}
                      {selectedArea && (
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-taqon-muted dark:text-white/50">
                            Installation distance
                          </span>
                          <span className="font-semibold text-taqon-charcoal dark:text-white tabular-nums">
                            {distanceKm} km from Harare
                          </span>
                        </div>
                      )}

                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>Transport is included in the package total. Harare-based installations have the lowest transport cost.</span>
                        </p>
                      </div>

                      {/* Distance Map — click to pick location */}
                      <DistanceMap
                        clientCoords={customCoords || (selectedArea ? getAreaCoords(selectedArea) : null)}
                        distanceKm={distanceKm}
                        areaName={selectedArea}
                        onMapClick={handleMapClick}
                      />
                    </div>

                    {/* Selection Summary */}
                    <div className="p-4 rounded-xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">
                        Your Selection Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { value: totals.count, label: 'Appliances' },
                          { value: totals.pp, label: 'Power Need' },
                          { value: totals.ep, label: 'Battery Need' },
                        ].map(({ value, label }) => (
                          <div key={label} className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 text-center">
                            <p className="text-xl sm:text-2xl font-bold text-taqon-orange tabular-nums">{value}</p>
                            <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation — desktop only (mobile uses sticky bottom bar) */}
                  <div className="mt-6 sm:mt-8 hidden lg:flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all text-sm min-h-[44px]"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 min-h-[44px]"
                    >
                      Continue <ArrowRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                Step 3: Preferences
                ═══════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="step3" {...stepTransition} className="max-w-2xl mx-auto">
                <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-5 sm:p-8 shadow-sm space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
                    What Are Your Preferences?
                  </h2>

                  {/* Q1: Priority */}
                  <div>
                    <label className="block text-sm font-medium text-taqon-charcoal dark:text-white mb-3">What matters most to you?</label>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {[
                        { value: 'lowest_cost', label: 'Lowest Cost', desc: 'Most affordable workable system' },
                        { value: 'balanced', label: 'Best Balance', desc: 'Cost and performance balanced' },
                        { value: 'max_comfort', label: 'Max Comfort', desc: 'Maximum performance and comfort' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setPreferences(p => ({ ...p, priority: opt.value }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.priority === opt.value ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10' : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'}`}
                        >
                          <p className={`font-semibold text-sm ${preferences.priority === opt.value ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'}`}>{opt.label}</p>
                          <p className="text-xs text-taqon-muted dark:text-white/40 mt-1">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Load management */}
                  <div>
                    <label className="block text-sm font-medium text-taqon-charcoal dark:text-white mb-3">
                      Are you comfortable switching off heavy appliances when battery is low?
                    </label>
                    <div className="flex gap-3">
                      {[{ value: true, label: 'Yes, I can manage that' }, { value: false, label: 'No, I want full convenience' }].map(opt => (
                        <button
                          key={String(opt.value)}
                          onClick={() => setPreferences(p => ({ ...p, willing_to_manage: opt.value }))}
                          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${preferences.willing_to_manage === opt.value ? 'border-taqon-orange bg-taqon-orange/5 text-taqon-orange' : 'border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white hover:border-taqon-orange/30'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Use style */}
                  <div>
                    <label className="block text-sm font-medium text-taqon-charcoal dark:text-white mb-3">How do you want the system to work?</label>
                    <div className="space-y-2">
                      {[
                        { value: 'backup', label: 'Mainly for backup', desc: 'Keep the lights on during outages' },
                        { value: 'backup_solar', label: 'Backup + solar savings', desc: 'Backup power plus daytime solar to reduce bills' },
                        { value: 'independence', label: 'Maximum solar independence', desc: 'As little grid dependency as possible' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setPreferences(p => ({ ...p, use_style: opt.value }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${preferences.use_style === opt.value ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10' : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'}`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${preferences.use_style === opt.value ? 'border-taqon-orange' : 'border-gray-300 dark:border-white/20'}`}>
                            {preferences.use_style === opt.value && <div className="w-2 h-2 rounded-full bg-taqon-orange" />}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${preferences.use_style === opt.value ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'}`}>{opt.label}</p>
                            <p className="text-xs text-taqon-muted dark:text-white/40">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  {/* Navigation — desktop only (mobile uses sticky bottom bar) */}
                  <div className="hidden lg:flex gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all text-sm min-h-[44px]"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={handleRecommend}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 min-h-[44px]"
                    >
                      Get Recommendations <ArrowRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                Step 4: Analysis + Recommendations
                ═══════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div key="step4" {...stepTransition}>
                {/* Casino-style slot cards during analysis */}
                {!analysisComplete && !recommendError && (
                  <RecommendationSlotCards settled={false} />
                )}

                {/* Error state */}
                {recommendError && (
                  <div className="max-w-xl mx-auto text-center py-10 px-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 text-red-500 mb-4">
                      <X size={26} weight="bold" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">
                      Couldn't load recommendations
                    </h3>
                    <p className="text-sm text-taqon-muted dark:text-white/50 mb-5">{recommendError}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <button
                        onClick={() => handleRecommend({ changeStep: false })}
                        className="px-5 py-2.5 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 transition-all"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                      >
                        Start over
                      </button>
                    </div>
                  </div>
                )}

                {/* Recommendations (appear after analysis completes) */}
                {analysisComplete && recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Header */}
                    <div className="text-center mb-4 md:mb-10">
                      <h2 className="text-xl md:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
                        Your <span className="text-gradient">Recommendations</span>
                      </h2>
                      <p className="mt-1 md:mt-2 text-xs md:text-base text-taqon-muted dark:text-white/50">
                        Based on {totals.count} appliance{totals.count !== 1 ? 's' : ''} at {distanceKm}km from Harare
                      </p>
                    </div>

                    {/* Tier cards — dynamic grid based on result count */}
                    {(() => {
                      const tierEntries = ['budget', 'good_fit', 'excellent'].filter(k => recommendation.tiers[k]?.package);
                      const cols = tierEntries.length === 1 ? 'max-w-lg mx-auto' : tierEntries.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 md:items-start gap-2.5 md:gap-6 max-w-3xl mx-auto' : 'grid grid-cols-1 md:grid-cols-3 md:items-start gap-2.5 md:gap-6 max-w-5xl mx-auto';
                      return (
                        <div className={cols}>
                          {tierEntries.map((tierKey) => (
                            <RecommendationCard
                              key={tierKey}
                              tierKey={tierKey}
                              tier={recommendation.tiers[tierKey]}
                              isHighlighted={recommendation.tiers[tierKey].best_match || tierEntries.length === 1}
                              distanceKm={distanceKm}
                              clientDetails={clientDetails}
                              detailsCollected={detailsCollected}
                              onRequestDetails={() => setShowDetailsModal(true)}
                              preferences={preferences}
                              sessionId={recommendation?.session_id}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Client details CTA / success */}
                    <div className="max-w-xl mx-auto mt-10 sm:mt-12">
                      {!detailsCollected ? (
                        <div className="rounded-2xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 text-taqon-orange flex items-center justify-center shrink-0">
                            <FileText size={20} weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-taqon-charcoal dark:text-white">Get your quotes</p>
                            <p className="text-xs text-taqon-muted dark:text-white/50 mt-0.5">Share a few details to unlock PDF downloads for any package.</p>
                          </div>
                          <button
                            onClick={() => setShowDetailsModal(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 min-h-[44px]"
                          >
                            <DownloadSimple size={16} weight="bold" /> Unlock Downloads
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 p-5 sm:p-6 flex items-center gap-3">
                          <CheckCircle size={24} className="text-emerald-500 shrink-0" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Details saved</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400/70 mt-0.5">You can now download quotes for any package above.</p>
                          </div>
                          <button
                            onClick={() => setShowDetailsModal(true)}
                            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Download All Quotes button */}
                    {detailsCollected && recommendation && (
                      <div className="max-w-xl mx-auto mt-4">
                        <button
                          onClick={async () => {
                            setDownloadingAll(true);
                            const tierEntries = ['budget', 'good_fit', 'excellent'].filter(k => recommendation.tiers[k]?.package);
                            try {
                              for (let idx = 0; idx < tierEntries.length; idx++) {
                                const tierKey = tierEntries[idx];
                                const pkg = recommendation.tiers[tierKey].package;
                                const res = await solarConfigApi.getInstantQuote({
                                  package_slug: pkg.slug,
                                  distance_km: distanceKm,
                                  customer_name: clientDetails.name,
                                  customer_email: clientDetails.email,
                                  customer_phone: clientDetails.phone,
                                  customer_address: clientDetails.area,
                                  tier_label: tierLabels[tierKey] || tierKey,
                                  session_id: recommendation?.session_id,
                                });
                                const contentType = res.headers['content-type'] || 'application/pdf';
                                const ext = contentType.includes('html') ? 'html' : 'pdf';
                                const blob = new Blob([res.data], { type: contentType });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Taqon-${tierLabels[tierKey] || tierKey}-${pkg.family_name || pkg.name}.${ext}`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                // Delay between downloads so browser doesn't block them
                                if (idx < tierEntries.length - 1) await new Promise(r => setTimeout(r, 800));
                              }
                              toast.success(`${tierEntries.length} quotes downloaded!`);
                            } catch (err) {
                              toast.error(err.response?.data?.error || 'Failed to download all quotes');
                            } finally {
                              setDownloadingAll(false);
                            }
                          }}
                          disabled={downloadingAll}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-charcoal dark:bg-white/10 text-white font-semibold text-sm hover:bg-taqon-charcoal/90 dark:hover:bg-white/15 active:scale-[0.98] transition-all shadow-lg min-h-[44px] disabled:opacity-60"
                        >
                          {downloadingAll ? (
                            <><SpinnerGap size={16} className="animate-spin" /> Downloading...</>
                          ) : (
                            <><DownloadSimple size={16} weight="bold" /> Download All Quotes</>
                          )}
                        </button>
                      </div>
                    )}

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

        {/* Mobile sticky bottom bar — visible on steps 1-3 */}
        {step <= 3 && (
          <MobileBottomBar
            step={step}
            totals={totals}
            hasSelections={hasSelections}
            selections={selections}
            appliances={appliances}
            onNext={() => {
              if (step === 1) setStep(2);
              else if (step === 2) setStep(3);
              else if (step === 3) handleRecommend();
            }}
            onBack={() => setStep(step - 1)}
            onRemove={(id) => updateQty(id, -(selections[id] || 0))}
          />
        )}
      </section>

      {/* Client details modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <ClientDetailsModal
            clientDetails={clientDetails}
            setClientDetails={setClientDetails}
            selectedArea={selectedArea}
            distanceKm={distanceKm}
            onSubmit={() => {
              setDetailsCollected(true);
              setShowDetailsModal(false);
              toast.success('Details saved! You can now download quotes.');
            }}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Client Details Modal ─── */
function ClientDetailsModal({ clientDetails, setClientDetails, selectedArea, distanceKm, onSubmit, onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientDetails.name.trim() || !clientDetails.phone.trim()) return;
    // Carry the chosen area into shared session so deposit / package detail
    // flows pick it up automatically.
    const area = (selectedArea || clientDetails.area || '').trim();
    if (area) saveLocation({ area, distanceKm });
    onSubmit();
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
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
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
              Get Your Quotes
            </h3>
          </div>
          <p className="text-sm text-taqon-muted dark:text-white/50">
            Share a few details to unlock PDF downloads for all three packages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={clientDetails.name}
              onChange={(e) => setClientDetails((d) => ({ ...d, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={clientDetails.phone}
              onChange={(e) => setClientDetails((d) => ({ ...d, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="+263 77 123 4567"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={clientDetails.email}
              onChange={(e) => setClientDetails((d) => ({ ...d, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              placeholder="john@example.com"
            />
          </div>
          {selectedArea ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-taqon-orange/5 border border-taqon-orange/20">
              <MapPin size={14} className="text-taqon-orange shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-taqon-muted dark:text-white/50 uppercase tracking-wider">Installation Area</p>
                <p className="text-sm font-medium text-taqon-charcoal dark:text-white truncate">
                  {selectedArea} &middot; {distanceKm}km from Harare
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Installation Area</label>
              <input
                type="text"
                value={clientDetails.area}
                onChange={(e) => setClientDetails((d) => ({ ...d, area: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                placeholder="Borrowdale, Harare"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 min-h-[44px]"
          >
            <DownloadSimple size={16} weight="bold" /> Save &amp; Unlock Downloads
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
