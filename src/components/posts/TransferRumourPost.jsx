import './posts.css';

export default function TransferRumourPost({ data }) {
  return (
    <div className="tr-card">
      <div className="tr-badge">🔥 TRANSFER {data.status || 'RUMOUR'}</div>

      <div className="tr-headline">{data.headline}</div>
      <div className="tr-player-info">{data.player} · {data.position}</div>

      <div className="tr-clubs">
        <div className="tr-club-pill">
          <div className="tr-club-badge" style={{ background: data.from.color }}>
            {data.from.short}
          </div>
          <div>
            <div className="tr-club-name">{data.from.name || data.from.short}</div>
            <div className="tr-club-role">From</div>
          </div>
        </div>

        <div className="tr-arrow-wrap">→</div>

        <div className="tr-club-pill">
          <div className="tr-club-badge" style={{ background: data.to.color }}>
            {data.to.short}
          </div>
          <div>
            <div className="tr-club-name">{data.to.name || data.to.short}</div>
            <div className="tr-club-role">To</div>
          </div>
        </div>
      </div>

      <div className="tr-fee-row">
        <div className="tr-fee">{data.fee}</div>
        <div className="tr-source">📰 {data.source} · {data.reliability}</div>
      </div>
    </div>
  );
}
