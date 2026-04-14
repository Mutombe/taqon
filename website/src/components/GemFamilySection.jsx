/**
 * GemFamilySection — Premium family grouping card for the Packages page.
 *
 * Renders a family header with gem identity (color accent, glow, gradient)
 * and provides navigation to the family detail page. Visually groups
 * variants under one gem-like section divider.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Lightning } from '@phosphor-icons/react';
import { getGemFamily } from '../data/gemFamilies';
import AnimatedSection from './AnimatedSection';

export default function GemFamilySection({
  family,
  index = 0,
  isLiked = false,
  onToggleLike,
}) {
  const gem = getGemFamily(family.slug);
  const navigate = useNavigate();
  const targetPath = `/families/${family.slug}`;

  const handleCardClick = () => navigate(targetPath);
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(targetPath);
    }
  };

  return (
    <AnimatedSection delay={index * 0.08}>
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKey}
        className="gem-family-header border bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-taqon-orange/40"
        style={{
          borderColor: `color-mix(in srgb, ${gem.accent} 25%, transparent)`,
          '--gem-family-accent': gem.accent,
        }}
      >
        {/* Background gradient orb (positioned via CSS ::after + inline style) */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: gem.accent }}
        />

        {/* Accent left edge bar */}
        <div
          className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full"
          style={{
            background: `linear-gradient(180deg, transparent, ${gem.accent}, transparent)`,
          }}
        />

        <div className="relative z-10 p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {/* Gem badge */}
              <span className={`gem-badge ${gem.badgeBg} ${gem.badgeText} mb-3`}>
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: gem.accent }}
                />
                {family.name}
              </span>

              {/* Family name */}
              <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)` }}
                >
                  <Lightning
                    size={18}
                    weight="fill"
                    style={{ color: gem.accent }}
                  />
                </div>
                {family.name}
              </h2>

              {/* Meta line */}
              <p className="mt-2 text-sm text-taqon-muted dark:text-white/50 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{family.kva_rating} kVA</span>
                <span className="w-1 h-1 rounded-full bg-taqon-muted/30" />
                <span>{family.package_count} variant{family.package_count !== 1 ? 's' : ''}</span>
                {family.price_min && family.price_max && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-taqon-muted/30" />
                    <span className="font-semibold" style={{ color: gem.accent }}>
                      ${parseFloat(family.price_min).toLocaleString()} – ${parseFloat(family.price_max).toLocaleString()}
                    </span>
                  </>
                )}
              </p>

              {family.short_description && (
                <p className="mt-2 text-sm text-taqon-muted dark:text-white/50 max-w-lg leading-relaxed">
                  {family.short_description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {onToggleLike && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(family.slug);
                  }}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  aria-label="Save package family"
                >
                  <Heart
                    size={18}
                    weight={isLiked ? 'fill' : 'regular'}
                    className={isLiked ? 'text-red-500' : 'text-gray-400'}
                  />
                </motion.button>
              )}
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-lg group-hover:shadow-xl"
                style={{
                  backgroundColor: gem.accent,
                  boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}`,
                }}
              >
                Explore Variants <ArrowRight size={14} weight="bold" />
              </span>
            </div>
          </div>

          {/* Suitable-for tags */}
          {family.suitable_for && family.suitable_for.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {family.suitable_for.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${gem.accent} 10%, transparent)`,
                    color: gem.accent,
                  }}
                >
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom accent gradient line */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${gem.accent}, transparent)`,
            opacity: 0.2,
          }}
        />
      </div>
    </AnimatedSection>
  );
}
