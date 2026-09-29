/** Serve exact retired-invalid historical bytes from the packed archive. */
const ARCHIVE_PATH = "/archive/retired-proof-bytes-v1.json";
const SCHEMA = "csoai.retired-proof-bytes/0.1";
const eligible = (path: string) =>
  /^\/interop\/[A-Za-z0-9_./-]+\.invalid$/.test(path) &&
  !path.slice(1).split("/").some((p) => p === "." || p === ".." || p === "");

const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

async function exactHistoricalResponse(request: Request, archive: unknown): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (!eligible(path)) return new Response("Not an archived proof path", { status: 404 });

  const doc = obj(archive);
  const members = obj(doc?.members);
  if (doc?.schema !== SCHEMA || !members) {
    return new Response("Historical evidence archive unavailable", { status: 503 });
  }
  if (!Object.hasOwn(members, path)) {
    return new Response("Historical evidence not found", { status: 404 });
  }

  try {
    const member = obj(members[path]);
    if (
      !member ||
      typeof member.body_base64 !== "string" ||
      member.body_base64.length > 90000 ||
      typeof member.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(member.sha256) ||
      typeof member.bytes !== "number" ||
      !Number.isSafeInteger(member.bytes)
    ) throw new Error("Bad member");

    const raw = atob(member.body_base64);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    if (
      bytes.length > 65536 ||
      bytes.length !== member.bytes ||
      btoa(raw) !== member.body_base64
    ) throw new Error("Bad encoding");

    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (digest !== member.sha256) throw new Error("Digest mismatch");

    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "content-type": "application/octet-stream",
        "x-content-type-options": "nosniff",
        "content-disposition": `attachment; filename="${path.split("/").at(-1)}"`,
        "cache-control": "public, max-age=300",
        etag: `"${digest}"`,
        "x-csoai-evidence-state": "HISTORICAL_INVALID_NOT_A_VALID_PROOF",
        "x-csoai-content-sha256": digest,
      },
    });
  } catch {
    return new Response("Historical evidence failed exact-byte verification", { status: 503 });
  }
}

export const onRequest: PagesFunction = async (context) => {
  const request = context.request;
  const path = new URL(request.url).pathname;
  if (!eligible(path)) return context.next();
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  try {
    const response = await fetch(new URL(ARCHIVE_PATH, request.url), {
      headers: { accept: "application/json" },
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      return new Response("Historical evidence archive unavailable", { status: 503 });
    }
    const body = await response.text();
    if (body.length > 4_000_000) {
      return new Response("Archive exceeds bound", { status: 503 });
    }
    return exactHistoricalResponse(request, JSON.parse(body));
  } catch {
    return new Response("Historical evidence archive unavailable", { status: 503 });
  }
};

export { eligible, exactHistoricalResponse };
