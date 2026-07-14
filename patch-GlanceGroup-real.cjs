const fs = require('fs');

const content = `import { memo, Suspense, lazy, useState, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FiList,
  FiPlayCircle,
  FiActivity,
  FiTv,
  FiGift,
  FiUsers,
  FiCalendar,
  FiChevronRight,
  FiBarChart2,
  FiSearch,
  FiX
} from 'react-icons/fi';
import SmartImage from './SmartImage';
import EngagementBar from './EngagementBar';
import LeagueTableCard from './cards/LeagueTableCard';
import MatchStatsCard from './cards/MatchStatsCard';
import FreeBetCard from './cards/FreeBetCard';

const NewsArticleModal = lazy(() => import('./NewsArticleModal'));

const STORY_META = {
  league_table_story: { label: 'League Table', Icon: FiList },
  highlights_detail_story: { label: 'Highlights', Icon: FiPlayCircle },
  live_score_story: { label: 'Live Scores', Icon: FiActivity },
};

const PROMO_META = {
  streamhd: { label: 'Watch in HD', Icon: FiTv },
  freebet: { label: 'Free Bet', Icon: FiGift },
  choose_playing_11: { label: 'Pick Your XI', Icon: FiUsers },
  fixtures: { label: 'Fixtures', Icon: FiCalendar },
  invite_friends: { label: 'Invite Friends', Icon: FiUsers },
};

/* ── At a Glance: full-width news list ──────────────────────── */
function AtAGlanceCard({ articles, onOpen, dedupeId, eng }) {
  const [featuredIdx, setFeaturedIdx] = useState(0);
  if (!articles.length) return null;
  const featured = articles[featuredIdx] || articles[0];

  return (
    <section className="cf-card cf-aag cf-grid-item">
      <header className="cf-aag-head">
        <span className="cf-aag-kicker">At a glance</span>
      </header>

      <button type="button" className="cf-aag-featured" onClick={() => onOpen && onOpen(featured)}>
        {featured.image && (
          <span className="cf-aag-featured-img">
            <SmartImage src={featured.image} alt={featured.title} label={featured.source} />
          </span>
        )}
        <span className="cf-aag-featured-src">{featured.source}</span>
        <span className="cf-aag-featured-title">{featured.title}</span>
      </button>

      <ul className="cf-aag-list">
        {articles.map((a, i) => (
          <li key={a.id || i}>
            <button
              type="button"
              className={\`cf-aag-item\${i === featuredIdx ? ' active' : ''}\`}
              onClick={() => setFeaturedIdx(i)}
              onDoubleClick={() => onOpen && onOpen(a)}
            >
              {a.image && (
                <span className="cf-aag-thumb">
                  <SmartImage src={a.image} alt={a.title} label={a.source} />
                </span>
              )}
              <span className="cf-aag-text">
                <span className="cf-aag-title">{a.title}</span>
                <span className="cf-aag-src">{a.source}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

/* ── Top Scorers / Tacklers: full-width bar chart ───────────── */
function ScorersCard({ tile, dedupeId, eng }) {
  const players = tile.players || [];
  if (!players.length) return null;
  const rawStat = players[0].statName || (tile.statType === 'goals' ? 'Goals' : 'Tackles');
  const statLabel = rawStat ? rawStat.charAt(0).toUpperCase() + rawStat.slice(1) : 'Stat';
  const season = players[0].season;
  const top = players.slice(0, 5);

  return (
    <section className="cf-card cf-tops cf-grid-item">
      <header className="cf-tops-head">
        <span className="cf-tops-kicker">Top {top.length}</span>
        <span className="cf-tops-title">{statLabel}</span>
        {season ? <span className="cf-tops-season">{season}</span> : null}
      </header>

      <div className="cf-tops-cols">
        <span>Apps</span>
        <span>{statLabel}</span>
        <span>Player</span>
        <span aria-hidden="true" />
      </div>

      <ol className="cf-tops-list">
        {top.map((p, i) => (
          <li className="cf-tops-row" key={\`\${p.name}-\${i}\`}>
            <span className="cf-tops-apps">{p.apps != null ? p.apps : '—'}</span>
            <span className="cf-tops-val">{p.value != null ? p.value : '—'}</span>
            <span className="cf-tops-name">{p.name}</span>
            <span className="cf-tops-face">
              <SmartImage src={p.image} alt={p.name} label={p.name} contain />
            </span>
          </li>
        ))}
      </ol>
      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

/* ── Player Ratings: match score + rated players ────────────── */
function ratingTier(r) {
  if (r >= 8) return 'hi';
  if (r >= 7) return 'mid';
  if (r >= 6) return 'low';
  return 'min';
}

function buildFormationRows(players, formation) {
  if (!players.length) return null;
  const digits = String(formation || '')
    .split(/[^0-9]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => n > 0);
  if (!digits.length) return null;
  const rows = [[players[0]]]; // keeper first
  let idx = 1;
  for (const count of digits) {
    const row = [];
    for (let j = 0; j < count && idx < players.length; j += 1) {
      row.push(players[idx]);
      idx += 1;
    }
    if (row.length) rows.push(row);
  }
  return rows.reverse(); // attackers at the top, keeper at the bottom
}

function RatingsCard({ tile, dedupeId, eng }) {
  const m = tile.match || {};
  const players = (tile.players || []).filter((p) => p.rating != null);
  const rows = buildFormationRows(players, tile.formation);
  const avg = players.length
    ? (players.reduce((s, p) => s + Number(p.rating || 0), 0) / players.length).toFixed(1)
    : null;
  const motm = players.reduce((b, p) => (!b || p.rating > b.rating ? p : b), null);

  return (
    <section className="cf-card cf-rp cf-grid-item">
      <header className="cf-rp-head">
        <span className="cf-rp-label">Player Ratings</span>
        {tile.formation ? <span className="cf-rp-formation">{tile.formation}</span> : null}
      </header>

      {(m.homeTitle || m.awayTitle) && (
        <div className="cf-rp-score">
          <span className="cf-rp-team">
            <span className="cf-rp-crest">
              <SmartImage src={m.homeImg} alt={m.homeTitle} label={m.homeTitle} contain />
            </span>
            <span className="cf-rp-tname">{m.homeTitle}</span>
          </span>
          <span className="cf-rp-nums">
            {m.homeScore != null ? m.homeScore : '-'}
            <span className="cf-rp-dash">–</span>
            {m.awayScore != null ? m.awayScore : '-'}
          </span>
          <span className="cf-rp-team cf-rp-team-right">
            <span className="cf-rp-tname">{m.awayTitle}</span>
            <span className="cf-rp-crest">
              <SmartImage src={m.awayImg} alt={m.awayTitle} label={m.awayTitle} contain />
            </span>
          </span>
        </div>
      )}

      {rows ? (
        <div className="cf-rp-pitch">
          {rows.map((row, ri) => (
            <div className="cf-rp-row" key={ri}>
              {row.map((p, pi) => (
                <span className="cf-rp-player" key={p.id || \`\${ri}-\${pi}\`}>
                  <span className={\`cf-rp-shirt tier-\${ratingTier(p.rating)}\`}>{p.rating}</span>
                  <span className="cf-rp-name">
                    {p.goals > 0 ? '⚽ ' : ''}
                    {p.lastName || p.name}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        players.length > 0 && (
          <ul className="cf-ratings2-list">
            {players
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 5)
              .map((p) => (
                <li className="cf-ratings2-row" key={p.id || p.name}>
                  <span className="cf-ratings2-face">
                    <SmartImage src={p.image} alt={p.name} label={p.name} contain />
                  </span>
                  <span className="cf-ratings2-name">{p.name}</span>
                  {p.goals > 0 && <span className="cf-ratings2-goals">⚽ {p.goals}</span>}
                  <span className={\`cf-ratings2-badge tier-\${ratingTier(p.rating)}\`}>
                    {p.rating}
                  </span>
                </li>
              ))}
          </ul>
        )
      )}

      {(avg || motm) && (
        <div className="cf-rp-foot">
          {avg ? (
            <span className="cf-rp-stat">
              <span className="cf-rp-stat-k">Avg</span>
              <span className="cf-rp-stat-v">{avg}</span>
            </span>
          ) : null}
          {motm ? (
            <span className="cf-rp-stat">
              <span className="cf-rp-stat-k">MOTM</span>
              <span className="cf-rp-stat-v">{motm.lastName || motm.name}</span>
            </span>
          ) : null}
        </div>
      )}

      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

/* ── Interactive / Vote: community suggestions ──────────────── */
function VoteCard({ tile, dedupeId, eng }) {
  const ranked = tile.ranked || [];
  const players = tile.players || [];

  return (
    <section className="cf-card cf-tg cf-grid-item">
      <header className="cf-tg-head">
        {tile.sourceImg && (
          <span className="cf-tg-avatar">
            <SmartImage src={tile.sourceImg} alt={tile.source} label={tile.source} contain />
          </span>
        )}
        <span className="cf-tg-kicker">{tile.source || 'Interactive'}</span>
      </header>

      <p className="cf-tg-title">{tile.question || 'Cast your vote'}</p>

      <div className="cf-tg-search" aria-hidden="true">
        <FiSearch size={14} />
        <span>Search players</span>
      </div>

      {ranked.length > 0 && (
        <div className="cf-tg-faces">
          {ranked.slice(0, 8).map((r, i) => (
            <span className="cf-tg-face" key={i}>
              <SmartImage src={r.image} alt="" label="" contain />
              {r.rank ? <span className="cf-tg-rank">{r.rank}</span> : null}
            </span>
          ))}
        </div>
      )}

      {players.length > 0 && (
        <ul className="cf-tg-list">
          {players.slice(0, 6).map((p, i) => (
            <li className="cf-tg-row" key={i}>
              <span className="cf-tg-idx">{i + 1}</span>
              <span className="cf-tg-pname">{p.title || p.lastName}</span>
              {p.lastName && p.title ? <span className="cf-tg-pmeta">{p.lastName}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <footer className="cf-tg-foot">
        {tile.comments ? \`\${tile.comments.toLocaleString()} votes\` : 'Join the discussion'}
      </footer>
      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

// ── Dummy cards for empty/CTA tiles in the grid ────────────────
function DummyHighlights() {
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <header className="cf-dummy-head">
        <span className="cf-dummy-banner cf-dummy-hl-banner">HIGHLIGHTS</span>
      </header>
      <div className="cf-dummy-sub">Last Match</div>
      <div className="cf-dummy-hl-img">
        <div className="cf-dummy-hl-bg" />
        <FiPlayCircle size={40} color="#fff" />
      </div>
    </section>
  );
}

function DummyWatchLive() {
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <header className="cf-dummy-head">
        <span className="cf-dummy-banner cf-dummy-live-banner">WATCH LIVE</span>
      </header>
      <div className="cf-dummy-live-date">Sun 24th, 8:00 pm</div>
      <div className="cf-dummy-live-teams">
        <div className="cf-dummy-live-team">
          <img src="https://cdn.sportmonks.com/images/soccer/teams/19/51.png" alt="" />
          <span>15th</span>
        </div>
        <div className="cf-dummy-live-vs">VS</div>
        <div className="cf-dummy-live-team">
          <img src="https://cdn.sportmonks.com/images/soccer/teams/19/19.png" alt="" />
          <span>1st</span>
        </div>
      </div>
    </section>
  );
}

function DummyGeneric({ title }) {
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <h3 className="cf-dummy-title">{title}</h3>
    </section>
  );
}

function GridTileRenderer({ tile, dedupeId, eng, onOpenArticle }) {
  if (tile.tileType === 'news' && tile.article) {
    return <AtAGlanceCard articles={[tile.article]} onOpen={onOpenArticle} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'leagueTable') {
    return <LeagueTableCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'topScorers') {
    return <ScorersCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'playerRatings') {
    return (
      <Fragment>
        <RatingsCard tile={tile} dedupeId={dedupeId} eng={eng} />
        <MatchStatsCard tile={tile} dedupeId={\`\${dedupeId}:stats\`} eng={eng} />
      </Fragment>
    );
  }
  if (tile.tileType === 'vote') {
    return <VoteCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'promo' && tile.promoType === 'freebet') {
    return <FreeBetCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.storyType === 'highlights_detail_story') return <DummyHighlights />;
  if (tile.storyType === 'live_score_story') return <DummyWatchLive />;
  
  return <DummyGeneric title={tile.storyType || tile.promoType || 'Story'} />;
}

// ── Single Card Modal View (White Fullscreen) ────────────────
function SingleStoryViewer({ tile, onClose, eng }) {
  const [openArticle, setOpenArticle] = useState(null);
  
  const dedupeId = \`glance-story:\${tile?.key}\`;
  const CardContent = <GridTileRenderer tile={tile} dedupeId={dedupeId} eng={eng} onOpenArticle={setOpenArticle} />;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="cf-modal-white-overlay">
      <div className="cf-modal-white-content">
        <div className="cf-modal-white-inner">
          {CardContent}
        </div>
      </div>
      
      <div className="cf-modal-white-footer">
        <button className="cf-modal-white-close-btn" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>
      
      {openArticle && (
        <Suspense fallback={null}>
          <NewsArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
        </Suspense>
      )}
    </div>,
    document.body
  );
}

function GlanceGroup({ item, onComment, onShare, onReport }) {
  const [storyIndex, setStoryIndex] = useState(null);
  const tiles = item.tiles || [];
  if (!tiles.length) return null;

  const eng = { onComment, onShare, onReport };

  return (
    <>
      <div className="cf-match-hub-grid">
        {tiles.map((t, i) => (
          <div key={t.key} className="cf-grid-cell-wrap" onClick={() => setStoryIndex(i)}>
            <div className="cf-grid-cell-overlay" />
            <GridTileRenderer tile={t} dedupeId={\`glance:\${item.dedupeId}:\${t.key}\`} eng={eng} onOpenArticle={() => setStoryIndex(i)} />
          </div>
        ))}
      </div>

      {storyIndex !== null && (
        <SingleStoryViewer
          tile={tiles[storyIndex]}
          onClose={() => setStoryIndex(null)}
          eng={eng}
        />
      )}
    </>
  );
}

export default memo(GlanceGroup);
`;

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched GlanceGroup to use real cards in grid');
