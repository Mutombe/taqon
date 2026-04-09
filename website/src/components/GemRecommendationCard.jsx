/**
 * GemRecommendationCard — Premium gem-styled recommendation card
 * for the SolarAdvisor results step.
 *
 * Combines the tier-specific color (Budget/Good Fit/Excellent)
 * with the family gem identity for a dual-layer visual effect.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star, ArrowRight, CaretDown, CaretUp, FileText,
} from '@phosphor-icons/react';
import { getGemFamily, TIER_GEMS } from '../data/gemFamilies';
import AnimatedSection from './AnimatedSection';

function formatPrice(val) {
  const num = parseFloat(val);
  if (!num || isNaN(num)) return 'Contact';
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function GemRecommendationCard({
  tierKey,
  tier,
  isHighlighted,
  distanceKm,
  onRequestQuote,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const pkg = tier.package;
  const tierGem = TIER_GEMS[tierKey];
  const familyGem = getGemFamily(pkg.family_slug || pkg.slug);

  return (
    <AnimatedSection delay={tierKey === 'budget' ? 0 : tierKey === 'good_fit' ? 0.1 : 0.2}>
      <div
        className={`gem-rec-card relative rounded-2xl sm:rounded-3xl border-2 h-full flex flex-col bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm ${tierGem.borderColor} ${
          isHighlighted ? 'gem-rec-highlighted' : ''
        }`}
        style={{
          '--gem-border': tierGem.glowColor,
          '--gem-glow': tierGem.glowColorSubtle,
          '--gem-shimmer': tierGem.shimmerColor,
        }}
      >
        {/* Inner clip — contains gradient & shimmer so they respect border-radius
            while the outer card keeps overflow:visible for the badge */}
        <div className="gem-rec-inner">
          <div className={`absolute inset-0 bg-gradient-to-br ${tierGem.gradient} pointer-events-none`} />
          <div className="gem-shimmer" />
        </div>

        {/* Highlighted badge */}
        {isHighlighted && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: tierGem.accent,
              boxShadow: `0 4px 14px -2px ${tierGem.glowColor}`,
            }}
          >
            <Star size={12} weight="fill" /> {tierGem.label}
          </div>
        )}

        <div className="relative z-10 p-5 sm:p-6 flex flex-col flex-1">
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
          <h3 className="text-lg sm:text-xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
            {pkg.family_name || pkg.name}
          </h3>
          {pkg.variant_name && (
            <p className="text-xs text-taqon-muted dark:text-white/40 mt-0.5">
              {pkg.variant_name}
            </p>
          )}

          {/* Specs grid */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className={`gem-spec ${tierGem.specBg}`}>
              <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                {pkg.inverter_kva || tier.inverter_kva}
              </p>
              <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">
                kVA
              </p>
            </div>
            <div className={`gem-spec ${tierGem.specBg}`}>
              <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                {pkg.battery_capacity_kwh || tier.battery_kwh}
              </p>
              <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">
                kWh
              </p>
            </div>
            {pkg.panel_count > 0 && (
              <div className={`gem-spec ${tierGem.specBg}`}>
                <p className="text-lg sm:text-xl font-bold text-taqon-charcoal dark:text-white tabular-nums">
                  {pkg.panel_count}
                </p>
                <p className="text-[10px] sm:text-xs text-taqon-muted dark:text-white/40 font-medium">
                  Panels
                </p>
              </div>
            )}
          </div>

          {/* Price section */}
          {tier.price_breakdown && (
            <div className="mt-4 flex-1">
              {/* Mobile: collapsible */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full flex items-center justify-between py-2.5 min-h-[44px]"
                >
                  <span
                    className="text-2xl font-bold tabular-nums font-syne"
                    style={{ color: tierGem.accent }}
                  >
                    {formatPrice(tier.price_breakdown.total)}
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
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <PriceBreakdown breakdown={tier.price_breakdown} accentColor={tierGem.accent} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop: always visible */}
              <div className="hidden md:block">
                <p
                  className="text-2xl font-bold tabular-nums font-syne mb-3"
                  style={{ color: tierGem.accent }}
                >
                  {formatPrice(tier.price_breakdown.total)}
                </p>
                <PriceBreakdown breakdown={tier.price_breakdown} accentColor={tierGem.accent} />
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-5 flex flex-col gap-2">
            {onRequestQuote && (
              <button
                onClick={() => onRequestQuote(tierKey, tier)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white active:scale-[0.98] transition-all"
                style={{
                  backgroundColor: tierGem.accent,
                  boxShadow: `0 4px 14px -2px ${tierGem.glowColorSubtle}`,
                }}
              >
                <FileText size={16} weight="bold" /> Request Quote
              </button>
            )}
            <Link
              to={`/packages/${pkg.slug}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              View Details <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-[2px] rounded-b-2xl sm:rounded-b-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${tierGem.accent}, transparent)`,
            opacity: isHighlighted ? 0.6 : 0.2,
          }}
        />
      </div>
    </AnimatedSection>
  );
}


function PriceBreakdown({ breakdown, accentColor }) {
  const lines = [
    { label: 'Equipment', value: breakdown.equipment },
    { label: 'Installation', value: breakdown.installation },
    { label: 'Transport', value: breakdown.transport },
  ].filter(l => l.value && parseFloat(l.value) > 0);

  if (lines.length === 0) return null;

  return (
    <div className="space-y-1.5 text-sm">
      {lines.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-taqon-muted dark:text-white/40">{label}</span>
          <span className="font-medium text-taqon-charcoal dark:text-white/70 tabular-nums">
            {formatPrice(value)}
          </span>
        </div>
      ))}
      <div
        className="h-px my-2"
        style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}
      />
      <div className="flex items-center justify-between font-bold">
        <span className="text-taqon-charcoal dark:text-white">Total</span>
        <span className="tabular-nums" style={{ color: accentColor }}>
          {formatPrice(breakdown.total)}
        </span>
      </div>
    </div>
  );
}
