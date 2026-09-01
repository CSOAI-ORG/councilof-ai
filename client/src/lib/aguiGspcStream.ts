/**
 * AG-UI live GSPC inside streams.
 *
 * Source of truth: GET /api/gspc (same living GET agents and humans share).
 * Builds AG-UI STATE_DELTA + TEXT_MESSAGE payloads from the wire only.
 * Empty cells stay visible. No invented scores. Not a second board.
 *
 * Six arms only (board · verify · cards · space · assess · harness).
 * AG-UI is presentation over living GETs — never a 7th evidence atom.
 */

export const GSPC_LIVE_URL = "https://councilof.ai/api/gspc";
export const GSPC_SAME_ORIGIN = "/api/gspc";
export const AGUI_GSPC_STATE_PATH = "/api/agui/gspc-state";

/** Draft opening only — Nick joins. Measurement credential, never certification. No endorsement. */
export const W3C_AGENT_CONFORMANCE_CG_DRAFT =
  "https://www.w3.org/community/agent-conformance/";

export type GspcAxisSnap = {
  axis: string;
  status: string;
  family?: string;
  kind?: string;
  n: number | null;
  accuracy: number | null;
  separation: string | null;
};

export type GspcLiveSnapshot = {
  schema: string;
  source: "wire";
  endpoint: string;
  public_count: string;
  count_grammar: string;
  totals: {
    axes: number | null;
    measured_axes: number | null;
    unmeasured_axes: number | null;
  };
  measured: GspcAxisSnap[];
  empty: GspcAxisSnap[];
  note: string;
};

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function strOr(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/** Project a living /api/gspc body into a stream-safe snapshot. Never invents scores. */
export function snapshotFromGspcPayload(j: any, endpoint = GSPC_SAME_ORIGIN): GspcLiveSnapshot {
  const axes = Array.isArray(j?.axes) ? j.axes : [];
  const totals = j?.totals && typeof j.totals === "object" ? j.totals : {};
  const measured: GspcAxisSnap[] = [];
  const empty: GspcAxisSnap[] = [];

  for (const row of axes) {
    if (!row || typeof row.axis !== "string") continue;
    const status = strOr(row.status, "UNMEASURED");
    const snap: GspcAxisSnap = {
      axis: row.axis,
      status,
      family: typeof row.family === "string" ? row.family : undefined,
      kind: typeof row.kind === "string" ? row.kind : undefined,
      n: numOrNull(row.n),
      // MEASURED without accuracy stays null — never coerce to 0.
      accuracy: numOrNull(row.accuracy),
      separation: typeof row.separation === "string" ? row.separation : null,
    };
    if (status === "MEASURED") measured.push(snap);
    else empty.push(snap);
  }

  const public_count = strOr(
    totals.public_count,
    measured.length || empty.length
      ? `${axes.length} axis · ${measured.length} measured`
      : "Counts from GET /api/gspc",
  );
  const count_grammar = strOr(
    totals.count_grammar,
    "Empty cells stay empty. Cite GET /api/gspc. No invented scores.",
  );

  return {
    schema: "csoai.agui-gspc-snapshot/0.1",
    source: "wire",
    endpoint,
    public_count,
    count_grammar,
    totals: {
      axes: numOrNull(totals.axes) ?? (axes.length || null),
      measured_axes: numOrNull(totals.measured_axes) ?? measured.length,
      unmeasured_axes: numOrNull(totals.unmeasured_axes) ?? empty.length,
    },
    measured,
    empty,
    note:
      "AG-UI stream snapshot from living GET /api/gspc. Measurement credential, never certification. Empty visible.",
  };
}

/** AG-UI STATE_DELTA event carrying the living board under /gspc. */
export function toAguiStateDelta(snapshot: GspcLiveSnapshot): {
  type: "STATE_DELTA";
  delta: Array<{ op: "replace"; path: string; value: unknown }>;
} {
  return {
    type: "STATE_DELTA",
    delta: [
      { op: "replace", path: "/gspc", value: snapshot },
      {
        op: "replace",
        path: "/gspc/public_count",
        value: snapshot.public_count,
      },
      {
        op: "replace",
        path: "/gspc/empty_visible",
        value: snapshot.empty.map((a) => a.axis),
      },
    ],
  };
}

/** Short TEXT_MESSAGE body for stream consumers — live grammar only. */
export function toAguiGspcTextMessage(snapshot: GspcLiveSnapshot): {
  type: "TEXT_MESSAGE_CONTENT";
  delta: string;
} {
  const emptyNames = snapshot.empty.map((a) => a.axis).join(", ") || "(none)";
  return {
    type: "TEXT_MESSAGE_CONTENT",
    delta:
      `Live GSPC · ${snapshot.public_count}. ` +
      `${snapshot.totals.unmeasured_axes ?? snapshot.empty.length} empty visible: ${emptyNames}. ` +
      `Cite ${snapshot.endpoint}. Empty stays empty. Not a certificate.`,
  };
}

/** SSE body: STATE_DELTA then TEXT_MESSAGE_CONTENT from one snapshot. */
export function encodeAguiGspcSse(snapshot: GspcLiveSnapshot): string {
  const delta = toAguiStateDelta(snapshot);
  const text = toAguiGspcTextMessage(snapshot);
  return (
    `event: STATE_DELTA\ndata: ${JSON.stringify(delta)}\n\n` +
    `event: TEXT_MESSAGE_CONTENT\ndata: ${JSON.stringify(text)}\n\n`
  );
}

export async function fetchLiveGspcSnapshot(
  fetchImpl: typeof fetch = fetch,
  endpoint: string = GSPC_SAME_ORIGIN,
  signal?: AbortSignal,
): Promise<GspcLiveSnapshot> {
  const r = await fetchImpl(endpoint, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!j || typeof j !== "object" || !Array.isArray((j as any).axes)) {
    throw new Error("not a GSPC payload");
  }
  return snapshotFromGspcPayload(j, endpoint);
}
