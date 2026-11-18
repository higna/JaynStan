import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '../lib/api';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'superadmin';
  emailVerified: boolean;
  disciplines?: string[];
  hasPassword?: boolean;
};

type AuthResult = { accessToken: string; tokenType: 'Bearer'; user: AuthUser };
type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  setSession: (result: AuthResult) => void;
  updateUser: (user: AuthUser) => void;
  signOut: () => void;
};

const STORAGE_KEY = 'jaynstan.access-token';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Keep one account session per browser profile, shared by all open tabs.
    sessionStorage.removeItem(STORAGE_KEY);
    return localStorage.getItem(STORAGE_KEY);
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!token);
  const updateUser = useCallback((updatedUser: AuthUser) => setUser(updatedUser), []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    const syncCurrentAccount = async () => {
      try {
        const currentUser = await apiRequest<AuthUser>('/auth/me', {}, token);
        if (!cancelled) setUser((previous) => previous ? { ...previous, ...currentUser, disciplines: previous.disciplines, hasPassword: previous.hasPassword } : currentUser);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void syncCurrentAccount(); };
    void syncCurrentAccount();
    const refreshTimer = window.setInterval(refreshWhenVisible, 15000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [token]);

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setUser(null);
      setToken(event.newValue);
      setReady(!event.newValue);
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    ready,
    setSession: (result) => {
      localStorage.setItem(STORAGE_KEY, result.accessToken);
      setToken(result.accessToken);
      setUser(result.user);
      setReady(true);
    },
    updateUser,
    signOut: () => {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setReady(true);
    },
  }), [user, token, ready, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
