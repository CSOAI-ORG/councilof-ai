import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ path: '/settings/notifications', user: null as null | { email: string }, loading: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, loading: state.loading, login: vi.fn() }) }));
vi.mock('wouter', () => ({ useLocation: () => [state.path, vi.fn()], useSearch: () => '', Redirect: ({ to }: { to: string }) => <a data-redirect={to}>Sign in</a> }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import Login from '@/pages/Login';
import RequireAuth from './RequireAuth';

describe('public and account journeys', () => {
  it('returns an anonymous visitor to the requested known account destination after sign-in', () => {
    const html = renderToStaticMarkup(<RequireAuth><p>Private page</p></RequireAuth>);
    expect(html).toContain('/login/?next=%2Fsettings%2Fnotifications');
    expect(html).not.toContain('Private page');
  });
  it('leaves measurement enquiries public without a session', () => {
    state.path = '/assess';
    expect(renderToStaticMarkup(<RequireAuth><p>Enquiry form</p></RequireAuth>)).toContain('Enquiry form');
    state.path = '/settings/notifications';
  });
  it('offers working public destinations instead of withdrawn registration', () => {
    const html = renderToStaticMarkup(<Login />);
    expect(html).not.toContain('/signup');
    expect(html).not.toContain('Create Free Account');
    expect(html).toContain('href="/gspc-verify"');
    expect(html).toContain('href="/dashboard"');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
  });
});
