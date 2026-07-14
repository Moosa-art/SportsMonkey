/**
 * server/routes/stories.js
 * All stories mapped from posts.js data — Facebook-style stories API
 * Updated: added all club_page data stories with proper types
 */
import { Router } from 'express';
const router = Router();

const STORIES = [
  // ── Existing stories ──────────────────────────────────────────
  {
    id: 'transfer-target',
    username: 'Interactive',
    subtitle: 'Arsenal FC',
    avatarInitial: 'I',
    avatarColor: '#0A1F44',
    time: '2h ago',
    bg: 'linear-gradient(160deg,#0A1F44,#1a3a6e)',
    previewBg: '#0A1F44',
    type: 'transfer_target',
    data: {
      title: 'Suggest Transfer Target',
      players: [
        { name: 'Wright', club: 'Coventry City', position: 'Forward', img: 'https://i.pravatar.cc/40?img=11' },
        { name: 'Conway', club: 'Middlesbrough', position: 'Forward', img: 'https://i.pravatar.cc/40?img=33' },
        { name: 'Twine', club: 'Bristol City', position: 'Midfielder', img: 'https://i.pravatar.cc/40?img=51' },
        { name: 'Mateta', club: 'Crystal Palace', position: 'Forward', img: 'https://i.pravatar.cc/40?img=14' },
        { name: 'Thomas-A...', club: 'Coventry City', position: 'Forward', img: 'https://i.pravatar.cc/40?img=68' },
      ]
    }
  },
  {
    id: 'at-a-glance',
    username: 'At A Glance',
    subtitle: 'Premier League • 3h',
    avatarInitial: 'A',
    avatarColor: '#EF0107',
    time: '3h ago',
    bg: 'linear-gradient(160deg,#EF0107,#8B0000)',
    previewBg: '#EF0107',
    type: 'at_a_glance',
    data: {
      table: [
        { name: 'ARSENAL', played: 38, pts: 86, highlight: true },
        { name: 'MAN CITY', played: 38, pts: 78 },
        { name: 'MAN UTD', played: 38, pts: 71 },
        { name: 'VILLA', played: 38, pts: 60 },
      ],
      image: { url: 'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=400', caption: "Emily Thornberry isn't a real Gooner", time: '3h' }
    }
  },
  {
    id: 'match-score',
    username: 'Premier League',
    subtitle: 'Live Match',
    avatarInitial: 'PL',
    avatarColor: '#38003c',
    verified: true,
    time: '20m ago',
    bg: 'linear-gradient(160deg,#38003c,#0d0010)',
    previewBg: '#38003c',
    type: 'match_score',
    live: true,
    data: {
      live: true,
      status: "67' Second Half",
      home: { name: 'Arsenal', short: 'ARS', color: '#EF0107', score: 2 },
      away: { name: 'Liverpool', short: 'LIV', color: '#C8102E', score: 1 },
      scorers: [
        { player: 'B. Saka', minute: 23, team: 'ARS' },
        { player: 'M. Salah', minute: 41, team: 'LIV' },
        { player: 'M. Ødegaard', minute: 58, team: 'ARS' },
      ]
    }
  },
  {
    id: 'transfer-rumour',
    username: 'Fabrizio Romano',
    subtitle: '@FabrizioRomano',
    avatarUrl: 'https://i.pravatar.cc/40?img=60',
    verified: true,
    time: '1h ago',
    bg: 'linear-gradient(160deg,#111,#2d2d2d)',
    previewBg: '#111',
    type: 'transfer_rumour',
    caption: 'Here we go! 🚨🔴',
    data: {
      status: 'CONFIRMED',
      headline: 'Viktor Gyökeres to Arsenal',
      player: 'Viktor Gyökeres',
      position: 'Striker • 26',
      from: { short: 'SCP', color: '#006633' },
      to: { short: 'ARS', color: '#EF0107' },
      fee: '£75M',
      source: 'Fabrizio Romano',
      reliability: '★★★★★ 5/5'
    }
  },
  {
    id: 'arsenal-tweet',
    username: 'Arsenal',
    subtitle: 'Official',
    avatarInitial: 'A',
    avatarColor: '#EF0107',
    verified: true,
    time: '4h ago',
    bg: 'linear-gradient(160deg,#EF0107,#3a0000)',
    previewBg: '#EF0107',
    type: 'tweet',
    data: {
      avatar: 'https://i.pravatar.cc/40?img=33',
      name: 'Arsenal',
      handle: '@Arsenal',
      time: '4h',
      text: '🔴⚪ MATCHDAY! 🔴⚪\n\nOne more win and the Premier League trophy is ours.\n\nCOME ON YOU GUNNERS! 💪',
      replies: '1.2K',
      retweets: '8.4K',
      likes: '45K'
    }
  },
  {
    id: 'saka-image',
    username: 'Bukayo Saka',
    subtitle: 'Arsenal • 5h',
    avatarUrl: 'https://i.pravatar.cc/40?img=53',
    verified: true,
    time: '5h ago',
    bg: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop',
    previewBg: '#333',
    type: 'image',
    caption: 'What a night at the Emirates! 🔴⚪ Thanks to all the fans for the incredible support 💪',
    data: { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop' }
  },
  {
    id: 'stat-comparison',
    username: 'Match Stats',
    subtitle: 'Full Time',
    avatarInitial: 'MS',
    avatarColor: '#0A1F44',
    time: '6h ago',
    bg: 'linear-gradient(160deg,#0A1F44,#051030)',
    previewBg: '#0A1F44',
    type: 'stat_comparison',
    data: {
      title: 'Match Statistics',
      home: { name: 'Arsenal', short: 'ARS', color: '#EF0107' },
      away: { name: 'Chelsea', short: 'CHE', color: '#034694' },
      stats: [
        { label: 'Possession', home: 58, away: 42, unit: '%' },
        { label: 'Shots', home: 18, away: 9 },
        { label: 'Shots on Target', home: 7, away: 3 },
        { label: 'Corners', home: 8, away: 4 },
        { label: 'Fouls', home: 11, away: 14 },
        { label: 'xG', home: 2.4, away: 0.9 },
      ]
    }
  },
  {
    id: 'top-scorers',
    username: 'Premier League',
    subtitle: 'Top Scorers • Updated',
    avatarInitial: 'PL',
    avatarColor: '#38003c',
    verified: true,
    time: '8h ago',
    bg: 'linear-gradient(160deg,#38003c,#1a0020)',
    previewBg: '#38003c',
    type: 'top_scorers',
    data: {
      title: 'Premier League Golden Boot',
      scorers: [
        { name: 'Erling Haaland', club: 'Manchester City', goals: 27, img: 'https://i.pravatar.cc/40?img=12' },
        { name: 'Mohamed Salah', club: 'Liverpool', goals: 24, img: 'https://i.pravatar.cc/40?img=33' },
        { name: 'Bukayo Saka', club: 'Arsenal', goals: 19, img: 'https://i.pravatar.cc/40?img=53' },
        { name: 'Cole Palmer', club: 'Chelsea', goals: 18, img: 'https://i.pravatar.cc/40?img=15' },
        { name: 'Alexander Isak', club: 'Newcastle', goals: 17, img: 'https://i.pravatar.cc/40?img=68' },
      ]
    }
  },
  {
    id: 'highlights',
    username: 'Sky Sports',
    subtitle: 'Match Highlights',
    avatarInitial: 'SS',
    avatarColor: '#000',
    verified: true,
    time: '12h ago',
    bg: 'linear-gradient(160deg,#000,#1a1a1a)',
    previewBg: '#000',
    type: 'highlights',
    caption: 'All the best moments from a thrilling encounter at the Emirates 🎬',
    data: {
      thumbnail: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600',
      duration: '8:45',
      title: 'Arsenal 2-1 Liverpool | Premier League Highlights',
      views: '1.2M',
      timeAgo: '12h ago'
    }
  },
  {
    id: 'poll',
    username: 'The Athletic',
    subtitle: 'Football Poll',
    avatarInitial: 'TA',
    avatarColor: '#FF1A1A',
    verified: true,
    time: '14h ago',
    bg: 'linear-gradient(160deg,#FF1A1A,#8a0000)',
    previewBg: '#FF1A1A',
    type: 'poll',
    data: {
      question: 'Who will win the Premier League title?',
      options: [
        { text: '🔴 Arsenal', votes: 8420, color: '#EF0107' },
        { text: '💙 Manchester City', votes: 6210, color: '#6CABDD' },
        { text: '🔴 Liverpool', votes: 4890, color: '#C8102E' },
        { text: '🔵 Chelsea', votes: 1230, color: '#034694' },
      ],
      timeLeft: '2 days left'
    }
  },
  {
    id: 'formation',
    username: 'Mikel Arteta',
    subtitle: 'Arsenal FC',
    avatarUrl: 'https://i.pravatar.cc/40?img=68',
    verified: true,
    time: '16h ago',
    bg: 'linear-gradient(160deg,#1a5c2a,#0a2e12)',
    previewBg: '#1a5c2a',
    type: 'formation',
    caption: "Tonight's starting XI 🔴⚪ COYG!",
    data: {
      formation: '4-3-3',
      color: '#EF0107',
      players: [
        { number: 1,  name: 'Raya',      top: '90%', left: '50%' },
        { number: 4,  name: 'White',     top: '70%', left: '20%' },
        { number: 6,  name: 'Gabriel',   top: '70%', left: '40%' },
        { number: 2,  name: 'Saliba',    top: '70%', left: '60%' },
        { number: 35, name: 'Zinchenko', top: '70%', left: '80%' },
        { number: 5,  name: 'Partey',    top: '45%', left: '30%' },
        { number: 8,  name: 'Ødegaard', top: '45%', left: '50%' },
        { number: 41, name: 'Rice',      top: '45%', left: '70%' },
        { number: 7,  name: 'Saka',      top: '20%', left: '25%' },
        { number: 9,  name: 'Havertz',   top: '15%', left: '50%' },
        { number: 11, name: 'Martinelli',top: '20%', left: '75%' },
      ]
    }
  },
  {
    id: 'player-ratings',
    username: 'WhoScored',
    subtitle: 'Match Ratings',
    avatarInitial: 'WS',
    avatarColor: '#FFA500',
    verified: true,
    time: '18h ago',
    bg: 'linear-gradient(160deg,#FFA500,#7a4f00)',
    previewBg: '#FFA500',
    type: 'player_ratings',
    data: {
      color: '#EF0107',
      avgRating: '7.8',
      motm: 'B. Saka',
      players: [
        { rating: 9.1, name: 'Saka' },
        { rating: 8.4, name: 'Saliba' },
        { rating: 8.2, name: 'Ødegaard' },
        { rating: 8.1, name: 'Gabriel' },
        { rating: 7.9, name: 'Rice' },
        { rating: 7.8, name: 'Partey' },
        { rating: 7.7, name: 'Martinelli' },
        { rating: 7.6, name: 'Zinch.' },
        { rating: 7.5, name: 'White' },
        { rating: 7.4, name: 'Hav.' },
        { rating: 7.2, name: 'Raya' },
      ]
    }
  },
  {
    id: 'fantasy-tips',
    username: 'FPL Tips',
    subtitle: 'Fantasy Premier League',
    avatarInitial: 'FPL',
    avatarColor: '#38003c',
    verified: true,
    time: '20h ago',
    bg: 'linear-gradient(160deg,#38003c,#00cc6a)',
    previewBg: '#38003c',
    type: 'fantasy_tips',
    data: {
      gameweek: 35,
      captain: 'Salah',
      players: [
        { name: 'Mohamed Salah', club: 'Liverpool', pos: 'MID', price: 13.2, img: 'https://i.pravatar.cc/40?img=33' },
        { name: 'Erling Haaland', club: 'Man City', pos: 'FWD', price: 15.1, img: 'https://i.pravatar.cc/40?img=12' },
        { name: 'Bukayo Saka', club: 'Arsenal', pos: 'MID', price: 10.4, img: 'https://i.pravatar.cc/40?img=53' },
        { name: 'Cole Palmer', club: 'Chelsea', pos: 'MID', price: 11.0, img: 'https://i.pravatar.cc/40?img=15' },
      ]
    }
  },
  {
    id: 'meme',
    username: 'FootyHumour',
    subtitle: 'Meme Lord',
    avatarInitial: 'FH',
    avatarColor: '#FBBF24',
    time: '22h ago',
    bg: 'https://images.unsplash.com/photo-1602674809970-3eb52ddc06ec?w=600&h=900&fit=crop',
    previewBg: '#FBBF24',
    type: 'meme',
    caption: 'Tottenham fans right now 😂😂😂 #COYS',
    data: {
      image: 'https://images.unsplash.com/photo-1602674809970-3eb52ddc06ec?w=600&h=900&fit=crop',
      topText: 'When Spurs',
      bottomText: 'Spurs Again'
    }
  },
  {
    id: 'injury-report',
    username: 'Arsenal Medical',
    subtitle: 'Team News',
    avatarInitial: 'AM',
    avatarColor: '#EF0107',
    verified: true,
    time: '1d ago',
    bg: 'linear-gradient(160deg,#7a0000,#3d0000)',
    previewBg: '#7a0000',
    type: 'injury_report',
    data: {
      club: 'Arsenal',
      players: [
        { name: 'Gabriel Jesus', injury: 'Knee injury', status: '4 weeks', img: 'https://i.pravatar.cc/40?img=12' },
        { name: 'Takehiro Tomiyasu', injury: 'Calf strain', status: '2 weeks', img: 'https://i.pravatar.cc/40?img=14' },
        { name: 'Riccardo Calafiori', injury: 'Knock', status: 'Doubt', img: 'https://i.pravatar.cc/40?img=18' },
      ]
    }
  },
  {
    id: 'betting-tips',
    username: 'Betting Insights',
    subtitle: 'Sponsored • William Hill',
    avatarInitial: 'BI',
    avatarColor: '#FFE600',
    time: '1d ago',
    bg: 'linear-gradient(160deg,#1a1500,#2d2600)',
    previewBg: '#2d2600',
    type: 'betting_tips',
    data: {
      title: 'Weekend Acca',
      totalOdds: '@8.50',
      tips: [
        { match: 'Arsenal vs Crystal Palace', tip: 'Arsenal Win & Over 2.5', odds: '2.10' },
        { match: 'Man City vs West Ham', tip: 'Man City -1.5 AH', odds: '1.85' },
        { match: 'Liverpool vs Brighton', tip: 'BTTS Yes', odds: '1.75' },
      ]
    }
  },
  {
    id: 'fixture-card',
    username: 'Fixtures',
    subtitle: 'Premier League',
    avatarInitial: 'PL',
    avatarColor: '#38003c',
    time: '1d ago',
    bg: 'linear-gradient(160deg,#38003c,#00ff85)',
    previewBg: '#2a0030',
    type: 'fixture_card',
    data: {
      title: 'Gameweek 36 Fixtures',
      fixtures: [
        { time: '12:30', date: 'Sat', home: { name: 'Arsenal', short: 'ARS', color: '#EF0107' }, away: { name: 'Bournemouth', short: 'BOU', color: '#DA291C' } },
        { time: '15:00', date: 'Sat', home: { name: 'Chelsea', short: 'CHE', color: '#034694' }, away: { name: 'Wolves', short: 'WOL', color: '#FDB913' } },
        { time: '17:30', date: 'Sat', home: { name: 'Liverpool', short: 'LIV', color: '#C8102E' }, away: { name: 'Tottenham', short: 'TOT', color: '#132257' } },
        { time: '14:00', date: 'Sun', home: { name: 'Man Utd', short: 'MUN', color: '#DA291C' }, away: { name: 'Newcastle', short: 'NEW', color: '#241F20' } },
      ]
    }
  },
  {
    id: 'quiz',
    username: 'Football Quiz',
    subtitle: 'Daily Challenge',
    avatarInitial: 'FQ',
    avatarColor: '#7C3AED',
    time: '1d ago',
    bg: 'linear-gradient(160deg,#7C3AED,#3b1f7a)',
    previewBg: '#7C3AED',
    type: 'quiz',
    data: {
      question: "Which player has won the most Ballon d'Or awards?",
      options: ['Cristiano Ronaldo', 'Lionel Messi', 'Pelé', 'Diego Maradona'],
      correct: 1
    }
  },
  {
    id: 'podcast',
    username: 'The Football Pod',
    subtitle: 'Weekly Episode',
    avatarInitial: 'TFP',
    avatarColor: '#FF6B35',
    time: '2d ago',
    bg: 'linear-gradient(160deg,#FF6B35,#7a2a00)',
    previewBg: '#FF6B35',
    type: 'podcast',
    data: {
      episode: 142,
      title: 'Title Race Heating Up: Can Arsenal Hold On?',
      duration: '52 min',
      host: 'Gary & Jamie'
    }
  },
  {
    id: 'shop',
    username: 'Arsenal Store',
    subtitle: 'Official Merch',
    avatarInitial: 'AS',
    avatarColor: '#EF0107',
    verified: true,
    time: '2d ago',
    bg: 'linear-gradient(160deg,#EF0107,#FFD700)',
    previewBg: '#EF0107',
    type: 'shop',
    data: {
      title: 'New Season Kits',
      items: [
        { name: 'Home Jersey 24/25', price: 75, oldPrice: 90, emoji: '👕', bg: 'linear-gradient(135deg,#EF0107,#8B0000)' },
        { name: 'Away Jersey 24/25', price: 70, oldPrice: 85, emoji: '👕', bg: 'linear-gradient(135deg,#fff,#ccc)' },
        { name: 'Training Top',      price: 45, oldPrice: 60, emoji: '🥼', bg: 'linear-gradient(135deg,#0A1F44,#1B3370)' },
        { name: 'Scarf',             price: 20, oldPrice: 25, emoji: '🧣', bg: 'linear-gradient(135deg,#EF0107,#FFD700)' },
      ]
    }
  },
  {
    id: 'news-list',
    username: 'Football News',
    subtitle: 'Aggregator',
    avatarInitial: 'FN',
    avatarColor: '#0A1F44',
    time: '2d ago',
    bg: 'linear-gradient(160deg,#0A1F44,#000)',
    previewBg: '#0A1F44',
    type: 'news_list',
    data: {
      items: [
        { source: 'AT', tag: 'Available', text: 'Arsenal put three players up for sale including £27m attacker', color: '#FF1A1A' },
        { source: 'SK', tag: 'Ask Keown', text: "Richard Keys warns Mikel Arteta target that he shouldn't go anywhere near Arsenal", color: '#000' },
        { source: 'DM', tag: 'Latest', text: 'Arsenal trophy parade attendance figure officially confirmed', color: '#004db3' },
        { source: 'BBC', tag: 'Breaking', text: 'Arsenal favourite tipped for shock summer return to North London', color: '#bb1919' },
      ]
    }
  },
  {
    id: 'odegaard-image',
    username: 'Martin Ødegaard',
    subtitle: 'Arsenal Captain',
    avatarUrl: 'https://i.pravatar.cc/40?img=68',
    verified: true,
    time: '3d ago',
    bg: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=900&fit=crop',
    previewBg: '#333',
    type: 'image',
    caption: 'Captain leads from the front 🔴⚪ Up the Arsenal! ⚽',
    data: { url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=900&fit=crop' }
  },

  // ── NEW: club_page data stories ────────────────────────────────

  // Next Match (live_score_story)
  {
    id: 'next-match',
    username: 'Next Match',
    subtitle: 'Crystal Palace vs Arsenal',
    avatarInitial: 'NM',
    avatarColor: '#1B458F',
    time: 'May 24',
    bg: 'linear-gradient(160deg,#0d2240,#1B458F)',
    previewBg: '#1B458F',
    type: 'next_match',
    data: {
      homeClub: 'Crystal Palace',
      awayClub: 'Arsenal',
      homeLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png',
      awayLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png',
      homeColor: '#0046A8',
      awayColor: '#EF0107',
      homePosition: 15,
      awayPosition: 1,
      dateTime: '2026-05-24 15:00:00',
      league: 'Premier League',
      leagueLogo: 'https://cdn.sportmonks.com/images/soccer/leagues/8/8.png',
      homeTopScorers: [
        { name: 'J. Mateta', image: 'https://cdn.sportmonks.com/images/soccer/players/22/96950.png', goals: 12 },
        { name: 'I. Sarr', image: 'https://cdn.sportmonks.com/images/soccer/players/18/96722.png', goals: 9 },
        { name: 'D. Muñoz', image: 'https://cdn.sportmonks.com/images/soccer/players/13/524045.png', goals: 4 },
      ],
      awayTopScorers: [
        { name: 'V. Gyökeres', image: 'https://cdn.sportmonks.com/images/soccer/players/23/194167.png', goals: 14 },
        { name: 'B. Saka', image: 'https://cdn.sportmonks.com/images/soccer/players/19/16827155.png', goals: 7 },
        { name: 'L. Trossard', image: 'https://cdn.sportmonks.com/images/soccer/players/20/61780.png', goals: 6 },
      ],
    }
  },

  // Match Highlights Detail (highlights_detail_story)
  {
    id: 'match-highlights-detail',
    username: 'Match Highlights',
    subtitle: 'Crystal Palace 1–2 Arsenal',
    avatarInitial: '🎬',
    avatarColor: '#001655',
    time: 'May 24',
    bg: 'linear-gradient(160deg,#001240,#002080)',
    previewBg: '#001240',
    type: 'highlights_detail',
    data: {
      homeTeam: 'Crystal Palace',
      awayTeam: 'Arsenal',
      homeLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png',
      awayLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png',
      homeGoal: 1,
      awayGoal: 2,
      dateTime: '2026-05-24 15:00:00',
      videoThumb: 'https://i.ytimg.com/vi/Qa8DDbyH9BE/hqdefault.jpg',
      videoLink: 'https://www.youtube.com/watch?v=Qa8DDbyH9BE',
      goals: [
        { playerName: 'G. Jesus', assist: 'G. Martinelli', minute: 42, side: 'away' },
        { playerName: 'N. Madueke', assist: 'K. Havertz', minute: 48, side: 'away' },
        { playerName: 'J. Mateta', assist: 'Y. Pino', minute: 89, side: 'home' },
      ],
    }
  },

  // Match Prediction (prediction_story)
  {
    id: 'match-prediction',
    username: 'Prediction',
    subtitle: 'Crystal Palace vs Arsenal',
    avatarInitial: '📊',
    avatarColor: '#2563EB',
    time: 'Pre-match',
    bg: 'linear-gradient(160deg,#0f1f4a,#1e3a8a)',
    previewBg: '#0f1f4a',
    type: 'match_prediction',
    data: {
      homeClub: 'Crystal Palace',
      awayClub: 'Arsenal',
      homeLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png',
      awayLogo: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png',
      homeProbability: 15,
      awayProbability: 85,
      homeWins: 11,
      awayWins: 26,
      homeGoals: 41,
      awayGoals: 71,
      homeConceded: 51,
      awayConceded: 27,
      homePasses: 69,
      awayPasses: 81,
    }
  },

  // Player Spotlight (rand_player_story)
  {
    id: 'player-spotlight',
    username: 'Player Spotlight',
    subtitle: 'Piero Hincapié',
    avatarInitial: 'PS',
    avatarColor: '#EF0107',
    time: 'Season stats',
    bg: 'linear-gradient(160deg,#1a0a0a,#3a0000)',
    previewBg: '#3a0000',
    type: 'player_spotlight',
    data: {
      name: 'Piero Hincapié',
      number: '5',
      image: 'https://cdn.sportmonks.com/images/soccer/players/24/37261496.png',
      country: 'Ecuador',
      countryFlag: 'https://apiv3.apifootball.com/badges/logo_country/41_ecuador.png',
      height: '6ft',
      age: '23yrs',
      position: 'Defender',
      appearances: 25,
      goals: 1,
      assists: 2,
      minutes: 1792,
      tackles: 48,
      passAccuracy: 89,
    }
  },

  // League Table from API (league_table_story)
  {
    id: 'league-table-api',
    username: 'League Table',
    subtitle: 'Premier League 2025/26',
    avatarInitial: 'PL',
    avatarColor: '#38003c',
    verified: true,
    time: 'Full season',
    bg: 'linear-gradient(160deg,#38003c,#00ff85)',
    previewBg: '#38003c',
    type: 'league_table_full',
    data: {
      season: '2025/2026',
      highlightTeam: 'Arsenal',
      clubPosition: 1,
      standings: [
        { team: 'Arsenal',   logo: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png',   played: 38, won: 26, draw: 7, lost: 5,  gd: 44, pts: 85 },
        { team: 'Man City',  logo: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',     played: 38, won: 23, draw: 9, lost: 6,  gd: 42, pts: 78 },
        { team: 'Man Utd',   logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',   played: 38, won: 20, draw: 11,lost: 7,  gd: 19, pts: 71 },
        { team: 'Villa',     logo: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png',   played: 38, won: 19, draw: 8, lost: 11, gd: 7,  pts: 65 },
        { team: 'Liverpool', logo: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',     played: 38, won: 17, draw: 9, lost: 12, gd: 10, pts: 60 },
        { team: 'Bournemouth',logo:'https://cdn.sportmonks.com/images/soccer/teams/20/52.png',   played: 38, won: 13, draw: 18,lost: 7,  gd: 4,  pts: 57 },
        { team: 'Sunderland',logo: 'https://cdn.sportmonks.com/images/soccer/teams/3/3.png',     played: 38, won: 14, draw: 12,lost: 12, gd: -6, pts: 54 },
        { team: 'Brentford', logo: 'https://cdn.sportmonks.com/images/soccer/teams/12/236.png',  played: 38, won: 14, draw: 11,lost: 13, gd: 3,  pts: 53 },
        { team: 'Chelsea',   logo: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png',   played: 38, won: 14, draw: 10,lost: 14, gd: 6,  pts: 52 },
        { team: 'Fulham',    logo: 'https://cdn.sportmonks.com/images/soccer/teams/11/11.png',   played: 38, won: 15, draw: 7, lost: 16, gd: -4, pts: 52 },
      ]
    }
  },

  // Top Scorers – Goals (top_scorer_goals_story)
  {
    id: 'top-goals',
    username: 'Golden Boot',
    subtitle: 'Premier League Goals',
    avatarInitial: '⚽',
    avatarColor: '#EF0107',
    time: 'Season',
    bg: 'linear-gradient(160deg,#1a0020,#38003c)',
    previewBg: '#38003c',
    type: 'stat_leaderboard',
    data: {
      title: 'Top Scorers',
      statLabel: 'Goals',
      color: '#EF0107',
      accentColor: '#FFD700',
      players: [
        { name: 'Erling Haaland',    club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',    value: 27, image: 'https://cdn.sportmonks.com/images/soccer/players/21/154421.png' },
        { name: 'Igor Thiago',       club: 'https://cdn.sportmonks.com/images/soccer/teams/12/236.png', value: 22, image: 'https://cdn.sportmonks.com/images/soccer/players/4/37407204.png' },
        { name: 'Ollie Watkins',     club: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png',  value: 16, image: 'https://cdn.sportmonks.com/images/soccer/players/17/12145.png' },
        { name: 'João Pedro',        club: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png',  value: 15, image: 'https://cdn.sportmonks.com/images/soccer/players/22/28931574.png' },
        { name: 'M. Gibbs-White',    club: 'https://cdn.sportmonks.com/images/soccer/teams/31/63.png',  value: 15, image: 'https://cdn.sportmonks.com/images/soccer/players/22/7926.png' },
        { name: 'D. Calvert-Lewin',  club: 'https://cdn.sportmonks.com/images/soccer/teams/7/71.png',  value: 14, image: 'https://cdn.sportmonks.com/images/soccer/players/21/5141.png' },
      ]
    }
  },

  // Top Scorers – Assists
  {
    id: 'top-assists',
    username: 'Assist King',
    subtitle: 'Premier League Assists',
    avatarInitial: '🅰️',
    avatarColor: '#2563EB',
    time: 'Season',
    bg: 'linear-gradient(160deg,#0f1f4a,#1e3a8a)',
    previewBg: '#1e3a8a',
    type: 'stat_leaderboard',
    data: {
      title: 'Top Assists',
      statLabel: 'Assists',
      color: '#2563EB',
      accentColor: '#06b6d4',
      players: [
        { name: 'Bruno Fernandes',   club: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png', value: 21, image: 'https://cdn.sportmonks.com/images/soccer/players/2/129602.png' },
        { name: 'Rayan Cherki',      club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 12, image: 'https://cdn.sportmonks.com/images/soccer/players/5/21072805.png' },
        { name: 'Jarrod Bowen',      club: 'https://cdn.sportmonks.com/images/soccer/teams/1/1.png',  value: 11, image: 'https://cdn.sportmonks.com/images/soccer/players/24/1592.png' },
        { name: 'Erling Haaland',    club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 8,  image: 'https://cdn.sportmonks.com/images/soccer/players/21/154421.png' },
        { name: 'Mohamed Salah',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 7,  image: 'https://cdn.sportmonks.com/images/soccer/players/29/4125.png' },
        { name: 'D. Szoboszlai',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 7,  image: 'https://cdn.sportmonks.com/images/soccer/players/14/785998.png' },
      ]
    }
  },

  // Top Scorers – Tackles
  {
    id: 'top-tackles',
    username: 'Tackle Leader',
    subtitle: 'Premier League Tackles',
    avatarInitial: '🛡️',
    avatarColor: '#059669',
    time: 'Season',
    bg: 'linear-gradient(160deg,#064e3b,#065f46)',
    previewBg: '#064e3b',
    type: 'stat_leaderboard',
    data: {
      title: 'Top Tacklers',
      statLabel: 'Tackles',
      color: '#10b981',
      accentColor: '#34d399',
      players: [
        { name: 'James Garner',      club: 'https://cdn.sportmonks.com/images/soccer/teams/13/13.png', value: 121, image: 'https://cdn.sportmonks.com/images/soccer/players/12/4536524.png' },
        { name: 'João Palhinha',     club: 'https://cdn.sportmonks.com/images/soccer/teams/6/6.png',   value: 111, image: 'https://cdn.sportmonks.com/images/soccer/players/8/160072.png' },
        { name: 'João Gomes',        club: 'https://cdn.sportmonks.com/images/soccer/teams/29/29.png', value: 108, image: 'https://cdn.sportmonks.com/images/soccer/players/12/37402348.png' },
        { name: 'Elliot Anderson',   club: 'https://cdn.sportmonks.com/images/soccer/teams/31/63.png', value: 104, image: 'https://cdn.sportmonks.com/images/soccer/players/15/332047.png' },
        { name: 'Adrien Truffert',   club: 'https://cdn.sportmonks.com/images/soccer/teams/20/52.png', value: 104, image: 'https://cdn.sportmonks.com/images/soccer/players/1/28543553.png' },
        { name: 'Mateus Fernandes',  club: 'https://cdn.sportmonks.com/images/soccer/teams/1/1.png',   value: 103, image: 'https://cdn.sportmonks.com/images/soccer/players/1/37593153.png' },
      ]
    }
  },

  // Top Scorers – Technique
  {
    id: 'top-technique',
    username: 'Technique',
    subtitle: 'Premier League Technique',
    avatarInitial: '🎯',
    avatarColor: '#7C3AED',
    time: 'Season',
    bg: 'linear-gradient(160deg,#2e1065,#4c1d95)',
    previewBg: '#2e1065',
    type: 'stat_leaderboard',
    data: {
      title: 'Best Technique',
      statLabel: 'Rating',
      color: '#7C3AED',
      accentColor: '#a78bfa',
      players: [
        { name: 'Florian Wirtz',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 92, image: 'https://cdn.sportmonks.com/images/soccer/players/30/37429246.png' },
        { name: 'Bernardo Silva',    club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 92, image: 'https://cdn.sportmonks.com/images/soccer/players/1/96353.png' },
        { name: 'Phil Foden',        club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 91, image: 'https://cdn.sportmonks.com/images/soccer/players/5/336133.png' },
        { name: 'Mohamed Salah',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 90, image: 'https://cdn.sportmonks.com/images/soccer/players/29/4125.png' },
        { name: 'Rodri',             club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 90, image: 'https://cdn.sportmonks.com/images/soccer/players/30/186910.png' },
        { name: 'Cole Palmer',       club: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png',value: 89, image: 'https://cdn.sportmonks.com/images/soccer/players/11/28912747.png' },
      ]
    }
  },

  // Top Scorers – Creativity
  {
    id: 'top-creativity',
    username: 'Creativity',
    subtitle: 'Premier League Creativity',
    avatarInitial: '✨',
    avatarColor: '#F59E0B',
    time: 'Season',
    bg: 'linear-gradient(160deg,#451a03,#78350f)',
    previewBg: '#451a03',
    type: 'stat_leaderboard',
    data: {
      title: 'Most Creative',
      statLabel: 'Rating',
      color: '#F59E0B',
      accentColor: '#fbbf24',
      players: [
        { name: 'Bruno Fernandes',   club: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',value: 94, image: 'https://cdn.sportmonks.com/images/soccer/players/2/129602.png' },
        { name: 'Florian Wirtz',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 91, image: 'https://cdn.sportmonks.com/images/soccer/players/30/37429246.png' },
        { name: 'Martin Ødegaard',   club: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png',value: 90, image: 'https://cdn.sportmonks.com/images/soccer/players/7/26823.png' },
        { name: 'Mohamed Salah',     club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 89, image: 'https://cdn.sportmonks.com/images/soccer/players/29/4125.png' },
        { name: 'Cole Palmer',       club: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png',value: 89, image: 'https://cdn.sportmonks.com/images/soccer/players/11/28912747.png' },
        { name: 'Youri Tielemans',   club: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png',value: 87, image: 'https://cdn.sportmonks.com/images/soccer/players/6/62342.png' },
      ]
    }
  },

  // Top Scorers – Fastest
  {
    id: 'top-pace',
    username: 'Pace Rating',
    subtitle: 'Premier League Fastest',
    avatarInitial: '⚡',
    avatarColor: '#EF4444',
    time: 'Season',
    bg: 'linear-gradient(160deg,#450a0a,#7f1d1d)',
    previewBg: '#450a0a',
    type: 'stat_leaderboard',
    data: {
      title: 'Fastest Players',
      statLabel: 'Pace',
      color: '#EF4444',
      accentColor: '#f97316',
      players: [
        { name: 'Jeremie Frimpong',  club: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png',  value: 94, image: 'https://cdn.sportmonks.com/images/soccer/players/14/8403182.png' },
        { name: 'Yankuba Minteh',    club: 'https://cdn.sportmonks.com/images/soccer/teams/14/78.png',value: 94, image: 'https://cdn.sportmonks.com/images/soccer/players/26/37655226.png' },
        { name: 'Daniel James',      club: 'https://cdn.sportmonks.com/images/soccer/teams/7/71.png', value: 94, image: 'https://cdn.sportmonks.com/images/soccer/players/29/5149.png' },
        { name: 'Milan Aleksic',     club: 'https://cdn.sportmonks.com/images/soccer/teams/3/3.png',  value: 92, image: 'https://cdn.sportmonks.com/images/soccer/players/1/37705825.png' },
        { name: 'Kevin Schade',      club: 'https://cdn.sportmonks.com/images/soccer/teams/12/236.png',value:92, image: 'https://cdn.sportmonks.com/images/soccer/players/22/27067062.png' },
        { name: 'Jérémy Doku',       club: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png',  value: 92, image: 'https://cdn.sportmonks.com/images/soccer/players/6/23697990.png' },
      ]
    }
  },

  // Funny Video Reel
  {
    id: 'funny-videos',
    username: 'FootyBants',
    subtitle: 'Funny Moments 😂',
    avatarInitial: 'FB',
    avatarColor: '#FBBF24',
    time: '5h ago',
    bg: 'linear-gradient(160deg,#1c0a00,#3d1a00)',
    previewBg: '#3d1a00',
    type: 'video_reel',
    data: {
      title: 'Funny Football Moments',
      videos: [
        { title: 'Women referee got Swag', link: '/public/videos/660553c8130723982485321711625160.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50473_1711606904.jpeg?v=33' },
        { title: 'Strange way to save Penalty', link: '/public/videos/660554e9d1d1f6606917841711625449.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50473_1711606904.jpeg?v=34' },
        { title: 'Lewandowski reaction 😂', link: '/public/videos/6628a3867134a5020245271713939334.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50508_1713934521.jpeg?v=43' },
        { title: "Who's the best penalty taker?", link: '/public/videos/6628a4ce0eb810963458321713939662.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50508_1713934521.jpeg?v=44' },
        { title: 'The Iranian Messi 🇮🇷', link: '/public/videos/6687cbfe7e2398296080471720175614.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50550_1719820445.jpeg?v=97' },
        { title: 'Player kisses ref', link: '/public/videos/RandomAsEver_7592197591845063958.mp4', sourceImg: 'https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=223' },
      ]
    }
  },
];

router.get('/', (_req, res) => res.json({ stories: STORIES }));
router.get('/:id', (req, res) => {
  const story = STORIES.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  return res.json({ story });
});

export default router;
