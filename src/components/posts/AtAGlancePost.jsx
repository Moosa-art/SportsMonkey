import { FiPlay } from 'react-icons/fi';
import './posts.css';

export default function AtAGlancePost({ data }) {
  return (
    <div className="aag-grid">
      {/* 1. League Table */}
      <div className="aag-cell aag-cell-white">
        <div className="aag-lt">
          <div className="aag-lt-season">2025/26</div>
          <div className="aag-lt-head">
            <div></div>
            <div>TEAM</div>
            <div style={{ textAlign: 'center' }}>P</div>
            <div style={{ textAlign: 'center' }}>PTS</div>
          </div>
          <div className="aag-lt-row">
            <div>13</div><div>EVERTON</div><div className="text-center">38</div><div className="text-center">49</div>
          </div>
          <div className="aag-lt-row">
            <div>14</div><div>LEEDS</div><div className="text-center">38</div><div className="text-center">47</div>
          </div>
          <div className="aag-lt-row highlight">
            <div>15</div><div>CRYSTAL</div><div className="text-center">38</div><div className="text-center">45</div>
          </div>
          <div className="aag-lt-row">
            <div>16</div><div>FOREST</div><div className="text-center">38</div><div className="text-center">44</div>
          </div>
        </div>
      </div>

      {/* 2. News */}
      <div className="aag-cell aag-cell-white">
        <div className="aag-news">
          <div className="aag-news-img">
            <img src={data?.image?.url || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=300"} alt="" />
            <div className="aag-news-badge">18h</div>
          </div>
          <div className="aag-news-text">
            Nottingham Forest confirm appointment of Oliver Glasner as new head coach - with ex-Crystal Palace boss reportedly set to earn £13m-a-year at the City Ground
          </div>
        </div>
      </div>

      {/* 3. Player Ratings mini-pitch */}
      <div className="aag-cell aag-cell-white">
        <div className="pr-card">
          <div className="pr-pitch">
            <div className="pr-player" style={{ top: '85%', left: '50%' }}>
              <img src="https://i.pravatar.cc/150?img=11" alt="" />
            </div>
            {[['20%','65%'],['40%','65%'],['60%','65%'],['80%','65%']].map(([l,t],i)=>(
              <div key={i} className="pr-player" style={{ top: t, left: l }}>
                <img src={`https://i.pravatar.cc/150?img=${i+20}`} alt="" />
              </div>
            ))}
            {[['30%','45%'],['50%','45%'],['70%','45%']].map(([l,t],i)=>(
              <div key={i} className="pr-player" style={{ top: t, left: l }}>
                <img src={`https://i.pravatar.cc/150?img=${i+30}`} alt="" />
              </div>
            ))}
            {[['30%','20%'],['50%','15%'],['70%','20%']].map(([l,t],i)=>(
              <div key={i} className="pr-player" style={{ top: t, left: l }}>
                <img src={`https://i.pravatar.cc/150?img=${i+40}`} alt="" />
              </div>
            ))}
          </div>
          <div className="pr-score-row">
            <img src="https://cdn.sportmonks.com/images/soccer/teams/29/29.png" alt="" className="p-club-crest-img" />
            <span className="pr-score-nums">1 <span className="pr-score-dot">.</span> 2</span>
            <img src="https://cdn.sportmonks.com/images/soccer/teams/1/1.png" alt="" className="p-club-crest-img" />
          </div>
          <div className="pr-label">PLAYER RATINGS</div>
        </div>
      </div>

      {/* 4. Highlights */}
      <div className="aag-cell aag-cell-white">
        <div className="hl-card">
          <div className="hl-brush">
            <span>HIGHLIGHTS</span>
          </div>
          <div className="hl-sub">Last Match</div>
          <div className="hl-thumb">
            <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=300" alt="" />
            <div className="hl-play"><FiPlay size={14} fill="currentColor" /></div>
          </div>
        </div>
      </div>

      {/* 5. Watch Live */}
      <div className="aag-cell aag-cell-white">
        <div className="wl-card">
          <div className="wl-brush">
            <span>WATCH LIVE</span>
          </div>
          <div className="wl-time">Sun 24th, 8:00 pm</div>
          <div className="wl-teams">
            <div className="wl-team">
              <img src="https://cdn.sportmonks.com/images/soccer/teams/29/29.png" alt="" />
              <div className="wl-team-rank">15th</div>
            </div>
            <div className="wl-vs">VS</div>
            <div className="wl-team">
              <img src="https://cdn.sportmonks.com/images/soccer/teams/1/1.png" alt="" />
              <div className="wl-team-rank">1st</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Discussion / Comment */}
      <div className="aag-cell aag-cell-white">
        <div className="dc-card">
          <div className="dc-top">
            <span className="dc-num">9</span>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="dc-text">
            Crystal Palace's best young player?
          </div>
        </div>
      </div>
    </div>
  );
}
