import './posts.css';

export default function MatchScorePost({ data }) {
  return (
    <div className="ms-card">
      <div className="ms-status">
        {data.live && <span className="live-dot"></span>}
        {data.status}
      </div>

      <div className="ms-teams">
        <div className="ms-team">
          <div className="ms-crest" style={{ background: data.home.color }}>
            {data.home.short}
          </div>
          <div className="ms-team-name">{data.home.name}</div>
        </div>

        <div className="ms-score">
          <span>{data.home.score}</span>
          <span className="ms-score-sep">–</span>
          <span>{data.away.score}</span>
        </div>

        <div className="ms-team">
          <div className="ms-crest" style={{ background: data.away.color }}>
            {data.away.short}
          </div>
          <div className="ms-team-name">{data.away.name}</div>
        </div>
      </div>

      {data.scorers && data.scorers.length > 0 && (
        <div className="ms-scorers">
          {data.scorers.map((s, i) => (
            <div key={i} className="ms-scorer-row">
              <span className="ms-scorer-dot">⚽</span>
              <span>{s.player}</span>
              <span style={{ opacity: 0.5, fontSize: 11 }}>{s.team}</span>
              <span className="ms-scorer-min">{s.minute}'</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
