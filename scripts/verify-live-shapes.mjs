/**
 * scripts/verify-live-shapes.mjs
 * Verifies the normalizer against the REAL live club-feed-new shapes captured
 * from https://www.social442.com/api/club-feed-new?club_id=14 (double-wrapped
 * glance_news, top_scorer_assists_story, club_post last_match_player_rating).
 */
import { normalizeFeed } from '../src/lib/feed/normalizeFeed.js';

const article = (id, title, type) => ({
  data: {
    id,
    title,
    image: 'https://example.com/x.jpg',
    link: 'https://example.com/a',
    news_type: { type },
    is_redirect: false,
    modal_body: ['Full body paragraph one.', 'Para two.'],
    body: ['Teaser paragraph.'],
    source: 'Goal',
    source_img: 'https://example.com/s.png',
    source_type: 'simple_news',
    creation_date: '2026-06-30 12:09:00',
    interaction_counts: { like_count: 3, comment_count: 1 },
  },
});

const liveFeed = {
  status: true,
  feed: [
    {
      post_1: { type: 'league_table_story' },
      post_2: { type: 'glance_news', data: [article(1132621, 'Rashford reintegration at Man Utd', 'Transfer')] },
      post_3: {
        type: 'player_rating_post',
        data: {
          lineup_formation: {
            processedPlayers: [
              { playerId: 3180, playerTitle: 'B. Fernandes', playerLastname: 'Fernandes', playerImage: 'https://e.com/f.png', playerStats: { rating: 8.7 }, cardsDisplay: { yellow: 0, red: 0 }, playerOUT: false, goalsScored: 1 },
              { playerId: 3489, playerTitle: 'A. Diallo', playerLastname: 'Diallo', playerImage: 'https://e.com/d.png', playerStats: { rating: 7.8 }, cardsDisplay: { yellow: 0, red: 0 }, playerOUT: false, goalsScored: 0 },
            ],
            player_lineup_formation: '4-2-3-1',
            maxStats: {
              home: { shots: 7, passes: 412, 'passing-acc': 83, tackles: 10, crosses: 11, clearances: 12, interceptions: 6 },
              away: { shots: 10, passes: 415, 'passing-acc': 80, tackles: 15, crosses: 12, clearances: 12, interceptions: 9 },
            },
          },
          post_body: 'Last match line up Brighton 0 - 3 Man Utd.',
          id: 104070,
          source: 'Last Match Player Ratings',
          source_img: 'https://e.com/t.png',
          creation_date: '1mo ago',
          home_title: 'Brighton', away_title: 'Man Utd', home_score: '0', away_score: '3',
        },
      },
      post_4: { type: 'highlights_detail_story' },
      post_5: { type: 'live_score_story' },
      post_6: {
        type: 'interactive_post',
        data: {
          source: 'Interactive', source_img: 'https://e.com/t.png', key_comments: 806,
          post_outer_text: "Manchester United's best young player?",
          players_list: [{ last_name: 'Sesko', title: 'B. Sesko' }, { last_name: 'Zirkzee', title: 'J. Zirkzee' }],
          key_thoughts_player: { image_1: { player_image: 'https://e.com/p.png', rank: '1st' } },
        },
      },
      source: 'At a Glance', source_img: 'https://e.com/t.png',
      feed_layout_type: 'glance_post_1',
    },
    { ...article(1132620, 'Scholes on Mainoo', 'Signing'), feed_layout_type: 'simple_news' },
    { data: { id: 232, title: 'Wait for Ronaldo', link: '/public/videos/clip.mp4', creation_date: '5hr ago', source: 'FootyBants', source_img: 'https://e.com/u.jpg', interaction_counts: { like_count: 5, comment_count: 11 } }, feed_layout_type: 'funny_video' },
    { post_type: 'last_match_player_rating', data: { interaction_counts: { like_count: 0, comment_count: 0 } }, feed_layout_type: 'club_post' },
    { post_type: 'club_highest_goals_player', data: { player_info: { id: 604, name: 'Hughes', image: 'https://e.com/h.png', age: '30yrs', height: '6ft', position: 'Midfielder' }, player_stats: { summary: { Apps: { value: 31, position: { club_position: 9, league_position: 151 } }, Goals: { value: 0, position: { club_position: 26, league_position: 531 } } }, defensive: { Tackles: { value: 27, position: { club_position: 10, league_position: 182 } } }, offensive: { 'Total Shots': { value: '17', position: { club_position: 15, league_position: 308 } } }, passing: { Passes: { value: 678, position: { club_position: 11, league_position: 197 } } } }, logos: { club: 'https://e.com/c.png', league: 'https://e.com/l.png' }, source: 'Crystal Palace', source_img: 'https://e.com/cp.png', creation_date: '25h ago', interaction_counts: { like_count: 0, comment_count: 0 } }, feed_layout_type: 'club_post' },
    { post_type: 'club_player_comparison', data: { club_player: [ { id: 610, name: 'Mateta', image: 'https://e.com/m.png' }, { id: 716, name: 'Johnson', image: 'https://e.com/j.png' } ], seasons_list: [ { id: 6349, title: '2026/2027' } ], source: 'Player Comparison', source_img: 'https://e.com/pc.png', interaction_counts: { like_count: 0, comment_count: 0 } }, feed_layout_type: 'club_post' },
    {
      post_1: { type: 'top_scorer_assists_story', data: [
        { name: 'Casimiro', image: 'https://e.com/c.png', stats: { stats_name: 'assists', value: 12, apps: 34, season: '2026/2027' } },
        { name: 'Shaw', image: 'https://e.com/s.png', stats: { stats_name: 'assists', value: 9, apps: 38, season: '2026/2027' } },
      ] },
      post_2: { type: 'glance_news', data: [article(1132618, 'Formal bid imminent for Man Utd target', 'Transfer')] },
      post_3: { type: 'streamhd', data: [] },
      post_4: { type: 'freebet' },
      feed_layout_type: 'glance_post_2',
    },
    { data: { id: 1132357, title: 'Season review', image: 'https://e.com/y.jpg', link: 'https://www.youtube.com/watch?v=pX3HIEvCNkM', source_type: 'youtube_news', source: 'Man Utd', source_img: 'https://e.com/yt.png', creation_date: '2026-06-30 09:30:26' }, feed_layout_type: 'youtube_news' },
  ],
  global_variable: { club_title: 'Man Utd', club_logo: 'https://e.com/t.png', league_title: 'Premier League' },
  offsets: { simple_news: 4 },
};

const r = normalizeFeed(liveFeed, { page: 0 });
console.log('top-level items:', r.items.length, 'rawCount:', r.rawCount);
console.log('kinds:', r.items.map((i) => i.kind).join(', '));

let tileCounts = {};
let newsTitles = [];
for (const it of r.items) {
  if (it.kind === 'glance') {
    for (const t of it.tiles) {
      tileCounts[t.tileType] = (tileCounts[t.tileType] || 0) + 1;
      if (t.tileType === 'news') newsTitles.push(t.article.title);
    }
  }
}
console.log('glance tile types:', JSON.stringify(tileCounts));
console.log('glance news titles (should NOT be "Untitled"):', JSON.stringify(newsTitles));

const topScorerTiles = r.items.flatMap((i) => (i.tiles || [])).filter((t) => t.tileType === 'topScorers');
console.log('topScorers recovered (incl. assists variant):', topScorerTiles.length, topScorerTiles.map((t) => t.statType));

const ratingsTiles = r.items.flatMap((i) => i.tiles || []).filter((t) => t.tileType === 'playerRatings');
console.log('playerRatings matchStats present (drives Match Stats card):', ratingsTiles.map((t) => !!t.matchStats));

const cmp = r.items.filter((i) => i.kind === 'playerComparison');
console.log('playerComparison items:', cmp.length, cmp.map((c) => `${c.players.length} players / ${c.seasons.length} seasons`));

const pstats = r.items.filter((i) => i.kind === 'playerStats');
console.log('playerStats items:', pstats.length, pstats.map((c) => `${c.player.name} / ${c.tabs.length} tabs / ${c.tabs[0].rows.length} summary rows`));

const distinctCardTypes = new Set();
for (const it of r.items) {
  if (it.kind !== 'glance') distinctCardTypes.add(it.kind);
  else for (const t of it.tiles) distinctCardTypes.add('glance:' + t.tileType);
}
console.log('\nDISTINCT card types rendered:', distinctCardTypes.size);
console.log([...distinctCardTypes].join('\n'));
