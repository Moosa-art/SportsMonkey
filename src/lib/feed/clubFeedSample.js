/**
 * src/lib/feed/clubFeedSample.js
 *
 * A trimmed-but-representative snapshot of the real
 * `https://www.social442.com/api/club-feed-new?club_id=14` response.
 *
 * Why this exists:
 *  - Offline / dev fallback so the feed renders even when the BFF or upstream
 *    is unreachable (the sandbox where this was built has no network).
 *  - Fixture for the normalizer unit test (normalizeFeed.test.js).
 *
 * It deliberately includes ONE example of every distinct layout / tile type
 * observed in production so the UI exercises every code path.
 */

export const clubFeedSample = {
  status: true,
  feed: [
    {
      post_1: { type: 'league_table_story' },
      post_2: {
        type: 'glance_news',
        data: [
          {
            id: 1122325,
            title:
              '"A euphoric feeling": United fan favourite outlines exactly what it is like to step out at Old Trafford',
            image:
              'https://thepeoplesperson.com/wp-content/uploads/2026/05/kobbie-mainoo.jpg',
            link: 'https://thepeoplesperson.com/2026/06/18/kobbie-mainoo-311646/',
            news_type: {
              club: {
                name: 'Man Utd',
                image: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
              },
            },
            is_redirect: false,
            modal_body: [
              "Manchester United's Kobbie Mainoo has produced an impressive turnaround this season.",
              'Mainoo struggled to get into the first team under Ruben Amorim and almost joined Napoli on loan.',
            ],
            body: [
              "Manchester United's Kobbie Mainoo has produced an impressive turnaround this season.",
            ],
            source: 'Thepeoplesperson',
            source_img:
              'https://www.social442.com/images/news_source_logo/357444_source_logo.png',
            source_type: 'simple_news',
            creation_date: '2026-06-18 08:35:01',
          },
        ],
      },
      post_3: {
        type: 'player_rating_post',
        data: {
          lineup_formation: {
            status: true,
            processedPlayers: [
              {
                index: 8,
                playerId: 3180,
                playerTitle: 'B. Fernandes',
                playerLastname: 'Fernandes',
                playerImage:
                  'https://cdn.sportmonks.com/images/soccer/players/2/129602.png',
                playerStats: { rating: 8.7, passes: 53, 'passing-acc': 87 },
                cardsDisplay: { yellow: 0, red: 0, yellowRed: 0 },
                playerOUT: false,
                goalsScored: 1,
              },
              {
                index: 9,
                playerId: 20180153914,
                playerTitle: 'P. Dorgu',
                playerLastname: 'Dorgu',
                playerImage:
                  'https://cdn.sportmonks.com/images/soccer/players/24/37653176.png',
                playerStats: { rating: 8.1, passes: 18, 'passing-acc': 72 },
                cardsDisplay: { yellow: 0, red: 0, yellowRed: 0 },
                playerOUT: false,
                goalsScored: 1,
              },
            ],
            player_lineup_formation: '4-2-3-1',
          },
          post_body:
            'Last match line up and formation Brighton 0 - 3 Man Utd. 51.79% possession.',
          id: 104070,
          source: 'Last Match Player Ratings',
          source_img: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
          creation_date: '3w ago',
          home_team: 'https://cdn.sportmonks.com/images/soccer/teams/14/78.png',
          away_team: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
          home_title: 'Brighton',
          away_title: 'Man Utd',
          home_score: '0',
          away_score: '3',
        },
      },
      post_4: { type: 'highlights_detail_story' },
      post_5: { type: 'live_score_story' },
      post_6: {
        type: 'interactive_post',
        data: {
          source: 'Interactive',
          source_img: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
          key_comments: 672,
          post_outer_text: "Manchester United's weakest player?",
          players_list: [
            { last_name: 'Mbeumo', title: 'B. Mbeumo' },
            { last_name: 'Mount', title: 'M. Mount' },
          ],
          key_thoughts_player: {
            image_1: {
              player_image:
                'https://cdn.sportmonks.com/images/soccer/players/29/164061.png',
              rank: '1st',
            },
            image_2: {
              player_image:
                'https://cdn.sportmonks.com/images/soccer/players/16/9605680.png',
              rank: '2nd',
            },
          },
        },
      },
      feed_layout_type: 'glance_post_1',
    },
    {
      id: 1122322,
      title:
        'Man Utd icon Ronaldo wore special shirt vs DR Congo that only five players in history can wear',
      image:
        'https://static0.givemesportimages.com/wordpress/wp-content/uploads/2026/06/ronaldo.jpg',
      link: 'https://www.givemesport.com/world-cup-cristiano-ronaldo-special-shirt/',
      news_type: {
        club: {
          name: 'Man Utd',
          image: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
        },
      },
      is_redirect: false,
      modal_body: [
        'Cristiano Ronaldo wore a special shirt in Portugal\u2019s 2026 World Cup opener against DR Congo.',
      ],
      body: [
        'Cristiano Ronaldo wore a special shirt in Portugal\u2019s 2026 World Cup opener against DR Congo.',
      ],
      source: 'Givemesport',
      source_img:
        'https://www.social442.com/images/news_source_logo/357366_source_logo.png',
      source_type: 'simple_news',
      creation_date: '2026-06-18 08:51:21',
      feed_layout_type: 'simple_news',
    },
    {
      id: 236,
      title: "Wouldn't you like to know?",
      link: '/public/videos/snaptik_7496066319104740630_hd.mp4',
      creation_date: '5hr ago',
      source_title: 'FootyBants',
      source_img:
        'https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=236',
      feed_layout_type: 'funny_video',
    },
    {
      post_type: 'club_fixtures',
      data: {
        fixtures: [
          {
            match_id: 103967,
            home: {
              title: 'Man Utd',
              image: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
              score: '3',
            },
            away: {
              title: 'Forest',
              image: 'https://cdn.sportmonks.com/images/soccer/teams/31/63.png',
              score: '2',
            },
            match_status: 'FT',
            date_time: '2026-05-17 11:30:00',
          },
          {
            match_id: 104070,
            home: {
              title: 'Brighton',
              image: 'https://cdn.sportmonks.com/images/soccer/teams/14/78.png',
              score: '0',
            },
            away: {
              title: 'Man Utd',
              image: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
              score: '3',
            },
            match_status: 'FT',
            date_time: '2026-05-24 15:00:00',
          },
        ],
        bottom_text:
          'Scheduled dates and times for Man Utd matches, along with the opponents.',
        source: 'Man Utd Fixtures',
        source_img: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
      },
      feed_layout_type: 'club_post',
    },
    {
      post_1: {
        type: 'top_scorer_goals_story',
        data: [
          {
            name: 'Pawlak',
            image: 'https://cdn.sportmonks.com/images/soccer/players/20/159700.png',
            stats: { stats_name: 'tackles', value: 90, apps: 34, season: '2025/2026' },
          },
          {
            name: 'Shaw',
            image: 'https://cdn.sportmonks.com/images/soccer/players/27/955.png',
            stats: { stats_name: 'tackles', value: 74, apps: 38, season: '2025/2026' },
          },
        ],
      },
      post_2: {
        type: 'glance_news',
        data: [
          {
            id: 1122326,
            title:
              "'From What I Hear' - Insider: Man United could accept 'big offer' for first-XI star",
            image:
              'https://media.assettype.com/footballinsider247/amad-diallo.jpg',
            link: 'https://www.footballinsider247.com/man-united-amad-diallo/',
            news_type: {
              club: {
                name: 'Man Utd',
                image: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
              },
            },
            is_redirect: true,
            modal_body: ['[unable to retrieve full-text content]'],
            body: [],
            source: 'Footballinsider 247',
            source_img:
              'https://www.social442.com/images/news_source_logo/357216_source_logo.png',
            source_type: 'simple_news',
            creation_date: '2026-06-18 08:14:05',
          },
        ],
      },
      post_3: { type: 'streamhd', data: [] },
      post_4: { type: 'freebet' },
      post_5: { type: 'choose_playing_11', data: 'coming soon' },
      post_6: {
        type: 'interactive_post',
        data: {
          source: 'Interactive',
          source_img: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
          key_comments: 838,
          post_outer_text: "Manchester United's best player?",
          players_list: [{ last_name: 'Borges Fernandes', title: 'B. Fernandes' }],
          key_thoughts_player: {
            image_1: {
              player_image:
                'https://cdn.sportmonks.com/images/soccer/players/2/129602.png',
              rank: '1st',
            },
          },
        },
      },
      feed_layout_type: 'glance_post_2',
    },
    {
      id: 1122357,
      title: '2025/26 Is In The Books \uD83D\uDCDA\u2705',
      image: 'https://i.ytimg.com/vi/pX3HIEvCNkM/hqdefault.jpg',
      link: 'https://www.youtube.com/watch?v=pX3HIEvCNkM',
      news_type: [],
      is_redirect: true,
      modal_body: [],
      body: [],
      source: 'Manchester United',
      source_img: 'https://yt3.googleusercontent.com/manutd=s120',
      source_type: 'youtube_news',
      creation_date: '2026-06-18 09:30:26',
      feed_layout_type: 'youtube_news',
    },
  ],
  global_variable: {
    club_title: 'Man Utd',
    club_logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png',
    league_title: 'Premier League',
    league_logo: 'https://cdn.sportmonks.com/images/soccer/leagues/8/8.png',
    user_id: null,
  },
  offsets: {
    glance_news: 0,
    glance_post_1: 0,
    simple_news: 4,
    funny_video: 2,
    glance_post_2: 0,
    club_post: 2,
    youtube_news: 2,
    user_post: 0,
    glance_post_3: 0,
    seen_club_post: ['club_fixtures'],
    news_seen_ids: [1122325, 1122326, 1122322, 1122357],
    viewed_video_ids: [236],
  },
};

export default clubFeedSample;
