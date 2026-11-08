/**
 * Live /status reads. A failed read remains UNKNOWN or UNMEASURED in the page;
 * it is never evidence that the component is healthy or down.
 */
export type Read<T> =
  | { ok: true; body: T; readAt: string }
  | { ok: false; error: string; readAt: string };

/**
 * Describe a component read failure without baking browser-specific exception
 * text into the page. HTTP response codes are retained by the readers below.
 * The global prerender fetch-error and JavaScript-error guards stay unchanged.
 */
export function statusReadError(error: unknown): string {
  return error instanceof SyntaxError
    ? "source response could not be decoded"
    : "source request unavailable";
}

export async function readBytes(url: string): Promise<Read<Uint8Array>> {
  const readAt = new Date().toISOString();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, readAt };
    return { ok: true, body: new Uint8Array(await response.arrayBuffer()), readAt };
  } catch (error) {
    return { ok: false, error: statusReadError(error), readAt };
  }
}

export async function readJson<T>(path: string, init?: RequestInit): Promise<Read<T>> {
  const readAt = new Date().toISOString();
  try {
    const response = await fetch(path, {
      cache: "no-store",
      headers: { accept: "application/json" },
      ...init,
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, readAt };
    return { ok: true, body: (await response.json()) as T, readAt };
  } catch (error) {
    return { ok: false, error: statusReadError(error), readAt };
  }
}
