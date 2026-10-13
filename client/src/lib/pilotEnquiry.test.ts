import { describe, expect, it } from 'vitest';
import { ENQUIRY_EMAIL, ENQUIRY_LIMITS, PILOT_SUBJECT, enquiryPreset, prepareEnquiry } from './pilotEnquiry';
const input = { name: 'Example Tester', email: 'tester@example.invalid', subject: 'Replay question', message: 'One public result.' };
describe('Local written enquiry, never a send operation', () => {
 it('prefills the explicit pilot route', () => expect(enquiryPreset('?arm=pilot')?.subject).toBe(PILOT_SUBJECT));
 it.each(['ledger','data','run'])('retains existing %s presets', arm => expect(enquiryPreset('?arm='+arm)).not.toBeNull());
 it.each(['','?arm=unknown','?arm=__proto__','?to=attacker@example.invalid'])('ignores unrelated query input %s', search => expect(enquiryPreset(search)).toBeNull());
 it('uses the fixed approved recipient', () => expect(prepareEnquiry(input).mailto).toMatch(`mailto:${ENQUIRY_EMAIL}?`));
 it('preserves the entire prepared message', () => expect(prepareEnquiry(input).copyText).toContain(input.message));
 it('encodes reserved characters and unicode', () => {
  const draft = prepareEnquiry({...input,subject:'Evidence & care?',message:'Résumé = 1 + 2 & 3?'});
  const url = new URL(draft.mailto!);
  expect(url.searchParams.get('subject')).toBe('Evidence & care?');
  expect(url.searchParams.get('body')).toContain('Résumé = 1 + 2 & 3?');
 });
 it('does not allow body text to add recipients', () => {
  const url = new URL(prepareEnquiry({...input,message:'&bcc=someone@example.invalid'}).mailto!);
  expect(url.searchParams.get('bcc')).toBeNull();expect(url.pathname).toBe(ENQUIRY_EMAIL);
 });
 it('normalizes subject newlines without creating headers', () => {
  const url = new URL(prepareEnquiry({...input,subject:'Hello\r\nBcc: unknown@example.invalid'}).mailto!);
  expect(url.searchParams.get('bcc')).toBeNull();expect(url.searchParams.get('subject')).not.toMatch(/[\r\n]/);
 });
 it.each(['name','email','subject','message'] as const)('rejects blank %s', key => expect(()=>prepareEnquiry({...input,[key]:'  '})).toThrow());
 it.each(['name','email','subject','message'] as const)('rejects oversized %s', key => expect(()=>prepareEnquiry({...input,[key]:'x'.repeat(ENQUIRY_LIMITS[key]+1)})).toThrow());
 it.each(['not-an-email','a@b','a@b.com\r\nbcc: b@c.com'])('rejects bad reply email %s', email=>expect(()=>prepareEnquiry({...input,email})).toThrow());
 it('keeps a long message copyable, rather than truncating it into a mailto', () => {
  const message='x'.repeat(4000);const draft=prepareEnquiry({...input,message});expect(draft.mailto).toBeNull();expect(draft.body.endsWith(message)).toBe(true);
 });
});
