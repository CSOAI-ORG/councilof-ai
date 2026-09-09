import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHubCardsFeed, HUB_REFRESH_MS } from './hubCardsFeed';
import type { HubCardsPayload, HubCardsState } from './HomeGspcBoard';

const snapshot = (date: string): HubCardsPayload => ({ as_of: date, cells: [] });
const flush = async () => { await vi.advanceTimersByTimeAsync(0); };
let win: EventTarget;
let doc: EventTarget & { visibilityState: string };
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  win = new EventTarget();
  doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('shared living Hub feed', () => {
  it('deduplicates concurrent loads and subscribers, then replaces an expired snapshot', async () => {
    let resolve!: (value: HubCardsPayload) => void;
    const request = vi.fn(() => new Promise<HubCardsPayload>(done => { resolve = done; }));
    const feed = createHubCardsFeed(request);
    const a = vi.fn(); const b = vi.fn();
    const stopA = feed.subscribe(a); const stopB = feed.subscribe(b);
    const first = feed.load();
    expect(feed.load()).toBe(first);
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    resolve(snapshot('first')); await first;
    expect(a.mock.lastCall?.[0].data.as_of).toBe('first');
    expect(b.mock.lastCall?.[0].data.as_of).toBe('first');
    win.dispatchEvent(new Event('focus')); await flush();
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(HUB_REFRESH_MS);
    expect(request).toHaveBeenCalledTimes(2);
    expect(a.mock.lastCall?.[0]).toMatchObject({ loading: true, data: { as_of: 'first' } });
    resolve(snapshot('second')); await feed.load();
    expect(a.mock.lastCall?.[0].data.as_of).toBe('second');
    expect(b.mock.lastCall?.[0].data.as_of).toBe('second');
    stopA(); expect(vi.getTimerCount()).toBe(1);
    stopB(); expect(vi.getTimerCount()).toBe(0);
  });

  it('does not poll hidden tabs; resumes with one TTL-checked focus/visibility request', async () => {
    const request = vi.fn(async () => snapshot('read'));
    const feed = createHubCardsFeed(request);
    const stop = feed.subscribe(vi.fn()); await flush();
    doc.visibilityState = 'hidden';
    await vi.advanceTimersByTimeAsync(HUB_REFRESH_MS * 3);
    expect(request).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    win.dispatchEvent(new Event('focus')); await flush();
    expect(request).toHaveBeenCalledTimes(2);
    stop();
    await vi.advanceTimersByTimeAsync(HUB_REFRESH_MS);
    doc.dispatchEvent(new Event('visibilitychange')); win.dispatchEvent(new Event('focus'));
    await flush(); expect(request).toHaveBeenCalledTimes(2);
  });

  it('retains the last snapshot with an error, rate-limits failure retries and recovers', async () => {
    const request = vi.fn().mockResolvedValueOnce(snapshot('old')).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(snapshot('new'));
    let state!: HubCardsState;
    const feed = createHubCardsFeed(request);
    const stop = feed.subscribe(value => { state = value; }); await flush();
    await vi.advanceTimersByTimeAsync(HUB_REFRESH_MS);
    expect(state).toMatchObject({ data: { as_of: 'old' }, error: 'offline', loading: false });
    for (let i = 0; i < 5; i++) win.dispatchEvent(new Event('focus'));
    await flush(); expect(request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(60_000);
    win.dispatchEvent(new Event('focus')); await flush();
    expect(state).toMatchObject({ data: { as_of: 'new' }, error: null, loading: false });
    stop();
  });

  it('cleans the last subscription while a request is pending without late notifications', async () => {
    let resolve!: (value: HubCardsPayload) => void;
    const feed = createHubCardsFeed(() => new Promise(done => { resolve = done; }));
    const listener = vi.fn(); const stop = feed.subscribe(listener); await flush();
    stop(); const calls = listener.mock.calls.length;
    resolve(snapshot('late')); await flush();
    expect(listener).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
    const next = vi.fn(); const stopNext = feed.subscribe(next);
    expect(next.mock.lastCall?.[0]).toMatchObject({ data: { as_of: 'late' }, loading: false });
    stopNext();
  });

  it('initial failure is explicit and never supplies a fabricated empty snapshot', async () => {
    let state!: HubCardsState;
    const feed = createHubCardsFeed(async () => { throw new Error('unreachable'); });
    const stop = feed.subscribe(value => { state = value; }); await flush();
    expect(state).toEqual({ data: null, error: 'unreachable', loading: false });
    stop();
  });

  it('refreshes after a slow first response without waiting for a second ten-minute interval', async () => {
    let resolve!: (value: HubCardsPayload) => void;
    const request = vi.fn(() => new Promise<HubCardsPayload>(done => { resolve = done; }));
    const feed = createHubCardsFeed(request);
    const stop = feed.subscribe(vi.fn());
    await flush();
    await vi.advanceTimersByTimeAsync(5_000);
    resolve(snapshot('delayed'));
    await feed.load();
    await vi.advanceTimersByTimeAsync(HUB_REFRESH_MS - 5_000);
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(request).toHaveBeenCalledTimes(2);
    resolve(snapshot('next'));
    await feed.load();
    stop();
  });
});
