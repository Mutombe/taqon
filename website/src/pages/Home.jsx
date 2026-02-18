import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sun, Zap, Droplets, Lightbulb, Wrench, ArrowRight, ArrowUpRight,
  ChevronRight, Star, Play, Shield, Award, CheckCircle2, Phone
} from 'lucide-react';
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import SEO from '../components/SEO';
import JsonLd, { localBusinessSchema, organizationSchema } from '../components/JsonLd';
import LiveCounter from '../components/LiveCounter';
import GoogleReviews from '../components/GoogleReviews';
import VideoTestimonial from '../components/VideoTestimonial';
import { services, stats, testimonials, companyInfo, videoTestimonials } from '../data/siteData';

/* Vision: Hero section with dramatic dark background, animated solar panel imagery,
   floating geometric shapes in orange tones, and a powerful headline. Think premium 
   energy brand meets tech startup — Tesla meets SolarCity aesthetic. */

const serviceIcons = { Sun, Zap, Droplets, Lightbulb, Wrench, Package: Shield };

const brandLogos = [
  { name: 'Jinko Solar', logo: '/jinko.png' },
  { name: 'Pylontech', logo: '/pylontech.jpg' },
  { name: 'Dyness', logo: '/Dyness.png' },
  { name: 'Sigenergy', logo: '/sigenergy.jpg' },
  { name: 'Sunsynk', logo: '/sunsynk.png' },
  { name: 'Kodak', logo: null },
  { name: 'JA Solar', logo: null },
  { name: 'Deye', logo: null },
];

const heroImages = [
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80',
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1920&q=80',
  'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1920&q=80',
  'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1920&q=80',
  'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=1920&q=80',
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

        {/* Slide indicators */}
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                currentSlide === i ? 'w-8 bg-taqon-orange' : 'w-3 bg-white/30 hover:bg-white/50'
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
              <span className="text-taqon-orange text-sm font-medium">ZERA Recommended Solar Company</span>
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
              Expert solar installations, electrical engineering, and renewable energy solutions 
              for homes, businesses, and institutions across Zimbabwe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/contact"
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
                { icon: Shield, text: 'ZERA Approved' },
                { icon: Award, text: '500+ Projects' },
                { icon: CheckCircle2, text: '5+ Years' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/40 text-sm">
                  <item.icon size={16} className="text-taqon-orange/60" />
                  {item.text}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-taqon-cream to-transparent" />
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
              <div key={i} className="flex-shrink-0 px-10 py-3 flex items-center justify-center">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-10 lg:h-12 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 dark:brightness-0 dark:invert dark:opacity-40 dark:hover:opacity-80"
                  />
                ) : (
                  <span className="text-xl font-bold text-taqon-charcoal/20 dark:text-white/15 font-syne whitespace-nowrap">{brand.name}</span>
                )}
              </div>
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
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal">
              Complete Solar & Electrical
              <br />
              <span className="text-gradient">Solutions</span>
            </h2>
            <p className="mt-4 text-taqon-muted max-w-2xl mx-auto">
              From residential solar installations to industrial electrical maintenance, we deliver 
              reliable power solutions that exceed expectations.
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
                    className={`block bg-white dark:bg-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 transition-all duration-500 hover:shadow-xl hover:shadow-taqon-orange/5 h-full ${
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
                      <h3 className="text-xl font-bold font-syne text-taqon-charcoal group-hover:text-taqon-orange transition-colors">
                        {service.title}
                      </h3>
                      <p className="mt-3 text-taqon-muted text-sm leading-relaxed">{service.shortDesc}</p>
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
      {/* Vision: Dark section with large, bold numbers and subtle glow effects.
          Numbers should feel monumental — think dashboard metrics on a dark canvas. */}
      <section className="py-20 lg:py-28 bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-taqon-orange/10 rounded-full blur-[120px]"
        />

        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Our Track Record</span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-white">
              Numbers That <span className="text-gradient">Speak</span>
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500">
                  {stat.label === 'kWp PV Modules Installed' ? (
                    <LiveCounter />
                  ) : (
                    <div className="text-4xl lg:text-5xl font-bold font-syne text-gradient">{stat.value}</div>
                  )}
                  <p className="mt-3 text-white/50 text-sm">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
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
                  src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80"
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
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal leading-tight">
                Zimbabwe's Most Trusted
                <br />
                <span className="text-gradient">Solar Company</span>
              </h2>
              <p className="mt-4 text-taqon-muted leading-relaxed">
                Recommended by ZERA, trusted by NGOs, companies, and homeowners across Zimbabwe.
                Our installations consistently exceed expectations.
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
                      <CheckCircle2 size={18} className="text-taqon-orange" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-taqon-charcoal">{item.title}</h4>
                      <p className="text-sm text-taqon-muted mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {/* Vision: Horizontal scrolling testimonial cards on a warm cream background.
          Each card features a star rating, quote, and client info. Glass-morphic cards. */}
      <section className="py-20 lg:py-32 bg-taqon-cream dark:bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Testimonials</span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal">
              What Our <span className="text-gradient">Clients</span> Say
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.id} delay={i * 0.1}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={16} className="fill-taqon-gold text-taqon-gold" />
                    ))}
                  </div>
                  <p className="text-taqon-charcoal/80 leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-taqon-orange/10 flex items-center justify-center">
                      <span className="text-taqon-orange font-bold text-sm">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-taqon-charcoal">{t.name}</p>
                      <p className="text-xs text-taqon-muted">{t.role}</p>
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
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <GoogleReviews />
        </div>
      </section>

      {/* ===== SOLAR PACKAGES CTA ===== */}
      {/* Vision: Bold gradient section with a compelling call-to-action to compare packages.
          Large typography, minimal design, strong visual impact. */}
      <section className="py-20 lg:py-28 bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-10"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-taqon-dark via-taqon-dark/95 to-taqon-dark/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-6xl font-bold font-syne text-white leading-tight">
              Find Your Perfect
              <br />
              <span className="text-gradient">Solar Package</span>
            </h2>
            <p className="mt-6 text-white/50 text-lg max-w-2xl mx-auto">
              From basic home setups to industrial power solutions — we have a package 
              tailored for every need and budget.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/packages"
                className="group inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Compare Packages
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/15 transition-all border border-white/10"
              >
                Shop Equipment
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== CONTACT CTA ===== */}
      {/* Vision: Clean, warm section with contact details and a direct CTA.
          Split into left (info) and right (action). */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
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