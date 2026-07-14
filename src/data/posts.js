// 20+ demo posts with varied content types
export const posts = [
  // 1. Interactive — Transfer Target (matches reference image)
  {
    type: 'transfer_target',
    username: 'Arneo Paris',
    subtitle: 'Arsenal FC',
    userInitial: 'AP',
    userColor: '#EF0107',
    verified: true,
    likes: 5,
    comments: 25,
    timestamp: '2 HOURS AGO',
    data: {
      title: 'Suggest Transfer Target',
      players: [
        { name: 'Panichelli', club: 'Strasbourg', position: 'Forward', nationality: 'France', img: 'https://i.pravatar.cc/40?img=11' },
        { name: 'Gouiri', club: 'Olympique Marseille', position: 'Forward', nationality: 'France', img: 'https://i.pravatar.cc/40?img=22' },
        { name: 'Panichelli', club: 'Strasbourg', position: 'Midfielder', nationality: 'France', img: 'https://i.pravatar.cc/40?img=33' },
        { name: 'Panichelli', club: 'Strasbourg', position: 'Midfielder', nationality: 'France', img: 'https://i.pravatar.cc/40?img=44' },
        { name: 'Wright', club: 'Coventry City', position: 'Forward', nationality: 'England', img: 'https://i.pravatar.cc/40?img=55' },
        { name: 'Conway', club: 'Middlesbrough', position: 'Forward', nationality: 'England', img: 'https://i.pravatar.cc/40?img=66' },
        { name: 'Mateta', club: 'Crystal Palace', position: 'Forward', nationality: 'France', img: 'https://i.pravatar.cc/40?img=14' },
      ]
    }
  },
  // 2. At A Glance — Grid (matches second reference image)
  {
    type: 'at_a_glance',
    username: 'At A Glance',
    subtitle: 'Premier League • 3h',
    userInitial: 'A',
    userColor: '#EF0107',
    likes: 142,
    comments: 88,
    timestamp: '3 HOURS AGO',
    data: {
      table: [
        { name: 'ARSENAL', played: 38, pts: 86, highlight: true },
        { name: 'MAN CITY', played: 38, pts: 78 },
        { name: 'MAN UTD', played: 38, pts: 71 },
        { name: 'VILLA', played: 38, pts: 60 },
      ],
      image: {
        url: 'https://images.unsplash.com/photo-1522778034537-20a2486be803?w=400',
        caption: "Emily Thornberry isn't a real Gooner",
        time: '3h'
      }
    }
  },
  // 3. Match Score - Live
  {
    type: 'match_score',
    username: 'Premier League',
    subtitle: 'Live Match',
    userInitial: 'PL',
    userColor: '#38003c',
    verified: true,
    likes: 2400,
    comments: 567,
    timestamp: '20 MINUTES AGO',
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
  // 4. Transfer Rumour
  {
    type: 'transfer_rumour',
    username: 'Fabrizio Romano',
    subtitle: '@FabrizioRomano • 1h',
    userImage: 'https://i.pravatar.cc/40?img=60',
    verified: true,
    likes: 18000,
    comments: 2400,
    timestamp: '1 HOUR AGO',
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
  // 5. Tweet style
  {
    type: 'tweet',
    username: 'Arsenal',
    subtitle: 'Official',
    userInitial: 'A',
    userColor: '#EF0107',
    verified: true,
    likes: 45000,
    comments: 1200,
    timestamp: '4 HOURS AGO',
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
  // 6. Image post
  {
    type: 'image',
    username: 'Bukayo Saka',
    subtitle: 'Arsenal • 5h',
    userImage: 'https://i.pravatar.cc/40?img=53',
    verified: true,
    likes: 234000,
    comments: 8900,
    timestamp: '5 HOURS AGO',
    caption: 'What a night at the Emirates! 🔴⚪ Thanks to all the fans for the incredible support 💪',
    data: {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop'
    }
  },
  // 7. Stat comparison
  {
    type: 'stat_comparison',
    username: 'Match Stats',
    subtitle: 'Full Time',
    userInitial: 'MS',
    userColor: '#0A1F44',
    likes: 320,
    comments: 45,
    timestamp: '6 HOURS AGO',
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
  // 8. Top Scorers
  {
    type: 'top_scorers',
    username: 'Premier League',
    subtitle: 'Top Scorers • Updated',
    userInitial: 'PL',
    userColor: '#38003c',
    verified: true,
    likes: 890,
    comments: 67,
    timestamp: '8 HOURS AGO',
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
  // 9. Highlights big
  {
    type: 'highlights',
    username: 'Sky Sports',
    subtitle: 'Match Highlights',
    userInitial: 'Sky',
    userColor: '#000',
    verified: true,
    likes: 12400,
    comments: 890,
    timestamp: '12 HOURS AGO',
    caption: 'All the best moments from a thrilling encounter at the Emirates 🎬',
    data: {
      thumbnail: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600',
      duration: '8:45',
      title: 'Arsenal 2-1 Liverpool | Premier League Highlights',
      views: '1.2M',
      timeAgo: '12h ago'
    }
  },
  // 10. Poll
  {
    type: 'poll',
    username: 'The Athletic',
    subtitle: 'Football Poll',
    userInitial: 'TA',
    userColor: '#FF1A1A',
    verified: true,
    likes: 567,
    comments: 234,
    timestamp: '14 HOURS AGO',
    data: {
      question: 'Who will win the Premier League title?',
      options: [
        { text: '🔴 Arsenal', votes: 8420 },
        { text: '💙 Manchester City', votes: 6210 },
        { text: '🔴 Liverpool', votes: 4890 },
        { text: '🔵 Chelsea', votes: 1230 },
      ],
      timeLeft: '2 days left'
    }
  },
  // 11. Formation full
  {
    type: 'formation',
    username: 'Mikel Arteta',
    subtitle: 'Arsenal FC',
    userImage: 'https://i.pravatar.cc/40?img=68',
    verified: true,
    likes: 3400,
    comments: 245,
    timestamp: '16 HOURS AGO',
    caption: 'Tonight\'s starting XI 🔴⚪ COYG!',
    data: {
      formation: '4-3-3',
      color: '#EF0107',
      players: [
        { number: 1, name: 'Raya', top: '90%', left: '50%' },
        { number: 4, name: 'White', top: '70%', left: '20%' },
        { number: 6, name: 'Gabriel', top: '70%', left: '40%' },
        { number: 2, name: 'Saliba', top: '70%', left: '60%' },
        { number: 35, name: 'Zinchenko', top: '70%', left: '80%' },
        { number: 5, name: 'Partey', top: '45%', left: '30%' },
        { number: 8, name: 'Ødegaard', top: '45%', left: '50%' },
        { number: 41, name: 'Rice', top: '45%', left: '70%' },
        { number: 7, name: 'Saka', top: '20%', left: '25%' },
        { number: 9, name: 'Havertz', top: '15%', left: '50%' },
        { number: 11, name: 'Martinelli', top: '20%', left: '75%' },
      ]
    }
  },
  // 12. Player Ratings full
  {
    type: 'player_ratings',
    username: 'WhoScored',
    subtitle: 'Match Ratings',
    userInitial: 'WS',
    userColor: '#FFA500',
    verified: true,
    likes: 1240,
    comments: 156,
    timestamp: '18 HOURS AGO',
    data: {
      color: '#EF0107',
      avgRating: '7.8',
      motm: 'B. Saka',
      players: [
        { rating: 7.2, name: 'Raya', top: '90%', left: '50%' },
        { rating: 7.5, name: 'White', top: '70%', left: '20%' },
        { rating: 8.1, name: 'Gabriel', top: '70%', left: '40%' },
        { rating: 8.4, name: 'Saliba', top: '70%', left: '60%' },
        { rating: 7.6, name: 'Zinch.', top: '70%', left: '80%' },
        { rating: 7.8, name: 'Partey', top: '45%', left: '30%' },
        { rating: 8.2, name: 'Øde.', top: '45%', left: '50%' },
        { rating: 7.9, name: 'Rice', top: '45%', left: '70%' },
        { rating: 9.1, name: 'Saka', top: '20%', left: '25%' },
        { rating: 7.4, name: 'Hav.', top: '15%', left: '50%' },
        { rating: 7.7, name: 'Mart.', top: '20%', left: '75%' },
      ]
    }
  },
  // 13. Fantasy Tips
  {
    type: 'fantasy_tips',
    username: 'FPL Tips',
    subtitle: 'Fantasy Premier League',
    userInitial: 'FPL',
    userColor: '#38003c',
    verified: true,
    likes: 2100,
    comments: 320,
    timestamp: '20 HOURS AGO',
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
  // 14. Meme
  {
    type: 'meme',
    username: 'FootyHumour',
    subtitle: 'Meme Lord',
    userInitial: 'FH',
    userColor: '#FBBF24',
    likes: 89000,
    comments: 4500,
    timestamp: '22 HOURS AGO',
    caption: 'Tottenham fans right now 😂😂😂 #COYS',
    data: {
      image: 'https://images.unsplash.com/photo-1602674809970-3eb52ddc06ec?w=600&h=600&fit=crop',
      topText: 'When Spurs',
      bottomText: 'Spurs Again'
    }
  },
  // 15. Injury Report
  {
    type: 'injury_report',
    username: 'Arsenal Medical',
    subtitle: 'Team News',
    userInitial: 'A',
    userColor: '#EF0107',
    verified: true,
    likes: 567,
    comments: 89,
    timestamp: '1 DAY AGO',
    data: {
      club: 'Arsenal',
      players: [
        { name: 'Gabriel Jesus', injury: 'Knee injury', status: '4 weeks', img: 'https://i.pravatar.cc/40?img=12' },
        { name: 'Takehiro Tomiyasu', injury: 'Calf strain', status: '2 weeks', img: 'https://i.pravatar.cc/40?img=14' },
        { name: 'Riccardo Calafiori', injury: 'Knock', status: 'Doubt', img: 'https://i.pravatar.cc/40?img=18' },
      ]
    }
  },
  // 16. Betting Tips
  {
    type: 'betting_tips',
    username: 'Betting Insights',
    subtitle: 'Sponsored • William Hill',
    userInitial: 'BI',
    userColor: '#FFE600',
    likes: 230,
    comments: 67,
    timestamp: '1 DAY AGO',
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
  // 17. Fixture card
  {
    type: 'fixture_card',
    username: 'Fixtures',
    subtitle: 'Premier League',
    userInitial: 'PL',
    userColor: '#38003c',
    likes: 145,
    comments: 23,
    timestamp: '1 DAY AGO',
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
  // 18. Quiz
  {
    type: 'quiz',
    username: 'Football Quiz',
    subtitle: 'Daily Challenge',
    userInitial: 'FQ',
    userColor: '#7C3AED',
    likes: 456,
    comments: 234,
    timestamp: '1 DAY AGO',
    data: {
      question: 'Which player has won the most Ballon d\'Or awards?',
      options: ['Cristiano Ronaldo', 'Lionel Messi', 'Pelé', 'Diego Maradona'],
      correct: 1
    }
  },
  // 19. Podcast
  {
    type: 'podcast',
    username: 'The Football Pod',
    subtitle: 'Weekly Episode',
    userInitial: 'TFP',
    userColor: '#FF6B35',
    likes: 89,
    comments: 12,
    timestamp: '2 DAYS AGO',
    data: {
      episode: 142,
      title: 'Title Race Heating Up: Can Arsenal Hold On?',
      duration: '52 min',
      host: 'Gary & Jamie'
    }
  },
  // 20. Shop
  {
    type: 'shop',
    username: 'Arsenal Store',
    subtitle: 'Official Merch',
    userInitial: 'A',
    userColor: '#EF0107',
    verified: true,
    likes: 124,
    comments: 18,
    timestamp: '2 DAYS AGO',
    data: {
      title: 'New Season Kits',
      items: [
        { name: 'Home Jersey 24/25', price: 75, oldPrice: 90, emoji: '👕', bg: 'linear-gradient(135deg, #EF0107, #8B0000)' },
        { name: 'Away Jersey 24/25', price: 70, oldPrice: 85, emoji: '👕', bg: 'linear-gradient(135deg, #fff, #ccc)' },
        { name: 'Training Top', price: 45, oldPrice: 60, emoji: '🥼', bg: 'linear-gradient(135deg, #0A1F44, #1B3370)' },
        { name: 'Scarf', price: 20, oldPrice: 25, emoji: '🧣', bg: 'linear-gradient(135deg, #EF0107, #FFD700)' },
      ]
    }
  },
  // 21. News list — updated with image-style layout
  {
    type: 'news_list',
    username: 'Arneo Paris',
    subtitle: 'Football News',
    userInitial: 'AP',
    userColor: '#EF0107',
    verified: true,
    likes: 34,
    comments: 5,
    timestamp: '2 DAYS AGO',
    data: {
      items: [
        { source: 'AT', tag: 'Available', text: "Lamine Yamal's mum calls out Arsenal star as agent breaks silence on move", color: '#FF1A1A' },
        { source: 'FR', tag: 'Romano', text: "Fabrizio Romano: Arsenal hold talks 'in recent days' to sign £100m star, he's a mini Rice - opinion", color: '#1877f2' },
        { source: 'BA', tag: 'Barcelona', text: 'Barcelona eye second Newcastle United player as £27m Arsenal star linked with St James\' Park switch', color: '#a50044' },
        { source: 'AR', tag: 'Arsenal', text: 'Arsenal target Alvarez\'s agent issues statement in response to transfer twist', color: '#EF0107' },
        { source: 'RM', tag: 'Real Madrid', text: 'Arsenal deal major blow as Real Madrid move to steal Barcelona target', color: '#00529f' },
        { source: 'AT', tag: 'Wings', text: 'Are Arsenal about to solve left wing issues?', color: '#FF1A1A' },
      ]
    }
  },
  // 22. Final image post
  {
    type: 'image',
    username: 'Martin Ødegaard',
    subtitle: 'Arsenal Captain',
    userImage: 'https://i.pravatar.cc/40?img=68',
    verified: true,
    likes: 156000,
    comments: 3400,
    timestamp: '3 DAYS AGO',
    caption: 'Captain leads from the front 🔴⚪ Up the Arsenal! ⚽',
    data: {
      url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=600&fit=crop'
    }
  },
  // 23. Prediction post
  {
    type: 'prediction',
    username: 'Arneo Paris',
    subtitle: 'Match Predictor',
    userInitial: 'AP',
    userColor: '#EF0107',
    verified: true,
    likes: 234,
    comments: 67,
    timestamp: '3 HOURS AGO',
    data: {
      matchCount: 63,
      accuracyPct: 71,
    }
  },
  // 24. Watch Live post (updated style)
  {
    type: 'watch_live',
    username: 'Arneo Paris',
    subtitle: 'Live Match',
    userInitial: 'AP',
    userColor: '#0A1F44',
    likes: 89,
    comments: 12,
    timestamp: '25 MINUTES AGO',
    data: {
      minute: 67,
      home: { name: 'Kristiansund', short: 'KBK', color: '#FFD600', score: 1 },
      away: { name: 'Lillestrøm', short: 'LSK', color: '#1a1a1a', score: 0 },
    }
  },
];
