import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { enquiryPreset, prepareContactEmail } from '../lib/pilotEnquiry';

const read = (rel: string) => readFileSync(resolve(__dirname, '..', rel), 'utf8');
const quickstart = read('pages/Quickstart.tsx');
const services = read('pages/Services.tsx');
const contact = read('pages/Contact.tsx');
const tabs = read('components/lobby/tabs.ts');
const pane = read('components/DashboardPane.tsx');

describe('RunPod public UX forward-port', () => {
  it('keeps the pilot preset explicit and prototype-safe', () => {
    expect(enquiryPreset('?arm=pilot')?.subject).toContain('Evidence Replay Pilot');
    expect(enquiryPreset('?arm=constructor')).toBeNull();
    expect(enquiryPreset('?arm=__proto__')).toBeNull();
  });
  it('keeps long or unencodable contact drafts copyable', () => {
    const base={name:'A',email:'a@example.invalid',subject:'Scope',message:'x'.repeat(4000)};
    const long=prepareContactEmail(base);
    expect(long.mailto).toBeNull();
    expect(long.copyText.endsWith(base.message)).toBe(true);
    const odd=prepareContactEmail({...base,message:'keep '+String.fromCharCode(0xd800)});
    expect(odd.mailto).toBeNull();
    expect(odd.body.endsWith(String.fromCharCode(0xd800))).toBe(true);
  });
  it('makes code examples keyboard reachable and adds bounded retry affordances', () => {
    expect(quickstart).toContain('aria-label="Scrollable code example"');
    expect(quickstart).toContain('Retry manifest read');
    expect(quickstart).toContain('Retry 402 preview');
    expect(quickstart).toContain('[manifestAttempt]');
    expect(quickstart).toContain('[challengeAttempt]');
  });
  it('gives Services a status region and explicit retry without inventing doors', () => {
    expect(services).toContain('role="status"');
    expect(services).toContain('Retry manifest read');
    expect(services).toContain('[attempt]');
    expect(services).toContain('This is not a claim that the');
  });
  it('hardens URL-derived lookup maps against inherited properties', () => {
    expect(tabs.match(/Object\.prototype\.hasOwnProperty\.call/g)?.length).toBeGreaterThanOrEqual(2);
    expect(pane.match(/Object\.prototype\.hasOwnProperty\.call/g)?.length).toBeGreaterThanOrEqual(2);
  });
  it('offers recovery destinations instead of a dead unknown workspace', () => {
    expect(pane).toContain('/dashboard?tab=explore');
    expect(pane).toContain('/dashboard?tab=board');
    expect(pane).toContain('/dashboard?tab=learn');
    expect(pane).toContain('Learning arena');
  });
  it('preserves the one-mailbox Contact design while adding pilot and copy recovery', () => {
    expect(contact).toContain("PlainEmail, { CONTACT_MAILBOX }");
    expect(contact).toContain('enquiryPreset(window.location.search)');
    expect(contact).toContain('Contact — Council of AI');
    expect(contact).toContain('Copy enquiry instead');
    expect(contact).toContain('contact-copy-draft');
    expect(contact).not.toContain("submitEnquiry('/api/contact'");
  });
});
