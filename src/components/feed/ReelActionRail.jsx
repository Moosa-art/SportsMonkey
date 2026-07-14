import { memo } from 'react';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark } from 'react-icons/fi';

/**
 * Presentational TikTok/Reels-style vertical action rail (like / comment /
 * share / save). State + handlers are owned by the container (ReelCard or a
 * ReelPlayer slide) via `useReelEngagement`, so this stays a pure view.
 */
function ReelActionRail({
  liked,
  likes,
  comments,
  shares,
  saved,
  onLike,
  onComment,
  onShare,
  onSave,
}) {
  return (
    <div className="reel-rail">
      <button
        type="button"
        className={`reel-rail-btn${liked ? ' liked' : ''}`}
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        {liked ? <FiHeart size={26} fill="currentColor" /> : <FiHeart size={26} />}
        {likes > 0 && <span>{likes}</span>}
      </button>
      <button type="button" className="reel-rail-btn" onClick={onComment} aria-label="Comment">
        <FiMessageCircle size={26} />
        {comments > 0 && <span>{comments}</span>}
      </button>
      <button type="button" className="reel-rail-btn" onClick={onShare} aria-label="Share">
        <FiSend size={26} />
        {shares > 0 && <span>{shares}</span>}
      </button>
      <button
        type="button"
        className={`reel-rail-btn${saved ? ' saved' : ''}`}
        onClick={onSave}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
      >
        {saved ? <FiBookmark size={24} fill="currentColor" /> : <FiBookmark size={24} />}
      </button>
    </div>
  );
}

export default memo(ReelActionRail);
