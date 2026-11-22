/**
 * Bounded JSON request reader for the public enquiry route.
 *
 * Input limits applied AFTER request.text() are not a resource limit: an attacker
 * can stream an arbitrarily large body into memory before those checks run.
 * This reader caps bytes before accumulating them or parsing JSON.
 */
export const CONTACT_MAX_BODY_BYTES = 32 * 1024;
export const CONTACT_MAX_JSON_CHARS = 8500;

export type ContactBodyRead =
  | { state: "OK"; text: string }
  | { state: "TOO_LARGE" | "BAD_BODY" };

export async function readBoundedContactBody(request: Request): Promise<ContactBodyRead> {
  const announced = request.headers.get("content-length");
  if (announced && /^\d+$/.test(announced) && Number(announced) > CONTACT_MAX_BODY_BYTES)
    return { state: "TOO_LARGE" };

  if (!request.body) return { state: "BAD_BODY" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const bytes = next.value;
      if (!(bytes instanceof Uint8Array)) return { state: "BAD_BODY" };
      length += bytes.byteLength;
      if (length > CONTACT_MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { state: "TOO_LARGE" };
      }
      chunks.push(bytes);
    }

    const buffer = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, at);
      at += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (text.length > CONTACT_MAX_JSON_CHARS) return { state: "TOO_LARGE" };
    return { state: "OK", text };
  } catch {
    try { await reader.cancel(); } catch { /* stream may already be closed */ }
    return { state: "BAD_BODY" };
  } finally {
    reader.releaseLock();
  }
}
