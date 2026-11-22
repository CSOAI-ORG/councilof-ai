import { verifyCardHref } from "@/lib/cardParam";

/** Presentation readers only. Historical records and the canonical board are not modified. */
export const JAIL_INDEX_URL = "/interop/jail-index.json";
export const JAIL_INDEX_LIMIT = 64 * 1024;
export const JAIL_INDEX_TIMEOUT_MS = 8_000;

export type JailArchive = {
  asOf: string;
  dataset: string;
  datasetUrl: string;
  separation: string;
  cards: Array<{ id: string; url: string }>;
};
export type JailBoardRow = {
  status: string;
  separation: string;
  n: number | null;
  accuracy: number | null;
  bench: string | null;
  scope: string | null;
  basis: string | null;
  accuracyIs: string | null;
  observedOn: string | null;
};
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 8192 ? v.trim() : null;
const day = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const separation = (v: unknown): string =>
  v === "SEPARATED" || v === "TIE" || v === "UNTESTED" ? v : "Not published";

/** Never replace an unreadable current row with the historical folder's numbers. */
export function readJailBoard(data: unknown): JailBoardRow | null {
  if (!object(data) || !Array.isArray(data.axes)) return null;
  const rows = data.axes.filter((a: unknown) => object(a) && a.axis === "jail");
  if (rows.length !== 1 || !object(rows[0])) return null;
  const a = rows[0];
  const measured = a.status === "MEASURED";
  const time = object(a.measurement_time) ? a.measurement_time : null;
  return {
    status: typeof a.status === "string"
      && ["MEASURED", "UNMEASURED", "DRAFT", "SPEC", "PLANNED"].includes(a.status)
      ? a.status : "Not published",
    separation: measured ? separation(a.separation) : "Not published",
    n: measured && typeof a.n === "number" && Number.isSafeInteger(a.n) && a.n > 0 ? a.n : null,
    accuracy: measured && typeof a.accuracy === "number" && Number.isFinite(a.accuracy)
      && a.accuracy >= 0 && a.accuracy <= 1 ? a.accuracy : null,
    bench: text(a.bench),
    scope: text(a.n_note) ?? text(a.task),
    basis: text(a.separation_basis),
    accuracyIs: text(a.accuracy_is),
    observedOn: time && day(time.observed_on) ? time.observed_on : null,
  };
}

/** Links from the archive are data: permit only its declared dataset and exact card paths. */
export function parseJailArchive(value: unknown): JailArchive {
  if (!object(value) || value.schema !== "csoai.jail-index/0.1"
    || value.kind !== "folder" || value.writes_board !== false || value.axis !== "jail"
    || !day(value.as_of) || typeof value.dataset !== "string"
    || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(value.dataset)
    || [".", ".."].includes(value.dataset.split("/")[1])
    || value.dataset_url !== `https://huggingface.co/datasets/${value.dataset}`
    || !Array.isArray(value.cards) || value.cards.length > 128) {
    throw new Error("Invalid archived jail index");
  }
  const seen = new Set<string>();
  const cards = value.cards.map((card: unknown) => {
    if (!object(card) || typeof card.id !== "string" || !/^[a-f0-9]{64}$/.test(card.id)
      || card.axis !== "jail-escape-detection" || card.url !== `/signed/cards/${card.id}.json`
      || seen.has(card.id)) throw new Error("Invalid archived jail card");
    seen.add(card.id);
    return { id: card.id, url: card.url };
  });
  return { asOf: value.as_of, dataset: value.dataset, datasetUrl: value.dataset_url,
    separation: separation(value.separation), cards };
}

/** A failed/oversized/non-JSON response is an error, never a successful empty index. */
export async function fetchJailArchive(signal: AbortSignal, request: typeof fetch = fetch): Promise<JailArchive> {
  signal.throwIfAborted();
  const response = await request(JAIL_INDEX_URL, {
    signal, cache: "no-store", redirect: "error", headers: { accept: "application/json" },
  });
  if (signal.aborted || !response.ok) {
    // Release unread bodies, without allowing a transport's cancellation promise
    // to postpone the error or turn an aborted request into a successful read.
    void response.body?.cancel().catch(() => {});
    signal.throwIfAborted();
    throw new Error(`Archived index returned HTTP ${response.status}`);
  }
  if (!response.body) throw new Error("Archived index has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let finished = false;
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    void reader.cancel().catch(() => {});
  };
  // Also stop a stalled body when a compatible request adapter does not relay
  // the AbortSignal to its stream. The component owns the eight-second timer.
  signal.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      signal.throwIfAborted();
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) { finished = true; break; }
      length += part.value.byteLength;
      if (length > JAIL_INDEX_LIMIT) {
        throw new Error("Archived index exceeds the read limit");
      }
      chunks.push(part.value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!finished) cancel();
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return parseJailArchive(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

export function jailVerifyHref(card: JailArchive["cards"][number]): string {
  return verifyCardHref(card.url);
}
