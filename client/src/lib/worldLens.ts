/**
 * Council World read-only public evidence adapters.
 * No model telemetry, simulation outcome, signature, location or human authority
 * is inferred from a public GET. All rejected inputs are UNCHECKABLE.
 */
export type WorldFactKey = "gspc" | "root" | "worker" | "observatory";
export type WorldFact = {
  key: WorldFactKey;
  path: string;
  label: string;
  value: string;
  sourceDate: string | null;
  caveat: string;
};

export type WorldEvent = {
  sourceIndex: number;
  axis: string;
  intent: string;
  sourceEpoch: number;
};

export type Observatory = {
  events: WorldEvent[];
  sourceDate: string;
  sourceHash: string;
  signatureVerification: "not-performed";
};

export const WORLD_SOURCES: Record<WorldFactKey, string> = {
  gspc: "/api/gspc",
  root: "/root.json",
  worker: "/api/worker",
  observatory: "/world/observatory/index.json",
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 220) : null;
}

function boundedCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) &&
    value >= 0 && value <= 10_000_000 ? value : null;
}

function sourceDate(value: unknown): string | null {
  const candidate = string(value);
  return candidate && candidate.length <= 100 ? candidate : null;
}

export function parseObservatory(raw: unknown): Observatory {
  const doc = record(raw);
  const source = record(doc?.source);
  const importMeta = record(doc?.import);
  const count = boundedCount(source?.event_count);
  const digest = string(source?.sha256);
  const generatedAt = sourceDate(source?.generated_at);
  const events = doc?.events;
  if (
    doc?.schema !== "csoai.simulation-observatory/1" ||
    !source || !importMeta ||
    source.url !== "https://councilof.ai/j-space/events.json" ||
    !digest || !/^[0-9a-f]{64}$/i.test(digest) ||
    !generatedAt || !Number.isFinite(Date.parse(generatedAt)) ||
    !Array.isArray(events) || count === null || count !== events.length ||
    count > 10000 ||
    importMeta.event_count !== count ||
    importMeta.upstream_signature_verification !== "not-performed"
  ) throw new Error("SIMULATION_ARCHIVE_UNCHECKABLE");

  const accepted = events.map((candidate: unknown, i: number) => {
    const event = record(candidate);
    const epoch = event?.source_epoch;
    if (
      event?.source_index !== i || !string(event?.axis) ||
      typeof event?.intent !== "string" || event.intent.length > 220 ||
      typeof epoch !== "number" || !Number.isFinite(epoch) ||
      epoch < 0 || epoch > 4102444800
    ) throw new Error("SIMULATION_EVENT_UNCHECKABLE");
    return {
      sourceIndex: i,
      axis: string(event.axis)!,
      intent: event.intent, // An empty source intent is valid evidence of missing data, not a malformed record.
      sourceEpoch: epoch,
    };
  });

  return {
    events: accepted,
    sourceDate: generatedAt,
    sourceHash: digest,
    // The index importer explicitly did NOT validate upstream signatures.
    signatureVerification: "not-performed",
  };
}

export function parseWorldFact(key: WorldFactKey, raw: unknown): WorldFact {
  const doc = record(raw);
  const path = WORLD_SOURCES[key];
  if (!doc) throw new Error("WORLD_SOURCE_UNCHECKABLE");

  if (key === "gspc") {
    const t = record(doc.totals);
    const n = boundedCount(t?.axes);
    if (typeof doc.schema !== "string" || !doc.schema.startsWith("csoai.gspc-axes/") || n === null) {
      throw new Error("GSPC_BOARD_UNCHECKABLE");
    }
    return { key, path, label: "GSPC board", value: String(n) + " published axes",
      sourceDate: sourceDate(record(doc.measured_on)?.date),
      caveat: "Axis count is not a fresh run, separated model leader, certification or universal safety finding." };
  }

  if (key === "root") {
    const n = boundedCount(doc.card_count);
    const asOf = sourceDate(doc.as_of);
    if (n === null || !asOf || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(asOf) ||
      !Number.isFinite(Date.parse(asOf))) throw new Error("PUBLIC_ROOT_UNCHECKABLE");
    return { key, path, label: "Public root", value: String(n) + " recorded leaves",
      sourceDate: asOf,
      caveat: "Count and timestamp are source-reported; this interface has not independently verified signatures or inclusion." };
  }

  if (key === "worker") {
    const status = string(doc.status);
    if (typeof doc.schema !== "string" || !doc.schema.startsWith("csoai.worker-state/") ||
      !status || !["OFFLINE", "ONLINE", "DEGRADED", "UNKNOWN", "LIVE"].includes(status)) {
      throw new Error("WORKER_STATE_UNCHECKABLE");
    }
    return { key, path, label: "Measurement worker", value: status,
      sourceDate: null,
      caveat: "HTTP 200 can report OFFLINE. A health response does not establish signed-card admission or public effect." };
  }

  const obs = parseObservatory(raw);
  return { key, path, label: "SovSpace archive", value: String(obs.events.length) + " indexed events",
    sourceDate: obs.sourceDate,
    caveat: "Dated source-linked projection. Hash is claimed by the index; upstream signatures were not verified." };
}

export function eventAt(observatory: Observatory | null, index: number): WorldEvent | null {
  if (!observatory || !Number.isSafeInteger(index) || index < 0) return null;
  return observatory.events[index] ?? null;
}
