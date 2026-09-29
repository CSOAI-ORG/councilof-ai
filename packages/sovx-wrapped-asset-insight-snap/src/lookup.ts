/**
 * Looks up the free preview for one token contract on councilof.ai and reduces it to what the insight
 * shows: each record's state, its as_of, and a link to the record. Nothing is scored, ranked or
 * advised; a missing record is said plainly, and a failed fetch says the record could not be fetched.
 */
export const ORIGIN = "https://councilof.ai";
export const API = `${ORIGIN}/api/wrapper/caip19/`;

export type RecordView = { id: string; state: string; asOf: string; evidence: string };
export type Lookup =
  | { kind: "records"; caip19: string; records: RecordView[] }
  | { kind: "none"; caip19: string }
  | { kind: "unavailable"; caip19: string; reason: string };

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/u;
const STATE_RE = /^[A-Z][A-Z_]{2,40}$/u;
const AS_OF_RE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/u;

/** CAIP-19 of the contract a transaction calls, or null (contract creation, or not an EVM chain). */
export function contractCaip19(chainId: string | undefined, to: string | null | undefined): string | null {
  if (!to || !ADDRESS_RE.test(to) || !chainId) {
    return null;
  }
  let reference: number;
  const caip2 = /^eip155:(\d+)$/u.exec(chainId);
  if (caip2) {
    reference = Number(caip2[1]);
  } else if (/^0x[0-9a-fA-F]+$/u.test(chainId)) {
    reference = parseInt(chainId, 16);
  } else {
    return null;
  }
  if (!Number.isSafeInteger(reference) || reference < 1) {
    return null;
  }
  return `eip155:${reference}/erc20:${to}`;
}

/** Only links back to councilof.ai are shown; anything else in an answer is dropped. */
function evidenceLink(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const url = new URL(value);
    return url.origin === ORIGIN ? url.toString() : null;
  } catch {
    return null;
  }
}

export function toRecords(body: unknown): RecordView[] {
  const records = (body as { records?: unknown })?.records;
  if (!Array.isArray(records)) {
    return [];
  }
  const out: RecordView[] = [];
  for (const r of records as Record<string, unknown>[]) {
    const evidence = evidenceLink(r?.evidence);
    if (typeof r?.id === "string" && typeof r.state === "string" && STATE_RE.test(r.state) && typeof r.as_of === "string" && AS_OF_RE.test(r.as_of) && evidence) {
      out.push({ id: r.id, state: r.state, asOf: r.as_of, evidence });
    }
  }
  return out;
}

export async function lookup(caip19: string, fetchImpl: typeof fetch = fetch): Promise<Lookup> {
  try {
    const res = await fetchImpl(API + caip19, { headers: { accept: "application/json" } });
    if (res.status === 404) {
      return { kind: "none", caip19 };
    }
    if (!res.ok) {
      return { kind: "unavailable", caip19, reason: `HTTP ${res.status}` };
    }
    const records = toRecords(await res.json());
    return records.length ? { kind: "records", caip19, records } : { kind: "unavailable", caip19, reason: "the answer carried no readable record" };
  } catch (error) {
    return { kind: "unavailable", caip19, reason: String((error as Error)?.message ?? error).slice(0, 120) };
  }
}
