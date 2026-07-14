import { memo } from 'react';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiFlag } from 'react-icons/fi';
import { useEngagement } from '../../hooks/useEngagement';

/**
 * Shared like / comment / share / save action bar used by the feed cards.
 *
 * - Like/comment/share are optimistic and persisted via the social BFF, so the
 *   counts are dynamic and a like survives a page refresh.
 * - Save (bookmark) writes to the shared favourites store keyed by the item's
 *   `dedupeId`, so the "Favourite" filter tab reflects saves instantly.
 *
 * @param {Object} props
 * @param {string} props.id            engagement id (feed item id) for like/comment/share
 * @param {string} props.dedupeId      stable feed-item id used as the favourite key
 * @param {number} [props.initialLikes]
 * @param {number} [props.initialComments]
 * @param {number} [props.initialShares]
 * @param {boolean} [props.initialLiked]
 * @param {(payload: { id: string, addComment: () => void }) => void} [props.onComment]
 * @param {() => void} [props.onShare]
 */
function EngagementBar({
  id,
  dedupeId,
  initialLikes = 0,
  initialComments = 0,
  initialShares = 0,
  initialLiked = false,
  saveSnapshot = null,
  onComment,
  onShare,
  onReport,
  localOnly = false,
}) {
  const { liked, likes, comments, shares, saved, toggleLike, toggleSave, addComment, share } =
    useEngagement({
      id,
      favoriteKey: dedupeId || id,
      initialLikes,
      initialComments,
      initialShares,
      initialLiked,
      saveSnapshot,
      localOnly,
    });

  const handleComment = () => onComment?.({ id, addComment });
  // Persist the share (dynamic count) AND open the existing share sheet.
  const handleShare = () => {
    share();
    onShare?.();
  };
  const handleReport = () => onReport?.();

  return (
    <div className="cf-actions">
      <div className="cf-actions-left">
        <button
          type="button"
          className={`cf-action${liked ? ' liked' : ''}`}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          {liked ? <FiHeart size={18} fill="currentColor" /> : <FiHeart size={18} />}
          {likes > 0 && <span>{likes}</span>}
        </button>
        <button type="button" className="cf-action" onClick={handleComment} aria-label="Comment">
          <FiMessageCircle size={18} />
          {comments > 0 && <span>{comments}</span>}
        </button>
        <button type="button" className="cf-action" onClick={handleShare} aria-label="Share">
          <FiSend size={18} />
          {shares > 0 && <span>{shares}</span>}
        </button>
        {onReport && (
          <button type="button" className="cf-action" onClick={handleReport} aria-label="Report">
            <FiFlag size={18} />
          </button>
        )}
      </div>
      <button
        type="button"
        className={`cf-action${saved ? ' saved' : ''}`}
        onClick={toggleSave}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
      >
        {saved ? <FiBookmark size={17} fill="currentColor" /> : <FiBookmark size={17} />}
      </button>
    </div>
  );
}

export default memo(EngagementBar);
