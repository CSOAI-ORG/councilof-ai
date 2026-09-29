/**
 * EmailOff — keep an @-shaped string readable in the HTML the edge serves.
 *
 * Cloudflare Scrape Shield rewrites anything shaped like an email address in served HTML into
 * "[email protected]" plus an obfuscated span that only its own script decodes. That caught strings
 * that are not addresses at all: `csoai-gspc-mcp@0.2.2` on /connect-gspc/ and /x402-buyer-guide
 * reached every reader without JavaScript, every crawler and every agent as "[email protected]"
 * (audit 2026-09-28 #9). The documented opt-out is an `<!--email_off-->…<!--/email_off-->` pair
 * around the region, which Cloudflare leaves alone.
 *
 * React cannot emit an HTML comment directly, so the comment pair is written through innerHTML;
 * the prerender snapshots the DOM, comments included, and the pair ships in the static HTML.
 * The text itself is HTML-escaped, so a caller cannot inject markup through it.
 *
 * Use it for package@version strings and for any address printed as plain text. A mailto link
 * is still decoded by Cloudflare's script for readers with JavaScript and is left as it is.
 */
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function emailOffHtml(text: string): string {
  return `<!--email_off-->${text.replace(/[&<>"']/g, (c) => ESC[c])}<!--/email_off-->`;
}

export default function EmailOff({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: emailOffHtml(text) }} />;
}
