
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../utils/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the current user's profile and update authentication state.
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me/');
      const userData = res.data?.data || res.data;

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch {
      setUser(null);
      setIsAuthenticated(false);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check the current session when the provider mounts.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void refreshUser();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  // Normal email/password login.
  const login = async (email, password) => {
    const res = await api.post('/api/users/login/', {
      email,
      password,
    });

    const userData =
      res.data?.data?.user ||
      res.data?.user ||
      res.data;

    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  };

  // Google login.
  const googleLogin = async (token) => {
    const res = await api.post('/api/users/google-login/', {
      token,
    });

    const userData =
      res.data?.data?.user ||
      res.data?.user ||
      res.data;

    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  };

  // Log out and clear local authentication state.
  const logout = async () => {
    try {
      await api.post('/api/users/logout/');
    } catch {
      // Clear local authentication even if the request fails.
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user fields locally after a profile update.
  const updateUser = (updates) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    googleLogin,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}

export default AuthContext;
