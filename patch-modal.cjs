const fs = require('fs');
let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// Replace the SingleStoryViewer with the correct white modal design
const newViewer = `
// ── Single Card Modal View (White Fullscreen) ────────────────
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
      CardContent = <FreeBetCard tile={tile} dedupeId={dedupeId} eng={eng} />;\n    } else {
      CardContent = (
        <div className="cf-card cf-story-fallback">
          <h3>{tile.storyType || tile.promoType || 'Story'}</h3>
        </div>
      );
    }
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
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
          <FiX size={18} />
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
`;

content = content.replace(/\/\/ ── Single Story Viewer \(Non-scrollable\) ────────────────[\s\S]*?\}\n\n\/\* ── Mini Previews/m, newViewer + '\n/* ── Mini Previews');

// Update GlanceGroup to remove the "Match Hub" header and background card
content = content.replace(
  /<div className="cf-match-hub-card">[\s\S]*?<header className="cf-match-hub-head">[\s\S]*?<\/header>[\s\S]*?<div className="cf-match-hub-grid">/m,
  '<div className="cf-match-hub-grid">'
);

content = content.replace(
  /<\/div>\s*<\/div>\s*\{storyIndex !== null/m,
  '</div>\n\n      {storyIndex !== null'
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched modal structure');
