/** Presentation-only readers for /quickstart; not x402, payment or signature verification. */
export type Resource = { url: string; method?: string; description?: string | null; paid_for?: string | null };
export type Manifest = { resources: Resource[]; mcp?: { url?: string; free_tools?: string[]; paid_tools?: string[] }; verify?: string };
export type Accept = { scheme: string; network: string; asset: string; payTo: string; amount?: string; maxAmountRequired?: string; maxTimeoutSeconds?: number };
export type Challenge = { x402Version: number; accepts: Accept[] };
export const QUICKSTART_TIMEOUT_MS = 8000;
export const QUICKSTART_MAX_BYTES = 131072;
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 4096): v is string => typeof v === "string" && v.length <= max;
const optionalText = (v: unknown) => v === undefined || v === null || text(v);
const names = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 1000 && v.every(n => text(n, 200) && n.trim().length > 0);
function urlText(v: unknown): v is string {
  if (!text(v, 4096) || !v || /[\s\\'"`$\x00-\x1f\x7f]/.test(v)) return false;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try { const u = new URL(v); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; }
}
export function parseManifest(v: unknown): Manifest | null {
  if (!object(v) || !Array.isArray(v.resources) || v.resources.length > 1000) return null;
  const resources: Resource[] = [];
  for (const r of v.resources) {
    if (!object(r) || !urlText(r.url) || !optionalText(r.description) || !optionalText(r.paid_for)) return null;
    if (r.method !== undefined && (!text(r.method, 20) || !/^[A-Z]+$/.test(r.method))) return null;
    resources.push({ url: r.url, method: r.method as string | undefined, description: r.description as string | null | undefined, paid_for: r.paid_for as string | null | undefined });
  }
  const result: Manifest = { resources };
  if (v.mcp !== undefined) {
    if (!object(v.mcp)) return null;
    const m = v.mcp;
    if (m.url !== undefined && !urlText(m.url)) return null;
    if (m.free_tools !== undefined && !names(m.free_tools)) return null;
    if (m.paid_tools !== undefined && !names(m.paid_tools)) return null;
    result.mcp = { url: m.url as string | undefined, free_tools: m.free_tools as string[] | undefined, paid_tools: m.paid_tools as string[] | undefined };
  }
  if (typeof v.verify === "string") { if (!urlText(v.verify)) return null; result.verify = v.verify; }
  else if (v.verify !== undefined && !object(v.verify)) return null;
  return result;
}
export function parseChallenge(v: unknown): Challenge | null {
  if (!object(v) || (v.x402Version !== 1 && v.x402Version !== 2) || !Array.isArray(v.accepts) || v.accepts.length === 0 || v.accepts.length > 100) return null;
  const accepts: Accept[] = [];
  for (const a of v.accepts) {
    if (!object(a)) return null;
    if (![a.scheme, a.network, a.asset, a.payTo].every(x => text(x, 4096) && x.trim().length > 0)) return null;
    for (const key of ["amount", "maxAmountRequired"] as const) {
      if (a[key] !== undefined && (!text(a[key], 100) || !/^\d+$/.test(a[key]))) return null;
    }
    if (a.amount === undefined && a.maxAmountRequired === undefined) return null;
    if (a.maxTimeoutSeconds !== undefined && (!Number.isSafeInteger(a.maxTimeoutSeconds) || (a.maxTimeoutSeconds as number) < 0)) return null;
    accepts.push({ scheme: a.scheme as string, network: a.network as string, asset: a.asset as string, payTo: a.payTo as string, amount: a.amount as string | undefined, maxAmountRequired: a.maxAmountRequired as string | undefined, maxTimeoutSeconds: a.maxTimeoutSeconds as number | undefined });
  }
  return { x402Version: v.x402Version, accepts };
}
/** One attempt. Limits include body consumption; callers suppress results after cleanup. */
export async function readQuickstartJson<T>(url: string, parent: AbortSignal, parse: (v: unknown) => T | null, expectedStatus = 200): Promise<T | null> {
  if (parent.aborted) return null;
  const control = new AbortController();
  let finishStop: (value: null) => void = () => {};
  const stopped = new Promise<null>(resolve => { finishStop = resolve; });
  const stop = () => { control.abort(); finishStop(null); };
  parent.addEventListener("abort", stop, { once: true });
  const timer = setTimeout(stop, QUICKSTART_TIMEOUT_MS);
  const operation = (async (): Promise<T | null> => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(url, { signal: control.signal, headers: { accept: "application/json" } });
      if (control.signal.aborted || response.status !== expectedStatus || !response.body) return null;
      const kind = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (kind !== "application/json") return null;
      reader = response.body.getReader();
      const chunks: Uint8Array[] = []; let bytes = 0;
      while (true) {
        const part = await reader.read();
        if (control.signal.aborted) return null;
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > QUICKSTART_MAX_BYTES) return null;
        chunks.push(part.value);
      }
      const raw = new Uint8Array(bytes); let offset = 0;
      for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
      return parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)));
    } catch { return null; }
    finally { if (reader) void reader.cancel().catch(() => {}); }
  })();
  try { return await Promise.race([operation, stopped]); }
  finally { clearTimeout(timer); parent.removeEventListener("abort", stop); control.abort(); }
}
