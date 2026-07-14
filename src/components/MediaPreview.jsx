import { FiX, FiFileText, FiPlay } from 'react-icons/fi';
import './media.css';

/**
 * MediaPreview — a single thumbnail tile with optional upload progress, size,
 * error state and a remove button. Works for both pending (local File) and
 * uploaded media.
 *
 * Props.item: {
 *   id?, kind, url?, thumbnail_url?, previewUrl?, name?, bytes?,
 *   progress?: number (0–100), uploading?: boolean, error?: string
 * }
 */
function formatBytes(n) {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function MediaPreview({ item, onRemove }) {
  const thumb =
    item.thumbnail_url || item.previewUrl || (item.kind === 'image' ? item.url : null);
  const showProgress =
    !item.error && (item.uploading || typeof item.progress === 'number') &&
    (item.progress ?? 0) < 100;

  return (
    <div className={`media-preview${item.error ? ' has-error' : ''}`}>
      <div className="media-preview-thumb">
        {thumb ? (
          <img src={thumb} alt={item.name || 'media'} />
        ) : item.kind === 'video' ? (
          <FiPlay size={20} />
        ) : item.kind === 'audio' || item.kind === 'voice' ? (
          <span className="media-preview-audio">♪</span>
        ) : (
          <FiFileText size={20} />
        )}
        {showProgress && (
          <div className="media-preview-progress">
            <span style={{ width: `${item.progress || 0}%` }} />
          </div>
        )}
      </div>

      <div className="media-preview-meta">
        {item.name && <span className="media-preview-name">{item.name}</span>}
        {item.error ? (
          <span className="media-preview-err">{item.error}</span>
        ) : item.bytes ? (
          <span className="media-preview-size">{formatBytes(item.bytes)}</span>
        ) : null}
      </div>

      {onRemove && (
        <button
          type="button"
          className="media-preview-remove"
          onClick={() => onRemove(item)}
          aria-label="Remove"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}
