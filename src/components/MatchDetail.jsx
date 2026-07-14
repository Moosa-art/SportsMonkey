import { useState } from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { leagueFlag } from '../lib/flags';
import Header from './Header';
import './MatchDetail.css';

// SVGs for the 5 top tabs
const DocIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <circle cx="10" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

const LiveWavesIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

const PitchIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="12" cy="12" r="3" />
    <path d="M9 3v2a3 3 0 0 0 6 0V3M9 21v-2a3 3 0 0 1 6 0v2" />
  </svg>
);

const TableGridIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function MatchDetail({ onBack }) {
  const [activeTab, setActiveTab] = useState(0); 
  const [timelineTab, setTimelineTab] = useState('Timeline'); 
  const [selectedStat, setSelectedStat] = useState('Rating'); 
  const [homeFormation, setHomeFormation] = useState('3-4-2-1');
  const [awayFormation, setAwayFormation] = useState('4-3-2-1');

  const matchInfo = {
    league: 'Premier League',
    date: '10 Feb',
    home: 'Everton',
    away: 'Man City',
    homeScore: 3,
    awayScore: 3,
    status: 'FT',
    elapsed: "90'",
    scorer: 'E. Haaland',
    assister: 'J. Doku',
  };

  const getFormationCoordinates = (formation, isHome) => {
    const parts = formation.split('-');
    const rowsCount = parts.length;
    let coords = [{ x: 50, y: isHome ? 6 : 94 }]; 
    
    parts.forEach((countStr, rowIdx) => {
      const count = parseInt(countStr, 10);
      const rowProgress = (rowIdx + 1) / (rowsCount + 1); 
      let y = isHome ? 6 + (42 * rowProgress) : 94 - (42 * rowProgress);
      
      const spacing = 100 / (count + 1);
      for (let i = 0; i < count; i++) {
        let x = spacing * (i + 1);
        coords.push({ x, y });
      }
    });
    return coords;
  };

  const homeCoords = getFormationCoordinates(homeFormation, true);
  const awayCoords = getFormationCoordinates(awayFormation, false);

  const homeLineup = [
    { name: 'Pickford', img: 'https://i.pravatar.cc/150?img=11', stats: { Rating: '6.4' } },
    { name: "O'Brien", img: 'https://i.pravatar.cc/150?img=12', stats: { Rating: '6.5' } },
    { name: 'Tarkowski', img: 'https://i.pravatar.cc/150?img=13', stats: { Rating: '6.4' } },
    { name: 'Keane', img: 'https://i.pravatar.cc/150?img=14', stats: { Rating: '6.8' } },
    { name: 'Grealish', img: 'https://i.pravatar.cc/150?img=15', stats: { Rating: '6.5' } },
    { name: 'Mangala', img: 'https://i.pravatar.cc/150?img=16', sub: 'off', stats: { Rating: '6.7' } },
    { name: 'Garner', img: 'https://i.pravatar.cc/150?img=17', sub: 'off', stats: { Rating: '7.0' }, isHighRating: true },
    { name: 'Gueye', img: 'https://i.pravatar.cc/150?img=18', sub: 'off', stats: { Rating: '6.5' } },
    { name: 'Dewsbury', img: 'https://i.pravatar.cc/150?img=19', sub: 'off', stats: { Rating: '6.4' } },
    { name: 'McNeil', img: 'https://i.pravatar.cc/150?img=20', stats: { Rating: '6.2' } },
    { name: 'Calvert', img: 'https://i.pravatar.cc/150?img=21', stats: { Rating: '6.8' } }
  ].map((p, i) => ({ ...p, x: homeCoords[i]?.x || 50, y: homeCoords[i]?.y || 50 }));

  const awayLineup = [
    { name: 'Maclaseno', img: 'https://i.pravatar.cc/150?img=31', stats: { Rating: '6.1' } },
    { name: 'Ake', img: 'https://i.pravatar.cc/150?img=32', stats: { Rating: '6.7' } },
    { name: 'Dias', img: 'https://i.pravatar.cc/150?img=33', stats: { Rating: '6.8' } },
    { name: 'Stones', img: 'https://i.pravatar.cc/150?img=34', yellow: true, stats: { Rating: '6.9' } },
    { name: 'Nunes', img: 'https://i.pravatar.cc/150?img=35', stats: { Rating: '6.6' } },
    { name: 'Silva', img: 'https://i.pravatar.cc/150?img=36', stats: { Rating: '6.8' } },
    { name: 'Cherki', img: 'https://i.pravatar.cc/150?img=37', goal: true, star: true, stats: { Rating: '8.6' }, isHighRating: true },
    { name: 'Gonzalez', img: 'https://i.pravatar.cc/150?img=38', stats: { Rating: '6.4' } },
    { name: 'Doku', img: 'https://i.pravatar.cc/150?img=39', star: true, stats: { Rating: '9.2' }, isHighRating: true },
    { name: 'Gernarno', img: 'https://i.pravatar.cc/150?img=40', sub: 'off', stats: { Rating: '7.6' } },
    { name: 'Haaland', img: 'https://i.pravatar.cc/150?img=41', star: true, stats: { Rating: '9.2' }, isHighRating: true }
  ].map((p, i) => ({ ...p, x: awayCoords[i]?.x || 50, y: awayCoords[i]?.y || 50 }));

  // Stats header array
  const matchStats = [
    { label: 'Rating', val: '7.3 - 7.0' },
    { label: 'Passes', val: '540 - 276' },
    { label: 'Passing %', val: '80 - 70' },
    { label: 'Assists', val: '0 - 1' },
    { label: 'Shots', val: '12 - 16' },
    { label: 'Tackles', val: '7 - 7' },
    { label: 'Clearances', val: '35 - 58' },
    { label: 'Interceptions', val: '6 - 3' },
    { label: 'Crosses', val: '13 - 26' },
    { label: 'Hit Wood', val: '1 - 1' },
  ];


  // Substitutions & events list for Timeline
  const timelineEvents = [
    { type: 'sub', team: 'away', min: '90+1\'', off: 'M. Banadji', on: 'S. Tavares' },
    { type: 'sub', team: 'home', min: '88\'', off: 'T. Iwata', on: 'B. Osayi-Samuel' },
    { type: 'sub', team: 'away', min: '83\'', off: 'S. Wharton', on: 'Y. Ribeiro' },
    { type: 'sub', team: 'away', min: '83\'', off: 'T. Cantwell', on: 'M. Jørgensen' },
    { type: 'sub', team: 'home', min: '78\'', off: 'P. Roberts', on: 'C. Vicente' },
    { type: 'sub', team: 'home', min: '78\'', off: 'J. Stansfield', on: 'A. Priske' },
    { type: 'sub', team: 'away', min: '77\'', off: 'R. Morishita', on: 'K. Montgomery' },
    { type: 'goal', team: 'away', min: '60\'', scorer: 'T. Cantwell', assister: 'R. Morishita' },
    { type: 'sub', team: 'home', min: '65\'', off: 'I. Osman', on: 'D. Gray' },
    { type: 'sub', team: 'home', min: '65\'', off: 'M. Ducksch', on: 'K. Fujimoto' },
    { type: 'halftime', label: 'Half time' },
    { type: 'card', team: 'away', min: '21\'', player: 'A. Forshaw', card: 'yellow' },
    { type: 'kickoff', label: 'Kick off' }
  ];

  // Starting XI lists
  const startingXI = [
    { home: 'J. Beadle', homeImg: 'https://i.pravatar.cc/150?img=11', away: 'B. Tóth', awayImg: 'https://i.pravatar.cc/150?img=53' },
    { home: 'T. Iwata', homeImg: 'https://i.pravatar.cc/150?img=60', away: 'T. Atcheson', awayImg: 'https://i.pravatar.cc/150?img=39' },
    { home: 'C. Klarer', homeImg: 'https://i.pravatar.cc/150?img=32', away: 'S. Wharton', awayImg: 'https://i.pravatar.cc/150?img=34' },
    { home: 'J. Robinson', homeImg: 'https://i.pravatar.cc/150?img=59', away: 'S. McLoughlin', awayImg: 'https://i.pravatar.cc/150?img=40' },
    { home: 'E. Laird', homeImg: 'https://i.pravatar.cc/150?img=12', away: 'R. Alebiosu', awayImg: 'https://i.pravatar.cc/150?img=61' },
    { home: 'T. Doyle', homeImg: 'https://i.pravatar.cc/150?img=68', away: 'A. Forshaw', awayImg: 'https://i.pravatar.cc/150?img=52' },
    { home: 'S. Paik', homeImg: 'https://i.pravatar.cc/150?img=4', away: 'M. Banadji', awayImg: 'https://i.pravatar.cc/150?img=65' },
    { home: 'P. Roberts', homeImg: 'https://i.pravatar.cc/150?img=33', away: 'H. Pickering', awayImg: 'https://i.pravatar.cc/150?img=57' },
    { home: 'M. Ducksch', homeImg: 'https://i.pravatar.cc/150?img=18', away: 'R. Morishita', awayImg: 'https://i.pravatar.cc/150?img=9' },
    { home: 'I. Osman', homeImg: 'https://i.pravatar.cc/150?img=67', away: 'T. Cantwell', awayImg: 'https://i.pravatar.cc/150?img=62' },
    { home: 'J. Stansfield', homeImg: 'https://i.pravatar.cc/150?img=51', away: 'Y. Ohashi', awayImg: 'https://i.pravatar.cc/150?img=3' }
  ];

  // Substitutes lists
  const homeSubstitutes = [
    { name: 'A. Priske', img: 'https://i.pravatar.cc/150?img=12' },
    { name: 'B. Osayi-Samuel', img: 'https://i.pravatar.cc/150?img=14' },
    { name: 'C. Vicente', img: 'https://i.pravatar.cc/150?img=15' },
    { name: 'D. Gray', img: 'https://i.pravatar.cc/150?img=16' },
    { name: 'J. Panzo', img: 'https://i.pravatar.cc/150?img=17' },
    { name: 'J. Solís', img: 'https://i.pravatar.cc/150?img=19' },
    { name: 'K. Fujimoto', img: 'https://i.pravatar.cc/150?img=20' },
    { name: 'P. Neumann', img: 'https://i.pravatar.cc/150?img=21' },
    { name: 'R. Allsop', img: 'https://i.pravatar.cc/150?img=22' }
  ];

  const awaySubstitutes = [
    { name: 'A. Pears', img: 'https://i.pravatar.cc/150?img=23' },
    { name: 'D. Neve', img: 'https://i.pravatar.cc/150?img=24' },
    { name: 'K. Montgomery', img: 'https://i.pravatar.cc/150?img=25' },
    { name: 'M. Jørgensen', img: 'https://i.pravatar.cc/150?img=26' },
    { name: 'N. Redmond', img: 'https://i.pravatar.cc/150?img=27' },
    { name: 'O. Afolayan', img: 'https://i.pravatar.cc/150?img=28' },
    { name: 'S. Tavares', img: 'https://i.pravatar.cc/150?img=29' },
    { name: 'Y. Ribeiro', img: 'https://i.pravatar.cc/150?img=30' }
  ];

  // League Table data
  const tableData = [
    { rank: 1, team: 'Coventry', p: 46, w: 28, pts: 95, logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png' },
    { rank: 2, team: 'Ipswich', p: 46, w: 23, pts: 84, logo: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png' },
    { rank: 3, team: 'Millwall', p: 46, w: 24, pts: 83, logo: 'https://cdn.sportmonks.com/images/soccer/teams/10/10.png' },
    { rank: 4, team: 'Southampton', p: 46, w: 22, pts: 80, logo: 'https://cdn.sportmonks.com/images/soccer/teams/3/3.png' },
    { rank: 5, team: 'Middlesbrough', p: 46, w: 22, pts: 80, logo: 'https://cdn.sportmonks.com/images/soccer/teams/2/2.png' },
    { rank: 6, team: 'Hull', p: 46, w: 21, pts: 73, logo: 'https://cdn.sportmonks.com/images/soccer/teams/6/6.png' },
    { rank: 7, team: 'Wrexham', p: 46, w: 19, pts: 71, logo: 'https://cdn.sportmonks.com/images/soccer/teams/12/12.png' },
    { rank: 8, team: 'Derby', p: 46, w: 20, pts: 69, logo: 'https://cdn.sportmonks.com/images/soccer/teams/28/28.png' },
    { rank: 9, team: 'Norwich', p: 46, w: 19, pts: 65, logo: 'https://cdn.sportmonks.com/images/soccer/teams/5/5.png' },
    { rank: 10, team: 'Birmingham', p: 46, w: 17, pts: 64, logo: 'https://cdn.sportmonks.com/images/soccer/teams/19/243.png' },
    { rank: 11, team: 'Swansea', p: 46, w: 18, pts: 64, logo: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png' },
    { rank: 12, team: 'Bristol', p: 46, w: 17, pts: 62, logo: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png' },
    { rank: 13, team: 'Sheff Utd', p: 46, w: 18, pts: 60, logo: 'https://cdn.sportmonks.com/images/soccer/teams/16/16.png' },
    { rank: 14, team: 'Preston', p: 46, w: 15, pts: 60, logo: 'https://cdn.sportmonks.com/images/soccer/teams/7/7.png' },
    { rank: 15, team: 'QPR', p: 46, w: 16, pts: 58, logo: 'https://cdn.sportmonks.com/images/soccer/teams/23/23.png' },
    { rank: 16, team: 'Watford', p: 46, w: 14, pts: 57, logo: 'https://cdn.sportmonks.com/images/soccer/teams/11/11.png' },
    { rank: 17, team: 'Stoke', p: 46, w: 15, pts: 55, logo: 'https://cdn.sportmonks.com/images/soccer/teams/24/24.png' }
  ];

  // Season stats values (Birmingham vs Blackburn)
  const seasonStats = [
    { label: 'Wins', home: 17, away: 13, total: 30 },
    { label: 'Possession', home: 53.74, away: 47.91, total: 101.65, percentage: true },
    { label: 'Goals', home: 57, away: 42, total: 99 },
    { label: 'Failed To Score', home: 11, away: 16, total: 27 },
    { label: 'Goals Conceded', home: 56, away: 56, total: 112 },
  ];

  const scoringMinutes = [
    { range: '0-15', home: 10, away: 5, total: 15 },
    { range: '15-30', home: 11, away: 6, total: 17 },
    { range: '30-45', home: 8, away: 11, total: 19 },
    { range: '45-60', home: 9, away: 6, total: 15 },
    { range: '60-75', home: 8, away: 4, total: 12 },
    { range: '75-90', home: 11, away: 10, total: 21 },
  ];

  return (
    <div className="match-detail-container">
      {/* ── Shared Fixed Header ── */}
      <Header />

      {/* ── Sub Navigation Top ── */}
      <div className="md-sub-nav">
        <button className="md-back-btn" onClick={onBack} aria-label="Go Back">
          <FiChevronLeft size={24} />
        </button>
        <div className="md-tabs">
          <button className={`md-tab ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
            <DocIcon />
          </button>
          <button className={`md-tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
            <LiveWavesIcon />
          </button>
          <button className={`md-tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
            <PitchIcon />
          </button>
          <button className={`md-tab ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
            <TableGridIcon />
          </button>
          <button className={`md-tab ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>
            <ChartIcon />
          </button>
        </div>
      </div>

      {/* ── Top Match Card Info ── */}
      <div className="md-match-info-card">
        <div className="md-league-strip">
          {leagueFlag(matchInfo.league)
            ? <img className="md-flag-img" src={leagueFlag(matchInfo.league)} alt="" />
            : <span className="md-flag">⚽</span>}
          <span className="md-league-name">{matchInfo.league}</span>
          <span className="md-match-date">{matchInfo.date}</span>
        </div>

        <div className="md-score-board">
          <div className="md-status-label">{matchInfo.status}</div>
          <div className="md-teams-scores">
            <div className="md-team-score-row">
              <div className="md-team-box">
                <span className="md-team-color Birmingham-color"></span>
                <span className="md-team-name">{matchInfo.home}</span>
              </div>
              <span className="md-score-val">{matchInfo.homeScore}</span>
            </div>
            <div className="md-team-score-row">
              <div className="md-team-box">
                <span className="md-team-color Blackburn-color"></span>
                <span className="md-team-name">{matchInfo.away}</span>
              </div>
              <span className="md-score-val">{matchInfo.awayScore}</span>
            </div>
          </div>
        </div>

        <div className="md-action-buttons">
          <button className="md-btn-freebet">£30 Free Bet</button>
          <button className="md-btn-highlights">
            Highlights
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Sub Views Rendered Based on Active Tab ── */}
      <div className="md-view-content">

        {/* ── TAB 0: Match Center & Live Match Stats (Tactical Pitch) ── */}
        {activeTab === 0 && (
          <div className="md-match-center">
            {/* Formation Selectors */}
            <div className="md-formation-selectors">
              <div className="md-formation-select-wrap">
                <label>Everton Formation:</label>
                <select value={homeFormation} onChange={(e) => setHomeFormation(e.target.value)}>
                  <option value="3-4-2-1">3-4-2-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                </select>
              </div>
              <div className="md-formation-select-wrap right">
                <label>Man City Formation:</label>
                <select value={awayFormation} onChange={(e) => setAwayFormation(e.target.value)}>
                  <option value="4-3-2-1">4-3-2-1</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="3-5-2">3-5-2</option>
                </select>
              </div>
            </div>

            <h3 className="md-section-title">Live Match Stats</h3>

            {/* Horizontal Stats Scroll list */}
            <div className="md-stats-strip-container">
              <div className="md-stats-strip">
                {matchStats.map((st) => (
                  <div
                    className={`md-stat-pill ${selectedStat === st.label ? 'active' : ''}`}
                    key={st.label}
                    onClick={() => setSelectedStat(st.label)}
                  >
                    <span className="md-stat-label">{st.label}</span>
                    <span className="md-stat-value">{st.val}</span>
                  </div>
                ))}
              </div>
              <div className="md-scrollbar-indicator">
                <div className="md-scrollbar-fill"></div>
              </div>
            </div>

            {/* Tactical pitch graphics container */}
            <div className="md-pitch-outer pitch-clean">
              <div className="md-pitch-field pitch-white">
                {/* Center Circle & Penalty Box Lines */}
                <div className="pitch-center-circle-white"></div>
                <div className="pitch-center-line-white"></div>
                <div className="pitch-penalty-box-top-white"></div>
                <div className="pitch-penalty-box-bottom-white"></div>
                <div className="pitch-corner-tl"></div>
                <div className="pitch-corner-tr"></div>
                <div className="pitch-corner-bl"></div>
                <div className="pitch-corner-br"></div>

                {/* Everton Players (Top half) */}
                {homeLineup.map((pl) => (
                  <div
                    className="md-pitch-player player-anim"
                    key={pl.name}
                    style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
                  >
                    <div className="player-avatar-wrap">
                      <img className="player-avatar-white blue-border" src={pl.img} alt={pl.name} />
                      {pl.sub === 'off' && (
                        <div className="player-badge sub-off-arrow-red">↓</div>
                      )}
                    </div>
                    <div className="player-pill-group">
                      <div className="player-name-pill blue-bg-white-text">{pl.name}</div>
                      <div className={`player-rating-pill ${pl.isHighRating ? 'green-bg-white-text' : 'blue-bg-white-text'}`}>
                        {pl.stats[selectedStat]}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Man City Players (Bottom half) */}
                {awayLineup.map((pl) => (
                  <div
                    className="md-pitch-player player-anim"
                    key={pl.name}
                    style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
                  >
                    <div className="player-avatar-wrap">
                      <img className="player-avatar-white grey-border" src={pl.img} alt={pl.name} />
                      {pl.sub === 'off' && (
                        <div className="player-badge sub-off-arrow-red">↓</div>
                      )}
                      {pl.yellow && (
                        <div className="player-badge yellow-card-icon"></div>
                      )}
                      {pl.goal && (
                        <div className="player-badge soccer-ball-icon">⚽</div>
                      )}
                      {pl.star && (
                        <div className="player-badge star-icon">★</div>
                      )}
                    </div>
                    <div className="player-pill-group">
                      <div className="player-name-pill grey-bg-white-text">{pl.name}</div>
                      <div className={`player-rating-pill ${pl.isHighRating ? 'green-bg-white-text' : 'grey-bg-white-text'}`}>
                        {pl.stats[selectedStat]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Timeline & Commentary ── */}
        {activeTab === 1 && (
          <div className="md-timeline-center">
            {/* Timeline Sub-tabs */}
            <div className="md-timeline-sub-nav">
              <button
                className={`md-timeline-sub-tab ${timelineTab === 'Timeline' ? 'active' : ''}`}
                onClick={() => setTimelineTab('Timeline')}
              >
                Timeline
              </button>
              <button
                className={`md-timeline-sub-tab ${timelineTab === 'Commentary' ? 'active' : ''}`}
                onClick={() => setTimelineTab('Commentary')}
              >
                Commentary
              </button>
            </div>

            {timelineTab === 'Timeline' ? (
              <div className="md-timeline-view">
                {/* Visual team header */}
                <div className="md-timeline-teams-header">
                  <div className="md-timeline-team-logo-wrap">
                    {/* Placeholder custom crest Birmingham */}
                    <div className="md-crest Birmingham-bg">BC</div>
                  </div>
                  <div className="md-timeline-league-score">
                    <span className="md-tl-title">Championship</span>
                    <span className="md-tl-score">0 : 1</span>
                  </div>
                  <div className="md-timeline-team-logo-wrap">
                    {/* Placeholder custom crest Blackburn */}
                    <div className="md-crest Blackburn-bg">BR</div>
                  </div>
                </div>

                {/* Vertical timeline timeline */}
                <div className="md-timeline-stream">
                  <div className="md-timeline-line"></div>

                  {timelineEvents.map((ev, idx) => {
                    if (ev.type === 'halftime' || ev.type === 'kickoff') {
                      return (
                        <div className="md-timeline-period-bar" key={`${ev.type}-${idx}`}>
                          <span>{ev.label}</span>
                        </div>
                      );
                    }

                    return (
                      <div className={`md-timeline-row ${ev.team}-event`} key={`${ev.min}-${idx}`}>
                        <div className="md-event-bubble-col">
                          {ev.type === 'goal' ? (
                            <div className="md-event-badge-center goal-badge">
                              <div className="md-event-logo-mini">BR</div>
                              <span className="md-event-badge-min">{ev.min}</span>
                            </div>
                          ) : (
                            <>
                              <div className="md-event-badge-dot"></div>
                              <span className="md-event-badge-time">{ev.min}</span>
                            </>
                          )}
                        </div>

                        <div className="md-event-details-card">
                          {ev.type === 'sub' && (
                            <div className="md-event-sub-info">
                              <div className="md-sub-row">
                                <span className="sub-off-dot">●</span>
                                <span className="sub-player-off">{ev.off}</span>
                              </div>
                              <div className="md-sub-row">
                                <span className="sub-on-dot">●</span>
                                <span className="sub-player-on">{ev.on}</span>
                              </div>
                            </div>
                          )}

                          {ev.type === 'goal' && (
                            <div className="md-event-goal-info">
                              <div className="goal-scorer">{ev.scorer}</div>
                              <div className="goal-assister">{ev.assister}</div>
                            </div>
                          )}

                          {ev.type === 'card' && (
                            <div className="md-event-card-info">
                              <span className="yellow-card-rect"></span>
                              <span className="card-player-name">{ev.player}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="md-commentary-view">
                <div className="commentary-item">
                  <span className="commentary-min">90+3'</span>
                  <p className="commentary-text">Full-time here at Birmingham. Blackburn seals a 1-0 away victory.</p>
                </div>
                <div className="commentary-item">
                  <span className="commentary-min">90'</span>
                  <p className="commentary-text">Four minutes of added time indicated by the fourth official.</p>
                </div>
                <div className="commentary-item">
                  <span className="commentary-min">85'</span>
                  <p className="commentary-text">Birmingham throwing everything forward but Blackburn's defense is holding strong.</p>
                </div>
                <div className="commentary-item font-highlight">
                  <span className="commentary-min">60'</span>
                  <p className="commentary-text"><strong>GOAL!</strong> Cantwell opens the scoring with a brilliant strike, assisted by Morishita. Birmingham 0, Blackburn 1.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Starting Lineups list & Substitutes list ── */}
        {activeTab === 2 && (
          <div className="md-lineups-center">
            {/* Headers */}
            <div className="md-lineups-teams-header">
              <div className="md-team-label-half">
                <div className="md-crest Birmingham-bg mini">BC</div>
              </div>
              <div className="md-team-label-half right-align">
                <div className="md-crest Blackburn-bg mini">BR</div>
              </div>
            </div>

            {/* Start 11 rows */}
            <div className="md-lineups-list">
              {startingXI.map((row, idx) => (
                <div className="md-lineup-row" key={idx}>
                  {/* Home Player */}
                  <div className="md-player-col home-player">
                    <img className="md-player-img" src={row.homeImg} alt={row.home} />
                    <span className="md-player-fullname">{row.home}</span>
                  </div>

                  {/* Away Player */}
                  <div className="md-player-col away-player">
                    <span className="md-player-fullname">{row.away}</span>
                    <img className="md-player-img" src={row.awayImg} alt={row.away} />
                  </div>
                </div>
              ))}
            </div>

            {/* Substitutes Headers */}
            <div className="md-subs-section-title">
              <span>Substitutes</span>
              <span>Substitutes</span>
            </div>

            {/* Substitutes list */}
            <div className="md-subs-list-container">
              <div className="md-subs-columns">
                {/* Left column (Birmingham subs) */}
                <div className="md-subs-col">
                  {homeSubstitutes.map((sub, idx) => (
                    <div className="md-sub-item-card" key={idx}>
                      <span className="md-sub-profile-icon">👤</span>
                      <span className="md-sub-name-text">{sub.name}</span>
                    </div>
                  ))}
                </div>

                {/* Right column (Blackburn subs) */}
                <div className="md-subs-col">
                  {awaySubstitutes.map((sub, idx) => (
                    <div className="md-sub-item-card right-align-sub" key={idx}>
                      <span className="md-sub-name-text">{sub.name}</span>
                      <img className="md-sub-avatar-img" src={sub.img} alt={sub.name} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Live Standings Table ── */}
        {activeTab === 3 && (
          <div className="md-table-center">
            <div className="md-table-card">
              <div className="md-table-header-row">
                <div className="md-table-col-team">TEAMS</div>
                <div className="md-table-col-stat">P</div>
                <div className="md-table-col-stat">W</div>
                <div className="md-table-col-stat">PTS</div>
              </div>

              <div className="md-table-rows">
                {tableData.map((row) => (
                  <div
                    className={`md-table-body-row ${row.team === 'Birmingham' ? 'birmingham-highlight' : ''}`}
                    key={row.rank}
                  >
                    <div className="md-table-col-team">
                      <span className="md-table-rank">{row.rank}</span>
                      <img className="md-table-team-logo" src={row.logo} alt={row.team} onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E';
                      }} />
                      <span className="md-table-team-name">{row.team}</span>
                    </div>
                    <div className="md-table-col-stat">{row.p}</div>
                    <div className="md-table-col-stat">{row.w}</div>
                    <div className="md-table-col-stat bold-pts">{row.pts}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Season Stats Charts ── */}
        {activeTab === 4 && (
          <div className="md-season-stats">
            <h3 className="md-stats-title">Season Stats</h3>

            {/* List of general season stats */}
            <div className="md-stats-bars-list">
              {seasonStats.map((st) => {
                const homeRatio = (st.home / st.total) * 100;
                const awayRatio = (st.away / st.total) * 100;

                return (
                  <div className="md-stat-bar-group" key={st.label}>
                    <div className="md-stat-bar-labels">
                      <span className="md-stat-bar-val left-val">{st.home}{st.percentage ? '%' : ''}</span>
                      <span className="md-stat-bar-name">{st.label}</span>
                      <span className="md-stat-bar-val right-val">{st.away}{st.percentage ? '%' : ''}</span>
                    </div>
                    <div className="md-stat-progress-track">
                      <div className="progress-blue" style={{ width: `${homeRatio}%` }}></div>
                      <div className="progress-yellow" style={{ width: `${awayRatio}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider lines for scoring minutes */}
            <div className="md-scoring-minutes-header">
              <span className="line-divider"></span>
              <span className="header-text">Scoring Minutes</span>
              <span className="line-divider"></span>
            </div>

            {/* List of scoring minutes */}
            <div className="md-stats-bars-list">
              {scoringMinutes.map((st) => {
                const homeRatio = (st.home / st.total) * 100;
                const awayRatio = (st.away / st.total) * 100;

                return (
                  <div className="md-stat-bar-group" key={st.range}>
                    <div className="md-stat-bar-labels font-small">
                      <span className="md-stat-bar-val left-val">{st.home}</span>
                      <span className="md-stat-bar-name">{st.range}</span>
                      <span className="md-stat-bar-val right-val">{st.away}</span>
                    </div>
                    <div className="md-stat-progress-track">
                      <div className="progress-blue" style={{ width: `${homeRatio}%` }}></div>
                      <div className="progress-yellow" style={{ width: `${awayRatio}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Percentage Bar & Man of the Match ── */}
      <div className="md-percentage-footer">
        <div className="md-percentage-progress">
          <div className="progress-blue-half" style={{ width: '66%' }}>
            <span>66%</span>
          </div>
          <div className="progress-yellow-half" style={{ width: '34%' }}>
            <span>34%</span>
          </div>
        </div>
        <div className="md-motm-strip">
          <span className="md-motm-label">Blackburn's man of the match: B. Tóth</span>
        </div>
      </div>
    </div>
  );
}
