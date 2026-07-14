import './posts.css';

export default function FixtureCardPost({ data }) {
  return (
    <div className="fx-card">
      <div className="fx-header">
        <div className="fx-title">📅 {data.title || 'Fixtures'}</div>
        {data.gameweek && <div className="fx-gw">GW {data.gameweek}</div>}
      </div>

      {data.fixtures?.map((f, i) => {
        // Handle both { home: 'Arsenal', ... } and { home: { name, short, color }, ... }
        const homeName  = typeof f.home === 'string' ? f.home  : f.home?.name;
        const awayName  = typeof f.away === 'string' ? f.away  : f.away?.name;
        const homeShort = typeof f.home === 'string' ? f.home?.slice(0,3).toUpperCase() : f.home?.short;
        const awayShort = typeof f.away === 'string' ? f.away?.slice(0,3).toUpperCase() : f.away?.short;
        const homeColor = typeof f.home === 'object' ? f.home?.color : (f.homeColor || '#0A1F44');
        const awayColor = typeof f.away === 'object' ? f.away?.color : (f.awayColor || '#ef4444');

        return (
          <div key={i} className="fx-row">
            <div className="fx-team">
              <div className="fx-crest" style={{ background: homeColor }}>{homeShort}</div>
              <span>{homeName}</span>
            </div>
            <div className="fx-time-block">
              <div className="fx-time">{f.time}</div>
              <div className="fx-date">{f.date}</div>
            </div>
            <div className="fx-team away">
              <div className="fx-crest" style={{ background: awayColor }}>{awayShort}</div>
              <span>{awayName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
