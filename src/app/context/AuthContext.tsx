"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  apiKeys: { id: string; key: string; createdAt: string; lastUsed: string }[];
};

type AuthContextType = {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  upgradeTier: (tier: 'pro' | 'enterprise') => void;
  generateApiKey: () => void;
  revokeApiKey: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('csoai_user_session');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // Auto-login for demo purposes
      const demoUser: User = {
        email: 'admin@councilof.ai',
        tier: 'free',
        apiKeys: []
      };
      setUser(demoUser);
      localStorage.setItem('csoai_user_session', JSON.stringify(demoUser));
    }
    setIsLoaded(true);
  }, []);

  const persist = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('csoai_user_session', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('csoai_user_session');
    }
  };

  const login = (email: string) => {
    persist({ email, tier: 'free', apiKeys: [] });
  };

  const logout = () => persist(null);

  const upgradeTier = (tier: 'pro' | 'enterprise') => {
    if (user) persist({ ...user, tier });
  };

  const generateApiKey = () => {
    if (user) {
      const newKey = {
        id: Math.random().toString(36).substr(2, 9),
        key: `csoai_live_${Math.random().toString(36).substr(2, 24)}`,
        createdAt: new Date().toISOString(),
        lastUsed: 'Never'
      };
      persist({ ...user, apiKeys: [...user.apiKeys, newKey] });
    }
  };

  const revokeApiKey = (id: string) => {
    if (user) {
      persist({ ...user, apiKeys: user.apiKeys.filter(k => k.id !== id) });
    }
  };

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, upgradeTier, generateApiKey, revokeApiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
