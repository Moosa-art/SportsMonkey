import { FiBookmark, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { useSavedPosts } from '../hooks/useSavedPosts';
import { useFavorites } from '../lib/feed/userPrefs';
import { api } from '../lib/api';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import SmartImage from './feed/SmartImage';
import './SavedPostsTab.css';

/**
 * Renders a single saved item from its stored snapshot. The snapshot is a
 * lightweight copy captured at save time (title / image / source / link) so we
 * can render without re-fetching the cursor-only upstream feed.
 */
function SavedRow({ row, onRemove }) {
  const snap = row.snapshot || {};
  const open = () => {
    if (snap.link) window.open(snap.link, '_blank', 'noopener,noreferrer');
  };
  return (
    <article className="saved-row">
      {snap.image && (
        <button type="button" className="saved-thumb" onClick={open} aria-label="Open saved post">
          <SmartImage src={snap.image} alt={snap.title || 'Saved post'} label={snap.source} />
        </button>
      )}
      <div className="saved-body">
        <span className="saved-source">{snap.source || 'Saved post'}</span>
        <h4 className="saved-title">{snap.title || 'Untitled post'}</h4>
        <div className="saved-actions">
          {snap.link && (
            <button type="button" className="saved-link" onClick={open}>
              <FiExternalLink size={13} /> Open
            </button>
          )}
          <button
            type="button"
            className="saved-remove"
            onClick={() => onRemove(row.item_id)}
            aria-label="Remove from saved"
          >
            <FiTrash2 size={13} /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Profile "Saved" tab. Server-backed (cross-device) list of bookmarked
 * club-feed items with loading skeleton, empty state and error/retry.
 */
export default function SavedPostsTab() {
  const { items, status, hasMore, loadingMore, loadMore, reload, removeLocal } = useSavedPosts();
  const { set: setFavorite } = useFavorites();

  const handleRemove = async (itemId) => {
    // Optimistic: drop from the list and clear the bookmark everywhere
    // (the EngagementBar icon + the "Favourite" feed tab read the same store).
    removeLocal(itemId);
    setFavorite(itemId, false);
    try {
      await api.clubUnsave?.(itemId);
    } catch {
      /* best-effort; a reload will reconcile if it failed */
    }
  };

  if (status === 'loading') {
    return (
      <div className="saved-list" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="saved-skel" key={i}>
            <span className="saved-skel-thumb" />
            <span className="saved-skel-lines" />
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Couldn’t load saved posts"
        hint="Please check your connection and try again."
        onRetry={reload}
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<FiBookmark size={26} />}
        title="No saved posts yet"
        hint="Tap the bookmark on any post to save it here."
      />
    );
  }

  return (
    <div className="saved-list">
      {items.map((row) => (
        <SavedRow key={row.item_id} row={row} onRemove={handleRemove} />
      ))}
      {hasMore && (
        <button type="button" className="saved-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
