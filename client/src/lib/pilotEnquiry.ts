/** Local email-draft preparation only. No fetch, storage, payment or send action. */
import { BUYING_ENQUIRIES, CONTACT_MAILBOX } from '@/lib/buying';

export const ENQUIRY_EMAIL = CONTACT_MAILBOX;
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
  const params = new URLSearchParams(search);
  const arm = params.get('arm');
  if (arm === 'invoice') {
    const product = BUYING_ENQUIRIES.find((p) => p.product === params.get('product'));
    if (!product) return null;
    return {
      subject: `${product.label} — written scope and invoice enquiry`,
      message: [
        `Product: ${product.label}`,
        'Public output URL or subject to check:',
        'Date, period or history needed:',
        'What will you use the evidence for?',
        'Organisation:',
        'Billing contact:',
        'Existing invoice reference, if you have one:',
        '',
        'Please reply with the scope, available deliverable and invoice terms before I order.',
        'This is an enquiry, not a purchase or a booked fresh measurement.',
      ].join('\n'),
    };
  }
  if (arm === 'pilot') return { subject: PILOT_SUBJECT, message: PILOT_MESSAGE };
  const subjects: Record<string, string> = {
    ledger: 'Ledger enquiry', data: 'Data enquiry', run: 'Run / re-attest enquiry',
  };
  if (!arm || !Object.prototype.hasOwnProperty.call(subjects, arm)) return null;
  // Plain words a buyer would write, per arm (persona sweep 6 Oct 2026, T10) — not "the run arm".
  const messages: Record<string, string> = {
    run: 'I would like a measurement of: [model or server]. Organisation: … Billing contact: …',
    data: 'I would like to ask about licensing Council of AI data (traces, preference pairs, safety incidents).',
    ledger: 'I would like to ask about the signed evidence feed.',
  };
  return { subject: subjects[arm], message: `${messages[arm]}\n\nChecking a result stays free.` };
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

/**
 * The existing Contact form's recipient; never supplied by query or form data. Until 6 Oct 2026
 * this was contact@csoai.org while the footer, JSON-LD, security.txt and the invoice handoff
 * named nicholas@csoai.org; nothing confirms contact@ reaches a monitored inbox, so the form
 * uses the one mailbox constant too.
 */
export const CONTACT_ENQUIRY_EMAIL = CONTACT_MAILBOX;

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
