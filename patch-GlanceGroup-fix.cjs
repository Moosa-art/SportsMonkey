const fs = require('fs');

let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

// Replace the placeholder styles with class names
content = content.replace(/style=\{\{244\}\}/g, 'className="cf-story-fallback"');
content = content.replace(/style=\{\{245\}\}/g, 'className="cf-story-overlay"');
content = content.replace(/style=\{\{246\}\}/g, 'className="cf-story-progress-container"');
content = content.replace(/style=\{\{247\}\}/g, 'className="cf-story-progress-bar"');
content = content.replace(/style=\{\{ height: '100%', background: '#fff', width: i < activeIndex \? '100%' : i === activeIndex \? \`\$\{progress\}%\` : '0%' \}\}/g, 'className="cf-story-progress-fill" style={{ width: i < activeIndex ? "100%" : i === activeIndex ? `${progress}%` : "0%" }}');
content = content.replace(/style=\{\{248\}\}/g, 'className="cf-story-close-btn"');
content = content.replace(/style=\{\{249\}\}/g, 'className="cf-story-tap-zone"');
content = content.replace(/style=\{\{250\}\}/g, 'className="cf-story-content-wrap"');
content = content.replace(/style=\{\{251\}\}/g, 'className="cf-match-hub-card"');
content = content.replace(/style=\{\{252\}\}/g, 'className="cf-match-hub-head"');
content = content.replace(/style=\{\{253\}\}/g, 'className="cf-match-hub-grid"');

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('fixed styles in GlanceGroup.jsx');
