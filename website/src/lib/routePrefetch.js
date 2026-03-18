/**
 * Route-level JS chunk prefetcher.
 *
 * Preloads lazy-loaded route modules on hover/focus so that when the user
 * clicks, the chunk is already in the browser cache and renders instantly.
 * Vite deduplicates dynamic imports, so calling a loader twice is a no-op.
 */

const routeModules = {
  '/about': () => import('../pages/About'),
  '/solutions': () => import('../pages/Solutions'),
  '/shop': () => import('../pages/Shop'),
  '/projects': () => import('../pages/Projects'),
  '/contact': () => import('../pages/Contact'),
  '/packages': () => import('../pages/Packages'),
  '/careers': () => import('../pages/Careers'),
  '/solar-secrets': () => import('../pages/SolarSecrets'),
  '/blog': () => import('../pages/Blog'),
  '/courses': () => import('../features/courses/CourseCatalog'),
  '/faq': () => import('../features/support/FAQPage'),
  '/calculator': () => import('../pages/SavingsCalculator'),
};

const prefetchedRoutes = new Set();

/**
 * Prefetch a route's JS chunk. Call on mouseenter/focus of nav links.
 * Strips query strings and hashes before matching.
 * Fire-and-forget — errors are silently ignored.
 */
export function prefetchRoute(path) {
  const base = path.split('?')[0].split('#')[0];
  if (prefetchedRoutes.has(base)) return;
  const loader = routeModules[base];
  if (loader) {
    prefetchedRoutes.add(base);
    loader();
  }
}
