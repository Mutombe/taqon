import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightning, ArrowLeft } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import GemPackageCard from '../components/GemPackageCard';
import { useFamilyDetail } from '../hooks/useQueries';
import { getGemFamily } from '../data/gemFamilies';

export default function FamilyDetail() {
  const { slug } = useParams();
  const { data: family, isLoading } = useFamilyDetail(slug);
  const gem = getGemFamily(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark">
        <div className="bg-taqon-dark pt-28 pb-12">
          <div className="max-w-7xl mx-auto px-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-4" />
            <div className="h-5 bg-white/10 rounded-full w-28 mb-4" />
            <div className="h-10 bg-white/10 rounded-lg w-64 mb-3" />
            <div className="h-5 bg-white/10 rounded w-48" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!family) return null;

  const packages = family.packages || [];

  return (
    <>
      <SEO
        title={`${family.name} Solar Packages`}
        description={family.short_description || `Explore ${family.name} solar packages`}
      />

      {/* Hero with gem-accented header */}
      <section className="relative bg-taqon-dark pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />

        {/* Gem-colored ambient glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: gem.accent }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ backgroundColor: gem.accent }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <Link to="/packages" className="inline-flex items-center gap-1 text-white/50 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Packages
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Gem collection badge */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
              style={{
                backgroundColor: `color-mix(in srgb, ${gem.accent} 15%, transparent)`,
                color: gem.accent,
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: gem.accent }}
              />
              {gem.gem} Collection
            </span>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${gem.accent} 20%, transparent)` }}
              >
                <Lightning size={22} weight="fill" style={{ color: gem.accent }} />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold font-syne text-white">
                {family.name}
              </h1>
            </div>

            <p className="text-white/50 text-lg">
              {family.kva_rating} kVA &bull; {packages.length} variant{packages.length !== 1 ? 's' : ''}
            </p>

            {family.short_description && (
              <p className="mt-3 text-white/60 max-w-xl leading-relaxed">{family.short_description}</p>
            )}

            {family.suitable_for?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {family.suitable_for.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full font-medium capitalize"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${gem.accent} 12%, transparent)`,
                      color: gem.accent,
                    }}
                  >
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom accent gradient bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${gem.accent}, transparent)`,
            opacity: 0.3,
          }}
        />
      </section>

      {/* Package variant cards */}
      <section className="py-12 lg:py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          {packages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-taqon-muted dark:text-white/40">No packages available for this family yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <GemPackageCard
                  key={pkg.id || pkg.slug}
                  pkg={pkg}
                  familySlug={slug}
                  familyKva={family.kva_rating}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
