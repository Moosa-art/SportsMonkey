const fs = require('fs');

// 1) normalizeFeed.js — turn the dropped 'unknown' glance tile into a data-rich 'generic' tile
let nf = fs.readFileSync('src/lib/feed/normalizeFeed.js', 'utf8');
nf = nf.replace(
  /    default:\n      return \{ tileType: 'unknown', key, rawType: type \|\| 'unknown' \};/,
  `    default: {
      // Surface EVERY other tile type generically instead of dropping it, so
      // prediction / inspiration / team_comparison / creative / technical /
      // fastest / stats / attributes / etc. all appear in the feed.
      const gd = raw.data && typeof raw.data === 'object' ? raw.data : raw;
      if (!type || isPlaceholderData(raw.data)) {
        return { tileType: 'unknown', key, rawType: type || 'unknown' };
      }
      return {
        tileType: 'generic',
        key,
        rawType: type,
        data: gd,
        source: clean(gd.source) || clean(gd.source_title) || null,
        sourceImg: resolveMediaUrl(gd.source_img),
        createdAt: gd.creation_date || null,
        timestamp: parseCreatedAt(gd.creation_date, nowMs),
        engagement: engagementOf(gd),
      };
    }`
);
fs.writeFileSync('src/lib/feed/normalizeFeed.js', nf, 'utf8');

// 2) useClubFeed.js — map exploded 'generic' tiles into standalone special items
let uf = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');
uf = uf.replace(
  /        case 'promo':\n          if \(tile\.promoType === 'freebet'\) return \{ \.\.\.tile, \.\.\.base, kind: 'freebet', varietyKey: 'freebet' \};\n          return null; \/\/ other promos are bare CTAs — skip standalone/,
  `        case 'promo':
          if (tile.promoType === 'freebet') return { ...tile, ...base, kind: 'freebet', varietyKey: 'freebet' };
          return null; // other promos are bare CTAs — skip standalone
        case 'generic':
          return {
            ...base,
            kind: 'special',
            postType: tile.rawType,
            rawData: tile.data || {},
            source: tile.source || 'Social442',
            sourceImg: tile.sourceImg || null,
            createdAt: tile.createdAt || null,
            timestamp: tile.timestamp || base.timestamp,
            varietyKey: tile.rawType || 'special',
          };`
);
fs.writeFileSync('src/hooks/useClubFeed.js', uf, 'utf8');

// 3) GlanceGroup.jsx — render 'generic' tiles inside hubs via SpecialCard
let gg = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');
if (!gg.includes("import SpecialCard")) {
  gg = gg.replace(
    /import FreeBetCard from '.\/cards\/FreeBetCard';/,
    "import FreeBetCard from './cards/FreeBetCard';\nimport SpecialCard from './cards/SpecialCard';"
  );
}
gg = gg.replace(
  /  if \(tile\.storyType === 'highlights_detail_story'\) return <DummyHighlights \/>;/,
  `  if (tile.tileType === 'generic') {
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
  if (tile.storyType === 'highlights_detail_story') return <DummyHighlights />;`
);
fs.writeFileSync('src/components/feed/GlanceGroup.jsx', gg, 'utf8');

console.log('patched generic tile surfacing');
