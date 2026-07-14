import './posts.css';

export default function PlayerRatingsPost({ data }) {
  return (
    <div className="p-card">
      <div className="p-title-row">
        <div className="p-title">PLAYER RATINGS</div>
      </div>
      <div className="fm-pitch">
        {data.players.map((p, i) => (
          <div className="fm-player" style={{ top: p.top, left: p.left }} key={i}>
            <div className="fm-shirt" style={{ background: data.color, fontSize: 9 }}>
              {p.rating}
            </div>
            <div className="fm-name">{p.name}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Avg Rating</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1F44' }}>{data.avgRating}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280' }}>MOTM</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1F44' }}>{data.motm}</div>
        </div>
      </div>
    </div>
  );
}
