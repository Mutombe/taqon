import { shopApi } from '../api/shop';
import { apiCache } from './apiCache';

/**
 * Prefetch a product detail into the cache.
 * Call on mouseenter/focus of product links so the detail page loads instantly.
 * No-ops if already cached. Non-blocking, fire-and-forget.
 */
export function prefetchProduct(slug) {
  if (!slug) return;
  const cached = apiCache.get('getProduct', [slug]);
  if (cached) return; // Already in cache

  shopApi
    .getProduct(slug)
    .then(({ data }) => {
      apiCache.set('getProduct', [slug], data);
    })
    .catch(() => {
      // Prefetch failure is silent and non-critical
    });
}

/**
 * Prefetch categories and brands for the shop filter sidebar.
 * Call early (e.g., on homepage mount or shop link hover).
 */
export function prefetchShopFilters() {
  if (!apiCache.get('getCategories', [])) {
    shopApi
      .getCategories()
      .then(({ data }) => apiCache.set('getCategories', [], data))
      .catch(() => {});
  }
  if (!apiCache.get('getBrands', [])) {
    shopApi
      .getBrands()
      .then(({ data }) => apiCache.set('getBrands', [], data))
      .catch(() => {});
  }
}
