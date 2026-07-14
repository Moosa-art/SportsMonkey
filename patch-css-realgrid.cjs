const fs = require('fs');

let content = fs.readFileSync('src/components/feed/feed-cards.css', 'utf8');

const newCSS = `
/* ── Real Cards Grid ── */
.cf-match-hub-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0;
  margin-bottom: 14px;
}

.cf-grid-cell-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  cursor: pointer;
  background: var(--cf-bg);
  border-radius: 16px;
  border: 1px solid var(--cf-line);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.cf-grid-cell-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
}

/* We scale the actual cards to fit in the small grid cell! */
.cf-grid-cell-wrap .cf-grid-item {
  width: 200%;
  height: 200%;
  transform: scale(0.5);
  transform-origin: top left;
  pointer-events: none;
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.cf-grid-cell-wrap .cf-card {
  margin-bottom: 0 !important;
}

/* Fix modal restoring full size */
.cf-modal-white-inner .cf-grid-item {
  width: 100%;
  height: auto;
  transform: none;
  pointer-events: auto;
  overflow: visible;
}

/* ── Dummy Cards for Grid ── */
.cf-dummy-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
  align-items: center;
  justify-content: center;
}
.cf-dummy-head {
  display: flex;
  justify-content: center;
  width: 100%;
}
.cf-dummy-banner {
  background: #0a1f6b;
  color: #fff;
  text-align: center;
  font-size: 24px;
  font-weight: 900;
  padding: 12px 24px;
  margin: 24px auto 0;
  transform: skewX(-10deg);
  display: inline-block;
}
.cf-dummy-sub {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #0b1b3a;
  margin: 16px 0;
}
.cf-dummy-hl-img {
  flex: 1;
  width: 90%;
  margin: 0 12px 24px;
  background: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cf-dummy-hl-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #111, #333);
}
.cf-dummy-live-date {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #0b1b3a;
  margin: 24px 0;
}
.cf-dummy-live-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding-bottom: 24px;
}
.cf-dummy-live-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.cf-dummy-live-team img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}
.cf-dummy-live-team span {
  font-size: 20px;
  font-weight: 800;
  color: #0a1f6b;
}
.cf-dummy-live-vs {
  font-size: 24px;
  font-weight: 800;
  color: #0b1b3a;
  margin-bottom: 28px;
}
.cf-dummy-title {
  font-size: 24px;
  font-weight: 800;
  color: #0b1b3a;
  text-align: center;
}
`;

content = content.replace(/\.cf-match-hub-grid \{\s*padding: 0;\s*gap: 12px;\s*\}/g, newCSS);

fs.writeFileSync('src/components/feed/feed-cards.css', content, 'utf8');
console.log('Added CSS for Real Cards grid');
