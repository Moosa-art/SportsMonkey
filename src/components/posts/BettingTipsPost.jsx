import './posts.css';

export default function BettingTipsPost({ data }) {
  return (
    <div className="bt-card">
      <div className="bt-header">
        <div className="bt-title">🎯 {data.title || 'Tips'}</div>
        <div className="bt-odds-badge">{data.totalOdds || data.accumulatorOdds || data.odds}</div>
      </div>

      {data.tips?.map((tip, i) => (
        <div key={i} className="bt-match">
          <div className="bt-match-teams">{tip.match || `${tip.home} vs ${tip.away}`}</div>
          <div className="bt-tip-tag">{tip.tip}</div>
          {tip.odds && (
            <div className="bt-confidence" style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
              Odds: {tip.odds}
            </div>
          )}
        </div>
      ))}

      <div className="bt-disclaimer">18+ · Gamble responsibly</div>
    </div>
  );
}
