const fs = require('fs');

const content = `import { memo, Suspense, lazy, useState, Fragment, useEffect } from 'react';
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
    <section className="cf-card cf-aag">
      <header className="cf-aag-head">
        <span className="cf-aag-kicker">At a glance</span>
      </header>

      <button type="button" className="cf-aag-featured" onClick={() => onOpen(featured)}>
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
              onDoubleClick={() => onOpen(a)}
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
    <section className="cf-card cf-tops">
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
    <section className="cf-card cf-rp">
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
    <section className="cf-card cf-tg">
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

// ── Fullscreen Story Viewer for Glance Tiles ────────────────
function GlanceStoryViewer({ tiles, initialIndex, onClose, eng }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);
  
  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [activeIndex]);

  useEffect(() => {
    if (paused || openArticle) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (activeIndex < tiles.length - 1) {
            setActiveIndex(activeIndex + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return p + (100 / 80); // 8 second duration
      });
    }, 100);
    return () => clearInterval(interval);
  }, [paused, openArticle, activeIndex, tiles.length, onClose]);

  const handleNext = () => {
    if (activeIndex < tiles.length - 1) setActiveIndex(activeIndex + 1);
    else onClose();
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleTap = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    const pct = e.clientX / window.innerWidth;
    if (pct < 0.3) handlePrev();
    else handleNext();
  };

  const activeTile = tiles[activeIndex];
  let CardContent = null;
  const dedupeId = \`glance-story:\${activeTile?.key}\`;
  
  if (activeTile) {
    if (activeTile.tileType === 'news' && activeTile.article) {
      CardContent = <AtAGlanceCard articles={[activeTile.article]} onOpen={setOpenArticle} dedupeId={dedupeId} eng={eng} />;
    } else if (activeTile.tileType === 'leagueTable') {
      CardContent = <LeagueTableCard tile={activeTile} dedupeId={dedupeId} eng={eng} />;
    } else if (activeTile.tileType === 'topScorers') {
      CardContent = <ScorersCard tile={activeTile} dedupeId={dedupeId} eng={eng} />;
    } else if (activeTile.tileType === 'playerRatings') {
      CardContent = (
        <Fragment>
          <RatingsCard tile={activeTile} dedupeId={dedupeId} eng={eng} />
          <MatchStatsCard tile={activeTile} dedupeId={\`\${dedupeId}:stats\`} eng={eng} />
        </Fragment>
      );
    } else if (activeTile.tileType === 'vote') {
      CardContent = <VoteCard tile={activeTile} dedupeId={dedupeId} eng={eng} />;
    } else if (activeTile.tileType === 'promo' && activeTile.promoType === 'freebet') {
      CardContent = <FreeBetCard tile={activeTile} dedupeId={dedupeId} eng={eng} />;
    } else {
      CardContent = (
        <div className="cf-card cf-story-fallback">
          <h3>{activeTile.storyType || activeTile.promoType || 'Story'}</h3>
          <p>Swipe to continue</p>
        </div>
      );
    }
  }

  return (
    <div className="cf-story-overlay">
      <div className="cf-story-progress-container">
        {tiles.map((t, i) => (
          <div key={i} className="cf-story-progress-bar">
            <div className="cf-story-progress-fill" style={{ width: i < activeIndex ? "100%" : i === activeIndex ? \`\${progress}%\` : "0%" }} />
          </div>
        ))}
      </div>
      
      <button className="cf-story-close-btn" onClick={onClose}>
        <FiX size={18} />
      </button>

      <div 
        className="cf-story-tap-zone"
        onClick={handleTap}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        <div className="cf-story-content-wrap">
          {CardContent}
        </div>
      </div>
      
      {openArticle && (
        <Suspense fallback={null}>
          <NewsArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
        </Suspense>
      )}
    </div>
  );
}

function GlanceGroup({ item, onComment, onShare, onReport }) {
  const [storyIndex, setStoryIndex] = useState(null);
  const tiles = item.tiles || [];
  if (!tiles.length) return null;

  const eng = { onComment, onShare, onReport };

  const getTileMeta = (t) => {
    if (t.tileType === 'news') return { label: 'Latest News', Icon: FiList };
    if (t.tileType === 'leagueTable') return { label: 'League Table', Icon: FiList };
    if (t.tileType === 'topScorers') return { label: 'Top Scorers', Icon: FiBarChart2 };
    if (t.tileType === 'playerRatings') return { label: 'Match Lineup & Ratings', Icon: FiUsers };
    if (t.tileType === 'vote') return { label: 'Fan Vote', Icon: FiActivity };
    if (t.tileType === 'story') return STORY_META[t.storyType] || { label: 'Match Details', Icon: FiPlayCircle };
    if (t.tileType === 'promo') return PROMO_META[t.promoType] || { label: 'Offer', Icon: FiGift };
    return { label: 'Match Hub', Icon: FiPlayCircle };
  };

  return (
    <>
      <div className="cf-match-hub-card">
        <header className="cf-match-hub-head">
          <span className="cf-source">Match Hub</span>
        </header>
        <div className="cf-match-hub-grid">
          {tiles.map((t, i) => {
            const meta = getTileMeta(t);
            const Icon = meta.Icon;
            return (
              <button key={t.key} className="cf-tile cf-tile-cta" onClick={() => setStoryIndex(i)}>
                <span className="cf-tile-ic">
                  <Icon size={20} />
                </span>
                <span className="cf-tile-label">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {storyIndex !== null && (
        <GlanceStoryViewer
          tiles={tiles}
          initialIndex={storyIndex}
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
console.log('Fixed GlanceGroup.jsx entirely');
