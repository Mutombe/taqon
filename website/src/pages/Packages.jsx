import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Zap } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { packages } from '../data/siteData';

const tierColors = {
  starter: 'from-gray-50 to-white border-gray-200',
  popular: 'from-taqon-orange/5 to-white border-taqon-orange/30',
  premium: 'from-taqon-charcoal to-taqon-gray border-taqon-charcoal',
  commercial: 'from-gray-900 to-gray-800 border-gray-700',
};

export default function Packages() {
  return (
    <>
      <SEO
        title="Solar Packages"
        description="Compare Taqon Electrico's solar packages — from starter home systems to commercial 24kVA power solutions. Find the perfect fit for your needs."
        keywords="solar packages Zimbabwe, home solar system, commercial solar package, solar system comparison"
        canonical="https://www.taqon.co.zw/packages"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-10" loading="eager" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Solar Packages</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Compare <span className="text-gradient">Packages</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              From starter systems to commercial powerhouses — find your perfect solar solution.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16 lg:py-24 bg-taqon-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, i) => {
              const isDark = pkg.tier === 'premium' || pkg.tier === 'commercial';
              return (
                <AnimatedSection key={pkg.id} delay={i * 0.1}>
                  <div className={`relative rounded-3xl p-8 border bg-gradient-to-b ${tierColors[pkg.tier]} h-full flex flex-col ${pkg.popular ? 'ring-2 ring-taqon-orange shadow-xl shadow-taqon-orange/10' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-taqon-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Star size={12} /> Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={20} className={isDark ? 'text-taqon-orange' : 'text-taqon-orange'} />
                      <h3 className={`text-xl font-bold font-syne ${isDark ? 'text-white' : 'text-taqon-charcoal'}`}>{pkg.name}</h3>
                    </div>

                    <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-taqon-muted'}`}>{pkg.description}</p>

                    <div className={`text-3xl font-bold font-syne mb-6 ${isDark ? 'text-gradient' : 'text-taqon-charcoal'}`}>
                      {pkg.price}
                    </div>

                    <div className="space-y-3 flex-1">
                      {pkg.features.map((feature, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Check size={16} className="text-taqon-orange flex-shrink-0" />
                          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-taqon-muted'}`}>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/contact"
                      className={`mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        pkg.popular
                          ? 'bg-taqon-orange text-white hover:bg-taqon-orange/90 shadow-lg shadow-taqon-orange/25'
                          : isDark
                          ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                          : 'bg-taqon-charcoal text-white hover:bg-taqon-charcoal/90'
                      }`}
                    >
                      Get This Package <ArrowRight size={14} />
                    </Link>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection className="mt-16 text-center">
            <p className="text-taqon-muted">Need a custom package? <Link to="/contact" className="text-taqon-orange font-semibold hover:underline">Contact us</Link> for a tailored solution.</p>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
