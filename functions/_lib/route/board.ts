/**
 * Provenance for the ONE board artifact consumed by a route. A parsed object has
 * already lost its consumed body bytes; never manufacture a digest by serialising it.
 * Fetch may decode Content-Encoding; this is not a compressed/on-wire hash.
 * The read deadline/size bound apply only to this board read, not other MCP tools.
 */
import { sha256Hex } from "./evidence";
import type { BoardProvenance } from "./types";

export const MAX_BOARD_BYTES = 1024 * 1024;
export const BOARD_READ_TIMEOUT_MS = 15_000;

export function unknownBoardProvenance(): BoardProvenance {
  return { artifact_sha256: null, artifact_bytes: null, schema: null, version: null, as_of: null, as_of_field: null };
}

function observedString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value) ? value : null;
}

/** Preserve a valid declared instant verbatim; never replace it with a read time. */
function observedInstant(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] &&
    Number.isFinite(Date.parse(value)) ? value : null;
}

function declaredMetadata(value: unknown): BoardProvenance {
  const p = unknownBoardProvenance();
  if (!value || typeof value !== "object" || Array.isArray(value)) return p;
  const d = value as Record<string, unknown>;
  p.schema = observedString(d.schema);
  p.version = observedString(d.version);
  const snake = observedInstant(d.as_of), camel = observedInstant(d.asOf);
  if (d.as_of !== undefined && d.asOf !== undefined) {
    // Both declarations must agree verbatim. Never pick a preferred timestamp
    // across conflicting or malformed fields.
    if (snake !== null && snake === camel) { p.as_of = snake; p.as_of_field = "as_of+asOf"; }
  } else if (snake !== null) { p.as_of = snake; p.as_of_field = "as_of"; }
  else if (camel !== null) { p.as_of = camel; p.as_of_field = "asOf"; }
  return p;
}

async function responseBytes(response: Response): Promise<Uint8Array> {
  if (!response.body) throw new Error("board response has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0, complete = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("board read timed out")), BOARD_READ_TIMEOUT_MS);
  });
  try {
    if (!response.ok) throw new Error("board HTTP " + response.status);
    const advertised = response.headers.get("content-length");
    if (advertised && /^\d+$/.test(advertised) && Number(advertised) > MAX_BOARD_BYTES)
      throw new Error("board exceeds byte limit");
    for (;;) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) { complete = true; break; }
      size += part.value.byteLength;
      if (size > MAX_BOARD_BYTES) throw new Error("board exceeds byte limit");
      chunks.push(Uint8Array.from(part.value));
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (!complete) {
      // Cancellation closes outstanding reads, but an injected producer's cancel
      // callback must not make the bounded route wait indefinitely.
      await Promise.race([
        reader.cancel().catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 0)),
      ]);
    }
    reader.releaseLock();
  }
}

export async function readBoardSource(input: unknown): Promise<{ value: unknown; provenance: BoardProvenance }> {
  let bytes: Uint8Array | null = null;
  if (typeof Response !== "undefined" && input instanceof Response) {
    bytes = await responseBytes(input);
  } else if (input instanceof Uint8Array) {
    if (input.byteLength > MAX_BOARD_BYTES) throw new Error("board exceeds byte limit");
    bytes = Uint8Array.from(input);
  } else if (input instanceof ArrayBuffer) {
    if (input.byteLength > MAX_BOARD_BYTES) throw new Error("board exceeds byte limit");
    bytes = new Uint8Array(input.slice(0));
  }
  if (bytes === null) return { value: input, provenance: declaredMetadata(input) };
  const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const provenance = declaredMetadata(value);
  provenance.artifact_sha256 = await sha256Hex(bytes);
  provenance.artifact_bytes = bytes.byteLength;
  return { value, provenance };
}
