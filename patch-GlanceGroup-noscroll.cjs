const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// Replace the GlanceStoryViewer with a non-scrollable SingleStoryViewer
const newViewer = `
// ── Single Story Viewer (Non-scrollable) ────────────────
function SingleStoryViewer({ tile, onClose, eng }) {
  const [openArticle, setOpenArticle] = useState(null);
  
  let CardContent = null;
  const dedupeId = \`glance-story:\${tile?.key}\`;
  
  if (tile) {
    if (tile.tileType === 'news' && tile.article) {
      CardContent = <AtAGlanceCard articles={[tile.article]} onOpen={setOpenArticle} dedupeId={dedupeId} eng={eng} />;
    } else if (tile.tileType === 'leagueTable') {
      CardContent = <LeagueTableCard tile={tile} dedupeId={dedupeId} eng={eng} />;
    } else if (tile.tileType === 'topScorers') {
      CardContent = <ScorersCard tile={tile} dedupeId={dedupeId} eng={eng} />;
    } else if (tile.tileType === 'playerRatings') {
      CardContent = (
        <Fragment>
          <RatingsCard tile={tile} dedupeId={dedupeId} eng={eng} />
          <MatchStatsCard tile={tile} dedupeId={\`\${dedupeId}:stats\`} eng={eng} />
        </Fragment>
      );
    } else if (tile.tileType === 'vote') {
      CardContent = <VoteCard tile={tile} dedupeId={dedupeId} eng={eng} />;
    } else if (tile.tileType === 'promo' && tile.promoType === 'freebet') {
      CardContent = <FreeBetCard tile={tile} dedupeId={dedupeId} eng={eng} />;
    } else {
      CardContent = (
        <div className="cf-card cf-story-fallback">
          <h3>{tile.storyType || tile.promoType || 'Story'}</h3>
        </div>
      );
    }
  }

  // Close when clicking the overlay (but not the content)
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('cf-story-overlay') || 
        e.target.classList.contains('cf-story-tap-zone')) {
      onClose();
    }
  };

  return (
    <div className="cf-story-overlay" onClick={handleOverlayClick}>
      <button className="cf-story-close-btn" onClick={onClose}>
        <FiX size={18} />
      </button>

      <div className="cf-story-tap-zone">
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
`;

content = content.replace(/\/\/ ── Fullscreen Story Viewer for Glance Tiles ────────────────[\s\S]*?function GlanceGroup/m, newViewer + "\nfunction GlanceGroup");

// Update the render logic inside GlanceGroup
content = content.replace(
  /\{storyIndex !== null && \([\s\S]*?\}\)/m,
  `{storyIndex !== null && (
        <SingleStoryViewer
          tile={tiles[storyIndex]}
          onClose={() => setStoryIndex(null)}
          eng={eng}
        />
      )}`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched GlanceGroup to use SingleStoryViewer');
