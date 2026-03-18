/**
 * In-memory API cache with stale-while-revalidate pattern.
 *
 * - Entries younger than `staleTime` (default 30s) are served instantly.
 * - Entries between `staleTime` and `maxAge` (default 5min) are served
 *   instantly AND a background refetch is fired.
 * - Entries older than `maxAge` are evicted.
 *
 * Zero-dependency, framework-agnostic Map cache.
 */

const DEFAULT_STALE_TIME = 30_000; // 30 seconds
const DEFAULT_MAX_AGE = 5 * 60_000; // 5 minutes

class ApiCache {
  constructor() {
    /** @type {Map<string, {data: any, timestamp: number}>} */
    this._cache = new Map();
    /** @type {Map<string, Set<() => void>>} */
    this._subscribers = new Map();
    /** @type {Map<string, Promise<any>>} */
    this._inflight = new Map();
  }

  /**
   * Build a deterministic cache key.
   */
  _key(name, args) {
    try {
      return `${name}::${JSON.stringify(args)}`;
    } catch {
      return `${name}::${String(args)}`;
    }
  }

  /**
   * Get cached data if still valid.
   * Returns { data, isStale } or null.
   */
  get(name, args, { staleTime = DEFAULT_STALE_TIME, maxAge = DEFAULT_MAX_AGE } = {}) {
    const key = this._key(name, args);
    const entry = this._cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      this._cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      isStale: age > staleTime,
    };
  }

  /**
   * Store data in cache.
   */
  set(name, args, data) {
    const key = this._key(name, args);
    this._cache.set(key, { data, timestamp: Date.now() });
    const subs = this._subscribers.get(key);
    if (subs) subs.forEach((cb) => cb());
  }

  /**
   * Subscribe to cache updates for a key.
   * Returns unsubscribe function.
   */
  subscribe(name, args, callback) {
    const key = this._key(name, args);
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);
    return () => {
      const subs = this._subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) this._subscribers.delete(key);
      }
    };
  }

  /**
   * Invalidate a specific entry.
   */
  invalidate(name, args) {
    const key = this._key(name, args);
    this._cache.delete(key);
  }

  /**
   * Invalidate all entries whose key starts with prefix.
   */
  invalidatePrefix(prefix) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(prefix)) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Stale-while-revalidate fetch wrapper.
   * Deduplicates in-flight requests to the same key.
   *
   * @param {string} name
   * @param {any[]} args
   * @param {() => Promise<any>} fetcher
   * @param {object} opts
   * @returns {{ data: any|null, promise: Promise<any>, fromCache: boolean }}
   */
  swr(name, args, fetcher, opts = {}) {
    const key = this._key(name, args);
    const cached = this.get(name, args, opts);

    if (cached && !cached.isStale) {
      return {
        data: cached.data,
        promise: Promise.resolve(cached.data),
        fromCache: true,
      };
    }

    // Deduplicate: if there's already an in-flight request for this key, reuse it
    let promise = this._inflight.get(key);
    if (!promise) {
      promise = fetcher()
        .then((result) => {
          this.set(name, args, result);
          return result;
        })
        .finally(() => {
          this._inflight.delete(key);
        });
      this._inflight.set(key, promise);
    }

    if (cached && cached.isStale) {
      return {
        data: cached.data,
        promise,
        fromCache: true,
      };
    }

    return {
      data: null,
      promise,
      fromCache: false,
    };
  }
}

// Singleton
export const apiCache = new ApiCache();
