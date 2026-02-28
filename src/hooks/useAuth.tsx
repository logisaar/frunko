import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token from Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      api.setToken(token);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check existing session
    const existingToken = localStorage.getItem('auth_token');
    if (existingToken || token) {
      api
        .getSession()
        .then(({ user }) => {
          setUser(user);
        })
        .catch(() => {
          api.clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const result = await api.signUp(email, password, fullName);
      api.setToken(result.token);
      setUser(result.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await api.signIn(email, password);
      api.setToken(result.token);
      setUser(result.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Redirect to backend Google OAuth flow
      window.location.href = api.getGoogleAuthUrl();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
      api.clearToken();
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}