import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, ShoppingCart, Trash, Package,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { shopApi } from '../../api/shop';
import useCartStore from '../../stores/cartStore';
import SEO from '../../components/SEO';
import { WishlistSkeleton } from '../../components/Skeletons';
import { prefetchProduct } from '../../lib/prefetch';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track per-item action states: 'removing' | 'moving' | null
  const [actionStates, setActionStates] = useState({});
  const { fetchCart } = useCartStore();

  useEffect(() => {
    shopApi.getWishlist()
      .then(({ data }) => setItems(data.results || data || []))
      .catch(() => toast.error('Failed to load wishlist.'))
      .finally(() => setLoading(false));
  }, []);

  const setItemAction = useCallback((pid, action) => {
    setActionStates((prev) => ({ ...prev, [pid]: action }));
  }, []);

  const clearItemAction = useCallback((pid) => {
    setActionStates((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  }, []);

  // Optimistic remove: hide item instantly, rollback on failure
  const handleRemove = useCallback(async (productId, itemSnapshot) => {
    setItemAction(productId, 'removing');

    // Optimistic: remove from list immediately
    setItems((prev) => prev.filter((item) => {
      const pid = item.product?.id || item.id;
      return pid !== productId;
    }));

    try {
      await shopApi.removeFromWishlist(productId);
      toast.success('Removed from wishlist.');
    } catch {
      // Rollback: re-add the item
      setItems((prev) => [...prev, itemSnapshot]);
      toast.error('Failed to remove item.');
    } finally {
      clearItemAction(productId);
    }
  }, [setItemAction, clearItemAction]);

  // Optimistic move to cart: hide item instantly from wishlist
  const handleMoveToCart = useCallback(async (productId, itemSnapshot) => {
    setItemAction(productId, 'moving');

    // Optimistic: remove from wishlist immediately
    setItems((prev) => prev.filter((item) => {
      const pid = item.product?.id || item.id;
      return pid !== productId;
    }));

    try {
      await shopApi.moveToCart(productId);
      toast.success('Moved to cart.');
      // Refresh cart count in header
      fetchCart();
    } catch {
      // Rollback
      setItems((prev) => [...prev, itemSnapshot]);
      toast.error('Failed to move to cart.');
    } finally {
      clearItemAction(productId);
    }
  }, [setItemAction, clearItemAction, fetchCart]);

  return (
    <>
      <SEO title="Wishlist" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/account" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Wishlist</h1>
              <p className="text-sm text-gray-400">{items.length} items</p>
            </div>
          </div>

          {loading ? (
            <WishlistSkeleton count={6} />
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <Heart size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400">Your wishlist is empty</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Browse our shop to find products you love</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-taqon-orange text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg hover:bg-taqon-orange/90 transition-colors"
              >
                <Package size={14} /> Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const product = item.product || item;
                  const pid = product.id;
                  const action = actionStates[pid];

                  return (
                    <motion.div
                      key={pid || i}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 overflow-hidden group"
                    >
                      {/* Thumbnail */}
                      <Link
                        to={`/shop/${product.slug}`}
                        className="block"
                        onMouseEnter={() => prefetchProduct(product.slug)}
                      >
                        <div className="aspect-square bg-gray-50 dark:bg-white/5 overflow-hidden">
                          {product.primary_image ? (
                            <img
                              src={product.primary_image?.image_url || product.primary_image?.image || ''}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-3">
                        <Link to={`/shop/${product.slug}`}>
                          <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white truncate hover:text-taqon-orange transition-colors">
                            {product.title || product.name}
                          </h3>
                        </Link>
                        <p className="text-sm font-bold text-taqon-orange mt-1">
                          ${parseFloat(product.price || product.sale_price || 0).toLocaleString()}
                        </p>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleMoveToCart(pid, item)}
                            disabled={!!action}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-taqon-orange text-taqon-charcoal dark:text-white rounded-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50"
                          >
                            <ShoppingCart size={12} />
                            {action === 'moving' ? 'Moving...' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleRemove(pid, item)}
                            disabled={!!action}
                            className="px-3 py-2 text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
