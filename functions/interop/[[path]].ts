/**
 * GET/HEAD /interop/*.invalid — retain exact historical bytes after build-only packing.
 *
 * Active static assets always win. Only a static 404 whose path is explicitly marked
 * ".invalid" may fall back to the bounded archive. The archive is historical evidence,
 * not a proof, signature, endorsement, or current claim.
 */
interface Env {
  ASSETS?: { fetch: (input: Request | string) => Promise<Response> };
}

const ARCHIVE_PATH = "/archive/retired-proof-bytes-v1.json";
const ARCHIVE_SCHEMA = "csoai.retired-proof-bytes/0.1";
const INVALID_PATH = /^\/interop\/[A-Za-z0-9_./-]+\.invalid$/;

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function digest(bytes: Uint8Array) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", toArrayBuffer(bytes))));
}

function decodeBase64(body: string) {
  const raw = atob(body);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function unavailable(detail: string) {
  return new Response(`historical evidence unavailable: ${detail}`, {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-csoai-evidence-state": "UNCHECKABLE",
    },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const direct = await context.next();
  if (direct.status !== 404) return direct;

  const method = context.request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return direct;

  const path = new URL(context.request.url).pathname;
  if (!INVALID_PATH.test(path) || path.split("/").some((part) => part === "." || part === "..")) {
    return direct;
  }
  if (!context.env.ASSETS) return unavailable("asset binding missing");

  let archiveResponse: Response;
  try {
    archiveResponse = await context.env.ASSETS.fetch(
      new URL(ARCHIVE_PATH, context.request.url).toString(),
    );
  } catch {
    return unavailable("archive read failed");
  }
  if (!archiveResponse.ok) return unavailable(`archive HTTP ${archiveResponse.status}`);

  let archive: any;
  try {
    archive = await archiveResponse.json();
  } catch {
    return unavailable("archive is not JSON");
  }
  if (
    !archive ||
    archive.schema !== ARCHIVE_SCHEMA ||
    !archive.members ||
    typeof archive.members !== "object" ||
    Array.isArray(archive.members)
  ) {
    return unavailable("archive schema mismatch");
  }

  const member = archive.members[path];
  if (!member) return direct;
  if (
    typeof member.body_base64 !== "string" ||
    !/^[a-f0-9]{64}$/.test(String(member.sha256 || "")) ||
    !Number.isSafeInteger(member.bytes) ||
    member.bytes < 0 ||
    member.bytes > 65536
  ) {
    return unavailable("archive member metadata invalid");
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(member.body_base64);
  } catch {
    return unavailable("archive member base64 invalid");
  }
  if (
    bytes.byteLength !== member.bytes ||
    (await digest(bytes)) !== member.sha256
  ) {
    return unavailable("archive member digest mismatch");
  }

  const headers = new Headers({
    "content-type": "application/octet-stream",
    "cache-control": "public, max-age=3600, immutable",
    "access-control-allow-origin": "*",
    "content-length": String(bytes.byteLength),
    "etag": `"${member.sha256}"`,
    "x-csoai-evidence-state": "RETIRED_OR_INVALID_HISTORICAL_BYTES_ONLY",
    "x-csoai-sha256": member.sha256,
  });
  return new Response(method === "HEAD" ? null : toArrayBuffer(bytes), { status: 200, headers });
};
