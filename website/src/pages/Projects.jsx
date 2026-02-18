import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { projects, beforeAfterProjects } from '../data/siteData';

const categories = ['all', 'residential', 'commercial', 'institutional', 'borehole'];

export default function Projects() {
  const [active, setActive] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const filtered = active === 'all' ? projects : projects.filter(p => p.category === active);

  return (
    <>
      <SEO
        title="Our Projects"
        description="View Taqon Electrico's portfolio of completed solar installations and electrical projects across Zimbabwe."
        keywords="solar projects Zimbabwe, solar installation gallery, completed solar projects Harare"
        canonical="https://www.taqon.co.zw/projects"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Portfolio</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Our <span className="text-gradient">Projects</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Explore our portfolio of completed solar and electrical installations across Zimbabwe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Before/After Showcases */}
      <section className="py-16 lg:py-24 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Transformations</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Before & <span className="text-gradient">After</span>
            </h2>
            <p className="mt-3 text-taqon-muted max-w-xl mx-auto">Drag the slider to see the transformation our solar installations bring.</p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beforeAfterProjects.map((project, i) => (
              <AnimatedSection key={project.id} delay={i * 0.1}>
                <div className="rounded-2xl overflow-hidden">
                  <BeforeAfterSlider
                    beforeImage={project.beforeImage}
                    afterImage={project.afterImage}
                    beforeLabel="Before"
                    afterLabel="After"
                  />
                  <div className="bg-white dark:bg-taqon-charcoal p-4 border border-gray-100 dark:border-white/10 border-t-0 rounded-b-2xl">
                    <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">{project.title}</h3>
                    <p className="text-sm text-taqon-muted mt-1">{project.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-12 lg:py-20 bg-taqon-cream dark:bg-taqon-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  active === cat
                    ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                    : 'bg-white text-taqon-charcoal hover:bg-taqon-orange/5 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Masonry-style Grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`group cursor-pointer ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                  onClick={() => setLightbox(project)}
                >
                  <div className={`relative rounded-3xl overflow-hidden ${i === 0 ? 'h-[400px] lg:h-[500px]' : 'h-[280px]'}`}>
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div>
                        <span className="text-taqon-orange text-xs font-semibold uppercase tracking-wider">{project.category}</span>
                        <h3 className="text-white font-bold font-syne text-lg mt-1">{project.title}</h3>
                        <p className="text-white/70 text-sm mt-1">{project.description}</p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <Eye size={18} className="text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.image} alt={lightbox.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold font-syne text-xl">{lightbox.title}</h3>
                <p className="text-white/60 text-sm mt-1">{lightbox.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold font-syne text-taqon-charcoal">Want your project here?</h2>
            <p className="mt-3 text-taqon-muted">Let us design and install your perfect solar system.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold mt-6 hover:bg-taqon-orange/90 transition-all">
              Start Your Project <ArrowRight size={16} />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
