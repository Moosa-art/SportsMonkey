import './posts.css';

export default function FormationPost({ data }) {
  return (
    <div className="fm-card">
      <div className="fm-header">
        <div className="fm-team-label">{data.team}</div>
        <div className="fm-formation-badge">{data.formation}</div>
      </div>

      <div className="fm-pitch">
        {data.players?.map((p, i) => (
          <div
            key={i}
            className="fm-player"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="fm-shirt" style={data.color ? { background: data.color } : {}}>
              {p.number}
            </div>
            <div className="fm-name">{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
