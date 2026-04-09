import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Lightning, MagnifyingGlass, Heart } from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import GemFamilySection from '../components/GemFamilySection';
import GemPackageCard from '../components/GemPackageCard';
import { autoLink } from '../components/ContentLink';
import SEO from '../components/SEO';
import { packagesDetailed } from '../data/packagesData';
import { getGemFamily } from '../data/gemFamilies';
import { useFamilies } from '../hooks/useQueries';
import useSavesStore from '../stores/savesStore';

/**
 * Slug-to-gem mapping for the static fallback cards.
 * Maps each packagesDetailed slug to a gem family slug.
 */
const STATIC_GEM_MAP = {
  economy: 'home-economy',
  'quick-access': 'home-quick-access',
  luxury: 'home-luxury',
  'luxury-beta': 'home-luxury-beta',
  deluxe: 'home-deluxe',
  '8kva-ultra-power': '8kva-ultra-power',
  '10kva-premium-power': '10kva-premium-power',
  '12kva-propower': '12kva-propower',
  '16kva-masterpower': '16kva-masterpower',
  '20-24kva-ultramax': '20-24kva-ultramax',
};

export default function Packages() {
  const { data: families, isLoading: loading } = useFamilies();
  const { togglePackage, likedPackages } = useSavesStore();

  const useApi = families && families.length > 0;

  return (
    <>
      <SEO
        title="Solar Packages"
        description="Compare Taqon Electrico's solar packages — from starter home systems to commercial 24kVA power solutions. Find the perfect fit for your needs."
        keywords="solar packages Zimbabwe, home solar system, commercial solar package, solar system comparison"
        canonical="https://www.taqon.co.zw/packages"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-30" loading="eager" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Solar Packages</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              The <span className="text-gradient">Gem</span> Collection
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              {autoLink('From starter systems to commercial powerhouses — find your perfect solar solution.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Find Your Package Banner */}
      <section className="py-8 bg-taqon-cream dark:bg-taqon-charcoal border-b border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-taqon-dark border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                  <MagnifyingGlass size={20} className="text-taqon-orange" />
                </div>
                <div>
                  <h3 className="font-semibold font-syne text-taqon-charcoal dark:text-white">
                    Not sure which package?
                  </h3>
                  <p className="text-sm text-taqon-muted dark:text-white/50">
                    Tell us what appliances you want to power and we'll recommend the perfect system.
                  </p>
                </div>
              </div>
              <Link
                to="/solar-advisor"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-taqon-orange text-white rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25 whitespace-nowrap"
              >
                Find Your Package <ArrowRight size={14} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            /* Loading skeletons with gem-like shimmer hint */
            <div className="space-y-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-3xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-6 lg:p-8 animate-pulse overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-taqon-orange/20 via-taqon-orange/40 to-taqon-orange/20 rounded-full" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-full w-28 mb-3" />
                      <div className="h-7 bg-gray-200 dark:bg-white/10 rounded-lg w-56 mb-2" />
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-72" />
                    </div>
                    <div className="h-10 w-36 bg-gray-200 dark:bg-white/10 rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-gray-100 dark:bg-white/5 rounded-full" />
                    <div className="h-5 w-24 bg-gray-100 dark:bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : useApi ? (
            /* ── API-driven gem family cards ── */
            <div className="space-y-8">
              {families.map((family, fi) => (
                <GemFamilySection
                  key={family.id}
                  family={family}
                  index={fi}
                  isLiked={likedPackages.includes(family.slug)}
                  onToggleLike={togglePackage}
                />
              ))}
            </div>
          ) : (
            /* ── Static fallback: gem-styled individual cards ── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagesDetailed.map((pkg, i) => {
                const gemSlug = STATIC_GEM_MAP[pkg.slug] || pkg.slug;
                const gem = getGemFamily(gemSlug);
                const isDark = pkg.tier === 'premium' || pkg.tier === 'commercial';

                return (
                  <AnimatedSection key={pkg.slug} delay={i * 0.08}>
                    <Link to={`/packages/${pkg.slug}`} className="group block h-full">
                      <div
                        className={`gem-card relative rounded-3xl border ${gem.borderColor} h-full flex flex-col bg-white dark:bg-taqon-charcoal/80 backdrop-blur-sm ${pkg.popular ? `ring-2 ${gem.ringColor}` : ''}`}
                        style={{ '--gem-shimmer': gem.shimmerColor }}
                      >
                        {/* Glow */}
                        <div
                          className="gem-glow"
                          style={{
                            boxShadow: `0 0 24px 2px ${gem.glowColorSubtle}, inset 0 0 24px 2px ${gem.glowColorSubtle}`,
                          }}
                        />
                        <div className="gem-shimmer" />
                        <div className={`gem-header-gradient bg-gradient-to-br ${gem.headerGradient}`} />

                        {/* Popular badge */}
                        {pkg.popular && (
                          <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg"
                            style={{
                              backgroundColor: gem.accent,
                              boxShadow: `0 4px 14px -2px ${gem.glowColor}`,
                            }}
                          >
                            <Star size={12} weight="fill" /> Most Popular
                          </div>
                        )}

                        <div className="relative z-10 p-8 flex flex-col h-full">
                          {/* Gem badge */}
                          <span className={`gem-badge self-start mb-3 ${gem.badgeBg} ${gem.badgeText}`}>
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: gem.accent }} />
                            {gem.gem}
                          </span>

                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)` }}
                            >
                              <Lightning size={16} weight="fill" style={{ color: gem.accent }} />
                            </div>
                            <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                              {pkg.name}
                            </h3>
                          </div>

                          <p className="text-sm text-taqon-muted dark:text-white/50 mb-4 leading-relaxed">
                            {autoLink(pkg.description)}
                          </p>

                          {/* Price */}
                          <div className="text-3xl font-bold font-syne mb-5 tabular-nums" style={{ color: gem.accent }}>
                            {pkg.price}
                          </div>

                          {/* Capacity bar with gem accent */}
                          <div className="mb-5">
                            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 w-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pkg.capacityPercent}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                  background: `linear-gradient(90deg, ${gem.accentLight}, ${gem.accent})`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[10px] text-taqon-muted dark:text-white/30">
                              <span>Starter</span>
                              <span style={{ color: gem.accent }}>{pkg.kvaRating}</span>
                              <span>Commercial</span>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2.5 flex-1">
                            {pkg.features.slice(0, 4).map((feature, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <Check size={14} weight="bold" style={{ color: gem.accent }} className="flex-shrink-0" />
                                <span className="text-sm text-taqon-muted dark:text-white/60">{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA */}
                          <div
                            className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                            style={{
                              backgroundColor: gem.accent,
                              boxShadow: `0 4px 14px -2px ${gem.glowColorSubtle}`,
                            }}
                          >
                            View Details <ArrowRight size={14} weight="bold" />
                          </div>
                        </div>

                        {/* Bottom accent line */}
                        <div
                          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-30"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${gem.accent}, transparent)`,
                          }}
                        />
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          )}

          <AnimatedSection className="mt-16 text-center">
            <p className="text-taqon-muted dark:text-white/50">
              Not sure which package? <Link to="/solar-advisor" className="text-taqon-orange font-semibold hover:underline">Use our Solar Advisor</Link> or <Link to="/contact" className="text-taqon-orange font-semibold hover:underline">contact us</Link> for a tailored solution.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
