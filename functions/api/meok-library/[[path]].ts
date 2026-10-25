/**
 * Same-origin transport for the existing private Company gateway, not a second executor.
 *
 * The backend operator must qualify the canonical review-first receiver, its real
 * account/private admission checks, and edge-to-receiver Host/Content-Length
 * handling BEFORE installing MEOK_LIBRARY_GATEWAY_ORIGIN. This PR installs no
 * origin or grant. The source-declared host is not evidence of a live receiver.
 */
import { verifyToken, type AuthEnv } from "../_authCrypto";

interface Env extends AuthEnv {
  MEOK_LIBRARY_GATEWAY_ORIGIN?: string;
}

const GATEWAY_ORIGIN = "https://api.meok.ai";
const PREFIX = "/api/meok-library/cases";
const CASE_PATH = /^\/api\/meok-library\/cases\/case_[a-f0-9]{64}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;
const ERROR_CODE = /^[a-z][a-z0-9_]{0,79}$/;
const MAX_BODY = 8192;
const MAX_REPLY = 524288;
const TOTAL_MS = 25000;
const ERROR_STATUSES = new Set([400, 401, 403, 404, 409, 413, 415, 429, 503]);

class RelayError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonType(headers: Headers): boolean {
  return /^application\/json(?:\s*;\s*charset=utf-8)?\s*$/i.test(headers.get("content-type") || "");
}

function wellFormed(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  return true;
}

function safeHeaders(): Headers {
  return new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    pragma: "no-cache",
    "x-content-type-options": "nosniff",
  });
}

function failure(status: number, error: string, outcomeUnknown = false): Response {
  return new Response(JSON.stringify({
    error, saved: false,
    ...(outcomeUnknown ? { outcome_unknown: true, retry_post: false } : {}),
  }), { status, headers: safeHeaders() });
}

/** Exported for transport tests; production enters through the Pages handler. */
export async function relayCompanyCase(request: Request, env: Env): Promise<Response> {
  const controller = new AbortController();
  let stopped = false;
  let postDispatched = false;
  let rejectStop: (error: RelayError) => void = () => {};
  const stop = new Promise<never>((_, reject) => { rejectStop = reject; });
  const halt = () => {
    if (stopped) return;
    stopped = true;
    controller.abort();
    rejectStop(new RelayError(503, "private_library_connection_unavailable"));
  };
  const timer = setTimeout(halt, TOTAL_MS);
  request.signal.addEventListener("abort", halt, { once: true });
  const active = () => {
    if (stopped) throw new RelayError(503, "private_library_connection_unavailable");
  };
  // Race every I/O boundary, including reads whose producer ignores abort/cancel.
  const wait = async <T>(operation: Promise<T>): Promise<T> => {
    const value = await Promise.race([operation, stop]);
    active();
    return value;
  };
  const bytes = async (stream: ReadableStream<Uint8Array> | null, maximum: number, status: number): Promise<Uint8Array> => {
    if (!stream) return new Uint8Array();
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    let complete = false;
    try {
      for (;;) {
        const part = await wait(reader.read());
        if (part.done) { complete = true; break; }
        size += part.value.byteLength;
        if (size > maximum) throw new RelayError(status, status === 413 ? "request_too_large" : "private_library_response_invalid");
        chunks.push(part.value);
      }
      const result = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
      return result;
    } finally {
      // Cancellation is advisory; an uncooperative producer must not hold the reply open.
      if (!complete) void reader.cancel().catch(() => {});
      else reader.releaseLock();
    }
  };
  const decode = (raw: Uint8Array, status: number): Record<string, unknown> => {
    try {
      const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
      if (record(parsed)) return parsed;
    } catch { /* Never echo request, response or exception text. */ }
    throw new RelayError(status, status === 400 ? "invalid_request" : "private_library_response_invalid");
  };
  const operation = async (): Promise<Response> => {
    active();
    const url = new URL(request.url);
    const create = request.method === "POST" && url.pathname === PREFIX;
    const read = request.method === "GET" && CASE_PATH.test(url.pathname);
    if (request.url.includes("?") || request.url.includes("#") || url.username || url.password || (!create && !read)) {
      throw new RelayError(404, "not_found");
    }
    // No default, arbitrary URL, lookalike host, caller-selected receiver or fallback.
    if (env.MEOK_LIBRARY_GATEWAY_ORIGIN !== GATEWAY_ORIGIN) {
      throw new RelayError(503, "private_library_connection_unavailable");
    }
    const origin = request.headers.get("origin");
    if (origin !== null && origin !== url.origin) throw new RelayError(403, "forbidden");
    const authorization = request.headers.get("authorization") || "";
    if (authorization.length > 8192 || !/^Bearer [A-Za-z0-9+/=]+$/.test(authorization)) {
      throw new RelayError(401, "unauthorized");
    }
    // Screening only. The private gateway independently checks the actual account,
    // rejects the retired demo identity, and enforces its exact private admission.
    const user = await wait(verifyToken(env, authorization.slice(7)));
    if (!user) throw new RelayError(401, "unauthorized");
    // The existing receiver accepts at most 2048 bytes per header line. A valid
    // longer Council session is a transport limitation, not an invalid login.
    // Leave framing room; never truncate/reissue its token or dispatch a write.
    if (authorization.length > 2000) throw new RelayError(503, "private_library_connection_unavailable");
    let body: Uint8Array | undefined;
    if (create) {
      if (!jsonType(request.headers) ||
          ![null, "identity"].includes(request.headers.get("content-encoding"))) {
        throw new RelayError(415, "unsupported_media_type");
      }
      body = await bytes(request.body, MAX_BODY, 413);
      const parsed = decode(body, 400);
      if (Object.keys(parsed).sort().join(",") !== "request,request_id" ||
          typeof parsed.request !== "string" || !parsed.request.trim() ||
          parsed.request.length > 2000 || !wellFormed(parsed.request) ||
          typeof parsed.request_id !== "string" || !REQUEST_ID.test(parsed.request_id)) {
        throw new RelayError(400, "invalid_request");
      }
    } else if (request.body !== null) throw new RelayError(400, "invalid_request");
    active();
    const headers = new Headers({ authorization, accept: "application/json", "accept-encoding": "identity" });
    if (create) headers.set("content-type", "application/json");
    postDispatched = create;
    const upstream = await wait(fetch(GATEWAY_ORIGIN + url.pathname, {
      method: request.method, headers,
      // Workers does not implement redirect:error. Never follow or relay redirects.
      redirect: "manual", credentials: "omit", cache: "no-store",
      signal: controller.signal,
      // A fixed TypedArray lets Workers calculate Content-Length. Do not stream
      // an unknown-length body to the canonical receiver's strict HTTP parser.
      ...(body ? { body } : {}),
    }));
    if (upstream.redirected || !([200, 202].includes(upstream.status) || ERROR_STATUSES.has(upstream.status)) ||
        !jsonType(upstream.headers)) {
      void upstream.body?.cancel().catch(() => {});
      throw new RelayError(503, "private_library_response_invalid");
    }
    const raw = await bytes(upstream.body, MAX_REPLY, 503);
    const parsed = decode(raw, 503);
    if (upstream.status === 200 || upstream.status === 202) {
      if (parsed.schema !== "meok.library-case/1" || parsed.saved !== (upstream.status === 200)) {
        throw new RelayError(503, "private_library_response_invalid");
      }
    } else if (parsed.saved !== false || typeof parsed.error !== "string" || !ERROR_CODE.test(parsed.error) ||
        (parsed.outcome_unknown !== undefined && typeof parsed.outcome_unknown !== "boolean") ||
        (parsed.outcome_unknown === true && parsed.retry_post !== false)) {
      throw new RelayError(503, "private_library_response_invalid");
    }
    active();
    // Receipt digests depend on original JSON bytes. Do not reserialize, rewrite
    // status, promote awaiting-review to saved, or forward Set-Cookie/Location.
    return new Response(raw, { status: upstream.status, headers: safeHeaders() });
  };
  try {
    if (request.signal.aborted) halt();
    return await Promise.race([operation(), stop]);
  } catch (error) {
    const known = error instanceof RelayError ? error : new RelayError(503, "private_library_connection_unavailable");
    return failure(known.status, known.code, postDispatched);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", halt);
  }
}

export const onRequest: PagesFunction<Env> = ({ request, env }) => relayCompanyCase(request, env);
