import { useState, useEffect } from "react";
import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiMoreHorizontal,
  FiBookmark,
} from "react-icons/fi";
import { FaHeart, FaBookmark } from "react-icons/fa";
import {
  TransferTargetPost,
  AtAGlancePost,
  PlayerRatingsPost,
  HighlightsPost,
  WatchLivePost,
  PollPost,
  NewsListPost,
  ImagePost,
  MatchScorePost,
  StatComparisonPost,
  FormationPost,
  TopScorersPost,
  TweetPost,
  TransferRumourPost,
  FantasyTipsPost,
  MemePost,
  InjuryReportPost,
  BettingTipsPost,
  FixtureCardPost,
  QuizPost,
  PodcastPost,
  ShopPost,
  PredictionPost,
} from "./posts";
import "./PostCard.css";

const postComponents = {
  transfer_target: TransferTargetPost,
  at_a_glance: AtAGlancePost,
  player_ratings: PlayerRatingsPost,
  highlights: HighlightsPost,
  watch_live: WatchLivePost,
  poll: PollPost,
  news_list: NewsListPost,
  image: ImagePost,
  match_score: MatchScorePost,
  stat_comparison: StatComparisonPost,
  formation: FormationPost,
  top_scorers: TopScorersPost,
  tweet: TweetPost,
  transfer_rumour: TransferRumourPost,
  fantasy_tips: FantasyTipsPost,
  meme: MemePost,
  injury_report: InjuryReportPost,
  betting_tips: BettingTipsPost,
  fixture_card: FixtureCardPost,
  quiz: QuizPost,
  podcast: PodcastPost,
  shop: ShopPost,
  prediction: PredictionPost,
};

// ── localStorage helpers ─────────────────────────────────────────
const LS_LIKE = (id) => `post_like_${id}`;
const LS_SAVED = (id) => `post_saved_${id}`;

function readBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}
function writeBool(key, val) {
  try {
    localStorage.setItem(key, String(val));
  } catch {}
}
// ────────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  onCommentClick,
  onShareClick,
  onReportClick,
}) {
  const [liked, setLiked] = useState(() => readBool(LS_LIKE(post.id), false));
  const [saved, setSaved] = useState(() => readBool(LS_SAVED(post.id), false));
  const [likes, setLikes] = useState(() => {
    // Base likes adjusted by stored liked state
    const base = post.likes || 0;
    const stored = readBool(LS_LIKE(post.id), false);
    return stored ? base + 1 : base;
  });

  const Component = postComponents[post.type];

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((l) => l + (next ? 1 : -1));
    writeBool(LS_LIKE(post.id), next);
  };

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    writeBool(LS_SAVED(post.id), next);
  };

  return (
    <div className="post-card">
      {/* ── Header ── */}
      <div className="post-header">
        <div className="post-user">
          <div
            className="post-avatar"
            style={{ background: post.userColor || "var(--navy)" }}
          >
            {post.userImage ? (
              <img src={post.userImage} alt="" />
            ) : (
              <span>{post.userInitial || "U"}</span>
            )}
          </div>
          <div className="post-user-info">
            <div className="post-username">
              {post.username}
              {post.verified && <span className="verified-badge">✓</span>}
            </div>
            {post.subtitle && (
              <div className="post-subtitle">{post.subtitle}</div>
            )}
          </div>
        </div>
        <button
          className="post-more"
          onClick={() => onReportClick?.()}
          id={`post-more-${post.id}`}
          aria-label="more options"
        >
          <FiMoreHorizontal size={20} />
        </button>
      </div>

      {/* ── Body (NOT clickable) ── */}
      <div className="post-body">
        {Component ? (
          <Component data={post.data} />
        ) : (
          <div>Unknown post type</div>
        )}
      </div>

      {post.caption && (
        <div className="post-caption">
          <strong>{post.username}</strong> {post.caption}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            className="action-btn"
            onClick={handleLike}
            id={`post-like-btn-${post.id}`}
            aria-label="like"
          >
            {liked ? (
              <FaHeart size={20} color="#EF4444" />
            ) : (
              <FiHeart size={20} />
            )}
            <span>{likes}</span>
          </button>
          <button
            className="action-btn"
            onClick={() => onCommentClick?.()}
            id={`post-comment-btn-${post.id}`}
            aria-label="comments"
          >
            <FiMessageCircle size={20} />
            <span>{post.comments || 0}</span>
          </button>
          <button
            className="action-btn"
            onClick={() => onShareClick?.()}
            id={`post-share-btn-${post.id}`}
            aria-label="share"
          >
            <FiSend size={20} />
          </button>
        </div>
        <button
          className="action-btn"
          onClick={handleSave}
          id={`post-save-btn-${post.id}`}
          aria-label="bookmark"
        >
          {saved ? (
            <FaBookmark size={20} color="#0A1F44" />
          ) : (
            <FiBookmark size={20} />
          )}
        </button>
      </div>

      {post.timestamp && <div className="post-timestamp">{post.timestamp}</div>}
    </div>
  );
}
