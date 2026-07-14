import { useState, useEffect, useRef, useCallback } from 'react';
import { FiArrowLeft, FiSearch, FiEdit } from 'react-icons/fi';
import { IoFootballOutline } from 'react-icons/io5';
import { SkeletonMessage } from '../components/SkeletonLoader';
import { api, connectSocket } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './InboxPage.css';

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

function clockTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Avatar with a football-icon fallback when the user has no photo.
function Avatar({ url, className }) {
  if (url) return <img src={url} alt="" className={className} />;
  return (
    <div className={className + ' inbox-avatar-ph'}>
      <IoFootballOutline />
    </div>
  );
}

export default function InboxPage({ onBack }) {
  const { user } = useAuth();
  const myId = user?.id != null ? String(user.id) : null;

  const [loading, setLoading]         = useState(true);
  const [convos, setConvos]           = useState([]);
  const [listError, setListError]     = useState(null);
  const [search, setSearch]           = useState('');
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [newMsg, setNewMsg]           = useState('');
  const [msgLoading, setMsgLoading]   = useState(false);
  const [sending, setSending]         = useState(false);

  // "New message" composer state
  const [composeOpen, setComposeOpen] = useState(false);
  const [userQuery, setUserQuery]     = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching]     = useState(false);

  const messagesEndRef = useRef(null);
  const activeConvoRef = useRef(null);
  activeConvoRef.current = activeConvo;

  // ── Load conversation list ───────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.listConversations();
      setConvos(res?.conversations || []);
      setListError(null);
    } catch (e) {
      setListError(e?.message || 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Live incoming messages over the socket ─────────────────
  useEffect(() => {
    const socket = connectSocket();
    const onNew = (payload) => {
      const message = payload?.message;
      if (!message) return;
      const active = activeConvoRef.current;
      const isOpen = active && String(active.id) === String(message.conversation_id);
      const fromMe = myId && String(message.sender_id) === myId;

      if (isOpen) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) return prev;
          return [...prev, message];
        });
        if (!fromMe) api.markConversationRead(active.id).catch(() => {});
      }

      setConvos((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(message.conversation_id));
        if (idx === -1) {
          loadConversations();
          return prev;
        }
        const updated = {
          ...prev[idx],
          last_message_text: message.body,
          last_message_at: message.created_at,
        };
        if (!isOpen && !fromMe) {
          updated.unread_count = (Number(prev[idx].unread_count) || 0) + 1;
        }
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    };
    socket.on('new_message', onNew);
    return () => socket.off('new_message', onNew);
  }, [loadConversations, myId]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open a conversation ────────────────────────────────
  const openConvo = async (c) => {
    setActiveConvo(c);
    setMessages([]);
    setMsgLoading(true);
    try {
      const res = await api.getMessages(c.id, { limit: 40 });
      setMessages(res?.messages || []);
      api.markConversationRead(c.id).catch(() => {});
      setConvos((prev) => prev.map((x) => (String(x.id) === String(c.id) ? { ...x, unread_count: 0 } : x)));
    } catch (e) {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  // ── Send a message (optimistic) ─────────────────────────
  const sendMsg = async (e) => {
    e.preventDefault();
    const text = newMsg.trim();
    if (!text || !activeConvo || sending) return;
    setSending(true);
    setNewMsg('');
    const tempId = 'tmp-' + Date.now();
    const optimistic = {
      id: tempId,
      conversation_id: String(activeConvo.id),
      sender_id: myId,
      body: text,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await api.sendMessage(activeConvo.id, text);
      const saved = res?.message;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)).filter(Boolean));
      setConvos((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(activeConvo.id));
        if (idx === -1) { loadConversations(); return prev; }
        const updated = {
          ...prev[idx],
          last_message_text: text,
          last_message_at: saved?.created_at || optimistic.created_at,
          unread_count: 0,
        };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, failed: true, pending: false } : m)));
    } finally {
      setSending(false);
    }
  };

  // ── New-message composer: debounced people search ───────────
  useEffect(() => {
    if (!composeOpen) return undefined;
    const q = userQuery.trim();
    if (!q) { setUserResults([]); setSearching(false); return undefined; }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await api.searchUsers(q, { signal: ctrl.signal });
        const list = res?.users || res?.results || (Array.isArray(res) ? res : []);
        setUserResults(Array.isArray(list) ? list : []);
      } catch (e) {
        /* aborted or failed */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [userQuery, composeOpen]);

  const startConversation = async (u) => {
    try {
      const res = await api.openConversation(u.id);
      const convo = {
        id: String(res.id),
        other: res.other || {
          id: String(u.id),
          username: u.username,
          display_name: u.display_name || u.username,
          avatar_url: u.avatar_url || null,
          is_verified: !!u.is_verified,
        },
        last_message_text: '',
        last_message_at: null,
        unread_count: 0,
      };
      setComposeOpen(false);
      setUserQuery('');
      setUserResults([]);
      setConvos((prev) => (prev.some((c) => String(c.id) === String(convo.id)) ? prev : [convo, ...prev]));
      openConvo(convo);
    } catch (e) {
      /* ignore */
    }
  };

  const filtered = convos.filter((c) => {
    const o = c.other || {};
    const term = search.toLowerCase();
    return (o.display_name || '').toLowerCase().includes(term) ||
           (o.username || '').toLowerCase().includes(term);
  });

  // ── Active conversation view ──────────────────────────────
  if (activeConvo) {
    const o = activeConvo.other || {};
    return (
      <div className="inbox-chat">
        <div className="inbox-chat-header">
          <button className="inbox-back-btn" onClick={() => setActiveConvo(null)}>
            <FiArrowLeft size={20} />
          </button>
          <div className="inbox-chat-user">
            <div className="inbox-chat-avatar">
              <Avatar url={o.avatar_url} className="inbox-chat-avatar-img" />
            </div>
            <div>
              <div className="inbox-chat-name">
                {o.display_name || o.username}
                {o.is_verified && <span className="inbox-verified">✓</span>}
              </div>
              <div className="inbox-chat-status">@{o.username}</div>
            </div>
          </div>
        </div>

        <div className="inbox-messages">
          {msgLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className={'msg-bubble-wrap ' + (i % 2 === 0 ? 'msg-me' : 'msg-them')}>
                <div className="skel-pulse" style={ { width: (40 + i * 15) + '%', height: 36, borderRadius: 18 } } />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="inbox-empty-thread">No messages yet. Say hello! 👋</div>
          ) : (
            messages.map((m) => {
              const mine = myId && String(m.sender_id) === myId;
              return (
                <div key={m.id} className={'msg-bubble-wrap ' + (mine ? 'msg-me' : 'msg-them')}>
                  <div className={'msg-bubble ' + (mine ? 'bubble-me' : 'bubble-them') + (m.failed ? ' bubble-failed' : '')}>
                    <p>{m.body}</p>
                    <span className="msg-time">
                      {m.failed ? 'Failed' : (m.pending ? 'Sending…' : clockTime(m.created_at))}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="inbox-compose" onSubmit={sendMsg}>
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message…"
            className="inbox-input"
            id="inbox-message-input"
          />
          <button type="submit" className="inbox-send-btn" disabled={!newMsg.trim() || sending} id="inbox-send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    );
  }

  // ── Conversation list view ────────────────────────────────
  return (
    <div className="inbox-page">
      <div className="inbox-header">
        <button className="inbox-back-btn" onClick={onBack}><FiArrowLeft size={20} /></button>
        <h2 className="inbox-title">Messages</h2>
        <button className="inbox-compose-btn" id="inbox-new-msg" onClick={() => setComposeOpen(true)}>
          <FiEdit size={18} />
        </button>
      </div>

      <div className="inbox-search-wrap">
        <FiSearch size={15} className="inbox-search-icon" />
        <input
          id="inbox-search"
          className="inbox-search"
          placeholder="Search messages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="inbox-list">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => <SkeletonMessage key={i} />)
        ) : listError ? (
          <div className="inbox-empty">{listError}</div>
        ) : filtered.length === 0 ? (
          <div className="inbox-empty">
            {convos.length === 0 ? 'No conversations yet. Tap the compose button to start one.' : 'No matches.'}
          </div>
        ) : (
          filtered.map((c) => {
            const o = c.other || {};
            const unread = Number(c.unread_count) || 0;
            return (
              <button key={c.id} className="inbox-item" onClick={() => openConvo(c)} id={'inbox-convo-' + c.id}>
                <div className="inbox-avatar-wrap">
                  <Avatar url={o.avatar_url} className="inbox-avatar" />
                </div>
                <div className="inbox-item-body">
                  <div className="inbox-item-top">
                    <span className="inbox-name">
                      {o.display_name || o.username}
                      {o.is_verified && <span className="inbox-vbadge">✓</span>}
                    </span>
                    <span className="inbox-time">{relativeTime(c.last_message_at)}</span>
                  </div>
                  <div className="inbox-item-bottom">
                    <span className={'inbox-last-msg ' + (unread ? 'unread' : '')}>
                      {c.last_message_text || 'Start the conversation'}
                    </span>
                    {unread > 0 && <span className="inbox-badge">{unread}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {composeOpen && (
        <div className="inbox-compose-overlay" onClick={() => setComposeOpen(false)}>
          <div className="inbox-compose-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="inbox-compose-head">
              <button className="inbox-back-btn" onClick={() => setComposeOpen(false)}><FiArrowLeft size={18} /></button>
              <span>New message</span>
              <span style={ { width: 28 } } />
            </div>
            <div className="inbox-search-wrap">
              <FiSearch size={15} className="inbox-search-icon" />
              <input
                autoFocus
                className="inbox-search"
                placeholder="Search people…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </div>
            <div className="inbox-compose-results">
              {searching ? (
                <div className="inbox-empty">Searching…</div>
              ) : userResults.length === 0 ? (
                <div className="inbox-empty">{userQuery.trim() ? 'No people found.' : 'Type a name or @username.'}</div>
              ) : (
                userResults.map((u) => (
                  <button key={u.id} className="inbox-item" onClick={() => startConversation(u)}>
                    <div className="inbox-avatar-wrap">
                      <Avatar url={u.avatar_url} className="inbox-avatar" />
                    </div>
                    <div className="inbox-item-body">
                      <div className="inbox-item-top">
                        <span className="inbox-name">
                          {u.display_name || u.username}
                          {u.is_verified && <span className="inbox-vbadge">✓</span>}
                        </span>
                      </div>
                      <div className="inbox-item-bottom">
                        <span className="inbox-last-msg">@{u.username}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
