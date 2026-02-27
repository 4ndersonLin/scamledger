import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@cryptoscam/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const result = await api.get<User>('/auth/me');
      if (result.success) {
        setState({ user: result.data, isLoggedIn: true, loading: false });
      } else {
        setState({ user: null, isLoggedIn: false, loading: false });
      }
    } catch {
      setState({ user: null, isLoggedIn: false, loading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setState({ user: null, isLoggedIn: false, loading: false });
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ ...state, checkAuth, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
