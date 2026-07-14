const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');

content = content.replace(
  /export function useClubFeed\(\{ clubId = CLUB_ID, useSampleFallback = true \} = \{\}\) \{/,
  "export function useClubFeed({ clubIds = [CLUB_ID], useSampleFallback = true } = {}) {"
);

content = content.replace(
  /const resetCursor = \(\) => \{\n    offsetsRef.current = null;\n    seenRef.current = new Set\(\);\n    pageRef.current = 0;\n    emptyStreakRef.current = 0;\n  \};/,
  "const resetCursor = () => { offsetsRef.current = {}; seenRef.current = new Set(); pageRef.current = 0; emptyStreakRef.current = 0; };"
);

content = content.replace(
  /const ingest = useCallback\(\(payload, page\) => \{.*?return \{ fresh, rawCount: norm.rawCount \};\n  \}, \[\]\);/s,
  `const ingest = useCallback((payloadsData, page) => {
    let allFresh = [];
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
      allFresh.push(...fresh);
      totalRawCount += norm.rawCount;
    });
    
    if (newGlobal) setGlobal(newGlobal);
    allFresh.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return { fresh: allFresh, rawCount: totalRawCount };
  }, []);`
);

content = content.replace(
  /const payload = await api.getClubFeed\(\{\n          clubId,\n          offsets: mode === 'more' \? offsetsRef.current : null,\n          signal: ctrl.signal,\n        \}\);/s,
  `const promises = (clubIds || []).map(async (cid) => {
          try {
            const res = await api.getClubFeed({
              clubId: cid,
              offsets: mode === 'more' ? (offsetsRef.current ? offsetsRef.current[cid] : null) : null,
              signal: ctrl.signal,
            });
            return { payload: res, clubId: cid };
          } catch (e) {
            return { payload: null, clubId: cid };
          }
        });
        const payloadsData = await Promise.all(promises);`
);

content = content.replace(
  /const \{ fresh, rawCount \} = ingest\(payload, page\);/,
  "const { fresh, rawCount } = ingest(payloadsData, page);"
);

content = content.replace(
  /const \{ fresh \} = ingest\(clubFeedSample, 0\);/,
  "const { fresh } = ingest([{ payload: clubFeedSample, clubId: clubIds[0] }], 0);"
);

content = content.replace(
  /\[clubId, ingest, useSampleFallback\],/,
  "[(clubIds || []).join(','), ingest, useSampleFallback],"
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');
console.log('patched useClubFeed.js');
