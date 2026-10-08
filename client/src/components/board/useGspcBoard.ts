/**
 * useGspcBoard — the single live read of GET /api/gspc for every board surface.
 *
 * WHY A SHARED HOOK. LiveLeaderboard and HumanVsAiPanel both need the board, and
 * both may sit on the same page. One subscribed feed means one request, one
 * failure mode, one truth on screen. There is no fallback payload and no seeded
 * sample: if the endpoint does not answer, `error` is set and the components say
 * so in words. A placeholder number is a lie with a nice font.
 *
 * NOTHING HERE INVENTS A FIELD. Every accessor is optional and every derived
 * value is `null` when the payload does not carry it. Counts (how many axes, how
 * many measured) come from `totals` — never from a constant in this file.
 */
import { useSyncExternalStore } from "react";

export interface GspcAxis {
  axis: string;
  bench?: string;
  task?: string;
  n?: number;
  n_note?: string;
  /** What an n counts, when it is not bank items (e.g. "issuer accounts"). */
  n_unit?: string;
  /** "gspc" (the behavioural axes) or "financial" (the financial/domain axes). */
  family?: "gspc" | "financial" | string;
  /**
   * The measurement KIND. Load-bearing for display: a `deterministic-facts` axis
   * is measured but has no fleet and therefore no leader, no accuracy and no
   * applicable separation test — which is a different fact from a `declared-slot`
   * axis, which has no measurement at all. Reading absence without reading kind
   * is what let a signed mainnet run render as "UNMEASURED".
   */
  kind?: "model-comparison" | "deterministic-facts" | "declared-slot" | string;
  /** How much of the axis's own declared universe was covered. The figure a facts axis HAS. */
  coverage?: string;
  coverage_note?: string;
  /** Absolute on-site path to the run artifact, for an axis with no HuggingFace bank. */
  evidence_url?: string;
  /** Authentication state of that run. A content ID is never inferred to be a signature. */
  run_attestation?: "ED25519_SIGNED" | "CONTENT_ADDRESSED_UNSIGNED";
  /** The board LEADER's figure on this axis, 0–1. Absent on a slot with no measurement. */
  accuracy?: number;
  /** Set when `accuracy` is NOT a point estimate (e.g. a stated Wilson lower bound). */
  accuracy_is?: string;
  leader?: string;
  separation?: "SEPARATED" | "TIE" | "UNTESTED" | string;
  separation_p?: number;
  separation_basis?: string;
  interval?: [number, number];
  fleet?: string;
  fleet_mean?: number;
  status?: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED" | string;
  dataset?: string;
  note?: string;
  /** Only read if the API starts publishing one. Never written by this file. */
  human_baseline?:
    | number
    | {
        value?: number;
        accuracy?: number;
        source?: string;
        state?: string;
        note?: string;
      };
  human_accuracy?: number;
  [k: string]: unknown;
}

export interface GspcTotals {
  axes?: number;
  measured_axes?: number;
  quotable_axes?: number;
  public_count?: string;
  /** Carded external public leaders only — not equal to measured_axes (BLUEPRINT A1). */
  public_leader_count?: number;
  /** Lid sentence: measured · fleets · public leaders · fact runs · not a certificate. */
  lid?: string;
  /**
   * SEPARATION, over the model-comparison axes only. These four fields are the reason the
   * board's "N measured" line can never stand alone on a public surface: an axis is MEASURED
   * when a run exists behind it, which is a different and much weaker fact than the axis
   * having told two models apart. Read all four together or none of them.
   */
  comparison_axes?: number;
  separated_leads?: number;
  ties?: number;
  untested_separations?: number;
  items?: number;
  [k: string]: unknown;
}

export interface GspcPayload {
  schema?: string;
  totals?: GspcTotals;
  axes?: GspcAxis[];
  /** The internal living-board convention. Served for honesty; NOT the board. */
  measured_in_lane?: GspcAxis[];
  measured_on?: Record<string, unknown>;
  limitations?: string[];
  human_baseline?: unknown;
  site_attestation?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface GspcBoardState {
  data: GspcPayload | null;
  error: string | null;
  loading: boolean;
  readAt?: string | null;
  refreshing?: boolean;
}
export interface GspcBoardSnapshot extends GspcBoardState {
  /** UTC time this client validated the response, never the measurement time. */
  readAt: string | null;
  refreshing: boolean;
}
export interface GspcBoardLiveState extends GspcBoardSnapshot {
  refresh: () => Promise<void>;
}
export const GSPC_ENDPOINT = "/api/gspc";
export const GSPC_READ_TIMEOUT_MS = 15_000;
export const GSPC_REFRESH_MS = 60_000;
const LIVE_GSPC = "https://councilof.ai/api/gspc";
const GSPC_SCHEMA = "csoai.gspc-axes/0.5";
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const figure = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

/** Validate the published contract without filling, renaming or normalising any field. */
export function validateGspcPayload(value: unknown): GspcPayload {
  function invalid(reason: string): never {
    throw new Error("Unreadable board: " + reason);
  }
  if (!record(value) || value.schema !== GSPC_SCHEMA)
    invalid("unsupported or missing schema");
  if (!Array.isArray(value.axes) || !record(value.totals))
    invalid("missing axes or totals");
  const axes = value.axes;
  const totals = value.totals;
  const names = new Set<string>();
  const statuses = new Set([
    "MEASURED",
    "UNMEASURED",
    "DRAFT",
    "SPEC",
    "PLANNED",
  ]);
  const kinds = new Set([
    "model-comparison",
    "deterministic-facts",
    "declared-slot",
  ]);
  const separations = new Set(["SEPARATED", "TIE", "UNTESTED"]);
  for (const a of axes) {
    if (
      !record(a) ||
      typeof a.axis !== "string" ||
      !a.axis.trim() ||
      names.has(a.axis)
    ) {
      invalid("missing or duplicate axis id");
    }
    names.add(a.axis);
    if (typeof a.status !== "string" || !statuses.has(a.status))
      invalid(a.axis + ": unknown status");
    if (typeof a.kind !== "string" || !kinds.has(a.kind))
      invalid(a.axis + ": unknown kind");
    if (a.n !== undefined && !count(a.n)) invalid(a.axis + ": invalid n");
    if (a.accuracy != null && !figure(a.accuracy))
      invalid(a.axis + ": invalid accuracy");
    if (
      a.interval != null &&
      (!Array.isArray(a.interval) ||
        a.interval.length !== 2 ||
        !a.interval.every(figure) ||
        a.interval[0] > a.interval[1])
    ) {
      invalid(a.axis + ": invalid interval");
    }
    if (
      a.leader != null &&
      (typeof a.leader !== "string" || !a.leader.trim())
    ) {
      invalid(a.axis + ": invalid leader");
    }
    if (
      a.separation != null &&
      (typeof a.separation !== "string" || !separations.has(a.separation))
    ) {
      invalid(a.axis + ": unknown separation");
    }
    if (a.kind === "declared-slot" && a.status === "MEASURED")
      invalid(a.axis + ": measured declared slot");
    if (
      a.kind !== "model-comparison" &&
      (a.separation != null ||
        a.accuracy != null ||
        a.interval != null ||
        a.leader != null)
    ) {
      invalid(a.axis + ": comparison fields on a non-comparison axis");
    }
    if (
      a.status !== "MEASURED" &&
      (a.accuracy != null ||
        a.interval != null ||
        a.leader != null ||
        a.separation != null)
    )
      invalid(a.axis + ": comparison fields without a measurement");
    if (
      a.status === "MEASURED" &&
      a.kind === "model-comparison" &&
      a.separation == null
    ) {
      invalid(a.axis + ": missing separation state");
    }
  }
  const measured = axes.filter((a) => a.status === "MEASURED");
  const comparisons = measured.filter((a) => a.kind === "model-comparison");
  const expected: Record<string, number> = {
    axes: axes.length,
    measured_axes: measured.length,
    unmeasured_axes: axes.length - measured.length,
    comparison_axes: comparisons.length,
    fact_runs: measured.filter((a) => a.kind === "deterministic-facts").length,
  };
  for (const [key, n] of Object.entries(expected)) {
    if (!count(totals[key]) || totals[key] !== n)
      invalid("contradictory or missing totals." + key);
  }
  const separationKeys = [
    "separated_leads",
    "ties",
    "untested_separations",
  ] as const;
  if (separationKeys.some((key) => totals[key] !== undefined)) {
    const expectedSeparation = [
      comparisons.filter((a) => a.separation === "SEPARATED").length,
      comparisons.filter((a) => a.separation === "TIE").length,
      comparisons.filter((a) => a.separation === "UNTESTED").length,
    ];
    separationKeys.forEach((key, i) => {
      if (!count(totals[key]) || totals[key] !== expectedSeparation[i]) {
        invalid("contradictory or incomplete totals." + key);
      }
    });
  }
  if (totals.public_count !== undefined) {
    const text =
      typeof totals.public_count === "string" ? totals.public_count : "";
    const match = /^(\d+) (?:axis|axes) · (\d+) measured$/.exec(text);
    if (
      !match ||
      Number(match[1]) !== axes.length ||
      Number(match[2]) !== measured.length
    ) {
      invalid("contradictory totals.public_count");
    }
  }
  return value as unknown as GspcPayload;
}
class PreviewTransportError extends Error {}
function isLocalPreview(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost")
  );
}
export interface GspcBoardReaderOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  timeoutMs?: number;
  localPreview?: () => boolean;
}
export interface GspcBoardReader {
  getSnapshot: () => GspcBoardSnapshot;
  subscribe: (listener: () => void) => () => void;
  load: () => Promise<GspcPayload>;
  refresh: () => Promise<void>;
}
/** One stable store and one bounded operation shared by every subscribing board surface. */
export function createGspcBoardReader(
  options: GspcBoardReaderOptions = {},
): GspcBoardReader {
  const fetcher =
    options.fetch ??
    ((...args: Parameters<typeof globalThis.fetch>) =>
      globalThis.fetch(...args));
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.timeoutMs ?? GSPC_READ_TIMEOUT_MS;
  const localPreview = options.localPreview ?? isLocalPreview;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error("Invalid board read timeout");
  let snapshot: GspcBoardSnapshot = {
    data: null,
    error: null,
    loading: true,
    refreshing: false,
    readAt: null,
  };
  const listeners = new Set<() => void>();
  type Operation = {
    controller: AbortController;
    promise: Promise<GspcPayload>;
    cancel: () => void;
  };
  let operation: Operation | null = null;
  let nextReadAt = 0;
  let automaticTimer: ReturnType<typeof setTimeout> | null = null;
  const publish = (next: GspcBoardSnapshot) => {
    snapshot = next;
    for (const listener of [...listeners]) listener();
  };
  const visible = () =>
    typeof document === "undefined" || document.visibilityState !== "hidden";
  const clearAutomatic = () => {
    if (automaticTimer !== null) clearTimeout(automaticTimer);
    automaticTimer = null;
  };
  function scheduleAutomatic() {
    clearAutomatic();
    if (listeners.size === 0 || !visible()) return;
    const delay = nextReadAt - now().getTime();
    // A pending generation owns the next wakeup when its deadline has passed.
    if (operation && delay <= 0) return;
    automaticTimer = setTimeout(automaticRead, Math.max(0, delay));
  }
  function automaticRead() {
    clearAutomatic();
    if (listeners.size === 0 || !visible()) return;
    if (!operation) void load().catch(() => undefined);
    scheduleAutomatic();
  }
  const start = (): Promise<GspcPayload> => {
    if (operation) return operation.promise;
    const before = snapshot;
    const controller = new AbortController();
    let rejectStop!: (reason: Error) => void;
    const stopped = new Promise<never>((_, reject) => {
      rejectStop = reject;
    });
    let timer: ReturnType<typeof setTimeout>;
    const op = { controller } as Operation;
    const retire = (reason: Error, intentional: boolean) => {
      if (operation !== op) return;
      operation = null;
      if (intentional) nextReadAt = 0;
      clearTimeout(timer);
      controller.abort();
      rejectStop(reason);
      publish(
        intentional
          ? { ...before, loading: false, refreshing: false }
          : {
              ...snapshot,
              error: reason.message,
              loading: false,
              refreshing: false,
            },
      );
      scheduleAutomatic();
    };
    op.cancel = () => retire(new Error("Board read cancelled"), true);
    const read = async (url: string): Promise<GspcPayload> => {
      const r = await fetcher(url, {
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (controller.signal.aborted) throw new Error("Board read cancelled");
      if (!r.ok) {
        const message = url + " answered HTTP " + r.status;
        if (r.status === 404) throw new PreviewTransportError(message);
        throw new Error(message);
      }
      const text = await r.text();
      if (controller.signal.aborted) throw new Error("Board read cancelled");
      const trimmed = text.replace(/^\uFEFF/, "").trim();
      if (trimmed.startsWith("<"))
        throw new PreviewTransportError(url + " returned HTML, not JSON");
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        throw new Error(url + " returned malformed JSON");
      }
      return validateGspcPayload(parsed);
    };
    const work = Promise.resolve().then(async () => {
      try {
        return await read(GSPC_ENDPOINT);
      } catch (e) {
        if (
          !controller.signal.aborted &&
          localPreview() &&
          e instanceof PreviewTransportError
        ) {
          return read(LIVE_GSPC);
        }
        throw e;
      }
    });
    op.promise = Promise.race([work, stopped])
      .then(
        (data) => {
          if (operation === op) {
            const readAt = now().toISOString();
            operation = null;
            clearTimeout(timer);
            publish({
              data,
              error: null,
              loading: false,
              refreshing: false,
              readAt,
            });
            scheduleAutomatic();
          }
          return data;
        },
        (e) => {
          if (operation === op) {
            operation = null;
            clearTimeout(timer);
            publish({
              ...snapshot,
              error: String(e?.message ?? e),
              loading: false,
              refreshing: false,
            });
            scheduleAutomatic();
          }
          throw e;
        },
      )
      .finally(() => {
        clearTimeout(timer);
        controller.abort();
      });
    operation = op;
    nextReadAt = now().getTime() + GSPC_REFRESH_MS;
    timer = setTimeout(
      () =>
        retire(
          new Error("Board read timed out after " + timeoutMs + " ms"),
          false,
        ),
      timeoutMs,
    );
    scheduleAutomatic();
    publish({
      ...snapshot,
      error: null,
      loading: snapshot.data === null,
      refreshing: snapshot.data !== null,
    });
    return op.promise;
  };
  const load = (): Promise<GspcPayload> => {
    if (operation) return operation.promise;
    if (now().getTime() < nextReadAt) {
      if (snapshot.error) return Promise.reject(new Error(snapshot.error));
      if (snapshot.data) return Promise.resolve(snapshot.data);
    }
    return start();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      const first = listeners.size === 0;
      listeners.add(listener);
      // Finish lifecycle attachment before a load can notify reentrant subscribers.
      if (first) {
        if (typeof window !== "undefined")
          window.addEventListener("focus", automaticRead);
        if (typeof document !== "undefined")
          document.addEventListener("visibilitychange", automaticRead);
      }
      automaticRead();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          clearAutomatic();
          if (typeof window !== "undefined")
            window.removeEventListener("focus", automaticRead);
          if (typeof document !== "undefined")
            document.removeEventListener("visibilitychange", automaticRead);
        }
        const pending = operation;
        queueMicrotask(() => {
          if (listeners.size === 0 && pending && operation === pending)
            pending.cancel();
        });
      };
    },
    load,
    refresh: async () => {
      try {
        await start();
      } catch {
        /* shared error state is the UI result */
      }
    },
  };
}
const sharedBoardReader = createGspcBoardReader();
export function loadGspcBoard(): Promise<GspcPayload> {
  return sharedBoardReader.load();
}
export function refreshGspcBoard(): Promise<void> {
  return sharedBoardReader.refresh();
}
export function useGspcBoard(): GspcBoardLiveState {
  const state = useSyncExternalStore(
    sharedBoardReader.subscribe,
    sharedBoardReader.getSnapshot,
    sharedBoardReader.getSnapshot,
  );
  return { ...state, refresh: refreshGspcBoard };
}

/* ── honest readers ──────────────────────────────────────────────────────── */

/** A slot carries a quotable figure only when it is MEASURED and the number is real. */
export function hasFigure(a: GspcAxis): boolean {
  return (
    a.status === "MEASURED" &&
    typeof a.accuracy === "number" &&
    Number.isFinite(a.accuracy)
  );
}

/**
 * Rows, ordered by the measured figure — with every unmeasured slot kept and
 * pushed to the end. Ordering is presentation, NOT a ranking claim: a TIE row
 * sits high on its point estimate while carrying a chip that says the lead is
 * not statistically separated.
 */
export function orderedRows(data: GspcPayload | null): GspcAxis[] {
  const axes = Array.isArray(data?.axes) ? [...(data!.axes as GspcAxis[])] : [];
  return axes.sort((x, y) => {
    const fx = hasFigure(x),
      fy = hasFigure(y);
    if (fx !== fy) return fx ? -1 : 1;
    if (!fx) return 0;
    return (y.accuracy as number) - (x.accuracy as number);
  });
}

/** The count line, read from the payload. Returns null rather than guessing. */
export function countLine(data: GspcPayload | null): string | null {
  const t = data?.totals;
  if (!t) return null;
  if (typeof t.lid === "string" && t.lid.trim()) return t.lid.trim();
  if (typeof t.public_count === "string" && t.public_count.trim()) {
    const base = t.public_count.trim();
    if (typeof t.public_leader_count === "number") {
      return `${base} · ${t.public_leader_count} public leader scores`;
    }
    return base;
  }
  if (typeof t.measured_axes === "number" && typeof t.axes === "number") {
    const base = `${t.measured_axes} measured of ${t.axes}`;
    if (typeof t.public_leader_count === "number") {
      return `${base} · ${t.public_leader_count} public leader scores`;
    }
    return base;
  }
  return null;
}

export interface HumanLeg {
  /** 0–1. */
  value: number;
  label: string;
  source: string;
  /** Data state as the payload declares it — REPORTED for a cited third-party aggregate. */
  state: string;
  note?: string;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;

/**
 * Find a PUBLISHED human-baseline figure in the payload — and only that.
 *
 * The board's `human-vs-ai` in-lane slot is NOT a human score: it measures how
 * often a MODEL agrees with a human key. It is deliberately not matched here.
 * When nothing is published, this returns null and the panel says "not yet
 * published". It never manufactures a leg.
 */
export function findHumanBaseline(data: GspcPayload | null): HumanLeg | null {
  if (!data) return null;

  const fromObject = (
    o: Record<string, unknown> | undefined | null,
  ): HumanLeg | null => {
    if (!o || typeof o !== "object") return null;
    const v =
      num((o as any).value) ??
      num((o as any).accuracy) ??
      num((o as any).score);
    if (v === null) return null;
    return {
      value: v,
      label: String((o as any).label ?? (o as any).task ?? "human baseline"),
      source: String((o as any).source ?? "stated in the /api/gspc payload"),
      state: String((o as any).state ?? "REPORTED"),
      note: typeof (o as any).note === "string" ? (o as any).note : undefined,
    };
  };

  const direct = fromObject(data.human_baseline as Record<string, unknown>);
  if (direct) return direct;

  const flat = num(
    (data.human_baseline as unknown) ?? (data.totals as any)?.human_baseline,
  );
  if (flat !== null) {
    return {
      value: flat,
      label: "human baseline",
      source: "stated in the /api/gspc payload",
      state: "REPORTED",
    };
  }

  for (const a of [...(data.axes ?? []), ...(data.measured_in_lane ?? [])]) {
    const nested = fromObject(a.human_baseline as Record<string, unknown>);
    if (nested)
      return {
        ...nested,
        label:
          nested.label === "human baseline"
            ? `${a.axis} — human baseline`
            : nested.label,
      };
    const v = num(a.human_baseline as unknown) ?? num(a.human_accuracy);
    if (v !== null) {
      return {
        value: v,
        label: `${a.axis} — human baseline`,
        source:
          typeof a.dataset === "string"
            ? a.dataset
            : "stated on the axis in /api/gspc",
        state: "REPORTED",
      };
    }
  }

  return null;
}

/** The in-lane human-vs-AI slot, if the payload serves one. This is the AI leg. */
export function findHumanVsAiSlot(data: GspcPayload | null): GspcAxis | null {
  const pool = [...(data?.measured_in_lane ?? []), ...(data?.axes ?? [])];
  return pool.find((a) => /human[-_\s]?vs[-_\s]?ai/i.test(a.axis)) ?? null;
}

export const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;
