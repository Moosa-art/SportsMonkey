import { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, connectSocket, disconnectSocket } from '../lib/api';
import { favoritesStore } from '../lib/feed/userPrefs';

const AuthContext = createContext();

// Pull the viewer's saved-post ids into the bookmark store so the bookmark icon
// and the "Favourite" feed tab reflect saves made on any device. Best-effort:
// failures keep the local cache.
async function hydrateSavedBookmarks() {
  try {
    const { ids = [] } = await api.getClubSavedIds();
    favoritesStore.replaceAll(ids);
  } catch {
    /* keep the local cache if the request fails */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [selectedClub, setSelectedClub] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore the session on mount.
  //
  // ROOT-CAUSE FIX (auth-persistence bug): the access token is intentionally
  // kept in memory only (XSS-safe), so it is gone after a refresh / new tab /
  // browser restart. Previously checkAuth read the in-memory token, found it
  // null, and skipped restoration — bouncing the user to Sign In.
  //
  // We now ALWAYS attempt a silent re-hydration via the httpOnly refresh
  // cookie (api.bootstrapSession -> POST /auth/refresh). Only if that fails
  // (no/expired refresh token) do we treat the user as logged out. `loading`
  // stays true until this completes, so route guards never render the login
  // screen before hydration finishes (fixes the refresh race condition).
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const restored = await api.bootstrapSession();
        if (restored) {
          const res = await api.getMyProfile();
          const profile = res?.profile || res;
          if (!cancelled && profile) {
            setUser(profile);
            hydrateSavedBookmarks();
            connectSocket();
            const savedClub = localStorage.getItem('selectedClub');
            if (savedClub) {
              try { setSelectedClub(JSON.parse(savedClub)); } catch { /* ignore */ }
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      
      // Validate response structure
      if (!res) {
        const msg = 'No response from server';
        setError(msg);
        return { success: false, error: msg };
      }
      
      if (!res.accessToken || !res.user) {
        const msg = res.error || 'Invalid server response';
        setError(msg);
        return { success: false, error: msg };
      }
      
      setAccessToken(res.accessToken);
      setUser(res.user);
      connectSocket();
      hydrateSavedBookmarks();
      // Restore saved club for returning users
      const savedClub = localStorage.getItem('selectedClub');
      if (savedClub) {
        try { setSelectedClub(JSON.parse(savedClub)); } catch { /* ignore */ }
      }
      return { success: true };
    } catch (err) {
      const errorMsg = err?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, displayName, email, password, role = 'user') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        username,
        display_name: displayName,
        email,
        password,
        role,
      });
      
      // Validate response structure
      if (!res) {
        const msg = 'No response from server';
        setError(msg);
        return { success: false, error: msg };
      }
      
      if (!res.accessToken || !res.user) {
        const msg = res.error || 'Invalid server response';
        setError(msg);
        return { success: false, error: msg };
      }
      
      setAccessToken(res.accessToken);
      setUser(res.user);
      connectSocket();
      return { success: true };
    } catch (err) {
      const errorMsg = err?.message || 'Signup failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const selectClub = (club) => {
    setSelectedClub(club);
    localStorage.setItem('selectedClub', JSON.stringify(club));
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      disconnectSocket();
      setUser(null);
      setSelectedClub(null);
      favoritesStore.reset();
      localStorage.removeItem('selectedClub');
      setLoading(false);
    }
  };

  // Re-fetch the signed-in user's profile and normalise the shape (the /me
  // endpoint wraps it in { profile }, while login/signup return a flat object).
  // Used by Edit Profile (Area 10) so saved changes show immediately.
  const refreshUser = async () => {
    try {
      const res = await api.getMyProfile();
      const profile = res?.profile || res;
      if (profile) setUser(profile);
      return profile;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  };

  const value = {
    user,
    selectedClub,
    loading,
    error,
    login,
    signup,
    selectClub,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
