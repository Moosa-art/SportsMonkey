// Shared client-side comment store. Used by the comments sheet AND by quick
// reactions like the Player Stats “Your thoughts?” post, so a posted thought
// shows up as a real comment even when the backend is unavailable. Persists to
// localStorage under a per-item key.

export const LOCAL_KEY = (itemId) => `cf_comments_${itemId}`;

export function readLocalComments(itemId) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(itemId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeLocalComments(itemId, comments) {
  try {
    localStorage.setItem(LOCAL_KEY(itemId), JSON.stringify(comments));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function makeLocalComment({ body, attachments, parentId }) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    item_id: null,
    parent_id: parentId || null,
    body: body || '',
    attachments: attachments || [],
    mentions: [],
    hashtags: [],
    reactions: {},
    my_reaction: null,
    reply_count: 0,
    replies: [],
    created_at: new Date().toISOString(),
    author: { id: 'me', username: 'you', display_name: 'You', avatar_url: null, is_verified: false },
  };
}
