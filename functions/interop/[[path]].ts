/**
 * Keep historical .invalid evidence URLs readable after their exact bytes are packed
 * out of the Pages asset tree. These are retired records, never current proof.
 */
const ARCHIVE_PATH = "/archive/retired-proof-bytes-v1.json";
const ARCHIVE_SCHEMA = "csoai.retired-proof-bytes/0.1";
const INVALID_PATH = /^\/interop\/[A-Za-z0-9_./-]+\.invalid$/;
const MIRROR_PATH = /^\/interop\/[^/]+\/mirrors\//;
const CAPTURE_POLICY = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:";

/**
 * Is the capture policy ALREADY on this response?
 *
 * MEASURED 2026-11-06 on the live site. `public/_headers` sets
 * `Content-Security-Policy: sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:`
 * for `/interop/:report/mirrors/*`, and _headers DOES reach a response that passes through a
 * Pages Function -- so `ctx.next()` already returns the capture policy. This function then
 * appended the same policy to it, and the live header shipped as:
 *
 *   sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:, sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:
 *
 * That is the same duplicate-header class the estate already ruled on for _headers
 * ("Listing both a splat and the exact path made Cloudflare Pages apply BOTH, and the header
 * shipped as `text/plain; charset=utf-8, text/plain; charset=utf-8` -- a duplicated value that a
 * strict parser is entitled to reject"). It was not caught here because both copies are identical
 * and a CSP is not a Content-Type, so nothing downstream complained.
 *
 * A browser applies the INTERSECTION of a repeated policy, so the page was held to the
 * intersection of the policy with itself -- the same enforcement, but a header that says it
 * twice and that a strict parser is entitled to reject.
 *
 * So the fix is IDEMPOTENCE, not a different policy: apply the capture policy once, and only
 * when the response does not already carry it. The two directives that make this policy the
 * capture policy are `sandbox` and `default-src 'none'`; a response carrying both already has it.
 */
function capturePolicyApplied(existing: string | null): boolean {
  if (!existing) return false;
  return existing.includes("sandbox") && existing.includes("default-src 'none'");
}

type ArchiveMember = { sha256: string; bytes: number; body_base64: string };
type Archive = {
  schema: string;
  members: Record<string, ArchiveMember>;
};
type AssetEnv = { ASSETS: { fetch(request: Request): Promise<Response> } };

function validPath(path: string): boolean {
  return INVALID_PATH.test(path) && !path.split("/").some((part) => part === "." || part === "..");
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const input = new ArrayBuffer(bytes.length);
  new Uint8Array(input).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unavailable(): Response {
  return new Response("Historical evidence archive unavailable", {
    status: 503,
    headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
  });
}

export const onRequest: PagesFunction<AssetEnv> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname;
  // Captured third-party HTML is retained evidence, not an application on our
  // origin. Preserve its exact body while blocking scripts, forms and remote
  // resources. _headers ALSO sets this policy for /interop/:report/mirrors/*, and
  // _headers reaches responses that pass through a Function -- so the policy can
  // already be here. Applying it twice ships a duplicated header value, so it is
  // applied only when it is not already present.
  if (MIRROR_PATH.test(path)) {
    const response = await ctx.next();
    const headers = new Headers(response.headers);
    headers.set("x-robots-tag", "noindex, nofollow");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "no-referrer");
    if (headers.get("content-type")?.toLowerCase().includes("text/html")) {
      const existing = headers.get("content-security-policy");
      if (!capturePolicyApplied(existing)) {
        headers.set("content-security-policy", existing ? `${existing}, ${CAPTURE_POLICY}` : CAPTURE_POLICY);
      }
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  if (!path.endsWith(".invalid")) return ctx.next();
  if (!validPath(path) || path.includes("%")) return new Response("Not found", { status: 404 });
  if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  let archive: Archive;
  try {
    const assetUrl = new URL(ARCHIVE_PATH, url.origin);
    const response = await ctx.env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
    if (!response.ok) return unavailable();
    archive = (await response.json()) as Archive;
    if (archive.schema !== ARCHIVE_SCHEMA || !archive.members || typeof archive.members !== "object") {
      return unavailable();
    }
  } catch {
    return unavailable();
  }

  const member = archive.members[path];
  if (!member) return new Response("Not found", { status: 404 });
  if (
    !Number.isSafeInteger(member.bytes) ||
    member.bytes < 0 ||
    member.bytes > 65_536 ||
    !/^[a-f0-9]{64}$/.test(member.sha256) ||
    typeof member.body_base64 !== "string" ||
    member.body_base64.length > 87_384
  ) return unavailable();

  try {
    const decoded = atob(member.body_base64);
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    if (
      bytes.length !== member.bytes ||
      btoa(decoded) !== member.body_base64 ||
      (await sha256(bytes)) !== member.sha256
    ) return unavailable();
    const headers = new Headers({
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": "application/octet-stream",
      "content-length": String(bytes.length),
      "etag": `"${member.sha256}"`,
      "x-content-type-options": "nosniff",
      "x-evidence-state": "retired-or-invalid-historical-bytes",
    });
    return new Response(ctx.request.method === "HEAD" ? null : bytes, { status: 200, headers });
  } catch {
    return unavailable();
  }
};
