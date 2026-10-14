/** Client presentation state. Protected APIs must independently verify the token and grants. */
export interface CouncilSessionUser {
  /** Stable identity from the server-verified subject, preserving current canonical auth. */
  id: string;
  email: string | null;
  name?: string | null;
  role?: string;
  subscriptionTier?: string;
}

export interface CouncilSessionState {
  user: CouncilSessionUser | null;
  token: string | null;
  loading: boolean;
}

export interface CouncilSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const COUNCIL_TOKEN_KEY = "csoai_token";
export const COUNCIL_USER_KEY = "csoai_user";
// Same-tab listeners reverify the server session; restoration itself must never emit this event.
export const COUNCIL_SESSION_CHANGED_EVENT = "council-session-changed";

const emptySession = (): CouncilSessionState => ({ user: null, token: null, loading: false });
type StoredTokenSnapshot = { readable: true; token: string | null } | { readable: false };

function serverUser(value: unknown): CouncilSessionUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const user = value as Record<string, unknown>;
  if (typeof user.email !== "string" || !user.email.trim() || typeof user.name !== "string") return null;
  // These are the existing UI defaults, not authorization or company-library membership.
  const subject = user.email.toLowerCase();
  return { id: subject, email: subject, name: user.name, role: "user", subscriptionTier: "free" };
}

function responseUser(value: unknown): CouncilSessionUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return serverUser((value as Record<string, unknown>).user);
}

function cancelled(): DOMException {
  return new DOMException("Authentication was cancelled", "AbortError");
}

/**
 * Owns one mounted provider's asynchronous session work. Cached user JSON is never an identity.
 * Revision and live-storage checks reject late results after local or cross-tab identity changes,
 * even when a fetch implementation ignores AbortSignal. An unreadable cache fails closed.
 */
export function createCouncilSessionController(options: {
  storage: CouncilSessionStorage | null;
  fetcher: (url: string, init: RequestInit) => Promise<Response>;
  publish: (state: CouncilSessionState) => void;
  authApiBase?: string;
}) {
  let active = true;
  let revision = 0;
  let pending: AbortController | null = null;
  let state: CouncilSessionState = { ...emptySession(), loading: true };

  const emit = (next: CouncilSessionState) => {
    if (!active) return;
    state = next;
    options.publish(next);
  };
  const remove = (key: string) => {
    try { options.storage?.removeItem(key); } catch { /* Storage may be disabled. */ }
  };
  const clearCache = () => { remove(COUNCIL_TOKEN_KEY); remove(COUNCIL_USER_KEY); };
  const cacheUser = (user: CouncilSessionUser) => {
    try { options.storage?.setItem(COUNCIL_USER_KEY, JSON.stringify(user)); } catch { /* Presentation cache only. */ }
  };
  const storedToken = (): StoredTokenSnapshot => {
    if (!options.storage) return { readable: false };
    try { return { readable: true, token: options.storage.getItem(COUNCIL_TOKEN_KEY) }; }
    catch { return { readable: false }; }
  };
  const invalidate = () => {
    revision += 1;
    pending?.abort();
    pending = null;
  };
  const begin = () => {
    invalidate();
    const abort = new AbortController();
    pending = abort;
    return { revision, abort };
  };
  const current = (operation: ReturnType<typeof begin>) =>
    active && revision === operation.revision && !operation.abort.signal.aborted;
  const currentStorage = (operation: ReturnType<typeof begin>, expected: StoredTokenSnapshot) => {
    if (!current(operation)) return false;
    const live = storedToken();
    if (!expected.readable || !live.readable || live.token !== expected.token) {
      // Another tab's identity or an unreadable cache must never be replaced by this old result.
      // Do not touch either shared cache entry; a later explicit restore can verify the new token.
      invalidate();
      emit(emptySession());
      return false;
    }
    return true;
  };
  const clearCapturedCache = (operation: ReturnType<typeof begin>, expected: StoredTokenSnapshot) => {
    if (!currentStorage(operation, expected)) return;
    remove(COUNCIL_USER_KEY);
    if (!currentStorage(operation, expected)) return;
    remove(COUNCIL_TOKEN_KEY);
    // This only publishes a nonidentity. Never publish the old user after removing its token.
    if (current(operation)) emit(emptySession());
  };
  const finish = (operation: ReturnType<typeof begin>) => {
    if (pending === operation.abort) pending = null;
  };

  const restore = async () => {
    if (!active) return;
    const operation = begin();
    emit({ ...emptySession(), loading: true });
    const expected = storedToken();
    if (!currentStorage(operation, expected)) { finish(operation); return; }
    // Remove the untrusted presentation cache even if verification is temporarily unavailable.
    remove(COUNCIL_USER_KEY);
    const token = expected.readable ? expected.token : null;
    if (!token?.trim()) {
      clearCapturedCache(operation, expected);
      finish(operation);
      return;
    }
    try {
      // This verifies the Council origin's session, independently of any login API override.
      const response = await options.fetcher("/api/auth/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: operation.abort.signal,
      });
      if (!currentStorage(operation, expected)) return;
      if (!response.ok) {
        if (response.status === 401) clearCapturedCache(operation, expected);
        else if (currentStorage(operation, expected)) emit(emptySession());
        return;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        clearCapturedCache(operation, expected);
        return;
      }
      if (!currentStorage(operation, expected)) return;
      const user = responseUser(body);
      if (!user) {
        clearCapturedCache(operation, expected);
        return;
      }
      if (!currentStorage(operation, expected)) return;
      // Restoration never writes the token back: it only verifies the still-current token.
      cacheUser(user);
      if (currentStorage(operation, expected)) emit({ user, token, loading: false });
    } catch {
      if (currentStorage(operation, expected)) emit(emptySession());
    } finally {
      finish(operation);
    }
  };

  const authenticate = async (action: "login" | "register", email: string, password: string, name?: string) => {
    if (!active) throw cancelled();
    const operation = begin();
    let expected = storedToken();
    try {
      if (!currentStorage(operation, expected)) throw cancelled();
      const body = action === "register"
        ? { email, password, name: name || email.split("@")[0] }
        : { email, password };
      const response = await options.fetcher(`${options.authApiBase || ""}/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: operation.abort.signal,
      });
      if (!currentStorage(operation, expected)) throw cancelled();
      const result: unknown = await response.json().catch(() => null);
      if (!currentStorage(operation, expected)) throw cancelled();
      if (!response.ok) {
        const error = result && typeof result === "object" ? (result as Record<string, unknown>).error : null;
        throw new Error(typeof error === "string" ? error : action === "login" ? "Login failed" : "Registration failed");
      }
      const user = responseUser(result);
      const token = result && typeof result === "object" ? (result as Record<string, unknown>).token : null;
      if (!user || typeof token !== "string" || !token.trim() || user.email?.toLowerCase() !== email.toLowerCase()) {
        throw new Error("Authentication returned an invalid session");
      }
      if (!currentStorage(operation, expected)) throw cancelled();
      try { options.storage!.setItem(COUNCIL_TOKEN_KEY, token); }
      catch { invalidate(); emit(emptySession()); throw cancelled(); }
      expected = { readable: true, token };
      if (!currentStorage(operation, expected)) throw cancelled();
      cacheUser(user);
      if (!currentStorage(operation, expected)) throw cancelled();
      emit({ user, token, loading: false });
    } catch (error) {
      if (!currentStorage(operation, expected)) throw cancelled();
      emit({ ...state, loading: false });
      throw error;
    } finally {
      finish(operation);
    }
  };

  return {
    restore,
    login: (email: string, password: string) => authenticate("login", email, password),
    signup: (email: string, password: string, name?: string) => authenticate("register", email, password, name),
    logout: () => { invalidate(); clearCache(); emit(emptySession()); },
    dispose: () => { active = false; invalidate(); },
  };
}
