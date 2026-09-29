/** Local email-draft preparation only. No fetch, storage, payment or send action. */
export const ENQUIRY_EMAIL = 'nicholas@csoai.org';
export const ENQUIRY_LIMITS = { name: 100, email: 254, subject: 160, message: 5000 } as const;
export type EnquiryFields = { name: string; email: string; subject: string; message: string };
export type EnquiryDraft = { subject: string; body: string; copyText: string; mailto: string | null };
export const PILOT_SUBJECT = 'Evidence Replay Pilot — written scope request';
export const PILOT_MESSAGE = [
  'Organisation / project:',
  'Public result or pipeline to review:',
  'What would a useful outcome look like?',
  'Preferred written delivery date:',
  '',
  'Please reply by email with a proposed scope. This is an enquiry, not a purchase.',
].join('\n');

export function enquiryPreset(search: string): Pick<EnquiryFields, 'subject' | 'message'> | null {
  const arm = new URLSearchParams(search).get('arm');
  if (arm === 'pilot') return { subject: PILOT_SUBJECT, message: PILOT_MESSAGE };
  const subjects: Record<string, string> = {
    ledger: 'Ledger enquiry', data: 'Data enquiry', run: 'Run / re-attest enquiry',
  };
  if (!arm || !Object.prototype.hasOwnProperty.call(subjects, arm)) return null;
  return { subject: subjects[arm], message: `Enquiry for the ${arm} arm. Verify stays free. A grade is never sold.` };
}

export function prepareEnquiry(input: EnquiryFields): EnquiryDraft {
  const clean = {} as EnquiryFields;
  for (const key of Object.keys(ENQUIRY_LIMITS) as (keyof EnquiryFields)[]) {
    if (typeof input[key] !== 'string' || !input[key].trim()) throw new Error(`Please complete ${key}.`);
    if (input[key].length > ENQUIRY_LIMITS[key]) throw new Error(`${key} is too long.`);
    clean[key] = input[key].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('Please enter a valid reply email.');
  if (/[\r\n]/.test(clean.email) || /[\r\n]/.test(clean.name)) throw new Error('Name and email must be single lines.');
  const subject = clean.subject.replace(/[\r\n]+/g, ' ');
  const body = `Name: ${clean.name}\nReply email: ${clean.email}\n\n${clean.message}`;
  return formatDraft(ENQUIRY_EMAIL, subject, body);
}

/** The existing Contact form's recipient; never supplied by query or form data. */
export const CONTACT_ENQUIRY_EMAIL = 'contact@csoai.org';

function formatDraft(recipient: string, subject: string, body: string): EnquiryDraft {
  const copyText = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
  let mailto: string | null = null;
  try {
    // URI body uses CRLF; the displayed/copyable draft keeps the original text.
    const transportBody = body.replace(/\r\n|\r|\n/g, '\r\n');
    const uri = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(transportBody)}`;
    if (uri.length <= 1800) mailto = uri;
  } catch {
    // Unpaired UTF-16 is not URI-encodable. Do not crash or discard the draft.
  }
  return {subject, body, copyText, mailto};
}

/** Partial Contact-form copy recovery only. Does not validate, submit or send. */
export function prepareContactEmail(input: EnquiryFields): EnquiryDraft {
  for (const key of ['name', 'email', 'subject', 'message'] as const) {
    if (typeof input[key] !== 'string') throw new TypeError('Expected text form fields.');
  }
  const subject = (input.subject || 'Website enquiry').replace(/[\r\n]+/g, ' ');
  const body = `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`;
  return formatDraft(CONTACT_ENQUIRY_EMAIL, subject, body);
}
