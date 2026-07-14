/**
 * src/lib/feed/normalizeFeed.js
 *
 * Pure, side-effect-free functions that convert the raw, heterogeneous
 * `club-feed-new` payload into a flat list of strongly-shaped FeedItem
 * view-models. Keeping this pure makes it trivially unit-testable and keeps all
 * upstream-shape knowledge in one place.
 *
 * Design goals:
 *  - Null-safe: every upstream field is treated as optional/possibly-missing.
 *  - Forward-compatible: unknown tile/layout types degrade gracefully.
 *  - Stable identity: each item carries a `dedupeId` so the feed hook can drop
 *    duplicates the paginated endpoint may legitimately re-send.
 *  - Filter-ready: each item carries `timestamp`, `engagement` and `sourceKey`
 *    so the client-side filter engine (feedFilters.js) can operate on real data.
 *
 * @typedef {import('./feedTypes').FeedItem} FeedItem
 */

import { MEDIA_BASE } from './feedConfig.js';
import { parseCreatedAt } from './feedFilters.js';

const GLANCE_VARIANTS = new Set(['glance_post_1', 'glance_post_2', 'glance_post_3']);

// ── small helpers ───────────────────────────────────────────────

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

const isPlaceholderData = (d) =>
  d == null ||
  d === 'coming soon' ||
  (Array.isArray(d) && d.length === 0) ||
  (typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length === 0);

const clean = (s) => (typeof s === 'string' ? s.trim() : s);

const sourceKeyOf = (s) => {
  const v = clean(s);
  return v ? v.toLowerCase() : null;
};

const maxTs = (values) => {
  const nums = values.filter((n) => typeof n === 'number' && Number.isFinite(n));
  return nums.length ? Math.max(...nums) : null;
};

/**
 * Resolve a possibly-relative upstream media URL to an absolute one. Encodes
 * stray spaces so URLs like ".../Web -16-9 (51).png" load reliably.
 * @param {string|null|undefined} url
 * @param {string} [base]
 * @returns {string|null}
 */
export function resolveMediaUrl(url, base = MEDIA_BASE) {
  if (!url || typeof url !== 'string') return null;
  let u = url.trim();
  if (!u) return null;
  if (u.startsWith('//')) u = `https:${u}`;
  else if (u.startsWith('/')) u = `${base}${u}`;
  else if (!/^https?:\/\//i.test(u)) u = `${base}/${u}`;
  // Only encode raw spaces; leave already-encoded sequences intact.
  return u.includes(' ') ? u.replace(/ /g, '%20') : u;
}

/**
 * Extract an 11-char YouTube id from any common YouTube URL form.
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/**
 * Classify a video item's presentation format (Area 11). The upstream payload
 * carries no orientation/duration metadata, so we infer from the URL shape:
 *  - YouTube Shorts (vertical) -> 'reel'
 *  - landscape watch videos & ordinary mp4 clips -> 'video'
 *  - mp4 URLs hinting at a vertical clip (reel/short/vertical/story) -> 'reel'
 * @param  provider: string, url: (string|null|undefined)  v
 * @returns {('reel'|'video')}
 */
export function detectMediaFormat({ provider, url }) {
  const u = typeof url === 'string' ? url.toLowerCase() : '';
  if (provider === 'youtube') return /\/shorts\//.test(u) ? 'reel' : 'video';
  return /(reel|short|vertical|story|9x16|9-16)/.test(u) ? 'reel' : 'video';
}

/**
 * Merge an existing pagination cursor with a newly-returned one, unioning the
 * "seen" id arrays so the upstream keeps advancing instead of replaying page 1.
 * @param {Object|null} prev
 * @param {Object|null} next
 * @returns {Object|null}
 */
export function mergeOffsets(prev, next) {
  if (!next) return prev || null;
  if (!prev) return next;
  const union = (a, b) => Array.from(new Set([...(a || []), ...(b || [])]));
  return {
    ...prev,
    ...next,
    news_seen_ids: union(prev.news_seen_ids, next.news_seen_ids),
    viewed_video_ids: union(prev.viewed_video_ids, next.viewed_video_ids),
    seen_club_post: union(prev.seen_club_post, next.seen_club_post),
  };
}

// ── article / sub-shape normalizers ─────────────────────────────────

function normalizeNewsArticle(a, nowMs) {
  if (!a || typeof a !== 'object') return null;
  const club = a.news_type && a.news_type.club ? a.news_type.club : null;
  return {
    id: a.id,
    title: clean(a.title) || 'Untitled',
    image: resolveMediaUrl(a.image),
    link: a.link || null,
    source: clean(a.source) || clean(a.source_title) || 'Unknown source',
    sourceImg: resolveMediaUrl(a.source_img),
    sourceType: a.source_type || 'simple_news',
    isRedirect: !!a.is_redirect,
    club: club ? { name: club.name, image: resolveMediaUrl(club.image) } : null,
    newsKind: (a.news_type && a.news_type.type) || null,
    summary: asArray(a.body).map(clean).filter(Boolean),
    article: asArray(a.modal_body)
      .map(clean)
      .filter((p) => p && p !== '[unable to retrieve full-text content]'),
    createdAt: a.creation_date || null,
    timestamp: parseCreatedAt(a.creation_date, nowMs),
  };
}

function normalizePlayerRatings(d) {
  const lf = (d && d.lineup_formation) || {};
  const players = asArray(lf.processedPlayers).map((p) => ({
    id: p.playerId,
    name: p.playerTitle,
    lastName: p.playerLastname,
    image: resolveMediaUrl(p.playerImage),
    rating:
      p.playerStats && typeof p.playerStats.rating === 'number' ? p.playerStats.rating : null,
    goals: p.goalsScored || 0,
    cards: p.cardsDisplay || { yellow: 0, red: 0, yellowRed: 0 },
    out: !!p.playerOUT,
    stats: p.playerStats || {},
  }));
  return {
    formation: lf.player_lineup_formation || null,
    players,
    summary: clean(d.post_body) || null,
    source: clean(d.source) || 'Player Ratings',
    sourceImg: resolveMediaUrl(d.source_img),
    createdAt: d.creation_date || null,
    match: {
      homeTitle: d.home_title || null,
      awayTitle: d.away_title || null,
      homeScore: d.home_score != null ? String(d.home_score) : null,
      awayScore: d.away_score != null ? String(d.away_score) : null,
      homeImg: resolveMediaUrl(d.home_team),
      awayImg: resolveMediaUrl(d.away_team),
    },
    // Home/away team match stats (shots, passes, tackles, …) that the live
    // payload ships under lineup_formation.maxStats. Drives the Match Stats
    // comparison card. Null when absent (older sample fixtures) so that card
    // simply doesn't render.
    matchStats:
      lf.maxStats && (lf.maxStats.home || lf.maxStats.away)
        ? { home: lf.maxStats.home || {}, away: lf.maxStats.away || {} }
        : null,
  };
}

function normalizeInteractive(d) {
  const ranked = Object.values(d.key_thoughts_player || {})
    .map((t) => ({ image: resolveMediaUrl(t.player_image), rank: t.rank || '' }))
    .filter((t) => t.image);
  return {
    question: clean(d.post_outer_text) || 'Vote now',
    comments: Number(d.key_comments) || 0,
    source: clean(d.source) || 'Interactive',
    sourceImg: resolveMediaUrl(d.source_img),
    players: asArray(d.players_list).map((p) => ({ title: p.title, lastName: p.last_name })),
    ranked,
  };
}

function normalizeStatPlayer(p) {
  const s = p.stats || {};
  return {
    name: p.name,
    image: resolveMediaUrl(p.image),
    statName: s.stats_name || null,
    value: s.value != null ? s.value : null,
    apps: s.apps != null ? s.apps : null,
    season: s.season || null,
  };
}

function normalizeFixtures(d) {
  return asArray(d && d.fixtures).map((f) => ({
    matchId: f.match_id,
    home: {
      title: (f.home && f.home.title) || '',
      image: resolveMediaUrl(f.home && f.home.image),
      score: f.home && f.home.score != null ? String(f.home.score) : '',
    },
    away: {
      title: (f.away && f.away.title) || '',
      image: resolveMediaUrl(f.away && f.away.image),
      score: f.away && f.away.score != null ? String(f.away.score) : '',
    },
    status: f.match_status || '',
    dateTime: f.date_time || '',
  }));
}

// ── glance tile normalizer ──────────────────────────────────────

function normalizeGlanceTile(raw, key, nowMs, ctx = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type || raw.post_type;

  // Top-scorer stories ship in many stat variants (goals, tackles, assists,
  // crosses, …). Handle them generically so new variants aren't dropped as
  // "unknown" — this alone recovers a whole class of cards the feed was losing.
  if (typeof type === 'string' && /^top_scorer_.*_story$/.test(type)) {
    const players = asArray(raw.data).map(normalizeStatPlayer).filter((p) => p.name);
    if (!players.length) return null;
    const m = type.match(/^top_scorer_(.*)_story$/);
    return { tileType: 'topScorers', key, statType: (m && m[1]) || 'goals', players };
  }

  switch (type) {
    case 'glance_news': {
      // The live API double-wraps each article under `data[i].data`; older
      // sample/test fixtures keep the article flat at `data[i]`. Unwrap either
      // shape so At-a-Glance news renders real content instead of "Untitled".
      const entry = asArray(raw.data)[0];
      const src =
        entry && entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data)
          ? entry.data
          : entry;
      const article = normalizeNewsArticle(src, nowMs);
      return article ? { tileType: 'news', key, article } : null;
    }
    case 'player_rating_post':
      if (isPlaceholderData(raw.data)) return null;
      return { tileType: 'playerRatings', key, ...normalizePlayerRatings(raw.data) };
    case 'interactive_post':
      if (isPlaceholderData(raw.data)) return null;
      return { tileType: 'vote', key, ...normalizeInteractive(raw.data) };
    case 'league_table_story':
      // Promote only the first table pointer per page into a full, data-backed
      // League Table card; keep any extras as compact quick-links.
      if (ctx && !ctx.leagueTableEmitted) {
        ctx.leagueTableEmitted = true;
        return { tileType: 'leagueTable', key, storyType: type };
      }
      return { tileType: 'story', key, storyType: type };
    case 'highlights_detail_story':
    case 'live_score_story':
      return { tileType: 'story', key, storyType: type };
    case 'streamhd':
    case 'freebet':
    case 'choose_playing_11':
    case 'fixtures':
    case 'invite_friends':
      return {
        tileType: 'promo',
        key,
        promoType: type,
        source: clean(raw.source) || 'Fixtures',
        fixtures: asArray(raw.data && raw.data.fixtures).map((f) => ({
          matchId: f.match_id,
          dateTime: f.date_time,
          status: f.status,
          home: { title: f.home.title, image: resolveMediaUrl(f.home.image), score: f.home.score },
          away: { title: f.away.title, image: resolveMediaUrl(f.away.image), score: f.away.score },
        })),
        bottomText: (raw.data && raw.data.bottom_text) || null,
        data: raw.data
      };
    default: {
      // Surface EVERY other tile type generically instead of dropping it, so
      // prediction / inspiration / team_comparison / creative / technical /
      // fastest / stats / attributes / etc. all appear in the feed.
      const gd = raw.data && typeof raw.data === 'object' ? raw.data : raw;
      if (!type || isPlaceholderData(raw.data)) {
        return { tileType: 'unknown', key, rawType: type || 'unknown' };
      }
      return {
        tileType: 'generic',
        key,
        rawType: type,
        data: gd,
        source: clean(gd.source) || clean(gd.source_title) || null,
        sourceImg: resolveMediaUrl(gd.source_img),
        createdAt: gd.creation_date || null,
        timestamp: parseCreatedAt(gd.creation_date, nowMs),
        engagement: engagementOf(gd),
      };
    }
  }
}

function normalizeGlanceGroup(el, page, index, nowMs, ctx = {}) {
  const tiles = [];
  Object.keys(el)
    .filter((k) => /^post_\d+$/.test(k))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .forEach((k, i) => {
      const tile = normalizeGlanceTile(el[k], `${page}-${index}-${k}-${i}`, nowMs, ctx);
      if (tile && tile.tileType !== 'unknown') tiles.push(tile);
    });
  if (!tiles.length) return null;

  const engagement = tiles
    .filter((t) => t.tileType === 'vote')
    .reduce((sum, t) => sum + (Number(t.comments) || 0), 0);
  const timestamp = maxTs(
    tiles.filter((t) => t.tileType === 'news').map((t) => t.article && t.article.timestamp),
  );

  return {
    kind: 'glance',
    dedupeId: `glance:${page}:${index}`,
    variant: el.feed_layout_type || 'glance_post_1',
    tiles,
    timestamp,
    engagement,
    sourceKey: null,
  };
}

// ── element dispatcher ────────────────────────────────────────

/**
 * Sum the upstream engagement counts (likes + comments) the live feed attaches
 * under `interaction_counts`, so the Trending tab can rank real data. Returns 0
 * when absent (e.g. older flat sample fixtures).
 */
const engagementOf = (d) => {
  const ic = d && d.interaction_counts;
  if (!ic || typeof ic !== 'object') return 0;
  return (Number(ic.like_count) || 0) + (Number(ic.comment_count) || 0);
};

function normalizeElement(el, page, index, nowMs, ctx = {}) {
  if (!el || typeof el !== 'object') return null;
  const layout = el.feed_layout_type;

  if (GLANCE_VARIANTS.has(layout)) {
    return normalizeGlanceGroup(el, page, index, nowMs, ctx);
  }

  // The live `club-feed-new` API wraps each non-glance tile's fields under
  // `el.data`; older sample/test fixtures keep them flat on `el`. Read from
  // `data` when it's a content object, otherwise fall back to the element
  // itself so BOTH shapes normalize. (Reading the flat shape only was silently
  // dropping every live item and forcing the bundled-sample fallback.)
  const d =
    el.data && typeof el.data === 'object' && !Array.isArray(el.data) ? el.data : el;
  const postType = el.post_type || d.post_type;

  // Player Stats card (club_highest_goals_player): full per-metric stat table
  // with club + league rankings across Summary/Defensive/Offensive/Passing.
  if (postType === 'club_highest_goals_player') {
    const pi = d.player_info || {};
    const ps = d.player_stats || {};
    const toRows = (obj) =>
      obj && typeof obj === 'object' && !Array.isArray(obj)
        ? Object.keys(obj).map((label) => {
            const v = obj[label] || {};
            const pos = v.position || {};
            return {
              label,
              value: v.value != null ? v.value : '-',
              clubPos: pos.club_position != null ? pos.club_position : null,
              leaguePos: pos.league_position != null ? pos.league_position : null,
            };
          })
        : [];
    const tabs = [
      { key: 'summary', label: 'Summary', rows: toRows(ps.summary) },
      { key: 'defensive', label: 'Defensive', rows: toRows(ps.defensive) },
      { key: 'offensive', label: 'Offensive', rows: toRows(ps.offensive) },
      { key: 'passing', label: 'Passing', rows: toRows(ps.passing) },
    ].filter((t) => t.rows.length);
    if (!clean(pi.name) || !tabs.length) return null;
    const logos = d.logos || {};
    return {
      kind: 'playerStats',
      dedupeId: `pstats:${pi.id != null ? pi.id : index}:${page}`,
      player: {
        id: pi.id,
        name: clean(pi.name),
        image: resolveMediaUrl(pi.image),
        age: clean(pi.age),
        height: clean(pi.height),
        position: clean(pi.position),
      },
      tabs,
      clubLogo: resolveMediaUrl(logos.club),
      leagueLogo: resolveMediaUrl(logos.league),
      source: clean(d.source) || 'Player Stats',
      sourceImg: resolveMediaUrl(d.source_img),
      createdAt: d.creation_date || null,
      timestamp: parseCreatedAt(d.creation_date, nowMs),
      engagement: engagementOf(d),
      sourceKey: 'player_stats',
    };
  }

  // Player Comparison selector (club_post / club_player_comparison). The feed
  // ships the club roster + seasons; head-to-head stats load on demand. This
  // was previously dropped because club_post only handled fixtures.
  if (postType === 'club_player_comparison') {
    const players = asArray(d.club_player)
      .map((p) => ({ id: p.id, name: clean(p.name), image: resolveMediaUrl(p.image) }))
      .filter((p) => p.name);
    if (!players.length) return null;
    return {
      kind: 'playerComparison',
      dedupeId: `pcmp:${page}:${index}`,
      players,
      seasons: asArray(d.seasons_list)
        .map((s) => ({ id: s.id, title: clean(s.title) }))
        .filter((s) => s.title),
      source: clean(d.source) || 'Player Comparison',
      sourceImg: resolveMediaUrl(d.source_img),
      timestamp: null,
      engagement: engagementOf(d),
      sourceKey: 'player_comparison',
    };
  }

  if (layout === 'club_post' || postType === 'club_fixtures') {
    const fixtures = normalizeFixtures(el.data);
    if (!fixtures.length) return null;
    return {
      kind: 'fixtures',
      dedupeId: `fixtures:${page}:${index}`,
      layout: layout || 'club_post',
      fixtures,
      bottomText: clean(el.data && el.data.bottom_text) || null,
      source: clean(el.data && el.data.source) || 'Fixtures',
      sourceImg: resolveMediaUrl(el.data && el.data.source_img),
      timestamp: maxTs(fixtures.map((f) => parseCreatedAt(f.dateTime, nowMs))),
      engagement: 0,
      sourceKey: 'fixtures',
    };
  }

  if (layout === 'youtube_news') {
    return {
      kind: 'video',
      dedupeId: `video:${d.id}`,
      layout,
      provider: 'youtube',
      id: d.id,
      title: clean(d.title) || 'Watch',
      thumbnail: resolveMediaUrl(d.image),
      url: d.link || null,
      youtubeId: extractYouTubeId(d.link),
      mediaFormat: detectMediaFormat({ provider: 'youtube', url: d.link }),
      source: clean(d.source) || 'YouTube',
      sourceImg: resolveMediaUrl(d.source_img),
      createdAt: d.creation_date || null,
      timestamp: parseCreatedAt(d.creation_date, nowMs),
      engagement: engagementOf(d),
      sourceKey: sourceKeyOf(d.source) || 'youtube',
    };
  }

  if (layout === 'funny_video') {
    return {
      kind: 'video',
      dedupeId: `video:${d.id}`,
      layout,
      provider: 'mp4',
      id: d.id,
      title: clean(d.title) || 'Video',
      thumbnail: resolveMediaUrl(d.image),
      url: resolveMediaUrl(d.link),
      youtubeId: null,
      mediaFormat: detectMediaFormat({ provider: 'mp4', url: d.link }),
      source: clean(d.source_title) || clean(d.source) || 'Video',
      sourceImg: resolveMediaUrl(d.source_img),
      createdAt: d.creation_date || null,
      timestamp: parseCreatedAt(d.creation_date, nowMs),
      engagement: engagementOf(d),
      sourceKey: sourceKeyOf(d.source_title) || sourceKeyOf(d.source) || 'video',
    };
  }

  // News. The live payload doesn't always tag `feed_layout_type: 'simple_news'`,
  // so also accept a data object that clearly looks like an article (carries a
  // news_type / modal_body / simple_news source_type).
  const looksLikeNews =
    layout === 'simple_news' ||
    d.source_type === 'simple_news' ||
    d.modal_body != null ||
    d.news_type != null;
  if (looksLikeNews) {
    const article = normalizeNewsArticle(d, nowMs);
    if (!article) return null;
    return {
      kind: 'news',
      dedupeId: `news:${article.id}`,
      layout: layout || 'simple_news',
      article,
      timestamp: article.timestamp,
      engagement: engagementOf(d),
      sourceKey: sourceKeyOf(article.source),
    };
  }

  return null; // genuinely unknown — skip safely
}

function normalizeGlobal(g) {
  if (!g || typeof g !== 'object') return null;
  return {
    clubTitle: g.club_title || null,
    clubLogo: resolveMediaUrl(g.club_logo),
    leagueTitle: g.league_title || null,
    leagueLogo: resolveMediaUrl(g.league_logo),
    userId: g.user_id != null ? g.user_id : null,
  };
}

/**
 * Normalize a raw club-feed-new payload into a render-ready list.
 * @param {import('./feedTypes').RawClubFeedResponse} raw
 * @param  page?: number, nowMs?: number  [opts]
 * @returns  status: boolean, items: FeedItem[], rawCount: number, offsets: Object|null, global: Object|null 
 */
export function normalizeFeed(raw, { page = 0, nowMs = Date.now() } = {}) {
  const feed = asArray(raw && raw.feed);
  const items = [];
  // Shared per-pass context so we can de-duplicate singleton cards: only the
  // FIRST league_table_story pointer is promoted to a full table card per page;
  // later ones stay as compact quick-links so the table never repeats.
  const ctx = { leagueTableEmitted: false };
  feed.forEach((el, i) => {
    const item = normalizeElement(el, page, i, nowMs, ctx);
    if (item) items.push(item);
  });
  return {
    status: !raw || raw.status !== false,
    items,
    rawCount: feed.length,
    offsets: (raw && raw.offsets) || null,
    global: normalizeGlobal(raw && raw.global_variable),
  };
}

export default normalizeFeed;
