const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// I will completely replace the GlanceGroup function at the end
content = content.replace(
  /function GlanceGroup\(\{ item, onComment, onShare, onReport \}\) \{[\s\S]*?export default memo\(GlanceGroup\);/,
  `// ── Fullscreen Story Viewer for Glance Tiles ────────────────
function GlanceStoryViewer({ tiles, initialIndex, onClose, eng }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  
  useEffect(() => {
    setProgress(0);
    setPaused(false);
  }, [activeIndex]);

  useEffect(() => {
    if (paused) return;
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
  }, [paused, activeIndex, tiles.length, onClose]);

  const handleNext = () => {
    if (activeIndex < tiles.length - 1) setActiveIndex(activeIndex + 1);
    else onClose();
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const handleTap = (e) => {
    // ignore taps on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    const pct = e.clientX / window.innerWidth;
    if (pct < 0.3) handlePrev();
    else handleNext();
  };

  const activeTile = tiles[activeIndex];

  // Map the active tile to its full card
  let CardContent = null;
  const dedupeId = \`glance-story:\${activeTile?.key}\`;
  
  if (activeTile) {
    if (activeTile.tileType === 'news' && activeTile.article) {
      CardContent = <AtAGlanceCard articles={[activeTile.article]} onOpen={() => {}} dedupeId={dedupeId} eng={eng} />;
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
        <div className="cf-card" style= padding: '20px', textAlign: 'center', background: '#fff' >
          <h3>{activeTile.storyType || activeTile.promoType || 'Story'}</h3>
          <p>Tap to continue</p>
        </div>
      );
    }
  }

  return (
    <div className="cf-modal-overlay" style= zIndex: 9999, background: '#000' >
      <div className="cf-story-progress-container" style= position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 10 >
        {tiles.map((t, i) => (
          <div key={i} style= flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' >
            <div style={{ height: '100%', background: '#fff', width: i < activeIndex ? '100%' : i === activeIndex ? \`\${progress}%\` : '0%' }} />
          </div>
        ))}
      </div>
      
      <button 
        style= position: 'absolute', top: '24px', right: '14px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer'  
        onClick={onClose}
      >
        <FiX size={18} />
      </button>

      <div 
        style= width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' 
        onClick={handleTap}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        <div style= width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' >
          {CardContent}
        </div>
      </div>
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
    if (t.tileType === 'story') return STORY_META[t.storyType] || { label: 'Match Story', Icon: FiPlayCircle };
    if (t.tileType === 'promo') return PROMO_META[t.promoType] || { label: 'Offer', Icon: FiGift };
    return { label: 'Match Hub', Icon: FiPlayCircle };
  };

  return (
    <>
      <div className="cf-card" style= padding: '14px' >
        <header className="cf-card-head" style= padding: '0 0 12px 0', borderBottom: '1px solid var(--cf-line)', marginBottom: '12px' >
          <span className="cf-source">Match Hub</span>
        </header>
        <div className="cf-glance-grid" style= padding: 0 >
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

export default memo(GlanceGroup);`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched GlanceGroup.jsx for story view');
