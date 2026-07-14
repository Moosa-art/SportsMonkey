import { memo } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';

/**
 * MatchStatsCard
 *
 * Home-vs-away match statistics comparison, rendered from the SAME
 * `player_rating_post` payload the ratings pitch uses (its
 * `lineup_formation.maxStats`). No extra network call — pure presentation.
 * Renders nothing when the payload carries no team stats.
 */
const STAT_ROWS = [
  { key: 'shots', label: 'Shots' },
  { key: 'passes', label: 'Passes' },
  { key: 'passing-acc', label: 'Pass Acc', unit: '%' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'crosses', label: 'Crosses' },
  { key: 'clearances', label: 'Clearances' },
  { key: 'interceptions', label: 'Interceptions' },
];

function MatchStatsCard({ tile, dedupeId, eng = {} }) {
  const ms = tile && tile.matchStats;
  if (!ms || (!ms.home && !ms.away)) return null;
  const m = tile.match || {};
  const home = ms.home || {};
  const away = ms.away || {};

  const rows = STAT_ROWS.map((r) => ({
    ...r,
    h: Number(home[r.key]) || 0,
    a: Number(away[r.key]) || 0,
  })).filter((r) => r.h || r.a);

  if (!rows.length) return null;

  return (
    <section className="cf-card cf-ms">
      <header className="cf-ms-head">
        <span className="cf-ms-team">
          <span className="cf-ms-crest">
            <SmartImage src={m.homeImg} alt={m.homeTitle} label={m.homeTitle} contain />
          </span>
          <span className="cf-ms-tname">{m.homeTitle || 'Home'}</span>
        </span>
        <span className="cf-ms-title">Match Stats</span>
        <span className="cf-ms-team cf-ms-team-right">
          <span className="cf-ms-tname">{m.awayTitle || 'Away'}</span>
          <span className="cf-ms-crest">
            <SmartImage src={m.awayImg} alt={m.awayTitle} label={m.awayTitle} contain />
          </span>
        </span>
      </header>

      <ul className="cf-ms-list">
        {rows.map((r, i) => {
          const total = r.h + r.a || 1;
          const hp = Math.round((r.h / total) * 100);
          const ap = 100 - hp;
          return (
            <li className="cf-ms-row" key={i}>
              <span className="cf-ms-val cf-ms-val-h">
                {r.h}
                {r.unit || ''}
              </span>
              <span className="cf-ms-mid">
                <span className="cf-ms-label">{r.label}</span>
                <span className="cf-ms-bar">
                  <span className="cf-ms-bar-h" style={{ width: `${hp}%` }} />
                  <span className="cf-ms-bar-a" style={{ width: `${ap}%` }} />
                </span>
              </span>
              <span className="cf-ms-val cf-ms-val-a">
                {r.a}
                {r.unit || ''}
              </span>
            </li>
          );
        })}
      </ul>

      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

export default memo(MatchStatsCard);
