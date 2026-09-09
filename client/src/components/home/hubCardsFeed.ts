import type { HubCardsPayload, HubCardsState } from './HomeGspcBoard';

export const HUB_REFRESH_MS = 600_000;
const RETRY_MS = 60_000;

async function fetchHubCards(url: string): Promise<HubCardsPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    if (!text || text.startsWith('<')) throw new Error(`${url} returned HTML, not JSON`);
    const payload = JSON.parse(text) as HubCardsPayload;
    if (!Array.isArray(payload.cells)) throw new Error(`${url} is not a Hub-card feed`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

/** One cache, request and lifecycle for every mounted homepage/dashboard reader. */
export function createHubCardsFeed(request: () => Promise<HubCardsPayload>) {
  let state: HubCardsState = { data: null, error: null, loading: true };
  let expiresAt = 0;
  let retryAt = 0;
  let inflight: Promise<HubCardsPayload> | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<(state: HubCardsState) => void>();
  const emit = () => { for (const listener of listeners) listener(state); };
  const load = (): Promise<HubCardsPayload> => {
    if (inflight) return inflight;
    if (Date.now() < retryAt) return Promise.reject(new Error(state.error ?? 'Refresh is cooling down'));
    if (state.data && Date.now() < expiresAt) return Promise.resolve(state.data);
    state = { ...state, loading: true };
    // Schedule request before notifying subscribers, so a reentrant load is deduplicated too.
    inflight = Promise.resolve().then(request).then(data => {
      expiresAt = Date.now() + HUB_REFRESH_MS;
      retryAt = 0;
      state = { data, error: null, loading: false };
      return data;
    }).catch((error: unknown) => {
      retryAt = Date.now() + RETRY_MS;
      state = { ...state, error: error instanceof Error ? error.message : String(error), loading: false };
      throw error;
    }).finally(() => { inflight = null; emit(); });
    emit();
    return inflight;
  };
  const refresh = () => {
    // No hidden-tab polling; focus/visibility resume performs a TTL-checked refresh.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    void load().catch(() => { /* error is retained in the shared state */ });
  };
  const subscribe = (listener: (state: HubCardsState) => void) => {
    listeners.add(listener);
    listener(state);
    if (listeners.size === 1) {
      timer = setInterval(refresh, HUB_REFRESH_MS);
      if (typeof window !== 'undefined') window.addEventListener('focus', refresh);
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refresh);
    }
    refresh();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        if (timer !== null) clearInterval(timer);
        timer = null;
        if (typeof window !== 'undefined') window.removeEventListener('focus', refresh);
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', refresh);
      }
    };
  };
  return { load, subscribe };
}

export const hubCardsFeed = createHubCardsFeed(() =>
  fetchHubCards('/api/hub-cards').catch(() => fetchHubCards('https://councilof.ai/api/hub-cards')),
);
