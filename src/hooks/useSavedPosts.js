/**
 * src/hooks/useSavedPosts.js
 *
 * Loads the viewer's saved (bookmarked) club-feed items from our own DB
 * (server/routes/clubSocial.js → club_post_saves). Used by the profile "Saved"
 * tab to render a real, cross-device list with proper loading / empty / error
 * states (replacing the old hard-coded mock data).
 *
 * Pagination is cursor-based (newest first). The hook fetches the first page on
 * mount, so callers should only mount it when the Saved tab is actually shown
 * (render `<SavedPostsTab />` conditionally) to defer the request until needed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const PAGE_SIZE = 20;

export function useSavedPosts() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { items: rows = [], nextCursor = null } = await api.getClubSaved({ limit: PAGE_SIZE });
      if (!mounted.current) return;
      setItems(Array.isArray(rows) ? rows : []);
      setCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
      setStatus('ready');
    } catch (err) {
      if (!mounted.current) return;
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { items: rows = [], nextCursor = null } = await api.getClubSaved({
        cursor,
        limit: PAGE_SIZE,
      });
      if (!mounted.current) return;
      setItems((prev) => [...prev, ...(Array.isArray(rows) ? rows : [])]);
      setCursor(nextCursor);
      setHasMore(Boolean(nextCursor));
    } catch {
      /* keep what we already have; the Load more button stays available */
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor]);

  // Optimistically drop an item when the user un-saves it from the Saved view.
  const removeLocal = useCallback((itemId) => {
    setItems((prev) => prev.filter((it) => String(it.item_id) !== String(itemId)));
  }, []);

  return { items, status, error, hasMore, loadingMore, loadMore, reload: load, removeLocal };
}

export default useSavedPosts;
