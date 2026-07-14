import { useEffect, useRef, useState } from 'react';
import { IoFootballOutline } from 'react-icons/io5';
import { FiChevronDown } from 'react-icons/fi';
import { api } from '../lib/api';
import './TablePage.css';

// Sensible first load: Arsenal's upstream club id resolves to England /
// Premier League. From there the country dropdown + league tabs drive
// everything via the live league-table API.
const DEFAULT_CLUB_ID = 19;

// Team badge with a graceful fallback to a generic football icon when the
// upstream image is missing or fails to load.
function TeamBadge({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="tp-team-logo tp-team-logo-fallback">
        <IoFootballOutline />
      </span>
    );
  }
  return (
    <img
      className="tp-team-logo"
      src={src}
      alt={alt || ''}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function TablePage() {
  const [data, setData] = useState(null);            // full upstream data block
  const [activeLeagueId, setActiveLeagueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [leagueMenuOpen, setLeagueMenuOpen] = useState(false);

  const reqRef = useRef(0); // guards against out-of-order responses

  // Core loader. Pass exactly one selector via `params`. `nextActiveLeagueId`
  // is the league to highlight once the response lands: for league clicks we
  // know it up front; for club/country loads we derive it from the first
  // league the API returns for that country.
  async function load(params, nextActiveLeagueId) {
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(false);
    setCountryOpen(false);
    setLeagueMenuOpen(false);
    try {
      const res = await api.getLeagueTable(params);
      if (reqId !== reqRef.current) return; // superseded by a newer request
      const block = res && res.data ? res.data : null;
      if (!block) {
        setError(true);
        return;
      }
      setData(block);
      const leagues = Array.isArray(block.country_leagues) ? block.country_leagues : [];
      const fallbackId = leagues.length ? leagues[0].id : null;
      setActiveLeagueId(nextActiveLeagueId != null ? nextActiveLeagueId : fallbackId);
    } catch {
      if (reqId === reqRef.current) setError(true);
    } finally {
      if (reqId === reqRef.current) setLoading(false);
    }
  }

  // First load.
  useEffect(() => {
    load({ clubId: DEFAULT_CLUB_ID });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries      = data && Array.isArray(data.all_countries) ? data.all_countries : [];
  const currentCountry = data ? data.current_country : null;
  const leagues        = data && Array.isArray(data.country_leagues) ? data.country_leagues : [];
  const standings      = data && Array.isArray(data.standings) ? data.standings : [];
  const activeLeagueName = (leagues.find((l) => l.id === activeLeagueId) || {}).title || '';
  const countryName      = currentCountry ? currentCountry.title : '';

  const primaryLeagues   = leagues.slice(0, 2);  // the 2 tabs shown by default
  const overflowLeagues  = leagues.slice(2);     // the rest live in a dropdown
  const activeInOverflow = overflowLeagues.some((l) => l.id === activeLeagueId);

  const selectCountry = (c) => load({ countryId: c.id });
  const selectLeague  = (l) => load({ leagueId: l.id }, l.id);

  const toggleCountry = () => { setCountryOpen((o) => !o); setLeagueMenuOpen(false); };
  const toggleLeagueMenu = () => { setLeagueMenuOpen((o) => !o); setCountryOpen(false); };

  return (
    <div className="table-page">
      <div className="tp-header">
        <div className="pp-header-logo">
          <div className="logo-circle"><img src="/social442-logo.png" alt="" /></div>
          <span className="logo-text">Social <span className="logo-442">442</span></span>
        </div>
      </div>

      <div className="tp-controls">
        <div className="tp-country-wrap">
          <button type="button" className="tp-country" onClick={toggleCountry}>
            {currentCountry && currentCountry.image
              ? <img className="tp-country-flag" src={currentCountry.image} alt="" />
              : <span className="tp-country-flag-fallback">🏳️</span>}
            {currentCountry ? currentCountry.title : 'Country'}
            <FiChevronDown size={12} />
          </button>
          {countryOpen && countries.length > 0 ? (
            <div className="tp-menu tp-country-menu">
              {countries.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`tp-menu-item ${currentCountry && c.id === currentCountry.id ? 'active' : ''}`}
                  onClick={() => selectCountry(c)}
                >
                  {c.image ? <img className="tp-menu-flag" src={c.image} alt="" /> : null}
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="tp-leagues">
          {primaryLeagues.map((l) => (
            <button
              type="button"
              key={l.id}
              className={`tp-league ${l.id === activeLeagueId ? 'active' : ''}`}
              onClick={() => selectLeague(l)}
            >
              {l.title}
            </button>
          ))}

          {overflowLeagues.length > 0 ? (
            <div className="tp-league-more-wrap">
              <button
                type="button"
                className={`tp-league tp-league-more ${activeInOverflow ? 'active' : ''}`}
                onClick={toggleLeagueMenu}
              >
                More <FiChevronDown size={12} />
              </button>
              {leagueMenuOpen ? (
                <div className="tp-menu tp-league-menu">
                  {overflowLeagues.map((l) => (
                    <button
                      type="button"
                      key={l.id}
                      className={`tp-menu-item ${l.id === activeLeagueId ? 'active' : ''}`}
                      onClick={() => selectLeague(l)}
                    >
                      {l.image ? <img className="tp-menu-flag" src={l.image} alt="" /> : null}
                      <span>{l.title}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="tp-content">
        {data && data.last_updated && standings.length > 0 ? (
          <div className="tp-updated">Last Updated: {data.last_updated}</div>
        ) : null}

        {!loading && standings.length === 0 ? (
          <div className="tp-empty-card">
            <div className="tp-empty-anim">
              <span className="tp-empty-orbit" />
              <IoFootballOutline className="tp-empty-ball" />
            </div>
            <div className="tp-empty-title">{error ? 'Couldn’t load the table' : 'No standings yet'}</div>
            <p className="tp-empty-text">
              {error
                ? 'Something went wrong while loading the table. Please try again in a moment.'
                : `${activeLeagueName || 'This league'}${countryName ? ` · ${countryName}` : ''} doesn’t have a standings table available right now.`}
            </p>
          </div>
        ) : (
        <div className="tp-table">
          <div className="tp-row tp-head">
            <div className="tp-rank">#</div>
            <div className="tp-team-col">TEAMS</div>
            <div>P</div>
            <div>W</div>
            <div>D</div>
            <div>L</div>
            <div>GD</div>
            <div className="tp-pts">PTS</div>
          </div>

          {loading && standings.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div className="tp-row tp-row-skeleton" key={`sk-${i}`}>
                  <div className="tp-rank">{i + 1}</div>
                  <div className="tp-team-col">
                    <span className="tp-skel tp-skel-logo" />
                    <span className="tp-skel tp-skel-name" />
                  </div>
                  <div><span className="tp-skel tp-skel-cell" /></div>
                  <div><span className="tp-skel tp-skel-cell" /></div>
                  <div><span className="tp-skel tp-skel-cell" /></div>
                  <div><span className="tp-skel tp-skel-cell" /></div>
                  <div><span className="tp-skel tp-skel-cell" /></div>
                  <div className="tp-pts"><span className="tp-skel tp-skel-cell" /></div>
                </div>
              ))
            : null}

          {standings.map((row, index) => {
            const gd = Number(row.goals_diff) || 0;
            return (
              <div className="tp-row" key={`${row.club_id}-${index}`}>
                <div className="tp-rank">{index + 1}</div>
                <div className="tp-team-col">
                  <TeamBadge src={row.image} alt={row.title} />
                  <span className="tp-team-name">{row.title}</span>
                </div>
                <div>{row.games_played}</div>
                <div>{row.games_won}</div>
                <div>{row.games_drawn}</div>
                <div>{row.games_lost}</div>
                <div>{gd > 0 ? `+${gd}` : gd}</div>
                <div className="tp-pts">{row.points}</div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
