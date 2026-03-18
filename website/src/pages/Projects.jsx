import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Lightning, Heart } from '@phosphor-icons/react';
import AnimatedSection, { AnimatedCounter } from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { projectsData } from '../data/projectsData';
import useSavesStore from '../stores/savesStore';

const categories = ['all', 'residential', 'commercial'];

export default function Projects() {
  const [active, setActive] = useState('all');
  const { toggleProject, likedProjects } = useSavesStore();

  const filtered =
    active === 'all'
      ? projectsData
      : projectsData.filter((p) => p.category === active);

  return (
    <>
      <SEO
        title="Our Projects"
        description="View Taqon Electrico's portfolio of completed solar installations across Zimbabwe — residential and commercial systems from 5kVA to 24kVA."
        keywords="solar projects Zimbabwe, solar installation gallery, completed solar projects Harare, Taqon Electrico projects"
        canonical="https://www.taqon.co.zw/projects"
      />

      {/* ─── Hero ─── */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/kadoma-24kva-1.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/60 via-taqon-dark/80 to-taqon-dark" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Portfolio
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Our <span className="text-gradient">Projects</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Explore our portfolio of completed solar installations across Zimbabwe
              — from residential homes to commercial service stations and banks.
            </p>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex flex-wrap gap-8"
          >
            {[
              { value: '500+', label: 'Projects Completed' },
              { value: '3000+', label: 'kWp Installed' },
              { value: '5+', label: 'Years Experience' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold font-syne text-taqon-orange">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Filter + Grid ─── */}
      <section className="py-16 lg:py-24 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section header */}
          <AnimatedSection className="text-center mb-10">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Recent Work
            </span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
              Featured <span className="text-gradient">Installations</span>
            </h2>
          </AnimatedSection>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  active === cat
                    ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-taqon-orange/5 border border-[var(--card-border)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Project cards grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    to={`/projects/${project.slug}`}
                    className="group block rounded-3xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-xl hover:border-taqon-orange/20 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={project.heroImage}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* kVA badge + like */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProject(project.slug); }}
                          className="w-8 h-8 rounded-full bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          aria-label={likedProjects.includes(project.slug) ? 'Unlike project' : 'Like project'}
                        >
                          <Heart size={16} weight={likedProjects.includes(project.slug) ? 'fill' : 'regular'} className={likedProjects.includes(project.slug) ? 'text-red-500' : 'text-gray-400'} />
                        </button>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-taqon-orange text-white text-xs font-bold shadow-lg">
                          <Lightning size={12} weight="fill" />
                          {project.kva}
                        </span>
                      </div>

                      {/* Category + location overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium capitalize">
                            {project.category}
                          </span>
                          <span className="flex items-center gap-1 text-white/70 text-xs">
                            <MapPin size={10} weight="fill" /> {project.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold font-syne text-[var(--text-primary)] group-hover:text-taqon-orange transition-colors line-clamp-2 leading-snug">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Specs preview */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--card-border)]">
                          {project.specs.inverter.split(' ').slice(0, 2).join(' ')}
                        </span>
                        {project.specs.panels !== 'No panels — grid-charged backup system' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--card-border)]">
                            {project.specs.panels.split(' ').slice(0, 2).join(' ')} panels
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-taqon-orange opacity-0 group-hover:opacity-100 transition-opacity">
                        View project <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 lg:py-28 bg-taqon-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Ready to Go Solar?
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold font-syne text-white">
              Want Your Project Here?
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
              Let our team of experienced engineers design and install the perfect
              solar system for your home or business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
              >
                Start Your Project <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/10"
              >
                View Packages <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
