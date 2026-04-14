import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass, X, Tag, Star, ArrowRight, Phone,
  ShoppingCart, SlidersHorizontal, CircleNotch,
  CaretLeft, CaretRight, Bag, Heart,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import useCartStore from '../stores/cartStore';
import useSavesStore from '../stores/savesStore';
import { toast } from 'sonner';
import { useProducts, useCategories, useBrands, usePrefetch } from '../hooks/useQueries';

// Helper to extract image URL from product
function getProductImage(product) {
  const img = product?.primary_image;
  if (!img) return null;
  return img.image_url || img.image || null;
}

// Placeholder when no image available
function ProductImagePlaceholder({ name }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-taqon-gray dark:to-taqon-dark flex items-center justify-center">
      <div className="text-center px-4">
        <img src="/fav.png" alt="Taqon Electrico" className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <span className="text-[10px] text-gray-400 dark:text-white/30 line-clamp-2 leading-tight">{name}</span>
      </div>
    </div>
  );
}

// Star rating display
function StarRating({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            weight={star <= Math.round(rating) ? 'fill' : 'regular'}
            className={star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200 dark:text-white/15'}
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-gray-400 dark:text-white/40">({count})</span>
      )}
    </div>
  );
}

// Skeleton loader for product cards
function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-pulse">
      <div className="aspect-square bg-gray-100 dark:bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-20" />
        <div className="h-5 bg-gray-100 dark:bg-white/10 rounded w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-gray-100 dark:bg-white/10 rounded-full w-16" />
          <div className="h-5 bg-gray-100 dark:bg-white/10 rounded-full w-20" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/10">
          <div className="h-7 bg-gray-100 dark:bg-white/10 rounded w-24" />
          <div className="h-10 bg-gray-100 dark:bg-white/10 rounded-xl w-10" />
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-average_rating', label: 'Top Rated' },
  { value: 'name', label: 'Name: A-Z' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState(null);

  // Read URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const priceMin = searchParams.get('price_min') || '';
  const priceMax = searchParams.get('price_max') || '';
  const onSale = searchParams.get('on_sale') || '';
  const inStock = searchParams.get('in_stock') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);
  const searchTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { toggleProduct, likedProducts } = useSavesStore();
  const { prefetchProduct } = usePrefetch();

  // Build query params object (stable reference via useMemo to avoid spurious refetches)
  const productParams = useMemo(() => {
    const params = { page, page_size: 12 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (ordering) params.ordering = ordering;
    if (priceMin) params.price_min = priceMin;
    if (priceMax) params.price_max = priceMax;
    if (onSale === 'true') params.on_sale = true;
    if (inStock === 'true') params.in_stock = true;
    return params;
  }, [search, category, brand, ordering, priceMin, priceMax, onSale, inStock, page]);

  // React Query: products, categories, brands — all cached and deduplicated.
  // placeholderData keeps the previous result visible while the new one loads
  // (e.g. when changing filters), eliminating the flash-to-skeleton pattern.
  const { data: productsData, isLoading: loading, isError } = useProducts(productParams);
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const products = productsData?.results || productsData || [];
  const totalCount = productsData?.count ?? products.length;

  // Update URL params (resets page unless page is explicitly in updates)
  const updateParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    if (!('page' in updates)) newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Debounced search
  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      updateParams({ search: value || '' });
    }, 400);
  };

  // Active filter count
  const activeFilterCount = [category, brand, priceMin, priceMax, onSale, inStock].filter(Boolean).length;

  const totalPages = Math.ceil(totalCount / 12);

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCartId(product.id);
    try {
      await addItem(product.id, 1, product);
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleBuyNow = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCartId(product.id);
    try {
      await addItem(product.id, 1, product);
      navigate('/checkout');
    } finally {
      setAddingToCartId(null);
    }
  };

  // Flatten categories for active filter tag display
  const allCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);

  return (
    <>
      <SEO
        title="Shop Solar Equipment"
        description="Shop premium solar panels, lithium batteries, inverters and accessories from top brands. Best prices in Zimbabwe."
        keywords="buy solar panels Zimbabwe, solar batteries Harare, inverters for sale, Pylontech, Jinko solar"
        canonical="https://www.taqon.co.zw/shop"
      />

      {/* Hero */}
      <section className="relative pt-24 pb-10 lg:pt-32 lg:pb-14 bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Online Shop</span>
            <h1 className="mt-2 text-3xl lg:text-5xl font-bold font-syne text-white">
              Premium Solar <span className="text-gradient">Equipment</span>
            </h1>
            <p className="mt-3 text-white/50 text-lg max-w-xl">
              Top-quality solar panels, batteries, and inverters from the world's best brands.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 max-w-2xl"
          >
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search solar panels, batteries, inverters..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/40 outline-none focus:border-taqon-orange/50 focus:bg-white/15 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); updateParams({ search: '' }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="py-8 lg:py-12 bg-taqon-cream dark:bg-taqon-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Category Pills + Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateParams({ category: '' })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !category
                      ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                      : 'bg-white dark:bg-white/10 text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParams({ category: cat.slug })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      category === cat.slug
                        ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                        : 'bg-white dark:bg-white/10 text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {cat.name}
                    {cat.product_count != null && (
                      <span className="ml-1.5 text-xs opacity-60">({cat.product_count})</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Toggle */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    filtersOpen || activeFilterCount > 0
                      ? 'bg-taqon-orange/10 border-taqon-orange/30 text-taqon-orange'
                      : 'bg-white dark:bg-taqon-charcoal border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-taqon-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <select
                  value={ordering}
                  onChange={(e) => updateParams({ ordering: e.target.value })}
                  className="bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory pills when parent category is selected */}
            {category && (() => {
              const selectedCat = categories.find(c => c.slug === category);
              if (selectedCat?.children?.length > 0) {
                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2 pl-3 border-l-2 border-taqon-orange/30"
                  >
                    {selectedCat.children.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => updateParams({ category: sub.slug })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 hover:bg-taqon-orange/10 hover:text-taqon-orange"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </motion.div>
                );
              }
              return null;
            })()}

            {/* Expandable Filters Panel */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Brand Filter */}
                      <div>
                        <h4 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">Brand</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {brands.map((b) => (
                            <label key={b.id} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="brand"
                                checked={brand === b.slug}
                                onChange={() => updateParams({ brand: brand === b.slug ? '' : b.slug })}
                                className="accent-taqon-orange"
                              />
                              <span className="text-sm text-gray-600 dark:text-white/60 group-hover:text-taqon-charcoal dark:group-hover:text-white transition-colors">
                                {b.name}
                              </span>
                            </label>
                          ))}
                          {brand && (
                            <button
                              onClick={() => updateParams({ brand: '' })}
                              className="text-xs text-taqon-orange hover:underline mt-1"
                            >
                              Clear brand
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h4 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">Price Range (USD)</h4>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => updateParams({ price_min: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange"
                          />
                          <span className="text-gray-400 dark:text-white/30 flex-shrink-0">&mdash;</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => updateParams({ price_max: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div>
                        <h4 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">Filter By</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={onSale === 'true'}
                              onChange={() => updateParams({ on_sale: onSale === 'true' ? '' : 'true' })}
                              className="accent-taqon-orange rounded"
                            />
                            <span className="text-sm text-gray-600 dark:text-white/60">On Sale</span>
                            <Tag size={14} className="text-red-400" />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inStock === 'true'}
                              onChange={() => updateParams({ in_stock: inStock === 'true' ? '' : 'true' })}
                              className="accent-taqon-orange rounded"
                            />
                            <span className="text-sm text-gray-600 dark:text-white/60">In Stock Only</span>
                          </label>
                        </div>
                      </div>

                      {/* Clear All */}
                      <div className="flex items-end">
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 text-sm text-taqon-orange hover:text-taqon-orange/80 transition-colors"
                          >
                            <X size={14} />
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filter Tags */}
            {(search || activeFilterCount > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-white/30">Active:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 bg-taqon-orange/10 text-taqon-orange text-xs font-medium px-2.5 py-1 rounded-full">
                    Search: &ldquo;{search}&rdquo;
                    <button onClick={() => { setSearchInput(''); updateParams({ search: '' }); }}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 bg-taqon-orange/10 text-taqon-orange text-xs font-medium px-2.5 py-1 rounded-full">
                    {allCategories.find(c => c.slug === category)?.name || category}
                    <button onClick={() => updateParams({ category: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {brand && (
                  <span className="inline-flex items-center gap-1 bg-taqon-orange/10 text-taqon-orange text-xs font-medium px-2.5 py-1 rounded-full">
                    {brands.find(b => b.slug === brand)?.name || brand}
                    <button onClick={() => updateParams({ brand: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {priceMin && (
                  <span className="inline-flex items-center gap-1 bg-taqon-orange/10 text-taqon-orange text-xs font-medium px-2.5 py-1 rounded-full">
                    Min: ${priceMin}
                    <button onClick={() => updateParams({ price_min: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {priceMax && (
                  <span className="inline-flex items-center gap-1 bg-taqon-orange/10 text-taqon-orange text-xs font-medium px-2.5 py-1 rounded-full">
                    Max: ${priceMax}
                    <button onClick={() => updateParams({ price_max: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {onSale === 'true' && (
                  <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    On Sale
                    <button onClick={() => updateParams({ on_sale: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {inStock === 'true' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    In Stock
                    <button onClick={() => updateParams({ in_stock: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-500 dark:text-white/40">
              {loading ? (
                <span className="animate-pulse">Loading products...</span>
              ) : (
                <span>{totalCount} product{totalCount !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <MagnifyingGlass size={48} className="text-gray-300 dark:text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 dark:text-white/50 mb-6 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you&apos;re looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {products.map((product) => {
                  const imageUrl = getProductImage(product);
                  const price = parseFloat(product.price);
                  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link
                        to={`/shop/${product.slug}`}
                        onMouseEnter={() => prefetchProduct(product.slug)}
                        onFocus={() => { prefetchProduct(product.slug); }}
                        className="group block bg-white dark:bg-taqon-charcoal rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 hover:border-taqon-orange/20 hover:shadow-xl hover:shadow-taqon-orange/5 transition-all duration-500"
                      >
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-taqon-dark">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              loading="lazy"
                            />
                          ) : (
                            <ProductImagePlaceholder name={product.name} />
                          )}

                          {/* Badges */}
                          {product.is_on_sale && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Tag size={10} weight="bold" /> {product.sale_percentage || 'SALE'}% OFF
                            </div>
                          )}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProduct(product.slug); }}
                              className="w-8 h-8 rounded-full bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                              aria-label="Save product"
                            >
                              <Heart size={15} weight={likedProducts.includes(product.slug) ? 'fill' : 'regular'} className={likedProducts.includes(product.slug) ? 'text-red-500' : 'text-gray-400'} />
                            </button>
                            {product.brand && (
                              <span className="bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-full text-taqon-charcoal dark:text-white">
                                {product.brand.name}
                              </span>
                            )}
                          </div>

                          {/* Out of stock overlay */}
                          {!product.in_stock && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="bg-red-500/90 text-white text-xs font-bold px-4 py-1.5 rounded-full">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <p className="text-[10px] text-taqon-orange font-semibold uppercase tracking-wider mb-1.5">
                            {product.category?.name}
                          </p>
                          <h3 className="font-semibold text-sm text-taqon-charcoal dark:text-white group-hover:text-taqon-orange transition-colors line-clamp-2 font-syne leading-snug">
                            {product.name}
                          </h3>

                          {parseFloat(product.average_rating) > 0 && (
                            <div className="mt-2">
                              <StarRating rating={parseFloat(product.average_rating)} count={product.total_reviews} />
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-baseline gap-1.5 mt-3">
                            <span className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">
                              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {product.is_on_sale && comparePrice && (
                              <span className="text-xs text-gray-400 dark:text-white/30 line-through">
                                ${comparePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart + Buy Now */}
                          {!product.in_stock ? (
                            <button
                              disabled
                              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed"
                            >
                              Out of Stock
                            </button>
                          ) : (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={(e) => handleAddToCart(e, product)}
                                disabled={addingToCartId === product.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-taqon-orange text-white hover:bg-taqon-orange/90"
                              >
                                {addingToCartId === product.id ? (
                                  <CircleNotch size={14} className="animate-spin" />
                                ) : (
                                  <ShoppingCart size={14} />
                                )}
                                <span className="hidden sm:inline">Add to Cart</span>
                                <span className="sm:hidden">Add</span>
                              </button>
                              <button
                                onClick={(e) => handleBuyNow(e, product)}
                                disabled={addingToCartId === product.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 border-taqon-orange text-taqon-orange hover:bg-taqon-orange/5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Buy Now
                              </button>
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
                disabled={page <= 1}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <CaretLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-gray-400 dark:text-white/30 px-1">&hellip;</span>}
                      <button
                        onClick={() => updateParams({ page: String(p) })}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          p === page
                            ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/25'
                            : 'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
                disabled={page >= totalPages}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <CaretRight size={18} />
              </button>
            </div>
          )}

          {/* Contact CTA */}
          <AnimatedSection className="mt-16">
            <div className="bg-taqon-charcoal dark:bg-taqon-gray rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 dark-mesh" />
              <div className="relative">
                <h3 className="text-2xl lg:text-3xl font-bold font-syne text-white">Can&apos;t find what you need?</h3>
                <p className="mt-3 text-white/50 max-w-lg mx-auto">Contact us directly for custom quotes and bulk orders.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all">
                    Contact Us <ArrowRight size={16} />
                  </Link>
                  <a href="tel:+263772771036" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/15 transition-all border border-white/10">
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
