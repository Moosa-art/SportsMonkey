import { useState, useEffect, useRef } from 'react';
import { FiArrowLeft, FiSend, FiCornerUpLeft, FiMoreHorizontal, FiHeart } from 'react-icons/fi';
import PostCard from '../components/PostCard';
import { SkeletonComment } from '../components/SkeletonLoader';
import './PostViewPage.css';

const DEMO_COMMENTS = [
  { id: 1, username: 'gooner_sam', avatar: 'https://i.pravatar.cc/40?img=11', text: 'Absolutely incredible! COYG 🔴⚪', likes: 142, liked: false, time: '2m', replies: [] },
  { id: 2, username: 'fabrizio.romano', avatar: 'https://i.pravatar.cc/40?img=60', text: 'Here we go confirmed! 🚨', likes: 8420, liked: true, time: '5m', verified: true, replies: [
    { id: 21, username: 'arsenal_daily', avatar: 'https://i.pravatar.cc/40?img=33', text: 'King Fabrizio never misses 👑', likes: 234, liked: false, time: '4m' },
  ] },
  { id: 3, username: 'red_army_k', avatar: 'https://i.pravatar.cc/40?img=14', text: 'Best signing of the window by far 💪', likes: 56, liked: false, time: '8m', replies: [] },
];

export default function PostViewPage({ post, onBack, onOpenComments, onOpenShare, onOpenReport }) {
  const [loadingComments, setLoadingComments] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoadingComments(true);
    const t = setTimeout(() => {
      setComments(DEMO_COMMENTS);
      setLoadingComments(false);
    }, 600);
    return () => clearTimeout(t);
  }, [post?.id]);

  const toggleLike = (id, parentId = null) => {
    setComments(cs => cs.map(c => {
      if (!parentId && c.id === id) return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
      if (parentId && c.id === parentId) return {
        ...c,
        replies: c.replies.map(r => r.id === id
          ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
          : r
        )
      };
      return c;
    }));
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setNewComment(`@${comment.username} `);
    inputRef.current?.focus();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 400));
    const nc = {
      id: Date.now(),
      username: 'you',
      avatar: 'https://i.pravatar.cc/40?img=12',
      text: newComment.trim(),
      likes: 0,
      liked: false,
      time: 'now',
      replies: [],
    };
    if (replyTo) {
      setComments(cs => cs.map(c =>
        c.id === replyTo.id ? { ...c, replies: [...c.replies, { ...nc, id: Date.now() }] } : c
      ));
    } else {
      setComments(cs => [...cs, nc]);
    }
    setNewComment('');
    setReplyTo(null);
    setSending(false);
  };

  if (!post) return null;

  return (
    <div className="post-view-page">
      <div className="pv-header">
        <button className="pv-back-btn" onClick={onBack} aria-label="Go back" id="pv-back-btn">
          <FiArrowLeft size={20} />
        </button>
        <span className="pv-title">Post Details</span>
        <div style={{ width: 40 }} /> {/* balance layout */}
      </div>

      <div className="pv-scroll-container">
        <PostCard
          post={post}
          onOpenComments={onOpenComments}
          onOpenShare={onOpenShare}
          onOpenReport={onOpenReport}
          isDetailPage={true}
        />

        <div className="pv-comments-section">
          <div className="pv-comments-header">
            <h3>Comments ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})</h3>
          </div>

          <div className="pv-comments-list">
            {loadingComments ? (
              [1, 2].map(i => <SkeletonComment key={i} />)
            ) : comments.length === 0 ? (
              <div className="pv-no-comments">No comments yet. Be the first to say something!</div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="pv-comment-item">
                  <div className="pv-comment-row">
                    <img src={comment.avatar} alt="" className="pv-comment-avatar" />
                    <div className="pv-comment-body">
                      <div className="pv-comment-top">
                        <span className="pv-comment-username">
                          {comment.username}
                          {comment.verified && <span className="pv-comment-vbadge">✓</span>}
                        </span>
                        <span className="pv-comment-time">{comment.time}</span>
                      </div>
                      <p className="pv-comment-text">{comment.text}</p>
                      <div className="pv-comment-actions">
                        <button className="pv-comment-reply-btn" onClick={() => handleReply(comment)}>
                          <FiCornerUpLeft size={12} /> Reply
                        </button>
                        <button className="pv-comment-more-btn"><FiMoreHorizontal size={14} /></button>
                      </div>
                    </div>
                    <button className="pv-comment-like-btn" onClick={() => toggleLike(comment.id)}>
                      {comment.liked ? <FiHeart size={13} color="#EF4444" fill="currentColor" /> : <FiHeart size={13} />}
                      <span>{comment.likes}</span>
                    </button>
                  </div>

                  {comment.replies?.map(r => (
                    <div key={r.id} className="pv-comment-reply">
                      <img src={r.avatar} alt="" className="pv-comment-avatar" style={{ width: 28, height: 28 }} />
                      <div className="pv-comment-body">
                        <div className="pv-comment-top">
                          <span className="pv-comment-username">{r.username}</span>
                          <span className="pv-comment-time">{r.time}</span>
                        </div>
                        <p className="pv-comment-text">{r.text}</p>
                      </div>
                      <button className="pv-comment-like-btn" onClick={() => toggleLike(r.id, comment.id)}>
                        {r.liked ? <FiHeart size={11} color="#EF4444" fill="currentColor" /> : <FiHeart size={11} />}
                        <span>{r.likes}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {replyTo && (
        <div className="pv-replying-indicator">
          <span>Replying to <strong>@{replyTo.username}</strong></span>
          <button onClick={() => { setReplyTo(null); setNewComment(''); }}><FiX size={14} /></button>
        </div>
      )}

      <form className="pv-compose-bar" onSubmit={submitComment}>
        <img src="https://i.pravatar.cc/40?img=12" alt="" className="pv-compose-avatar" />
        <input
          ref={inputRef}
          className="pv-compose-input"
          placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          id="pv-comment-input"
        />
        <button type="submit" className="pv-compose-send" disabled={!newComment.trim() || sending} id="pv-comment-send-btn">
          {sending ? <span className="pv-send-spinner" /> : <FiSend size={16} />}
        </button>
      </form>
    </div>
  );
}
