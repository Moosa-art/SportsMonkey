const fs = require('fs');

let content = fs.readFileSync('src/components/Feed.jsx', 'utf8');

content = content.replace(
  /const \{\n    items,[\s\S]*?retry,\n  const \{ selectedClub \} = useAuth\(\);\n  const clubIds = Array\.isArray\(selectedClub\) \? selectedClub\.map\(c => c\.id \|\| c\) : \(selectedClub \? \[selectedClub\.id \|\| selectedClub\] : \[\]\);\n  \} = useClubFeed\(\{ clubIds \}\);/,
  `  const { selectedClub } = useAuth();
  const clubIds = Array.isArray(selectedClub) ? selectedClub.map(c => c.id || c) : (selectedClub ? [selectedClub.id || selectedClub] : []);
  const {
    items,
    status,
    error,
    loadingMore,
    hasMore,
    refreshing,
    usingFallback,
    loadMore,
    refresh,
    retry,
  } = useClubFeed({ clubIds });`
);

fs.writeFileSync('src/components/Feed.jsx', content, 'utf8');
console.log('fixed Feed.jsx');
