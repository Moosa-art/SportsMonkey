/**
 * src/hooks/useReelEngagement.js
 *
 * Thin adapter around `useEngagement` for the reel surfaces (inline ReelCard +
 * full-screen ReelPlayer). It wires the same optimistic like / comment / share
 * / save behaviour the feed cards use, plus a reel-flavoured save snapshot, and
 * exposes pre-bound `handleComment` / `handleShare` for the vertical action
 * rail. Centralising it keeps the inline card and the full-screen player in
 * perfect sync (same store, same persistence).
 *
 * The `onComment` / `onShare` callbacks are expected to be pre-bound to the
 * relevant item by the caller (the feed already binds item-aware handlers).
 */

import { useCallback } from 'react';
import { useEngagement } from './useEngagement';

export function useReelEngagement(item, { onComment, onShare } = {}) {
  const eng = useEngagement({
    id: item.id,
    favoriteKey: item.dedupeId || item.id,
    initialLikes: item.eng?.like_count,
    initialComments: item.eng?.comment_count,
    initialShares: item.eng?.share_count,
    initialLiked: item.eng?.liked,
    saveSnapshot: {
      kind: 'reel',
      title: item.title,
      image: item.thumbnail,
      source: item.source,
      link: item.url,
      timestamp: item.timestamp,
    },
  });

  const handleComment = useCallback(() => onComment?.(), [onComment]);
  // Persist the share (dynamic count) AND trigger the existing share sheet.
  const handleShare = useCallback(() => {
    eng.share();
    onShare?.();
  }, [eng, onShare]);

  return { ...eng, handleComment, handleShare };
}

export default useReelEngagement;
