import { useRef, useState, useCallback } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import './media.css';

/**
 * MediaPicker — unified file chooser with click + drag/drop.
 * Returns an array of native `File` objects via `onSelect`; uploading is the
 * caller's job (use api.uploadMedia). Purely presentational + selection.
 *
 * Props:
 *   accept    'image' | 'video' | 'audio' | 'media' | <raw accept string>
 *   multiple  allow multiple files (default false)
 *   maxFiles  cap when multiple (default 4)
 *   onSelect  (File[]) => void
 */
const ACCEPT_PRESETS = {
  image: 'image/jpeg,image/png,image/webp',
  video: 'video/mp4,video/webm',
  audio: 'audio/mpeg,audio/wav,audio/webm,audio/ogg',
  media: 'image/jpeg,image/png,image/webp,video/mp4,video/webm',
};

export default function MediaPicker({
  accept = 'image',
  multiple = false,
  maxFiles = 4,
  disabled = false,
  onSelect,
  label = 'Click to upload or drag & drop',
  hint,
  children,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const acceptStr = ACCEPT_PRESETS[accept] || accept;

  const emit = useCallback(
    (list) => {
      let files = Array.from(list || []);
      if (!files.length) return;
      files = multiple ? files.slice(0, maxFiles) : files.slice(0, 1);
      onSelect?.(files);
    },
    [multiple, maxFiles, onSelect],
  );

  const openPicker = () => { if (!disabled) inputRef.current?.click(); };
  const onChange = (e) => { emit(e.target.files); e.target.value = ''; };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) emit(e.dataTransfer.files);
  };

  return (
    <div
      className={`media-picker${dragOver ? ' is-dragover' : ''}${disabled ? ' is-disabled' : ''}`}
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
      }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        multiple={multiple}
        hidden
        onChange={onChange}
        disabled={disabled}
      />
      {children || (
        <div className="media-picker-inner">
          <FiUploadCloud size={26} />
          <span className="media-picker-label">{label}</span>
          {hint && <span className="media-picker-hint">{hint}</span>}
        </div>
      )}
    </div>
  );
}
