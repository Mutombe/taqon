import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Lightning, ArrowsLeftRight, MagnifyingGlass } from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import { autoLink } from '../components/ContentLink';
import SEO from '../components/SEO';
import { packagesDetailed } from '../data/packagesData';
import { useFamilies } from '../hooks/useQueries';

const tierColors = {
  starter: 'from-gray-50 to-white dark:from-taqon-charcoal dark:to-taqon-charcoal border-gray-200 dark:border-white/10',
  popular: 'from-taqon-orange/5 to-white dark:from-taqon-orange/10 dark:to-taqon-charcoal border-taqon-orange/30',
  premium: 'from-taqon-charcoal to-taqon-gray border-taqon-charcoal',
  commercial: 'from-gray-900 to-gray-800 border-gray-700',
};

const tierBadgeColors = {
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  popular: 'bg-taqon-orange/10 text-taqon-orange',
  premium: 'bg-purple-500/20 text-purple-300',
  commercial: 'bg-emerald-500/20 text-emerald-300',
};

const tierLabels = {
  starter: 'Starter',
  popular: 'Most Popular',
  premium: 'Premium',
  commercial: 'Commercial',
};

function formatPrice(price) {
  const num = parseFloat(price);
  if (!num || isNaN(num)) return 'Contact for Price';
  return `From $${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Packages() {
  // React Query: cached families data. On return visits, renders instantly
  // from cache while silently revalidating in the background.
  const { data: families, isLoading: loading } = useFamilies();

  // Use API families if available, otherwise fall back to static data
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
              Compare <span className="text-gradient">Packages</span>
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
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-3xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-6 lg:p-8 animate-pulse">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-48 mb-2" />
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-64" />
                    </div>
                    <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-gray-100 dark:bg-white/5 rounded-full" />
                    <div className="h-5 w-24 bg-gray-100 dark:bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : useApi ? (
            /* ── API-driven family cards ── */
            <div className="space-y-12">
              {families.map((family, fi) => (
                <AnimatedSection key={family.id} delay={fi * 0.1}>
                  <div className="rounded-3xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-6 lg:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white flex items-center gap-2">
                          <Lightning size={22} className="text-taqon-orange" />
                          {family.name}
                        </h2>
                        <p className="mt-1 text-sm text-taqon-muted dark:text-white/50">
                          {family.kva_rating} kVA &middot; {family.package_count} variant{family.package_count !== 1 ? 's' : ''}
                          {family.price_min && family.price_max && (
                            <span className="ml-2 text-taqon-orange font-semibold">
                              ${parseFloat(family.price_min).toLocaleString()} – ${parseFloat(family.price_max).toLocaleString()}
                            </span>
                          )}
                        </p>
                        {family.short_description && (
                          <p className="mt-2 text-sm text-taqon-muted dark:text-white/50 max-w-lg">{family.short_description}</p>
                        )}
                      </div>
                      <Link
                        to={`/families/${family.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all whitespace-nowrap"
                      >
                        View Family <ArrowRight size={14} />
                      </Link>
                    </div>

                    {/* Suitable for tags */}
                    {family.suitable_for && family.suitable_for.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {family.suitable_for.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-taqon-orange/10 text-taqon-orange font-medium capitalize">
                            {tag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            /* ── Static fallback cards ── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagesDetailed.map((pkg, i) => {
                const isDark = pkg.tier === 'premium' || pkg.tier === 'commercial';
                return (
                  <AnimatedSection key={pkg.slug} delay={i * 0.1}>
                    <Link
                      to={`/packages/${pkg.slug}`}
                      className="block h-full"
                    >
                      <motion.div
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.2 }}
                        className={`relative rounded-3xl p-8 border bg-gradient-to-b ${tierColors[pkg.tier]} h-full flex flex-col cursor-pointer ${pkg.popular ? 'ring-2 ring-taqon-orange shadow-xl shadow-taqon-orange/10' : ''}`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-taqon-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                            <Star size={12} /> Most Popular
                          </div>
                        )}

                        {/* Tier badge */}
                        <span className={`self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-3 ${tierBadgeColors[pkg.tier]}`}>
                          {tierLabels[pkg.tier]}
                        </span>

                        <div className="flex items-center gap-2 mb-4">
                          <Lightning size={20} className="text-taqon-orange" />
                          <h3 className={`text-xl font-bold font-syne ${isDark ? 'text-white' : 'text-taqon-charcoal dark:text-white'}`}>{pkg.name}</h3>
                        </div>

                        <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-taqon-muted dark:text-white/50'}`}>{autoLink(pkg.description)}</p>

                        <div className={`text-3xl font-bold font-syne mb-6 ${isDark ? 'text-gradient' : 'text-taqon-charcoal dark:text-white'}`}>
                          {pkg.price}
                        </div>

                        {/* Capacity bar mini */}
                        <div className="mb-6">
                          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 w-full">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-taqon-orange to-red-500 transition-all duration-700"
                              style={{ width: `${pkg.capacityPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5 text-[10px] text-taqon-muted dark:text-white/30">
                            <span>Starter</span>
                            <span>{pkg.kvaRating}</span>
                            <span>Commercial</span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          {pkg.features.slice(0, 4).map((feature, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <Check size={16} className="text-taqon-orange flex-shrink-0" />
                              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-taqon-muted dark:text-white/60'}`}>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div
                          className={`mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                            pkg.popular
                              ? 'bg-taqon-orange text-white hover:bg-taqon-orange/90 shadow-lg shadow-taqon-orange/25'
                              : isDark
                              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                              : 'bg-taqon-charcoal text-white hover:bg-taqon-charcoal/90'
                          }`}
                        >
                          View Package Details <ArrowRight size={14} />
                        </div>
                      </motion.div>
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
