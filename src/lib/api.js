/**
 * src/lib/api.js  — DROP-IN REPLACEMENT
 *
 * This file replaces the original 25-line stub with a full API client.
 * It is 100% backwards-compatible: fetchJson(path, options) works exactly
 * as before.  New helpers are additive only.
 *
 * ─ What changed ──────────────────────────────────────────────────────────
 * 1. fetchJson now attaches the JWT Authorization header automatically.
 * 2. fetchJson retries once with a refreshed token on 401 responses.
 * 3. New helpers: api.like, api.unlike, api.comment, api.follow,
 *    api.unfollow, api.report, api.getNotifications
 * 4. connectSocket() provides a Socket.io client for real-time updates.
 * ─────────────────────────────────────────────────────────────────────────
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Token storage (in-memory; survives page but not hard refresh) ─────────
// On hard refresh the refresh-cookie flow re-issues a new access token.
let _accessToken = null;

export function setAccessToken(token) {
  const changed = token !== _accessToken;
  _accessToken = token;
  // If the user just authenticated over an already-open (guest) socket,
  // re-handshake so they join their private user:{id} room.
  if (changed && token) _reauthSocket();
}
export function getAccessToken()      { return _accessToken;  }

// ── Core fetch helper ─────────────────────────────────────────────────────

/**
 * fetchJson — backwards-compatible drop-in for the original helper.
 *
 * @param {string} path          - e.g. '/feed' or '/social/like'
 * @param {object} [options]
 * @param {any}    [options.fallback]  - value returned on any error
 * @param {AbortSignal} [options.signal]
 * @param {string} [options.method]    - default 'GET'
 * @param {object} [options.body]      - JSON body for POST/PATCH/DELETE
 * @returns {Promise<any>}
 */
export async function fetchJson(path, { fallback, signal, method = 'GET', body } = {}) {
  try {
    const response = await _fetch(path, { signal, method, body });

    // Auto-refresh on 401
    if (response.status === 401 && _accessToken) {
      const refreshed = await _refreshAccessToken();
      if (refreshed) {
        const retried = await _fetch(path, { signal, method, body });
        if (!retried.ok) {
          const errorData = await retried.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${retried.status}`);
        }
        return retried.json();
      }
    }

    if (!response.ok) {
      // Try to parse error response body
      let errorMsg = `Request failed: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {
        // If JSON parsing fails, use default error message
      }
      throw new Error(errorMsg);
    }
    
    return response.json();
  } catch (error) {
    console.error(`[api] ${method} ${path} failed:`, error);
    // If error is a TypeError (network error), provide helpful message
    if (error instanceof TypeError) {
      const networkError = new Error('Network error - API server may not be running. Make sure the backend is started with: npm run server');
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}

// ── Internal ──────────────────────────────────────────────────────────────

async function _fetch(path, { signal, method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',  // send the refresh-token cookie
    signal,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function _refreshAccessToken() {
  try {
    const res  = await fetch(`${API_BASE}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    });
    if (!res.ok) { _accessToken = null; return false; }
    const data = await res.json();
    _accessToken = data.accessToken;
    // Keep the live socket authenticated with the refreshed token.
    _reauthSocket();
    return true;
  } catch {
    _accessToken = null;
    return false;
  }
}

/**
 * Silently re-hydrate the session on app start using the httpOnly refresh
 * cookie. Returns true if a fresh access token was obtained (user is still
 * authenticated), false otherwise (logged out / expired). Safe to call when no
 * cookie exists — it simply resolves false.
 */
export async function bootstrapSession() {
  return _refreshAccessToken();
}

// ── Named API helpers (tree-shakeable) ────────────────────────────────────

export const api = {
  // Auth
  login: async (email, password) => {
    try {
      const res = await fetchJson('/auth/login', { method: 'POST', body: { email, password } });
      if (!res || !res.accessToken) {
        throw new Error(res?.error || 'Invalid response from server');
      }
      return res;
    } catch (err) {
      throw err;
    }
  },

  register: async (fields) => {
    try {
      const res = await fetchJson('/auth/register', { method: 'POST', body: fields });
      if (!res || !res.accessToken) {
        throw new Error(res?.error || 'Invalid response from server');
      }
      return res;
    } catch (err) {
      throw err;
    }
  },

  logout:   () =>
    fetchJson('/auth/logout',   { method: 'POST' }),

  // Feed
  getFeed: ({ cursor, limit, tab } = {}) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit)  params.set('limit', String(limit));
    if (tab)    params.set('tab', tab);
    const qs = params.toString();
    return fetchJson(`/feed${qs ? `?${qs}` : ''}`);
  },

  // Likes
  like:   (target_type, target_id) =>
    fetchJson('/social/like',   { method: 'POST',   body: { target_type, target_id } }),

  unlike: (target_type, target_id) =>
    fetchJson('/social/like',   { method: 'DELETE', body: { target_type, target_id } }),

  // Comments
  getComments: (postId, { cursor, limit } = {}) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit)  params.set('limit', String(limit));
    const qs = params.toString();
    return fetchJson(`/social/comments/${postId}${qs ? `?${qs}` : ''}`);
  },

  postComment: (post_id, body, parent_id = null) =>
    fetchJson('/social/comments', { method: 'POST', body: { post_id, body, parent_id } }),

  deleteComment: (commentId) =>
    fetchJson(`/social/comments/${commentId}`, { method: 'DELETE' }),

  // Follows  — target_type: 'user' | 'player' | 'team'
  follow:   (target_type, target_id) =>
    fetchJson('/social/follow',  { method: 'POST',   body: { target_type, target_id } }),

  unfollow: (target_type, target_id) =>
    fetchJson('/social/follow',  { method: 'DELETE', body: { target_type, target_id } }),

  getFollowing: (userId) =>
    fetchJson(`/social/following/${userId}`),

  // Reports — reason: spam|hate_speech|misinformation|harassment|violence|nudity|other
  report: (target_type, target_id, reason, detail) =>
    fetchJson('/social/report', { method: 'POST', body: { target_type, target_id, reason, detail } }),

  // Notifications
  getNotifications: () =>
    fetchJson('/social/notifications'),

  markNotificationsRead: () =>
    fetchJson('/social/notifications/read-all', { method: 'POST' }),

  // Media — upload is multipart with progress (see uploadMedia below).
  uploadMedia: (file, opts) => uploadMedia(file, opts),
  getMedia:    (id)         => fetchJson(`/media/${id}`),
  deleteMedia: (id)         => fetchJson(`/media/${id}`, { method: 'DELETE' }),

  // Profiles
  getMyProfile:     ()           => fetchJson('/profiles/me'),
  updateMyProfile:  (fields)     => fetchJson('/profiles/me', { method: 'PATCH', body: fields }),
  getUserProfile:   (username)   => fetchJson(`/profiles/user/${username}`),
  getPlayers:       (limit = 20) => fetchJson(`/profiles/players?limit=${limit}`),
  getPlayerProfile: (id)         => fetchJson(`/profiles/player/${id}`),
  getTeamProfile:   (id)         => fetchJson(`/profiles/team/${id}`),
  // Edit Profile (Area 10) — username availability + club/team picker source.
  checkUsername:    (username)   => fetchJson(`/profiles/username-available?u=${encodeURIComponent(username)}`),
  listTeams:        (q = '')     => fetchJson(`/profiles/teams${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  // Football data
  getFixtures: ()          => fetchJson('/fixtures'),
  getTable:    (league)    => fetchJson(`/table?league=${league}`),
  getLive:     (date)      => fetchJson(`/live?date=${date}`),

  // Stories
  getStories:  ()          => fetchJson('/stories'),
  getStory:    (id)        => fetchJson(`/stories/${id}`),

  // Club-scoped production feed (via BFF /api/club-feed)
  // GET for the first page; POST { offsets } to fetch the next page using the
  // opaque cursor the upstream feed echoes back.
  getClubFeed: ({ clubId = 14, offsets = null, signal } = {}) => {
    const path = `/club-feed?club_id=${clubId}`;
    return offsets
      ? fetchJson(path, { method: 'POST', body: { offsets, club_id: clubId }, signal })
      : fetchJson(path, { signal });
  },

  // Live league standings (via BFF /api/league-table). Pass exactly one of
  // leagueId / countryId / clubId; leagueId wins, then countryId, then clubId.
  //   getLeagueTable({ clubId: 19 })   → club's country + leagues + standings
  //   getLeagueTable({ leagueId: 2 })  → standings for a specific league
  //   getLeagueTable({ countryId: 8 }) → switch country
  getLeagueTable: ({ clubId, leagueId, countryId, signal } = {}) => {
    const qs = new URLSearchParams();
    if (leagueId != null)       qs.set('league_id', String(leagueId));
    else if (countryId != null) qs.set('country_id', String(countryId));
    else                        qs.set('club_id', String(clubId != null ? clubId : 19));
    return fetchJson(`/league-table?${qs.toString()}`, {
      signal,
      fallback: { status: false, data: null },
    });
  },

  // Live club fixtures (via BFF /api/club-fixtures). `userTimezone` defaults to
  // the viewer's browser timezone so the upstream returns localized date_time.
  //   getClubFixtures({ clubId: 22822 })
  getClubFixtures: ({ clubId, userTimezone, signal } = {}) => {
    let tz = userTimezone;
    if (!tz) {
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { tz = 'UTC'; }
    }
    const qs = new URLSearchParams();
    if (clubId != null) qs.set('club_id', String(clubId));
    qs.set('user_timezone', tz || 'UTC');
    return fetchJson(`/club-fixtures?${qs.toString()}`, {
      signal,
      fallback: { status: false, fixtures: [] },
    });
  },

  // Engagement on club-feed items — persisted in our own DB (see
  // server/routes/clubSocial.js + migrations/002_club_engagement.sql).
  bootstrapSession,
  // Batch-fetch counts + the viewer's liked state for a list of item ids so the
  // feed can seed each card and likes survive a refresh.
  getClubEngagement: (ids = [], { signal } = {}) => {
    const list = Array.from(new Set((ids || []).filter(Boolean).map(String)));
    if (list.length === 0) return Promise.resolve({ items: {} });
    const qs = encodeURIComponent(list.join(','));
    return fetchJson(`/club-social/engagement?ids=${qs}`, { signal });
  },
  clubLike:    (postId) =>
    fetchJson('/club-social/like', { method: 'POST', body: { post_id: postId } }),
  clubUnlike:  (postId) =>
    fetchJson('/club-social/like', { method: 'DELETE', body: { post_id: postId } }),
  // Threaded, rich club-feed comments (attachments + @mentions + #hashtags).
  getClubComments: (itemId, { cursor = null, limit = 20, signal } = {}) => {
    const qs = new URLSearchParams({ item_id: String(itemId), limit: String(limit) });
    if (cursor) qs.set('cursor', String(cursor));
    return fetchJson(`/club-social/comments?${qs.toString()}`, { signal });
  },
  // Accepts either a plain string body or an options object
  // ({ body, parentId, attachments }). attachments: [{ kind, media_id }|{ kind:'gif', url }].
  clubComment: (itemId, bodyOrOpts = {}) => {
    const opts = typeof bodyOrOpts === 'string' ? { body: bodyOrOpts } : bodyOrOpts || {};
    const { body = '', parentId = null, attachments = [] } = opts;
    return fetchJson('/club-social/comment', {
      method: 'POST',
      body: { post_id: itemId, body, parent_id: parentId, attachments },
    });
  },
  reactClubComment: (commentId, emoji) =>
    fetchJson(`/club-social/comment/${commentId}/react`, { method: 'POST', body: { emoji } }),
  unreactClubComment: (commentId) =>
    fetchJson(`/club-social/comment/${commentId}/react`, { method: 'DELETE' }),
  // GIF search (Tenor, proxied server-side so the API key never reaches the browser).
  searchGifs: (q, { pos = '', limit = 24, signal } = {}) => {
    const qs = new URLSearchParams({ q: String(q || ''), limit: String(limit) });
    if (pos) qs.set('pos', String(pos));
    return fetchJson(`/media/gif/search?${qs.toString()}`, { signal });
  },
  trendingGifs: ({ pos = '', limit = 24, signal } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (pos) qs.set('pos', String(pos));
    return fetchJson(`/media/gif/trending?${qs.toString()}`, { signal });
  },
  // User lookup for @mention autocomplete.
  searchUsers: (q, { signal } = {}) =>
    fetchJson(`/social/users/search?q=${encodeURIComponent(String(q || ''))}`, { signal }),
  clubShare:   (postId) =>
    fetchJson('/club-social/share', { method: 'POST', body: { post_id: postId } }),
  clubFollow:  (targetId, on = true) =>
    fetchJson('/club-social/follow', { method: on ? 'POST' : 'DELETE', body: { target_id: targetId } }),

  // Saved / bookmarked club-feed items — persisted in our own DB
  // (see server/routes/clubSocial.js + migrations/003_saved_posts.sql).
  clubSave:    (itemId, snapshot = null) =>
    fetchJson('/club-social/save', { method: 'POST', body: { item_id: itemId, snapshot } }),
  clubUnsave:  (itemId) =>
    fetchJson('/club-social/save', { method: 'DELETE', body: { item_id: itemId } }),
  // Full set of saved item ids (used to hydrate the bookmark store on login).
  getClubSavedIds: ({ signal } = {}) => fetchJson('/club-social/saved/ids', { signal }),
  // Paginated saved items with render snapshots for the profile "Saved" view.
  getClubSaved: ({ cursor = null, limit = 20, signal } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set('cursor', String(cursor));
    return fetchJson(`/club-social/saved?${qs.toString()}`, { signal });
  },

  // ── Direct messages (DMs) ───────────────────────────────────
  // Backed by server/routes/messages.js + migrations/007_direct_messages.sql.
  listConversations: ({ signal } = {}) =>
    fetchJson('/messages/conversations', { signal }),
  openConversation: (userId) =>
    fetchJson('/messages/conversations', { method: 'POST', body: { user_id: userId } }),
  getMessages: (conversationId, { before = null, limit = 30, signal } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (before) qs.set('before', String(before));
    return fetchJson(`/messages/conversations/${conversationId}/messages?${qs.toString()}`, { signal });
  },
  sendMessage: (conversationId, body) =>
    fetchJson(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: { body } }),
  markConversationRead: (conversationId) =>
    fetchJson(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),
  messagesUnreadCount: ({ signal } = {}) =>
    fetchJson('/messages/unread-count', { signal }),
};

// ── SportsMonk API Client ─────────────────────────────────────────────────
const SPORTSMONK_API = 'https://api.sportmonks.com/v3';
const SPORTSMONK_TOKEN = import.meta.env.VITE_SPORTSMONK_API_KEY || 'test_key';

/**
 * SportsMonk API wrapper for fetching football data
 */
export const sportsMonkApi = {
  // Leagues & Seasons
  getLeagues: async () => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues?api_token=${SPORTSMONK_TOKEN}&include=country`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getLeagues failed:', error);
      return { data: [] };
    }
  },

  getLeagueSeasons: async (leagueId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/seasons?api_token=${SPORTSMONK_TOKEN}`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getLeagueSeasons failed:', error);
      return { data: [] };
    }
  },

  // Teams
  getTeams: async (leagueId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/seasons/${seasonId}/teams?api_token=${SPORTSMONK_TOKEN}&include=country`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getTeams failed:', error);
      return { data: [] };
    }
  },

  getTeamById: async (teamId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/teams/${teamId}?api_token=${SPORTSMONK_TOKEN}&include=country,league`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getTeamById failed:', error);
      return { data: null };
    }
  },

  // Fixtures
  getFixturesByTeam: async (teamId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/teams/${teamId}/seasons/${seasonId}/fixtures?api_token=${SPORTSMONK_TOKEN}&include=league,participants,standings&sort=-starts_at`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getFixturesByTeam failed:', error);
      return { data: [] };
    }
  },

  getFixturesByLeague: async (leagueId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/seasons/${seasonId}/fixtures?api_token=${SPORTSMONK_TOKEN}&include=league,participants,standings&sort=-starts_at`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getFixturesByLeague failed:', error);
      return { data: [] };
    }
  },

  getFixtureDetails: async (fixtureId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/fixtures/${fixtureId}?api_token=${SPORTSMONK_TOKEN}&include=league,participants,results,statistics`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getFixtureDetails failed:', error);
      return { data: null };
    }
  },

  // Standings
  getStandings: async (leagueId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/seasons/${seasonId}/standings?api_token=${SPORTSMONK_TOKEN}&include=team`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getStandings failed:', error);
      return { data: [] };
    }
  },

  // Players
  getTeamPlayers: async (teamId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/teams/${teamId}/seasons/${seasonId}/players?api_token=${SPORTSMONK_TOKEN}&include=position,images`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getTeamPlayers failed:', error);
      return { data: [] };
    }
  },

  getPlayerById: async (playerId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/players/${playerId}?api_token=${SPORTSMONK_TOKEN}&include=position,images`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getPlayerById failed:', error);
      return { data: null };
    }
  },

  // News/Highlights
  getLatestNews: async (leagueId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/news?api_token=${SPORTSMONK_TOKEN}&sort=-date`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getLatestNews failed:', error);
      return { data: [] };
    }
  },

  // Top Scorers
  getTopScorers: async (leagueId, seasonId) => {
    try {
      const res = await fetch(`${SPORTSMONK_API}/leagues/${leagueId}/seasons/${seasonId}/topscorers?api_token=${SPORTSMONK_TOKEN}&include=player&sort=-goals`);
      if (!res.ok) throw new Error(`SportsMonk API error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('[SportsMonk] getTopScorers failed:', error);
      return { data: [] };
    }
  },
};

// ── Socket.io client ──────────────────────────────────────────��───────────

let _socket = null;
let _socketLoading = false;
// Buffer subscriptions/emits registered before the async client finishes
// loading, then flush them once the real socket is live. Without this, any
// `.on(...)` registered immediately after connectSocket() was silently dropped.
const _socketPending = { on: [], emit: [] };

function _ensureSocket() {
  if (_socket || _socketLoading) return;
  _socketLoading = true;

  // Dynamically import socket.io-client to keep it out of the main bundle
  // if the feature is not used.
  import('socket.io-client')
    .then(({ io }) => {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      _socket = io(SOCKET_URL, {
        auth:        { token: _accessToken || '' },
        withCredentials: true,
        transports:  ['websocket', 'polling'],
      });

      _socket.on('connect',       () => console.log('[socket] connected'));
      _socket.on('disconnect',    (r) => console.log('[socket] disconnected:', r));
      _socket.on('connect_error', (e) => console.warn('[socket] error:', e.message));

      // Flush anything registered before the client was ready.
      _socketPending.on.forEach(([ev, handler]) => _socket.on(ev, handler));
      _socketPending.emit.forEach(([ev, data]) => _socket.emit(ev, data));
      _socketPending.on.length = 0;
      _socketPending.emit.length = 0;
    })
    .catch((e) => console.warn('[socket] failed to load client:', e?.message))
    .finally(() => {
      _socketLoading = false;
    });
}

// Stable proxy returned to callers. Safe to call before the socket connects.
const _socketProxy = {
  emit: (ev, data) => {
    if (_socket) _socket.emit(ev, data);
    else _socketPending.emit.push([ev, data]);
  },
  on: (ev, handler) => {
    if (_socket) _socket.on(ev, handler);
    else _socketPending.on.push([ev, handler]);
  },
  off: (ev, handler) => {
    if (_socket) {
      _socket.off(ev, handler);
    } else {
      const i = _socketPending.on.findIndex(([e, h]) => e === ev && h === handler);
      if (i >= 0) _socketPending.on.splice(i, 1);
    }
  },
};

/**
 * Re-handshake the live socket with the current access token so room
 * membership (e.g. user:{id}) reflects the latest identity after login or a
 * token refresh. No-op if the socket hasn't been created yet.
 */
function _reauthSocket() {
  if (!_socket) return;
  _socket.auth = { token: _accessToken || '' };
  // disconnect().connect() forces a fresh handshake so the auth middleware
  // re-runs and the socket re-joins the correct rooms.
  _socket.disconnect().connect();
}

/**
 * connectSocket() — lazy-init Socket.io connection.
 * Returns a stable proxy ({ emit, on, off }) on every call; subscriptions made
 * before the client loads are buffered and flushed on connect.
 *
 * Usage in a component:
 *   const socket = connectSocket();
 *   socket.emit('subscribe_post', { postId: '42' });
 *   socket.on('like_updated', ({ like_count }) => setLikes(like_count));
 *
 * The socket auto-passes the current access token for auth.
 */
export function connectSocket() {
  _ensureSocket();
  return _socketProxy;
}

/** Returns the live socket instance once connected, otherwise null. */
export function getSocket() {
  return _socket;
}

/** Tear down the socket (e.g. on logout) and clear any buffered handlers. */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
  _socketPending.on.length = 0;
  _socketPending.emit.length = 0;
}

// ── Media upload (XMLHttpRequest — for upload-progress events) ────────

const _MIME_KIND = [
  [/^image\//, 'image'],
  [/^video\//, 'video'],
  [/^audio\//, 'audio'],
];

/** Best-effort media kind from a File's MIME type. */
export function guessMediaKind(file) {
  const m = file?.type || '';
  for (const [re, kind] of _MIME_KIND) if (re.test(m)) return kind;
  return 'image';
}

/**
 * uploadMedia — POST a File to /api/media/upload with progress reporting.
 * Uses XMLHttpRequest because fetch() cannot report upload progress.
 *
 * @param {File} file
 * @param {object} [opts]
 * @param {'image'|'audio'|'video'|'voice'} [opts.kind]  defaults from MIME
 * @param {'avatar'|'comment'|'post'|'story'|'message'} [opts.use]
 * @param {(percent:number)=>void} [opts.onProgress]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<object>} the created media record
 */
export function uploadMedia(file, { kind, use, onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file provided')); return; }

    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind || guessMediaKind(file));
    if (use) form.append('use', use);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/media/upload`);
    if (_accessToken) xhr.setRequestHeader('Authorization', `Bearer ${_accessToken}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data?.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));

    if (signal) {
      if (signal.aborted) { xhr.abort(); return; }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(form);
  });
}

export default fetchJson;
