import { useState } from 'react';
import { FiX, FiShare2, FiLink, FiMail } from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaTwitter, FaFacebook } from 'react-icons/fa';
import './ShareSheet.css';

const SHARE_OPTIONS = [
  { id: 'copy',      label: 'Copy Link',  icon: FiLink,      color: '#374151', bg: '#f3f4f6' },
  { id: 'whatsapp',  label: 'WhatsApp',   icon: FaWhatsapp,  color: '#25D366', bg: '#e7fde8' },
  { id: 'telegram',  label: 'Telegram',   icon: FaTelegram,  color: '#0088cc', bg: '#e5f4ff' },
  { id: 'twitter',   label: 'Twitter/X',  icon: FaTwitter,   color: '#1d9bf0', bg: '#e8f5fe' },
  { id: 'facebook',  label: 'Facebook',   icon: FaFacebook,  color: '#1877f2', bg: '#e8f0fe' },
  { id: 'email',     label: 'Email',      icon: FiMail,      color: '#6b7280', bg: '#f3f4f6' },
];

// Best-effort stable id for the feed item (news / video / native post).
function postIdOf(post) {
  return (
    post?.id ??
    post?.itemId ??
    post?.dedupeId ??
    post?.article?.id ??
    ''
  );
}

export default function ShareSheet({ post, onClose }) {
  const [copied, setCopied] = useState(false);

  const postId = postIdOf(post);
  const origin =
    typeof window !== 'undefined' && window.location ? window.location.origin : 'https://social442.app';
  const shareUrl = `${origin}/post/${postId}`;
  const displayUrl = `${origin.replace(/^https?:\/\//, '')}/post/${postId}`;
  const shareTitle =
    post?.title || post?.text || post?.subtitle || `${post?.username || 'Social 442'} on Social 442`;

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const openExternal = (url) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  };

  const doCopy = () => {
    try {
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (opt) => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareTitle);
    switch (opt.id) {
      case 'copy':
        doCopy();
        return;
      case 'whatsapp':
        openExternal(`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`);
        break;
      case 'telegram':
        openExternal(`https://t.me/share/url?url=${url}&text=${text}`);
        break;
      case 'twitter':
        openExternal(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
        break;
      case 'facebook':
        openExternal(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
        break;
      case 'email':
        if (typeof window !== 'undefined') {
          window.location.href = `mailto:?subject=${text}&body=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`;
        }
        break;
      case 'native':
        if (canNativeShare) {
          navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
        }
        break;
      default:
        break;
    }
    // Close the sheet after dispatching an external share (copy stays open to
    // show the "Copied!" confirmation).
    onClose?.();
  };

  const options = canNativeShare
    ? [...SHARE_OPTIONS, { id: 'native', label: 'More\u2026', icon: FiShare2, color: '#374151', bg: '#f3f4f6' }]
    : SHARE_OPTIONS;

  return (
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-sheet">
        <div className="share-drag-handle" />
        <div className="share-header">
          <span className="share-title">Share Post</span>
          <button className="share-close" onClick={onClose} id="share-close"><FiX size={18} /></button>
        </div>

        {post && (
          <div className="share-preview">
            <div className="share-preview-avatar" style={ { background: post.userColor || 'var(--navy)' } }>
              {post.userImage
                ? <img src={post.userImage} alt="" />
                : <span>{post.userInitial || 'U'}</span>}
            </div>
            <div className="share-preview-info">
              <span className="share-preview-name">{post.username}</span>
              <span className="share-preview-sub">{post.subtitle || post.timestamp}</span>
            </div>
          </div>
        )}

        <div className="share-options">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isLink = opt.id === 'copy';
            return (
              <button
                key={opt.id}
                type="button"
                className="share-option"
                id={`share-${opt.id}`}
                onClick={() => handleShare(opt)}
              >
                <div className="share-icon-wrap" style={ { background: opt.bg } }>
                  <Icon size={20} color={opt.color} />
                </div>
                <span className="share-label">
                  {isLink && copied ? 'Copied!' : opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="share-link-row">
          <div className="share-link-box">
            <span className="share-link-text">{displayUrl}</span>
          </div>
          <button
            className={`share-copy-btn ${copied ? 'copied' : ''}`}
            id="share-copy-link-btn"
            onClick={doCopy}
          >
            {copied ? '\u2713 Copied' : 'Copy'}
          </button>
        </div>

        <button className="share-cancel-btn" onClick={onClose} id="share-cancel">Cancel</button>
      </div>
    </div>
  );
}
