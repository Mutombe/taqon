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
  CheckCircle,
  ArrowRight,
  Phone,
  WhatsappLogo,
  MapPin,
  CaretRight,
  SolarPanel,
  BatteryFull as Battery,
  Circuitry as CircuitBoard,
  Plug,
} from '@phosphor-icons/react';
import AnimatedSection, { AnimatedCounter } from './AnimatedSection';
import { autoLink, confirmExternalNavigation } from './ContentLink';

// Map icon names to components
const iconMap = {
  Sun,
  Lightning,
  Drop,
  Lightbulb,
  Wrench,
  Package,
  Calculator,
};

// Shop category cards
const shopCategories = [
  {
    name: 'Solar Panels',
    icon: SolarPanel,
    warranty: 'Up to 25yr warranty',
    slug: 'panels',
  },
  {
    name: 'Batteries',
    icon: Battery,
    warranty: 'Up to 10yr design life',
    slug: 'batteries',
  },
  {
    name: 'Inverters',
    icon: CircuitBoard,
    warranty: 'Up to 5yr warranty',
    slug: 'inverters',
  },
  {
    name: 'Accessories',
    icon: Plug,
    warranty: 'Quality guaranteed',
    slug: 'accessories',
  },
];

export default function SolutionPageTemplate({ solution, allSolutions }) {
  const Icon = iconMap[solution.icon] || Sun;
  const relatedSolutions = allSolutions.filter(
    (s) => solution.relatedSolutions.includes(s.slug) && s.slug !== solution.slug && !s.redirectTo
  );

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={solution.image}
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/80 via-taqon-dark/70 to-taqon-dark" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20 w-full">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-sm text-white/40 mb-8"
          >
            <Link to="/" className="hover:text-white/60 transition-colors">
              Home
            </Link>
            <CaretRight size={12} />
            <Link to="/solutions" className="hover:text-white/60 transition-colors">
              Solutions
            </Link>
            <CaretRight size={12} />
            <span className="text-white/70">{solution.title}</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Solutions
            </span>
            <h1 className="mt-3 text-4xl lg:text-5xl font-bold font-syne text-white leading-tight max-w-4xl">
              {solution.title}
            </h1>
            <p className="mt-5 text-white/60 text-lg max-w-2xl leading-relaxed">
              {solution.heroDescription}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-full font-semibold mt-8 hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
            >
              Get Started <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Overview ─── */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── Section Header ── */}
          <AnimatedSection variant="fadeUp">
            <div className="flex items-center gap-4 mb-10 lg:mb-14">
              <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 dark:bg-taqon-orange/15 flex items-center justify-center flex-shrink-0">
                <Icon size={26} className="text-taqon-orange" />
              </div>
              <div>
                <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                  Overview
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
                  {solution.subtitle}
                </h2>
              </div>
            </div>
          </AnimatedSection>

          {/* ── Image Showcase with Stats Overlay ── */}
          <AnimatedSection variant="fadeUp" delay={0.1}>
            <div className="relative rounded-3xl overflow-hidden bg-taqon-charcoal dark:bg-black">
              <img
                src={solution.image}
                alt={solution.title}
                className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Stats overlaid on image bottom */}
              {solution.stats.length > 0 && (
                <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {solution.stats.map((stat, i) => (
                      <div
                        key={i}
                        className="text-center px-4 py-3 lg:py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15"
                      >
                        <div className="text-xl lg:text-2xl font-bold font-syne text-white">
                          <AnimatedCounter value={stat.value} />
                        </div>
                        <div className="mt-1 text-xs lg:text-sm text-white/60 font-medium">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* ── Content: Description + Bullet Points ── */}
          <div className="mt-14 lg:mt-20 grid lg:grid-cols-12 gap-10 lg:gap-16">

            {/* Description column */}
            <AnimatedSection variant="fadeUp" delay={0.15} className="lg:col-span-7">
              <div className="space-y-5">
                {solution.fullDescription.map((paragraph, i) => (
                  <p
                    key={i}
                    className={`text-taqon-charcoal/70 dark:text-white/60 leading-relaxed ${
                      i === 0 ? 'text-lg lg:text-xl leading-relaxed text-taqon-charcoal/80 dark:text-white/70' : ''
                    }`}
                  >
                    {autoLink(paragraph, { exclude: [solution.slug], maxLinks: 4 })}
                  </p>
                ))}
              </div>
            </AnimatedSection>

            {/* Bullet points column */}
            {solution.bulletPoints.length > 0 && (
              <AnimatedSection variant="fadeUp" delay={0.25} className="lg:col-span-5">
                <div className="lg:pl-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-taqon-orange mb-6">
                    What We Offer
                  </h3>
                  <div className="space-y-3.5">
                    {solution.bulletPoints.map((point, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-3 group"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-taqon-orange/10 dark:bg-taqon-orange/15 flex items-center justify-center mt-0.5">
                          <CheckCircle
                            size={14}
                            weight="fill"
                            className="text-taqon-orange"
                          />
                        </span>
                        <span className="text-taqon-charcoal/80 dark:text-white/70 text-sm leading-relaxed">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

        </div>
      </section>

      {/* ─── How It Works ─── */}
      {solution.howItWorks.length > 0 && (
        <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatedSection variant="fadeUp">
              <div className="text-center mb-16">
                <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                  Process
                </span>
                <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                  How It Works
                </h2>
                <p className="mt-4 text-taqon-charcoal/60 dark:text-white/50 max-w-xl mx-auto">
                  Our streamlined process ensures a smooth experience from start to finish.
                </p>
              </div>
            </AnimatedSection>

            <div className="relative">
              {/* Connecting line (desktop) */}
              <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-taqon-orange/20" />

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                {solution.howItWorks.map((step, i) => (
                  <AnimatedSection key={i} variant="fadeUp" delay={i * 0.15}>
                    <div className="relative text-center lg:text-center">
                      {/* Step number */}
                      <div className="relative z-10 w-24 h-24 rounded-full bg-taqon-orange/10 dark:bg-taqon-orange/15 flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-taqon-charcoal">
                        <span className="text-2xl font-bold font-syne text-taqon-orange">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm text-taqon-charcoal/60 dark:text-white/50 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Shop By Category ─── */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="text-center mb-14">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Products
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Shop By Category
              </h2>
              <p className="mt-4 text-taqon-charcoal/60 dark:text-white/50 max-w-xl mx-auto">
                Browse our range of quality solar and electrical products.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {shopCategories.map((cat, i) => {
              const CatIcon = cat.icon;
              return (
                <AnimatedSection key={cat.slug} variant="fadeUp" delay={i * 0.1}>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="group block p-6 lg:p-8 rounded-2xl bg-white dark:bg-taqon-charcoal border border-black/5 dark:border-white/5 hover:border-taqon-orange/30 transition-all duration-300 hover:shadow-lg hover:shadow-taqon-orange/5 text-center"
                  >
                    <div className="w-14 h-14 rounded-xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-taqon-orange/20 transition-colors">
                      <CatIcon size={26} className="text-taqon-orange" />
                    </div>
                    <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white mb-1">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-taqon-charcoal/50 dark:text-white/40">
                      {cat.warranty}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-taqon-orange opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse <ArrowRight size={14} />
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Related Solutions ─── */}
      {relatedSolutions.length > 0 && (
        <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatedSection variant="fadeUp">
              <div className="text-center mb-14">
                <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                  Explore More
                </span>
                <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                  Related Solutions
                </h2>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedSolutions.slice(0, 3).map((related, i) => {
                const RelatedIcon = iconMap[related.icon] || Sun;
                return (
                  <AnimatedSection key={related.slug} variant="fadeUp" delay={i * 0.1}>
                    <Link
                      to={`/solutions/${related.slug}`}
                      className="group block rounded-3xl overflow-hidden bg-taqon-cream dark:bg-taqon-dark border border-black/5 dark:border-white/5 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={related.image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <RelatedIcon size={20} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                          {related.title}
                        </h3>
                        <p className="mt-2 text-sm text-taqon-charcoal/60 dark:text-white/50 line-clamp-2">
                          {related.heroDescription}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-taqon-orange">
                          Learn more <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Contact CTA ─── */}
      <section className="py-20 lg:py-28 bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Get in Touch
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-white">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-white/50 text-lg leading-relaxed">
                {solution.ctaText}
              </p>

              {/* Contact details */}
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <MapPin size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Visit Us</p>
                    <p className="text-white/50 text-xs mt-1">
                      876 Ringwood Drive, Strathaven, Harare
                    </p>
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
                    <p className="text-white/50 text-xs">+263 8644 290 072</p>
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
