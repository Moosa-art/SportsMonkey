import { useState } from 'react';
import './posts.css';

export default function QuizPost({ data }) {
  const [selected, setSelected] = useState(null);

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };

  return (
    <div className="qz-card">
      <div className="qz-badge">🧠 Quiz</div>
      <div className="qz-q">{data.question}</div>
      <div className="qz-options">
        {data.options.map((opt, i) => {
          let cls = 'qz-opt';
          if (selected !== null) {
            if (i === data.answer) cls += ' correct';
            else if (i === selected) cls += ' wrong';
          }
          return (
            <button key={i} className={cls} onClick={() => handleAnswer(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          {selected === data.answer ? '✅ Correct!' : `❌ The answer was: ${data.options[data.answer]}`}
        </div>
      )}
    </div>
  );
}
