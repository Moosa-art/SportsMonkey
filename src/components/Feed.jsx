import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ClubFeedRenderer from './feed/ClubFeedRenderer';
import ReelPlayer from './feed/ReelPlayer';
import { useClubFeed } from '../hooks/useClubFeed';
import { applyFeedView } from '../lib/feed/feedFilters';
import { useFavorites, useFollowing } from "../lib/feed/userPrefs";
import { useAuth } from "../context/AuthContext";
import {
  INFINITE_SCROLL_ROOT_MARGIN,
  MIN_VISIBLE_UNDER_FILTER,
  FEED_TABS,
} from '../lib/feed/feedConfig';
import './feed/feed-cards.css';
import './Feed.css';

const SKEL_W = {
  s40: { width: '40%' },
  s90: { width: '90%' },
  s70: { width: '70%' },
  s60: { width: '60%' },
};

const PULL_THRESHOLD = 70;

const EMPTY_COPY = {
  [FEED_TABS.favourite]: {
    title: 'No favourites yet',
    body: 'Tap the bookmark on any post to save it here.',
  },
  [FEED_TABS.following]: {
    title: 'You\u2019re not following anyone yet',
    body: 'Follow a source from a post to see its content here.',
  },
  [FEED_TABS.trending]: { title: 'Nothing trending right now', body: 'Check back shortly.' },
  date: { title: 'No posts on this date', body: 'Try a different date or clear the filter.' },
  default: { title: 'No posts to show', body: 'Try a different filter.' },
};

function FeedSkeleton() {
  return (
    <div className="cf-skeleton" aria-hidden="true">
      <div className="cf-skel-head">
        <span className="cf-skel-dot" />
        <span className="cf-skel-line" style={SKEL_W.s40} />
      </div>
      <div className="cf-skel-img" />
      <span className="cf-skel-line" style={SKEL_W.s90} />
      <span className="cf-skel-line" style={SKEL_W.s70} />
      <span className="cf-skel-line" style={SKEL_W.s60} />
    </div>
  );
}

/**
 * Club-scoped production feed.
 *
 * Data/pagination/refresh live in `useClubFeed`. Dynamic filtering & sorting are
 * applied here as pure transforms (see feedFilters.js) over the real fetched
 * data, since the upstream exposes no server-side filter params.
 *
 * Props: { activeTab, selectedDate, onCommentClick, onShareClick, onReportClick }
 */
export default function Feed({
  activeTab = FEED_TABS.latest,
  selectedDate = null,
  onCommentClick,
  onShareClick,
  onReportClick,
}) {
  const { selectedClub } = useAuth();
  const clubIds = Array.isArray(selectedClub) ? selectedClub.map(c => c.id || c) : (selectedClub ? [selectedClub.id || selectedClub] : []);
  const {
    items,
    status,
    error,
    loadingMore,
    hasMore,
    refreshing,
    usingFallback,
    loadMore,
    refresh,
    retry,
  } = useClubFeed({ clubIds });

  const { items: favorites } = useFavorites();
  const { items: following } = useFollowing();

  // Pure, memoised view transform. Recomputes only when inputs change.
  const visibleItems = useMemo(
    () => applyFeedView(items, { tab: activeTab, dateIso: selectedDate, favorites, following }),
    [items, activeTab, selectedDate, favorites, following],
  );

  const filterActive = activeTab !== FEED_TABS.latest || !!selectedDate;

  // Area 11 — reels: collect the reel items in the current view so the
  // full-screen player can swipe through them, and track which one is open.
  const reels = useMemo(
    () => visibleItems.filter((it) => it.kind === 'video' && it.mediaFormat === 'reel'),
    [visibleItems],
  );
  const [reelView, setReelView] = useState(null);
  const openReel = useCallback(
    (item) => {
      const idx = reels.findIndex((r) => r.dedupeId === item.dedupeId);
      setReelView({ index: idx < 0 ? 0 : idx });
    },
    [reels],
  );
  const closeReel = useCallback(() => setReelView(null), []);

  const sentinelRef = useRef(null);
  const pullRef = useRef({ startY: 0, active: false });
  const [pull, setPull] = useState(0);
  const [showTop, setShowTop] = useState(false);

  // Reveal a back-to-top control once the user scrolls past ~1.5 viewports.
  // Uses window scroll to match the existing pull-to-refresh logic above.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Stable, item-aware handlers so memoised cards/renderers don't re-render.
  const handleComment = useCallback((item) => onCommentClick?.(item), [onCommentClick]);
  const handleShare = useCallback((item) => onShareClick?.(item), [onShareClick]);
  const handleReport = useCallback((item) => onReportClick?.(item), [onReportClick]);

  // Infinite scroll via IntersectionObserver sentinel.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: INFINITE_SCROLL_ROOT_MARGIN },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  // Keep pagination working under filters: if a filter collapses the visible
  // list, keep fetching more pages (bounded by the hook's end-of-feed guards)
  // until we have enough to fill the viewport or the feed is exhausted.
  // Guard with `!error`: if an upstream "load more" (POST) request has failed,
  // stop auto-paging so a sparse filter can't trigger a retry storm.
  useEffect(() => {
    if (!filterActive || !hasMore || loadingMore || status !== 'ready' || error) return;
    if (visibleItems.length < MIN_VISIBLE_UNDER_FILTER) loadMore();
  }, [filterActive, hasMore, loadingMore, status, error, visibleItems.length, loadMore]);

  // Touch pull-to-refresh (preserves scroll position: only engages at top).
  const onTouchStart = (e) => {
    if (window.scrollY > 0) return;
    pullRef.current = { startY: e.touches[0].clientY, active: true };
  };
  const onTouchMove = (e) => {
    if (!pullRef.current.active) return;
    const delta = e.touches[0].clientY - pullRef.current.startY;
    if (delta > 0) setPull(Math.min(delta * 0.5, PULL_THRESHOLD + 20));
  };
  const onTouchEnd = () => {
    if (pull >= PULL_THRESHOLD) refresh();
    pullRef.current.active = false;
    setPull(0);
  };

  // ── render states ──
  if (status === 'loading') {
    return (
      <div className="cf-feed">
        {Array.from({ length: 4 }).map((_, i) => (
          <FeedSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error' && items.length === 0) {
    return (
      <div className="cf-state">
        <p className="cf-state-title">Couldn’t load the feed</p>
        <p className="cf-state-body">{error?.message || 'Please check your connection.'}</p>
        <button type="button" className="cf-retry" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  const pullStyle = { transform: `translateY(${pull}px)` };
  const showFilterEmpty = visibleItems.length === 0 && items.length > 0;
  const emptyCopy =
    EMPTY_COPY[activeTab] || (selectedDate ? EMPTY_COPY.date : EMPTY_COPY.default);

  return (
    <>
    <div
      className="cf-feed"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={pullStyle}
    >
      {refreshing && <div className="cf-refreshing">Refreshing…</div>}
      {usingFallback && (
        <div className="cf-notice">Showing cached posts — live feed is unavailable right now.</div>
      )}

      {showFilterEmpty ? (
        <div className="cf-state cf-state-filter">
          <p className="cf-state-title">{emptyCopy.title}</p>
          <p className="cf-state-body">{emptyCopy.body}</p>
        </div>
      ) : (
        visibleItems.map((item) => (
          <ClubFeedRenderer
            key={item.dedupeId}
            item={item}
            onComment={handleComment}
            onShare={handleShare}
            onReport={handleReport}
            onOpenReel={openReel}
          />
        ))
      )}

      {/* Sentinel + loading indicator for additional pages. */}
      <div ref={sentinelRef} className="cf-sentinel" aria-hidden="true" />
      {loadingMore && (
        <div className="cf-loadmore">
          <span className="cf-spinner" /> Loading more…
        </div>
      )}
      {!hasMore && !filterActive && items.length > 0 && (
        <div className="cf-end">You’re all caught up</div>
      )}
      {error && items.length > 0 && hasMore && (
        <button type="button" className="cf-retry cf-retry-inline" onClick={loadMore}>
          Couldn’t load more — tap to retry
        </button>
      )}
    </div>
    {reelView && (
      <ReelPlayer
        reels={reels}
        startIndex={reelView.index}
        onClose={closeReel}
        onComment={handleComment}
        onShare={handleShare}
      />
    )}
    {showTop && (
      <button
        type="button"
        className="cf-back-to-top is-visible"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    )}
    </>
  );
}
