import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { FiArrowLeft, FiCamera, FiCheck, FiX } from 'react-icons/fi';
import { IoFootballOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { api, uploadMedia } from '../lib/api';
import './EditProfilePage.css';

// ── Canvas helpers: turn the cropped region into a JPEG File ──────────
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, canvas.width, canvas.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}

function usernameHint(status) {
  switch (status) {
    case 'checking': return 'Checking availability…';
    case 'available': return '✓ Available';
    case 'taken': return '✗ Already taken';
    case 'invalid': return '3–30 chars: letters, numbers, dot, underscore';
    default: return '';
  }
}

function maxDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().slice(0, 10);
}

export default function EditProfilePage({ onBack }) {
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [original, setOriginal] = useState({});

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [clubId, setClubId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [unameStatus, setUnameStatus] = useState('idle');
  const [teams, setTeams] = useState([]);

  // Cropper state
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);

  // Load the current profile into the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getMyProfile();
        const p = (res && res.profile) || res || {};
        if (cancelled) return;
        setOriginal(p);
        setDisplayName(p.display_name || '');
        setUsername(p.username || '');
        setBio(p.bio || '');
        setLocation(p.location || '');
        setDob(p.date_of_birth ? String(p.date_of_birth).slice(0, 10) : '');
        setClubId(p.favourite_club_id ? String(p.favourite_club_id) : '');
        setTeamId(p.favourite_team_id ? String(p.favourite_team_id) : '');
        setAvatarUrl(p.avatar_url || '');
      } catch (err) {
        if (!cancelled) setError('Could not load your profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load the club/team list for the pickers.
  useEffect(() => {
    api.listTeams()
      .then((res) => setTeams((res && res.teams) || []))
      .catch(() => { });
  }, []);

  // Debounced username availability check.
  useEffect(() => {
    if (!original.username) return undefined;
    const uname = username.trim().toLowerCase();
    if (uname === (original.username || '').toLowerCase()) {
      setUnameStatus('idle');
      return undefined;
    }
    if (!/^[a-z0-9._]{3,30}$/.test(uname)) {
      setUnameStatus('invalid');
      return undefined;
    }
    setUnameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(uname);
        setUnameStatus(res && res.available ? 'available' : 'taken');
      } catch {
        setUnameStatus('idle');
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [username, original.username]);

  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const blob = await getCroppedBlob(rawImage, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const media = await uploadMedia(file, { kind: 'image', use: 'avatar' });
      const url = (media && (media.url || media.thumbnail_url)) || '';
      if (!url) throw new Error('Upload did not return a URL');
      setAvatarUrl(url);
      setRawImage(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (err) {
      setError((err && err.message) || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const buildDiff = () => {
    const diff = {};
    if (displayName.trim() !== (original.display_name || '')) diff.display_name = displayName.trim();
    const unameLc = username.trim().toLowerCase();
    if (unameLc && unameLc !== (original.username || '').toLowerCase()) diff.username = unameLc;
    if (bio !== (original.bio || '')) diff.bio = bio;
    if (location !== (original.location || '')) diff.location = location;
    const origDob = original.date_of_birth ? String(original.date_of_birth).slice(0, 10) : '';
    if (dob !== origDob) diff.date_of_birth = dob;
    const origClub = original.favourite_club_id ? String(original.favourite_club_id) : '';
    if (clubId !== origClub) diff.favourite_club_id = clubId ? Number(clubId) : null;
    const origTeam = original.favourite_team_id ? String(original.favourite_team_id) : '';
    if (teamId !== origTeam) diff.favourite_team_id = teamId ? Number(teamId) : null;
    if (avatarUrl !== (original.avatar_url || '')) diff.avatar_url = avatarUrl;
    return diff;
  };

  const handleSave = async () => {
    setError('');
    if (!displayName.trim()) { setError('Display name is required.'); return; }
    if (unameStatus === 'taken') { setError('That username is already taken.'); return; }
    if (unameStatus === 'invalid') { setError('Please choose a valid username.'); return; }

    const diff = buildDiff();
    if (!Object.keys(diff).length) { setToast('No changes to save'); return; }

    setSaving(true);
    try {
      await api.updateMyProfile(diff);
      if (refreshUser) await refreshUser();
      setToast('Profile updated');
      setTimeout(() => { if (onBack) onBack(); }, 900);
    } catch (err) {
      setError((err && err.message) || 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-page">
        <div className="ep-loading"><div className="loader" /></div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="ep-header">
        <button className="ep-back" onClick={onBack} aria-label="back"><FiArrowLeft size={20} /></button>
        <h2 className="ep-title">Edit Profile</h2>
        <button className="ep-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error ? <div className="ep-error">{error}</div> : null}

      <div className="ep-avatar-section">
        <div className="ep-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" />
            : <IoFootballOutline size={44} color="#FFD700" />}
          <button className="ep-avatar-edit" onClick={() => fileInputRef.current && fileInputRef.current.click()} aria-label="change avatar">
            <FiCamera size={14} />
          </button>
        </div>
        <button className="ep-change-photo" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Change photo</button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickFile} style={ { display: 'none' } } />
      </div>

      <div className="ep-fields">
        <label className="ep-field">
          <span className="ep-label">Display name</span>
          <input className="ep-input" value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </label>

        <label className="ep-field">
          <span className="ep-label">Username</span>
          <div className="ep-username-row">
            <span className="ep-at">@</span>
            <input className="ep-input" value={username} maxLength={30} onChange={(e) => setUsername(e.target.value.replace(/ /g, ''))} placeholder="username" />
          </div>
          <span className={`ep-hint ep-hint-${unameStatus}`}>{usernameHint(unameStatus)}</span>
        </label>

        <label className="ep-field">
          <span className="ep-label">Bio</span>
          <textarea className="ep-textarea" value={bio} maxLength={300} rows={3} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself" />
        </label>

        <label className="ep-field">
          <span className="ep-label">Location</span>
          <input className="ep-input" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </label>

        <label className="ep-field">
          <span className="ep-label">Date of birth</span>
          <input className="ep-input" type="date" value={dob} max={maxDob()} onChange={(e) => setDob(e.target.value)} />
        </label>

        <label className="ep-field">
          <span className="ep-label">Favourite club</span>
          <select className="ep-input" value={clubId} onChange={(e) => setClubId(e.target.value)}>
            <option value="">Select a club</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="ep-field">
          <span className="ep-label">Favourite team</span>
          <select className="ep-input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Select a team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
      </div>

      {rawImage ? (
        <div className="ep-crop-overlay">
          <div className="ep-crop-box">
            <div className="ep-crop-area">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input className="ep-zoom" type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            <div className="ep-crop-actions">
              <button className="ep-crop-cancel" onClick={() => setRawImage(null)} disabled={uploadingAvatar}>
                <FiX size={16} /> Cancel
              </button>
              <button className="ep-crop-confirm" onClick={confirmCrop} disabled={uploadingAvatar}>
                <FiCheck size={16} /> {uploadingAvatar ? 'Uploading…' : 'Use photo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="ep-toast">{toast}</div> : null}
    </div>
  );
}
