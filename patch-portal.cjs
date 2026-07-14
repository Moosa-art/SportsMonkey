const fs = require('fs');
let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// Add createPortal import
if (!content.includes("createPortal")) {
  content = content.replace(
    /import \{ memo, Suspense, lazy, useState, Fragment, useEffect \} from 'react';/,
    `import { memo, Suspense, lazy, useState, Fragment, useEffect } from 'react';
import { createPortal } from 'react-dom';`
  );
}

// Modify SingleStoryViewer to use createPortal
content = content.replace(
  /return \(\n    <div className="cf-story-overlay"/g,
  `return createPortal(
    <div className="cf-story-overlay"`
);

// Close the createPortal tag
content = content.replace(
  /        <\/Suspense>\n      \)}\n    <\/div>\n  \);\n\}/g,
  `        </Suspense>
      )}
    </div>,
    document.body
  );
}`
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('patched portal');
