import { memo } from 'react';
import { FiGift, FiCheckCircle } from 'react-icons/fi';
import EngagementBar from '../EngagementBar';

/**
 * FreeBetCard — the sponsored "Bet £10 Get £30" promo. The `freebet` feed tile
 * carries no data (it's a templated creative), so this renders the promo layout
 * from the mock. Promoted out of the Quick-links strip into a full card.
 */
const STEPS = [
  { n: '1', label: 'Join' },
  { n: '2', label: 'Bet £10' },
  { n: '3', label: 'Get £30' },
];

function FreeBetCard({ tile, dedupeId, eng = {} }) {
  return (
    <section className="cf-card cf-fb">
      <header className="cf-card-head">
        <span className="cf-avatar">
          <span className="cf-fb-logo">
            <FiGift size={16} />
          </span>
        </span>
        <div className="cf-head-meta">
          <span className="cf-source">Sponsored</span>
          <span className="cf-time">Betting offer</span>
        </div>
      </header>

      <div className="cf-fb-hero">
        <span className="cf-fb-l1">Bet £10</span>
        <span className="cf-fb-l2">Get £30</span>
        <span className="cf-fb-l3">in free bets</span>
        <button type="button" className="cf-fb-cta">Sign up</button>
      </div>

      <div className="cf-fb-claim">
        <span className="cf-fb-claim-t">How to claim</span>
        <div className="cf-fb-steps">
          {STEPS.map((s) => (
            <div className="cf-fb-step" key={s.n}>
              <span className="cf-fb-step-n">{s.n}</span>
              <span className="cf-fb-step-l">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="cf-fb-notes">
        <li>
          <FiCheckCircle size={13} /> Get £30 in free bets
        </li>
        <li>
          <FiCheckCircle size={13} /> New customer offer
        </li>
        <li>
          <FiCheckCircle size={13} /> 18+ · T&amp;Cs apply
        </li>
      </ul>

      <EngagementBar id={dedupeId} dedupeId={dedupeId} {...eng} localOnly />
    </section>
  );
}

export default memo(FreeBetCard);
