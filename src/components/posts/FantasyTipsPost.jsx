import './posts.css';

export default function FantasyTipsPost({ data }) {
  return (
    <div className="ft-card">
      <div className="ft-header">
        <div className="ft-title">🏆 Fantasy Tips</div>
        {data.gameweek && <div className="ft-gw-badge">GW{data.gameweek}</div>}
      </div>

      {data.players?.map((p, i) => (
        <div key={i} className="ft-row">
          <img src={p.img} alt={p.name} onError={e => e.target.style.display = 'none'} />
          <div className="ft-player-info">
            <div className="ft-pname">{p.name}</div>
            <div className="ft-pclub">{p.club} · {p.position || p.pos}</div>
          </div>
          {/* handle price as number (13.2) or string ('£13.2m') */}
          <div className="ft-price">
            {typeof p.price === 'number' ? `£${p.price}m` : p.price}
          </div>
        </div>
      ))}
    </div>
  );
}
