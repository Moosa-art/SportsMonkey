import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiPlay, FiMaximize2, FiVolumeX, FiVolume2 } from 'react-icons/fi';
import SmartImage from '../SmartImage';
import ReelActionRail from '../ReelActionRail';
import { useReelEngagement } from '../../../hooks/useReelEngagement';
import { claimPlayback, releasePlayback } from '../../../lib/feed/mediaController';
import '../reels.css';

/**
 * Inline vertical (9:16) reel card for the home feed.
 *
 * - mp4 reels autoplay MUTED when scrolled into view and pause when out of
 *   view (IntersectionObserver, threshold 0.6), coordinated through the shared
 *   media controller so only one feed video plays at a time.
 * - YouTube Shorts show a 9:16 poster (autoplaying third-party iframes inline
 *   is heavy/janky) and open straight into the full-screen player on tap.
 * - Tapping the media (or the expand button) opens the full-screen swipe-
 *   through reel player.
 */
function ReelCard({ item, onComment, onShare, onOpenReel }) {
  const isMp4 = item.provider === 'mp4' && !!item.url;

  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const playId = `reel:${item.dedupeId || item.id}`;

  const eng = useReelEngagement(item, { onComment, onShare });

  const pause = useCallback(() => {
    if (videoRef.current) videoRef.current.pause();
  }, []);

  useEffect(() => {
    const node = mediaRef.current;
    if (!node) return undefined;
    const obs = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting), {
      threshold: 0.6,
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isMp4) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;
    if (inView) {
      claimPlayback(playId, pause);
      v.muted = muted;
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
      releasePlayback(playId);
    }
    return undefined;
  }, [isMp4, inView, muted, playId, pause]);

  useEffect(() => () => releasePlayback(playId), [playId]);

  const open = () => onOpenReel?.(item);

  return (
    <article className="cf-card cf-reel-card">
      <div className="reel-frame" ref={mediaRef}>
        {isMp4 ? (
          <video
            ref={videoRef}
            className="reel-video"
            src={item.url}
            poster={item.thumbnail || undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onClick={open}
          />
        ) : (
          <button type="button" className="reel-poster" onClick={open} aria-label="Open reel">
            <SmartImage src={item.thumbnail} alt={item.title} label={item.source} />
            <span className="cf-play">
              <FiPlay size={26} />
            </span>
          </button>
        )}

        <div className="reel-overlay">
          <div className="reel-meta">
            <span className="reel-badge">Reel</span>
            {item.source && <span className="reel-source">{item.source}</span>}
            {item.title && <p className="reel-title">{item.title}</p>}
          </div>
        </div>

        {isMp4 && (
          <button
            type="button"
            className="reel-mute"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
          </button>
        )}

        <button
          type="button"
          className="reel-expand"
          onClick={open}
          aria-label="Open full screen"
        >
          <FiMaximize2 size={16} />
        </button>

        <ReelActionRail
          liked={eng.liked}
          likes={eng.likes}
          comments={eng.comments}
          shares={eng.shares}
          saved={eng.saved}
          onLike={eng.toggleLike}
          onComment={eng.handleComment}
          onShare={eng.handleShare}
          onSave={eng.toggleSave}
        />
      </div>
    </article>
  );
}

export default memo(ReelCard);
