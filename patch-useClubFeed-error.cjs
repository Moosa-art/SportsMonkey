const fs = require('fs');

let content = fs.readFileSync('src/hooks/useClubFeed.js', 'utf8');

content = content.replace(
  /const promises = \(clubIds \|\| \[\]\)\.map\(async \(cid\) => \{.*?return \{ payload: null, clubId: cid \};\n          \}\n        \}\);\n        const payloadsData = await Promise\.all\(promises\);/s,
  `const promises = (clubIds || []).map(async (cid) => {
          try {
            const res = await api.getClubFeed({
              clubId: cid,
              offsets: mode === 'more' ? (offsetsRef.current ? offsetsRef.current[cid] : null) : null,
              signal: ctrl.signal,
            });
            return { payload: res, clubId: cid, error: null };
          } catch (e) {
            return { payload: null, clubId: cid, error: e };
          }
        });
        const payloadsData = await Promise.all(promises);
        
        // If all requests failed, throw the first error so the fallback can handle it
        if (payloadsData.length > 0 && payloadsData.every(p => p.error)) {
          throw payloadsData[0].error;
        }`
);

fs.writeFileSync('src/hooks/useClubFeed.js', content, 'utf8');
console.log('patched useClubFeed.js error handling');
