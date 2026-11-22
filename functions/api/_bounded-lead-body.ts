/**
 * Bounded JSON decoding for the already-public lead and subscription endpoints.
 * Reading Request.json() first and validating lengths afterwards cannot limit
 * memory consumed by attacker-controlled uploads.
 */
export type IntakeBody =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string };

export async function readIntakeJson(request: Request, byteLimit: number): Promise<IntakeBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
    return { ok: false, status: 415, error: "application/json required" };

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && /^\d+$/.test(lengthHeader) && Number(lengthHeader) > byteLimit)
    return { ok: false, status: 413, error: "request body too large" };
  if (!request.body) return { ok: false, status: 400, error: "body must be JSON" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array))
        return { ok: false, status: 400, error: "body must be JSON" };
      total += next.value.byteLength;
      if (total > byteLimit) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: "request body too large" };
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return { ok: false, status: 400, error: "JSON object required" };
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    try { await reader.cancel(); } catch { /* already closed */ }
    return { ok: false, status: 400, error: "body must be JSON" };
  } finally {
    reader.releaseLock();
  }
}

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254) return null;
  const email = value.trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}

export function cleanOptionalField(value: unknown, limit: number): string | null {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || value.length > limit || /[\r\n\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))
    return null;
  return value.trim();
}

