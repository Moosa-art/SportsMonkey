import { useState } from 'react';
import { FiSettings, FiEdit2, FiGrid, FiBookmark, FiActivity, FiLogOut, FiUsers, FiBell, FiShield, FiHeart } from 'react-icons/fi';
import { IoFootballOutline } from 'react-icons/io5';
import PostCard from '../components/PostCard';
import SavedPostsTab from '../components/SavedPostsTab';
import { useAuth } from '../context/AuthContext';
import './MePage.css';

// Mock some user-specific posts
const USER_POSTS = [
  {
    id: 'up-1',
    username: 'fazeel_ahmad',
    verified: false,
    userInitial: 'FA',
    userColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    timestamp: '2h ago',
    likes: 42,
    comments: 5,
    type: 'tweet',
    data: {
      tweetText: 'Blackburn Rovers looking sharp in training today! Let\'s go lads 🌹 #COYBR #BlackburnRovers'
    }
  },
  {
    id: 'up-2',
    username: 'fazeel_ahmad',
    verified: false,
    userInitial: 'FA',
    userColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    timestamp: '1d ago',
    likes: 87,
    comments: 12,
    type: 'poll',
    data: {
      question: 'Who should be our signing of the summer?',
      options: [
        { text: 'A new clinical striker', votes: 45 },
        { text: 'A creative central midfielder', votes: 30 },
        { text: 'A commanding centre back', votes: 25 }
      ],
      totalVotes: 124,
      userVoted: false
    }
  }
];

export default function MePage() {
  const { logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // Profile state
  const [bio, setBio] = useState('Die-hard Blackburn Rovers fan. FPL manager & football enthusiast ⚽.');
  const [username, setUsername] = useState('fazeel_ahmad');
  const [name, setName] = useState('Fazeel Ahmad');
  const [selectedClub, setSelectedClub] = useState('Blackburn Rovers');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setShowEditProfile(false);
  };

  return (
    <div className="me-page">
      {/* Cover Header */}
      <div className="me-cover">
        <div className="me-cover-overlay" />
        <div className="me-cover-crest">
          <IoFootballOutline size={44} color="rgba(255,255,255,0.15)" />
        </div>
        
        <div className="me-header-actions">
          <button className="me-header-btn" onClick={() => setShowSettings(true)} id="me-settings-btn" aria-label="settings">
            <FiSettings size={18} />
          </button>
        </div>
      </div>

      {/* Profile Info Container */}
      <div className="me-info-container">
        <div className="me-avatar-row">
          <div className="me-avatar">
            <span>FA</span>
          </div>
          <div className="me-action-buttons">
            <button className="me-edit-btn" onClick={() => setShowEditProfile(true)} id="me-edit-profile-btn">
              <FiEdit2 size={13} /> Edit Profile
            </button>
          </div>
        </div>

        <div className="me-user-meta">
          <h2 className="me-fullname">{name}</h2>
          <span className="me-handle">@{username}</span>
          <div className="me-club-badge-tag">
            <span className="me-club-icon">🌹</span> {Array.isArray(selectedClub) ? selectedClub.map(c => c.name).join(', ') : selectedClub?.name || selectedClub}
          </div>
          <p className="me-bio">{bio}</p>
        </div>

        {/* User Stats */}
        <div className="me-stats-row">
          <div className="me-stat-box">
            <span className="me-stat-val">146</span>
            <span className="me-stat-lbl">Posts</span>
          </div>
          <div className="me-stat-box">
            <span className="me-stat-val">2.4K</span>
            <span className="me-stat-lbl">Reputation</span>
          </div>
          <div className="me-stat-box">
            <span className="me-stat-val">15</span>
            <span className="me-stat-lbl">Saved</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="me-tabs">
        <button 
          className={`me-tab-btn ${activeSubTab === 'posts' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('posts')}
          id="me-tab-posts"
        >
          <FiGrid size={16} />
          <span>My Posts</span>
        </button>
        <button 
          className={`me-tab-btn ${activeSubTab === 'saved' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('saved')}
          id="me-tab-saved"
        >
          <FiBookmark size={16} />
          <span>Saved</span>
        </button>
        <button 
          className={`me-tab-btn ${activeSubTab === 'activity' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('activity')}
          id="me-tab-activity"
        >
          <FiActivity size={16} />
          <span>Activity</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="me-tab-content">
        {activeSubTab === 'posts' && (
          <div className="me-posts-list">
            {USER_POSTS.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {activeSubTab === 'saved' && <SavedPostsTab />}

        {activeSubTab === 'activity' && (
          <div className="me-activity-list">
            <div className="me-activity-item">
              <div className="me-act-icon"><FiHeart size={14} color="var(--accent-red)" /></div>
              <div className="me-act-text">
                You liked <strong>@fabrizio.romano</strong>'s post about Viktor Gyökeres.
                <span className="me-act-time">3h ago</span>
              </div>
            </div>
            <div className="me-activity-item">
              <div className="me-act-icon"><IoFootballOutline size={14} color="var(--accent-blue)" /></div>
              <div className="me-act-text">
                You voted on <strong>@SkySports</strong>'s poll: "Who wins the Premier League?".
                <span className="me-act-time">1d ago</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal Sheet */}
      {showSettings && (
        <div className="me-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="me-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="me-modal-drag" />
            <div className="me-modal-header">
              <h3>Settings</h3>
              <button className="me-modal-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="me-settings-list">
              <button className="me-settings-item">
                <FiBell className="me-settings-icon" />
                <span>Notifications</span>
              </button>
              <button className="me-settings-item">
                <FiShield className="me-settings-icon" />
                <span>Privacy & Safety</span>
              </button>
              <button className="me-settings-item">
                <FiUsers className="me-settings-icon" />
                <span>Blocked Accounts</span>
              </button>
              <button className="me-settings-item logout" onClick={logout}>
                <FiLogOut className="me-settings-icon" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Sheet */}
      {showEditProfile && (
        <div className="me-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="me-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="me-modal-drag" />
            <div className="me-modal-header">
              <h3>Edit Profile</h3>
              <button className="me-modal-close" onClick={() => setShowEditProfile(false)}>×</button>
            </div>
            <form className="me-edit-form" onSubmit={handleSaveProfile}>
              <div className="me-form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="me-input"
                  required
                />
              </div>
              <div className="me-form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="me-input"
                  required
                />
              </div>
              <div className="me-form-group">
                <label>Bio</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  className="me-textarea"
                  maxLength={160}
                />
              </div>
              <div className="me-form-group">
                <label>Club Association</label>
                <select 
                  value={Array.isArray(selectedClub) ? selectedClub.map(c => c.name).join(', ') : selectedClub?.name || selectedClub} 
                  onChange={e => setSelectedClub(e.target.value)}
                  className="me-select"
                >
                  <option value="Blackburn Rovers">Blackburn Rovers</option>
                  <option value="Arsenal">Arsenal</option>
                  <option value="Chelsea">Chelsea</option>
                  <option value="Manchester United">Manchester United</option>
                  <option value="Liverpool">Liverpool</option>
                </select>
              </div>
              <button type="submit" className="me-save-btn" id="me-save-profile-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
