import './posts.css';

export default function StatComparisonPost({ data }) {
  return (
    <div className="p-card sc-card">
      <div className="sc-header">
        <div className="sc-team-name" style={{ color: '#ef4444' }}>{data.teamA?.name || 'Team A'}</div>
        <div className="sc-title">vs</div>
        <div className="sc-team-name">{data.teamB?.name || 'Team B'}</div>
      </div>

      {data.stats?.map((stat, i) => {
        const total = stat.a + stat.b || 1;
        const pctA = Math.round((stat.a / total) * 100);
        const pctB = Math.round((stat.b / total) * 100);
        return (
          <div key={i} className="sc-row">
            <div className="sc-val-l">{stat.a}</div>
            <div>
              <div className="sc-stat-label">{stat.label}</div>
              <div className="sc-bar-wrap">
                <div className="sc-bar-left" style={{ width: `${pctA / 2}%` }} />
                <div className="sc-bar-right" style={{ width: `${pctB / 2}%` }} />
              </div>
            </div>
            <div className="sc-val-r">{stat.b}</div>
          </div>
        );
      })}
    </div>
  );
}
