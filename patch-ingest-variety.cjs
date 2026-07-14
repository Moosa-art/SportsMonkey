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

    // Map a buried glance tile into a full standalone feed item so the rich
    // content (ratings, top scorers, votes, tables, free bets, news) is
    // surfaced across the timeline instead of hidden inside glance groups.
    const tileToItem = (tile, gid) => {
      const base = {
        dedupeId: \`\${gid}:\${tile.key}\`,
        timestamp: tile.timestamp || tile.article?.timestamp || Date.now(),
        engagement: Number(tile.engagement) || Number(tile.comments) || 0,
      };
      switch (tile.tileType) {
        case 'news':
          if (!tile.article) return null;
          return { ...base, kind: 'news', article: tile.article, layout: 'simple_news',
            timestamp: tile.article.timestamp || base.timestamp, sourceKey: 'news' };
        case 'playerRatings':
          return { ...tile, ...base, kind: 'ratings', varietyKey: 'ratings' };
        case 'topScorers':
          return { ...tile, ...base, kind: 'topScorers', varietyKey: 'topScorers' };
        case 'vote':
          return { ...tile, ...base, kind: 'interactive', varietyKey: 'interactive' };
        case 'leagueTable':
          return { ...tile, ...base, kind: 'leagueTable', varietyKey: 'leagueTable' };
        case 'promo':
          if (tile.promoType === 'freebet') return { ...tile, ...base, kind: 'freebet', varietyKey: 'freebet' };
          return null; // other promos are bare CTAs — skip standalone
        default:
          return null; // story pointers (highlights/live) have no standalone data
      }
    };

    // Split raw items: keep the FIRST glance group as an occasional "Match Hub",
    // and EXPLODE every other glance group's tiles into standalone posts.
    let hubUsed = false;
    const expanded = [];
    rawFresh.forEach((item) => {
      if (item.kind === 'glance') {
        if (!hubUsed && (item.tiles || []).length) {
          hubUsed = true;
          expanded.push({ ...item, tiles: item.tiles.slice(0, 6), varietyKey: 'glance' });
        } else {
          (item.tiles || []).forEach((t) => {
            const mapped = tileToItem(t, item.dedupeId);
            if (mapped) expanded.push(mapped);
          });
        }
      } else {
        // Tag a variety key for spacing (special standalone types).
        const vk =
          item.kind === 'news' || item.kind === 'video'
            ? item.kind
            : item.kind === 'special'
              ? item.postType || 'special'
              : item.kind;
        expanded.push({ ...item, varietyKey: vk });
      }
    });

    // De-dupe again (exploded tiles may collide across pages).
    const pool = expanded.filter((it) => {
      if (seenRef.current.has(it.dedupeId)) return it.kind === 'glance' || it.kind === 'news' || it.kind === 'video';
      seenRef.current.add(it.dedupeId);
      return true;
    });

    // ── Variety sequencer ──
    // Rules (tracked via lastKindsRef history across pages):
    //  - news: never more than 2 in a row
    //  - video: never 2 in a row
    //  - glance hub: >= 8 items gap
    //  - any special subtype: >= 4 items gap (never back-to-back)
    // We PREFER specials/glance when valid so variety is spread out, and never
    // drop items — a forced pick keeps everything visible.
    const keyOf = (it) => {
      if (it.kind === 'news' || it.kind === 'video' || it.kind === 'glance') return it.kind;
      return it.varietyKey || it.kind;
    };
    const valid = (it, h) => {
      const k = it.kind;
      if (k === 'news') return !(h.length >= 2 && h[h.length - 1] === 'news' && h[h.length - 2] === 'news');
      if (k === 'video') return !(h.length >= 1 && h[h.length - 1] === 'video');
      if (k === 'glance') return !h.slice(-8).includes('glance');
      return !h.slice(-4).includes(keyOf(it));
    };
    const isCommon = (it) => it.kind === 'news' || it.kind === 'video';

    const out = [];
    const hist = lastKindsRef.current;
    const work = [...pool];
    while (work.length) {
      // 1) variety first: a valid special/glance
      let idx = work.findIndex((it) => !isCommon(it) && valid(it, hist));
      // 2) else a valid common (news/video)
      if (idx === -1) idx = work.findIndex((it) => isCommon(it) && valid(it, hist));
      // 3) else any valid item
      if (idx === -1) idx = work.findIndex((it) => valid(it, hist));
      // 4) forced: prefer a common so we never force a glance/special cluster
      if (idx === -1) idx = work.findIndex((it) => isCommon(it));
      if (idx === -1) idx = 0;
      const picked = work.splice(idx, 1)[0];
      out.push(picked);
      hist.push(keyOf(picked));
      if (hist.length > 40) hist.shift();
    }

    if (newGlobal) setGlobal(newGlobal);
    return { fresh: out, rawCount: totalRawCount };
  }, []);`;

content = content.replace(
  /const ingest = useCallback\(\(payloadsData, page\) => \{[\s\S]*?return \{ fresh: finalFresh, rawCount: totalRawCount \};\n  \}, \[\]\);/,
  newIngest
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');
console.log('patched ingest variety sequencer');
