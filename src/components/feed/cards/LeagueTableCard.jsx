import { memo, useEffect, useState } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';
import { api } from '../../../lib/api';
import { CLUB_ID } from '../../../lib/feed/feedConfig';

// Shared, session-cached league-table request so every League Table card reuses
// one fetch instead of each firing (and aborting) its own — removes the
// AbortError noise and reduces load on the BFF.
const _tableCache = new Map();
function loadLeagueTable(clubId) {
  if (!_tableCache.has(clubId)) {
    _tableCache.set(
      clubId,
      api.getLeagueTable({ clubId }).catch((err) => {
        _tableCache.delete(clubId); // allow a later mount to retry
        throw err;
      }),
    );
  }
  return _tableCache.get(clubId);
}

/**
 * LeagueTableCard
 *
 * Full, data-backed league standings rendered inline in the club feed. The
 * club-feed payload only carries a `league_table_story` POINTER (no data), so
 * this card lazily fetches the real standings from the BFF
 * (`/api/league-table?club_id=…`) the same way the dedicated Table tab does.
 *
 * Behaviour:
 *  - Fetches once on mount, aborts on unmount.
 *  - Degrades to nothing (returns null) if the endpoint is unavailable or
 *    empty, so a feed item is never a broken/blank shell.
 *  - Highlights the current club's row.
 */
function LeagueTableCard({ tile, dedupeId, eng = {} }) {
  const clubId = (tile && tile.clubId) || CLUB_ID;
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'empty'
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    loadLeagueTable(clubId)
      .then((res) => {
        if (!alive) return;
        const standings =
          res && res.data && Array.isArray(res.data.standings) ? res.data.standings : [];
        if (standings.length) {
          setData(res.data);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (alive) setStatus('empty');
      });
    return () => {
      alive = false;
    };
  }, [clubId]);

  if (status === 'empty') return null;

  const league = data && data.country_leagues && data.country_leagues[0];
  const standings = (data && data.standings) || [];

  return (
    <section className="cf-card cf-ltable">
      <header className="cf-ltable-head">
        <span className="cf-ltable-ic">
          <SmartImage src={league && league.image} alt="" label={(league && league.title) || 'League'} contain />
        </span>
        <span className="cf-ltable-titles">
          <span className="cf-ltable-title">{(league && league.title) || 'League Table'}</span>
          {data && data.last_updated ? (
            <span className="cf-ltable-sub">Updated {data.last_updated}</span>
          ) : null}
        </span>
      </header>

      {status === 'loading' ? (
        <div className="cf-ltable-loading">Loading table…</div>
      ) : (
        <div className="cf-ltable-wrap">
          <div className="cf-ltable-row cf-ltable-colhead">
            <span className="cf-ltable-pos">#</span>
            <span className="cf-ltable-team">Team</span>
            <span className="cf-ltable-num">P</span>
            <span className="cf-ltable-num">W</span>
            <span className="cf-ltable-num">D</span>
            <span className="cf-ltable-num">L</span>
            <span className="cf-ltable-num">GD</span>
            <span className="cf-ltable-num cf-ltable-pts">Pts</span>
          </div>
          {standings.map((t, i) => {
            const me = String(t.club_id) === String(clubId);
            const gd = Number(t.goals_diff);
            return (
              <div className={`cf-ltable-row${me ? ' is-me' : ''}`} key={t.club_id || i}>
                <span className="cf-ltable-pos">{i + 1}</span>
                <span className="cf-ltable-team">
                  <span className="cf-ltable-crest">
                    <SmartImage src={t.image} alt={t.title} label={t.title} contain />
                  </span>
                  <span className="cf-ltable-name">{t.title}</span>
                </span>
                <span className="cf-ltable-num">{t.games_played}</span>
                <span className="cf-ltable-num">{t.games_won}</span>
                <span className="cf-ltable-num">{t.games_drawn}</span>
                <span className="cf-ltable-num">{t.games_lost}</span>
                <span className="cf-ltable-num">{gd > 0 ? `+${gd}` : gd}</span>
                <span className="cf-ltable-num cf-ltable-pts">{t.points}</span>
              </div>
            );
          })}
        </div>
      )}

      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

export default memo(LeagueTableCard);
