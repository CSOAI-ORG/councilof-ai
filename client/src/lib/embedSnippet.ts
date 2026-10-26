/**
 * Compact white-label snippets. Same card bytes, same endpoints — smaller paste.
 * Do not add VRO / Emilia / XRPL / OTS fields here; the widget checks the card as published.
 *
 * `?embed=1` is for partners framing THIS snippet on their origin (n-site spray).
 * It is not how Council OS frames `/` `/dashboard?tab=home` `/dashboard` — those paths are
 * unframeable and break out. Spray is /embed + /badge + glass on *their* site.
 *
 * THE CARD WIDGET (public/embed/verify.html, served at /embed/verify). Until 7 Oct 2026 it was a
 * withdrawal notice: the old widget checked cards against an unanchored legacy key, so it was
 * withdrawn, and every site that pasted this snippet showed its visitors "Legacy verifier
 * withdrawn". It now asks the live verifier: it loads the card's bytes and posts them to
 * POST /api/verify, which runs functions/_lib/cardVerify.ts (the one shared implementation behind
 * /gspc-verify and the MCP verify tool, with pinned keys), shows that verdict, and links to
 * /gspc-verify/?card=… so a visitor can repeat the check in their own browser without trusting us.
 */
import { verifyCardHref } from "./cardParam";

export const EMBED_ORIGIN = "https://councilof.ai";
export const CARD_EMBED_WIDTH = 420;
export const CARD_EMBED_HEIGHT = 340;

export function badgeSnippet(axis = "", origin = EMBED_ORIGIN): string {
  const src = axis ? `${origin}/api/badge?axis=${encodeURIComponent(axis)}` : `${origin}/api/badge`;
  const alt = axis ? `${axis} — measured by Council of AI` : "Council of AI — measured axis";
  return `<a href="${origin}/gspc-verify"><img src="${src}" alt="${alt}" height="20"></a>`;
}

/** The in-browser verifier with this card loaded: where "check it yourself" goes. */
export function cardVerifyUrl(cardPath: string, origin = EMBED_ORIGIN): string {
  return `${origin}${verifyCardHref(cardPath)}`;
}

export function cardSnippet(cardPath: string, origin = EMBED_ORIGIN): string {
  return (
    `<iframe src="${origin}/embed/verify?card=${cardPath}"` +
    ` width="${CARD_EMBED_WIDTH}" height="${CARD_EMBED_HEIGHT}"` +
    ` loading="lazy" style="border:0;max-width:100%"` +
    ` title="Powered by Council of AI — a signed measurement card, checked"></iframe>`
  );
}
