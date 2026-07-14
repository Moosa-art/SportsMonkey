const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');

const newWhileLoop = `const MIN_GLANCE_SPACING = 8;
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

      // If no item perfectly fits the spacing rules, we need a fallback strategy.
      if (selectedIdx === -1) {
        // Find the first item that IS NOT a glance. We'd rather cluster news/video than show glances back-to-back.
        const nonGlanceIdx = pool.findIndex(item => item.kind !== 'glance');
        
        if (nonGlanceIdx !== -1) {
          selectedIdx = nonGlanceIdx;
        } else {
          // If ONLY glance items are left and they violate spacing, we DROP them. 
          // Glances are highlights, they shouldn't dominate.
          pool = []; // clear the rest of the pool
          break;
        }
      }

      const picked = pool.splice(selectedIdx, 1)[0];
      finalFresh.push(picked);

      lastKindsRef.current.push(picked.kind);
      if (lastKindsRef.current.length > 30) {
        lastKindsRef.current.shift();
      }
    }`;

content = content.replace(
  /const MIN_GLANCE_SPACING = 6;[\s\S]*?lastKindsRef\.current\.shift\(\);\n      \}\n    \}/,
  newWhileLoop
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');
console.log('Strict spacing applied');
