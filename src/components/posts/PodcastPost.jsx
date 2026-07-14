import { FiPlay } from 'react-icons/fi';
import './posts.css';

export default function PodcastPost({ data }) {
  return (
    <div className="pc-card">
      <div className="pc-cover">{data.emoji || '🎙️'}</div>
      <div className="pc-info">
        <div className="pc-label">🎙️ Podcast</div>
        <div className="pc-title">{data.title}</div>
        <div className="pc-meta">{data.host} · {data.duration}</div>
      </div>
      <div className="pc-play">
        <FiPlay size={20} fill="white" strokeWidth={0} />
      </div>
    </div>
  );
}
