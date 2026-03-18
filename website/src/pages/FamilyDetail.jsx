import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightning, ArrowLeft, ArrowRight, Star } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { useFamilyDetail } from '../hooks/useQueries';

export default function FamilyDetail() {
  const { slug } = useParams();
  const { data: family, isLoading } = useFamilyDetail(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark">
        <div className="bg-taqon-dark pt-28 pb-12">
          <div className="max-w-7xl mx-auto px-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-4" />
            <div className="h-10 bg-white/10 rounded-lg w-64 mb-3" />
            <div className="h-5 bg-white/10 rounded w-48" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!family) return null;

  const packages = family.packages || [];

  return (
    <>
      <SEO title={`${family.name} Solar Packages`} description={family.short_description || `Explore ${family.name} solar packages`} />

      <section className="relative bg-taqon-dark pt-28 pb-12">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative max-w-7xl mx-auto px-4">
          <Link to="/packages" className="inline-flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={14} /> Back to Packages
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Lightning size={28} className="text-taqon-orange" />
              <h1 className="text-3xl lg:text-4xl font-bold font-syne text-white">{family.name}</h1>
            </div>
            <p className="text-white/50 text-lg">{family.kva_rating} kVA &bull; {packages.length} variant{packages.length !== 1 ? 's' : ''}</p>
            {family.short_description && <p className="mt-3 text-white/60 max-w-xl">{family.short_description}</p>}
            {family.suitable_for?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {family.suitable_for.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-taqon-orange/10 text-taqon-orange font-medium capitalize">
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          {packages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-taqon-muted dark:text-white/40">No packages available for this family yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <motion.div
                  key={pkg.id || pkg.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={`/packages/${pkg.slug}`}
                    className="group block bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden hover:border-taqon-orange/20 hover:shadow-xl hover:shadow-taqon-orange/5 transition-all"
                  >
                    <div className="p-6">
                      {pkg.is_popular && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-taqon-orange/10 text-taqon-orange mb-3">
                          <Star size={10} weight="fill" /> Popular
                        </span>
                      )}
                      <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.variant_name && (
                        <p className="text-xs text-taqon-muted dark:text-white/40 mt-1">Variant: {pkg.variant_name}</p>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-xl bg-taqon-cream dark:bg-taqon-dark">
                          <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{pkg.inverter_kva || family.kva_rating}</p>
                          <p className="text-[10px] text-taqon-muted dark:text-white/40">kVA</p>
                        </div>
                        {pkg.panel_count > 0 && (
                          <div className="text-center p-3 rounded-xl bg-taqon-cream dark:bg-taqon-dark">
                            <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{pkg.panel_count}</p>
                            <p className="text-[10px] text-taqon-muted dark:text-white/40">Panels</p>
                          </div>
                        )}
                        <div className="text-center p-3 rounded-xl bg-taqon-cream dark:bg-taqon-dark">
                          <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{pkg.phase || '1P'}</p>
                          <p className="text-[10px] text-taqon-muted dark:text-white/40">Phase</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-2xl font-bold text-taqon-orange font-syne">
                          {parseFloat(pkg.price) > 0 ? `$${parseFloat(pkg.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Contact'}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-taqon-orange font-medium group-hover:gap-2 transition-all">
                          View <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
