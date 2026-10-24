// Exact mailto preparation only; never opens an email client or sends mail.
import { describe, expect, it } from 'vitest';
import { ENQUIRY_EMAIL, prepareEnquiry } from './pilotEnquiry';
const base = { name: 'Synthetic Reviewer', email: 'reader+test@example.invalid',
  subject: 'Bounded replay enquiry', message: 'First line\nSecond line' };
const crlf = (value: string) => value.replace(/\r\n|\r|\n/g, '\r\n');

describe('RFC 6068 body transport and unchanged copyable draft', () => {
  it.each(['\n', '\r', '\r\n'])('encodes body newlines as CRLF for %j input', newline => {
    const message = ['First', 'Second', 'Third'].join(newline);
    const draft = prepareEnquiry({ ...base, message });
    const url = new URL(draft.mailto!);
    expect(url.searchParams.get('body')).toBe(crlf(draft.body));
    expect(draft.mailto).not.toMatch(/(?<!%0D)%0A|%0D(?!%0A)/);
    expect(draft.mailto).not.toMatch(/%0D%0D%0A/);
    expect(draft.body.endsWith(message)).toBe(true);
    expect(draft.copyText.endsWith(message)).toBe(true);
  });
  it('keeps exactly one recipient and two URI fields with reserved characters', () => {
    const draft = prepareEnquiry({ ...base, subject: 'Résumé & quote? #1',
      message: 'Literal + = &bcc=other@example.invalid\n中文 %0D%0A' });
    const url = new URL(draft.mailto!);
    expect(url.pathname).toBe(ENQUIRY_EMAIL);
    expect([...url.searchParams.keys()]).toEqual(['subject', 'body']);
    expect(url.searchParams.get('body')).toBe(crlf(draft.body));
    expect(url.searchParams.get('subject')).toBe('Résumé & quote? #1');
    expect(url.hash).toBe('');
  });
  it('uses the final CRLF-encoded URI when applying the existing length limit', () => {
    for (const length of [1, 100, 240, 260, 400]) {
      const message = 'a\n'.repeat(length).trim();
      const draft = prepareEnquiry({ ...base, message });
      const expected = `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(crlf(draft.body))}`;
      expect(draft.mailto).toBe(expected.length <= 1800 ? expected : null);
      expect(draft.body.endsWith(message)).toBe(true);
      expect(draft.copyText.endsWith(message)).toBe(true);
    }
  });
  it('preserves a long multiline enquiry completely when mailto cannot carry it', () => {
    const message = 'example line\n'.repeat(300).trim();
    const draft = prepareEnquiry({ ...base, message });
    expect(draft.mailto).toBeNull();
    expect(draft.body).toBe(`Name: ${base.name}\nReply email: ${base.email}\n\n${message}`);
    expect(draft.copyText).toBe(`To: ${ENQUIRY_EMAIL}\nSubject: ${base.subject}\n\n${draft.body}`);
  });
  it('keeps transport control characters out of the subject field', () => {
    const draft = prepareEnquiry({ ...base, subject: 'First\r\nSecond\rThird\nFourth' });
    expect(new URL(draft.mailto!).searchParams.get('subject')).toBe('First Second Third Fourth');
  });
  it('does not mutate caller fields while preparing the transport body', () => {
    const input = { ...base };
    const original = { ...input };
    prepareEnquiry(input);
    expect(input).toEqual(original);
  });
});
