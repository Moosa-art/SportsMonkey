import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiX,
  FiSend,
  FiCornerUpLeft,
  FiSmile,
  FiImage,
  FiMic,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import { api } from "../lib/api";
import MediaPicker from "./MediaPicker";
import MediaPreview from "./MediaPreview";
import VoiceRecorder from "./VoiceRecorder";
import { SkeletonComment } from "./SkeletonLoader";
import "./CommentsSheet.css";

// Reaction set — must stay in sync with the server whitelist (clubSocial.js).
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "⚽", "🎉"];
const MAX_ATTACHMENTS = 4;

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="%230A1F44"/><text x="50%25" y="57%25" font-size="15" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">442</text></svg>';

// ── Local comment fallback (used when the comments backend is unavailable) ──

const LOCAL_KEY = (itemId) => `cf_comments_${itemId}`;

function readLocalComments(itemId) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(itemId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalComments(itemId, comments) {
  try {
    localStorage.setItem(LOCAL_KEY(itemId), JSON.stringify(comments));
  } catch {
    /* storage full / disabled — ignore */
  }
}

function makeLocalComment({ body, attachments, parentId }) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    item_id: null,
    parent_id: parentId || null,
    body: body || "",
    attachments: attachments || [],
    mentions: [],
    hashtags: [],
    reactions: {},
    my_reaction: null,
    reply_count: 0,
    replies: [],
    created_at: new Date().toISOString(),
    author: { id: "me", username: "you", display_name: "You", avatar_url: null, is_verified: false },
  };
}

// ── Free GIF search via GIPHY (fallback when the Tenor proxy isn't set) ──
// Uses VITE_GIPHY_KEY if provided, else GIPHY's public demo key.

const GIPHY_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GIPHY_KEY) ||
  "dc6zaTOxFJmzC";

async function fetchGiphyGifs(q, signal) {
  const params = new URLSearchParams({ api_key: GIPHY_KEY, limit: "24", rating: "pg-13" });
  if (q) params.set("q", q);
  const endpoint = q ? "search" : "trending";
  const res = await fetch("https://api.giphy.com/v1/gifs/" + endpoint + "?" + params.toString(), { signal });
  if (!res.ok) throw new Error(`GIPHY ${res.status}`);
  const json = await res.json();
  return (json.data || [])
    .map((g) => {
      const imgs = g.images || {};
      return {
        id: g.id,
        url: (imgs.original || imgs.downsized_large || imgs.fixed_height || {}).url,
        preview: (imgs.fixed_height || imgs.fixed_height_small || imgs.original || {}).url,
        description: g.title || "GIF",
      };
    })
    .filter((g) => g.url && g.preview);
}

// ── Helpers ──────────────────────────────────────────────────────

/** Resolve the stable engagement/comment id for a feed item. */
function itemIdOf(post) {
  if (!post) return null;
  if (post.kind === "news") return post.article?.id != null ? String(post.article.id) : null;
  if (post.kind === "video") return post.id != null ? String(post.id) : null;
  if (post.itemId) return String(post.itemId);
  if (post.dedupeId) return String(post.dedupeId);
  if (post.id != null) return String(post.id);
  return null;
}

function fmtTime(ts) {
  if (!ts) return "now";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "now";
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

/** Render comment text with @mentions and #hashtags highlighted. */
function renderRichBody(text) {
  if (!text) return null;
  const re = /([@#][a-zA-Z0-9_]+)/g;
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const cls = token[0] === "@" ? "comment-mention" : "comment-hashtag";
    out.push(
      <span key={`t${i++}`} className={cls}>
        {token}
      </span>,
    );
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Recursively update one comment (top-level or reply) by id. */
function updateCommentInTree(list, id, updater) {
  return list.map((c) => {
    if (String(c.id) === String(id)) return updater(c);
    if (c.replies?.length) {
      let changed = false;
      const replies = c.replies.map((r) => {
        if (String(r.id) === String(id)) {
          changed = true;
          return updater(r);
        }
        return r;
      });
      if (changed) return { ...c, replies };
    }
    return c;
  });
}

/** Compute the optimistic reaction state after toggling `emoji`. */
function optimisticReact(comment, emoji) {
  const prevMine = comment.my_reaction || null;
  const reactions = { ...(comment.reactions || {}) };
  const dec = (e) => {
    if (!e) return;
    reactions[e] = Math.max(0, (reactions[e] || 1) - 1);
    if (!reactions[e]) delete reactions[e];
  };
  if (prevMine === emoji) {
    dec(emoji);
    return { reactions, my_reaction: null };
  }
  dec(prevMine);
  reactions[emoji] = (reactions[emoji] || 0) + 1;
  return { reactions, my_reaction: emoji };
}

// ── Sub-components ───────────────────────────────────────────────

function CommentAttachments({ items }) {
  if (!items?.length) return null;
  return (
    <div className="comment-attachments">
      {items.map((a, idx) => {
        if (a.kind === "voice" || a.kind === "audio") {
          return (
            <audio key={idx} className="comment-att-audio" src={a.url} controls preload="none" />
          );
        }
        const src = a.thumbnail_url || a.url;
        return (
          <a
            key={idx}
            className="comment-att-media"
            href={a.url}
            target="_blank"
            rel="noreferrer"
          >
            <img src={src} alt={a.kind || "attachment"} loading="lazy" />
            {a.kind === "gif" && <span className="comment-att-gif-badge">GIF</span>}
          </a>
        );
      })}
    </div>
  );
}

function ReactionChips({ reactions, mine, onToggle }) {
  const entries = Object.entries(reactions || {}).filter(([, n]) => n > 0);
  if (!entries.length) return null;
  return (
    <div className="comment-reactions">
      {entries.map(([emoji, n]) => (
        <button
          key={emoji}
          type="button"
          className={mine === emoji ? "reaction-chip is-mine" : "reaction-chip"}
          onClick={() => onToggle(emoji)}
        >
          <span className="reaction-emoji">{emoji}</span>
          <span className="reaction-count">{n}</span>
        </button>
      ))}
    </div>
  );
}

function CommentNode({ comment, rootId, onReply, onReact, reactingId, setReactingId }) {
  const author = comment.author || {};
  const isReacting = reactingId === comment.id;
  return (
    <div className={rootId ? "comment-reply" : "comment-item"}>
      <div className="comment-row">
        <img
          src={author.avatar_url || FALLBACK_AVATAR}
          alt=""
          className="comment-avatar"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_AVATAR;
          }}
        />
        <div className="comment-body">
          <div className="comment-top">
            <span className="comment-username">
              {author.username || "user"}
              {author.is_verified && <span className="comment-vbadge">✓</span>}
            </span>
            <span className="comment-time">{fmtTime(comment.created_at)}</span>
          </div>
          {comment.body && <p className="comment-text">{renderRichBody(comment.body)}</p>}
          <CommentAttachments items={comment.attachments} />
          <ReactionChips
            reactions={comment.reactions}
            mine={comment.my_reaction}
            onToggle={(emoji) => onReact(comment, emoji)}
          />
          <div className="comment-actions">
            <button
              type="button"
              className="comment-reply-btn"
              onClick={() => onReply(comment, rootId || comment.id)}
            >
              <FiCornerUpLeft size={12} /> Reply
            </button>
            <button
              type="button"
              className="comment-react-btn"
              onClick={() => setReactingId(isReacting ? null : comment.id)}
            >
              <FiSmile size={13} /> React
            </button>
          </div>
          {isReacting && (
            <div className="reaction-bar">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="reaction-bar-emoji"
                  onClick={() => {
                    onReact(comment, e);
                    setReactingId(null);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              rootId={comment.id}
              onReply={onReply}
              onReact={onReact}
              reactingId={reactingId}
              setReactingId={setReactingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GifPicker({ onPick, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    setLoading(true);
    setNotConfigured(false);
    const run = async () => {
      // 1) Prefer the server proxy (Tenor) when configured and it returns hits.
      try {
        const res = q.trim()
          ? await api.searchGifs(q.trim(), { signal: ctrl.signal })
          : await api.trendingGifs({ signal: ctrl.signal });
        if (res && res.configured !== false && Array.isArray(res.results) && res.results.length) {
          if (active) setResults(res.results);
          return;
        }
      } catch {
        /* proxy unavailable — fall back to GIPHY */
      }
      // 2) Free fallback: GIPHY (public key, or VITE_GIPHY_KEY).
      try {
        const gifs = await fetchGiphyGifs(q.trim(), ctrl.signal);
        if (active) setResults(gifs);
      } catch {
        if (active) setResults([]);
      }
    };
    run().finally(() => active && setLoading(false));
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [q]);

  return (
    <div className="gif-picker">
      <div className="gif-picker-head">
        <input
          className="gif-search"
          placeholder="Search GIFs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button type="button" className="gif-close" onClick={onClose}>
          <FiX size={16} />
        </button>
      </div>
      {notConfigured ? (
        <p className="gif-empty">GIF search isn’t configured (set TENOR_API_KEY).</p>
      ) : loading ? (
        <p className="gif-empty">Loading…</p>
      ) : results.length === 0 ? (
        <p className="gif-empty">
          {import.meta.env && import.meta.env.VITE_GIPHY_KEY
            ? "No GIFs found."
            : "GIF search needs a free key — add VITE_GIPHY_KEY (giphy.com/developers) and restart."}
        </p>
      ) : (
        <div className="gif-grid">
          {results.map((g) => (
            <button
              key={g.id}
              type="button"
              className="gif-cell"
              onClick={() => onPick(g)}
              title={g.description}
            >
              <img src={g.preview} alt={g.description} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main sheet ───────────────────────────────────────────────────

export default function CommentsSheet({ post, onClose, onCountChange }) {
  const itemId = itemIdOf(post);
  const commentable = Boolean(itemId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(Number(post?.eng?.comment_count) || 0);

  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [reactingId, setReactingId] = useState(null);
  const [localMode, setLocalMode] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  // Mention autocomplete.
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionResults, setMentionResults] = useState([]);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  const anyUploading = attachments.some((a) => a.uploading);

  // Load comments for this item.
  useEffect(() => {
    if (!commentable) {
      setLoading(false);
      return;
    }
    let active = true;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api
      .getClubComments(itemId, { signal: ctrl.signal })
      .then((res) => {
        if (!active) return;
        // Merge any locally-posted comments (e.g. Player Stats “thoughts”) so
        // they appear alongside server comments.
        const local = readLocalComments(itemId);
        const server = res?.comments || [];
        const seen = new Set(server.map((c) => String(c.id)));
        setComments([...local.filter((c) => !seen.has(String(c.id))), ...server]);
      })
      .catch((err) => {
        if (!active || err?.name === "AbortError") return;
        // Backend/DB unavailable (or not signed in) — fall back to locally
        // stored comments so the section still loads and stays usable offline.
        setLocalMode(true);
        setComments(readLocalComments(itemId));
        setError(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [itemId, commentable]);

  // Persist locally-authored comments so they survive a refresh while offline.
  useEffect(() => {
    if (localMode && commentable) writeLocalComments(itemId, comments);
  }, [localMode, commentable, itemId, comments]);

  // Debounced @mention lookup.
  useEffect(() => {
    if (mentionQuery == null || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api
        .searchUsers(mentionQuery, { signal: ctrl.signal })
        .then((res) => setMentionResults(res?.users || []))
        .catch(() => setMentionResults([]));
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [mentionQuery]);

  const detectMention = useCallback((value, caret) => {
    const upto = value.slice(0, caret);
    const m = upto.match(/@([a-zA-Z0-9_]{1,30})$/);
    setMentionQuery(m ? m[1] : null);
  }, []);

  const onTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    detectMention(value, e.target.selectionStart || value.length);
  };

  const insertMention = (user) => {
    const el = inputRef.current;
    const caret = el ? el.selectionStart : text.length;
    const before = text
      .slice(0, caret)
      .replace(/@([a-zA-Z0-9_]{1,30})$/, `@${user.username} `);
    const after = text.slice(caret);
    setText(before + after);
    setMentionQuery(null);
    setMentionResults([]);
    requestAnimationFrame(() => el?.focus());
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const caret = el ? el.selectionStart : text.length;
    setText(text.slice(0, caret) + emoji + text.slice(caret));
    requestAnimationFrame(() => el?.focus());
  };

  // Attachments.
  const addFiles = (files, kind) => {
    const room = MAX_ATTACHMENTS - attachments.length;
    const take = Array.from(files).slice(0, Math.max(0, room));
    take.forEach((file) => {
      const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type?.startsWith("image/") ? URL.createObjectURL(file) : null;
      setAttachments((arr) => [
        ...arr,
        { tmpId, kind, name: file.name, bytes: file.size, previewUrl, uploading: true, progress: 0, ready: false },
      ]);
      api
        .uploadMedia(file, {
          kind,
          use: "comment",
          onProgress: (p) =>
            setAttachments((arr) => arr.map((a) => (a.tmpId === tmpId ? { ...a, progress: p } : a))),
        })
        .then((res) =>
          setAttachments((arr) =>
            arr.map((a) =>
              a.tmpId === tmpId
                ? {
                    ...a,
                    uploading: false,
                    ready: true,
                    media_id: res.id,
                    url: res.url,
                    thumbnail_url: res.thumbnail_url || res.url,
                    mime: res.mime,
                  }
                : a,
            ),
          ),
        )
        .catch((err) =>
          setAttachments((arr) =>
            arr.map((a) =>
              a.tmpId === tmpId
                ? { ...a, uploading: false, error: err?.message || "Upload failed" }
                : a,
            ),
          ),
        );
    });
  };

  const addGif = (gif) => {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    setAttachments((arr) => [
      ...arr,
      {
        tmpId: `gif-${gif.id}`,
        kind: "gif",
        url: gif.url,
        thumbnail_url: gif.preview || gif.url,
        previewUrl: gif.preview || gif.url,
        ready: true,
      },
    ]);
    setShowGif(false);
  };

  const removeAttachment = (tmpId) =>
    setAttachments((arr) => arr.filter((a) => a.tmpId !== tmpId));

  const onVoiceComplete = (file) => {
    setShowVoice(false);
    addFiles([file], "voice");
  };

  const startReply = (comment, rootId) => {
    setReplyTo({ id: rootId, username: comment.author?.username || "" });
    setText((t) => (t.trim() ? t : `@${comment.author?.username || ""} `));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Reactions (optimistic, reconciled with server).
  const onReact = useCallback(
    async (comment, emoji) => {
      const optimistic = optimisticReact(comment, emoji);
      setComments((cs) => updateCommentInTree(cs, comment.id, (c) => ({ ...c, ...optimistic })));
      // Local-only comments (offline mode) never hit the server.
      if (localMode || String(comment.id).startsWith("local-")) return;
      try {
        const resp = await api.reactClubComment(comment.id, emoji);
        if (resp)
          setComments((cs) =>
            updateCommentInTree(cs, comment.id, (c) => ({
              ...c,
              reactions: resp.reactions || {},
              my_reaction: resp.mine || null,
            })),
          );
      } catch {
        // Revert by flipping back to the pre-click state.
        setComments((cs) =>
          updateCommentInTree(cs, comment.id, (c) => ({
            ...c,
            reactions: comment.reactions || {},
            my_reaction: comment.my_reaction || null,
          })),
        );
      }
    },
    [localMode],
  );

  const bumpCount = (n) => {
    setCount(n);
    if (typeof onCountChange === "function") onCountChange(itemId, n);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const ready = attachments.filter((a) => a.ready && !a.error);
    if ((!text.trim() && ready.length === 0) || anyUploading || posting) return;
    setPosting(true);
    setError(null);
    const payload = ready.map((a) =>
      a.kind === "gif"
        ? { kind: "gif", url: a.url, thumbnail_url: a.thumbnail_url || null }
        : { kind: a.kind, media_id: a.media_id },
    );
    const localAttach = ready.map((a) => ({
      kind: a.kind,
      url: a.url,
      thumbnail_url: a.thumbnail_url || a.url,
    }));

    const applyNew = (comment) => {
      if (replyTo) {
        setComments((cs) =>
          updateCommentInTree(cs, replyTo.id, (c) => ({
            ...c,
            replies: [...(c.replies || []), comment],
            reply_count: (c.reply_count || 0) + 1,
          })),
        );
      } else {
        setComments((cs) => [comment, ...cs]);
        listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    const resetCompose = () => {
      setText("");
      setAttachments([]);
      setReplyTo(null);
      setShowEmoji(false);
    };

    // Offline/local mode: append the comment locally (persisted to storage).
    if (localMode) {
      applyNew(
        makeLocalComment({ body: text.trim(), attachments: localAttach, parentId: replyTo?.id || null }),
      );
      bumpCount(count + 1);
      resetCompose();
      setPosting(false);
      return;
    }

    try {
      const resp = await api.clubComment(itemId, {
        body: text.trim(),
        parentId: replyTo?.id || null,
        attachments: payload,
      });
      const comment = resp?.comment;
      if (comment) applyNew(comment);
      if (typeof resp?.comment_count === "number") bumpCount(resp.comment_count);
      else bumpCount(count + 1);
      resetCompose();
    } catch {
      // Backend/auth failed — keep the comment by switching to local mode.
      setLocalMode(true);
      applyNew(
        makeLocalComment({ body: text.trim(), attachments: localAttach, parentId: replyTo?.id || null }),
      );
      bumpCount(count + 1);
      resetCompose();
    } finally {
      setPosting(false);
    }
  };

  const canSend =
    (text.trim().length > 0 || attachments.some((a) => a.ready && !a.error)) &&
    !anyUploading &&
    !posting;

  return (
    <div
      className="comments-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="comments-sheet">
        <div className="comments-drag-handle" />
        <div className="comments-header">
          <span className="comments-title">
            Comments{count > 0 ? ` · ${count}` : ""}
          </span>
          <button className="comments-close" onClick={onClose} id="comments-close">
            <FiX size={20} />
          </button>
        </div>

        <div className="comments-list" ref={listRef}>
          {!commentable ? (
            <p className="comments-empty">Comments aren’t available for this card.</p>
          ) : loading ? (
            [1, 2, 3, 4].map((i) => <SkeletonComment key={i} />)
          ) : error ? (
            <p className="comments-empty">{error}</p>
          ) : comments.length === 0 ? (
            <p className="comments-empty">No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                rootId={null}
                onReply={startReply}
                onReact={onReact}
                reactingId={reactingId}
                setReactingId={setReactingId}
              />
            ))
          )}
        </div>

        {commentable && (
          <>
            {replyTo && (
              <div className="comments-replying-to">
                Replying to <strong>@{replyTo.username}</strong>
                <button onClick={() => setReplyTo(null)}>
                  <FiX size={12} />
                </button>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="compose-attachments">
                {attachments.map((a) => (
                  <MediaPreview
                    key={a.tmpId}
                    item={a}
                    onRemove={() => removeAttachment(a.tmpId)}
                  />
                ))}
              </div>
            )}

            {mentionResults.length > 0 && (
              <div className="mention-dropdown">
                {mentionResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="mention-option"
                    onClick={() => insertMention(u)}
                  >
                    <img src={u.avatar_url || FALLBACK_AVATAR} alt="" />
                    <span className="mention-username">@{u.username}</span>
                    {u.display_name && (
                      <span className="mention-name">{u.display_name}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showEmoji && (
              <div className="emoji-popover">
                <EmojiPicker
                  onEmojiClick={(data) => insertEmoji(data.emoji)}
                  lazyLoadEmojis
                  width="100%"
                  height={320}
                />
              </div>
            )}

            {showGif && (
              <GifPicker onPick={addGif} onClose={() => setShowGif(false)} />
            )}

            {showVoice && (
              <div className="voice-popover">
                <VoiceRecorder
                  onComplete={onVoiceComplete}
                  onCancel={() => setShowVoice(false)}
                />
              </div>
            )}

            <form className="comments-compose" onSubmit={submit}>
              <div className="compose-tools">
                <button
                  type="button"
                  className={showEmoji ? "compose-tool is-active" : "compose-tool"}
                  onClick={() => {
                    setShowEmoji((v) => !v);
                    setShowGif(false);
                    setShowVoice(false);
                  }}
                  title="Emoji"
                >
                  <FiSmile size={18} />
                </button>
                <button
                  type="button"
                  className={showGif ? "compose-tool is-active" : "compose-tool"}
                  onClick={() => {
                    setShowGif((v) => !v);
                    setShowEmoji(false);
                    setShowVoice(false);
                  }}
                  title="GIF"
                >
                  <span className="compose-gif-label">GIF</span>
                </button>
                <MediaPicker
                  accept="image"
                  multiple
                  maxFiles={MAX_ATTACHMENTS}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                  onSelect={(files) => addFiles(files, "image")}
                >
                  <span className="compose-tool" title="Photo">
                    <FiImage size={18} />
                  </span>
                </MediaPicker>
                <button
                  type="button"
                  className={showVoice ? "compose-tool is-active" : "compose-tool"}
                  onClick={() => {
                    setShowVoice((v) => !v);
                    setShowEmoji(false);
                    setShowGif(false);
                  }}
                  title="Voice note"
                >
                  <FiMic size={18} />
                </button>
              </div>

              <textarea
                ref={inputRef}
                id="comment-input"
                className="comments-input"
                placeholder="Add a comment…"
                value={text}
                rows={1}
                onChange={onTextChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="comments-send"
                disabled={!canSend}
                id="comment-send"
              >
                {posting ? <span className="send-spinner" /> : <FiSend size={16} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
