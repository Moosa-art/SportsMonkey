import { useState } from 'react';
import './posts.css';

const ALL_TEAMS = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
  'Leicester City', 'Liverpool', 'Manchester City', 'Manchester Utd',
  'Newcastle Utd', 'Nottm Forest', 'Southampton', 'Tottenham',
  'West Ham', 'Wolverhampton',
];

export default function PredictionPost({ data }) {
  const [homeTeam, setHomeTeam] = useState(data?.homeTeam || '');
  const [awayTeam, setAwayTeam] = useState(data?.awayTeam || '');
  const [submitted, setSubmitted] = useState(false);

  const accuracy = data?.accuracy || 63;
  const matchCount = data?.matchCount || 63;
  const accuracyPct = data?.accuracyPct || 71;

  const handleSubmit = () => {
    if (homeTeam && awayTeam && homeTeam !== awayTeam) {
      setSubmitted(true);
    }
  };

  return (
    <div className="pred-card">
      <div className="pred-question">Who will win?</div>

      <div className="pred-teams-row">
        <div className="pred-team-side">
          <div className="pred-team-label">Team Name</div>
          <div className="pred-select-wrap">
            <select
              className="pred-select"
              value={homeTeam}
              onChange={e => { setHomeTeam(e.target.value); setSubmitted(false); }}
            >
              <option value="">Select</option>
              {ALL_TEAMS.filter(t => t !== awayTeam).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pred-vs">VS</div>

        <div className="pred-team-side">
          <div className="pred-team-label">Team Name</div>
          <div className="pred-select-wrap">
            <select
              className="pred-select"
              value={awayTeam}
              onChange={e => { setAwayTeam(e.target.value); setSubmitted(false); }}
            >
              <option value="">Select</option>
              {ALL_TEAMS.filter(t => t !== homeTeam).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pred-accuracy-row">
        <div className="pred-accuracy-label">
          My prediction accuracy from {matchCount} matches
        </div>
        <div className="pred-accuracy-bar">
          <div className="pred-accuracy-fill" style={{ width: `${submitted ? accuracyPct : accuracyPct * 0.6}%` }} />
        </div>
        {submitted && (
          <div className="pred-accuracy-result">
            ✓ Correct — {accuracyPct}% accuracy
          </div>
        )}
        {!submitted && (homeTeam && awayTeam) && (
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <button
              onClick={handleSubmit}
              style={{
                background: '#0A1F44', color: '#fff', padding: '7px 20px',
                borderRadius: 8, fontSize: 12, fontWeight: 800, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Predict
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
