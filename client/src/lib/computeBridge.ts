/**
 * Two-machine compute bridge — census lists, RunPod/grokbot grades, OS views.
 *
 * Council OS is a view, not a second scoreboard. A Hub listing is DISCOVERED.
 * Only a registered instrument on an immutable subject writes MEASURED.
 * Live pod probes belong on GET /api/compute, never on GET /api/state.
 */

import { TERMINAL_FNS } from "@/lib/terminalFn";
import { attachThatWriteMeasured } from "@/lib/twoSpeed";

export const TWO_MACHINE_RULING =
  "Census machine lists. Measurement machine grades. Council OS is a view, not a second scoreboard.";

export const CENSUS_MACHINE = {
  id: "census",
  title: "Census machine",
  does: "Hub API metadata walk. Persist the cursor. Dedup ids. Quote a dated digest.",
  never: "MEASURED. Weight download. GPU inference. A fused grade.",
} as const;

export const MEASUREMENT_MACHINE = {
  id: "measurement",
  title: "Measurement machine (RunPod / grokbot)",
  does: "Canary, then a bolted instrument on an immutable subject. Sign the cell on the node.",
  never: "Write MEASURED from the lobby. Grade a listing. Fuse OWASP, SCITT or C2PA into a GSPC cell.",
} as const;

export const OS_VIEW = {
  id: "os",
  title: "Council OS",
  does: "Quote GET /api/state and GET /api/compute. Terminal CENSUS is DISCOVERED. COMPUTE reports the wire.",
  never: "A second grade. A remembered pod IP. A live probe stamped onto /api/state.",
} as const;

export const OWNER_GATE =
  "Set AGUI_WIRE_URL on Cloudflare Pages to the live RunPod AG-UI wire (port 8785).";

export const COMPUTE_ENDPOINT = "/api/compute";
export const AGUI_HEALTH = "/api/agui/health";

export const GROKBOT_FNS = TERMINAL_FNS;

export type AguiLane = "unconfigured" | "live" | "down" | "unreachable" | "unknown";

export type ComputeProbe = {
  schema?: string;
  census?: {
    n_unique_ids?: unknown;
    n_measured?: unknown;
    listing_state_all?: unknown;
    as_of?: unknown;
    sha256_jsonl?: unknown;
  };
  agui?: {
    configured?: unknown;
    status?: unknown;
    http?: unknown;
    hint?: unknown;
  };
  runpod?: {
    inventory_kind?: unknown;
    note?: unknown;
  };
};

export function measuredWritesFromBridge(): string[] {
  return attachThatWriteMeasured().map((r) => r.id);
}

export function aguiLane(raw: unknown): AguiLane {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const status = typeof o.status === "string" ? o.status : "";
  if (status === "live" || status === "unconfigured" || status === "down" || status === "unreachable") {
    return status;
  }
  if (o.configured === true) return "unknown";
  return "unconfigured";
}

export function formatComputeReply(j: ComputeProbe | null | undefined): string {
  if (!j || typeof j !== "object") {
    return (
      "COMPUTE — wire unread. Cite GET /api/compute. " +
      "A listing stays DISCOVERED. This function never writes MEASURED."
    );
  }
  const n = typeof j.census?.n_unique_ids === "number" ? j.census.n_unique_ids.toLocaleString("en-GB") : "see digest";
  const graded = typeof j.census?.n_measured === "number" ? String(j.census.n_measured) : "0";
  const asOf = typeof j.census?.as_of === "string" ? j.census.as_of : "as_of in the digest";
  const lane = aguiLane(j.agui);
  const inventory =
    typeof j.runpod?.inventory_kind === "string" ? j.runpod.inventory_kind : "unmeasured";
  return (
    `COMPUTE — ${TWO_MACHINE_RULING} ` +
    `Census: ${n} listings observed, ${graded} graded, ${asOf}. ` +
    `AG-UI wire: ${lane}. RunPod inventory: ${inventory}. ` +
    `CENSUS {owner/name} stays DISCOVERED. MEASURED only after a signed cell.`
  );
}
