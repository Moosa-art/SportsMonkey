import { useState, useEffect } from 'react';
import { IoFootballOutline } from 'react-icons/io5';
import { FiCamera, FiMail, FiGrid, FiBarChart2, FiHeart, FiEdit2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import './ProfilePage.css';

const players = [
  { name: 'B. Saka',       img: 'https://i.pravatar.cc/100?img=53', club: 'ARS', clubColor: '#EF0107', following: false },
  { name: 'J. Timber',     img: 'https://i.pravatar.cc/100?img=14', club: 'ARS', clubColor: '#EF0107', following: true },
  { name: 'M. Ødegaard',   img: 'https://i.pravatar.cc/100?img=68', club: 'ARS', clubColor: '#EF0107', following: true },
  { name: 'G. Magalhães',  img: 'https://i.pravatar.cc/100?img=12', club: 'ARS', clubColor: '#EF0107', following: false },
  { name: 'D. Raya',       img: 'https://i.pravatar.cc/100?img=33', club: 'ARS', clubColor: '#EF0107', following: false },
  { name: 'O. Zinchenko',  img: 'https://i.pravatar.cc/100?img=15', club: 'UKR', clubColor: '#FFFFFF', following: true },
  { name: 'G. Jesus',      img: 'https://i.pravatar.cc/100?img=11', club: 'ARS', clubColor: '#EF0107', following: false },
  { name: 'T. Partey',     img: 'https://i.pravatar.cc/100?img=64', club: 'VIL', clubColor: '#FFE667', following: false },
  { name: 'J. Jorginho',   img: 'https://i.pravatar.cc/100?img=51', club: 'FLA', clubColor: '#E60012', following: false },
  { name: 'E. Fernández',  img: 'https://i.pravatar.cc/100?img=17', club: 'CHE', clubColor: '#034694', following: false },
];

export default function ProfilePage({ onBack, onEdit }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [following, setFollowing] = useState(players.map((p) => p.following));
  const [activeTab, setActiveTab] = useState('grid');

  // Always refresh from the server so the profile reflects the latest saved
  // values (e.g. right after editing).
  useEffect(() => {
    let cancelled = false;
    api.getMyProfile()
      .then((res) => {
        const p = res?.profile || res;
        if (!cancelled && p) setProfile(p);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const displayName = profile?.display_name || profile?.username || 'Your name';
  const username = profile?.username ? `@${profile.username}` : '';
  const avatarUrl = profile?.avatar_url || profile?.avatar || '';
  const bio = profile?.bio || '';
  const location = profile?.location || '';
  const clubName = profile?.club_name || '';
  const postCount = profile?.post_count ?? 0;
  const followersCount = profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;

  return (
    <div className="profile-page">
      {/* Mini Header */}
      <div className="pp-header">
        <div className="pp-header-logo">
          <div className="logo-circle"><img src="/social442-logo.png" alt="" /></div>
          <span className="logo-text">Social <span className="logo-442">442</span></span>
        </div>
        <button className="icon-btn" onClick={onBack} aria-label="close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Profile header */}
      <div className="pp-top">
        <div className="pp-avatar-wrap">
          <div className="pp-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={ { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' } } />
              : <IoFootballOutline size={32} color="#FFD700" />}
          </div>
          <div className="pp-camera" onClick={onEdit} role="button" aria-label="edit profile"><FiCamera size={11} /></div>
        </div>

        <div className="pp-info">
          <div className="pp-stats">
            <div className="pp-stat"><span className="pp-stat-num">{postCount}</span><span className="pp-stat-label">Posts</span></div>
            <div className="pp-stat"><span className="pp-stat-num">{followersCount}</span><span className="pp-stat-label">Friends</span></div>
            <div className="pp-stat"><span className="pp-stat-num">{followingCount}</span><span className="pp-stat-label">Following</span></div>
          </div>
        </div>

        <div className="pp-club-bg">
          <div className="pp-club-crest">
            <div className="pp-club-shield">
              <span className="pp-club-rose">🌹</span>
            </div>
            <div className="pp-club-text">{(clubName || 'Blackburn Rovers').toUpperCase()}</div>
            <div className="pp-club-motto">ARTE ET LABORE</div>
          </div>
        </div>
      </div>

      <div className="pp-name-row">
        <div className="pp-name">{displayName}</div>
        <div style={ { display: 'flex', gap: 8 } }>
          <button className="pp-inbox-btn" onClick={onEdit}><FiEdit2 size={12} /> Edit</button>
          <button className="pp-inbox-btn"><FiMail size={12} /> Inbox</button>
        </div>
      </div>

      {(username || bio || location) && (
        <div className="pp-meta" style={ { padding: '0 16px 8px', color: 'rgba(255,255,255,0.75)' } }>
          {username && <div className="pp-username" style={ { fontSize: 13, fontWeight: 600 } }>{username}</div>}
          {bio && <div className="pp-bio" style={ { fontSize: 13, marginTop: 4 } }>{bio}</div>}
          {location && <div className="pp-location" style={ { fontSize: 12, marginTop: 4, opacity: 0.85 } }>📍 {location}</div>}
        </div>
      )}

      {/* Discover players */}
      <div className="pp-content">
        <div className="pp-section-head">
          <h3>Discover players</h3>
          <button className="pp-see-all">See all</button>
        </div>

        <div className="pp-grid">
          {players.map((p, i) => (
            <div className="pp-card" key={i}>
              <div className="pp-card-img">
                <img src={p.img} alt={p.name} />
              </div>
              <div className="pp-card-name">{p.name}</div>
              <div className="pp-card-club" style={ { background: p.clubColor } }>
                <div className="pp-club-mini">{p.club}</div>
              </div>
              <button
                className={`pp-follow-btn ${following[i] ? 'following' : ''}`}
                onClick={() => {
                  const arr = [...following];
                  arr[i] = !arr[i];
                  setFollowing(arr);
                } }
              >
                {following[i] ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            </div>
          ))}
        </div>

        {/* Tab icons */}
        <div className="pp-tabs">
          <button className={`pp-tab ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>
            <FiGrid size={20} />
          </button>
          <button className={`pp-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <FiBarChart2 size={20} />
          </button>
          <button className={`pp-tab ${activeTab === 'liked' ? 'active' : ''}`} onClick={() => setActiveTab('liked')}>
            <FiHeart size={20} />
          </button>
        </div>

        {/* Mini cards row */}
        <div className="pp-mini-cards">
          <div className="pp-mini pp-mini-stats">
            <div className="pp-mini-banner">Player Stats</div>
            <img src="https://i.pravatar.cc/120?img=14" alt="" />
          </div>
          <div className="pp-mini pp-mini-attr">
            <div className="pp-mini-banner">Player Attributes</div>
            <img src="https://i.pravatar.cc/120?img=68" alt="" />
          </div>
          <div className="pp-mini pp-mini-comment">
            <div className="pp-mini-banner-c">{displayName} Comment</div>
            <div className="pp-mini-score">
              <span style={ { fontSize: 11 } }>Arsenal</span>
              <span style={ { fontSize: 18, fontWeight: 800 } }>1 - 0</span>
              <span style={ { fontSize: 11 } }>Burnley</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
