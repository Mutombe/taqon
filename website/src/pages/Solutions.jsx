import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun,
  Lightning,
  Drop,
  Lightbulb,
  Wrench,
  Package,
  Calculator,
  ArrowRight,
  Phone,
  WhatsappLogo,
  MapPin,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import { autoLink, confirmExternalNavigation } from '../components/ContentLink';
import SEO from '../components/SEO';
import { solutionsData } from '../data/solutionsData';

const iconMap = { Sun, Lightning, Drop, Lightbulb, Wrench, Package, Calculator };

export default function Solutions() {
  // Separate solutions: exclude solar-calculator redirect for the grid
  const displaySolutions = solutionsData.filter((s) => !s.redirectTo);

  // Split into featured (first 2) and rest
  const featured = displaySolutions.slice(0, 2);
  const rest = displaySolutions.slice(2);

  return (
    <>
      <SEO
        title="Our Solutions"
        description="Explore Taqon Electrico's complete range of solar and electrical services — solar installations, electrical maintenance, borehole pumps, lighting, and more."
        keywords="solar solutions Zimbabwe, electrical services Harare, solar installation, borehole pump, lighting installation"
        canonical="https://www.taqon.co.zw/solutions"
      />

      {/* ─── Hero ─── */}
      <section className="relative min-h-[60vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/taqon-solar-system-panels-hardware.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/80 to-taqon-dark" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Our Solutions
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Comprehensive Energy{' '}
              <span className="text-gradient">Solutions</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              {autoLink('From solar installations to electrical maintenance, we deliver end-to-end power solutions tailored to your needs.')}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-full font-semibold mt-8 hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
            >
              Get a Free Quote <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Services Grid — Magazine Editorial Layout ─── */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="text-center mb-16">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                What We Do
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Our Services
              </h2>
              <p className="mt-4 text-taqon-charcoal/60 dark:text-white/50 max-w-xl mx-auto">
                {autoLink('Explore our full range of solar and electrical solutions designed to power your home, business, or institution.')}
              </p>
            </div>
          </AnimatedSection>

          {/* Top row — 2 large featured cards */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {featured.map((solution, i) => {
              const Icon = iconMap[solution.icon] || Sun;
              return (
                <AnimatedSection key={solution.slug} variant="fadeUp" delay={i * 0.1}>
                  <Link
                    to={`/solutions/${solution.slug}`}
                    className="group block rounded-3xl overflow-hidden relative aspect-[4/3]"
                  >
                    <img
                      src={solution.image}
                      alt={solution.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                        <Icon size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold font-syne text-white group-hover:text-taqon-orange transition-colors">
                        {solution.title}
                      </h3>
                      <p className="mt-2 text-white/60 text-sm line-clamp-2 max-w-md">
                        {autoLink(solution.heroDescription)}
                      </p>
                      <span className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-taqon-orange">
                        Learn more{' '}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Bottom row — smaller cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {rest.map((solution, i) => {
              const Icon = iconMap[solution.icon] || Sun;
              return (
                <AnimatedSection key={solution.slug} variant="fadeUp" delay={i * 0.1}>
                  <Link
                    to={`/solutions/${solution.slug}`}
                    className="group block rounded-3xl overflow-hidden relative aspect-square"
                  >
                    <img
                      src={solution.image}
                      alt={solution.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-4 lg:p-5">
                      <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                        <Icon size={20} className="text-white" />
                      </div>
                      <h3 className="text-sm lg:text-base font-bold font-syne text-white group-hover:text-taqon-orange transition-colors leading-snug">
                        {solution.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-taqon-orange opacity-0 group-hover:opacity-100 transition-opacity">
                        View details <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Solar Calculator CTA ─── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="relative rounded-3xl overflow-hidden bg-taqon-dark p-8 lg:p-14">
              <div className="absolute inset-0 opacity-10">
                <img
                  src="/taqon-solar-system-panels-hardware.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-xl bg-taqon-orange/20 flex items-center justify-center mb-5">
                    <Calculator size={28} className="text-taqon-orange" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold font-syne text-white">
                    How Much Can You Save with Solar?
                  </h2>
                  <p className="mt-3 text-white/50 max-w-lg">
                    {autoLink('Use our free solar calculator to estimate your savings based on your current energy usage. Get an instant, personalised estimate in minutes.')}
                  </p>
                </div>
                <Link
                  to="/calculator"
                  className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25 whitespace-nowrap"
                >
                  Try Solar Calculator <ArrowRight size={16} weight="bold" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Contact CTA ─── */}
      <section className="py-20 lg:py-28 bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Get in Touch
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-white">
                Let Us Power Your Future
              </h2>
              <p className="mt-4 text-white/50 text-lg">
                {autoLink('Ready to discuss your project? Contact our team for a free consultation and quote.')}
              </p>

              {/* Contact details */}
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <MapPin size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Visit Us</p>
                    <p className="text-white/50 text-xs mt-1">
                      203 Sherwood Drive, Strathaven, Harare
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <Phone size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Call Us</p>
                    <p className="text-white/50 text-xs mt-1">+263 77 277 1036</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <WhatsappLogo size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">WhatsApp</p>
                    <p className="text-white/50 text-xs mt-1">+263 77 277 1036</p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
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
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
