import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { api } from '../lib/api';
import Header from '../components/Header';
import MatchDetail from '../components/MatchDetail';
import './FixturesPage.css';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Which club's fixtures to show. The upstream only returns data for clubs that
// have scheduled matches, so we default to a club known to have fixtures and
// allow an env override (VITE_FIXTURES_CLUB_ID).
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const FIXTURES_CLUB_ID = Number(ENV.VITE_FIXTURES_CLUB_ID) || 22822;

const HALF_YEAR_MS = 1000 * 60 * 60 * 24 * 182;

// The upstream gives a pre-localized, year-less string like "Fri 26 Jun, 8:00pm".
// Parse it into a month index (for the month strip) and a concrete Date (to tell
// upcoming vs played). The year is inferred as the one that places the match
// closest to "now", which is robust for a rolling fixtures window.
function parseDateTime(dateTime) {
  if (!dateTime || typeof dateTime !== 'string') {
    return { monthIndex: null, date: null };
  }
  const dayMonth = dateTime.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (!dayMonth) return { monthIndex: null, date: null };

  const dom = parseInt(dayMonth[1], 10);
  const monthAbbr = dayMonth[2][0].toUpperCase() + dayMonth[2].slice(1, 3).toLowerCase();
  const monthIndex = months.indexOf(monthAbbr);
  if (monthIndex < 0) return { monthIndex: null, date: null };

  let hours = 0;
  let minutes = 0;
  const time = dateTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (time) {
    hours = parseInt(time[1], 10) % 12;
    if (/pm/i.test(time[3])) hours += 12;
    minutes = parseInt(time[2], 10);
  }

  const now = new Date();
  let date = new Date(now.getFullYear(), monthIndex, dom, hours, minutes);
  if (date.getTime() - now.getTime() > HALF_YEAR_MS) {
    date = new Date(now.getFullYear() - 1, monthIndex, dom, hours, minutes);
  } else if (now.getTime() - date.getTime() > HALF_YEAR_MS) {
    date = new Date(now.getFullYear() + 1, monthIndex, dom, hours, minutes);
  }
  return { monthIndex, date };
}

function normalizeFixture(raw) {
  const { monthIndex, date } = parseDateTime(raw.date_time);
  const upcoming = date ? date.getTime() > Date.now() : false;
  return {
    id: String(raw.id),
    monthIndex,
    date,
    status: upcoming ? 'Upcoming' : 'FT',
    home: raw.home_team,
    away: raw.away_team,
    // Scores only mean something for matches that have been played.
    homeScore: upcoming ? '-' : (raw.home_score ?? '-'),
    awayScore: upcoming ? '-' : (raw.away_score ?? '-'),
    dateLabel: raw.date_time || '',
  };
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState([]);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const userPickedMonth = useRef(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    api
      .getClubFixtures({ clubId: FIXTURES_CLUB_ID, signal: controller.signal })
      .then((payload) => {
        if (!active) return;
        const list = Array.isArray(payload && payload.fixtures) ? payload.fixtures : [];
        const normalized = list
          .map(normalizeFixture)
          .sort((a, b) => {
            const ta = a.date ? a.date.getTime() : 0;
            const tb = b.date ? b.date.getTime() : 0;
            return ta - tb;
          });
        setFixtures(normalized);
        if (!payload || payload.status === false) setError(true);

        // If the current month has no fixtures, jump to the month of the next
        // upcoming fixture (or the first one) so the user lands on real data.
        if (!userPickedMonth.current && normalized.length) {
          const nowMonth = new Date().getMonth();
          const hasCurrent = normalized.some((f) => f.monthIndex === nowMonth);
          if (!hasCurrent) {
            const upcoming = normalized.find((f) => f.date && f.date.getTime() > Date.now());
            const target = upcoming || normalized[0];
            if (target.monthIndex != null) setActiveMonth(target.monthIndex);
          }
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const year = useMemo(() => {
    const withDate = fixtures.find((f) => f.date);
    return withDate ? withDate.date.getFullYear() : new Date().getFullYear();
  }, [fixtures]);

  const visibleFixtures = useMemo(
    () => fixtures.filter((fixture) => fixture.monthIndex === activeMonth),
    [fixtures, activeMonth],
  );

  // The API only returns a small rolling window, so most months have no data.
  // Track which months actually have fixtures so we can disable the rest.
  const monthsWithData = useMemo(() => {
    const set = new Set();
    fixtures.forEach((f) => { if (f.monthIndex != null) set.add(f.monthIndex); });
    return set;
  }, [fixtures]);

  const selectMonth = (index) => {
    userPickedMonth.current = true;
    setActiveMonth(index);
  };

  if (selectedMatch) {
    return <MatchDetail onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="fixtures-page">
      <Header />

      <div className="fp-month-strip">
        <button className="fp-year-pill">{year}</button>
        <div className="fp-months">
          {months.map((month, index) => {
            // Only enable months once fixtures have loaded and contain data.
            const monthsReady = !loading && fixtures.length > 0;
            const hasData = monthsWithData.has(index);
            const disabled = monthsReady && !hasData;
            return (
              <button
                key={month}
                className={`fp-month ${activeMonth === index ? 'active' : ''} ${disabled ? 'fp-month-empty' : ''}`}
                onClick={() => { if (!disabled) selectMonth(index); }}
                disabled={disabled}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fp-list">
        {loading ? (
          <div className="fp-fixture">
            <div className="fp-status">Loading…</div>
            <div className="fp-date">Fetching the latest fixtures.</div>
          </div>
        ) : visibleFixtures.length ? (
          visibleFixtures.map((fixture) => (
            <div
              className="fp-fixture"
              key={fixture.id}
              onClick={() => setSelectedMatch(fixture)}
            >
              <div className="fp-status">{fixture.status}</div>
              <div className="fp-teams">
                <div className="fp-team-row">
                  <span className="fp-team-name">{fixture.home}</span>
                  <div className="fp-score-box">{fixture.homeScore}</div>
                </div>
                <div className="fp-team-row">
                  <span className="fp-team-name">{fixture.away}</span>
                  <div className="fp-score-box">{fixture.awayScore}</div>
                </div>
              </div>
              <div className="fp-bottom">
                <div className="fp-date">{fixture.dateLabel}</div>
                <div className="fp-links">
                  <button
                    className="fp-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMatch(fixture);
                    }}
                  >
                    Player Ratings <FiChevronRight size={12} />
                  </button>
                  <button
                    className="fp-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMatch(fixture);
                    }}
                  >
                    Highlights <FiChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="fp-fixture">
            <div className="fp-status">No Data</div>
            <div className="fp-date">
              {error
                ? 'Couldn’t load fixtures right now. Try again in a moment.'
                : `No fixtures scheduled for ${months[activeMonth]} ${year}.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
