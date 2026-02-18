import React from 'react';
import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Zap, Droplets, Lightbulb, Wrench, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { services } from '../data/siteData';

const iconMap = { Sun, Zap, Droplets, Lightbulb, Wrench, Package: Shield };

export default function Solutions() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [hash]);

  return (
    <>
      <SEO
        title="Our Solutions"
        description="Explore Taqon Electrico's complete range of solar and electrical services — solar installations, electrical maintenance, borehole pumps, lighting, and more."
        keywords="solar solutions Zimbabwe, electrical services Harare, solar installation, borehole pump, lighting installation"
        canonical="https://www.taqon.co.zw/solutions"
      />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-15" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/80 to-taqon-dark" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Our Solutions</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Comprehensive Energy <span className="text-gradient">Solutions</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              From solar installations to electrical maintenance, we deliver end-to-end power solutions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Detail */}
      {services.map((service, i) => {
        const Icon = iconMap[service.icon] || Sun;
        const isEven = i % 2 === 0;

        return (
          <section
            key={service.id}
            id={service.slug}
            className={`py-20 lg:py-28 ${isEven ? 'bg-white' : 'bg-taqon-cream'} scroll-mt-24`}
          >
            <div className="max-w-7xl mx-auto px-4">
              <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${!isEven ? 'lg:direction-rtl' : ''}`}>
                <AnimatedSection variant={isEven ? 'fadeLeft' : 'fadeRight'} className={!isEven ? 'lg:order-2' : ''}>
                  <div className="relative rounded-3xl overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-[400px] lg:h-[500px] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                </AnimatedSection>

                <AnimatedSection variant={isEven ? 'fadeRight' : 'fadeLeft'} className={!isEven ? 'lg:order-1' : ''}>
                  <div className="w-16 h-16 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-6">
                    <Icon size={28} className="text-taqon-orange" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal">{service.title}</h2>
                  <p className="mt-4 text-taqon-muted leading-relaxed">{service.description}</p>

                  <div className="mt-8 space-y-3">
                    {service.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-taqon-orange flex-shrink-0" />
                        <span className="text-taqon-charcoal">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold mt-8 hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
                  >
                    Get Started <ArrowRight size={16} />
                  </Link>
                </AnimatedSection>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
