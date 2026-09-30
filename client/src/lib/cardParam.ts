/**
 * /gspc-verify/?card=<url> — which card URLs the verifier will load by itself.
 *
 * A board row links here with the card it just showed, so a reader goes from a number to a
 * verdict without copying and pasting JSON. The verifier fetches the named bytes UNALTERED and
 * checks them in the browser. It only loads cards this site publishes: a relative path, or an
 * absolute URL on this origin or on councilof.ai. Anything else is refused with a reason (the
 * paste box still works), so a crafted link cannot make this page fetch and present someone
 * else's bytes under our verifier's heading.
 */
export const CARD_PARAM_ORIGINS = ["https://councilof.ai"];
/** A signed card is under 1 KB; the envelope ceiling is 3 KB. 256 KB leaves room and stops abuse. */
export const CARD_PARAM_MAX_BYTES = 256 * 1024;

export type CardParam =
  | { state: "none" }
  | { state: "ok"; url: string; href: string }
  | { state: "refused"; raw: string; reason: string };

export function resolveCardParam(search: string, origin: string): CardParam {
  const raw = new URLSearchParams(search).get("card");
  if (raw === null || !raw.trim()) return { state: "none" };
  const value = raw.trim();
  if (value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
    return { state: "refused", raw: value, reason: "only http(s) card URLs on this site are loaded" };
  }
  let u: URL;
  try {
    u = new URL(value, origin);
  } catch {
    return { state: "refused", raw: value, reason: "not a URL" };
  }
  if (u.origin !== origin && !CARD_PARAM_ORIGINS.includes(u.origin)) {
    return { state: "refused", raw: value, reason: `cards are only loaded from this site, not from ${u.origin}` };
  }
  if (u.username || u.password) return { state: "refused", raw: value, reason: "URLs with credentials are not loaded" };
  // Same-origin cards are fetched by path, so a preview deploy checks its own bytes.
  const url = u.origin === origin ? `${u.pathname}${u.search}` : u.toString();
  return { state: "ok", url, href: u.toString() };
}

/** The link a board row uses for one signed card. */
export const verifyCardHref = (cardPath: string): string => `/gspc-verify/?card=${encodeURIComponent(cardPath)}`;
