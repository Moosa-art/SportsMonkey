import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiX, FiVolumeX, FiVolume2 } from 'react-icons/fi';
import SmartImage from './SmartImage';
import ReelActionRail from './ReelActionRail';
import { useReelEngagement } from '../../hooks/useReelEngagement';
import { claimPlayback, releasePlayback } from '../../lib/feed/mediaController';
import './reels.css';

const YT_EMBED = 'https://www.youtube.com/embed/';

/**
 * A single full-screen reel slide. Autoplays (muted) when it is the active
 * snap target and pauses when it scrolls away — the classic vertical reel feel.
 */
function ReelSlide({ item, onComment, onShare }) {
  const isMp4 = item.provider === 'mp4' && !!item.url;
  const isYouTube = item.provider === 'youtube' && !!item.youtubeId;

  const slideRef = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const playId = `player:${item.dedupeId || item.id}`;

  const eng = useReelEngagement(item, {
    onComment: () => onComment?.(item),
    onShare: () => onShare?.(item),
  });

  const pause = useCallback(() => {
    if (videoRef.current) videoRef.current.pause();
  }, []);

  useEffect(() => {
    const node = slideRef.current;
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

  // YouTube Shorts: only mount/autoplay the iframe for the active slide; looping
  // requires playlist=<id>. Muted by default to satisfy autoplay policies.
  const ytSrc = isYouTube
    ? `${YT_EMBED}${item.youtubeId}?rel=0&playsinline=1&autoplay=${inView ? 1 : 0}` +
      `&mute=${muted ? 1 : 0}&loop=1&playlist=${item.youtubeId}`
    : '';

  return (
    <div className="reelp-slide" ref={slideRef}>
      <div className="reelp-stage">
        {isMp4 ? (
          <video
            ref={videoRef}
            className="reelp-video"
            src={item.url}
            poster={item.thumbnail || undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onClick={() => setMuted((m) => !m)}
          />
        ) : isYouTube && inView ? (
          <iframe
            className="reelp-video"
            src={ytSrc}
            title={item.title || 'Reel'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="reelp-poster">
            <SmartImage src={item.thumbnail} alt={item.title} label={item.source} />
          </div>
        )}
      </div>

      <div className="reelp-overlay">
        <div className="reelp-meta">
          {item.source && <span className="reelp-source">{item.source}</span>}
          {item.title && <p className="reelp-title">{item.title}</p>}
        </div>
      </div>

      {isMp4 && (
        <button
          type="button"
          className="reel-mute reelp-mute"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
        </button>
      )}

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
  );
}

/**
 * Full-screen, scroll-snap vertical reel player overlay. Opens at the tapped
 * reel and lets the user swipe through every reel in the current feed view.
 *
 * Props: { reels: FeedItem[], startIndex, onClose, onComment, onShare }
 */
function ReelPlayer({ reels, startIndex = 0, onClose, onComment, onShare }) {
  const scrollerRef = useRef(null);

  // Lock background scroll + close on Escape while the overlay is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Jump to the reel the user tapped (no smooth-scroll on first paint).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && startIndex > 0) {
      const child = scroller.children[startIndex];
      if (child) scroller.scrollTop = child.offsetTop;
    }
  }, [startIndex]);

  if (!reels || reels.length === 0) return null;

  return (
    <div className="reelp-root" role="dialog" aria-modal="true" aria-label="Reels">
      <button type="button" className="reelp-close" onClick={onClose} aria-label="Close reels">
        <FiX size={24} />
      </button>
      <div className="reelp-scroller" ref={scrollerRef}>
        {reels.map((item) => (
          <ReelSlide
            key={item.dedupeId}
            item={item}
            onComment={onComment}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ReelPlayer);
