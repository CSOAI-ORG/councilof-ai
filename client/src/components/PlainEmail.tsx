/**
 * PlainEmail — the mailbox as a plain mailto link that stays readable without JavaScript.
 *
 * Cloudflare's Email Address Obfuscation rewrites every address it finds in served HTML into
 * "[email protected]" plus a script that decodes it. Agents, crawlers and readers without
 * JavaScript never see the address. Cloudflare leaves anything between <!--email_off--> and
 * <!--/email_off--> alone, so the link is emitted inside those comments. React cannot render an
 * HTML comment as JSX, so the markup is set as inner HTML; the address is a constant, never input.
 */
export const CONTACT_MAILBOX = "nicholas@csoai.org";

export default function PlainEmail({ className, subject }: { className?: string; subject?: string }) {
  const href = `mailto:${CONTACT_MAILBOX}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  const cls = className ? ` class="${className.replace(/"/g, "")}"` : "";
  const html = `<!--email_off--><a href="${href}"${cls}>${CONTACT_MAILBOX}</a><!--/email_off-->`;
  return <span data-testid="plain-email" dangerouslySetInnerHTML={{ __html: html }} />;
}
