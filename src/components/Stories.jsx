import { useState, useRef } from "react";
import StoryViewer from "./StoryViewer";
import "./Stories.css";

// ── API Data (from club_page endpoint) ─────────────────────────
const API_DATA = {
  global: {
    club_name: "Arsenal",
    club_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
    league_name: "Premier League",
    league_logo: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
    season: "2025/2026",
    club_country: { name: "England", flag: "https://www.social442.com/images/Flag_of_England.png" },
    club_titles: { home_club: "Crystal Palace", away_club: "Arsenal" },
    club_logos: {
      home_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/51.png",
      away_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
    },
    next_match_colors: { home_color: "#0046A8", away_color: "#F0F0F0" },
  },
  next_match: {
    home_position: 15, away_position: 1,
    date_time: "2026-05-24 15:00:00",
    home_players: [
      { name: "J. Mateta", image: "https://cdn.sportmonks.com/images/soccer/players/22/96950.png", goals: 12 },
      { name: "I. Sarr", image: "https://cdn.sportmonks.com/images/soccer/players/18/96722.png", goals: 9 },
      { name: "D. Muñoz", image: "https://cdn.sportmonks.com/images/soccer/players/13/524045.png", goals: 4 },
    ],
    away_players: [
      { name: "V. Gyökeres", image: "https://cdn.sportmonks.com/images/soccer/players/23/194167.png", goals: 14 },
      { name: "B. Saka", image: "https://cdn.sportmonks.com/images/soccer/players/19/16827155.png", goals: 7 },
      { name: "L. Trossard", image: "https://cdn.sportmonks.com/images/soccer/players/20/61780.png", goals: 6 },
    ],
  },
  player_spotlight: {
    name: "Gabriel Martinelli", number: "11",
    image: "https://cdn.sportmonks.com/images/soccer/players/28/10959356.png",
    country: "Brazil", country_flag: "https://apiv3.apifootball.com/badges/logo_country/27_brazil.png",
    height: "5ft 10", age: "24yrs", position: "Midfielder", appearances: 30,
    goals: 1, assists: 4, minutes: 1079, tackles: 12, pass_accuracy: 72,
    strength: 59, pace: 63, technique: 62,
    strengths: [
      { label: "Balance", value: 66 }, { label: "Acceleration", value: 65 },
      { label: "Pace", value: 63 }, { label: "Agility", value: 63 },
      { label: "Ball Control", value: 62 },
    ],
    weaknesses: [
      { label: "Finishing", value: 48 }, { label: "Def. Awareness", value: 48 },
      { label: "Interceptions", value: 50 }, { label: "Shooting", value: 51 },
      { label: "Positioning", value: 53 },
    ],
    news: {
      title: "Arsenal begin talks to sign £34m winger as potential Gabriel Martinelli replacement",
      image: "https://metro.co.uk/wp-content/uploads/2026/06/GettyImages-2277016759-0d20_1781301077.jpg?quality=90&strip=all&w=1200&h=630&crop=1",
      date: "2026-06-12T22:25:03.000000Z",
    },
  },
  league_table: {
    club_position: 1, season: "2025/26",
    standings: [
      { team: "Arsenal", logo: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png", played: 38, won: 26, draw: 7, lost: 5, gd: 44, pts: 85 },
      { team: "Man City", logo: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", played: 38, won: 23, draw: 9, lost: 6, gd: 42, pts: 78 },
      { team: "Man Utd", logo: "https://cdn.sportmonks.com/images/soccer/teams/14/14.png", played: 38, won: 20, draw: 11, lost: 7, gd: 19, pts: 71 },
      { team: "Villa", logo: "https://cdn.sportmonks.com/images/soccer/teams/15/15.png", played: 38, won: 19, draw: 8, lost: 11, gd: 7, pts: 65 },
      { team: "Liverpool", logo: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", played: 38, won: 17, draw: 9, lost: 12, gd: 10, pts: 60 },
      { team: "Bournemouth", logo: "https://cdn.sportmonks.com/images/soccer/teams/20/52.png", played: 38, won: 13, draw: 18, lost: 7, gd: 4, pts: 57 },
      { team: "Sunderland", logo: "https://cdn.sportmonks.com/images/soccer/teams/3/3.png", played: 38, won: 14, draw: 12, lost: 12, gd: -6, pts: 54 },
      { team: "Brentford", logo: "https://cdn.sportmonks.com/images/soccer/teams/12/236.png", played: 38, won: 14, draw: 11, lost: 13, gd: 3, pts: 53 },
      { team: "Brighton", logo: "https://cdn.sportmonks.com/images/soccer/teams/14/78.png", played: 38, won: 14, draw: 11, lost: 13, gd: 6, pts: 53 },
      { team: "Chelsea", logo: "https://cdn.sportmonks.com/images/soccer/teams/18/18.png", played: 38, won: 14, draw: 10, lost: 14, gd: 6, pts: 52 },
      { team: "Fulham", logo: "https://cdn.sportmonks.com/images/soccer/teams/11/11.png", played: 38, won: 15, draw: 7, lost: 16, gd: -4, pts: 52 },
      { team: "Everton", logo: "https://cdn.sportmonks.com/images/soccer/teams/13/13.png", played: 38, won: 13, draw: 10, lost: 15, gd: -3, pts: 49 },
      { team: "Newcastle", logo: "https://cdn.sportmonks.com/images/soccer/teams/20/20.png", played: 38, won: 14, draw: 7, lost: 17, gd: -2, pts: 49 },
      { team: "Leeds", logo: "https://cdn.sportmonks.com/images/soccer/teams/7/71.png", played: 38, won: 11, draw: 14, lost: 13, gd: -7, pts: 47 },
      { team: "Crystal Palace", logo: "https://cdn.sportmonks.com/images/soccer/teams/19/51.png", played: 38, won: 11, draw: 12, lost: 15, gd: -10, pts: 45 },
      { team: "Forest", logo: "https://cdn.sportmonks.com/images/soccer/teams/31/63.png", played: 38, won: 11, draw: 11, lost: 16, gd: -3, pts: 44 },
      { team: "Tottenham", logo: "https://cdn.sportmonks.com/images/soccer/teams/6/6.png", played: 38, won: 10, draw: 11, lost: 17, gd: -9, pts: 41 },
      { team: "West Ham", logo: "https://cdn.sportmonks.com/images/soccer/teams/1/1.png", played: 38, won: 10, draw: 9, lost: 19, gd: -19, pts: 39 },
      { team: "Burnley", logo: "https://cdn.sportmonks.com/images/soccer/teams/27/27.png", played: 38, won: 4, draw: 10, lost: 24, gd: -37, pts: 22 },
      { team: "Wolves", logo: "https://cdn.sportmonks.com/images/soccer/teams/29/29.png", played: 38, won: 3, draw: 11, lost: 24, gd: -41, pts: 20 },
    ],
  },
  highlights: {
    home_team: "Crystal Palace", away_team: "Arsenal",
    date_time: "2026-05-24 15:00:00",
    home_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/51.png",
    away_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
    video_thumb: "https://i.ytimg.com/vi/Qa8DDbyH9BE/hqdefault.jpg",
    video_link: "https://www.youtube.com/watch?v=Qa8DDbyH9BE",
    home_goal: "1", away_goal: "2",
    goals: [
      { playerName: "J. Mateta", assist: "Y. Pino", minute: 89, side: "home" },
      { playerName: "G. Jesus", assist: "G. Martinelli", minute: 42, side: "away" },
      { playerName: "N. Madueke", assist: "K. Havertz", minute: 48, side: "away" },
    ],
  },
  prediction: {
    home_club: "Crystal Palace", away_club: "Arsenal",
    home_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/51.png",
    away_logo: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
    home_probability: 15, away_probability: 85,
    home_wins: 11, away_wins: 26,
    home_goals: 41, away_goals: 71,
    home_conceded: 51, away_conceded: 27,
    home_passes: 69, away_passes: 81,
  },
  top_scorers_goals: [
    { name: "Erling Haaland", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 27, image: "https://cdn.sportmonks.com/images/soccer/players/21/154421.png" },
    { name: "Igor Thiago", club: "https://cdn.sportmonks.com/images/soccer/teams/12/236.png", value: 22, image: "https://cdn.sportmonks.com/images/soccer/players/4/37407204.png" },
    { name: "Ollie Watkins", club: "https://cdn.sportmonks.com/images/soccer/teams/15/15.png", value: 16, image: "https://cdn.sportmonks.com/images/soccer/players/17/12145.png" },
    { name: "Morgan Gibbs-White", club: "https://cdn.sportmonks.com/images/soccer/teams/31/63.png", value: 15, image: "https://cdn.sportmonks.com/images/soccer/players/22/7926.png" },
    { name: "João Pedro", club: "https://cdn.sportmonks.com/images/soccer/teams/18/18.png", value: 15, image: "https://cdn.sportmonks.com/images/soccer/players/22/28931574.png" },
    { name: "D. Calvert-Lewin", club: "https://cdn.sportmonks.com/images/soccer/teams/7/71.png", value: 14, image: "https://cdn.sportmonks.com/images/soccer/players/21/5141.png" },
  ],
  top_scorers_assists: [
    { name: "Bruno Fernandes", club: "https://cdn.sportmonks.com/images/soccer/teams/14/14.png", value: 21, image: "https://cdn.sportmonks.com/images/soccer/players/2/129602.png" },
    { name: "Rayan Cherki", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 12, image: "https://cdn.sportmonks.com/images/soccer/players/5/21072805.png" },
    { name: "Jarrod Bowen", club: "https://cdn.sportmonks.com/images/soccer/teams/1/1.png", value: 11, image: "https://cdn.sportmonks.com/images/soccer/players/24/1592.png" },
    { name: "Erling Haaland", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 8, image: "https://cdn.sportmonks.com/images/soccer/players/21/154421.png" },
    { name: "James Garner", club: "https://cdn.sportmonks.com/images/soccer/teams/13/13.png", value: 7, image: "https://cdn.sportmonks.com/images/soccer/players/12/4536524.png" },
    { name: "Lucas Digne", club: "https://cdn.sportmonks.com/images/soccer/teams/15/15.png", value: 7, image: "https://cdn.sportmonks.com/images/soccer/players/8/95368.png" },
  ],
  top_scorers_tackles: [
    { name: "James Garner", club: "https://cdn.sportmonks.com/images/soccer/teams/13/13.png", value: 121, image: "https://cdn.sportmonks.com/images/soccer/players/12/4536524.png" },
    { name: "João Palhinha", club: "https://cdn.sportmonks.com/images/soccer/teams/6/6.png", value: 111, image: "https://cdn.sportmonks.com/images/soccer/players/8/160072.png" },
    { name: "João Gomes", club: "https://cdn.sportmonks.com/images/soccer/teams/29/29.png", value: 108, image: "https://cdn.sportmonks.com/images/soccer/players/12/37402348.png" },
    { name: "Elliot Anderson", club: "https://cdn.sportmonks.com/images/soccer/teams/31/63.png", value: 104, image: "https://cdn.sportmonks.com/images/soccer/players/15/332047.png" },
    { name: "Adrien Truffert", club: "https://cdn.sportmonks.com/images/soccer/teams/20/52.png", value: 104, image: "https://cdn.sportmonks.com/images/soccer/players/1/28543553.png" },
    { name: "Mateus Fernandes", club: "https://cdn.sportmonks.com/images/soccer/teams/1/1.png", value: 103, image: "https://cdn.sportmonks.com/images/soccer/players/1/37593153.png" },
  ],
  top_scorers_technique: [
    { name: "Florian Wirtz", club: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", value: 92, image: "https://cdn.sportmonks.com/images/soccer/players/30/37429246.png" },
    { name: "Bernardo Silva", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 92, image: "https://cdn.sportmonks.com/images/soccer/players/1/96353.png" },
    { name: "Phil Foden", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 91, image: "https://cdn.sportmonks.com/images/soccer/players/5/336133.png" },
    { name: "Mohamed Salah", club: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", value: 90, image: "https://cdn.sportmonks.com/images/soccer/players/29/4125.png" },
    { name: "Rodri", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 90, image: "https://cdn.sportmonks.com/images/soccer/players/30/186910.png" },
    { name: "Cole Palmer", club: "https://cdn.sportmonks.com/images/soccer/teams/18/18.png", value: 89, image: "https://cdn.sportmonks.com/images/soccer/players/11/28912747.png" },
  ],
  top_scorers_creativity: [
    { name: "Bruno Fernandes", club: "https://cdn.sportmonks.com/images/soccer/teams/14/14.png", value: 94, image: "https://cdn.sportmonks.com/images/soccer/players/2/129602.png" },
    { name: "Florian Wirtz", club: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", value: 91, image: "https://cdn.sportmonks.com/images/soccer/players/30/37429246.png" },
    { name: "Martin Ødegaard", club: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png", value: 90, image: "https://cdn.sportmonks.com/images/soccer/players/7/26823.png" },
    { name: "Mohamed Salah", club: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", value: 89, image: "https://cdn.sportmonks.com/images/soccer/players/29/4125.png" },
    { name: "Cole Palmer", club: "https://cdn.sportmonks.com/images/soccer/teams/18/18.png", value: 89, image: "https://cdn.sportmonks.com/images/soccer/players/11/28912747.png" },
    { name: "Youri Tielemans", club: "https://cdn.sportmonks.com/images/soccer/teams/15/15.png", value: 87, image: "https://cdn.sportmonks.com/images/soccer/players/6/62342.png" },
  ],
  top_scorers_fastest: [
    { name: "Jeremie Frimpong", club: "https://cdn.sportmonks.com/images/soccer/teams/8/8.png", value: 94, image: "https://cdn.sportmonks.com/images/soccer/players/14/8403182.png" },
    { name: "Yankuba Minteh", club: "https://cdn.sportmonks.com/images/soccer/teams/14/78.png", value: 94, image: "https://cdn.sportmonks.com/images/soccer/players/26/37655226.png" },
    { name: "Daniel James", club: "https://cdn.sportmonks.com/images/soccer/teams/7/71.png", value: 94, image: "https://cdn.sportmonks.com/images/soccer/players/29/5149.png" },
    { name: "Milan Aleksic", club: "https://cdn.sportmonks.com/images/soccer/teams/3/3.png", value: 92, image: "https://cdn.sportmonks.com/images/soccer/players/1/37705825.png" },
    { name: "Kevin Schade", club: "https://cdn.sportmonks.com/images/soccer/teams/12/236.png", value: 92, image: "https://cdn.sportmonks.com/images/soccer/players/22/27067062.png" },
    { name: "Jérémy Doku", club: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png", value: 92, image: "https://cdn.sportmonks.com/images/soccer/players/6/23697990.png" },
  ],
  funny_videos: [
    { title: "Women referee got Swag", link: "/public/videos/660553c8130723982485321711625160.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50473_1711606904.jpeg?v=33" },
    { title: "Strange way to save Penalty", link: "/public/videos/660554e9d1d1f6606917841711625449.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50473_1711606904.jpeg?v=34" },
    { title: "When the referee is a beautiful female", link: "/public/videos/6628a3867134a5020245271713939334.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50508_1713934521.jpeg?v=43" },
    { title: "Who's the best penalty taker?", link: "/public/videos/6628a4ce0eb810963458321713939662.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50508_1713934521.jpeg?v=44" },
    { title: "The Iranian Messi", link: "/public/videos/6687cbfe7e2398296080471720175614.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50550_1719820445.jpeg?v=97" },
    { title: "Player kisses ref", link: "/public/videos/RandomAsEver_7592197591845063958.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=223" },
    { title: "Funny Statidum Chants", link: "/public/videos/snaptik_7391068871563742497_v2.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=229" },
    { title: "Arsenal Baby Man Hooligan", link: "/public/videos/JacobSalau_7585561871198047510.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=230" },
    { title: "Roy Keane Best Moments", link: "/public/videos/snaptik_7544050250034449686_v2.mp4", source: "FootyBants", sourceImg: "https://www.social442.com/public/profiles/user_50742_1736156245.jpg?v=237" },
  ],
};

// ── Build story objects from API data ──────────────────────────
function buildStories(data) {
  return [
    // 1. Next Match - Intro
    {
      id: "next-match",
      type: "next_match",
      label: "Stream",
      username: "Premier League",
      avatarColor: "#0046A8",
      avatarInitial: "NM",
      bg: `linear-gradient(135deg, ${data.global.next_match_colors.home_color}, #001f6b)`,
      iconType: "matchup_intro",
      iconData: { homeLogo: data.global.club_logos.home_logo, awayLogo: data.global.club_logos.away_logo, homeColor: data.global.next_match_colors.home_color, awayColor: data.global.next_match_colors.away_color },
      subtitle: "May 24, 2026",
      data: {
        leagueLogo: data.global.league_logo,
        league: data.global.league_name,
        homeLogo: data.global.club_logos.home_logo,
        awayLogo: data.global.club_logos.away_logo,
        homeClub: data.global.club_titles.home_club,
        awayClub: data.global.club_titles.away_club,
        homeColor: data.global.next_match_colors.home_color,
        awayColor: data.global.next_match_colors.away_color,
        homePosition: data.next_match.home_position,
        awayPosition: data.next_match.away_position,
        dateTime: data.next_match.date_time,
      },
    },
    // 2. Next Match - Stats (Top Scorers) - HIDDEN BUBBLE
    {
      id: "next-match-stats",
      type: "next_match_stats",
      label: "Top Scorers",
      username: "Premier League",
      avatarColor: "#0046A8",
      avatarInitial: "TS",
      bg: `linear-gradient(135deg, ${data.global.next_match_colors.home_color}, #001f6b)`,
      iconType: "emoji",
      iconData: { text: "🔥" },
      subtitle: "Top Scorers Comparison",
      hideBubble: true,
      data: {
        homeColor: data.global.next_match_colors.home_color,
        awayColor: data.global.next_match_colors.away_color,
        homeLogo: data.global.club_logos.home_logo,
        awayLogo: data.global.club_logos.away_logo,
        homeTopScorers: data.next_match.home_players,
        awayTopScorers: data.next_match.away_players,
      },
    },
    // 3. Ad - William Hill
    {
      id: "ad-william-hill",
      type: "ad_card",
      label: "Free Bet",
      username: "Free Bets",
      avatarColor: "#0a1f6b",
      avatarInitial: "FB",
      bg: "#0a1f6b",
      iconType: "william_hill",
      iconData: {},
      subtitle: "Sponsored",
      data: {
        theme: "william_hill",
        titleHtml: "Bet £10<br/><span style='color:#fcd34d'>Get £30</span><br/>in free bets",
        buttonText: "Sign Up",
        steps: [
          { num: "1", text: "Join" },
          { num: "2", text: "Bet £10" },
          { num: "3", text: "Get 30" }
        ],
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/William_Hill_logo.svg",
        bgImage: "https://images.unsplash.com/photo-1518605368461-1e1e11417066?w=600&q=80"
      },
    },
    // 4. League Table
    {
      id: "league-table",
      type: "league_table_full",
      label: "Table",
      username: "Premier League",
      avatarColor: "#38003c",
      avatarInitial: "PL",
      bg: "linear-gradient(135deg,#38003c,#560050)",
      iconType: "table_bubble",
      iconData: { clubLogo: data.global.club_logo, leagueLogo: data.global.league_logo },
      subtitle: `${data.league_table.season} · Arsenal #1`,
      data: {
        season: data.league_table.season,
        clubPosition: data.league_table.club_position,
        highlightTeam: data.global.club_name,
        standings: data.league_table.standings,
      },
    },
    // 5. Highlights
    {
      id: "highlights",
      type: "highlights_detail",
      label: "Highlights",
      username: "Highlights",
      avatarUrl: data.global.club_logos.away_logo,
      avatarColor: "#c41e3a",
      avatarInitial: "HL",
      bg: "linear-gradient(135deg,#1a0a00,#3d1500)",
      iconType: "highlights_bubble",
      iconData: { homeLogo: data.global.club_logos.home_logo, awayLogo: data.global.club_logos.away_logo, home: data.highlights.home_goal, away: data.highlights.away_goal, homeColor: data.global.next_match_colors.home_color, awayColor: data.global.next_match_colors.away_color },
      subtitle: "1mo ago",
      data: {
        homeTeam: data.highlights.home_team,
        awayTeam: data.highlights.away_team,
        dateTime: data.highlights.date_time,
        homeLogo: data.highlights.home_logo,
        awayLogo: data.highlights.away_logo,
        videoThumb: "https://cdn.pixabay.com/photo/2016/11/29/02/05/audience-1866738_960_720.jpg",
        videoLink: data.highlights.video_link,
        homeGoal: data.highlights.home_goal,
        awayGoal: data.highlights.away_goal,
        goals: data.highlights.goals,
      },
    },
    // 6. Match Prediction
    {
      id: "prediction",
      type: "match_prediction",
      label: "Prediction",
      username: "Prediction",
      avatarUrl: data.global.club_logos.away_logo,
      avatarColor: "#1B458F",
      avatarInitial: "PR",
      bg: "linear-gradient(135deg,#0d2240,#1B458F)",
      iconType: "prediction_bubble",
      iconData: { homeLogo: data.global.club_logos.home_logo, awayLogo: data.global.club_logos.away_logo, homeColor: data.global.next_match_colors.home_color, awayColor: data.global.next_match_colors.away_color },
      subtitle: "5h",
      data: {
        homeClub: data.prediction.home_club,
        awayClub: data.prediction.away_club,
        homeLogo: data.prediction.home_logo,
        awayLogo: data.prediction.away_logo,
        homeProbability: data.prediction.home_probability,
        awayProbability: data.prediction.away_probability,
        homeWins: data.prediction.home_wins,
        awayWins: data.prediction.away_wins,
        homeGoals: data.prediction.home_goals,
        awayGoals: data.prediction.away_goals,
        homeConceded: data.prediction.home_conceded,
        awayConceded: data.prediction.away_conceded,
        homePasses: data.prediction.home_passes,
        awayPasses: data.prediction.away_passes,
      },
    },
    // 7. Ad - Fubo TV
    {
      id: "ad-fubo",
      type: "ad_card",
      label: "Stream HD",
      username: "Fubo TV Live",
      avatarColor: "#f97316",
      avatarInitial: "fubo",
      bg: "#ff3e41",
      iconType: "fubo_bubble",
      iconData: {},
      subtitle: "Sponsored",
      data: {
        theme: "fubo",
        titleHtml: "WATCH THE PREMIER LEAGUE<br/>EXCLUSIVELY ON FUBOTV",
        subtitle: "All matches live. All season long.",
        buttonText: "7 Day Free Trial",
        note: "US & Canada Only",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/FuboTV_logo.svg",
        bgImage: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80"
      },
    },
    // 8. Top Scorers – Goals
    {
      id: "top-goals",
      type: "stat_leaderboard",
      label: "Top Goals",
      username: "Thiago",
      avatarUrl: data.top_scorers_goals[1].image,
      avatarColor: "#0A1F44",
      avatarInitial: "⚽",
      bg: "linear-gradient(135deg,#0A1F44,#1B3370)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_goals[1].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "TOP SCORERS", statLabel: "Goals", color: "#1B3370", accentColor: "#60a5fa", players: data.top_scorers_goals },
    },
    // 9. Top Scorers – Assists
    {
      id: "top-assists",
      type: "stat_leaderboard",
      label: "Top Assists",
      username: "Cherki",
      avatarUrl: data.top_scorers_assists[1].image,
      avatarColor: "#0a3d1a",
      avatarInitial: "🅰️",
      bg: "linear-gradient(135deg,#0a3d1a,#1a6b30)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_assists[1].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "TOP ASSISTS", statLabel: "Assists", color: "#1a6b30", accentColor: "#34d399", players: data.top_scorers_assists },
    },
    // 10. Top Tackles
    {
      id: "top-tackles",
      type: "stat_leaderboard",
      label: "Top Tackles",
      username: "Garner",
      avatarUrl: data.top_scorers_tackles[0].image,
      avatarColor: "#3d1a00",
      avatarInitial: "🛡️",
      bg: "linear-gradient(135deg,#3d1a00,#7a3600)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_tackles[0].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "TOP TACKLERS", statLabel: "Tackles", color: "#7a3600", accentColor: "#f59e0b", players: data.top_scorers_tackles },
    },
    // 11. Most Technical
    {
      id: "top-technique",
      type: "stat_leaderboard",
      label: "Top Technique",
      username: "Wirtz",
      avatarUrl: data.top_scorers_technique[0].image,
      avatarColor: "#1a003d",
      avatarInitial: "🎯",
      bg: "linear-gradient(135deg,#1a003d,#38006b)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_technique[0].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "MOST TECHNICAL PLAYERS", statLabel: "Technique", color: "#38006b", accentColor: "#a855f7", players: data.top_scorers_technique },
    },
    // 12. Most Creative
    {
      id: "top-creativity",
      type: "stat_leaderboard",
      label: "Top Creative",
      username: "Fernandes",
      avatarUrl: data.top_scorers_creativity[0].image,
      avatarColor: "#003d3d",
      avatarInitial: "✨",
      bg: "linear-gradient(135deg,#003d3d,#006b6b)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_creativity[0].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "MOST CREATIVE PLAYERS", statLabel: "Creativity", color: "#006b6b", accentColor: "#2dd4bf", players: data.top_scorers_creativity },
    },
    // 13. Fastest Players
    {
      id: "top-fastest",
      type: "stat_leaderboard",
      label: "Fastest",
      username: "Frimpong",
      avatarUrl: data.top_scorers_fastest[0].image,
      avatarColor: "#3d2a00",
      avatarInitial: "⚡",
      bg: "linear-gradient(135deg,#3d2a00,#7a5500)",
      iconType: "leaderboard_bubble",
      iconData: { playerImg: data.top_scorers_fastest[0].image, leagueLogo: data.global.league_logo },
      subtitle: "Premier League 2025/26",
      data: { title: "FASTEST PLAYERS", statLabel: "Pace", color: "#7a5500", accentColor: "#fbbf24", players: data.top_scorers_fastest },
    },
    // 14. Funny Videos
    {
      id: "funny-videos",
      type: "video_reel",
      label: "Footy Bants",
      username: "James",
      avatarInitial: "😂",
      avatarColor: "#1c0a00",
      bg: "linear-gradient(135deg,#1c0a00,#3d1a00)",
      iconType: "emoji",
      iconData: { text: "😂", bg: "linear-gradient(135deg,#1c0a00,#3d1a00)" },
      subtitle: "Funny clips",
      data: { videos: data.funny_videos },
    },
    // 15. Interactive Poll
    {
      id: "interactive-poll",
      type: "interactive_poll",
      label: "Poll",
      username: "Interactive",
      avatarColor: "#1B458F",
      avatarInitial: "IN",
      bg: "#ffffff",
      iconType: "emoji",
      iconData: { text: "🗳️" },
      subtitle: "Join the debate",
      data: {
        commentsCount: 713,
        question: "Arsenal's best young player?",
        centerLogo: data.global.club_logos.away_logo,
      },
    },
  ];
}

// ── Build stories once ─────────────────────────────────────────
const STORIES = buildStories(API_DATA);

// ── Render bubble icon ─────────────────────────────────────────
function BubbleIcon({ story }) {
  const { iconType, iconData, bg } = story;

  if (iconType === "matchup_intro") {
    return (
      <div className="sb-matchup sb-split-v">
        <div className="sb-split-left" style={{ background: iconData.homeColor }}>
          <img src={iconData.homeLogo} alt="" className="sb-logo sb-logo-left" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="sb-split-right" style={{ background: iconData.awayColor }}>
          <img src={iconData.awayLogo} alt="" className="sb-logo sb-logo-right" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      </div>
    );
  }

  if (iconType === "william_hill") {
    return (
      <div className="sb-william-hill">
        <span className="sb-wh-william">William</span>
        <span className="sb-wh-hill">HILL</span>
      </div>
    );
  }

  if (iconType === "table_bubble") {
    return (
      <div className="sb-table-bubble">
        <div className="sb-table-top">
          <img src={iconData.clubLogo} alt="" className="sb-table-club" onError={(e) => { e.target.style.display = "none"; }} />
          <span className="sb-table-rank">1st</span>
        </div>
        <div className="sb-table-bottom">
          <img src={iconData.leagueLogo} alt="" className="sb-table-lion" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      </div>
    );
  }

  if (iconType === "highlights_bubble") {
    return (
      <div className="sb-matchup sb-split-v">
        <div className="sb-split-left" style={{ background: iconData.homeColor }}>
          <img src={iconData.homeLogo} alt="" className="sb-logo sb-logo-left" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="sb-split-right" style={{ background: iconData.awayColor }}>
          <img src={iconData.awayLogo} alt="" className="sb-logo sb-logo-right" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="sb-score-badge">
          <span>{iconData.home} : {iconData.away}</span>
        </div>
      </div>
    );
  }

  if (iconType === "prediction_bubble") {
    return (
      <div className="sb-matchup sb-split-v">
        <div className="sb-split-left" style={{ background: iconData.homeColor }}>
          <img src={iconData.homeLogo} alt="" className="sb-logo sb-logo-left" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="sb-split-right" style={{ background: iconData.awayColor }}>
          <img src={iconData.awayLogo} alt="" className="sb-logo sb-logo-right" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="sb-score-badge sb-form-badge">
          <span>L : W</span>
        </div>
      </div>
    );
  }

  if (iconType === "fubo_bubble") {
    return (
      <div className="sb-fubo">
        <span className="sb-fubo-text">fubo</span>
        <span className="sb-fubo-sub">TV</span>
      </div>
    );
  }

  if (iconType === "leaderboard_bubble") {
    return (
      <div className="sb-leaderboard">
        {/* Progress outer rings */}
        <div className="sb-lb-ring-fill"></div>
        {/* Player face */}
        <img src={iconData.playerImg} alt="" className="sb-lb-face" onError={(e) => { e.target.style.display = "none"; }} />
        {/* PL Lion at the top */}
        <div className="sb-lb-lion-wrap">
          <img src={iconData.leagueLogo} alt="" className="sb-lb-lion" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      </div>
    );
  }

  if (iconType === "imgUrl") {
    return <img src={iconData.url} alt="" className="story-inner-avatar" onError={(e) => { e.target.style.display = "none"; }} />;
  }
  if (iconType === "logo") {
    return (
      <div className="story-inner-text" style={{ background: iconData.bg || bg }}>
        {iconData.lines.map((line, i) => (
          <span key={i} className={`story-logo-line story-logo-line-${i}`}>{line}</span>
        ))}
      </div>
    );
  }
  if (iconType === "score") {
    return (
      <div className="story-inner-score">
        <span>{iconData.home}<small>:</small>{iconData.away}</span>
      </div>
    );
  }
  if (iconType === "emoji" || iconType === "text") {
    return (
      <div className="story-inner-emoji" style={{ background: iconData.bg || bg }}>
        <span>{iconData.text}</span>
      </div>
    );
  }
  if (iconType === "prediction") {
    return (
      <div className="story-inner-prediction">
        <span className="story-pred-pct">{iconData.away}%</span>
        <span className="story-pred-label">WIN</span>
      </div>
    );
  }
  if (iconType === "initial") {
    return (
      <div className="story-inner-initial" style={{ background: iconData.color || bg }}>
        <span>{iconData.initial}</span>
      </div>
    );
  }
  return null;
}

export default function Stories() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("story_seen") || "[]")); }
    catch { return new Set(); }
  });

  const markSeen = (id) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("story_seen", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const openStory = (i) => { setActiveIndex(i); markSeen(STORIES[i].id); };
  const handleNext = () => {
    setActiveIndex((prev) => {
      const next = prev < STORIES.length - 1 ? prev + 1 : null;
      if (next !== null) markSeen(STORIES[next].id);
      return next;
    });
  };
  const handlePrev = () => {
    setActiveIndex((prev) => {
      const next = prev > 0 ? prev - 1 : 0;
      markSeen(STORIES[next].id);
      return next;
    });
  };

  const activeStory = activeIndex !== null ? STORIES[activeIndex] : null;

  return (
    <div className="stories-wrapper">
      <div className="stories-scroll">
        {STORIES.map((s, i) => {
          if (s.hideBubble) return null;
          const seen = seenIds.has(s.id);
          return (
            <button
              key={s.id}
              className={`story-bubble ${seen ? "story-seen" : ""}`}
              onClick={() => openStory(i)}
              aria-label={`View ${s.label} story`}
            >
              <div className="story-ring">
                <div className="story-inner" style={{ background: s.bg }}>
                  <BubbleIcon story={s} />
                </div>
              </div>
              <span className="story-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      {activeIndex !== null && activeStory && (
        <StoryViewer
          story={activeStory}
          storyIndex={activeIndex}
          totalStories={STORIES.length}
          onClose={() => setActiveIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={activeIndex < STORIES.length - 1}
          hasPrev={activeIndex > 0}
        />
      )}
    </div>
  );
}
