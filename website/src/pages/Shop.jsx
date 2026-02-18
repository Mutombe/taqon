import React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Filter, X, Tag, Star, ArrowRight, Phone } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import JsonLd, { productSchema } from '../components/JsonLd';
import { products, companyInfo } from '../data/siteData';

const categories = [
  { key: 'all', label: 'All Products' },
  { key: 'panels', label: 'Solar Panels' },
  { key: 'batteries', label: 'Batteries' },
  { key: 'inverters', label: 'Inverters' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [sortBy, setSortBy] = useState('name');

  const filtered = useMemo(() => {
    let items = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);
    if (sortBy === 'price-low') items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') items = [...items].sort((a, b) => b.price - a.price);
    else if (sortBy === 'sale') items = [...items].sort((a, b) => (b.onSale ? 1 : 0) - (a.onSale ? 1 : 0));
    return items;
  }, [activeCategory, sortBy]);

  const handleCategory = (key) => {
    setActiveCategory(key);
    if (key === 'all') searchParams.delete('category');
    else searchParams.set('category', key);
    setSearchParams(searchParams);
  };

  return (
    <>
      <SEO
        title="Shop Solar Equipment"
        description="Shop premium solar panels, lithium batteries, inverters and accessories from top brands like Jinko, Pylontech, Kodak and more. Best prices in Zimbabwe."
        keywords="buy solar panels Zimbabwe, solar batteries Harare, inverters for sale, Pylontech, Jinko solar, Kodak inverter"
        canonical="https://www.taqon.co.zw/shop"
      />

      {products.map(p => <JsonLd key={p.id} data={productSchema(p)} />)}

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1920&q=80" alt="" className="w-full h-full object-cover opacity-15" loading="eager" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Online Shop</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Premium Solar <span className="text-gradient">Equipment</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Top-quality solar panels, batteries, and inverters from the world's best brands.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="py-12 lg:py-20 bg-taqon-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.key
                      ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                      : 'bg-white text-taqon-charcoal hover:bg-taqon-orange/5 border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-taqon-orange transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="sale">On Sale First</option>
            </select>
          </div>

          {/* Products Grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-taqon-orange/20 hover:shadow-xl hover:shadow-taqon-orange/5 transition-all duration-500"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    {product.onSale && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Tag size={12} /> SALE
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full text-taqon-charcoal">
                      {product.brand}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <p className="text-xs text-taqon-orange font-semibold uppercase tracking-wider mb-2">
                      {product.category === 'panels' ? 'Solar Panel' : product.category === 'batteries' ? 'Battery' : 'Inverter'}
                    </p>
                    <h3 className="font-bold text-taqon-charcoal group-hover:text-taqon-orange transition-colors line-clamp-2 font-syne">
                      {product.name}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {product.specs.slice(0, 3).map((spec, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-taqon-muted px-2 py-0.5 rounded-full">{spec}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-taqon-charcoal font-syne">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-taqon-muted line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-xs text-taqon-muted">{product.warranty} Warranty</span>
                    </div>

                    <a
                      href={`https://wa.me/263772771036?text=Hi, I'm interested in ${product.name} ($${product.price})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-taqon-orange text-white py-3 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all"
                    >
                      <ShoppingBag size={16} />
                      Enquire Now
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Contact CTA */}
          <AnimatedSection className="mt-16">
            <div className="bg-taqon-dark rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 dark-mesh" />
              <div className="relative">
                <h3 className="text-2xl lg:text-3xl font-bold font-syne text-white">Can't find what you need?</h3>
                <p className="mt-3 text-white/50 max-w-lg mx-auto">Contact us directly for custom quotes and bulk orders.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all">
                    Contact Us <ArrowRight size={16} />
                  </Link>
                  <a href={`tel:${companyInfo.phone[1]}`} className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/15 transition-all border border-white/10">
                    <Phone size={16} /> Call Now
                  </a>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
