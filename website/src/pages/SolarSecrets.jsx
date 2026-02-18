import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, Lightbulb } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { solarTips } from '../data/siteData';

export default function SolarSecrets() {
  return (
    <>
      <SEO
        title="Solar Secrets - Learn About Solar"
        description="Learn everything about solar energy systems — tips, guides, and insights from Taqon Electrico's expert engineers."
        keywords="solar tips, solar energy guide, solar panel efficiency, battery storage guide, solar system sizing"
        canonical="https://www.taqon.co.zw/solar-secrets"
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-10" loading="eager" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-taqon-orange" />
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Solar Secrets</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold font-syne text-white">
              Learn More About <span className="text-gradient">Solar</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Expert guides, tips, and insights to help you make informed decisions about solar energy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 lg:py-24 bg-taqon-cream">
        <div className="max-w-7xl mx-auto px-4">
          {/* Featured Article */}
          <AnimatedSection className="mb-12">
            <div className="grid lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500 group">
              <div className="relative h-[300px] lg:h-auto overflow-hidden">
                <img
                  src={solarTips[0].image}
                  alt={solarTips[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute top-4 left-4 bg-taqon-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="text-taqon-orange text-xs font-semibold uppercase tracking-wider">{solarTips[0].category}</span>
                <h2 className="mt-2 text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal group-hover:text-taqon-orange transition-colors">
                  {solarTips[0].title}
                </h2>
                <p className="mt-3 text-taqon-muted leading-relaxed">{solarTips[0].excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-taqon-muted">
                  <span className="flex items-center gap-1"><Clock size={14} /> {solarTips[0].readTime}</span>
                  <span>{solarTips[0].date}</span>
                </div>
                <button className="mt-6 inline-flex items-center gap-2 text-taqon-orange font-semibold group-hover:gap-3 transition-all">
                  Read Article <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </AnimatedSection>

          {/* Article Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solarTips.slice(1).map((tip, i) => (
              <AnimatedSection key={tip.id} delay={i * 0.1}>
                <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={tip.image}
                      alt={tip.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-taqon-charcoal">
                      {tip.category}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold font-syne text-taqon-charcoal group-hover:text-taqon-orange transition-colors">
                      {tip.title}
                    </h3>
                    <p className="mt-2 text-sm text-taqon-muted line-clamp-3 flex-1">{tip.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-taqon-muted">
                      <span className="flex items-center gap-1"><Clock size={12} /> {tip.readTime}</span>
                      <span>{tip.date}</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Newsletter CTA */}
          <AnimatedSection className="mt-16">
            <div className="bg-gradient-to-br from-taqon-orange to-taqon-amber rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative">
                <BookOpen size={32} className="text-white/80 mx-auto mb-4" />
                <h3 className="text-2xl lg:text-3xl font-bold font-syne text-white">Stay Updated</h3>
                <p className="mt-3 text-white/80 max-w-lg mx-auto">
                  Get the latest solar tips, industry news, and exclusive offers delivered to your inbox.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 outline-none focus:bg-white/30 transition-all text-sm"
                  />
                  <button className="bg-white text-taqon-orange px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
