/**
 * src/lib/socket.js — Realtime foundation (Risk R1 mitigation).
 *
 * A thin, React-friendly layer over the Socket.io client that already lives in
 * `api.js` (connectSocket / getSocket / disconnectSocket). Feature code should
 * import the hooks from here rather than touching the raw client, so that
 * notifications, like/comment sync, live scores, and the DM/chat module all
 * share ONE connection and a consistent subscribe/unsubscribe contract.
 *
 * Server room + event contract (see server/socket/index.js):
 *   Rooms:   user:{id} (private)  | post:{id}  | live:{YYYY-MM-DD}  | feed
 *   Join:    emit 'subscribe_post'  { postId }
 *            emit 'subscribe_live'  { date }
 *            emit 'subscribe_feed'
 *   Leave:   emit 'unsubscribe_post' / 'unsubscribe_live'
 *   Events:  'like_updated', 'new_comment', 'live_score_update', 'new_post',
 *            'user_typing', 'user_stopped_typing', plus notification/DM events.
 */

import { useEffect, useRef } from 'react';
import { connectSocket, getSocket, disconnectSocket } from './api';

export { connectSocket, getSocket, disconnectSocket };

/**
 * Subscribe to a socket event for the lifetime of a component.
 *
 * The handler is stored in a ref, so you can pass an inline arrow function
 * without causing a resubscribe on every render — the latest handler is always
 * invoked. Pass `enabled = false` to temporarily pause the subscription.
 *
 * @param {string}   event    server event name, e.g. 'like_updated'
 * @param {Function} handler  (...payload) => void
 * @param {boolean}  [enabled=true]
 *
 * @example
 *   useSocketEvent('like_updated', ({ postId, like_count }) => {
 *     if (postId === id) setLikes(like_count);
 *   });
 */
export function useSocketEvent(event, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled || !event) return undefined;
    const socket = connectSocket();
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event, enabled]);
}

const ROOM_DEFS = {
  post: (id) => ['subscribe_post', 'unsubscribe_post', { postId: id }],
  live: (id) => ['subscribe_live', 'unsubscribe_live', { date: id }],
  feed: () => ['subscribe_feed', null, undefined],
};

/**
 * Join a server room for the lifetime of a component and leave on unmount.
 *
 * @param {'post'|'live'|'feed'} kind
 * @param {string|number} [id]  required for 'post' (postId) and 'live' (date)
 *
 * @example
 *   useSocketRoom('post', postId);   // live like/comment updates for one post
 *   useSocketRoom('live', '2026-06-24');
 *   useSocketRoom('feed');           // global new-post broadcasts
 */
export function useSocketRoom(kind, id) {
  useEffect(() => {
    const def = ROOM_DEFS[kind];
    if (!def) return undefined;
    if (kind !== 'feed' && (id === undefined || id === null || id === '')) {
      return undefined;
    }
    const [subscribe, unsubscribe, payload] = def(id);
    const socket = connectSocket();
    socket.emit(subscribe, payload);
    return () => {
      if (unsubscribe) socket.emit(unsubscribe, payload);
    };
  }, [kind, id]);
}

/**
 * Imperative emit helper for one-off events (e.g. typing indicators) where a
 * hook would be awkward. Safe to call before the socket finishes connecting —
 * the underlying proxy buffers emits until the client is live.
 *
 * @param {string} event
 * @param {object} [payload]
 */
export function emitSocket(event, payload) {
  if (!event) return;
  connectSocket().emit(event, payload);
}
