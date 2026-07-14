/**
 * src/lib/feed/formatTime.js
 * Presentation-only relative-time formatting for feed metadata.
 */

/**
 * Human "x ago" label from an epoch-ms timestamp. Falls back to the original
 * upstream string when no numeric timestamp is available.
 * @param {number|null|undefined} ts epoch ms
 * @param {string|null|undefined} [raw] original upstream string fallback
 * @param {number} [nowMs]
 * @returns {string}
 */
export function timeAgo(ts, raw = null, nowMs = Date.now()) {
  if (ts == null || !Number.isFinite(ts)) return raw || '';
  const diff = Math.max(0, nowMs - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export default timeAgo;
