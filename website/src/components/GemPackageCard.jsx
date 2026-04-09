/**
 * GemPackageCard — Premium gem-stone styled solar package card.
 *
 * Used on:
 *   - FamilyDetail page (individual variant cards)
 *   - Packages page (static fallback cards)
 *
 * Each card receives a gem identity from its family and renders
 * with the corresponding color accent, gradient, shimmer, and glow.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Lightning } from '@phosphor-icons/react';
import { getGemFamily } from '../data/gemFamilies';

function formatPrice(price) {
  const num = parseFloat(price);
  if (!num || isNaN(num)) return 'Contact';
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function GemPackageCard({
  pkg,
  familySlug,
  familyKva,
  index = 0,
  linkPrefix = '/packages',
}) {
  const gem = getGemFamily(familySlug);
  const slug = pkg.slug || pkg.id;
  const name = pkg.name || pkg.variant_name || 'Package';
  const variantName = pkg.variant_name;
  const kva = pkg.inverter_kva || familyKva;
  const panels = pkg.panel_count;
  const phase = pkg.phase || '1P';
  const price = pkg.price;
  const isPopular = pkg.is_popular || pkg.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`${linkPrefix}/${slug}`}
        className="group block h-full"
      >
        <div
          className={`gem-card relative h-full rounded-2xl border ${gem.borderColor} bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm`}
          style={{
            '--gem-shimmer': gem.shimmerColor,
          }}
        >
          {/* Glow ring — visible on hover */}
          <div
            className="gem-glow"
            style={{
              boxShadow: `0 0 24px 2px ${gem.glowColorSubtle}, inset 0 0 24px 2px ${gem.glowColorSubtle}`,
            }}
          />

          {/* Shimmer sweep overlay */}
          <div className="gem-shimmer" />

          {/* Header gradient band */}
          <div
            className={`gem-header-gradient bg-gradient-to-br ${gem.headerGradient}`}
          />

          {/* Card content */}
          <div className="relative z-10 p-6 flex flex-col h-full">
            {/* Top row: gem badge + popular */}
            <div className="flex items-center justify-between mb-3">
              <span className={`gem-badge ${gem.badgeBg} ${gem.badgeText}`}>
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: gem.accent }}
                />
                {gem.gem}
              </span>

              {isPopular && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-taqon-orange/10 text-taqon-orange">
                  <Star size={10} weight="fill" /> Popular
                </span>
              )}
            </div>

            {/* Package name */}
            <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors leading-tight">
              {name}
            </h3>
            {variantName && (
              <p className="text-xs text-taqon-muted dark:text-white/40 mt-1">
                Variant: {variantName}
              </p>
            )}

            {/* Specs row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className={`gem-spec ${gem.specBg}`}>
                <p className="text-lg font-bold text-taqon-charcoal dark:text-white tabular-nums">
                  {kva}
                </p>
                <p className="text-[10px] text-taqon-muted dark:text-white/40 font-medium">
                  kVA
                </p>
              </div>
              {panels > 0 && (
                <div className={`gem-spec ${gem.specBg}`}>
                  <p className="text-lg font-bold text-taqon-charcoal dark:text-white tabular-nums">
                    {panels}
                  </p>
                  <p className="text-[10px] text-taqon-muted dark:text-white/40 font-medium">
                    Panels
                  </p>
                </div>
              )}
              <div className={`gem-spec ${gem.specBg}`}>
                <p className="text-lg font-bold text-taqon-charcoal dark:text-white tabular-nums">
                  {phase}
                </p>
                <p className="text-[10px] text-taqon-muted dark:text-white/40 font-medium">
                  Phase
                </p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Price + CTA */}
            <div className="mt-5 flex items-center justify-between">
              <span
                className="text-2xl font-bold font-syne tabular-nums"
                style={{ color: gem.accent }}
              >
                {formatPrice(price)}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-taqon-muted dark:text-white/50 group-hover:text-taqon-orange group-hover:gap-2.5 transition-all">
                View <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${gem.accent}, transparent)`,
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
