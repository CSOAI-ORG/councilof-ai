// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Signup from './Signup';
import { CouncilSessionPersistenceError, COUNCIL_SESSION_PERSISTENCE_MESSAGE } from '@/lib/councilSession';
const mocks = vi.hoisted(() => ({ signup: vi.fn(), navigate: vi.fn(), error: vi.fn(),
  user: null as null | { email: string }, search: '' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, loading: false, signup: mocks.signup }) }));
vi.mock('wouter', () => ({ useLocation: () => ['/signup', mocks.navigate], useSearch: () => mocks.search }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  mocks.signup.mockReset().mockResolvedValue(undefined);
  mocks.user = null;
  mocks.search = 'next=%2Fdashboard%2F%3Fworkspace%3Dcompany%26case%3Dcase_fixture';
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<Signup />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function fill(id: string, value: string) {
  const input = host.querySelector<HTMLInputElement>('#' + id)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function fields(email = '  FIXTURE@example.test  ', confirmation = 'synthetic-password') {
  await fill('name', ' Fixture '); await fill('email', email);
  await fill('password', 'synthetic-password'); await fill('confirmation', confirmation);
}
async function submit() {
  await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
}
describe('ordinary account creation and uncertain outcomes', () => {
  it('does not dispatch missing fields or mismatching passwords', async () => {
    await submit(); expect(mocks.signup).not.toHaveBeenCalled();
    await fields('fixture@example.test', 'different-password'); await submit();
    expect(mocks.signup).not.toHaveBeenCalled(); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('uses only the existing signup controller and awaits a verified user before navigation', async () => {
    await fields(); await submit();
    expect(mocks.signup).toHaveBeenCalledExactlyOnceWith('fixture@example.test', 'synthetic-password', 'Fixture');
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    mocks.user = { email: 'fixture@example.test' };
    await act(async () => root.render(<Signup />));
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/dashboard/?workspace=company&case=case_fixture');
  });
  it('keeps the safe storage failure and stops another registration after an uncertain attempt', async () => {
    mocks.signup.mockRejectedValueOnce(new CouncilSessionPersistenceError());
    await fields(); await submit();
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(COUNCIL_SESSION_PERSISTENCE_MESSAGE);
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('may already have been created');
    expect(host.querySelector<HTMLInputElement>('#password')!.value).toBe('');
    expect(host.querySelector<HTMLInputElement>('#confirmation')!.value).toBe('');
    await submit(); expect(mocks.signup).toHaveBeenCalledOnce(); expect(mocks.navigate).not.toHaveBeenCalled();
    expect(host.querySelector('a')!.getAttribute('href')).toBe('/login/?next=%2Fdashboard%2F%3Fworkspace%3Dcompany%26case%3Dcase_fixture');
  });
  it('treats an interrupted or server-error attempt as unknown without showing private details', async () => {
    mocks.signup.mockRejectedValueOnce(new Error('private server response with secret details'));
    await fields(); await submit();
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('Account creation could not be confirmed. Sign in with the same email before trying to create another account.');
    expect(host.textContent).not.toContain('secret details'); expect(mocks.navigate).not.toHaveBeenCalled();
    await submit(); expect(mocks.signup).toHaveBeenCalledOnce();
  });
  it('blocks a second submission while the first attempt is still pending', async () => {
    let resolve!: () => void;
    mocks.signup.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
    await fields(); await submit(); await submit(); expect(mocks.signup).toHaveBeenCalledOnce();
    await act(async () => resolve()); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('does not expose an intentionally cancelled stale authentication attempt', async () => {
    mocks.signup.mockRejectedValueOnce(new DOMException('fixture cancellation', 'AbortError'));
    await fields(); await submit(); expect(mocks.error).not.toHaveBeenCalled(); expect(mocks.navigate).not.toHaveBeenCalled();
    expect(host.querySelector('button[type="submit"]')!.textContent).toBe('Create account');
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('may already have been created');
    expect(host.querySelector('a')!.textContent).toBe('Sign in');
    await submit(); expect(mocks.signup).toHaveBeenCalledOnce();
  });
  it('ignores completion after leaving the form', async () => {
    let reject!: (error: Error) => void;
    mocks.signup.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    await fields(); await submit(); await act(async () => root.render(<p>Left form</p>));
    await act(async () => reject(new Error('late private failure')));
    expect(mocks.error).not.toHaveBeenCalled(); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('does not preserve an external return target after a verified account appears', async () => {
    mocks.search = 'next=https%3A%2F%2Foutside.example%2F'; mocks.user = { email: 'fixture@example.test' };
    await act(async () => root.render(<Signup />)); expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/dashboard');
  });
});
