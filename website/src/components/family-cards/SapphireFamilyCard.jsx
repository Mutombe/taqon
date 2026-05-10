import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Sun, Lightning } from '@phosphor-icons/react';
import { openPackageBrochure } from '../../lib/packageBrochure';

/**
 * Family-specific card for the entry-level Home Economy / 3 kVA tier.
 *
 * Identity: Sapphire — "Dawn horizon".
 *
 *   - Restrained, humble horizontal layout (vs the generic gem card)
 *   - Sapphire blues instead of brand orange
 *   - Horizon-lines motif as a faint dawn at the bottom of the card —
 *     pure CSS gradient stripes, scales cleanly, dark-mode safe
 *   - Specs read as a small list, not a big numeric flex
 *
 * Sized to fit alongside the standard `gem-card` in the listing grid.
 */
export default function SapphireFamilyCard({ pkg, delay = 0 }) {
  // Sapphire color stack
  const accent = '#2563EB';
  const accentLight = '#60A5FA';
  const accentDark = '#1E40AF';
  const surface = '#EFF6FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link to={`/packages/${pkg.slug}`} className="group block h-full">
        <div
          className="relative h-full flex flex-col rounded-3xl border bg-white dark:bg-taqon-charcoal overflow-hidden transition-all hover:-translate-y-0.5"
          style={{
            borderColor: 'rgba(37, 99, 235, 0.18)',
            boxShadow:
              '0 1px 0 0 rgba(37, 99, 235, 0.04), 0 12px 32px -16px rgba(37, 99, 235, 0.18)',
          }}
        >
          {/* Horizon-lines motif — fixed at the bottom of the card. Stacked
              horizontal slabs in increasing opacity simulate a dawn glow
              without resorting to a background image. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden">
            <div
              className="absolute inset-x-0 bottom-0 h-1.5"
              style={{ background: accent, opacity: 0.15 }}
            />
            <div
              className="absolute inset-x-0 h-px"
              style={{ background: accent, opacity: 0.22, bottom: '14px' }}
            />
            <div
              className="absolute inset-x-0 h-px"
              style={{ background: accent, opacity: 0.16, bottom: '28px' }}
            />
            <div
              className="absolute inset-x-0 h-px"
              style={{ background: accent, opacity: 0.10, bottom: '46px' }}
            />
            <div
              className="absolute inset-x-0 h-px"
              style={{ background: accent, opacity: 0.06, bottom: '70px' }}
            />
            {/* Soft warm wash above the lines — the rising sun colour */}
            <div
              className="absolute inset-x-0 bottom-0 h-32"
              style={{
                background:
                  'linear-gradient(to top, rgba(37, 99, 235, 0.10) 0%, rgba(37, 99, 235, 0.02) 60%, transparent 100%)',
              }}
            />
          </div>

          {/* Top-left rising-sun motif — tiny detail, not a logo */}
          <div className="pointer-events-none absolute top-5 right-5 opacity-50">
            <Sun
              size={48}
              weight="duotone"
              style={{ color: accent }}
            />
          </div>

          {/* Content — humble horizontal flow */}
          <div className="relative z-10 p-7 flex flex-col h-full">
            {/* Gem badge */}
            <span
              className="self-start inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.10)',
                color: accentDark,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              Sapphire · Home Economy
            </span>

            {/* Title row — name on left, kVA chip on right */}
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                {pkg.name}
              </h3>
              <span
                className="flex-shrink-0 text-[11px] font-bold tracking-wider px-2 py-1 rounded-md"
                style={{
                  backgroundColor: surface,
                  color: accentDark,
                }}
              >
                {pkg.kvaRating || '3 kVA'}
              </span>
            </div>

            {/* Positioning line */}
            <p className="text-sm text-taqon-muted dark:text-white/55 leading-relaxed mb-5">
              {pkg.description}
            </p>

            {/* Compact spec list — no big-number flex */}
            <div className="space-y-2 mb-6">
              {(pkg.features || []).slice(0, 3).map((feature, i) => {
                const text = typeof feature === 'string' ? feature : feature?.title ?? '';
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 inline-block w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-[13px] text-taqon-charcoal/80 dark:text-white/70">
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price — restrained, secondary to the positioning */}
            <div className="mt-auto">
              <p className="text-[10px] uppercase tracking-widest text-taqon-muted dark:text-white/40 font-semibold mb-1">
                From
              </p>
              <p
                className="text-2xl font-bold font-syne tabular-nums mb-5"
                style={{ color: accentDark }}
              >
                {pkg.price}
              </p>

              {/* Two CTAs side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-xs text-white transition-all"
                  style={{ backgroundColor: accent }}
                >
                  View Details <ArrowRight size={12} weight="bold" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPackageBrochure(pkg);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all hover:bg-blue-50/50 dark:hover:bg-white/5"
                  style={{
                    borderColor: 'rgba(37, 99, 235, 0.25)',
                    color: accentDark,
                  }}
                >
                  <FileText size={12} weight="duotone" /> Brochure
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
