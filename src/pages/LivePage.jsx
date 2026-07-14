import { useEffect, useMemo, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { leagueFlag } from '../lib/flags';
import { fetchJson } from '../lib/api';
import Header from '../components/Header';
import MatchDetail from '../components/MatchDetail';
import './LivePage.css';

const fallbackLeagues = [
  {
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    name: 'Championship',
    date: '3 Apr',
    matches: [
      { status: 'FT', home: 'Birmingham', homeScore: 0, away: 'Blackburn', awayScore: 1 }
    ]
  },
  {
    flag: '🇧🇪',
    name: 'Pro League',
    date: '31 MAY',
    matches: [{ status: 'FT', home: 'Gent', homeScore: 1, away: 'Genk', awayScore: 1, pen: true }],
  },
  {
    flag: '🇸🇪',
    name: 'Allsvenskan',
    date: '31 MAY',
    matches: [
      { status: 'FT', home: 'Västerås SK', homeScore: 4, away: 'IFK Göteborg', awayScore: 5 },
      { status: 'FT', home: 'Häcken', homeScore: 3, away: 'Hammarby', awayScore: 2 },
    ],
  },
];

function buildDateOptions() {
  const now = new Date();
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + index));
    return {
      iso: date.toISOString().slice(0, 10),
      day: index === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
      sub: index === 0 ? '' : `${date.getUTCDate()} ${date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}`,
    };
  });
}

export default function LivePage() {
  const dates = useMemo(() => buildDateOptions(), []);
  const [activeDate, setActiveDate] = useState(0);
  const [leagues, setLeagues] = useState(fallbackLeagues);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    let active = true;
    const selectedDate = dates[activeDate]?.iso;
    if (!selectedDate) return undefined;

    fetchJson(`/live?date=${selectedDate}`, { fallback: { leagues: fallbackLeagues } }).then((payload) => {
      if (active && payload?.leagues) {
        setLeagues(payload.leagues.length ? payload.leagues : []);
      }
    });

    return () => {
      active = false;
    };
  }, [activeDate, dates]);

  if (selectedMatch) {
    return <MatchDetail onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="live-page">
      <Header />

      <div className="lv-dates">
        {dates.map((date, index) => (
          <button
            key={date.iso}
            className={`lv-date ${activeDate === index ? 'active' : ''}`}
            onClick={() => setActiveDate(index)}
          >
            <span className="lv-day">{date.day}</span>
            {date.sub && <span className="lv-sub">{date.sub}</span>}
          </button>
        ))}
      </div>

      <div className="lv-content">
        {leagues.length ? leagues.map((league, leagueIndex) => (
          <div className="lv-league" key={`${league.name}-${leagueIndex}`}>
            <div className="lv-league-head">
              <span className="lv-flag">
                {leagueFlag(league.name)
                  ? <img className="lv-flag-img" src={leagueFlag(league.name)} alt="" />
                  : (league.flag || '⚽')}
              </span>
              <span className="lv-league-name">{league.name}</span>
              <span className="lv-league-date">{league.date}</span>
            </div>
            {league.matches.map((match, matchIndex) => (
              <div
                className="lv-match"
                key={`${match.home}-${match.away}-${matchIndex}`}
                onClick={() => setSelectedMatch(match)}
                style={{ cursor: 'pointer' }}
              >
                <div className="lv-status">{match.status}</div>
                <div className="lv-teams-col">
                  <div className="lv-team-line">
                    <span className="lv-team-name">{match.home}</span>
                    {match.pen && <span className="lv-pen">Pen <FiCheck size={9} /></span>}
                  </div>
                  <div className="lv-team-line">
                    <span className="lv-team-name">{match.away}</span>
                  </div>
                </div>
                <div className="lv-scores-col">
                  <div className="lv-score">{match.homeScore}</div>
                  <div className="lv-score">{match.awayScore}</div>
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div className="lv-league">
            <div className="lv-league-head">
              <span className="lv-flag">⚽</span>
              <span className="lv-league-name">No matches found</span>
              <span className="lv-league-date">{dates[activeDate]?.sub?.toUpperCase() || 'TODAY'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

