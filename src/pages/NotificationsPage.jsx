import { useState, useEffect, useRef, useCallback } from 'react';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiUserPlus, FiAtSign, FiBell } from 'react-icons/fi';
import { IoFootballOutline } from 'react-icons/io5';
import { api, connectSocket } from '../lib/api';
import './NotificationsPage.css';

function relativeTime(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return min + 'm';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h';
  const day = Math.floor(hr / 24);
  if (day < 7) return day + 'd';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Pick an icon + accent class based on the notification type.
function iconFor(type) {
  switch (type) {
    case 'new_follower':    return { Icon: FiUserPlus,     tone: 'notif-tone-follow' };
    case 'new_comment':     return { Icon: FiMessageCircle, tone: 'notif-tone-comment' };
    case 'mention_comment': return { Icon: FiAtSign,        tone: 'notif-tone-mention' };
    case 'like':            return { Icon: FiHeart,         tone: 'notif-tone-like' };
    default:                return { Icon: FiBell,          tone: 'notif-tone-default' };
  }
}

function ActorAvatar({ url }) {
  if (url) return <img src={url} alt="" className="notif-avatar" />;
  return (
    <div className="notif-avatar notif-avatar-ph">
      <IoFootballOutline />
    </div>
  );
}

export default function NotificationsPage({ onBack }) {
  const [loading, setLoading]   = useState(true);
  const [items, setItems]       = useState([]);
  const [error, setError]       = useState(null);
  const didMarkRead             = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      setItems(res?.notifications || []);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load, then mark everything read once (server-side).
  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (active && !didMarkRead.current) {
        didMarkRead.current = true;
        api.markNotificationsRead().catch(() => {});
      }
    })();
    return () => { active = false; };
  }, [load]);

  // Live: a new notification arrives -> refresh the list.
  useEffect(() => {
    const socket = connectSocket();
    const onNotif = () => { load(); };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [load]);

  return (
    <div className="notif-page">
      <div className="notif-header">
        <button className="notif-back-btn" onClick={onBack} aria-label="back">
          <FiArrowLeft size={20} />
        </button>
        <h2 className="notif-title">Notifications</h2>
        <span className="notif-head-spacer" />
      </div>

      <div className="notif-list">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="notif-item notif-item-skel">
              <div className="skel-pulse notif-skel-icon" />
              <div className="notif-skel-body">
                <div className="skel-pulse" style={ { width: (50 + i * 6) + '%', height: 12, borderRadius: 6 } } />
                <div className="skel-pulse" style={ { width: '30%', height: 10, borderRadius: 6, marginTop: 8 } } />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="notif-empty">{error}</div>
        ) : items.length === 0 ? (
          <div className="notif-empty">
            <FiBell size={32} className="notif-empty-icon" />
            <p>No notifications yet</p>
            <span>Likes, comments, follows and mentions will show up here.</span>
          </div>
        ) : (
          items.map((n) => {
            const { Icon, tone } = iconFor(n.type);
            const unread = !(Number(n.is_read) || n.is_read === true);
            return (
              <div key={n.id} className={'notif-item ' + (unread ? 'notif-unread' : '')}>
                <div className="notif-avatar-wrap">
                  <ActorAvatar url={n.actor_avatar} />
                  <span className={'notif-type-badge ' + tone}>
                    <Icon size={11} />
                  </span>
                </div>
                <div className="notif-body">
                  <p className="notif-text">
                    {n.actor_username && <strong>@{n.actor_username} </strong>}
                    {n.body || 'sent you a notification'}
                  </p>
                  <span className="notif-time">{relativeTime(n.created_at)}</span>
                </div>
                {unread && <span className="notif-dot" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
