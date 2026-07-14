import { useState } from 'react';
import './posts.css';

// Sample news images for items that have them
const NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&h=80&fit=crop',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=120&h=80&fit=crop',
  'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=120&h=80&fit=crop',
  'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=120&h=80&fit=crop',
];

export default function NewsListPost({ data }) {
  const [tab, setTab] = useState('Top');
  const [activeIdx, setActiveIdx] = useState(0);

  const items = data.items || [];
  const activeItem = items[activeIdx] || items[0];

  return (
    <div className="nl2-card">
      {/* Tabs */}
      <div className="nl2-tabs">
        {['Top', 'Latest'].map(t => (
          <button key={t} className={`nl2-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Main featured image area */}
      <div className="nl2-featured">
        <div className="nl2-img-wrap">
          <img
            src={NEWS_IMAGES[activeIdx % NEWS_IMAGES.length]}
            alt=""
            className="nl2-img"
          />
          <div className="nl2-img-overlay" />
          <div className="nl2-source-badge" style={{ background: activeItem?.color || '#0A1F44' }}>
            {activeItem?.source}
          </div>
        </div>
        <div className="nl2-headline-text">
          {activeItem?.text}
        </div>
      </div>

      {/* Story list */}
      <div className="nl2-list">
        {items.map((it, i) => (
          <button
            key={i}
            className={`nl2-item${i === activeIdx ? ' active' : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            <div className="nl2-item-dot" style={{ background: it.color || '#0A1F44' }} />
            <div className="nl2-item-text">{it.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
