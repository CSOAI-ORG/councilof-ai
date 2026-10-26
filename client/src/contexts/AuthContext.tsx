/**
 * Authentication presentation state for the signed Council auth API.
 * Restored cache entries require same-origin server verification before rendering a user.
 */
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  createCouncilSessionController,
  COUNCIL_SESSION_CHANGED_EVENT,
  type CouncilSessionState,
  type CouncilSessionUser,
} from '@/lib/councilSession';

interface AuthContextType {
  user: CouncilSessionUser | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CouncilSessionState>({ user: null, token: null, loading: true });
  const controller = useRef<ReturnType<typeof createCouncilSessionController> | null>(null);

  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Storage may be disabled. */ }
    const mountedController = createCouncilSessionController({
      storage,
      fetcher: (url, init) => fetch(url, init),
      publish: setSession,
      authApiBase: ((import.meta as any).env?.VITE_API_BASE) || "",
    });
    controller.current = mountedController;
    void mountedController.restore();
    return () => {
      mountedController.dispose();
      if (controller.current === mountedController) controller.current = null;
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!controller.current) throw new Error("Authentication is not ready");
    await controller.current.login(email, password);
    window.dispatchEvent(new Event(COUNCIL_SESSION_CHANGED_EVENT));
  };
  const signup = async (email: string, password: string, name?: string) => {
    if (!controller.current) throw new Error("Authentication is not ready");
    await controller.current.signup(email, password, name);
    window.dispatchEvent(new Event(COUNCIL_SESSION_CHANGED_EVENT));
  };
  const logout = () => {
    if (!controller.current) return;
    controller.current.logout();
    window.dispatchEvent(new Event(COUNCIL_SESSION_CHANGED_EVENT));
  };

  const { user, token, loading } = session;
  // Presentation helpers only. Protected APIs verify the signed subject and their own grants.
  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'watchdog_analyst' || user?.role === 'admin';
  const isEnterprise = ['enterprise_admin', 'compliance_officer', 'admin'].includes(user?.role || '');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, signup, isAdmin, isAnalyst, isEnterprise }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
