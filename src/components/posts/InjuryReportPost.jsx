import './posts.css';

export default function InjuryReportPost({ data }) {
  const players = data.players || [];

  return (
    <div className="ir-card">
      <div className="ir-header">
        <div className="ir-title">🚑 Injury Update</div>
        {players.length > 0 && (
          <div className="ir-count-badge">{players.length} Players</div>
        )}
      </div>

      {players.map((p, i) => (
        <div key={i} className="ir-row">
          <div className="ir-avatar">
            <img src={p.img} alt={p.name} onError={e => e.target.style.display = 'none'} />
          </div>
          <div className="ir-info">
            <div className="ir-pname">{p.name}</div>
            <div className="ir-injury">{p.injury}</div>
          </div>
          {/* handle 'status' OR 'return' field */}
          <div className="ir-return">{p.return || p.status}</div>
        </div>
      ))}
    </div>
  );
}
