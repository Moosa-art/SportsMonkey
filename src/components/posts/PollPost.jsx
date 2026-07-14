import { useState } from 'react';
import './posts.css';

export default function PollPost({ data }) {
  const [voted, setVoted] = useState(null);
  const total = data.options.reduce((s, o) => s + o.votes, 0) + (voted !== null ? 1 : 0);

  return (
    <div className="poll-card-wrap">
      <div className="poll-eyebrow">
        <span>📊</span> Poll
      </div>
      <div className="poll-question">{data.question}</div>

      {data.options.map((opt, i) => {
        const votes = opt.votes + (voted === i ? 1 : 0);
        const pct = Math.round((votes / total) * 100);
        const isWinner = voted !== null && pct === Math.max(...data.options.map((o, j) => {
          const v = o.votes + (voted === j ? 1 : 0);
          return Math.round((v / total) * 100);
        }));

        return (
          <button
            key={i}
            className={`poll-option-btn${voted !== null && isWinner ? ' winner' : ''}`}
            onClick={() => voted === null && setVoted(i)}
            disabled={voted !== null}
          >
            {voted !== null && (
              <div className="poll-bar-fill" style={{ width: `${pct}%` }} />
            )}
            <div className="poll-option-text">
              <span>{opt.text}</span>
              {voted !== null && <span className="poll-pct">{pct}%</span>}
            </div>
          </button>
        );
      })}

      <div className="poll-footer">{total.toLocaleString()} votes · {data.timeLeft}</div>
    </div>
  );
}
