const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');

// 1. Add lastKindsRef
if (!content.includes('lastKindsRef = useRef')) {
  content = content.replace(
    /const mountedRef = useRef\(true\);/,
    "const mountedRef = useRef(true);\n  const lastKindsRef = useRef([]);"
  );
}

// 2. Update resetCursor
content = content.replace(
  /const resetCursor = \(\) => \{ offsetsRef\.current = \{\}; seenRef\.current = new Set\(\); pageRef\.current = 0; emptyStreakRef\.current = 0; \};/,
  "const resetCursor = () => { offsetsRef.current = {}; seenRef.current = new Set(); pageRef.current = 0; emptyStreakRef.current = 0; lastKindsRef.current = []; };"
);

// 3. Replace ingest
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

    // Limit Glance cards to 1 per fetch to reduce overall number
    let glanceCount = 0;
    rawFresh = rawFresh.filter(item => {
      if (item.kind === 'glance') {
        glanceCount++;
        if (glanceCount > 1) return false;
      }
      return true;
    });

    let finalFresh = [];
    let pool = [...rawFresh];

    const MIN_GLANCE_SPACING = 6;
    const MIN_SPECIAL_SPACING = 4;

    while (pool.length > 0) {
      let selectedIdx = -1;

      for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const k = item.kind;
        const hist = lastKindsRef.current;

        let valid = true;
        if (k === 'news') {
          if (hist.length >= 2 && hist[hist.length - 1] === 'news' && hist[hist.length - 2] === 'news') {
            valid = false;
          }
        } else if (k === 'video') {
          if (hist.length >= 1 && hist[hist.length - 1] === 'video') {
            valid = false;
          }
        } else if (k === 'glance') {
          const recent = hist.slice(-MIN_GLANCE_SPACING);
          if (recent.includes('glance')) valid = false;
        } else {
          // Special
          const recent = hist.slice(-MIN_SPECIAL_SPACING);
          if (recent.includes(k)) valid = false;
          if (hist.length >= 1 && hist[hist.length - 1] === k) valid = false;
        }

        if (valid) {
          selectedIdx = i;
          break;
        }
      }

      // If no item perfectly fits the spacing rules, forcefully pick the highest priority item left
      if (selectedIdx === -1) {
        selectedIdx = 0;
      }

      const picked = pool.splice(selectedIdx, 1)[0];
      finalFresh.push(picked);

      lastKindsRef.current.push(picked.kind);
      if (lastKindsRef.current.length > 20) {
        lastKindsRef.current.shift();
      }
    }

    if (newGlobal) setGlobal(newGlobal);
    return { fresh: finalFresh, rawCount: totalRawCount };
  }, []);`;

content = content.replace(
  /const ingest = useCallback\(\(payloadsData, page\) => \{[\s\S]*?return \{ fresh: finalFresh, rawCount: totalRawCount \};\n  \}, \[\]\);/,
  newIngest
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');

// 4. Update GlanceGroup.jsx to slice tiles to max 6
let glanceContent = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');
glanceContent = glanceContent.replace(
  /const tiles = item\.tiles \|\| \[\];/,
  "const tiles = (item.tiles || []).slice(0, 6);"
);
fs.writeFileSync('src/components/feed/GlanceGroup.jsx', glanceContent, 'utf8');

console.log('patched feed spacing logic');
