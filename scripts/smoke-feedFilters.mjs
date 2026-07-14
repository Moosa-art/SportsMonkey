/**
 * scripts/smoke-feedFilters.mjs
 *
 * Smoke test for the pure feed view-transform engine (filtering & sorting).
 * Run with:  node scripts/smoke-feedFilters.mjs
 */
import assert from 'node:assert/strict';
import { applyFeedView, parseCreatedAt, toLocalIsoDay, trendingScore } from '../src/lib/feed/feedFilters.js';

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log('  \u2713', name);
  } catch (err) {
    failures += 1;
    console.error('  \u2717', name, '\n   ', err.message);
  }
}

console.log('feedFilters smoke test\n');

const NOW = Date.parse('2026-06-18T12:00:00Z');
const dayMs = 86400000;

// Synthetic, normalized-shaped items.
const items = [
  { dedupeId: 'a', kind: 'news', timestamp: NOW - dayMs, engagement: 5, sourceKey: 'bbc' },
  { dedupeId: 'b', kind: 'video', timestamp: NOW - 2 * dayMs, engagement: 100, sourceKey: 'sky' },
  { dedupeId: 'c', kind: 'glance', timestamp: NOW, engagement: 50, sourceKey: null },
  { dedupeId: 'd', kind: 'news', timestamp: null, engagement: 0, sourceKey: 'bbc' },
];

const favorites = new Set(['a', 'c']);
const following = new Set(['bbc']);

check('Latest preserves original order', () => {
  const out = applyFeedView(items, { tab: 'Latest', favorites, following, nowMs: NOW });
  assert.deepEqual(out.map((i) => i.dedupeId), ['a', 'b', 'c', 'd']);
});

check('Favourite returns only favorited items', () => {
  const out = applyFeedView(items, { tab: 'Favourite', favorites, following, nowMs: NOW });
  assert.deepEqual(new Set(out.map((i) => i.dedupeId)), new Set(['a', 'c']));
});

check('Following returns only items from followed sources', () => {
  const out = applyFeedView(items, { tab: 'Following', favorites, following, nowMs: NOW });
  assert.deepEqual(new Set(out.map((i) => i.dedupeId)), new Set(['a', 'd']));
});

check('Trending sorts by engagement score descending', () => {
  const out = applyFeedView(items, { tab: 'Trending', favorites, following, nowMs: NOW });
  assert.equal(out[0].dedupeId, 'b'); // highest engagement
});

check('Date filter keeps only the selected local day, drops null timestamps', () => {
  const iso = toLocalIsoDay(NOW - dayMs);
  const out = applyFeedView(items, { tab: 'Latest', dateIso: iso, favorites, following, nowMs: NOW });
  assert.deepEqual(out.map((i) => i.dedupeId), ['a']);
});

check('Filter combination (Following + date) intersects correctly', () => {
  const iso = toLocalIsoDay(NOW - dayMs);
  const out = applyFeedView(items, { tab: 'Following', dateIso: iso, favorites, following, nowMs: NOW });
  assert.deepEqual(out.map((i) => i.dedupeId), ['a']);
});

check('does not mutate the input array', () => {
  const before = items.map((i) => i.dedupeId);
  applyFeedView(items, { tab: 'Trending', favorites, following, nowMs: NOW });
  assert.deepEqual(items.map((i) => i.dedupeId), before);
});

check('parseCreatedAt handles absolute and relative formats', () => {
  assert.equal(typeof parseCreatedAt('2026-06-18 08:35:01', NOW), 'number');
  assert.ok(parseCreatedAt('5hr ago', NOW) < NOW);
  assert.equal(parseCreatedAt('', NOW), null);
});

check('trendingScore weights engagement above recency', () => {
  const hi = trendingScore({ engagement: 2, timestamp: NOW - 10 * dayMs });
  const lo = trendingScore({ engagement: 1, timestamp: NOW });
  assert.ok(hi > lo);
});

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
