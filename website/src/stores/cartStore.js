import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shopApi } from '../api/shop';
import { toast } from 'sonner';

// ── helpers ──

function isAuthenticated() {
  const tokens = JSON.parse(localStorage.getItem('taqon-tokens') || 'null');
  return !!tokens?.access;
}

function recalcTotals(items) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + parseFloat(i.line_total || 0), 0);
  return { items, totalItems, subtotal };
}

let _nextLocalId = Date.now();

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      totalSavings: 0,
      isLoading: false,
      _hasFetched: false,

      // ── Fetch cart ──
      // Authenticated: from server. Guest: already in store via persist.
      fetchCart: async () => {
        if (!isAuthenticated()) {
          set({ _hasFetched: true });
          return;
        }
        try {
          const { data } = await shopApi.getCart();
          set({
            items: data.items || [],
            totalItems: data.total_items || 0,
            subtotal: parseFloat(data.subtotal) || 0,
            totalSavings: parseFloat(data.total_savings) || 0,
            _hasFetched: true,
          });
        } catch {
          set({ _hasFetched: true });
        }
      },

      // ── Add item ──
      // `product` is the full product object from the listing/detail page.
      addItem: async (productId, quantity = 1, product = null) => {
        if (isAuthenticated()) {
          set({ isLoading: true });
          try {
            await shopApi.addToCart(productId, quantity);
            await get().fetchCart();
            toast.success('Added to cart');
          } catch (error) {
            const msg = error.response?.data?.detail || error.response?.data?.error || 'Failed to add to cart';
            toast.error(msg);
          } finally {
            set({ isLoading: false });
          }
          return;
        }

        // Guest: local cart
        if (!product) {
          toast.error('Could not add to cart — please try again.');
          return;
        }

        const { items } = get();
        const existing = items.find((i) => (i.product?.id || i.product_id) === productId);
        let updated;

        if (existing) {
          const newQty = existing.quantity + quantity;
          const unitPrice = parseFloat(existing.price_at_addition || product.price || 0);
          updated = items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: newQty, line_total: String(unitPrice * newQty) }
              : i,
          );
        } else {
          const unitPrice = parseFloat(product.price || 0);
          const newItem = {
            id: `local-${_nextLocalId++}`,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              primary_image: product.primary_image || null,
              sku: product.sku || null,
            },
            product_id: productId,
            price_at_addition: String(unitPrice),
            quantity,
            line_total: String(unitPrice * quantity),
          };
          updated = [...items, newItem];
        }

        set({ ...recalcTotals(updated), _hasFetched: true });
        toast.success('Added to cart');
      },

      // ── Update quantity ──
      updateQuantity: async (itemId, quantity) => {
        const { items } = get();
        const prev = { items, totalItems: get().totalItems, subtotal: get().subtotal, totalSavings: get().totalSavings };

        // Optimistic update (works for both local and server items)
        const optimistic = items.map((item) => {
          if (item.id !== itemId) return item;
          const unitPrice = parseFloat(item.price_at_addition || item.product?.price || 0);
          return { ...item, quantity, line_total: String(unitPrice * quantity) };
        });
        set(recalcTotals(optimistic));

        // If local item, we're done
        if (String(itemId).startsWith('local-')) return;

        // Server sync
        if (isAuthenticated()) {
          try {
            await shopApi.updateCartItem(itemId, quantity);
            get().fetchCart();
          } catch {
            set(prev);
            toast.error('Failed to update quantity');
          }
        }
      },

      // ── Remove item ──
      removeItem: async (itemId) => {
        const { items } = get();
        const prev = { items, totalItems: get().totalItems, subtotal: get().subtotal, totalSavings: get().totalSavings };

        // Optimistic removal
        const filtered = items.filter((i) => i.id !== itemId);
        set(recalcTotals(filtered));

        // If local item, we're done
        if (String(itemId).startsWith('local-')) {
          toast.success('Removed from cart');
          return;
        }

        if (isAuthenticated()) {
          try {
            await shopApi.removeCartItem(itemId);
            toast.success('Removed from cart');
            get().fetchCart();
          } catch {
            set(prev);
            toast.error('Failed to remove item');
          }
        }
      },

      // ── Clear cart ──
      clearCart: async () => {
        const prev = { items: get().items, totalItems: get().totalItems, subtotal: get().subtotal, totalSavings: get().totalSavings };
        set({ items: [], totalItems: 0, subtotal: 0, totalSavings: 0 });

        if (isAuthenticated()) {
          try {
            await shopApi.clearCart();
          } catch {
            set(prev);
            toast.error('Failed to clear cart');
          }
        }
      },

      // ── Merge local cart to server on login ──
      mergeLocalToServer: async () => {
        const { items } = get();
        const localItems = items.filter((i) => String(i.id).startsWith('local-'));

        if (localItems.length === 0) {
          await get().fetchCart();
          return;
        }

        // Add each local item to the server cart
        for (const item of localItems) {
          try {
            await shopApi.addToCart(item.product?.id || item.product_id, item.quantity);
          } catch {
            // Skip items that fail (e.g. out of stock)
          }
        }

        // Fetch the authoritative server cart
        await get().fetchCart();
      },
    }),
    {
      name: 'taqon-cart',
      partialize: (state) => ({
        // Only persist local guest items — server items are fetched fresh
        items: state.items.filter((i) => String(i.id).startsWith('local-')),
        totalItems: state.items.filter((i) => String(i.id).startsWith('local-')).reduce((s, i) => s + i.quantity, 0),
        subtotal: state.items.filter((i) => String(i.id).startsWith('local-')).reduce((s, i) => s + parseFloat(i.line_total || 0), 0),
        totalSavings: 0,
      }),
    },
  ),
);

export default useCartStore;
