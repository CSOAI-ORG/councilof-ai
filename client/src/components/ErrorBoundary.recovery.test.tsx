// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary, { recoveryDiagnostic } from './ErrorBoundary';

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function Broken(): never { throw new Error('private pasted input must not become public copy'); }
const show = (key: string, broken = true, fallback?: React.ReactNode) => act(async () => root.render(<><nav>Navigation retained</nav><ErrorBoundary resetKey={key} contained fallback={fallback}>{broken ? <Broken /> : <h1>Next page</h1>}</ErrorBoundary></>));

describe('page error recovery', () => {
  it('reloads the current workspace only after the reader chooses recovery', async () => {
    const reload = vi.fn(); const assign = vi.fn(); const replace = vi.fn();
    vi.stubGlobal('location', { pathname: '/dashboard', search: '?tab=verify', hash: '#result', reload, assign, replace });
    await show('/dashboard?tab=verify');
    expect(reload).not.toHaveBeenCalled();
    const button = [...host.querySelectorAll('button')].find(b => b.textContent === 'Reload this page')!;
    await act(async () => button.click());
    expect(reload).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled();
    expect(location.search).toBe('?tab=verify'); expect(location.hash).toBe('#result');
  });
  it('does not copy an arbitrary error name containing private input', () => {
    const error = new Error('private'); error.name = 'secret-token-value';
    expect(recoveryDiagnostic(error, '/dashboard')).not.toContain('secret-token-value');
  });
  it('keeps surrounding chrome and can navigate from a failed route to a working route', async () => {
    await show('/failed');
    expect(host.querySelector('nav')?.textContent).toBe('Navigation retained');
    expect(host.querySelector('[data-testid="page-recovery"]')).not.toBeNull();
    expect(host.textContent).not.toContain('private pasted input');
    expect([...host.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['/dashboard', '/']);
    await show('/next', false);
    expect(host.querySelector('[data-testid="page-recovery"]')).toBeNull();
    expect(host.querySelector('h1')?.textContent).toBe('Next page');
  });
  it('preserves an explicitly supplied local fallback', async () => {
    await show('/local', true, <p>Local data unavailable</p>);
    expect(host.textContent).toContain('Local data unavailable');
    expect(host.querySelector('[data-testid="page-recovery"]')).toBeNull();
  });
  it('awaits copy confirmation and retains a manual recovery when copying fails', async () => {
    let reject!: (e: Error) => void;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(() => new Promise<void>((_, fail) => { reject = fail; })) } });
    await show('/failed');
    const button = [...host.querySelectorAll('button')].find(b => b.textContent === 'Copy details')!;
    await act(async () => button.click());
    expect(button.disabled).toBe(true); expect(button.textContent).toBe('Copying details…');
    await act(async () => reject(new Error('denied')));
    expect(host.querySelector('[role="status"]')?.textContent).toContain('copy them manually');
    expect(host.textContent).not.toContain('Details copied');
  });
  it('ignores a copy response after the route has recovered', async () => {
    let resolve!: () => void;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise<void>(r => { resolve = r; }) } });
    await show('/failed');
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === 'Copy details')!.click());
    await show('/next', false); await act(async () => resolve());
    expect(host.textContent).toBe('Navigation retainedNext page');
  });
  it('omits message payloads and URL queries from diagnostic copies', () => {
    const error = new Error('private card body');
    error.stack = 'Error: private card body\n at route (https://councilof.ai/assets/page.js?token=secret#fragment)';
    const text = recoveryDiagnostic(error, '/page?case=private#secret');
    expect(text).toBe('Error: Error\nPage: Other page');
    for (const value of ['private card body', 'token=', 'case=', '#fragment', '/assets/page.js']) expect(text).not.toContain(value);
  });
  it('omits untrusted stack frames and private route segments', () => {
    const error = new TypeError('PRIVATE_MESSAGE');
    error.stack = 'TypeError: PRIVATE_MESSAGE\n at parse_PRIVATE_PASTED_CARD (data:text/javascript,PRIVATE_TOKEN)\n at fn (file:///Users/PRIVATE_NAME/private.js)';
    expect(recoveryDiagnostic(error, '/library/company/PRIVATE_CASE_ID?token=SECRET')).toBe('Error: TypeError\nPage: /library');
    expect(recoveryDiagnostic(error, '/PRIVATE_CASE_ID')).toBe('Error: TypeError\nPage: Other page');
  });
});
