const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');

const newIngest = `const ingest = useCallback((payloadsData, page) => {
    let rawFresh = [];
    let totalRawCount = 0;
    let newGlobal = null;
    
    payloadsData.forEach(({ payload, clubId }) => {
      if (!payload) return;
      const norm = normalizeFeed(payload, { page });
      if (!offsetsRef.current) offsetsRef.current = {};
      offsetsRef.current[clubId] = mergeOffsets(offsetsRef.current[clubId] || null, norm.offsets);
      if (norm.global && !newGlobal) newGlobal = norm.global;
      const fresh = norm.items.filter((it) => !seenRef.current.has(it.dedupeId));
      fresh.forEach((it) => seenRef.current.add(it.dedupeId));
      rawFresh.push(...fresh);
      totalRawCount += norm.rawCount;
    });
    
    rawFresh.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let regularItems = [];
    let tilesPool = [];

    rawFresh.forEach(item => {
      if (item.kind === 'news' || item.kind === 'video') {
        regularItems.push(item);
      } else if (item.kind === 'glance') {
        if (item.tiles) tilesPool.push(...item.tiles);
      } else {
        tilesPool.push({ ...item, key: item.dedupeId || Math.random().toString(36), tileType: item.kind });
      }
    });

    let glanceGroups = [];
    for (let i = 0; i < tilesPool.length; i += 6) {
      const chunk = tilesPool.slice(i, i + 6);
      glanceGroups.push({
        kind: 'glance',
        dedupeId: \`glance-chunk-\${page}-\${i}-\${Math.random().toString(36).slice(2, 6)}\`,
        tiles: chunk,
        timestamp: chunk[0]?.timestamp || Date.now(),
        engagement: chunk.reduce((sum, t) => sum + (Number(t.engagement) || 0), 0)
      });
    }

    let finalFresh = [];
    let rIdx = 0;
    let gIdx = 0;
    
    const spacing = Math.max(1, Math.ceil(regularItems.length / (glanceGroups.length || 1)));
    
    while (gIdx < glanceGroups.length || rIdx < regularItems.length) {
      if (gIdx < glanceGroups.length) {
        finalFresh.push(glanceGroups[gIdx++]);
      }
      let added = 0;
      while (added < spacing && rIdx < regularItems.length) {
        finalFresh.push(regularItems[rIdx++]);
        added++;
      }
    }
    
    if (newGlobal) setGlobal(newGlobal);
    return { fresh: finalFresh, rawCount: totalRawCount };
  }, []);`;

content = content.replace(
  /const ingest = useCallback\(\(payloadsData, page\) => \{[\s\S]*?return \{ fresh: allFresh, rawCount: totalRawCount \};\n  \}, \[\]\);/,
  newIngest
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');
console.log('patched useClubFeed.js ingest logic');
