import { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiSend, FiPlay } from 'react-icons/fi';
import './StoryViewer.css';

const QUICK_REACTIONS = ['⚽', '🔥', '😂', '😮', '👏', '🏆'];
const DURATION_MS = 8000;

// ── Next Match Card ────────────────────────────────────────────
function NextMatchCard({ data }) {
  if (!data) return null;
  const matchDate = new Date(data.dateTime);
  const formatted = matchDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="sv-card sv-card--next-match">
      {/* Header */}
      <div className="sv-nm-header-simple">
        <span className="sv-nm-league-title">{data.league}</span>
        <span className="sv-nm-datetime-simple">{formatted} · {time}</span>
      </div>

      {/* Split screen */}
      <div className="sv-nm-split" style={{ '--home-color': data.homeColor, '--away-color': data.awayColor }}>
        {/* HOME */}
        <div className="sv-nm-side sv-nm-side--home" style={{ background: data.homeColor }}>
          <img src={data.homeLogo} alt={data.homeClub} className="sv-nm-watermark" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="sv-nm-club-info-center">
            <img src={data.homeLogo} alt="" className="sv-nm-logo-large" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="sv-nm-club-name">{data.homeClub}</span>
            <span className="sv-nm-position">{data.homePosition}TH</span>
          </div>
        </div>

        {/* VS badge */}
        <div className="sv-nm-center-simple">
          <span className="sv-nm-vs-text">VS</span>
        </div>

        {/* AWAY */}
        <div className="sv-nm-side sv-nm-side--away" style={{ background: data.awayColor || '#F0F0F0' }}>
          <img src={data.awayLogo} alt={data.awayClub} className="sv-nm-watermark" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="sv-nm-club-info-center">
            <img src={data.awayLogo} alt="" className="sv-nm-logo-large" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="sv-nm-club-name" style={{ color: data.awayColor === '#F0F0F0' ? '#111' : '#fff' }}>{data.awayClub}</span>
            <span className="sv-nm-position" style={{ color: data.awayColor === '#F0F0F0' ? '#444' : 'rgba(255,255,255,0.7)' }}>{data.awayPosition}ST</span>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="sv-nm-footer">
        <button className="sv-nm-btn sv-nm-btn--notify">ENABLE NOTIFICATION 🔔</button>
        <button className="sv-nm-btn sv-nm-btn--watch">WATCH LIVE</button>
      </div>
    </div>
  );
}

// ── Next Match Stats Card ──────────────────────────────────────
function NextMatchStatsCard({ data }) {
  if (!data) return null;
  return (
    <div className="sv-card sv-card--next-match-stats">
      <div className="sv-nms-header">
        <span className="sv-nms-title">TOP SCORERS</span>
      </div>
      <div className="sv-nm-split" style={{ '--home-color': data.homeColor, '--away-color': data.awayColor }}>
        {/* HOME */}
        <div className="sv-nm-side sv-nm-side--home" style={{ background: data.homeColor }}>
          <img src={data.homeLogo} alt="" className="sv-nm-watermark" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="players_stats_container">
            {data.homeTopScorers?.map((p, i) => (
              <div key={i} className="sv-nm-player-row">
                <img src={p.image} alt={p.name} className="sv-nm-player-photo" onError={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.src = ''; }} />
                <span className="sv-nm-player-name">{p.name.split(' ').slice(-1)[0]}</span>
                <span className="sv-nm-player-goals">{p.goals}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className="sv-nms-divider"></div>

        {/* AWAY */}
        <div className="sv-nm-side sv-nm-side--away" style={{ background: data.awayColor || '#F0F0F0' }}>
          <img src={data.awayLogo} alt="" className="sv-nm-watermark" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="players_stats_container">
            {data.awayTopScorers?.map((p, i) => (
              <div key={i} className="sv-nm-player-row" style={{ '--text-color': data.awayColor === '#F0F0F0' ? '#111' : '#fff' }}>
                <img src={p.image} alt={p.name} className="sv-nm-player-photo" onError={(e) => { e.target.style.background = 'rgba(0,0,0,0.1)'; e.target.src = ''; }} />
                <span className="sv-nm-player-name" style={{ color: data.awayColor === '#F0F0F0' ? '#111' : '#fff' }}>{p.name.split(' ').slice(-1)[0]}</span>
                <span className="sv-nm-player-goals" style={{ color: data.awayColor === '#F0F0F0' ? '#111' : '#fff' }}>{p.goals}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Player Spotlight Card ──────────────────────────────────────
function PlayerSpotlightCard({ data }) {
  if (!data) return null;
  const [tab, setTab] = useState('stats');

  return (
    <div className="sv-card sv-card--player-spotlight">
      {/* Header */}
      <div className="sv-ps-header">
        <div className="sv-ps-img-wrap">
          <img src={data.image} alt={data.name} className="sv-ps-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="sv-ps-number">#{data.number}</span>
        </div>
        <div className="sv-ps-info">
          <h2 className="sv-ps-name">{data.name}</h2>
          <p className="sv-ps-pos">{data.position}</p>
          <div className="sv-ps-meta">
            <img src={data.countryFlag} alt={data.country} className="sv-ps-flag" onError={(e) => { e.target.style.display = 'none'; }} />
            <span>{data.country}</span>
            <span>·</span>
            <span>{data.height}</span>
            <span>·</span>
            <span>{data.age}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sv-ps-tabs">
        {['stats', 'strengths', 'news'].map((t) => (
          <button key={t} className={`sv-ps-tab ${tab === t ? 'sv-ps-tab--active' : ''}`} onClick={(e) => { e.stopPropagation(); setTab(t); }}>
            {t === 'stats' ? 'Season Stats' : t === 'strengths' ? 'Strengths' : 'News'}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="sv-ps-stats-grid">
          {[
            { label: 'Apps', value: data.appearances },
            { label: 'Goals', value: data.goals },
            { label: 'Assists', value: data.assists },
            { label: 'Minutes', value: data.minutes?.toLocaleString() },
            { label: 'Tackles', value: data.tackles },
            { label: 'Pass Acc.', value: `${data.passAccuracy}%` },
          ].map((s, i) => (
            <div key={i} className="sv-ps-stat-box">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'strengths' && (
        <div className="sv-ps-bars">
          <p className="sv-ps-bar-section-label">💪 Strengths</p>
          {data.strengths?.map((s, i) => (
            <div key={i} className="sv-ps-bar-row">
              <span className="sv-ps-bar-label">{s.label}</span>
              <div className="sv-ps-bar-track">
                <div className="sv-ps-bar-fill sv-ps-bar-fill--strength" style={{ width: `${s.value}%` }} />
              </div>
              <span className="sv-ps-bar-val">{s.value}</span>
            </div>
          ))}
          <p className="sv-ps-bar-section-label" style={{ marginTop: 8 }}>⚠️ Weaknesses</p>
          {data.weaknesses?.map((s, i) => (
            <div key={i} className="sv-ps-bar-row">
              <span className="sv-ps-bar-label">{s.label}</span>
              <div className="sv-ps-bar-track">
                <div className="sv-ps-bar-fill sv-ps-bar-fill--weak" style={{ width: `${s.value}%` }} />
              </div>
              <span className="sv-ps-bar-val">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'news' && data.news && (
        <div className="sv-ps-news">
          <img src={data.news.image} alt="" className="sv-ps-news-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <p className="sv-ps-news-title">{data.news.title.replace(/&#163;/g, '£')}</p>
          <span className="sv-ps-news-date">{new Date(data.news.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      )}
    </div>
  );
}

// ── League Table Card ──────────────────────────────────────────
function LeagueTableFullCard({ data }) {
  if (!data) return null;
  return (
    <div className="sv-card sv-card--table-full">
      <div className="sv-lt-header-new">
        <span className="sv-lt-badge">PREMIER LEAGUE TABLE</span>
        <span className="sv-lt-last-update">Last Updated: 12 Jun, 6:13am</span>
      </div>
      <div className="sv-table sv-table--full">
        <div className="sv-table-header">
          <span className="sv-th-pos">#</span>
          <span className="sv-th-teams">Teams</span>
          <span className="sv-th-col">P</span>
          <span className="sv-th-col">W</span>
          <span className="sv-th-col">D</span>
          <span className="sv-th-col">L</span>
          <span className="sv-th-col">GD</span>
          <span className="sv-th-col">Pts</span>
        </div>
        <div className="sv-table-scroll">
          {data.standings?.map((r, i) => {
            const isHighlight = r.team === data.highlightTeam;
            return (
              <div key={r.team} className={`sv-table-row ${isHighlight ? 'sv-row-highlight' : ''}`}>
                <span className="sv-td-pos">{i + 1}</span>
                <div className="sv-td-team-block">
                  <img src={r.logo} alt={r.team} className="sv-td-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="sv-td-team-name">{r.team}</span>
                </div>
                <span className="sv-td-col">{r.played}</span>
                <span className="sv-td-col">{r.won}</span>
                <span className="sv-td-col">{r.draw}</span>
                <span className="sv-td-col">{r.lost}</span>
                <span className="sv-td-col">{r.gd > 0 ? `+${r.gd}` : r.gd}</span>
                <span className="sv-td-pts-col">{r.pts}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Highlights Card ────────────────────────────────────────────
function HighlightsDetailCard({ data }) {
  if (!data) return null;
  const matchDate = new Date(data.dateTime);
  const formatted = matchDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="sv-card sv-card--highlights-detail">
      <div className="sv-hd-header">
        <h2 className="sv-hd-title-simple">{data.homeTeam.toUpperCase()} VS {data.awayTeam.toUpperCase()}</h2>
        <span className="sv-hd-date-simple">{formatted} · {time}</span>
      </div>

      <div className="sv-hd-branding">
        <span className="sv-hd-badge-art">Highlights</span>
      </div>

      {/* Video Thumbnail */}
      <a href={data.videoLink} target="_blank" rel="noopener noreferrer" className="sv-hd-video-wrap-new" onClick={(e) => e.stopPropagation()}>
        <img src={data.videoThumb} alt="Highlights" className="sv-hd-thumb-new" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="sv-hd-play-overlay">
          <div className="sv-hd-play-btn-circle">
            <FiPlay size={32} className="sv-hd-play-icon-path" />
          </div>
        </div>
      </a>

      {/* Score and Goal scorers timeline */}
      <div className="sv-hd-score-panel">
        <div className="sv-hd-score-large-row">
          <img src={data.homeLogo} alt="" className="sv-hd-logo-new" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="sv-hd-score-vals">
            <span className="sv-hd-score-val-big">{data.homeGoal}</span>
            <span className="sv-hd-score-dash">-</span>
            <span className="sv-hd-score-val-big">{data.awayGoal}</span>
          </div>
          <img src={data.awayLogo} alt="" className="sv-hd-logo-new" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <div className="sv-hd-timeline-simple">
          {data.goals?.sort((a, b) => a.minute - b.minute).map((g, i) => (
            <div key={i} className="sv-hd-timeline-row">
              <span className="sv-hd-timeline-min">{g.minute}'</span>
              <span className="sv-hd-timeline-player">{g.playerName}</span>
              <span className="sv-hd-timeline-side">({g.side === 'home' ? 'CP' : 'ARS'})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Prediction Card ────────────────────────────────────────────
function MatchPredictionCard({ data }) {
  if (!data) return null;
  const [voted, setVoted] = useState(null);

  return (
    <div className="sv-card sv-card--prediction">
      <h2 className="sv-pred-title">Win Probability</h2>

      {/* Donut + percentages */}
      <div className="sv-pred-prob-row">
        <div className="sv-pred-prob-side">
          <span className="sv-pred-big-pct" style={{ color: '#ef4444' }}>{data.homeProbability}%</span>
          <span className="sv-pred-club-label">{data.homeClub}</span>
        </div>
        <div className="sv-pred-donut-wrap">
          <svg viewBox="0 0 80 80" className="sv-pred-donut">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="#3b82f6" strokeWidth="12"
              strokeDasharray={`${(data.awayProbability / 100) * 188.5} 188.5`}
              strokeDashoffset="47.1" strokeLinecap="round" transform="rotate(-90 40 40)" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="#ef4444" strokeWidth="12"
              strokeDasharray={`${(data.homeProbability / 100) * 188.5} 188.5`}
              strokeDashoffset={`${47.1 + (data.awayProbability / 100) * 188.5}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
          </svg>
        </div>
        <div className="sv-pred-prob-side">
          <span className="sv-pred-big-pct" style={{ color: '#3b82f6' }}>{data.awayProbability}%</span>
          <span className="sv-pred-club-label">{data.awayClub}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="sv-pred-stats-grid">
        {[
          { label: 'Wins', home: data.homeWins, away: data.awayWins },
          { label: 'Goals', home: data.homeGoals, away: data.awayGoals },
          { label: 'Conceded', home: data.homeConceded, away: data.awayConceded },
          { label: 'Passing %', home: `${data.homePasses}%`, away: `${data.awayPasses}%` },
        ].map((row, i) => (
          <div key={i} className="sv-pred-stat-card">
            <span className="sv-pred-stat-title">{row.label}</span>
            <div className="sv-pred-stat-bars">
              <div className="sv-pred-stat-bar-row">
                <span className="sv-pred-stat-val">{row.home}</span>
                <div className="sv-pred-bar-track">
                  <div className="sv-pred-bar-fill" style={{ width: `${(Number(row.home) / (Number(row.home) + Number(row.away))) * 100}%`, background: '#ef4444' }} />
                </div>
              </div>
              <div className="sv-pred-stat-bar-row">
                <span className="sv-pred-stat-val">{row.away}</span>
                <div className="sv-pred-bar-track">
                  <div className="sv-pred-bar-fill" style={{ width: `${(Number(row.away) / (Number(row.home) + Number(row.away))) * 100}%`, background: '#3b82f6' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vote */}
      <p className="sv-pred-who">Who will win?</p>
      <div className="sv-pred-vote-row">
        <button className={`sv-pred-vote-btn ${voted === 'home' ? 'sv-pred-vote--active-home' : ''}`} onClick={(e) => { e.stopPropagation(); setVoted('home'); }}>{data.homeClub}</button>
        <button className={`sv-pred-vote-btn ${voted === 'away' ? 'sv-pred-vote--active-away' : ''}`} onClick={(e) => { e.stopPropagation(); setVoted('away'); }}>{data.awayClub}</button>
      </div>
    </div>
  );
}

// ── Stat Leaderboard Card ──────────────────────────────────────
function StatLeaderboardCard({ data }) {
  if (!data) return null;
  const accentColor = data.accentColor || '#60a5fa';

  return (
    <div className="sv-card sv-card--leaderboard">
      <div className="sv-lb-header">
        <span className="sv-lb-title">{data.title}</span>
      </div>
      <div className="sv-lb-list">
        {data.players.map((p, i) => (
          <div key={i} className="sv-lb-row-new">
            <span className="sv-lb-rank-num">{i + 1}</span>
            <img src={p.image} alt={p.name} className="sv-lb-avatar-new" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="sv-lb-name-new">{p.name}</span>
            <img src={p.club} alt="" className="sv-lb-club-new" onError={(e) => { e.target.style.display = 'none'; }} />
            <strong className="sv-lb-val-new" style={{ color: accentColor }}>{p.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Video Reel Card ────────────────────────────────────────────
function VideoReelCard({ data }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const active = data.videos?.[activeIdx];
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [activeIdx]);

  const handleCardClick = (e) => {
    // If clicking close or UI buttons, don't play/pause
    if (e.target.closest('.sv-vr-mute-btn') || e.target.closest('.sv-vr-next-btn')) return;
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleNextVideo = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % (data.videos?.length || 1));
  };

  return (
    <div className="sv-card sv-card--video-reel" onClick={handleCardClick}>
      <video
        ref={videoRef}
        key={active?.link}
        src={active?.link}
        playsInline
        loop
        muted={muted}
        className="sv-vr-video-full"
      />
      
      {/* Video Overlay Info */}
      <div className="sv-vr-overlay-content">
        <div className="sv-vr-source-row">
          <img src={active?.sourceImg} alt="" className="sv-vr-source-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="sv-vr-source-name">{active?.source || 'FootyBants'}</span>
        </div>
        <p className="sv-vr-caption">{active?.title}</p>
      </div>

      {/* Video controls */}
      <div className="sv-vr-controls">
        <button className="sv-vr-mute-btn" onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}>
          {muted ? '🔇 Muted' : '🔊 Sound On'}
        </button>
        {data.videos?.length > 1 && (
          <button className="sv-vr-next-btn" onClick={handleNextVideo}>
            Next Clip ➡️
          </button>
        )}
      </div>
    </div>
  );
}

// ── Ad Card ────────────────────────────────────────────────────
function AdCard({ data }) {
  if (!data) return null;
  return (
    <div className={`sv-card sv-card--ad sv-card--ad-${data.theme}`}>
      <img src={data.bgImage} alt="" className="sv-ad-bg" onError={(e) => { e.target.style.display = 'none'; }} />
      <div className="sv-ad-content">
        <img src={data.logo} alt="" className="sv-ad-logo" onError={(e) => { e.target.style.display = 'none'; }} />
        <h2 className="sv-ad-title" dangerouslySetInnerHTML={{ __html: data.titleHtml }}></h2>
        {data.subtitle && <p className="sv-ad-subtitle">{data.subtitle}</p>}
        {data.steps && (
          <div className="sv-ad-steps">
            {data.steps.map((step, i) => (
              <div key={i} className="sv-ad-step">
                <span className="sv-ad-step-num">{step.num}</span>
                <span className="sv-ad-step-text">{step.text}</span>
              </div>
            ))}
          </div>
        )}
        <button className="sv-ad-btn">{data.buttonText}</button>
        {data.note && <p className="sv-ad-note">{data.note}</p>}
      </div>
    </div>
  );
}

// ── Interactive Poll Card ──────────────────────────────────────
function InteractivePollCard({ data }) {
  if (!data) return null;
  return (
    <div className="sv-card sv-card--interactive-poll">
      <div className="sv-poll-top-bar">
        <div className="sv-poll-comments">
          <span className="sv-poll-comments-icon">💬</span>
          <span className="sv-poll-comments-count">{data.commentsCount} Comments</span>
        </div>
        <div className="sv-poll-mic">🎤</div>
      </div>
      <h2 className="sv-poll-question">{data.question}</h2>
      
      <div className="sv-poll-dropdown">
        <select defaultValue="">
          <option value="" disabled>Choose Player</option>
          <option value="martinelli">Gabriel Martinelli</option>
          <option value="saka">Bukayo Saka</option>
          <option value="saliba">William Saliba</option>
        </select>
      </div>

      <div className="sv-poll-pitch">
        <div className="sv-poll-pitch-line-center"></div>
        <div className="sv-poll-pitch-circle"></div>
        <div className="sv-poll-pitch-box-top"></div>
        <div className="sv-poll-pitch-box-bottom"></div>
        
        <img src={data.centerLogo} alt="" className="sv-poll-center-logo" />

        {/* 11-Man Lineup */}
        {[
          { name: 'Raya', pos: 'GK', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p154561.png', top: '88%', left: '50%' },
          { name: 'White', pos: 'RB', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p198869.png', top: '72%', left: '85%' },
          { name: 'Saliba', pos: 'CB', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p438098.png', top: '75%', left: '65%' },
          { name: 'Gabriel', pos: 'CB', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p226597.png', top: '75%', left: '35%' },
          { name: 'Zinchenko', pos: 'LB', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p210884.png', top: '72%', left: '15%' },
          { name: 'Rice', pos: 'CDM', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p204480.png', top: '56%', left: '50%' },
          { name: 'Ødegaard', pos: 'CM', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p184029.png', top: '42%', left: '70%' },
          { name: 'Havertz', pos: 'CM', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p219847.png', top: '42%', left: '30%' },
          { name: 'Saka', pos: 'RW', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p223340.png', top: '22%', left: '85%' },
          { name: 'Martinelli', pos: 'LW', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p447015.png', top: '22%', left: '15%' },
          { name: 'Jesus', pos: 'ST', img: 'https://resources.premierleague.com/premierleague/photos/players/110x140/p205651.png', top: '15%', left: '50%' }
        ].map(player => (
          <div key={player.name} className="sv-poll-node" style={{ top: player.top, left: player.left }}>
            <img src={player.img} alt={player.name} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${player.name}&background=fff&color=000` }} />
            <div className="sv-poll-player-info">
              <span className="sv-poll-player-name">{player.name}</span>
              <span className="sv-poll-player-pos">{player.pos}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Card Dispatcher ────────────────────────────────────────────
function StoryCard({ story }) {
  const { type, data } = story;
  if (type === 'next_match')        return <NextMatchCard data={data} />;
  if (type === 'next_match_stats')  return <NextMatchStatsCard data={data} />;
  if (type === 'player_spotlight')  return <PlayerSpotlightCard data={data} />;
  if (type === 'league_table_full') return <LeagueTableFullCard data={data} />;
  if (type === 'highlights_detail') return <HighlightsDetailCard data={data} />;
  if (type === 'match_prediction')  return <MatchPredictionCard data={data} />;
  if (type === 'stat_leaderboard')  return <StatLeaderboardCard data={data} />;
  if (type === 'video_reel')        return <VideoReelCard data={data} />;
  if (type === 'ad_card')           return <AdCard data={data} />;
  if (type === 'interactive_poll')  return <InteractivePollCard data={data} />;

  return (
    <div className="sv-card sv-card--default">
      <span className="sv-badge">SOCIAL UPDATE</span>
      <h2 style={{ color: '#fff', padding: 16 }}>{story.label}</h2>
    </div>
  );
}

// ── Main StoryViewer ───────────────────────────────────────────
export default function StoryViewer({ story, storyIndex, totalStories, onClose, onNext, onPrev, hasNext, hasPrev }) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [story?.id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          if (hasNext) onNext(); else onClose();
          return 100;
        }
        return p + (100 / (DURATION_MS / 100));
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [paused, story?.id]);

  if (!story) return null;

  const toast = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 2000); };
  const handleReact = (e) => toast(`Reacted ${e}!`);
  const handleSendReply = (ev) => { ev.preventDefault(); if (!replyText.trim()) return; toast('Reply sent!'); setReplyText(''); };

  const handleScreenTap = (e) => {
    if (e.target.closest('.sv-footer') || e.target.closest('.sv-close-btn') ||
      e.target.closest('.sv-arrow') || e.target.closest('.sv-ps-tabs') ||
      e.target.closest('.sv-pred-vote-row') || e.target.closest('.sv-hd-video-wrap') ||
      e.target.closest('.sv-vr-player') || e.target.closest('.sv-vr-playlist') ||
      e.target.closest('.sv-nm-footer') || e.target.closest('video') || e.target.closest('a')) return;
    const pct = e.clientX / window.innerWidth;
    if (pct < 0.3) { if (hasPrev) onPrev(); }
    else { if (hasNext) onNext(); else onClose(); }
  };

  const headerAvatar = story.avatarUrl
    ? <img src={story.avatarUrl} alt="" className="sv-user-avatar-img" onError={(e) => { e.target.style.display = 'none'; }} />
    : <span>{(story.avatarInitial || story.username || 'S').slice(0, 2).toUpperCase()}</span>;

  return (
    <div
      className="sv-overlay"
      onClick={handleScreenTap}
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="sv-container">
        {/* Progress bars */}
        <div className="sv-progress-row">
          {Array.from({ length: totalStories }).map((_, i) => (
            <div key={i} className="sv-progress-seg">
              <div className="sv-progress-fill" style={{
                width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="sv-header">
          <div className="sv-user-block">
            <div className="sv-user-avatar" style={{ background: story.avatarUrl ? 'transparent' : (story.avatarColor || '#1B458F') }}>
              {headerAvatar}
            </div>
            <div className="sv-user-meta">
              <span className="sv-username">{story.username || story.label}</span>
              <span className="sv-time">{story.subtitle || 'Just now'}</span>
            </div>
          </div>
          <button className="sv-close-btn" onClick={onClose} aria-label="Close story">
            <FiX size={20} />
          </button>
        </div>

        {/* Nav arrows */}
        {hasPrev && (
          <button className="sv-arrow sv-arrow--prev" onClick={onPrev} aria-label="Previous">
            <FiChevronLeft size={22} />
          </button>
        )}
        {hasNext && (
          <button className="sv-arrow sv-arrow--next" onClick={onNext} aria-label="Next">
            <FiChevronRight size={22} />
          </button>
        )}

        {/* Card body */}
        <div className="sv-body">
          <StoryCard story={story} />
          <button className="sv-float-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">✕</button>
        </div>

        {/* Footer */}
        <div className="sv-footer">
          <div className="sv-reactions">
            {QUICK_REACTIONS.map((em) => (
              <button key={em} className="sv-emoji-btn" onClick={() => handleReact(em)}>{em}</button>
            ))}
          </div>
          <form className="sv-compose" onSubmit={handleSendReply}>
            <input type="text" className="sv-reply-input" placeholder="Send reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <button type="submit" className="sv-send-btn" disabled={!replyText.trim()}><FiSend size={14} /></button>
          </form>
        </div>

        {showToast && <div className="sv-toast">{toastMsg}</div>}
      </div>
    </div>
  );
}
