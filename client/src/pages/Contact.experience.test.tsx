import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import Contact from './Contact';
const source = readFileSync(new URL('./Contact.tsx', import.meta.url), 'utf8');
const markup = () => renderToStaticMarkup(<Contact />);
describe('Contact enquiry experience', () => {
  it('states that the action opens a draft, not a delivered message', () => {
    expect(markup()).toContain('Open email draft');
    expect(markup()).not.toContain('Send Message');
    expect(markup()).toContain('this website does not send the message');
  });
  it('offers a separate copy-draft recovery action', () => {
    expect(markup()).toContain('contact-copy-draft');
    expect(markup()).toContain('Copy email draft');
    expect(source).toContain('await navigator.clipboard.writeText(draft)');
    expect(source).toContain('Copy is unavailable in this browser');
  });
  it('keeps labels and autofill available', () => {
    const html = markup();
    for (const id of ['contact-name','contact-email','contact-subject','contact-message']) expect(html).toContain(`for="${id}"`);
    expect(html).toContain('autoComplete="name"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain('aria-describedby="contact-delivery-note"');
  });
  it('retains the existing mailbox handoff and adds no submission backend', () => {
    expect(source).toContain('mailto:${CONTACT_MAILBOX}?subject=${subject}&body=${body}');
    expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage/);
  });
  it('does not disguise address or hours as links to nowhere', () => {
    expect(markup()).not.toContain('href="#"');
    expect(markup()).toContain('Europe/London');
  });
  it('renders its content without initially hidden animation wrappers', () => {
    expect(source).not.toContain('motion.');
    expect(markup()).not.toContain('opacity:0');
  });
  it('shares theme tokens and exposes clipboard feedback', () => {
    expect(markup()).toContain('bg-background text-foreground');
    expect(markup()).toContain('role="status"');
    expect(markup()).toContain('aria-live="polite"');
    expect(source).not.toMatch(/text-gray-|bg-green-|bg-white/);
  });
});
