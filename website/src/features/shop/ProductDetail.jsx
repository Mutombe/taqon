import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, CaretRight, Minus, Plus,
  Shield, Package, Truck, Warning, Check, CircleNotch,
  ImageBroken, WhatsappLogo, ShareNetwork, FilePdf,
  Copy, Bag,
} from '@phosphor-icons/react';
import useCartStore from '../../stores/cartStore';
import SEO from '../../components/SEO';
import { confirmExternalNavigation } from '../../components/ContentLink';
import { toast } from 'sonner';
import { useProduct } from '../../hooks/useQueries';

// Helper to extract image URL
function getImageUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') return img;
  return img.image_url || img.image || null;
}

// Skeleton loader
function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="aspect-square bg-gray-100 dark:bg-white/10 rounded-3xl mb-4" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-32" />
          <div className="h-10 bg-gray-100 dark:bg-white/10 rounded w-3/4" />
          <div className="h-6 bg-gray-100 dark:bg-white/10 rounded w-48" />
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-full" />
          <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-5/6" />
          <div className="h-12 bg-gray-100 dark:bg-white/10 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

// Star rating display
function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          weight={star <= Math.round(parseFloat(rating)) ? 'fill' : 'regular'}
          className={
            star <= Math.round(parseFloat(rating))
              ? 'text-yellow-400'
              : 'text-gray-300 dark:text-white/20'
          }
        />
      ))}
    </div>
  );
}

// Stock status badge
function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-full text-sm font-medium">
        <Warning size={14} /> Out of Stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full text-sm font-medium">
        <Warning size={14} /> Low Stock &mdash; Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full text-sm font-medium">
      <Check size={14} /> In Stock
    </span>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('specs');

  const { addItem } = useCartStore();

  // React Query: instant from prefetch cache (hover on shop grid warms this).
  // No manual SWR logic needed — QueryClient handles stale/revalidate/GC.
  const { data: product, isLoading: loading } = useProduct(slug);

  const stock = product?.stock_quantity ?? 0;

  const handleAddToCart = async () => {
    if (!product || stock <= 0) return;
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      if (wishlisted) {
        await shopApi.removeFromWishlist(product.id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await shopApi.addToWishlist(product.id);
        setWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  // Share product
  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${product.name} at Taqon Electrico`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  // WhatsApp enquiry
  const whatsappUrl = product
    ? `https://wa.me/263772771036?text=${encodeURIComponent(
        `Hi, I'm interested in the ${product.name} ($${parseFloat(product.price).toFixed(2)}). Could you provide more details?`
      )}`
    : '#';

  // Generate brochure PDF via print
  const handleBrochure = () => {
    if (!product) return;
    const price = parseFloat(product.price).toFixed(2);
    const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price).toFixed(2) : null;
    const specs = product.specifications
      ? typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications
      : {};
    const imageUrl = images[0] || '';

    const brochureHtml = `<!DOCTYPE html>
<html><head><title>${product.name} - Taqon Electrico</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Outfit', sans-serif; color: #1A1A1A; background: #fff; }
  .header { background: linear-gradient(135deg, #F26522, #FF8C42); color: white; padding: 40px; }
  .header h1 { font-family: 'Syne', sans-serif; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.8; }
  .header h2 { font-family: 'Syne', sans-serif; font-size: 28px; margin-top: 8px; }
  .content { padding: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .product-image { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 16px; border: 1px solid #E8E2D9; }
  .product-info h3 { font-family: 'Syne', sans-serif; font-size: 24px; margin-bottom: 8px; }
  .brand { color: #F26522; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
  .price { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 700; color: #F26522; margin: 16px 0; }
  .price .original { font-size: 18px; color: #999; text-decoration: line-through; margin-left: 8px; font-weight: 400; }
  .description { color: #555; line-height: 1.6; margin-bottom: 24px; font-size: 14px; }
  .specs-title { font-family: 'Syne', sans-serif; font-size: 18px; margin: 32px 0 16px; }
  .specs-table { width: 100%; border-collapse: collapse; }
  .specs-table td { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .specs-table td:first-child { color: #888; font-weight: 500; text-transform: capitalize; width: 40%; }
  .footer { background: #1A1A1A; color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; margin-top: 40px; }
  .footer .logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
  .footer .logo span { color: #F26522; }
  .footer .contact { font-size: 13px; color: rgba(255,255,255,0.6); text-align: right; }
  .warranty { display: inline-flex; align-items: center; gap: 8px; background: #FFF7ED; color: #F26522; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
  <div class="header">
    <h1>Taqon Electrico</h1>
    <h2>Product Brochure</h2>
  </div>
  <div class="content">
    <div>${imageUrl ? `<img src="${imageUrl}" class="product-image" />` : '<div class="product-image" style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:14px;">No Image</div>'}</div>
    <div class="product-info">
      ${product.brand ? `<div class="brand">${product.brand.name || product.brand}</div>` : ''}
      <h3>${product.name}</h3>
      <div class="price">$${price}${comparePrice ? `<span class="original">$${comparePrice}</span>` : ''}</div>
      ${product.warranty_period ? `<div class="warranty">&#9989; ${product.warranty_period} Warranty</div>` : ''}
      ${product.description ? `<p class="description">${product.description}</p>` : ''}
    </div>
  </div>
  ${Object.keys(specs).length > 0 ? `
  <div style="padding: 0 40px;">
    <h3 class="specs-title">Technical Specifications</h3>
    <table class="specs-table">
      ${Object.entries(specs).map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ')}</td><td>${v}</td></tr>`).join('')}
    </table>
  </div>` : ''}
  <div class="footer">
    <div class="logo">TAQON <span>ELECTRICO</span></div>
    <div class="contact">
      www.taqon.co.zw<br/>
      +263 77 277 1036<br/>
      Harare, Zimbabwe
    </div>
  </div>
</body></html>`;

    const brochureWindow = window.open('', '_blank');
    if (brochureWindow) {
      brochureWindow.document.write(brochureHtml);
      brochureWindow.document.close();
      setTimeout(() => brochureWindow.print(), 500);
    }
  };

  // Build image gallery from API data
  const images = product
    ? [
        getImageUrl(product.primary_image),
        ...(product.images || []).map(getImageUrl),
      ].filter(Boolean)
    : [];

  // Deduplicate images
  const uniqueImages = [...new Set(images)];

  const specifications = product?.specifications
    ? typeof product.specifications === 'string'
      ? JSON.parse(product.specifications)
      : product.specifications
    : null;

  // Reviews and related from detail API response
  const reviews = product?.reviews || [];
  const relatedProducts = product?.related_products || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-taqon-cream dark:bg-taqon-dark"
    >
      {product && (
        <SEO
          title={product.meta_title || product.name}
          description={product.meta_description || product.short_description || product.description?.slice(0, 160)}
          canonical={`https://www.taqon.co.zw/shop/${product.slug}`}
        />
      )}

      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <ProductSkeleton />
          ) : !product ? (
            <div className="text-center py-20">
              <ImageBroken className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Product Not Found</h2>
              <p className="text-gray-500 dark:text-white/50 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
              >
                Back to Shop
              </Link>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/40 mb-8 flex-wrap">
                <Link to="/shop" className="hover:text-taqon-orange transition-colors">Shop</Link>
                <CaretRight size={14} />
                {product.category && (
                  <>
                    <Link
                      to={`/shop?category=${product.category.slug}`}
                      className="hover:text-taqon-orange transition-colors"
                    >
                      {product.category.name}
                    </Link>
                    <CaretRight size={14} />
                  </>
                )}
                <span className="text-gray-700 dark:text-white/70">{product.name}</span>
              </nav>

              {/* Product Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                {/* Image Gallery */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="relative aspect-square bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-3xl overflow-hidden mb-4">
                    {uniqueImages.length > 0 ? (
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={selectedImage}
                          src={uniqueImages[selectedImage]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-taqon-gray dark:to-taqon-dark flex items-center justify-center">
                        <div className="text-center">
                          <Bag size={64} className="text-taqon-orange/20 mx-auto mb-3" />
                          <span className="text-gray-400 dark:text-white/30 text-sm">No image available</span>
                        </div>
                      </div>
                    )}

                    {product.is_on_sale && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {product.sale_percentage ? `${product.sale_percentage}% OFF` : 'SALE'}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {uniqueImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {uniqueImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedImage === idx
                              ? 'border-taqon-orange shadow-lg shadow-taqon-orange/20'
                              : 'border-warm-200 dark:border-white/10 hover:border-warm-300 dark:hover:border-white/30'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-5"
                >
                  {/* Brand */}
                  {product.brand && (
                    <Link
                      to={`/shop?brand=${product.brand.slug || ''}`}
                      className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-taqon-orange bg-taqon-orange/10 px-3 py-1 rounded-full hover:bg-taqon-orange/20 transition-colors"
                    >
                      {product.brand.name || product.brand}
                    </Link>
                  )}

                  {/* Name */}
                  <h1 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
                    {product.name}
                  </h1>

                  {/* Rating */}
                  {parseFloat(product.average_rating) > 0 && (
                    <div className="flex items-center gap-3">
                      <StarRating rating={product.average_rating} />
                      <span className="text-gray-500 dark:text-white/50 text-sm">
                        ({product.total_reviews || reviews.length} review{(product.total_reviews || reviews.length) !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    {product.is_on_sale && product.compare_at_price && (
                      <>
                        <span className="text-lg text-gray-400 dark:text-white/40 line-through">
                          ${parseFloat(product.compare_at_price).toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                          Save ${(parseFloat(product.compare_at_price) - parseFloat(product.price)).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-gray-600 dark:text-white/60 leading-relaxed">{product.description}</p>
                  )}

                  {/* Stock Status */}
                  <StockBadge stock={stock} />

                  {/* Quantity + Add to Cart */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="flex items-center border border-warm-200 dark:border-white/10 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-4 py-3 text-gray-500 dark:text-white/60 hover:text-taqon-charcoal dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="px-5 py-3 text-taqon-charcoal dark:text-white font-semibold min-w-[3rem] text-center bg-gray-100 dark:bg-white/5">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
                        className="px-4 py-3 text-gray-500 dark:text-white/60 hover:text-taqon-charcoal dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        disabled={quantity >= (stock || 99)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart || stock <= 0}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-taqon-orange text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {addingToCart ? (
                        <CircleNotch size={18} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={18} />
                      )}
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>

                    <button
                      onClick={handleToggleWishlist}
                      className={`p-3.5 rounded-xl border transition-all ${
                        wishlisted
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'border-warm-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:text-taqon-charcoal dark:hover:text-white hover:border-warm-300 dark:hover:border-white/30'
                      }`}
                      title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={20} weight={wishlisted ? 'fill' : 'regular'} />
                    </button>
                  </div>

                  {/* Action Row: WhatsApp, Share, Brochure */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      onClick={(e) => confirmExternalNavigation(whatsappUrl, e)}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all cursor-pointer"
                    >
                      <WhatsappLogo size={18} weight="fill" />
                      Enquire on WhatsApp
                    </a>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
                    >
                      <ShareNetwork size={16} />
                      Share
                    </button>
                    <button
                      onClick={handleBrochure}
                      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
                    >
                      <FilePdf size={16} />
                      Brochure
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-warm-200 dark:border-white/10">
                    {product.warranty_period && (
                      <div className="flex items-center gap-3 text-gray-500 dark:text-white/50 text-sm">
                        <Shield size={18} className="text-taqon-orange flex-shrink-0" />
                        <span>{product.warranty_period} Warranty</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-500 dark:text-white/50 text-sm">
                      <Package size={18} className="text-taqon-orange flex-shrink-0" />
                      <span>Secure Packaging</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 dark:text-white/50 text-sm">
                      <Truck size={18} className="text-taqon-orange flex-shrink-0" />
                      <span>Nationwide Delivery</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tabs: Specifications / Reviews */}
              <div className="mt-16">
                <div className="flex gap-1 border-b border-gray-200 dark:border-white/10 mb-8">
                  {[
                    { key: 'specs', label: 'Specifications' },
                    { key: 'reviews', label: `Reviews (${reviews.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                        activeTab === tab.key
                          ? 'border-taqon-orange text-taqon-orange'
                          : 'border-transparent text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* Specifications Tab */}
                  {activeTab === 'specs' && specifications && Object.keys(specifications).length > 0 && (
                    <motion.div
                      key="specs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full">
                          <tbody>
                            {Object.entries(specifications).map(([key, value], idx) => (
                              <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-white/[0.02]' : ''}>
                                <td className="px-6 py-4 text-gray-500 dark:text-white/50 text-sm font-medium capitalize whitespace-nowrap border-r border-warm-100 dark:border-white/5 w-1/3">
                                  {key.replace(/_/g, ' ')}
                                </td>
                                <td className="px-6 py-4 text-taqon-charcoal dark:text-white text-sm">
                                  {String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'specs' && (!specifications || Object.keys(specifications).length === 0) && (
                    <motion.div
                      key="specs-empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-8 text-center"
                    >
                      <p className="text-gray-500 dark:text-white/50">No specifications available for this product.</p>
                    </motion.div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {reviews.length === 0 ? (
                        <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-8 text-center">
                          <Star size={32} className="text-gray-300 dark:text-white/20 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-white/50">No reviews yet. Be the first to review this product.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review, idx) => (
                            <motion.div
                              key={review.id || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <p className="text-taqon-charcoal dark:text-white font-semibold text-sm">
                                    {review.user?.first_name || 'Customer'}
                                  </p>
                                  <StarRating rating={review.rating} size={14} />
                                </div>
                                {review.created_at && (
                                  <span className="text-gray-400 dark:text-white/30 text-xs flex-shrink-0">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {review.title && (
                                <p className="text-taqon-charcoal dark:text-white font-medium text-sm mb-1">{review.title}</p>
                              )}
                              {review.comment && (
                                <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed">{review.comment}</p>
                              )}
                              {review.is_verified_purchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium mt-2">
                                  <Check size={10} /> Verified Purchase
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-16"
                >
                  <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">Similar Products</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((related) => {
                      const relImg = getImageUrl(related.primary_image);
                      return (
                        <Link
                          key={related.id}
                          to={`/shop/${related.slug}`}
                          className="group bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-taqon-orange/30 transition-all duration-300"
                        >
                          <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-white/5">
                            {relImg ? (
                              <img
                                src={relImg}
                                alt={related.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Bag size={32} className="text-taqon-orange/20" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            {related.brand && (
                              <span className="text-[10px] uppercase tracking-wider text-taqon-orange font-semibold">
                                {related.brand.name || related.brand}
                              </span>
                            )}
                            <h3 className="text-taqon-charcoal dark:text-white font-semibold text-sm mt-1 line-clamp-2 group-hover:text-taqon-orange transition-colors">
                              {related.name}
                            </h3>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-taqon-charcoal dark:text-white font-bold font-syne">
                                ${parseFloat(related.price).toFixed(2)}
                              </span>
                              {related.is_on_sale && related.compare_at_price && (
                                <span className="text-gray-400 dark:text-white/30 text-xs line-through">
                                  ${parseFloat(related.compare_at_price).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </motion.div>
  );
}
