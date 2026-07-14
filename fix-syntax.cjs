const fs = require('fs');
let content = fs.readFileSync('src/components/feed/GlanceGroup.jsx', 'utf8');

content = content.replace(
  /<div className="cf-card" style= padding: '20px', textAlign: 'center', background: '#fff' >/g,
  '<div className="cf-card cf-story-fallback">'
);

content = content.replace(
  /<div className="cf-modal-overlay" style= zIndex: 9999, background: '#000' >/g,
  '<div className="cf-story-overlay">'
);

content = content.replace(
  /<div className="cf-story-progress-container" style= position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 10 >/g,
  '<div className="cf-story-progress-container">'
);

content = content.replace(
  /<div key=\{i\} style= flex: 1, height: '3px', background: 'rgba\\(255,255,255,0.3\\)', borderRadius: '2px', overflow: 'hidden' >/g,
  '<div key={i} className="cf-story-progress-bar">'
);

content = content.replace(
  /<button\s*\n\s*style= position: 'absolute', top: '30px', right: '10px', zIndex: 10, background: 'none', color: '#fff', border: 'none' \s*\n\s*onClick=\{onClose\}\n\s*>/g,
  '<button className="cf-story-close-btn" onClick={onClose}>'
);

content = content.replace(
  /<div \n\s*style= flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' \n\s*onClick=\{handleTap\}\n\s*onPointerDown=\{.*?\}\n\s*onPointerUp=\{.*?\}\n\s*onPointerLeave=\{.*?\}\n\s*>/gs,
  `<div 
        className="cf-story-tap-zone"
        onClick={handleTap}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >`
);

content = content.replace(
  /<div style= width: '100%', maxWidth: '480px', pointerEvents: 'auto' >/g,
  '<div className="cf-story-content-wrap">'
);

content = content.replace(
  /<div className="cf-card" style= marginBottom: '14px' >/g,
  '<div className="cf-match-hub-card">'
);

content = content.replace(
  /<header className="cf-card-head" style= paddingBottom: '0', borderBottom: 'none' >/g,
  '<header className="cf-match-hub-head">'
);

fs.writeFileSync('src/components/feed/GlanceGroup.jsx', content, 'utf8');
console.log('Fixed JSX syntax errors');
