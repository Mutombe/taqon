import React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, Calendar, Clock, ArrowRight, CaretLeft, CaretRight, Tag } from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { blogPosts } from '../data/blogData';

const POSTS_PER_PAGE = 6;

const categories = ['All', 'Education', 'Technology', 'Guide', 'Maintenance', 'News', 'Tips'];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let posts = [...blogPosts];
    if (activeCategory !== 'All') {
      posts = posts.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginatedPosts = filtered.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const featuredPost = filtered[0];
  const gridPosts = currentPage === 1 ? paginatedPosts.slice(1) : paginatedPosts;

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <SEO
        title="Solar Energy Blog"
        description="Expert articles on solar energy, battery technology, system maintenance, and renewable energy tips for Zimbabwe. Stay informed with Taqon Electrico's solar blog."
        keywords="solar blog Zimbabwe, solar energy articles, solar tips, battery guide, renewable energy Zimbabwe"
        canonical="https://www.taqon.co.zw/blog"
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="/kadoma-24kva-1.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Our Blog
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Solar Energy <span className="text-gradient">Insights</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Expert guides, industry news, and practical tips to help you make the most
              of solar energy in Zimbabwe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-12 lg:py-20 bg-taqon-cream dark:bg-taqon-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-10">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                      : 'bg-white dark:bg-white/10 text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted"
              />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 rounded-xl text-sm text-taqon-charcoal dark:text-white placeholder-taqon-muted outline-none focus:border-taqon-orange transition-colors"
              />
            </div>
          </div>

          {/* Featured Post */}
          {currentPage === 1 && featuredPost && (
            <AnimatedSection className="mb-10">
              <Link to={`/blog/${featuredPost.slug}`} className="group block">
                <div className="grid lg:grid-cols-2 gap-6 bg-white dark:bg-taqon-charcoal rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-xl hover:shadow-taqon-orange/5 transition-all duration-500">
                  <div className="aspect-[16/10] lg:aspect-auto overflow-hidden">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                    />
                  </div>
                  <div className="p-6 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-taqon-orange/10 text-taqon-orange text-xs font-semibold rounded-full">
                        {featuredPost.category}
                      </span>
                      <span className="text-xs text-taqon-muted">Featured</span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-3 text-taqon-muted leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-sm text-taqon-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(featuredPost.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {featuredPost.readTime}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-taqon-orange font-semibold text-sm">
                      Read Article
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-2 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          )}

          {/* Posts Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link to={`/blog/${post.slug}`} className="group block h-full">
                    <div className="bg-white dark:bg-taqon-charcoal rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-xl hover:shadow-taqon-orange/5 transition-all duration-500 h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm text-taqon-orange text-xs font-semibold rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-taqon-muted leading-relaxed line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-taqon-muted">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(post.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Tag size={48} className="text-taqon-muted/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                No articles found
              </h3>
              <p className="mt-2 text-taqon-muted">
                Try adjusting your search or filter to find what you are looking for.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-6 py-2 bg-taqon-orange text-white rounded-full text-sm font-semibold hover:bg-taqon-orange/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white disabled:opacity-30 hover:border-taqon-orange transition-colors"
              >
                <CaretLeft size={16} /> Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                    currentPage === i + 1
                      ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                      : 'bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white hover:border-taqon-orange'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white disabled:opacity-30 hover:border-taqon-orange transition-colors"
              >
                Next <CaretRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
