/**
 * server/index.js — Social 442 backend entry point
 *
 * Start dev:  node --watch server/index.js
 * Start prod: node server/index.js
 *
 * Env vars (copy .env.example → .env):
 *   PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
 *   JWT_SECRET, REFRESH_SECRET, CLIENT_ORIGIN, NODE_ENV
 */

import 'dotenv/config';
import express          from 'express';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import cors             from 'cors';
import cookieParser     from 'cookie-parser';

import { initSocket }   from './socket/index.js';
import authRouter       from './routes/auth.js';
import feedRouter       from './routes/feed.js';
import socialRouter     from './routes/social.js';
import profilesRouter   from './routes/profiles.js';
import footballRouter   from './routes/football.js';
import storiesRouter    from './routes/stories.js';
import clubFeedRouter   from './routes/clubFeed.js';
import leagueTableRouter from './routes/leagueTable.js';
import clubFixturesRouter from './routes/clubFixtures.js';
import clubSocialRouter from './routes/clubSocial.js';
import mediaRouter      from './routes/media.js';
import messagesRouter   from './routes/messages.js';

const PORT          = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const IS_PROD       = process.env.NODE_ENV === 'production';

// Dynamic CORS configuration for development flexibility
const allowedOrigins = [CLIENT_ORIGIN];

const corsOriginOption = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, curl, postman)
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Allow localhost/local IP loopbacks on any port in development
  if (!IS_PROD) {
    const isLocal = /^http:\/\/localhost(:\d+)?$/.test(origin) ||
                    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
                    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
    if (isLocal) {
      return callback(null, true);
    }
  }

  return callback(null, false);
};

// ── Express app ───────────────────────────────────────────────
const app    = express();
const server = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      corsOriginOption,
    credentials: true,
  },
});
initSocket(io);

// ── Global middleware ─────────────────────────────────────────
app.use(cors({
  origin:      corsOriginOption,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Attach io instance to every request so route handlers can emit
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── API routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/feed',     feedRouter);
app.use('/api/social',   socialRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/fixtures', footballRouter);
app.use('/api/table',    footballRouter);
app.use('/api/live',     footballRouter);
app.use('/api/stories',  storiesRouter);
app.use('/api/club-feed',   clubFeedRouter);
app.use('/api/league-table', leagueTableRouter);
app.use('/api/club-fixtures', clubFixturesRouter);
app.use('/api/club-social', clubSocialRouter);
app.use('/api/media',       mediaRouter);
app.use('/api/messages',    messagesRouter);

// ── 404 catch-all ─────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: IS_PROD ? 'Internal server error' : err.message });
});

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅  Social 442 API running on http://localhost:${PORT}`);
  console.log(`🔌  Socket.io  ready`);
  console.log(`🌍  CORS origin: ${CLIENT_ORIGIN}`);
});

// ── Handle port already in use ────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`);
    console.error(`   Kill the existing process with:\n`);
    console.error(`   Windows:  netstat -ano | findstr :${PORT}  (then taskkill /PID <pid> /F)`);
    console.error(`   Mac/Linux: lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  } else {
    console.error('[server error]', err);
    process.exit(1);
  }
});

// ── Graceful shutdown ─────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n⏹  ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('✅  HTTP server closed.');
    process.exit(0);
  });
  // Force-kill if still open after 5 s
  setTimeout(() => {
    console.error('❌  Forced shutdown after timeout.');
    process.exit(1);
  }, 5_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
