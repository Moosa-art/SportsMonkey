/**
 * server/lib/upstream.js
 *
 * Thin server-side client for the social442 upstream API. Centralises:
 *  - the upstream base host (env-configurable),
 *  - an AbortController-based request timeout,
 *  - a tiny in-memory TTL cache for GET responses (smooths refresh bursts).
 *
 * Keeping this on the server is what makes the BFF a CORS fix: the browser
 * only ever talks to our own origin (`/api/*`).
 */

const UPSTREAM_BASE = process.env.UPSTREAM_BASE || 'https://www.social442.com';
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS) || 20000;
const CACHE_TTL_MS = Number(process.env.UPSTREAM_CACHE_TTL_MS) || 30000;

const cache = new Map();

export function upstreamUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${UPSTREAM_BASE}${suffix}`;
}

/**
 * Fetch JSON from upstream with a timeout and optional GET caching.
 * @param {string} path Absolute path on the upstream host (e.g. '/api/club-feed-new?club_id=14').
 * @param  method?: string, body?: any, cacheKey?: string  [opts]
 * @returns {Promise<any>}
 */
export async function upstreamFetch(path, { method = 'GET', body, cacheKey } = {}) {
  if (method === 'GET' && cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return hit.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(upstreamUrl(path), {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = new Error(`Upstream responded ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    if (method === 'GET' && cacheKey) {
      cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function clearUpstreamCache() {
  cache.clear();
}
