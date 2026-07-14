const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

const previews = `
/* ── Mini Previews for Match Hub Grid ────────────────────────── */

function MiniLeagueTable({ tile }) {
  // Just mock a small table look for the preview
  return (
    <div className="cf-mini cf-mini-table">
      <div className="cf-mini-season">2025/26</div>
      <div className="cf-mini-th"><span>TEAM</span><span>P</span><span>PTS</span></div>
      <div className="cf-mini-tr"><span>13</span><span>EVERTON</span><span>38</span><span>49</span></div>
      <div className="cf-mini-tr"><span>14</span><span>LEEDS</span><span>38</span><span>47</span></div>
      <div className="cf-mini-tr active"><span>15</span><span>CRYSTAL</span><span>38</span><span>45</span></div>
      <div className="cf-mini-tr"><span>16</span><span>FOREST</span><span>38</span><span>44</span></div>
    </div>
  );
}

function MiniNews({ tile }) {
  const article = tile.article;
  if (!article) return <div className="cf-mini cf-mini-fallback">News</div>;
  return (
    <div className="cf-mini cf-mini-news">
      <div className="cf-mini-news-img">
        <SmartImage src={article.image} alt="" />
        <span className="cf-mini-news-badge">9h</span>
      </div>
      <div className="cf-mini-news-title">{article.title}</div>
    </div>
  );
}

function MiniPlayerRatings({ tile }) {
  return (
    <div className="cf-mini cf-mini-ratings">
      <div className="cf-mini-pitch">
        {/* Abstract pitch with dots representing players */}
        <div className="cf-mini-pitch-row"><div className="cf-mini-dot"/></div>
        <div className="cf-mini-pitch-row"><div className="cf-mini-dot"/><div className="cf-mini-dot"/><div className="cf-mini-dot"/><div className="cf-mini-dot"/></div>
        <div className="cf-mini-pitch-row"><div className="cf-mini-dot"/><div className="cf-mini-dot"/><div className="cf-mini-dot"/></div>
        <div className="cf-mini-pitch-row"><div className="cf-mini-dot"/><div className="cf-mini-dot"/></div>
      </div>
      <div className="cf-mini-ratings-score">
        <img src="https://cdn.sportmonks.com/images/soccer/teams/19/51.png" alt="" />
        <span>1 - 2</span>
        <img src="https://cdn.sportmonks.com/images/soccer/teams/19/19.png" alt="" />
      </div>
      <div className="cf-mini-ratings-title">PLAYER RATINGS</div>
    </div>
  );
}

function MiniHighlights({ tile }) {
  return (
    <div className="cf-mini cf-mini-hl">
      <div className="cf-mini-banner">HIGHLIGHTS</div>
      <div className="cf-mini-hl-sub">Last Match</div>
      <div className="cf-mini-hl-img">
        <div className="cf-mini-hl-bg" />
        <FiPlayCircle size={24} color="#fff" />
      </div>
    </div>
  );
}

function MiniWatchLive({ tile }) {
  return (
    <div className="cf-mini cf-mini-live">
      <div className="cf-mini-banner">WATCH LIVE</div>
      <div className="cf-mini-live-date">Sun 24th, 8:00 pm</div>
      <div className="cf-mini-live-teams">
        <div className="cf-mini-live-team">
          <img src="https://cdn.sportmonks.com/images/soccer/teams/19/51.png" alt="" />
          <span>15th</span>
        </div>
        <div className="cf-mini-live-vs">VS</div>
        <div className="cf-mini-live-team">
          <img src="https://cdn.sportmonks.com/images/soccer/teams/19/19.png" alt="" />
          <span>1st</span>
        </div>
      </div>
    </div>
  );
}

function MiniVote({ tile }) {
  return (
    <div className="cf-mini cf-mini-vote">
      <div className="cf-mini-vote-top">
        <span className="cf-mini-vote-num">11</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>
      <div className="cf-mini-vote-q">{tile.question || "Crystal Palace's weakest player?"}</div>
    </div>
  );
}

function GlanceTilePreview({ tile }) {
  if (tile.tileType === 'leagueTable') return <MiniLeagueTable tile={tile} />;
  if (tile.tileType === 'news') return <MiniNews tile={tile} />;
  if (tile.tileType === 'playerRatings') return <MiniPlayerRatings tile={tile} />;
  if (tile.storyType === 'highlights_detail_story') return <MiniHighlights tile={tile} />;
  if (tile.storyType === 'live_score_story') return <MiniWatchLive tile={tile} />;
  if (tile.tileType === 'vote') return <MiniVote tile={tile} />;
  
  // Fallback for others
  return (
    <div className="cf-mini cf-mini-fallback">
      {tile.tileType}
    </div>
  );
}
`;

content = content.replace(/\/\/ ── Single Story Viewer \(Non-scrollable\)/, previews + '\n// ── Single Story Viewer (Non-scrollable)');

// Now replace the rendering logic in GlanceGroup
content = content.replace(
  /\{tiles\.map\(\(t, i\) => \{[\s\S]*?\}\)\}/m,
  `{tiles.map((t, i) => (
            <button key={t.key} className="cf-match-hub-tile" onClick={() => setStoryIndex(i)}>
              <GlanceTilePreview tile={t} />
            </button>
          ))}`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched GlanceGroup previews');
