import { memo } from 'react';
import SmartImage from '../SmartImage';
import EngagementBar from '../EngagementBar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Parse the upstream "YYYY-MM-DD HH:MM:SS" date_time into label + time parts. */
function parseDateTime(dt) {
  if (!dt || typeof dt !== 'string') return null;
  const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm));
  if (Number.isNaN(date.getTime())) return null;
  return {
    key: `${y}-${mo}-${d}`,
    label: `${DAYS[date.getDay()]} ${Number(d)}-${MONTHS[Number(mo) - 1]}-${y}`,
    time: `${hh}:${mm}`,
  };
}

const isFinished = (status) => /ft|full|ended|finished/i.test(status || '');

function FixtureRow({ fixture }) {
  const dt = parseDateTime(fixture.dateTime);
  const finished = isFinished(fixture.status);
  const hasScore = fixture.home.score !== '' || fixture.away.score !== '';
  return (
    <li className="cf-fixture">
      <div className="cf-fx-team">
        <span className="cf-fx-crest">
          <SmartImage src={fixture.home.image} alt={fixture.home.title} label={fixture.home.title} contain />
        </span>
        <span className="cf-fx-name">{fixture.home.title}</span>
      </div>
      <div className="cf-fx-score">
        {hasScore ? (
          <span className="cf-fx-nums">
            {fixture.home.score || '0'}
            <span className="cf-fx-sep">:</span>
            {fixture.away.score || '0'}
          </span>
        ) : (
          <span className="cf-fx-vs">{dt ? dt.time : 'vs'}</span>
        )}
        <span className={`cf-fx-status${finished ? ' is-ft' : ''}`}>
          {fixture.status || (dt ? '' : fixture.dateTime)}
        </span>
      </div>
      <div className="cf-fx-team cf-fx-right">
        <span className="cf-fx-name">{fixture.away.title}</span>
        <span className="cf-fx-crest">
          <SmartImage src={fixture.away.image} alt={fixture.away.title} label={fixture.away.title} contain />
        </span>
      </div>
    </li>
  );
}

function FixturesCard({ item, onComment, onShare, onReport }) {
  // Group fixtures by calendar date so the card reads like the mock
  // (date heading + that day's matches).
  const groups = [];
  const byKey = new Map();
  for (const f of item.fixtures || []) {
    const dt = parseDateTime(f.dateTime);
    const key = dt ? dt.key : 'tbd';
    if (!byKey.has(key)) {
      const g = { key, label: dt ? dt.label : 'Scheduled', fixtures: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    byKey.get(key).fixtures.push(f);
  }

  return (
    <article className="cf-card cf-fixtures cf-grid-item">
      <header className="cf-card-head cf-fixtures-head">
        <span className="cf-source">{item.source || 'Fixtures'}</span>
      </header>

      {groups.map((g) => (
        <div className="cf-fx-group" key={g.key}>
          <div className="cf-fx-date">{g.label}</div>
          <ul className="cf-fixtures-list">
            {g.fixtures.map((f, i) => (
              <FixtureRow key={f.matchId || `${g.key}-${i}`} fixture={f} />
            ))}
          </ul>
        </div>
      ))}

      {item.bottomText && <p className="cf-fx-note">{item.bottomText}</p>}

      <EngagementBar
        id={item.dedupeId}
        dedupeId={item.dedupeId}
        onComment={onComment}
        onShare={onShare}
        onReport={onReport}
        localOnly
      />
    </article>
  );
}

export default memo(FixturesCard);
