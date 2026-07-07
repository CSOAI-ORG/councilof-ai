/**
 * Authentication Context
 * Manages user authentication state across the application
 * Integrates with the backend tRPC API for real authentication
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string | null;
  name?: string | null;
  role?: string;
  subscriptionTier?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  isAdmin: boolean;
  isAnalyst: boolean;
  isEnterprise: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'csoai_token';
const USER_KEY = 'csoai_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // tRPC mutations

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored session:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Real signed-auth backend (api-server /api/auth/login). No mock fallback in production —
    // a failed login must surface, not silently "succeed" with a fake account.
    const API = ((import.meta as any).env?.VITE_API_BASE) || "";
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const result = await r.json();
    const u: User = { id: 0, email: result.user?.email ?? email, name: result.user?.name ?? "", role: "user", subscriptionTier: "free" };
    setToken(result.token); setUser(u);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const signup = async (email: string, password: string, name?: string) => {
    // Real signed-auth backend (api-server /api/auth/register). No mock fallback —
    // registration must actually create a persisted, signed account or fail loudly.
    const API = ((import.meta as any).env?.VITE_API_BASE) || "";
    const r = await fetch(`${API}/api/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || email.split("@")[0] }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || "Registration failed");
    }
    const result = await r.json();
    const u: User = { id: 0, email: result.user?.email ?? email, name: result.user?.name ?? "", role: "user", subscriptionTier: "free" };
    setToken(result.token); setUser(u);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  // Role helpers
  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'watchdog_analyst' || user?.role === 'admin';
  const isEnterprise = ['enterprise_admin', 'compliance_officer', 'admin'].includes(user?.role || '');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        signup,
        isAdmin,
        isAnalyst,
        isEnterprise,
      }}
    >
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
