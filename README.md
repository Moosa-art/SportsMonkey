# Social 442 ⚽

An Instagram-style football social app built with React + Vite. The UI stays intact, while the data layer is now driven by a lightweight backend that maps live football data into the existing post cards and pages.

## What changed

The project now has a backend-for-frontend server that keeps the UI untouched while replacing demo content with live or recent football data where free APIs make that possible.

### Dynamic areas now wired

- Home feed
  - At a Glance card → live table + latest match image
  - Match Score card → latest/live match data
  - Match Stats card → real event statistics
  - Highlights card → latest thumbnail/video metadata
  - Fixture card → upcoming or recent league fixtures
  - Formation card → generated from real squad data
  - News list card → backend-generated digest from latest football data
  - Top scorers card → optional real Golden Boot data if `FOOTBALL_DATA_API_KEY` is set
  - Fantasy tips card → optional scorer-driven picks if `FOOTBALL_DATA_API_KEY` is set
- Fixtures page → dynamic season schedule for the configured favourite team
- Table page → live league standings
- Live page → matches grouped by competition for the selected day

### Still static on purpose

A few cards remain seeded because the chosen free APIs do not reliably provide high-quality data for them without moving beyond the current UI contract or inventing values:

- Transfer rumours
- Injury report
- Player ratings
- Betting tips
- Polls / quizzes / shop / meme / podcast / tweet-style posts

## Free APIs used

- TheSportsDB
  - squads
  - results
  - fixtures
  - tables
  - match stats
  - highlight metadata
- football-data.org (optional free token)
  - competition scorers for the Golden Boot / fantasy cards

## Local setup

```bash
npm install
cp .env.example .env
npm run dev:full
```

That starts:

- Vite frontend
- Express backend on `http://localhost:8787`

The Vite dev server proxies `/api/*` to the backend, so the React UI does not need to know backend internals.

## Available scripts

```bash
npm run dev        # frontend only
npm run server     # backend only
npm run dev:full   # backend + frontend together
npm run build      # frontend production build
```

## Environment variables

```bash
PORT=8787
THESPORTSDB_API_KEY=123
VITE_API_BASE_URL=/api
FAVORITE_TEAM_ID=133604
FAVORITE_TEAM_NAME=Arsenal
FEED_LEAGUE_ID=4328
SECONDARY_LEAGUE_ID=4329
FEED_COMPETITION_CODE=PL
FOOTBALL_DATA_API_KEY=
```

## Project structure additions

```bash
server/
  index.js         # Express backend, API aggregation, caching, mapping
src/lib/
  api.js           # frontend fetch helper for the backend routes
```

## Backend routes

- `GET /api/feed`
- `GET /api/fixtures`
- `GET /api/table?league=premier-league|championship`
- `GET /api/live?date=YYYY-MM-DD`
- `GET /api/health`

## Notes

- The backend uses in-memory caching to avoid hammering free endpoints.
- If `FOOTBALL_DATA_API_KEY` is not set, the app still works; only scorer-dependent cards fall back to seeded content.
- The UI layout and CSS were intentionally left alone.
