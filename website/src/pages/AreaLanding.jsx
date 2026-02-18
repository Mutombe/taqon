import React from 'react';
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun, Zap, MapPin, Users, ArrowRight, Phone, CheckCircle2,
  AlertCircle, ArrowLeft
} from 'lucide-react';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { areas } from '../data/areaData';
import { projects as allProjects, companyInfo, packages } from '../data/siteData';

export default function AreaLanding() {
  const { city } = useParams();

  const area = areas.find((a) => a.slug === city);

  const localProjects = useMemo(() => {
    if (!area) return [];
    return area.localProjectIds
      .map((id) => allProjects.find((p) => p.id === id))
      .filter(Boolean);
  }, [area]);

  if (!area) {
    return (
      <>
        <SEO title="City Not Found" description="The city page you are looking for could not be found." />
        <section className="min-h-screen flex items-center justify-center bg-taqon-cream dark:bg-taqon-dark">
          <div className="text-center px-4">
            <AlertCircle size={64} className="text-taqon-orange mx-auto mb-6" />
            <h1 className="text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              City Not Found
            </h1>
            <p className="mt-3 text-taqon-muted max-w-md mx-auto">
              We do not have a dedicated page for this city yet. Check our available service areas below.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-taqon-orange/90 transition-colors"
              >
                <ArrowLeft size={16} /> Back Home
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <div className="mt-10">
              <p className="text-sm text-taqon-muted mb-3">We serve these areas:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {areas.map((a) => (
                  <Link
                    key={a.slug}
                    to={`/solar-installation/${a.slug}`}
                    className="px-4 py-2 bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 rounded-full text-sm text-taqon-charcoal dark:text-white hover:border-taqon-orange transition-colors"
                  >
                    {a.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const benefits = [
    {
      icon: Sun,
      title: `${area.peakSunHours} Peak Sun Hours`,
      desc: `${area.name} receives an excellent ${area.peakSunHours} peak sun hours daily, providing abundant solar energy potential year-round.`,
    },
    {
      icon: Zap,
      title: 'Reduce Electricity Costs',
      desc: `With electricity costing ${area.avgElectricityCost}, a properly sized solar system can reduce your energy bills by 70-100% in ${area.name}.`,
    },
    {
      icon: Users,
      title: 'Growing Solar Community',
      desc: `Join hundreds of homeowners and businesses in ${area.name} who have already made the switch to clean, reliable solar power.`,
    },
    {
      icon: CheckCircle2,
      title: 'ZERA Approved Installation',
      desc: `All our installations in ${area.name} meet ZERA standards, ensuring safety, quality, and valid warranty coverage for your investment.`,
    },
  ];

  return (
    <>
      <SEO
        title={area.seoTitle}
        description={area.seoDescription}
        keywords={area.seoKeywords}
        canonical={`https://www.taqon.co.zw/solar-installation/${area.slug}`}
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80"
            alt={`Solar installation in ${area.name}`}
            className="w-full h-full object-cover opacity-15"
            loading="eager"
          />
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[30%] right-[10%] w-24 h-24 border border-taqon-orange/20 rounded-full hidden lg:block"
        />
        <motion.div
          animate={{ y: [10, -15, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[20%] left-[8%] w-4 h-4 bg-taqon-orange/30 rounded-full hidden lg:block"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-taqon-orange/10 border border-taqon-orange/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin size={14} className="text-taqon-orange" />
              <span className="text-taqon-orange text-sm font-medium">
                {area.name}, {area.province}
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
              Solar Installation in
              <br />
              <span className="text-gradient">{area.name}</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              {area.introContent}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Get a Free Quote in {area.name}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href={`tel:${companyInfo.phone[1]}`}
                className="group inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/15 transition-all border border-white/10"
              >
                <Phone size={18} />
                Call Us Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Solar in City */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient dark:dark-mesh opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Local Benefits
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Why Solar in <span className="text-gradient">{area.name}</span>?
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              {area.name} has some of the best conditions for solar energy in Zimbabwe.
              Here is why going solar makes perfect sense for you.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <StaggerItem key={i}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-5">
                    <benefit.icon size={24} className="text-taqon-orange" />
                  </div>
                  <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-taqon-muted text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Local Stats */}
      <section className="py-20 lg:py-28 bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-taqon-orange/10 rounded-full blur-[120px]"
        />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-white">
              {area.name} Solar <span className="text-gradient">At a Glance</span>
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: `${area.peakSunHours}h`, label: 'Peak Sun Hours / Day' },
              { value: area.avgElectricityCost, label: 'Avg Electricity Cost' },
              { value: area.population, label: 'Population' },
              { value: area.province, label: 'Province' },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500">
                  <div className="text-3xl lg:text-4xl font-bold font-syne text-gradient">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-white/50 text-sm">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Local Projects */}
      {localProjects.length > 0 && (
        <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatedSection className="text-center mb-12">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Our Work
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Projects Near <span className="text-gradient">{area.name}</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {localProjects.map((project, i) => (
                <AnimatedSection key={project.id} delay={i * 0.1}>
                  <div className="group rounded-3xl overflow-hidden">
                    <div className="relative h-[280px]">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-end p-6">
                        <div>
                          <span className="text-taqon-orange text-xs font-semibold uppercase tracking-wider">
                            {project.category}
                          </span>
                          <h3 className="text-white font-bold font-syne text-lg mt-1">
                            {project.title}
                          </h3>
                          <p className="text-white/70 text-sm mt-1">{project.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 text-taqon-orange font-semibold hover:gap-3 transition-all"
              >
                View All Projects <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Packages Preview */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient dark:dark-mesh opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Solar Packages
            </span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Popular Packages in <span className="text-gradient">{area.name}</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.slice(0, 3).map((pkg, i) => (
              <AnimatedSection key={pkg.id} delay={i * 0.1}>
                <div
                  className={`bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border h-full flex flex-col ${
                    pkg.popular
                      ? 'border-taqon-orange shadow-lg shadow-taqon-orange/10'
                      : 'border-gray-100 dark:border-white/10'
                  }`}
                >
                  {pkg.popular && (
                    <span className="inline-block self-start px-3 py-1 bg-taqon-orange text-white text-xs font-bold rounded-full mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                    {pkg.name}
                  </h3>
                  <p className="text-2xl font-bold font-syne text-gradient mt-2">{pkg.price}</p>
                  <p className="mt-3 text-sm text-taqon-muted">{pkg.description}</p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {pkg.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-taqon-charcoal dark:text-white/80">
                        <CheckCircle2 size={14} className="text-taqon-orange flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-taqon-orange text-white py-3 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all"
                  >
                    Get Quote <ArrowRight size={14} />
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 text-taqon-orange font-semibold hover:gap-3 transition-all"
            >
              View All Packages <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-taqon-orange to-taqon-amber rounded-[2rem] p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-white">
                <h2 className="text-3xl lg:text-4xl font-bold font-syne">
                  Ready to Go Solar in {area.name}?
                </h2>
                <p className="mt-3 text-white/80 text-lg max-w-lg">
                  Get a free site assessment and personalized quote for your home or business
                  in {area.name}. Our engineers will design the perfect system for your needs.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-taqon-orange px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition-all shadow-lg"
                >
                  Get Free Quote
                  <ArrowRight size={18} />
                </Link>
                <a
                  href={`tel:${companyInfo.phone[1]}`}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-all border border-white/30"
                >
                  <Phone size={18} />
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Cities */}
      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
              Solar Installation in Other Cities
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {areas
                .filter((a) => a.slug !== area.slug)
                .map((a) => (
                  <Link
                    key={a.slug}
                    to={`/solar-installation/${a.slug}`}
                    className="px-5 py-2.5 bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 rounded-full text-sm font-medium text-taqon-charcoal dark:text-white hover:border-taqon-orange hover:text-taqon-orange transition-all"
                  >
                    <MapPin size={12} className="inline mr-1.5" />
                    {a.name}
                  </Link>
                ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
