import { create } from 'zustand';
import { shopApi } from '../api/shop';
import { toast } from 'sonner';

const useCartStore = create((set, get) => ({
  items: [],
  totalItems: 0,
  subtotal: 0,
  totalSavings: 0,
  isLoading: false,
  _hasFetched: false,

  fetchCart: async () => {
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
      // Cart may not exist yet for guests
      set({ _hasFetched: true });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true });
    try {
      await shopApi.addToCart(productId, quantity);
      await get().fetchCart();
      toast.success('Added to cart');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to add to cart';
      toast.error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Optimistic quantity update: UI updates instantly, server syncs in background.
  // On failure, rolls back to previous state.
  updateQuantity: async (itemId, quantity) => {
    const { items, totalItems, subtotal, totalSavings } = get();

    // Compute optimistic state
    const prevItems = items;
    const prevTotalItems = totalItems;
    const prevSubtotal = subtotal;
    const prevSavings = totalSavings;

    const optimisticItems = items.map((item) => {
      if (item.id !== itemId) return item;
      const unitPrice = parseFloat(item.price_at_addition || item.product?.price || 0);
      return {
        ...item,
        quantity,
        line_total: String(unitPrice * quantity),
      };
    });

    const newSubtotal = optimisticItems.reduce(
      (sum, item) => sum + parseFloat(item.line_total || 0),
      0,
    );
    const newTotalItems = optimisticItems.reduce((sum, item) => sum + item.quantity, 0);

    // Apply optimistically
    set({
      items: optimisticItems,
      totalItems: newTotalItems,
      subtotal: newSubtotal,
    });

    try {
      await shopApi.updateCartItem(itemId, quantity);
      // Silently sync true server state in background
      get().fetchCart();
    } catch (error) {
      // Rollback
      set({
        items: prevItems,
        totalItems: prevTotalItems,
        subtotal: prevSubtotal,
        totalSavings: prevSavings,
      });
      const msg = error.response?.data?.error || 'Failed to update quantity';
      toast.error(msg);
    }
  },

  // Optimistic remove: item disappears instantly.
  removeItem: async (itemId) => {
    const { items, totalItems, subtotal, totalSavings } = get();
    const prevItems = items;
    const prevTotalItems = totalItems;
    const prevSubtotal = subtotal;
    const prevSavings = totalSavings;

    // Optimistic removal
    const optimisticItems = items.filter((item) => item.id !== itemId);
    const newSubtotal = optimisticItems.reduce(
      (sum, item) => sum + parseFloat(item.line_total || 0),
      0,
    );
    const newTotalItems = optimisticItems.reduce((sum, item) => sum + item.quantity, 0);

    set({
      items: optimisticItems,
      totalItems: newTotalItems,
      subtotal: newSubtotal,
    });

    try {
      await shopApi.removeCartItem(itemId);
      toast.success('Removed from cart');
      // Sync true state
      get().fetchCart();
    } catch {
      // Rollback
      set({
        items: prevItems,
        totalItems: prevTotalItems,
        subtotal: prevSubtotal,
        totalSavings: prevSavings,
      });
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    const prev = { ...get() };
    // Optimistic clear
    set({ items: [], totalItems: 0, subtotal: 0, totalSavings: 0 });
    try {
      await shopApi.clearCart();
    } catch {
      // Rollback
      set({
        items: prev.items,
        totalItems: prev.totalItems,
        subtotal: prev.subtotal,
        totalSavings: prev.totalSavings,
      });
      toast.error('Failed to clear cart');
    }
  },

  mergeCart: async () => {
    try {
      await shopApi.mergeCart();
      await get().fetchCart();
    } catch {
      // Merge failures are non-critical
    }
  },
}));

export default useCartStore;
