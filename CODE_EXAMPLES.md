# Code Examples - Using New Features

## 🔐 Authentication Examples

### Example 1: Login in a Component
```jsx
import { useAuth } from '../context/AuthContext';

export default function MyComponent() {
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');
    if (result.success) {
      console.log('Logged in successfully!');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}
```

### Example 2: Sign Up
```jsx
import { useAuth } from '../context/AuthContext';

export default function SignUpComponent() {
  const { signup, loading } = useAuth();

  const handleSignUp = async () => {
    const result = await signup(
      'john_doe',           // username
      'John Doe',           // display_name
      'john@example.com',   // email
      'securePassword123'   // password
    );

    if (result.success) {
      // User signed up, now they should select a club
      console.log('Signup successful!');
    }
  };

  return (
    <button onClick={handleSignUp} disabled={loading}>
      {loading ? 'Creating account...' : 'Sign Up'}
    </button>
  );
}
```

### Example 3: Access User Information
```jsx
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, selectedClub, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in first</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.display_name}!</h1>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      {selectedClub && (
        <p>Your Club: {selectedClub.name}</p>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Example 4: Select a Club
```jsx
import { useAuth } from '../context/AuthContext';

export default function ClubSelector() {
  const { selectClub, selectedClub } = useAuth();

  const handleSelectClub = (club) => {
    selectClub(club);
    // Club data now saved and available app-wide
    console.log('Selected club:', club.name);
  };

  return (
    <div>
      {selectedClub && (
        <p>Current club: <strong>{selectedClub.name}</strong></p>
      )}
      <button 
        onClick={() => handleSelectClub({
          id: 1,
          name: 'Manchester United',
          logo: 'https://...'
        })}
      >
        Select Manchester United
      </button>
    </div>
  );
}
```

---

## 🏟️ SportsMonk API Examples

### Example 1: Fetch Teams
```jsx
import { sportsMonkApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function TeamsList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get leagues first
        const leaguesRes = await sportsMonkApi.getLeagues();
        const league = leaguesRes.data[0]; // Get first league
        
        // Get latest season
        const seasonsRes = await sportsMonkApi.getLeagueSeasons(league.id);
        const season = seasonsRes.data[seasonsRes.data.length - 1];
        
        // Get teams for that league/season
        const teamsRes = await sportsMonkApi.getTeams(league.id, season.id);
        setTeams(teamsRes.data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) return <div>Loading teams...</div>;

  return (
    <div>
      <h2>Available Teams</h2>
      {teams.map(team => (
        <div key={team.id}>
          <img src={team.logo} alt={team.name} width="40" />
          <span>{team.name}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Fetch Fixtures for a Team
```jsx
import { sportsMonkApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function TeamFixtures() {
  const { selectedClub } = useAuth();
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    const fetchFixtures = async () => {
      if (!selectedClub) return;

      try {
        // You'll need the current season ID
        const seasonId = 2023; // Example
        
        const res = await sportsMonkApi.getFixturesByTeam(
          selectedClub.id,
          seasonId
        );
        
        setFixtures(res.data);
      } catch (error) {
        console.error('Failed to fetch fixtures:', error);
      }
    };

    fetchFixtures();
  }, [selectedClub]);

  return (
    <div>
      <h2>Upcoming Fixtures - {selectedClub?.name}</h2>
      {fixtures.map(fixture => (
        <div key={fixture.id}>
          <p>
            {fixture.home_team?.name} vs {fixture.away_team?.name}
          </p>
          <p>Date: {new Date(fixture.starts_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Fetch Team Players
```jsx
import { sportsMonkApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function TeamPlayers({ teamId, seasonId }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await sportsMonkApi.getTeamPlayers(teamId, seasonId);
        setPlayers(res.data);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };

    fetchPlayers();
  }, [teamId, seasonId]);

  return (
    <div>
      <h3>Squad</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Number</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.name}</td>
              <td>{player.position?.name}</td>
              <td>{player.number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 4: Fetch League Standings
```jsx
import { sportsMonkApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function LeagueTable({ leagueId, seasonId }) {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await sportsMonkApi.getStandings(leagueId, seasonId);
        setStandings(res.data);
      } catch (error) {
        console.error('Failed to fetch standings:', error);
      }
    };

    fetchStandings();
  }, [leagueId, seasonId]);

  return (
    <div>
      <h3>League Table</h3>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => (
            <tr key={s.team_id}>
              <td>{idx + 1}</td>
              <td>{s.team?.name}</td>
              <td>{s.overall?.games_played}</td>
              <td>{s.overall?.wins}</td>
              <td>{s.overall?.draws}</td>
              <td>{s.overall?.losses}</td>
              <td>{s.total?.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 5: Fetch Top Scorers
```jsx
import { sportsMonkApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function TopScorers({ leagueId, seasonId }) {
  const [scorers, setScorers] = useState([]);

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        const res = await sportsMonkApi.getTopScorers(leagueId, seasonId);
        setScorers(res.data);
      } catch (error) {
        console.error('Failed to fetch top scorers:', error);
      }
    };

    fetchScorers();
  }, [leagueId, seasonId]);

  return (
    <div>
      <h3>Top Scorers</h3>
      <ol>
        {scorers.slice(0, 10).map(s => (
          <li key={s.player_id}>
            <strong>{s.player?.name}</strong> - {s.goals} goals
            <p style={{ fontSize: '0.9em' }}>{s.team?.name}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

---

## 🎬 Stories Component Example

### Using Enhanced Stories
```jsx
import Stories from '../components/Stories';

export default function HomePage() {
  return (
    <div>
      {/* Stories with improved hover effects */}
      <Stories />
      {/* Rest of content */}
    </div>
  );
}
```

The Stories component automatically:
- Shows improved hover animations
- Displays live dots for active stories
- Has smooth scale and translate effects
- Supports different story types (match, highlights, stats, etc.)

---

## 📊 Complete Integration Example

```jsx
import { useAuth } from '../context/AuthContext';
import { sportsMonkApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function ClubDashboard() {
  const { user, selectedClub } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [players, setPlayers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubData = async () => {
      if (!selectedClub) return;

      try {
        setLoading(true);
        const seasonId = 2023; // Current season
        const leagueId = 1; // Premier League

        // Fetch all data in parallel
        const [fixturesRes, playersRes, scorersRes] = await Promise.all([
          sportsMonkApi.getFixturesByTeam(selectedClub.id, seasonId),
          sportsMonkApi.getTeamPlayers(selectedClub.id, seasonId),
          sportsMonkApi.getTopScorers(leagueId, seasonId),
        ]);

        setFixtures(fixturesRes.data);
        setPlayers(playersRes.data);
        setTopScorers(scorersRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch club data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, [selectedClub]);

  if (loading) return <div>Loading club data...</div>;

  return (
    <div>
      <h1>{user.display_name}'s Club Dashboard</h1>
      <h2>{selectedClub?.name}</h2>

      <section>
        <h3>Next Matches</h3>
        {fixtures.slice(0, 3).map(f => (
          <div key={f.id}>
            <p>{f.home_team?.name} vs {f.away_team?.name}</p>
            <p>{new Date(f.starts_at).toLocaleDateString()}</p>
          </div>
        ))}
      </section>

      <section>
        <h3>Squad ({players.length} players)</h3>
        {/* List of players */}
      </section>

      <section>
        <h3>Top Scorers</h3>
        {topScorers.map(s => (
          <div key={s.player_id}>
            <p>{s.player?.name}: {s.goals} goals</p>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## 🎯 Tips & Best Practices

### 1. Always Check Auth State
```jsx
const { isAuthenticated, user } = useAuth();

if (!isAuthenticated) {
  return <p>Please log in</p>;
}
```

### 2. Handle Errors Gracefully
```jsx
try {
  const data = await sportsMonkApi.getTeams(id, season);
  // Use fallback if empty
  setTeams(data.data || FALLBACK_TEAMS);
} catch (error) {
  setTeams(FALLBACK_TEAMS);
}
```

### 3. Use Selected Club Context
```jsx
const { selectedClub } = useAuth();

// Automatically personalize content
useEffect(() => {
  if (selectedClub) {
    fetchClubData(selectedClub.id);
  }
}, [selectedClub]);
```

### 4. Cache API Responses
```jsx
const [cachedTeams, setCachedTeams] = useState({});

const getTeams = async (leagueId, seasonId) => {
  const key = `${leagueId}-${seasonId}`;
  
  if (cachedTeams[key]) {
    return cachedTeams[key];
  }

  const res = await sportsMonkApi.getTeams(leagueId, seasonId);
  setCachedTeams(prev => ({ ...prev, [key]: res.data }));
  return res.data;
};
```

Happy coding! 🚀
