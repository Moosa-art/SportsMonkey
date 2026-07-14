import { useState } from 'react';
import { FiSearch, FiSliders, FiRefreshCw } from 'react-icons/fi';
import { countryFlag } from '../../lib/flags';
import './posts.css';

const SEASONS = ['2025/26', '2024/25', '2023/24'];
const POSITIONS = ['All', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
const COUNTRIES = ['All', 'France', 'England', 'Spain', 'Germany', 'Brazil'];

export default function TransferTargetPost({ data }) {
  const [season, setSeason] = useState(SEASONS[0]);
  const [position, setPosition] = useState('All');
  const [country, setCountry] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = (data.players || []).filter(p => {
    if (position !== 'All' && p.position !== position) return false;
    if (country !== 'All' && p.nationality !== country) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.club.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tt2-card">
      {/* Header */}
      <div className="tt2-header">
        <div className="tt2-title">{data.title || 'Suggest Transfer Target'}</div>
      </div>

      {/* Search + filter row */}
      <div className="tt2-search-row">
        <div className="tt2-search">
          <FiSearch size={13} color="#aaa" />
          <input
            placeholder="Search Players Or Clubs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="tt2-filter-icon"><FiSliders size={14} /></button>
      </div>

      {/* Filter pills */}
      <div className="tt2-filter-row">
        <select className="tt2-select" value={season} onChange={e => setSeason(e.target.value)}>
          {SEASONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="tt2-select" value={position} onChange={e => setPosition(e.target.value)}>
          {POSITIONS.map(p => <option key={p}>{p === 'All' ? 'Position' : p}</option>)}
        </select>
        <select className="tt2-select" value={country} onChange={e => setCountry(e.target.value)}>
          {COUNTRIES.map(c => <option key={c}>{c === 'All' ? 'Country' : c}</option>)}
        </select>
        <button className="tt2-reset" onClick={() => { setPosition('All'); setCountry('All'); setSearch(''); setSeason(SEASONS[0]); }}>
          <FiRefreshCw size={13} />
        </button>
      </div>

      {/* Player list */}
      <div className="tt2-list">
        {filtered.map((p, i) => (
          <div key={i} className="tt2-player-row">
            <div className="tt2-player-left">
              <div className="tt2-avatar">
                <img src={p.img} alt={p.name} onError={e => { e.target.style.display='none'; }} />
                <span>{p.name?.charAt(0)}</span>
              </div>
              <div className="tt2-player-info">
                <div className="tt2-player-name">{p.name}</div>
                <div className="tt2-player-club">
                  <span className="tt2-club-dot">⚽</span> {p.club}
                </div>
              </div>
            </div>
            <div className="tt2-player-right">
              <span className="tt2-pos-badge">{p.position}</span>
              <span className="tt2-nat-flag">
                {countryFlag(p.nationality)
                  ? <img className="tt2-flag-img" src={countryFlag(p.nationality)} alt="" />
                  : '🌍'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


