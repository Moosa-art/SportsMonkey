import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiPlay, FiVolumeX } from 'react-icons/fi';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';
import { timeAgo } from '../../../lib/feed/formatTime';
import { claimPlayback, releasePlayback } from '../../../lib/feed/mediaController';
import '../reels.css';

const YT_EMBED = 'https://www.youtube.com/embed/';

/**
 * Landscape (16:9) video card.
 *
 * Area 11: adds IntersectionObserver-driven autoplay / auto-pause so the video
 * plays when scrolled into view and pauses when it leaves, with a shared media
 * controller guaranteeing only ONE feed video plays at a time.
 *
 * - mp4 clips autoplay MUTED inline and can be unmuted with the speaker toggle.
 * - YouTube videos autoplay MUTED inline (an iframe is mounted only while the
 *   card is on screen, and unmounted when it leaves so it stops & frees
 *   resources). Tapping the speaker remounts it with sound.
 */
function VideoCard({ item, onComment, onShare, onReport }) {
  const isYouTube = item.provider === 'youtube' && !!item.youtubeId;
  const isMp4 = item.provider === 'mp4' && !!item.url;

  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const playId = `video:${item.dedupeId || item.id}`;

  const pause = useCallback(() => {
    if (videoRef.current) videoRef.current.pause();
  }, []);

  // Track on-screen visibility (threshold 0.6 — mostly visible).
  useEffect(() => {
    const node = mediaRef.current;
    if (!node) return undefined;
    const obs = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting), {
      threshold: 0.6,
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  // mp4: play/pause the real <video> element as visibility changes.
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

  // youtube: claim/release the single-active slot as the iframe mounts/unmounts.
  useEffect(() => {
    if (!isYouTube) return undefined;
    if (inView) claimPlayback(playId, pause);
    else releasePlayback(playId);
    return () => releasePlayback(playId);
  }, [isYouTube, inView, playId, pause]);

  const ytSrc =
    `${YT_EMBED}${item.youtubeId}?rel=0&playsinline=1&autoplay=1&mute=${muted ? 1 : 0}`;
  const showYtFrame = isYouTube && inView;

  return (
    <article className="cf-card cf-video">
      <header className="cf-card-head">
        <span className="cf-avatar">
          <SmartImage src={item.sourceImg} alt={item.source} label={item.source} contain />
        </span>
        <div className="cf-head-meta">
          <span className="cf-source">{item.source}</span>
          <span className="cf-time">{timeAgo(item.timestamp, item.createdAt)}</span>
        </div>
      </header>

      {item.title && <h3 className="cf-title cf-video-title">{item.title}</h3>}

      <div className="cf-media cf-media-16x9" ref={mediaRef}>
        {isMp4 ? (
          <video
            ref={videoRef}
            className="cf-video-frame"
            src={item.url}
            poster={item.thumbnail || undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
          />
        ) : showYtFrame ? (
          <iframe
            className="cf-video-frame"
            src={ytSrc}
            title={item.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="cf-video-poster" aria-hidden="true">
            <SmartImage src={item.thumbnail} alt={item.title} label={item.source} />
            <span className="cf-play">
              <FiPlay size={26} />
            </span>
          </div>
        )}

        {(isMp4 || showYtFrame) && muted && (
          <button
            type="button"
            className="cf-mute-toggle"
            onClick={() => setMuted(false)}
            aria-label="Unmute"
          >
            <FiVolumeX size={16} />
          </button>
        )}
      </div>

      <EngagementBar
        id={item.id}
        dedupeId={item.dedupeId}
        initialLikes={item.eng?.like_count}
        initialComments={item.eng?.comment_count}
        initialShares={item.eng?.share_count}
        initialLiked={item.eng?.liked}
        saveSnapshot={ {
          kind: 'video',
          title: item.title,
          image: item.thumbnail,
          source: item.source,
          link: item.url,
          timestamp: item.timestamp,
        } }
        onComment={onComment}
        onShare={onShare}
        onReport={onReport}
      />
    </article>
  );
}

export default memo(VideoCard);
