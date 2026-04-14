import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  Bag,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import useCartStore from '../../stores/cartStore';
import { CartPageSkeleton } from '../../components/Skeletons';

export default function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    totalSavings,
    _hasFetched,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // With optimistic updates the store mutates instantly.
  // No need for local removingIds/updatingIds -- removal is instant.
  const handleUpdateQuantity = (itemId, newQty) => {
    if (newQty < 1) return;
    updateQuantity(itemId, newQty);
  };

  const handleRemoveItem = (itemId) => {
    removeItem(itemId);
  };

  const handleClearCart = async () => {
    await clearCart();
    setShowClearConfirm(false);
  };

  const deliveryFee = subtotal > 0 ? 15.0 : 0;
  const total = subtotal + deliveryFee;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-taqon-cream dark:bg-taqon-dark"
    >
      {/* Dark hero strip — gives nav links contrast on light theme */}
      <div className="relative bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-20"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-taqon-dark/90 via-taqon-dark/70 to-taqon-dark/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-8 lg:pt-36 lg:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Your Cart
            </span>
            <h1 className="mt-2 text-3xl lg:text-4xl font-bold font-syne text-white">
              Shopping Cart
              {totalItems > 0 && (
                <span className="text-white/50 text-xl font-normal ml-3">
                  ({totalItems} item{totalItems !== 1 ? 's' : ''})
                </span>
              )}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Cart Content */}
      <section className="pt-8 lg:pt-12 pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4">
          {!_hasFetched ? (
            /* Skeleton loading state */
            <CartPageSkeleton />
          ) : items.length === 0 ? (
            /* Empty cart */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bag size={40} className="text-gray-300 dark:text-white/20" />
              </div>
              <h2 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 dark:text-white/50 mb-8 max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. Browse our solar equipment and find the perfect products for your needs.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all active:scale-[0.98]"
              >
                <ShoppingCart size={18} />
                Continue Shopping
              </Link>
            </motion.div>
          ) : (
            /* Cart with items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Header row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-gray-400 dark:text-white/40 text-xs uppercase tracking-wider font-medium">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const product = item.product || {};
                    const unitPrice = parseFloat(item.price_at_addition || product.price || 0);
                    const lineTotal = parseFloat(item.line_total || unitPrice * item.quantity);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Product info */}
                          <div className="md:col-span-6 flex items-center gap-4">
                            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-warm-100 dark:border-white/5">
                              {(product.primary_image?.image_url || product.primary_image?.image) ? (
                                <img
                                  src={product.primary_image?.image_url || product.primary_image?.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <img src="/fav.png" alt="Taqon" className="w-8 h-8 opacity-30" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/shop/${product.slug}`}
                                className="text-taqon-charcoal dark:text-white font-semibold text-sm hover:text-taqon-orange transition-colors line-clamp-2"
                              >
                                {product.name}
                              </Link>
                              {product.sku && (
                                <p className="text-gray-400 dark:text-white/30 text-xs mt-1">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>

                          {/* Unit price */}
                          <div className="md:col-span-2 text-center">
                            <span className="md:hidden text-gray-400 dark:text-white/40 text-xs mr-2">Price:</span>
                            <span className="text-gray-700 dark:text-white/70 text-sm font-medium">
                              ${unitPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Quantity controls */}
                          <div className="md:col-span-2 flex items-center justify-center">
                            <div className="flex items-center border border-warm-200 dark:border-white/10 rounded-lg overflow-hidden">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="px-3 py-2 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 py-2 text-taqon-charcoal dark:text-white text-sm font-semibold min-w-[2.5rem] text-center bg-gray-100 dark:bg-white/5">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-2 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Line total + remove */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                            <span className="text-taqon-charcoal dark:text-white font-bold font-syne">
                              ${lineTotal.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-gray-400 dark:text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                              title="Remove item"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Cart actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-taqon-orange transition-colors text-sm font-medium"
                  >
                    <ArrowLeft size={16} />
                    Continue Shopping
                  </Link>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="inline-flex items-center gap-2 text-gray-400 dark:text-white/40 hover:text-red-400 transition-colors text-sm font-medium"
                  >
                    <Trash size={16} />
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Cart Summary Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-sm sticky top-32"
                >
                  <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white mb-5">Order Summary</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-white/60">
                      <span>Subtotal ({totalItems} items)</span>
                      <span className="text-taqon-charcoal dark:text-white font-medium">${subtotal.toFixed(2)}</span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Savings</span>
                        <span className="font-medium">-${totalSavings.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600 dark:text-white/60">
                      <span>Delivery</span>
                      <span className="text-taqon-charcoal dark:text-white font-medium">
                        ${deliveryFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-warm-200 dark:border-white/10 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-taqon-charcoal dark:text-white font-semibold">Total</span>
                        <span className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className={`mt-6 w-full inline-flex items-center justify-center gap-2 bg-taqon-orange text-white py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all active:scale-[0.98] ${
                      items.length === 0 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    Proceed to Checkout
                    <ArrowRight size={18} />
                  </Link>

                  <div className="mt-4 flex items-start gap-2 text-gray-400 dark:text-white/30 text-xs">
                    <WarningCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Tax and final delivery fees calculated at checkout.</span>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-taqon-charcoal border border-warm-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">Clear Cart</h3>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-gray-400 dark:text-white/30 hover:text-taqon-charcoal dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-500 dark:text-white/50 text-sm mb-6">
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-warm-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-semibold"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
