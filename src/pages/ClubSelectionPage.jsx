import { useState, useEffect } from 'react';
import { FiArrowRight, FiSearch } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import './ClubSelectionPage.css';

const ALL_TEAMS = [
  { id: 19, name: 'Arsenal', logo: 'https://cdn.sportmonks.com/images/soccer/teams/19/19.png', country: 'England' },
  { id: 9, name: 'Manchester City', logo: 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png', country: 'England' },
  { id: 14, name: 'Manchester Utd', logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/14.png', country: 'England' },
  { id: 15, name: 'Aston Villa', logo: 'https://cdn.sportmonks.com/images/soccer/teams/15/15.png', country: 'England' },
  { id: 8, name: 'Liverpool', logo: 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png', country: 'England' },
  { id: 35, name: 'Bournemouth', logo: 'https://cdn.sportmonks.com/images/soccer/teams/20/52.png', country: 'England' },
  { id: 45, name: 'Brighton', logo: 'https://cdn.sportmonks.com/images/soccer/teams/14/78.png', country: 'England' },
  { id: 96, name: 'Brentford', logo: 'https://cdn.sportmonks.com/images/soccer/teams/12/236.png', country: 'England' },
  { id: 18, name: 'Chelsea', logo: 'https://cdn.sportmonks.com/images/soccer/teams/18/18.png', country: 'England' },
  { id: 11, name: 'Fulham', logo: 'https://cdn.sportmonks.com/images/soccer/teams/11/11.png', country: 'England' },
  { id: 20, name: 'Newcastle Utd', logo: 'https://cdn.sportmonks.com/images/soccer/teams/20/20.png', country: 'England' },
  { id: 13, name: 'Everton', logo: 'https://cdn.sportmonks.com/images/soccer/teams/13/13.png', country: 'England' },
  { id: 41, name: 'Leeds Utd', logo: 'https://cdn.sportmonks.com/images/soccer/teams/7/71.png', country: 'England' },
  { id: 34, name: 'Crystal Palace', logo: 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png', country: 'England' },
  { id: 38, name: 'Nottm Forest', logo: 'https://cdn.sportmonks.com/images/soccer/teams/31/63.png', country: 'England' },
  { id: 6, name: 'Tottenham', logo: 'https://cdn.sportmonks.com/images/soccer/teams/6/6.png', country: 'England' },
  { id: 1, name: 'West Ham', logo: 'https://cdn.sportmonks.com/images/soccer/teams/1/1.png', country: 'England' },
  { id: 27, name: 'Burnley', logo: 'https://cdn.sportmonks.com/images/soccer/teams/27/27.png', country: 'England' },
  { id: 29, name: 'Wolves', logo: 'https://cdn.sportmonks.com/images/soccer/teams/29/29.png', country: 'England' },
  { id: 246, name: 'Blackburn Rovers', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Blackburn_Rovers.svg/1200px-Blackburn_Rovers.svg.png', country: 'England' },
  { id: 83, name: 'Real Madrid', logo: 'https://cdn.sportmonks.com/images/soccer/teams/2/83.png', country: 'Spain' },
  { id: 81, name: 'Barcelona', logo: 'https://cdn.sportmonks.com/images/soccer/teams/2/81.png', country: 'Spain' },
  { id: 4, name: 'Bayern Munich', logo: 'https://cdn.sportmonks.com/images/soccer/teams/3/4.png', country: 'Germany' },
  { id: 85, name: 'Paris Saint-Germain', logo: 'https://cdn.sportmonks.com/images/soccer/teams/4/85.png', country: 'France' },
  { id: 49, name: 'Juventus', logo: 'https://cdn.sportmonks.com/images/soccer/teams/5/49.png', country: 'Italy' },
];

export default function ClubSelectionPage({ onSuccess, onBack }) {
  const { selectClub } = useAuth();
  const [filteredTeams, setFilteredTeams] = useState(ALL_TEAMS);
  const [searchQuery, setSearchQuery] = useState('');
  // Allow multiple clubs selection
  const [selectedTeams, setSelectedTeams] = useState([]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = ALL_TEAMS.filter(
      (team) =>
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.country?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTeams(filtered);
  };

  const handleToggleTeam = (team) => {
    setSelectedTeams((prev) => {
      const isSelected = prev.some((t) => t.id === team.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== team.id);
      } else {
        return [...prev, team];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedTeams.length > 0) {
      selectClub(selectedTeams);
      onSuccess();
    }
  };

  return (
    <div className="club-selection-container">
      <div className="club-background">
        <div className="club-gradient-blob club-blob-1"></div>
        <div className="club-gradient-blob club-blob-2"></div>
        <div className="club-gradient-blob club-blob-3"></div>
      </div>

      <div className="club-card">
        {onBack && (
          <button type="button" className="club-back-btn" onClick={onBack}>
            ← Keep current clubs
          </button>
        )}
        <div className="club-header">
          <div className="club-logo-icon">
            <img src="/social442-logo.png" alt="" />
          </div>
          <h1 className="club-title">Choose Your Clubs</h1>
          <p className="club-subtitle">Select your favorite teams to customize your feed</p>
        </div>

        <div className="club-search-box">
          <FiSearch className="club-search-icon" />
          <input
            type="text"
            placeholder="Search for your favorite team..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="club-search-input"
          />
        </div>

        <div className="club-grid">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => {
              const isSelected = selectedTeams.some((t) => t.id === team.id);
              return (
                <button
                  key={team.id}
                  className={`club-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleTeam(team)}
                >
                  <div className="club-card-logo">
                    <img src={team.logo} alt={team.name} onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E';
                    }} />
                  </div>
                  <h3 className="club-card-name">{team.name}</h3>
                  <p className="club-card-country">{team.country}</p>
                  {isSelected && (
                    <div className="club-card-badge">✓</div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="club-no-results">
              <p>No teams found matching your search.</p>
            </div>
          )}
        </div>

        {selectedTeams.length > 0 && (
          <div className="club-selection-summary">
            <p className="club-selected-text">
              Selected ({selectedTeams.length}): <strong>{selectedTeams.map(t => t.name).join(', ')}</strong>
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={selectedTeams.length === 0}
          className="club-confirm-btn"
        >
          Continue to App
          <FiArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
