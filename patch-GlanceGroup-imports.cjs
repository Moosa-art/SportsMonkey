const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// Add the missing imports
if (!content.includes('PlayerComparisonCard')) {
  content = content.replace(
    /import FreeBetCard from '.\/cards\/FreeBetCard';/,
    `import FreeBetCard from './cards/FreeBetCard';
import PlayerComparisonCard from './cards/PlayerComparisonCard';
import PlayerStatsCard from './cards/PlayerStatsCard';
import FixturesCard from './cards/FixturesCard';`
  );
}

// Update GridTileRenderer
content = content.replace(
  /if \(tile\.tileType === 'vote'\) \{[\s\S]*?return <DummyGeneric title=\{tile\.storyType \|\| tile\.promoType \|\| 'Story'\} \/>;\n\}/m,
  `if (tile.tileType === 'vote') {
    return <VoteCard tile={tile} dedupeId={dedupeId} eng={eng} />;
  }
  if (tile.tileType === 'promo' && tile.promoType === 'freebet') {
    return <FreeBetCard tile={tile} dedupeId={dedupeId} eng={eng} />;
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

  if (tile.storyType === 'highlights_detail_story') return <DummyHighlights />;
  if (tile.storyType === 'live_score_story') return <DummyWatchLive />;
  
  return <DummyGeneric title={tile.storyType || tile.promoType || tile.tileType || 'Story'} />;
}`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched GlanceGroup imports and renderer');
