/**
 * src/hooks/useClubFeed.js
 *
 * Owns all club-feed data state: initial load, cursor-based pagination, refresh
 * (pull-to-refresh), error/retry, in-flight de-duplication, and abort-on-unmount.
 *
 * PAGINATION MODEL (root-cause fix):
 * The upstream `club-feed-new` endpoint paginates via the `offsets` object it
 * returns — per-type counters plus `news_seen_ids` / `viewed_video_ids` /
 * `seen_club_post`. We POST that cursor back to fetch the next batch. Two bugs
 * caused the feed to "end" early before:
 *   1. End-of-feed was declared whenever a page produced zero NEW items after
 *      client dedupe — even though the upstream had more to give.
 *   2. The cursor was overwritten per page instead of being accumulated, so the
 *      "seen" id arrays never grew and the upstream could replay page 1.
 * Both are fixed: we now merge cursors (mergeOffsets), treat an empty UPSTREAM
 * `feed` (rawCount === 0) as the real end, and only stop on repeated empty
 * pages as a safety guard, bounded by MAX_FEED_PAGES.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { normalizeFeed, mergeOffsets } from '../lib/feed/normalizeFeed';
import { clubFeedSample } from '../lib/feed/clubFeedSample';
import { CLUB_ID, MAX_FEED_PAGES, MAX_CONSECUTIVE_EMPTY_PAGES } from '../lib/feed/feedConfig';

/**
 * Resolve the stable engagement id for a feed item. News/video items are real,
 * individually-addressable upstream posts whose likes/comments/shares we persist
 * by id. Aggregated cards (fixtures / glance tiles) are not individual posts, so
 * they have no persisted engagement and stay optimistic-local.
 */
function engagementIdOf(item) {
  if (!item) return null;
  if (item.kind === 'news') return item.article?.id != null ? String(item.article.id) : null;
  if (item.kind === 'video') return item.id != null ? String(item.id) : null;
  return null;
}

/**
 * Enrich a batch of freshly-normalized items with their persisted engagement
 * (like/comment/share counts + the viewer's liked state) so the cards render
 * dynamic counts and a like survives a refresh. Non-blocking: if the request
 * fails the feed still renders, just without seeded counts.
 */
async function enrichEngagement(list, signal) {
  try {
    const idByItem = new Map();
    for (const it of list) {
      const eid = engagementIdOf(it);
      if (eid) idByItem.set(it, eid);
    }
    const ids = [...new Set([...idByItem.values()])];
    if (ids.length === 0) return list;
    const { items: eng } = await api.getClubEngagement(ids, { signal });
    if (!eng) return list;
    return list.map((it) => {
      const eid = idByItem.get(it);
      return eid && eng[eid] ? { ...it, eng: eng[eid] } : it;
    });
  } catch {
    return list;
  }
}

/**
 * @param 151 [opts]
 */
export function useClubFeed({ clubIds = [CLUB_ID], useSampleFallback = true } = {}) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [global, setGlobal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const offsetsRef = useRef(null);
  const seenRef = useRef(new Set());
  const pageRef = useRef(0);
  const emptyStreakRef = useRef(0);
  const abortRef = useRef(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const lastKindsRef = useRef([]);

  const resetCursor = () => { offsetsRef.current = {}; seenRef.current = new Set(); pageRef.current = 0; emptyStreakRef.current = 0; lastKindsRef.current = []; };

  // Merge a normalized payload into local state, returning the items not yet
  // seen this session and the raw upstream count for end-of-feed detection.
  const ingest = useCallback((payloadsData, page) => {
    let rawFresh = [];
    let totalRawCount = 0;
    let newGlobal = null;

    payloadsData.forEach(({ payload, clubId }) => {
      if (!payload) return;
      const norm = normalizeFeed(payload, { page });
      if (!offsetsRef.current) offsetsRef.current = {};
      offsetsRef.current[clubId] = mergeOffsets(offsetsRef.current[clubId] || null, norm.offsets);
      if (norm.global && !newGlobal) newGlobal = norm.global;
      const fresh = norm.items.filter((it) => !seenRef.current.has(it.dedupeId));
      fresh.forEach((it) => seenRef.current.add(it.dedupeId));
      rawFresh.push(...fresh);
      totalRawCount += norm.rawCount;
    });

    rawFresh.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Map a buried glance tile into a full standalone feed item so the rich
    // content (ratings, top scorers, votes, tables, free bets, news) is
    // surfaced across the timeline instead of hidden inside glance groups.
    const tileToItem = (tile, gid) => {
      const base = {
        dedupeId: `${gid}:${tile.key}`,
        timestamp: tile.timestamp || tile.article?.timestamp || Date.now(),
        engagement: Number(tile.engagement) || Number(tile.comments) || 0,
      };
      switch (tile.tileType) {
        case 'news':
          if (!tile.article) return null;
          return { ...base, kind: 'news', article: tile.article, layout: 'simple_news',
            timestamp: tile.article.timestamp || base.timestamp, sourceKey: 'news' };
        case 'playerRatings':
          return { ...tile, ...base, kind: 'ratings', varietyKey: 'ratings' };
        case 'topScorers':
          return { ...tile, ...base, kind: 'topScorers', varietyKey: 'topScorers' };
        case 'vote':
          return { ...tile, ...base, kind: 'interactive', varietyKey: 'interactive' };
        case 'leagueTable':
          return { ...tile, ...base, kind: 'leagueTable', varietyKey: 'leagueTable' };
        case 'promo':
          if (tile.promoType === 'freebet') return { ...tile, ...base, kind: 'freebet', varietyKey: 'freebet' };
          return null; // other promos are bare CTAs — skip standalone
        case 'generic':
          return {
            ...base,
            kind: 'special',
            postType: tile.rawType,
            rawData: tile.data || {},
            source: tile.source || 'Social442',
            sourceImg: tile.sourceImg || null,
            createdAt: tile.createdAt || null,
            timestamp: tile.timestamp || base.timestamp,
            varietyKey: tile.rawType || 'special',
          };
        default:
          return null; // story pointers (highlights/live) have no standalone data
      }
    };

    // Split raw items: keep the FIRST glance group as an occasional "Match Hub",
    // and EXPLODE every other glance group's tiles into standalone posts.
    let hubUsed = false;
    const expanded = [];
    rawFresh.forEach((item) => {
      if (item.kind === 'glance') {
        if (!hubUsed && (item.tiles || []).length) {
          hubUsed = true;
          expanded.push({ ...item, tiles: item.tiles.slice(0, 6), varietyKey: 'glance' });
        } else {
          (item.tiles || []).forEach((t) => {
            const mapped = tileToItem(t, item.dedupeId);
            if (mapped) expanded.push(mapped);
          });
        }
      } else {
        // Tag a variety key for spacing (special standalone types).
        const vk =
          item.kind === 'news' || item.kind === 'video'
            ? item.kind
            : item.kind === 'special'
              ? item.postType || 'special'
              : item.kind;
        expanded.push({ ...item, varietyKey: vk });
      }
    });

    // De-dupe again (exploded tiles may collide across pages).
    const pool = expanded.filter((it) => {
      if (seenRef.current.has(it.dedupeId)) return it.kind === 'glance' || it.kind === 'news' || it.kind === 'video';
      seenRef.current.add(it.dedupeId);
      return true;
    });

    // ── Variety sequencer ──
    // Rules (tracked via lastKindsRef history across pages):
    //  - news: never more than 2 in a row
    //  - video: never 2 in a row
    //  - glance hub: >= 8 items gap
    //  - any special subtype: >= 4 items gap (never back-to-back)
    // We PREFER specials/glance when valid so variety is spread out, and never
    // drop items — a forced pick keeps everything visible.
    const keyOf = (it) => {
      if (it.kind === 'news' || it.kind === 'video' || it.kind === 'glance') return it.kind;
      return it.varietyKey || it.kind;
    };
    const valid = (it, h) => {
      const k = it.kind;
      if (k === 'news') return !(h.length >= 2 && h[h.length - 1] === 'news' && h[h.length - 2] === 'news');
      if (k === 'video') return !(h.length >= 1 && h[h.length - 1] === 'video');
      if (k === 'glance') return !h.slice(-8).includes('glance');
      return !h.slice(-4).includes(keyOf(it));
    };
    const isCommon = (it) => it.kind === 'news' || it.kind === 'video';

    const out = [];
    const hist = lastKindsRef.current;
    const work = [...pool];
    while (work.length) {
      // 1) variety first: a valid special/glance
      let idx = work.findIndex((it) => !isCommon(it) && valid(it, hist));
      // 2) else a valid common (news/video)
      if (idx === -1) idx = work.findIndex((it) => isCommon(it) && valid(it, hist));
      // 3) else any valid item
      if (idx === -1) idx = work.findIndex((it) => valid(it, hist));
      // 4) forced: prefer a common so we never force a glance/special cluster
      if (idx === -1) idx = work.findIndex((it) => isCommon(it));
      if (idx === -1) idx = 0;
      const picked = work.splice(idx, 1)[0];
      out.push(picked);
      hist.push(keyOf(picked));
      if (hist.length > 40) hist.shift();
    }

    if (newGlobal) setGlobal(newGlobal);
    return { fresh: out, rawCount: totalRawCount };
  }, []);

  const load = useCallback(
    async (mode) => {
      // Cancel any prior in-flight initial/refresh request; "more" guards itself
      // via inFlightRef so we never abort a page mid-flight.
      if (mode !== 'more' && abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      if (mode !== 'more') abortRef.current = ctrl;

      try {
        if (mode === 'refresh') setRefreshing(true);

        const page = mode === 'more' ? pageRef.current + 1 : 0;
        const promises = (clubIds || []).map(async (cid) => {
          try {
            const res = await api.getClubFeed({
              clubId: cid,
              offsets: mode === 'more' ? (offsetsRef.current ? offsetsRef.current[cid] : null) : null,
              signal: ctrl.signal,
            });
            return { payload: res, clubId: cid, error: null };
          } catch (e) {
            return { payload: null, clubId: cid, error: e };
          }
        });
        const payloadsData = await Promise.all(promises);
        
        // If all requests failed, throw the first error so the fallback can handle it
        if (payloadsData.length > 0 && payloadsData.every(p => p.error)) {
          throw payloadsData[0].error;
        }

        if (!mountedRef.current) return;
        if (mode !== 'more') resetCursor();

        const { fresh, rawCount } = ingest(payloadsData, page);
        pageRef.current = page;
        setUsingFallback(false);

        // Seed persisted engagement (counts + viewer liked state) before paint.
        const enriched = await enrichEngagement(fresh, ctrl.signal);
        if (!mountedRef.current) return;

        if (mode === 'more') {
          if (enriched.length > 0) {
            setItems((prev) => [...prev, ...enriched]);
          }
          // Real end-of-feed: upstream returned nothing. Otherwise tolerate a
          // few all-duplicate pages before giving up (cursor catch-up), and
          // always respect the hard page cap.
          if (rawCount === 0) {
            setHasMore(false);
          } else if (fresh.length === 0) {
            emptyStreakRef.current += 1;
            if (emptyStreakRef.current >= MAX_CONSECUTIVE_EMPTY_PAGES) setHasMore(false);
          } else {
            emptyStreakRef.current = 0;
          }
          if (pageRef.current >= MAX_FEED_PAGES) setHasMore(false);
        } else {
          setItems(enriched);
          setHasMore(rawCount > 0);
        }
        setError(null);
        setStatus('ready');
      } catch (err) {
        if (ctrl.signal.aborted || !mountedRef.current) return;

        if (mode === 'more') {
          setError(err); // keep what we have; sentinel offers retry
        } else if (useSampleFallback) {
          // Network/BFF unreachable on first paint — render bundled sample so
          // the UI is never blank, flagged with a non-blocking notice.
          resetCursor();
          const { fresh } = ingest([{ payload: clubFeedSample, clubId: clubIds[0] }], 0);
          setItems(fresh);
          setUsingFallback(true);
          setHasMore(false);
          setStatus('ready');
          setError(err);
        } else {
          setStatus('error');
          setError(err);
        }
      } finally {
        if (mountedRef.current) {
          if (mode === 'refresh') setRefreshing(false);
          if (mode === 'more') {
            setLoadingMore(false);
            inFlightRef.current = false;
          }
        }
      }
    },
    [(clubIds || []).join(','), ingest, useSampleFallback],
  );

  useEffect(() => {
    mountedRef.current = true;
    // Fetch on mount. This is a data-synchronisation effect (fetch on first
    // paint); `status` already starts at 'loading' and load() only setStates
    // after the awaited request resolves, so there is no synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('initial');
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMore || status !== 'ready') return;
    inFlightRef.current = true;
    setLoadingMore(true);
    load('more');
  }, [hasMore, status, load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const retry = useCallback(() => {
    // User-initiated (not in an effect) so a synchronous reset is safe here.
    setStatus('loading');
    setError(null);
    load('initial');
  }, [load]);

  return {
    items,
    status,
    error,
    loadingMore,
    hasMore,
    global,
    refreshing,
    usingFallback,
    loadMore,
    refresh,
    retry,
  };
}

export default useClubFeed;
