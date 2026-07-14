/**
 * scripts/smoke-normalizeFeed.mjs
 *
 * Lightweight smoke test for the feed normalizer. Runs the bundled production
 * sample through normalizeFeed and asserts the item kinds and basic invariants.
 * Run with:  node scripts/smoke-normalizeFeed.mjs
 */
import assert from 'node:assert/strict';
import { normalizeFeed } from '../src/lib/feed/normalizeFeed.js';
import { clubFeedSample } from '../src/lib/feed/clubFeedSample.js';

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

console.log('normalizeFeed smoke test\n');

const result = normalizeFeed(clubFeedSample, { page: 0 });

check('returns a result object', () => {
  assert.ok(result && typeof result === 'object');
});

check('status is true', () => {
  assert.equal(result.status, true);
});

check('produces a non-empty items array', () => {
  assert.ok(Array.isArray(result.items));
  assert.ok(result.items.length > 0);
});

const kinds = new Set(result.items.map((i) => i.kind));
check('every item has a known kind', () => {
  const allowed = new Set(['news', 'video', 'fixtures', 'glance']);
  for (const i of result.items) assert.ok(allowed.has(i.kind), `bad kind: ${i.kind}`);
});

check('contains news, video, fixtures and glance kinds', () => {
  for (const k of ['news', 'video', 'fixtures', 'glance']) {
    assert.ok(kinds.has(k), `missing kind: ${k}`);
  }
});

check('every item has a unique dedupeId', () => {
  const ids = result.items.map((i) => i.dedupeId);
  assert.equal(new Set(ids).size, ids.length, 'duplicate dedupeId found');
});

check('glance groups always contain at least one tile', () => {
  for (const g of result.items.filter((i) => i.kind === 'glance')) {
    assert.ok(Array.isArray(g.tiles) && g.tiles.length > 0);
  }
});

check('video items resolve an absolute url', () => {
  for (const v of result.items.filter((i) => i.kind === 'video')) {
    assert.match(v.url, /^https?:\/\//, `unresolved video url: ${v.url}`);
  }
});

check('offsets cursor is carried through', () => {
  assert.ok(result.offsets && typeof result.offsets === 'object');
});

check('global club context is carried through', () => {
  assert.ok(result.global && result.global.clubTitle);
});

check('exposes rawCount (drives end-of-feed detection)', () => {
  assert.equal(typeof result.rawCount, 'number');
  assert.ok(result.rawCount > 0);
});

check('every item carries timestamp (ms|null), engagement and dedupeId', () => {
  for (const i of result.items) {
    assert.ok(i.timestamp === null || typeof i.timestamp === 'number', `bad timestamp on ${i.kind}`);
    assert.equal(typeof i.engagement, 'number', `missing engagement on ${i.kind}`);
    assert.ok(typeof i.dedupeId === 'string' && i.dedupeId.length > 0);
  }
});

console.log(
  `\nitems=${result.items.length} kinds=[${[...kinds].join(', ')}]`,
);
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
