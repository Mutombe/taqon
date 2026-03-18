import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretRight, ArrowRight, ArrowLeft, MapPin, Phone, WhatsappLogo,
  Lightning, SolarPanel, BatteryCharging, Wrench, CheckCircle,
  X, CaretLeft,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import CommentSection from '../components/CommentSection';
import { autoLink, confirmExternalNavigation } from '../components/ContentLink';
import SEO from '../components/SEO';
import { projectsData } from '../data/projectsData';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = projectsData.find((p) => p.slug === slug);
  const [lightbox, setLightbox] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!project) return <Navigate to="/projects" replace />;

  // Adjacent projects for navigation
  const idx = projectsData.indexOf(project);
  const prev = idx > 0 ? projectsData[idx - 1] : null;
  const next = idx < projectsData.length - 1 ? projectsData[idx + 1] : null;

  const openLightbox = (i) => {
    setCurrentIdx(i);
    setLightbox(true);
  };

  const navLightbox = (dir) => {
    setCurrentIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return project.images.length - 1;
      if (next >= project.images.length) return 0;
      return next;
    });
  };

  return (
    <>
      <SEO
        title={project.title}
        description={project.description}
        keywords={`${project.kva} solar system, solar installation ${project.location}, Taqon Electrico project`}
        canonical={`https://www.taqon.co.zw/projects/${project.slug}`}
      />

      {/* ─── Hero ─── */}
      <section className="relative min-h-[50vh] flex items-end bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={project.heroImage}
            alt={project.title}
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-taqon-dark via-taqon-dark/70 to-taqon-dark/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-14 pt-32 w-full">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/40 mb-6"
          >
            <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
            <CaretRight size={12} />
            <Link to="/projects" className="hover:text-white/60 transition-colors">Projects</Link>
            <CaretRight size={12} />
            <span className="text-white/70 truncate max-w-[300px]">{project.title}</span>
          </motion.nav>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-taqon-orange/20 text-taqon-orange text-xs font-semibold uppercase tracking-wider">
                {project.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-semibold">
                {project.kva}
              </span>
              <span className="flex items-center gap-1 text-white/50 text-xs">
                <MapPin size={12} /> {project.location}
              </span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold font-syne text-white leading-tight max-w-4xl">
              {project.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* ─── Image Gallery ─── */}
      <section className="py-12 lg:py-16 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`grid gap-3 ${
            project.images.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : project.images.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {project.images.map((img, i) => (
              <AnimatedSection
                key={i}
                variant="fadeUp"
                delay={i * 0.1}
                className={
                  project.images.length >= 4 && i === 0
                    ? 'col-span-2 row-span-2'
                    : ''
                }
              >
                <div
                  className="group relative rounded-2xl overflow-hidden cursor-pointer h-full"
                  onClick={() => openLightbox(i)}
                >
                  <img
                    src={img.src}
                    alt={img.caption}
                    className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      project.images.length >= 4 && i === 0
                        ? 'h-full min-h-[300px] lg:min-h-[450px]'
                        : 'aspect-[4/3]'
                    }`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <p className="text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                      {img.caption}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="py-16 lg:py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Main content — 3 cols */}
            <div className="lg:col-span-3">
              <AnimatedSection variant="fadeUp">
                <h2 className="text-2xl lg:text-3xl font-bold font-syne text-[var(--text-primary)] mb-6">
                  Project Overview
                </h2>
                <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
                  {project.fullDescription.map((p, i) => (
                    <p key={i}>{autoLink(p, { maxLinks: 4 })}</p>
                  ))}
                </div>
              </AnimatedSection>

              {/* Benefits */}
              <AnimatedSection variant="fadeUp" delay={0.1}>
                <div className="mt-10">
                  <h3 className="text-xl font-bold font-syne text-[var(--text-primary)] mb-5">
                    What the Client Benefited
                  </h3>
                  <div className="space-y-3">
                    {project.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle
                          size={20}
                          weight="fill"
                          className="text-taqon-orange flex-shrink-0 mt-0.5"
                        />
                        <span className="text-[var(--text-secondary)]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Sidebar — 2 cols: Specs */}
            <div className="lg:col-span-2">
              <AnimatedSection variant="fadeRight" delay={0.2}>
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sticky top-28">
                  <h3 className="text-lg font-bold font-syne text-[var(--text-primary)] mb-6">
                    System Specifications
                  </h3>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                        <Lightning size={20} className="text-taqon-orange" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Inverter</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium mt-0.5">{project.specs.inverter}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                        <SolarPanel size={20} className="text-taqon-orange" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Solar Panels</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium mt-0.5">{project.specs.panels}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                        <BatteryCharging size={20} className="text-taqon-orange" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Batteries</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium mt-0.5">{project.specs.batteries}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                        <Wrench size={20} className="text-taqon-orange" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">System Type</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium mt-0.5">{project.specs.type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[var(--card-border)] space-y-3">
                    <Link
                      to="/solar-advisor"
                      className="flex items-center justify-center gap-2 w-full bg-taqon-orange text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all shadow-lg shadow-taqon-orange/25"
                    >
                      Get a Similar System <ArrowRight size={16} weight="bold" />
                    </Link>
                    <a
                      href="https://wa.me/263772771036"
                      onClick={(e) => confirmExternalNavigation('https://wa.me/263772771036', e)}
                      className="flex items-center justify-center gap-2 w-full border border-[var(--card-border)] text-[var(--text-secondary)] px-6 py-3.5 rounded-xl font-semibold hover:border-taqon-orange/30 hover:text-taqon-orange transition-all cursor-pointer"
                    >
                      <WhatsappLogo size={18} /> WhatsApp Us
                    </a>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Project Navigation ─── */}
      <section className="py-10 bg-[var(--bg-primary)] border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {prev ? (
              <Link
                to={`/projects/${prev.slug}`}
                className="group flex items-center gap-3 text-[var(--text-secondary)] hover:text-taqon-orange transition-colors"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Previous Project</p>
                  <p className="text-sm font-semibold line-clamp-1 max-w-[250px]">{prev.title}</p>
                </div>
              </Link>
            ) : <span />}

            <Link
              to="/projects"
              className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-taqon-orange transition-colors"
            >
              All Projects
            </Link>

            {next ? (
              <Link
                to={`/projects/${next.slug}`}
                className="group flex items-center gap-3 text-[var(--text-secondary)] hover:text-taqon-orange transition-colors"
              >
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Next Project</p>
                  <p className="text-sm font-semibold line-clamp-1 max-w-[250px]">{next.title}</p>
                </div>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : <span />}
          </div>
        </div>
      </section>

      {/* ─── Comments ─── */}
      <CommentSection type="project" slug={project.slug} title={project.title} />

      {/* ─── CTA ─── */}
      <section className="py-20 lg:py-28 bg-taqon-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Start Your Project
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold font-syne text-white">
              Want a Similar Installation?
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              Contact our team for a free consultation and custom solar system design
              tailored to your energy needs and budget.
            </p>

            <div className="mt-10 grid sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                <MapPin size={24} className="text-taqon-orange" />
                <div>
                  <p className="text-white/80 text-sm font-medium">Visit Us</p>
                  <p className="text-white/50 text-xs mt-1">876 Ringwood Drive, Strathaven, Harare</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                <Phone size={24} className="text-taqon-orange" />
                <div>
                  <p className="text-white/80 text-sm font-medium">Call Us</p>
                  <p className="text-white/50 text-xs mt-1">+263 242 304860</p>
                  <p className="text-white/50 text-xs">+263 8644 290 072</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                <WhatsappLogo size={24} className="text-taqon-orange" />
                <div>
                  <p className="text-white/80 text-sm font-medium">WhatsApp</p>
                  <p className="text-white/50 text-xs mt-1">+263 772 771 036</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
              >
                Contact Us <ArrowRight size={16} weight="bold" />
              </Link>
              <a
                href="https://wa.me/263772771036"
                onClick={(e) => confirmExternalNavigation('https://wa.me/263772771036', e)}
                className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
              >
                <WhatsappLogo size={18} weight="fill" /> WhatsApp Us
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X size={20} className="text-white" />
            </button>

            {/* Nav arrows */}
            {project.images.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
                >
                  <CaretLeft size={24} className="text-white" />
                </button>
                <button
                  className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
                >
                  <CaretRight size={24} className="text-white" />
                </button>
              </>
            )}

            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-5xl w-full px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={project.images[currentIdx].src}
                alt={project.images[currentIdx].caption}
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              <p className="text-white/70 text-sm text-center mt-4">
                {project.images[currentIdx].caption}
              </p>
              <p className="text-white/30 text-xs text-center mt-1">
                {currentIdx + 1} / {project.images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
