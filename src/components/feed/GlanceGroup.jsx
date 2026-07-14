import { memo, Suspense, lazy, useState, Fragment, useEffect } from 'react';
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
import SpecialCard from './cards/SpecialCard';
import PlayerComparisonCard from './cards/PlayerComparisonCard';
import PlayerStatsCard from './cards/PlayerStatsCard';
import FixturesCard from './cards/FixturesCard';

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
export function AtAGlanceCard({ articles, onOpen, dedupeId, eng }) {
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
              className={`cf-aag-item${i === featuredIdx ? ' active' : ''}`}
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
export function ScorersCard({ tile, dedupeId, eng }) {
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
          <li className="cf-tops-row" key={`${p.name}-${i}`}>
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

export function RatingsCard({ tile, dedupeId, eng }) {
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
                <span className="cf-rp-player" key={p.id || `${ri}-${pi}`}>
                  <span className={`cf-rp-shirt tier-${ratingTier(p.rating)}`}>{p.rating}</span>
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
                  <span className={`cf-ratings2-badge tier-${ratingTier(p.rating)}`}>
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
export function VoteCard({ tile, dedupeId, eng }) {
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
        {tile.comments ? `${tile.comments.toLocaleString()} votes` : 'Join the discussion'}
      </footer>
      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

// ── Promo Tiles ────────────────────────────────────────────────
function PromoStreamHD() {
  return (
    <section className="cf-card cf-grid-item cf-promo-card cf-promo-stream">
      <div className="cf-promo-banner">WATCH LIVE</div>
      <div className="cf-promo-icon"><FiTv size={28} /></div>
      <div className="cf-promo-sub">Stream HD</div>
      <p className="cf-promo-desc">Watch every match in stunning HD quality. Never miss a moment.</p>
      <button className="cf-promo-btn">Stream Now</button>
    </section>
  );
}

function PromoFixtures() {
  const upcoming = [
    { home: 'Crystal Palace', away: 'Arsenal', time: 'Sun 24th 8pm' },
    { home: 'Liverpool', away: 'Man City', time: 'Mon 25th 7:30pm' },
    { home: 'Chelsea', away: 'Spurs', time: 'Tue 26th 7:45pm' },
  ];
  return (
    <section className="cf-card cf-grid-item cf-promo-card cf-promo-fixtures">
      <div className="cf-promo-banner"><FiCalendar size={11} style={{marginRight:4}} />FIXTURES</div>
      <ul className="cf-promo-fx-list">
        {upcoming.map((f, i) => (
          <li key={i} className="cf-promo-fx-row">
            <span className="cf-promo-fx-team">{f.home}</span>
            <span className="cf-promo-fx-vs">vs</span>
            <span className="cf-promo-fx-team right">{f.away}</span>
            <span className="cf-promo-fx-time">{f.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PromoInviteFriends() {
  return (
    <section className="cf-card cf-grid-item cf-promo-card cf-promo-invite">
      <div className="cf-promo-banner">INVITE FRIENDS</div>
      <div className="cf-promo-icon"><FiUsers size={28} /></div>
      <p className="cf-promo-desc">Share the app with friends and get exclusive rewards together.</p>
      <button className="cf-promo-btn">Invite Now</button>
    </section>
  );
}

// ── Dummy cards for empty/CTA tiles in the grid ────────────────
function DummyHighlights() {
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <header className="cf-dummy-head">
        <span className="cf-dummy-banner">HIGHLIGHTS</span>
      </header>
      <div className="cf-dummy-sub">Last Match</div>
      <div className="cf-dummy-hl-img">
        <div className="cf-dummy-hl-bg" />
        <FiPlayCircle size={22} color="#fff" />
      </div>
    </section>
  );
}

function DummyWatchLive() {
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <header className="cf-dummy-head">
        <span className="cf-dummy-banner">WATCH LIVE</span>
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
  const label = title ? String(title).replace(/_/g, ' ').replace(/story$/i, '').trim() : 'More';
  return (
    <section className="cf-card cf-grid-item cf-dummy-card">
      <div className="cf-dummy-generic-inner">
        <span className="cf-dummy-generic-icon">📰</span>
        <span className="cf-dummy-generic-label">{label}</span>
        <span className="cf-dummy-generic-cta">Tap to view</span>
      </div>
    </section>
  );
}

function GridTileRenderer({ tile, dedupeId, eng, onOpenArticle, isExpanded }) {
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
        <MatchStatsCard tile={tile} dedupeId={`${dedupeId}:stats`} eng={eng} />
      </Fragment>
    );
  }
  if (tile.tileType === 'vote') {
    return <VoteCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'promo' && tile.promoType === 'freebet') {
    return <FreeBetCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'promo' && tile.promoType === 'streamhd') {
    if (isExpanded) {
      return (
        <section className="cf-card cf-stream-details-expanded" style={{ padding: '24px 16px', background: '#fff', height: '100%' }}>
          <header className="cf-card-head" style={{ marginBottom: 16 }}>
            <span className="cf-source" style={{ fontWeight: 800, color: '#0a1f6b' }}>Live Stream</span>
          </header>
          <div className="cf-stream-player-mock" style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800" alt="Live Match" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            <div className="cf-stream-play-overlay" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#fff' }}>
              <FiPlayCircle size={64} color="#fff" />
              <span style={{ fontWeight: 900, letterSpacing: 0.5 }}>PLAY STREAM (HD)</span>
            </div>
          </div>
          <div className="cf-stream-info">
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0b1b3a', marginBottom: 8 }}>Crystal Palace vs Arsenal</h3>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#5a6b8c', marginBottom: 4 }}>English Premier League · Selhurst Park</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Broadcast Quality: 1080p 60fps · Stereo 2.0</p>
          </div>
        </section>
      );
    }
    return <PromoStreamHD />;
  }
  if (tile.tileType === 'promo' && tile.promoType === 'fixtures') {
    if (isExpanded) {
      return <FixturesCard item={tile} onComment={eng.onComment} onShare={eng.onShare} onReport={eng.onReport} />;
    }
    return <PromoFixtures />;
  }
  if (tile.tileType === 'promo' && (tile.promoType === 'invite_friends' || tile.promoType === 'choose_playing_11')) {
    if (isExpanded) {
      return (
        <section className="cf-card cf-invite-expanded" style={{ padding: '24px 16px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <FiUsers size={72} color="#0e4d29" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0b1b3a', marginBottom: 12, textAlign: 'center' }}>Invite Your Friends</h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#5a6b8c', textAlign: 'center', marginBottom: 24, lineHeight: 1.5, padding: '0 16px' }}>
            Bring your friends to Social442 and track live matches, share reactions, and discuss game stats together!
          </p>
          <div className="cf-invite-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <input type="text" readOnly value="https://social442.com/invite/ref-98432" style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #e6e9f0', fontSize: 12, fontWeight: 700, color: '#0b1b3a', background: '#f8f9fa', textAlign: 'center' }} />
            <button style={{ background: '#0e4d29', color: '#fff', padding: '10px 24px', borderRadius: 20, border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }} onClick={() => alert('Link copied to clipboard!')}>Copy Invite Link</button>
          </div>
        </section>
      );
    }
    return <PromoInviteFriends />;
  }

  if (tile.tileType === 'playerComparison') {
    return <PlayerComparisonCard item={tile} onComment={eng.onComment} onShare={eng.onShare} onReport={eng.onReport} />;
  }
  if (tile.tileType === 'playerStats') {
    return <PlayerStatsCard item={tile} onComment={eng.onComment} onShare={eng.onShare} onReport={eng.onReport} />;
  }
  if (tile.tileType === 'fixtures') {
    return <FixturesCard item={tile} onComment={eng.onComment} onShare={eng.onShare} onReport={eng.onReport} />;
  }

  if (tile.tileType === 'generic') {
    const specialItem = {
      dedupeId,
      rawData: tile.data || {},
      postType: tile.rawType,
      source: tile.source || 'Social442',
      sourceImg: tile.sourceImg || null,
      createdAt: tile.createdAt || null,
      timestamp: tile.timestamp || Date.now(),
    };
    return <SpecialCard item={specialItem} onComment={eng.onComment} onShare={eng.onShare} onReport={eng.onReport} />;
  }
  if (tile.storyType === 'highlights_detail_story') return <DummyHighlights />;
  if (tile.storyType === 'live_score_story') return <DummyWatchLive />;

  return <DummyGeneric title={tile.storyType || tile.promoType || tile.tileType || 'Story'} />;
}

// ── Single Card Modal View (White Fullscreen) ────────────────
function SingleStoryViewer({ tile, onClose, eng }) {
  const [openArticle, setOpenArticle] = useState(null);
  
  const dedupeId = `glance-story:${tile?.key}`;
  const CardContent = <GridTileRenderer tile={tile} dedupeId={dedupeId} eng={eng} onOpenArticle={setOpenArticle} isExpanded={true} />;

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
  const tiles = (item.tiles || []).slice(0, 6);
  if (!tiles.length) return null;

  const eng = { onComment, onShare, onReport };

  return (
    <>
      <div className="cf-match-hub-grid">
        {tiles.map((t, i) => (
          <div key={t.key} className="cf-grid-cell-wrap" onClick={() => setStoryIndex(i)}>
            <div className="cf-grid-cell-overlay" />
            <GridTileRenderer tile={t} dedupeId={`glance:${item.dedupeId}:${t.key}`} eng={eng} onOpenArticle={() => setStoryIndex(i)} />
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
