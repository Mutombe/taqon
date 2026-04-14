import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bag } from '@phosphor-icons/react';
import useCartStore from '../stores/cartStore';

/**
 * Floating cart button — only appears on /shop routes when the cart has items.
 * Stacks vertically above the WhatsApp / Tidio floating buttons on the right edge.
 *
 * Stack (bottom up, mobile):
 *   Tidio chat      ~ bottom:20px
 *   WhatsApp        bottom:100px
 *   Floating Cart   bottom:180px
 */
export default function FloatingCart() {
  const { pathname } = useLocation();
  const cartCount = useCartStore((s) => s.totalItems);

  // Only on shop routes (listing + product detail), not on /cart or /checkout
  const onShop = pathname === '/shop' || pathname.startsWith('/shop/');
  const show = onShop && cartCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="floating-cart"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed z-[60] bottom-[180px] right-[20px] md:bottom-[210px] md:right-[24px]"
        >
          <Link
            to="/cart"
            aria-label={`View cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            className="relative flex items-center justify-center w-[56px] h-[56px] rounded-full bg-taqon-orange text-white shadow-[0_4px_14px_rgba(242,101,34,0.45)] hover:bg-taqon-orange/90 transition-colors active:scale-95"
          >
            <Bag size={26} weight="fill" />
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-white text-taqon-orange text-[11px] font-extrabold rounded-full flex items-center justify-center px-1 shadow border border-taqon-orange/20">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
