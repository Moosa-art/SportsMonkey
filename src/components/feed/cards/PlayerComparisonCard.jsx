import { memo, useMemo, useState } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';

/**
 * PlayerComparisonCard
 *
 * Renders the "Compare Players" selector from the live `club_player_comparison`
 * feed payload (club roster + seasons). Choosing two players + a season and
 * tapping "See Comparison" reveals the head-to-head matchup. The detailed stat
 * bars are populated by the comparison-results endpoint (wired once its URL is
 * confirmed); until then the matchup header is shown from real roster data.
 */
function PlayerPicker({ label, players, value, onChange }) {
  const sel = players.find((p) => String(p.id) === String(value)) || null;
  return (
    <div className="cf-cmp-side">
      <div className="cf-cmp-avatar">
        <SmartImage
          src={sel && sel.image}
          alt={sel ? sel.name : label}
          label={sel ? sel.name : '?'}
          contain
        />
      </div>
      <select className="cf-cmp-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label}</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function PlayerComparisonCard({ item, onComment, onShare, onReport }) {
  const players = item.players || [];
  const seasons = item.seasons || [];
  const [p1, setP1] = useState(players[0] ? String(players[0].id) : '');
  const [p2, setP2] = useState(players[1] ? String(players[1].id) : '');
  const [season, setSeason] = useState(seasons[0] ? String(seasons[0].id) : '');
  const [revealed, setRevealed] = useState(false);

  const player1 = useMemo(() => players.find((p) => String(p.id) === p1) || null, [players, p1]);
  const player2 = useMemo(() => players.find((p) => String(p.id) === p2) || null, [players, p2]);
  const ready = !!player1 && !!player2 && p1 !== p2;

  const p1Options = players.filter((p) => String(p.id) !== p2);
  const p2Options = players.filter((p) => String(p.id) !== p1);
  const seasonTitle = seasons.find((s) => String(s.id) === season);

  return (
    <section className="cf-card cf-cmp cf-grid-item">
      <header className="cf-cmp-head">
        {item.sourceImg && (
          <span className="cf-cmp-src-ic">
            <SmartImage src={item.sourceImg} alt={item.source} label={item.source} contain />
          </span>
        )}
        <span className="cf-cmp-src">{item.source || 'Player Comparison'}</span>
      </header>

      <h3 className="cf-cmp-title">Compare Players</h3>

      <div className="cf-cmp-pickers">
        <PlayerPicker
          label="Select"
          players={p1Options}
          value={p1}
          onChange={(v) => {
            setP1(v);
            setRevealed(false);
          }}
        />
        <span className="cf-cmp-vs">VS</span>
        <PlayerPicker
          label="Select"
          players={p2Options}
          value={p2}
          onChange={(v) => {
            setP2(v);
            setRevealed(false);
          }}
        />
      </div>

      {seasons.length > 0 && (
        <select
          className="cf-cmp-season"
          value={season}
          onChange={(e) => {
            setSeason(e.target.value);
            setRevealed(false);
          }}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}

      {revealed && ready ? (
        <div className="cf-cmp-result">
          <span className="cf-cmp-mp">
            <span className="cf-cmp-avatar sm">
              <SmartImage src={player1.image} alt={player1.name} label={player1.name} contain />
            </span>
            <span className="cf-cmp-mname">{player1.name}</span>
          </span>
          <span className="cf-cmp-mid">{seasonTitle ? seasonTitle.title : 'VS'}</span>
          <span className="cf-cmp-mp cf-cmp-mp-right">
            <span className="cf-cmp-mname">{player2.name}</span>
            <span className="cf-cmp-avatar sm">
              <SmartImage src={player2.image} alt={player2.name} label={player2.name} contain />
            </span>
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="cf-cmp-btn"
          disabled={!ready}
          onClick={() => setRevealed(true)}
        >
          See Comparison
        </button>
      )}

      <EngagementBar
        id={item.dedupeId}
        dedupeId={item.dedupeId}
        onComment={onComment}
        onShare={onShare}
        onReport={onReport}
        localOnly
      />
    </section>
  );
}

export default memo(PlayerComparisonCard);
