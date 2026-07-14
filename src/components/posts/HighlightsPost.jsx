import { FiPlay, FiClock } from 'react-icons/fi';
import './posts.css';

export default function HighlightsPost({ data }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <img src={data.thumbnail} style={{ width: '100%', display: 'block', height: 210, objectFit: 'cover' }} alt="" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>
            ▶ HIGHLIGHTS
          </div>
          <div style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 9px', borderRadius: 6, fontSize: 11, display: 'flex', gap: 4, alignItems: 'center', fontWeight: 600 }}>
            <FiClock size={11} /> {data.duration}
          </div>
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, marginBottom: 6, lineHeight: 1.2, letterSpacing: '-0.3px' }}>{data.title}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>
            <span>{data.views} views</span><span>·</span><span>{data.timeAgo}</span>
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 58, height: 58, background: 'rgba(255,255,255,0.95)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1F44',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <FiPlay size={24} fill="currentColor" />
      </div>
    </div>
  );
}
