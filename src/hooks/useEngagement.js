/**
 * src/hooks/useEngagement.js
 *
 * Per-post engagement state: likes, comments, shares, save (favourite).
 *
 * - Likes/comments/shares are optimistic and persisted via the social BFF
 *   (server/routes/clubSocial.js → our own DB). Counts are reconciled with the
 *   authoritative value the server returns so concurrent activity stays
 *   accurate, and the viewer's liked state survives a page refresh because the
 *   feed re-seeds `initialLiked` from the server on load.
 * - `saved` is delegated to the shared favourites store (userPrefs) keyed by the
 *   feed item's dedupeId, so the "Favourite" filter tab updates instantly and
 *   persists across refresh / tabs.
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useFavorites } from '../lib/feed/userPrefs';

export function useEngagement({
  id,
  favoriteKey,
  initialLikes = 0,
  initialComments = 0,
  initialShares = 0,
  initialLiked = false,
  saveSnapshot = null,
  localOnly = false,
}) {
  const key = favoriteKey || id;
  const { has, toggle: toggleFavorite } = useFavorites();

  // Seed from the server-provided viewer state when available (feed enrichment
  // — Area 7). Falls back to 0 / false for aggregated/local-only cards.
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likes, setLikes] = useState(Number(initialLikes) || 0);
  const [comments, setComments] = useState(Number(initialComments) || 0);
  const [shares, setShares] = useState(Number(initialShares) || 0);
  const [busy, setBusy] = useState(false);

  // The feed enriches items with engagement asynchronously (one network round
  // trip after the first paint), so the seed props can arrive/refresh after
  // mount. Re-sync local state whenever an authoritative seed value changes.
  // These only fire when the prop value itself changes, so they never clobber
  // an in-progress optimistic update.
  useEffect(() => { setLiked(Boolean(initialLiked)); }, [initialLiked]);
  useEffect(() => { setLikes(Number(initialLikes) || 0); }, [initialLikes]);
  useEffect(() => { setComments(Number(initialComments) || 0); }, [initialComments]);
  useEffect(() => { setShares(Number(initialShares) || 0); }, [initialShares]);

  const saved = has(key);

  const toggleLike = useCallback(async () => {
    if (busy) return;
    const next = !liked;
    // Optimistic update.
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    // Aggregated cards (fixtures / glance tiles) are not individual social
    // posts, so they stay optimistic-local and never hit the server.
    if (localOnly) return;
    setBusy(true);
    try {
      const resp = next ? await api.clubLike?.(id) : await api.clubUnlike?.(id);
      // Reconcile with the authoritative server values when provided.
      if (resp && typeof resp.like_count === 'number') setLikes(Math.max(0, resp.like_count));
      if (resp && typeof resp.liked === 'boolean') setLiked(resp.liked);
    } catch {
      // Revert on failure.
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }, [busy, liked, id, localOnly]);

  const toggleSave = useCallback(() => {
    const next = !saved;
    // Optimistic local toggle — drives the bookmark icon and the "Favourite"
    // feed tab instantly (both read the shared favourites store).
    toggleFavorite(key);
    // Aggregated tiles (fixtures / glance) aren't real posts, so they stay
    // local-only and never hit the server.
    if (localOnly) return;
    // Persist to our DB so saves sync across devices and power the Saved view.
    (async () => {
      try {
        if (next) await api.clubSave?.(key, saveSnapshot || null);
        else await api.clubUnsave?.(key);
      } catch {
        // Revert the optimistic toggle on failure.
        toggleFavorite(key);
      }
    })();
  }, [saved, toggleFavorite, key, localOnly, saveSnapshot]);

  const addComment = useCallback(() => {
    setComments((n) => n + 1);
  }, []);

  const share = useCallback(async () => {
    // Optimistic bump so the count reacts instantly.
    setShares((n) => n + 1);
    if (localOnly) return;
    try {
      const resp = await api.clubShare?.(id);
      if (resp && typeof resp.share_count === 'number') setShares(Math.max(0, resp.share_count));
    } catch {
      // Revert on failure.
      setShares((n) => Math.max(0, n - 1));
    }
  }, [id, localOnly]);

  return { liked, likes, comments, shares, saved, busy, toggleLike, toggleSave, addComment, share };
}

export default useEngagement;
