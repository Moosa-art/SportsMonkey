const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

content = content.replace(
  /<GlanceStoryViewer\n\s*tiles=\{tiles\}\n\s*initialIndex=\{storyIndex\}\n\s*onClose=\{\(\) => setStoryIndex\(null\)\}\n\s*eng=\{eng\}\n\s*\/>/g,
  `<SingleStoryViewer
          tile={tiles[storyIndex]}
          onClose={() => setStoryIndex(null)}
          eng={eng}
        />`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('Fixed GlanceGroup crash');
