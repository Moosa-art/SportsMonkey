/**
 * server/socket/index.js
 *
 * Real-time sync with Socket.io.
 *
 * Room conventions:
 *   user:{userId}        — per-user private channel (notifications, DMs)
 *   post:{postId}        — post room (likes, new comments)
 *   live:{date}          — live scores room (e.g. live:2026-06-05)
 *   feed                 — global feed room (new posts broadcast)
 *
 * Authentication:
 *   Client sends Bearer token in auth handshake.
 *   Unauthenticated clients can join public rooms (post:*, live:*).
 *   Only authenticated clients can join user:* rooms.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

export function initSocket(io) {
  // ── Auth middleware ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, JWT_SECRET);
      } catch {
        socket.user = null; // token invalid — allow as guest
      }
    } else {
      socket.user = null;
    }
    next();
  });

  // ── Connection handler ────────────────────────────────────────
  io.on('connection', (socket) => {
    const uid = socket.user?.id;
    if (uid) {
      // Authenticated: join personal room immediately
      socket.join(`user:${uid}`);
      console.log(`[socket] user:${uid} connected (${socket.id})`);
    } else {
      console.log(`[socket] guest connected (${socket.id})`);
    }

    // ── Client-driven room subscriptions ─────────────────────

    /**
     * subscribe_post — join the room for a specific post.
     * Client sends: { postId }
     */
    socket.on('subscribe_post', ({ postId } = {}) => {
      if (!postId) return;
      socket.join(`post:${postId}`);
    });

    socket.on('unsubscribe_post', ({ postId } = {}) => {
      if (!postId) return;
      socket.leave(`post:${postId}`);
    });

    /**
     * subscribe_live — join the live scores room for a date.
     * Client sends: { date: 'YYYY-MM-DD' }
     */
    socket.on('subscribe_live', ({ date } = {}) => {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      socket.join(`live:${date}`);
    });

    socket.on('unsubscribe_live', ({ date } = {}) => {
      if (!date) return;
      socket.leave(`live:${date}`);
    });

    /**
     * subscribe_feed — join global feed room (new post broadcasts).
     */
    socket.on('subscribe_feed', () => {
      socket.join('feed');
    });

    // ── Client typing indicator (for future comment threading) ──
    socket.on('typing_start', ({ postId } = {}) => {
      if (!postId || !socket.user) return;
      socket.to(`post:${postId}`).emit('user_typing', {
        postId,
        userId:   socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on('typing_stop', ({ postId } = {}) => {
      if (!postId || !socket.user) return;
      socket.to(`post:${postId}`).emit('user_stopped_typing', {
        postId,
        userId: socket.user.id,
      });
    });

    // ── Direct-message typing indicators ───────────────────────
    socket.on('dm_typing_start', ({ conversationId, toUserId } = {}) => {
      if (!socket.user || !toUserId) return;
      socket.to(`user:${toUserId}`).emit('dm_typing', {
        conversationId,
        fromUserId: socket.user.id,
        typing:     true,
      });
    });

    socket.on('dm_typing_stop', ({ conversationId, toUserId } = {}) => {
      if (!socket.user || !toUserId) return;
      socket.to(`user:${toUserId}`).emit('dm_typing', {
        conversationId,
        fromUserId: socket.user.id,
        typing:     false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] ${uid ? `user:${uid}` : 'guest'} disconnected (${socket.id})`);
    });
  });

  console.log('[socket] Socket.io initialised');
}

/**
 * Broadcast a live score update to all subscribers of a date room.
 * Called by an external score-update job / webhook handler.
 *
 * @param {import('socket.io').Server} io
 * @param {string} date         'YYYY-MM-DD'
 * @param {object} matchUpdate  { id, home, homeScore, away, awayScore, status }
 */
export function broadcastLiveScore(io, date, matchUpdate) {
  io.to(`live:${date}`).emit('live_score_update', matchUpdate);
}

/**
 * Broadcast a new post to feed subscribers.
 * Called after a post is inserted.
 */
export function broadcastNewPost(io, post) {
  io.to('feed').emit('new_post', post);
}
