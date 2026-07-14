import './posts.css';

export default function TopScorersPost({ data }) {
  // data.scorers OR data.players — handle both
  const list = data.scorers || data.players || [];

  return (
    <div className="p-card">
      <div className="ts-header">
        <div className="ts-title">⚽ Top Scorers</div>
        <div className="ts-league-badge">{data.league || data.title || 'Premier League'}</div>
      </div>

      {list.map((p, i) => (
        <div key={i} className="ts-row">
          <div className={`ts-rank${i < 3 ? ' top' : ''}`}>{i + 1}</div>
          <div className="ts-avatar">
            <img src={p.img} alt={p.name} onError={e => e.target.style.display = 'none'} />
          </div>
          <div className="ts-name-wrap">
            <div className="ts-name">{p.name}</div>
            <div className="ts-club">{p.club}</div>
          </div>
          <div className="ts-goals-wrap">
            <div className="ts-goals">{p.goals}</div>
            <div className="ts-goals-label">gls</div>
          </div>
        </div>
      ))}
    </div>
  );
}
