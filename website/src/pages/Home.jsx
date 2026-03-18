import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sun, Lightning, Drop, Lightbulb, Wrench, ArrowRight, ArrowUpRight,
  CaretRight, Star, Play, Shield, Trophy, CheckCircle, Phone, ArrowSquareOut
} from '@phosphor-icons/react';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import SEO from '../components/SEO';
import JsonLd, { localBusinessSchema, organizationSchema } from '../components/JsonLd';
import LiveCounter from '../components/LiveCounter';
import GoogleReviews from '../components/GoogleReviews';
import VideoTestimonial from '../components/VideoTestimonial';
import { autoLink, confirmExternalNavigation } from '../components/ContentLink';
import { services, stats, testimonials, companyInfo, videoTestimonials } from '../data/siteData';

/* Vision: Hero section with dramatic dark background, animated solar panel imagery,
   floating geometric shapes in orange tones, and a powerful headline. Think premium 
   energy brand meets tech startup — Tesla meets SolarCity aesthetic. */

const serviceIcons = { Sun, Zap: Lightning, Droplets: Drop, Lightbulb, Wrench, Package: Shield };

const brandLogos = [
  { name: 'Jinko Solar', logo: '/jinko.png', href: 'https://www.jinkosolar.com' },
  { name: 'Pylontech', logo: '/pylontech.png', href: 'https://www.pylontech.com.cn' },
  { name: 'Dyness', logo: '/Dyness.png', href: 'https://www.dyness.com' },
  { name: 'Sigenergy', logo: '/sigenergy.png', href: 'https://www.sigenergy.com' },
  { name: 'Sunsynk', logo: '/sunsynk.png', href: 'https://www.sunsynk.com' },
];

const heroImages = [
  '/34.jpeg',
  '/nedbank-harare-12kva-3.jpg',
  '/chisipiti-10kva-2.jpg',
  '/41.jpeg',
  '/53.jpeg',
];

export default function Home() {
  const heroRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      <SEO
        title="Home"
        description="Taqon Electrico - Zimbabwe's premier solar and electrical company. Expert solar installations, electrical maintenance, and renewable energy solutions in Harare."
        keywords="solar installation Zimbabwe, solar panels Harare, electrical maintenance, solar company Zimbabwe, Taqon Electrico"
        canonical="https://www.taqon.co.zw"
      />
      <JsonLd data={organizationSchema()} />
      <JsonLd data={localBusinessSchema()} />

      {/* ===== HERO SECTION ===== */}
      {/* Vision: Full-viewport dark hero with radial gradient mesh, floating blob shapes,
          and a powerful headline that commands attention. Background should feature
          a stunning solar panel field at sunset/golden hour. */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-taqon-dark">
        {/* Background carousel with crossfade */}
        <div className="absolute inset-0">
          {heroImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
              style={{ opacity: currentSlide === i ? 0.45 : 0 }}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              decoding={i === 0 ? 'sync' : 'async'}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/60 via-taqon-dark/40 to-taqon-dark/90" />
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(at 40% 20%, rgba(242, 101, 34, 0.15) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(255, 140, 66, 0.1) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)
            `
          }} />
        </div>

        {/* Slide indicators — vertical on mobile (top-right), horizontal on desktop (bottom-center) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 sm:flex-row sm:top-auto sm:right-auto sm:bottom-40 sm:left-1/2 sm:-translate-x-1/2 sm:translate-y-0">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all duration-500 ${
                currentSlide === i
                  ? 'w-1.5 h-6 sm:w-8 sm:h-1 bg-taqon-orange'
                  : 'w-1.5 h-3 sm:w-3 sm:h-1 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Animated decorative elements */}
        <motion.div
          style={{ y: heroY }}
          className="absolute top-20 right-[10%] w-72 h-72 bg-taqon-orange/10 rounded-full blur-[80px] animate-blob"
        />
        <motion.div
          style={{ y: heroY, animationDelay: '2s' }}
          className="absolute bottom-20 left-[5%] w-96 h-96 bg-taqon-amber/8 rounded-full blur-[100px] animate-blob"
        />

        {/* Floating geometric shapes */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[30%] right-[15%] w-20 h-20 border border-taqon-orange/20 rounded-2xl hidden lg:block"
        />
        <motion.div
          animate={{ y: [10, -15, 10], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[20%] left-[10%] w-3 h-3 bg-taqon-orange/40 rounded-full hidden lg:block"
        />
        <motion.div
          animate={{ y: [-5, 20, -5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[25%] right-[25%] w-16 h-16 border border-taqon-amber/15 rotate-45 hidden lg:block"
        />

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 bg-taqon-orange/10 border border-taqon-orange/20 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 bg-taqon-orange rounded-full animate-pulse" />
              <img src="/zera.png" alt="ZERA" className="h-4 w-auto object-contain brightness-0 invert opacity-80" />
              <span className="text-taqon-orange text-sm font-medium">Recommended Solar Company</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold font-syne text-white leading-[1.1] tracking-tight"
            >
              Powering Zimbabwe's
              <br />
              <span className="text-gradient">Future</span> with
              <br />
              Clean Energy
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-6 text-lg lg:text-xl text-white/60 max-w-xl leading-relaxed"
            >
              {autoLink('Expert solar installations, electrical engineering, and renewable energy solutions for homes, businesses, and institutions across Zimbabwe.')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/solar-advisor"
                className="group inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25 active:scale-95"
              >
                Get a Free Quote
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/projects"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/15 transition-all backdrop-blur-sm border border-white/10"
              >
                <Play size={18} />
                View Our Projects
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-12 flex flex-wrap items-center gap-6"
            >
              {[
                { icon: null, text: 'Approved', logo: '/zera.png' },
                { icon: Trophy, text: '500+ Projects', logo: null },
                { icon: CheckCircle, text: '5+ Years', logo: null },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/40 text-sm">
                  {item.logo ? (
                    <img src={item.logo} alt="" className="h-6 w-auto object-contain brightness-0 invert opacity-40" />
                  ) : (
                    <item.icon size={16} className="text-taqon-orange/60" />
                  )}
                  {item.text}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-taqon-cream dark:from-taqon-dark to-transparent" />
      </section>

      {/* ===== BRANDS MARQUEE ===== */}
      {/* Vision: Continuous scrolling marquee of partner brand logos on a clean background */}
      <section className="py-10 bg-taqon-cream dark:bg-taqon-dark border-b border-gray-100 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-taqon-muted font-medium">Trusted brands we work with</p>
        </div>
        <div className="overflow-hidden">
          <div className="flex animate-marquee items-center">
            {[...brandLogos, ...brandLogos, ...brandLogos].map((brand, i) => (
              <a
                key={i}
                href={brand.href}
                onClick={(e) => confirmExternalNavigation(brand.href, e)}
                className="flex-shrink-0 px-10 py-3 flex items-center justify-center cursor-pointer"
              >
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-10 lg:h-12 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 dark:brightness-0 dark:invert dark:opacity-40 dark:hover:opacity-80"
                  />
                ) : (
                  <span className="text-xl font-bold text-taqon-charcoal/20 dark:text-white/15 font-syne whitespace-nowrap hover:text-taqon-orange/50 transition-colors">{brand.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT WE DO - SERVICES GRID ===== */}
      {/* Vision: Asymmetric bento-grid layout with hover-activated cards, each service
          gets a unique card size. Mix of large feature cards and smaller ones. 
          Clean white cards with subtle orange accents on hover. */}
      <section className="py-20 lg:py-32 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">What We Do</span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Complete Solar & Electrical
              <br />
              <span className="text-gradient">Solutions</span>
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              {autoLink('From residential solar installations to industrial electrical maintenance, we deliver reliable power solutions that exceed expectations.')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => {
              const Icon = serviceIcons[service.icon] || Sun;
              return (
                <AnimatedSection
                  key={service.id}
                  delay={i * 0.1}
                  className={`group ${i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''}`}
                >
                  <Link
                    to={`/solutions#${service.slug}`}
                    className={`block bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 transition-all duration-500 hover:shadow-xl hover:shadow-taqon-orange/5 shadow-sm dark:shadow-none h-full ${
                      i === 0 ? 'lg:flex lg:items-center lg:gap-8' : ''
                    }`}
                  >
                    {i === 0 && (
                      <div className="lg:w-1/2 mb-6 lg:mb-0 rounded-2xl overflow-hidden">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-48 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={i === 0 ? 'lg:w-1/2' : ''}>
                      <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-5 group-hover:bg-taqon-orange group-hover:text-white transition-all duration-500">
                        <Icon size={24} className="text-taqon-orange group-hover:text-white transition-colors duration-500" />
                      </div>
                      <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                        {service.title}
                      </h3>
                      <p className="mt-3 text-taqon-muted text-sm leading-relaxed">{autoLink(service.shortDesc)}</p>
                      <div className="mt-5 flex items-center gap-2 text-taqon-orange text-sm font-semibold">
                        Learn more
                        <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        {/* Blended background image */}
        <div className="absolute inset-0">
          <img src="/bulawayo-16kva-1.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-taqon-dark/70" />
        </div>

        {/* Decorative blended shapes */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-taqon-orange/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-80 h-80 bg-taqon-amber/15 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 15, 0], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-10 -right-10 w-72 h-72 bg-taqon-orange/12 rounded-full blur-[90px]"
        />
        {/* Glassmorphic floating accent shape — top right */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 right-[10%] w-24 h-24 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rotate-12 hidden lg:block"
        />
        {/* Glassmorphic floating accent shape — bottom left */}
        <motion.div
          animate={{ y: [6, -6, 6], rotate: [0, -4, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-20 left-[8%] w-16 h-16 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] -rotate-6 hidden lg:block"
        />
        {/* Small diamond accent */}
        <motion.div
          animate={{ y: [-5, 5, -5], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/3 left-[15%] w-10 h-10 bg-taqon-orange/10 rotate-45 rounded-lg blur-sm hidden lg:block"
        />

        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Our Track Record</span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-white">
              Numbers That <span className="text-gradient">Speak</span>
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, i) => {
              const statLinks = {
                'Projects Completed': '/projects',
                'kWp PV Modules Installed': '/solutions/solar-installations',
                'kWh Battery Storage': '/shop?category=batteries',
                'Years Experience': '/about-us',
              };
              const linkTo = statLinks[stat.label] || '/';
              return (
                <StaggerItem key={i} className={stat.label === 'kWp PV Modules Installed' ? 'sm:col-span-2 lg:col-span-1' : ''}>
                  {stat.label === 'kWp PV Modules Installed' ? (
                    <Link to={linkTo} className="block group">
                      <LiveCounter />
                    </Link>
                  ) : (
                    <Link to={linkTo} className="block group">
                      <div className="relative text-center p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 hover:border-taqon-orange/30 transition-all duration-500 h-full flex flex-col items-center justify-center min-h-[140px]">
                        <ArrowSquareOut size={16} className="absolute top-4 right-4 text-white/30 group-hover:text-taqon-orange transition-colors" />
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-syne text-gradient whitespace-nowrap">{stat.value}</div>
                        <p className="mt-3 text-sm">
                          <span className="text-taqon-orange underline decoration-taqon-orange/30 underline-offset-2 group-hover:decoration-taqon-orange transition-all">{stat.label}</span>
                        </p>
                      </div>
                    </Link>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      {/* Vision: Split layout with a large image on one side and stacked feature cards 
          on the other. The image should show the Taqon team at work — professional,
          trustworthy, skilled. Clean white background with orange accents. */}
      <section className="py-20 lg:py-32 bg-white dark:bg-taqon-charcoal relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedSection variant="fadeLeft">
              <div className="relative">
                <div className="absolute -inset-4 bg-taqon-orange/5 rounded-[2rem] -rotate-3" />
                <img
                  src="/kadoma-24kva-3.jpg"
                  alt="Taqon Electrico solar installation team at work"
                  className="relative rounded-3xl w-full h-[500px] object-cover"
                  loading="lazy"
                />
                {/* Floating stat card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-6 -right-6 bg-taqon-orange text-white p-6 rounded-2xl shadow-xl shadow-taqon-orange/30"
                >
                  <div className="text-3xl font-bold font-syne">500+</div>
                  <div className="text-sm text-white/80">Happy Clients</div>
                </motion.div>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fadeRight">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Why Choose Us</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
                Zimbabwe's Most Trusted
                <br />
                <span className="text-gradient">Solar Company</span>
              </h2>
              <p className="mt-4 text-taqon-muted leading-relaxed">
                {autoLink('Recommended by ZERA, trusted by NGOs, companies, and homeowners across Zimbabwe. Our installations consistently exceed expectations.')}
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { title: 'ZERA Recommended', desc: 'Officially recommended by the Zimbabwe Energy Regulatory Authority.' },
                  { title: 'Premium Equipment', desc: 'We use only top-tier brands like Jinko, Pylontech, and Kodak.' },
                  { title: 'Expert Engineers', desc: 'Our licensed electrical engineers deliver flawless installations.' },
                  { title: 'Nationwide Service', desc: 'Based in Harare with clients across all of Zimbabwe.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={18} className="text-taqon-orange" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-taqon-charcoal dark:text-white">{item.title}</h4>
                      <p className="text-sm text-taqon-muted mt-0.5">{autoLink(item.desc)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        {/* Blended background image */}
        <div className="absolute inset-0">
          <img src="/thuli-kirkman-10kva-1.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-taqon-dark/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Testimonials</span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-white">
              What Our <span className="text-gradient">Clients</span> Say
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.id} delay={i * 0.1}>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/15 hover:border-taqon-orange/30 hover:bg-white/15 transition-all duration-500 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={16} className="fill-taqon-gold text-taqon-gold" />
                    ))}
                  </div>
                  <p className="text-white/80 leading-relaxed italic">"{autoLink(t.text)}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-taqon-orange/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-taqon-orange font-bold text-sm">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIDEO TESTIMONIALS ===== */}
      <section className="py-16 lg:py-24 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Video Stories</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Hear From Our <span className="text-gradient">Clients</span>
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {videoTestimonials.map((v, i) => (
              <AnimatedSection key={v.id} delay={i * 0.1}>
                <VideoTestimonial {...v} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GOOGLE REVIEWS ===== */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/thuli-willowvale-16kva-1.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-taqon-dark/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <GoogleReviews />
        </div>
      </section>

      {/* ===== SOLAR PACKAGES CTA ===== */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative overflow-hidden">

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-6xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
              Find Your Perfect
              <br />
              <span className="text-gradient">Solar Package</span>
            </h2>
            <p className="mt-6 text-gray-500 dark:text-white/50 text-lg max-w-2xl mx-auto">
              {autoLink('From basic home setups to industrial power solutions — we have a package tailored for every need and budget.')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/packages"
                className="group inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Compare Packages
                <CaretRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-all border border-gray-200 dark:border-white/10"
              >
                Shop Equipment
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== CONTACT CTA ===== */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/borrowdale-brook-5kva-1.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-taqon-dark/80" />
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-taqon-orange to-taqon-amber rounded-[2rem] p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-white">
                <h2 className="text-3xl lg:text-4xl font-bold font-syne">Customer is King!</h2>
                <p className="mt-3 text-white/80 text-lg max-w-lg">
                  Visit us at {companyInfo.visitAddress}. Our team is ready to help you go solar.
                </p>
                <div className="mt-4 flex items-center gap-4 text-white/90">
                  <Phone size={18} />
                  <a href={`tel:${companyInfo.phone[1]}`} className="font-semibold">{companyInfo.phone[1]}</a>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-taqon-orange px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition-all shadow-lg"
                >
                  Contact Us
                  <ArrowUpRight size={18} />
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
    </>
  );
}