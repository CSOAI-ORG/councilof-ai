/** Private account-name editing through the existing signed Council session. */
export interface PrivateProfileIdentity { email: string; token: string }
export interface PrivateProfile { email: string; name: string }
export interface PrivateProfileState {
  phase: "loading" | "ready" | "saving" | "saved" | "unconfirmed" | "error";
  profile: PrivateProfile | null;
  message: string | null;
}

export function validPrivateProfileName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 120 && !/[\u0000-\u001f\u007f]/.test(name);
}

/**
 * One mounted account owns this controller. Late responses after logout, a token
 * change, or disposal cannot publish another account's profile or a saved state.
 * A failed/uncertain write is never retried; Reopen performs a read only.
 */
export function createPrivateProfileController(options: {
  identity: PrivateProfileIdentity;
  currentIdentity: () => PrivateProfileIdentity | null;
  fetcher: (url: string, init: RequestInit) => Promise<Response>;
  publish: (state: PrivateProfileState) => void;
}) {
  const identity = { ...options.identity, email: options.identity.email.toLowerCase() };
  let mounted = true;
  let busy = false;
  let pending: AbortController | null = null;
  let attemptedName: string | null = null;
  let state: PrivateProfileState = { phase: "loading", profile: null, message: null };
  const current = () => {
    if (!mounted) return false;
    try {
      const live = options.currentIdentity();
      return !!live && live.token === identity.token && live.email.toLowerCase() === identity.email;
    } catch { return false; }
  };
  const emit = (next: PrivateProfileState) => {
    if (!current()) return;
    state = next;
    options.publish(next);
  };
  const request = (method: "GET" | "PUT", signal: AbortSignal, name?: string) =>
    options.fetcher("/api/auth/profile", {
      method, cache: "no-store", signal,
      headers: { Authorization: `Bearer ${identity.token}`, ...(method === "PUT" ? { "Content-Type": "application/json" } : {}) },
      ...(method === "PUT" ? { body: JSON.stringify({ name }) } : {}),
    });
  const profileFrom = (value: unknown): PrivateProfile | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const body = value as Record<string, unknown>;
    if (body.visibility !== "private" || !body.user || typeof body.user !== "object" || Array.isArray(body.user)) return null;
    const user = body.user as Record<string, unknown>;
    if (typeof user.email !== "string" || user.email.toLowerCase() !== identity.email ||
        typeof user.name !== "string") return null;
    return { email: identity.email, name: user.name };
  };
  const read = async (signal: AbortSignal) => {
    const response = await request("GET", signal);
    if (!current()) return null;
    const body: unknown = await response.json().catch(() => null);
    if (!current()) return null;
    const profile = response.ok ? profileFrom(body) : null;
    if (!profile) throw new Error("Your private profile could not be read. Reopen it to try another read.");
    return profile;
  };
  const uncertain = (profile = state.profile) => emit({
    phase: "unconfirmed", profile,
    message: "Save not confirmed. Reopen your profile to check the stored name before making another change.",
  });
  const load = async () => {
    if (!current() || busy) return;
    busy = true;
    const abort = new AbortController();
    pending = abort;
    emit({ ...state, phase: "loading", message: null });
    try {
      const profile = await read(abort.signal);
      if (!profile || !current()) return;
      if (attemptedName !== null && profile.name !== attemptedName) { uncertain(profile); return; }
      const recovered = attemptedName !== null;
      attemptedName = null;
      emit({ phase: "ready", profile, message: recovered ? "The stored name matches your requested name. The earlier save response remains unconfirmed." : null });
    } catch {
      if (attemptedName !== null) uncertain();
      else emit({ ...state, phase: "error", message: "Your private profile could not be read. Reopen it to try another read." });
    } finally {
      if (pending === abort) pending = null;
      busy = false;
    }
  };
  const save = async (name: string) => {
    if (!current() || busy || attemptedName !== null ||
        (state.phase !== "ready" && state.phase !== "saved") || !state.profile) return;
    const normalized = name.trim();
    if (!validPrivateProfileName(name)) {
      emit({ ...state, message: "Enter a name of 1 to 120 characters without control characters." });
      return;
    }
    if (normalized === state.profile.name) return;
    busy = true;
    attemptedName = normalized;
    const abort = new AbortController();
    pending = abort;
    emit({ ...state, phase: "saving", message: null });
    try {
      const response = await request("PUT", abort.signal, normalized);
      if (!current()) return;
      const body: unknown = await response.json().catch(() => null);
      if (!current()) return;
      const written = response.ok ? profileFrom(body) : null;
      if (!written || written.name !== normalized || (body as Record<string, unknown>).saved !== true) {
        uncertain(); return;
      }
      // A PUT response alone cannot confirm what a separately reopened read sees.
      const reopened = await read(abort.signal);
      if (!reopened || !current()) return;
      if (reopened.name !== normalized) { uncertain(reopened); return; }
      attemptedName = null;
      emit({ phase: "saved", profile: reopened, message: "Your private name was saved and read back." });
    } catch { uncertain(); }
    finally {
      if (pending === abort) pending = null;
      busy = false;
    }
  };
  return {
    load, save,
    dispose: () => { mounted = false; pending?.abort(); pending = null; },
  };
}
