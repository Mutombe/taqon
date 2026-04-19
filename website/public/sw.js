const CACHE_NAME = 'taqon-v4';
const API_CACHE_NAME = 'taqon-api-v1';
const STATIC_ASSETS = [
  '/',
  '/fav.png',
];

// API paths that are safe to cache (public, GET-only, no auth-sensitive data)
const CACHEABLE_API_PATTERNS = [
  '/api/v1/shop/products/',
  '/api/v1/shop/categories/',
  '/api/v1/shop/brands/',
  '/api/v1/solar-config/packages/',
  '/api/v1/solar-config/families/',
  '/api/v1/solar-config/components/',
  '/api/v1/solar-config/appliances/',
  '/api/v1/courses/',
  '/api/v1/support/faq/',
  '/api/v1/blog/',
];

const API_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function isApiCacheable(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => url.pathname.includes(pattern));
}

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API responses: network-first with cache fallback.
  // On success, cache the response. On failure, serve from cache.
  // This means: first visit = network (normal speed), subsequent visits
  // while offline or slow = instant from cache, and network response
  // updates the cache for next time.
  if (isApiCacheable(url)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          // Clone and cache successful responses
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Network failed — try cache
          const cached = await cache.match(request);
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  // Static assets: cache-first (images, JS, CSS, fonts)
  // Only cache successful (ok) responses — never cache 404s
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|webp|avif)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
