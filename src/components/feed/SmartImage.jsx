import { memo, useState } from 'react';

/**
 * SmartImage — resilient <img> wrapper for the feed.
 *
 * Solves the "broken images" problem at the root:
 *  - Renders a styled placeholder (source initials) when the src is missing OR
 *    when the network image fails to load (404 / hotlink-blocked CDN).
 *  - Lazy-loads off-screen images and decodes async to keep scrolling smooth.
 *  - Relies on the container's CSS aspect-ratio for correct, shift-free sizing.
 *
 * It is intentionally presentation-only and memoised; identity is driven by the
 * `src` prop so it re-evaluates when the resolved URL changes.
 *
 * @param {Object} props
 * @param {string|null|undefined} props.src   already-resolved absolute URL
 * @param {string} [props.alt]
 * @param {string} [props.className]          class on the rendered <img>
 * @param {string} [props.fallbackClassName]  class on the placeholder box
 * @param {string} [props.label]              text used to derive placeholder initials
 * @param {boolean} [props.eager]             load immediately (above-the-fold)
 * @param {boolean} [props.contain]           object-fit: contain (e.g. crests)
 */
function SmartImage({
  src,
  alt = '',
  className = '',
  fallbackClassName = '',
  label = '',
  eager = false,
  contain = false,
}) {
  // Track WHICH src failed (not a boolean) so a changed src auto-recovers
  // during render without needing an effect — avoids cascading re-renders.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;

  if (!src || failed) {
    const initials = deriveInitials(label || alt);
    return (
      <span className={`cf-img-fallback ${fallbackClassName}`} aria-hidden={!alt} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {initials || <span className="cf-img-fallback-glyph" />}
      </span>
    );
  }

  const fitClass = contain ? 'cf-img-contain' : 'cf-img-cover';
  return (
    <img
      src={src}
      alt={alt}
      className={`${fitClass} ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setFailedSrc(src)}
    />
  );
}

function deriveInitials(text) {
  if (!text || typeof text !== 'string') return '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default memo(SmartImage);
