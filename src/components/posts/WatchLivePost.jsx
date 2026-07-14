import { FiRadio } from 'react-icons/fi';
import './posts.css';

// Team color swatches as small squares
function TeamSwatch({ color, label }) {
  return (
    <div className="wl2-swatch">
      <div className="wl2-swatch-box" style={{ background: color }} />
      {label && <span>{label}</span>}
    </div>
  );
}

export default function WatchLivePost({ data }) {
  return (
    <div className="wl2-card">
      <div className="wl2-teams-row">
        <div className="wl2-team-info">
          <TeamSwatch color={data.home?.color || '#FFD700'} />
          <TeamSwatch color={data.away?.color || '#1a1a1a'} />
        </div>
        <div className="wl2-match-info">
          <div className="wl2-home-name">{data.home?.name || 'Home Team'}</div>
          <div className="wl2-away-name">{data.away?.name || 'Away Team'}</div>
        </div>
        <button className="wl2-stream-btn">
          <FiRadio size={14} />
          Stream
        </button>
      </div>
      {data.minute && (
        <div className="wl2-live-row">
          <span className="wl2-live-dot" />
          <span className="wl2-live-label">LIVE · {data.minute}'</span>
          <span className="wl2-score">{data.home?.score ?? 0} – {data.away?.score ?? 0}</span>
        </div>
      )}
    </div>
  );
}
