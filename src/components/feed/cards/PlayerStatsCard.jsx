import { memo, useState } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';
import { timeAgo } from '../../../lib/feed/formatTime';
import { readLocalComments, writeLocalComments, makeLocalComment } from '../../../lib/localComments';

const THOUGHTS = ['Underrated', 'Overrated', 'Key player', 'Improve'];

/** 13 -> "13th", 22 -> "22nd", 263 -> "263rd". Passes through non-numbers. */
function ordinal(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return n == null ? '-' : String(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return `${num}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/**
 * PlayerStatsCard — the club_highest_goals_player design: a player hero with
 * Summary/Defensive/Offensive/Passing tabs, and per-metric value + club/league
 * ranking columns. Bound 1:1 to the live feed payload.
 */
function PlayerStatsCard({ item, onComment, onShare, onReport }) {
  const tabs = item.tabs || [];
  const [active, setActive] = useState(0);
  const [vote, setVote] = useState(null);
  const [thought, setThought] = useState('');
  const [posted, setPosted] = useState(false);
  const p = item.player || {};
  const canPost = !!vote || thought.trim().length > 0;
  const submitThought = () => {
    if (!canPost) return;
    // Compose "<pill> — <custom>" and post it as a real (local) comment so it
    // shows up in the comments sheet, then open the sheet.
    const parts = [];
    if (vote) parts.push(vote);
    if (thought.trim()) parts.push(thought.trim());
    const itemId = String(item.dedupeId);
    writeLocalComments(itemId, [
      makeLocalComment({ body: parts.join(' — '), attachments: [], parentId: null }),
      ...readLocalComments(itemId),
    ]);
    setPosted(true);
    setThought('');
    setVote(null);
    if (onComment) onComment();
  };
  const rows = (tabs[active] && tabs[active].rows) || [];
  const meta = [p.age, p.height, p.position].filter(Boolean).join(' | ');

  return (
    <article className="cf-card cf-ps2 cf-grid-item">
      <header className="cf-card-head">
        <span className="cf-avatar">
          <SmartImage src={item.sourceImg} alt={item.source} label={item.source} contain />
        </span>
        <div className="cf-head-meta">
          <span className="cf-source">{item.source}</span>
          <span className="cf-time">{timeAgo(item.timestamp, item.createdAt)}</span>
        </div>
      </header>

      <div className="cf-ps2-hero">
        <span className="cf-ps2-photo">
          <SmartImage src={p.image} alt={p.name} label={p.name} contain />
        </span>
        <span className="cf-ps2-id">
          <span className="cf-ps2-name">{p.name}</span>
          {meta ? <span className="cf-ps2-meta">{meta}</span> : null}
        </span>
      </div>

      <div className="cf-ps2-tabs">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            className={`cf-ps2-tab${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cf-ps2-table">
        <div className="cf-ps2-row cf-ps2-colhead">
          <span className="cf-ps2-stat" />
          <span className="cf-ps2-val" />
          <span className="cf-ps2-pos">
            <SmartImage src={item.clubLogo} alt="Club" label="C" contain />
          </span>
          <span className="cf-ps2-pos">
            <SmartImage src={item.leagueLogo} alt="League" label="L" contain />
          </span>
        </div>
        {rows.map((r, i) => (
          <div className="cf-ps2-row" key={i}>
            <span className="cf-ps2-stat">{r.label}</span>
            <span className="cf-ps2-val">{r.value}</span>
            <span className="cf-ps2-pos">
              {r.clubPos != null && r.clubPos !== '-' ? ordinal(r.clubPos) : '-'}
            </span>
            <span className="cf-ps2-pos">
              {r.leaguePos != null && r.leaguePos !== '-' ? ordinal(r.leaguePos) : '-'}
            </span>
          </div>
        ))}
      </div>

      <div className="cf-ps2-thoughts">
        <span className="cf-ps2-thoughts-t">Your thoughts?</span>
        <div className="cf-ps2-pills">
          {THOUGHTS.map((t) => (
            <button
              key={t}
              type="button"
              className={`cf-ps2-pill${vote === t ? ' active' : ''}`}
              onClick={() => {
                setVote((v) => (v === t ? null : t));
                setPosted(false);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="cf-ps2-compose">
          <input
            className="cf-ps2-input"
            type="text"
            placeholder={vote ? `Add to “${vote}”…` : 'Add your own thought…'}
            value={thought}
            onChange={(e) => {
              setThought(e.target.value);
              setPosted(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitThought();
            }}
          />
          <button
            type="button"
            className="cf-ps2-postbtn"
            disabled={!canPost}
            onClick={submitThought}
          >
            Post
          </button>
        </div>

        {posted ? <span className="cf-ps2-posted">✓ Shared to comments</span> : null}
      </div>

      <EngagementBar
        id={item.dedupeId}
        dedupeId={item.dedupeId}
        onComment={onComment}
        onShare={onShare}
        onReport={onReport}
        localOnly
      />
    </article>
  );
}

export default memo(PlayerStatsCard);
