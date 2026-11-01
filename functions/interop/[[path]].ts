/**
 * Keep historical .invalid evidence URLs readable after their exact bytes are packed
 * out of the Pages asset tree. These are retired records, never current proof.
 */
const ARCHIVE_PATH = "/archive/retired-proof-bytes-v1.json";
const ARCHIVE_SCHEMA = "csoai.retired-proof-bytes/0.1";
const INVALID_PATH = /^\/interop\/[A-Za-z0-9_./-]+\.invalid$/;
const MIRROR_PATH = /^\/interop\/[^/]+\/mirrors\//;
const CAPTURE_POLICY = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:";

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
  // resources. _headers does not cover responses passing through Functions.
  if (MIRROR_PATH.test(path)) {
    const response = await ctx.next();
    const headers = new Headers(response.headers);
    headers.set("x-robots-tag", "noindex, nofollow");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "no-referrer");
    if (headers.get("content-type")?.toLowerCase().includes("text/html")) {
      const existing = headers.get("content-security-policy");
      headers.set("content-security-policy", existing ? `${existing}, ${CAPTURE_POLICY}` : CAPTURE_POLICY);
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
