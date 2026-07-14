import { useEffect } from 'react';
import { FiX, FiExternalLink } from 'react-icons/fi';
import SmartImage from './SmartImage';

/**
 * Full-screen reader for a news article. Renders the article (modal_body)
 * paragraphs; falls back to the summary teaser, and to an external link for
 * redirect-only articles that carry no body.
 */
export default function NewsArticleModal({ article, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!article) return null;
  const paragraphs = article.article.length ? article.article : article.summary;
  const hasBody = paragraphs.length > 0;

  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cf-modal-close" onClick={onClose} aria-label="close">
          <FiX size={22} />
        </button>

        {article.image && (
          <div className="cf-modal-hero">
            <SmartImage src={article.image} alt={article.title} label={article.source} eager />
          </div>
        )}

        <div className="cf-modal-body">
          <div className="cf-modal-source">
            <span className="cf-modal-source-img">
              <SmartImage src={article.sourceImg} alt={article.source} label={article.source} contain />
            </span>
            <span>{article.source}</span>
            {article.createdAt && <span className="cf-dot">·</span>}
            {article.createdAt && <span className="cf-muted">{article.createdAt}</span>}
          </div>

          <h2 className="cf-modal-title">{article.title}</h2>

          {hasBody ? (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p className="cf-muted">The full story is available on the publisher’s site.</p>
          )}

          {article.link && (
            <a
              className="cf-modal-link"
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read full article on {article.source} <FiExternalLink size={15} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
