/**
 * _etag.ts — conditional request support for the read doors.
 *
 * WHY. GET /api/gspc is re-read by the site's own client once a minute per open page, and by every
 * agent that watches the board. The payload is ~61 KB and its bytes only change when the board
 * moves (the handler is deterministic over the axis arrays plus the site attestation). A strong
 * ETag over the exact served bytes lets a reader say "I already have that" and get a 304 instead —
 * the cheapest honesty transport there is: the etag changes if and only if the bytes change,
 * because it IS the hash of the bytes.
 *
 * SCOPE. This file only computes and compares validators. Cache policy stays where it was
 * (`cache-control` is untouched); a 304 is only ever answered for a GET whose If-None-Match names
 * the very bytes this handler would serve right now.
 */

/** A strong ETag over the exact bytes a 200 would serve. Deterministic: same bytes, same etag. */
export async function etagFor(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hex}"`;
}

/**
 * Whether an If-None-Match header value names this etag. RFC 9110 §8.8.3: the header is a comma
 * list, may be `*`, and validators compare opaque — weak prefixes (W/) are stripped on both sides
 * before comparison so a weak reader validator can still match a strong server etag's bytes.
 */
export function ifNoneMatchSatisfied(headerValue: string | null, etag: string): boolean {
  if (!headerValue) return false;
  const bare = (v: string) => v.trim().replace(/^W\//, "");
  const candidates = headerValue.split(",").map(bare);
  if (candidates.includes("*")) return true;
  return candidates.includes(bare(etag));
}
