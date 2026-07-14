import './posts.css';

export default function TweetPost({ data }) {
  return (
    <div className="tw-card">
      <div className="tw-header">
        <div className="tw-avatar">
          <img src={data.avatar} alt={data.name} onError={e => e.target.style.display='none'} />
        </div>
        <div className="tw-info">
          <div className="tw-name-row">
            <span className="tw-name">{data.name}</span>
            {data.verified && <span className="tw-verified">✓</span>}
            <span className="tw-handle">{data.handle}</span>
          </div>
        </div>
        <div className="tw-x-logo">𝕏</div>
      </div>

      <div className="tw-text">{data.text}</div>

      <div className="tw-stats">
        <div className="tw-stat">🔁 <strong>{data.retweets?.toLocaleString()}</strong></div>
        <div className="tw-stat">❤️ <strong>{data.likes?.toLocaleString()}</strong></div>
        <div className="tw-stat" style={{ marginLeft: 'auto', color: '#bbb' }}>{data.time}</div>
      </div>
    </div>
  );
}
