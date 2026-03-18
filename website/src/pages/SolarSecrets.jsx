import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, Lightbulb, Calendar } from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';

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
          <img src="/kadoma-24kva-1.jpg" alt="" className="w-full h-full object-cover opacity-30" loading="eager" />
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
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          {/* Featured Article */}
          {blogPosts.length > 0 && (
            <AnimatedSection className="mb-12">
              <Link to={`/blog/${blogPosts[0].slug}`} className="group block">
                <div className="grid lg:grid-cols-2 gap-0 bg-white dark:bg-taqon-charcoal rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 hover:shadow-xl hover:border-taqon-orange/20 transition-all duration-500">
                  <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden">
                    <img
                      src={blogPosts[0].image}
                      alt={blogPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                    />
                    <div className="absolute top-4 left-4 bg-taqon-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                      Featured
                    </div>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <span className="text-taqon-orange text-xs font-semibold uppercase tracking-wider">{blogPosts[0].category}</span>
                    <h2 className="mt-2 text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors">
                      {blogPosts[0].title}
                    </h2>
                    <p className="mt-3 text-taqon-muted dark:text-white/60 leading-relaxed">{blogPosts[0].excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-taqon-muted dark:text-white/50">
                      <span className="flex items-center gap-1"><Clock size={14} /> {blogPosts[0].readTime}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(blogPosts[0].date).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-taqon-orange font-semibold group-hover:gap-3 transition-all">
                      Read Article <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          )}

          {/* Article Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.slice(1).map((post, i) => (
              <AnimatedSection key={post.id} delay={i * 0.1}>
                <Link to={`/blog/${post.slug}`} className="group block h-full">
                  <div className="bg-white dark:bg-taqon-charcoal rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-taqon-charcoal dark:text-white">
                        {post.category}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-taqon-muted line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-taqon-muted dark:text-white/40">
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.date).toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          {/* View All + CTA */}
          <AnimatedSection className="mt-12 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
            >
              View All Articles <ArrowRight size={16} weight="bold" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
