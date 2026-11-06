import { describe, expect, it } from 'vitest';
import { councilLoginDestination, councilLoginHref, councilLoginReturnFromSearch, companyWorkspaceHref, safeCouncilLoginReturn } from './councilLoginReturn';

describe('return from sign-in', () => {
  it.each(['/settings', '/settings/billing', '/settings/notifications', '/workbench', '/my-applications', '/admin', '/api-keys'])('preserves the known account page %s', path => {
    expect(councilLoginReturnFromSearch(councilLoginHref(path).split('?')[1])).toBe(path);
    expect(councilLoginDestination(path, 'reader@example.com')).toBe(path);
  });
  it('preserves the existing Company case path without granting access', () => {
    const path = companyWorkspaceHref('case with space');
    expect(safeCouncilLoginReturn(path)).toBe(path);
    expect(councilLoginDestination(path, 'demo@csoai.com')).toBe('/dashboard');
  });
  it.each(['https://attacker.test/settings', '//attacker.test/settings', '/\\attacker.test', '/settings?token=secret', '/settings#private', '/unknown', '/settings%0a', '/dashboard?workspace=company&case=a&case=b', '/dashboard?tab=tools&args=private'])('rejects unapproved destinations and payloads %s', path => {
    expect(safeCouncilLoginReturn(path)).toBe('/dashboard');
  });
  it('does not accept duplicate next parameters', () => {
    expect(councilLoginReturnFromSearch('next=%2Fsettings&next=%2Fadmin')).toBe('/dashboard');
  });
});
