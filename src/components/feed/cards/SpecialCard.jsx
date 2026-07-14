import { memo } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';
import { timeAgo } from '../../../lib/feed/formatTime';

/**
 * SpecialCard — adaptive renderer for any post type we don't have a dedicated
 * component for. It inspects the raw payload and picks the closest layout:
 *   - quote / inspiration
 *   - stat leaderboard (Best Heading, Fastest, Creative, Top Assists, …)
 *   - generic (title / image / caption)
 * so every content type the API returns is surfaced in a clean, on-brand way.
 */
function pick(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return null;
}

function titleCase(s) {
  return String(s || 'Update')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function findList(data) {
  const named = [
    'players', 'player_list', 'playersList', 'options', 'items',
    'standings', 'list', 'rows', 'ranking', 'leaderboard', 'scorers',
  ];
  for (const k of named) {
    if (Array.isArray(data[k]) && data[k].length) return data[k];
  }
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (
      Array.isArray(v) &&
      v.length &&
      typeof v[0] === 'object' &&
      pick(v[0], ['name', 'title', 'player', 'last_name', 'team'])
    ) {
      return v;
    }
  }
  return null;
}

function SpecialCard({ item, onComment, onShare, onReport }) {
  const postType = item.postType || 'update';
  const typeTitle = titleCase(postType);

  const rd = item.rawData || {};
  const data =
    rd.data && typeof rd.data === 'object' && !Array.isArray(rd.data)
      ? { ...rd, ...rd.data }
      : rd;

  const title = pick(data, ['title', 'headline', 'question', 'name', 'post_outer_text']);
  const image = pick(data, ['image', 'url', 'thumbnail', 'player_image', 'img']);
  const rawCaption = pick(data, ['caption', 'text', 'body', 'summary', 'description', 'quote']);
  const caption = Array.isArray(rawCaption) ? rawCaption.filter(Boolean).join(' ') : rawCaption;
  const author = pick(data, ['author', 'by', 'credit', 'said_by']);
  const list = findList(data);

  const isQuote = /inspir|quote|motivat/i.test(postType) || (!!author && !!caption && !list);

  const header = (
    <header className="cf-card-head">
      <span className="cf-avatar">
        <SmartImage src={item.sourceImg} alt={item.source} label={item.source || typeTitle} contain />
      </span>
      <div className="cf-head-meta">
        <span className="cf-source">{item.source || typeTitle}</span>
        <span className="cf-time">{timeAgo(item.timestamp, item.createdAt)}</span>
      </div>
    </header>
  );

  const engagement = (
    <EngagementBar
      id={rd.id || item.dedupeId}
      dedupeId={item.dedupeId}
      initialLikes={item.eng?.like_count}
      initialComments={item.eng?.comment_count}
      initialShares={item.eng?.share_count}
      initialLiked={item.eng?.liked}
      onComment={onComment}
      onShare={onShare}
      onReport={onReport}
      localOnly
    />
  );

  // ── Quote / Inspiration ──
  if (isQuote) {
    return (
      <article className="cf-card cf-grid-item cf-sp-quote">
        {header}
        <div className="cf-sp-quote-body">
          {image && (
            <span className="cf-sp-quote-img">
              <SmartImage src={image} alt="" label="" contain />
            </span>
          )}
          <span className="cf-sp-quote-mark">“</span>
          <p className="cf-sp-quote-text">{caption || title}</p>
          {author && <span className="cf-sp-quote-author">— {author}</span>}
        </div>
        {engagement}
      </article>
    );
  }

  // ── Stat leaderboard ──
  if (list && list.length) {
    const rows = list.slice(0, 8).map((r, i) => ({
      name: pick(r, ['name', 'title', 'player', 'team', 'last_name']) || `#${i + 1}`,
      img: pick(r, ['image', 'img', 'player_image', 'logo', 'crest']),
      val: pick(r, ['value', 'goals', 'assists', 'tackles', 'points', 'pts', 'count', 'total', 'stat']),
      rank: pick(r, ['rank', 'position', 'pos']) || i + 1,
      extra: pick(r, ['age', 'club', 'nationality']),
    }));
    return (
      <article className="cf-card cf-grid-item cf-sp-lb">
        {header}
        <div className="cf-sp-lb-head">{title || typeTitle}</div>
        <ol className="cf-sp-lb-list">
          {rows.map((r, i) => (
            <li className="cf-sp-lb-row" key={i}>
              <span className="cf-sp-lb-rank">{r.rank}</span>
              <span className="cf-sp-lb-face">
                <SmartImage src={r.img} alt={r.name} label={r.name} contain />
              </span>
              <span className="cf-sp-lb-name">
                {r.name}
                {r.extra ? <span className="cf-sp-lb-extra">{r.extra}</span> : null}
              </span>
              {r.val != null ? <span className="cf-sp-lb-val">{r.val}</span> : null}
            </li>
          ))}
        </ol>
        {engagement}
      </article>
    );
  }

  // ── Generic ──
  return (
    <article className="cf-card cf-grid-item cf-special">
      {header}
      <div className="cf-special-body">
        <div className="cf-special-panel">
          <div className="cf-special-banner">{typeTitle}</div>
          {title && <h3 className="cf-special-title">{title}</h3>}
          {image && typeof image === 'string' && (
            <div className="cf-special-img">
              <img src={image} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          {caption && <p className="cf-special-caption">{caption}</p>}
        </div>
      </div>
      {engagement}
    </article>
  );
}

export default memo(SpecialCard);
