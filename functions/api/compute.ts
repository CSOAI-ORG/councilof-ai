/**
 * GET /api/compute — probe surface for the two-machine wire.
 *
 * Quotes the committed Hub census digest. Probes the AG-UI wire when
 * AGUI_WIRE_URL is set. Never writes MEASURED. Never invents a pod IP.
 * Live probes stay here — they must not be copied onto GET /api/state.
 */

import hubCensus from "../../public/signed/hub-census-baseline.json";

interface Env {
  AGUI_WIRE_URL?: string;
}

const RULING =
  "Census machine lists. Measurement machine grades. Council OS is a view, not a second scoreboard.";

const OWNER_GATE =
  "Set AGUI_WIRE_URL on Cloudflare Pages to the live RunPod AG-UI wire (port 8785).";

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const configured = Boolean(ctx.env.AGUI_WIRE_URL);
  const base = (ctx.env.AGUI_WIRE_URL || "").replace(/\/$/, "");
  let agui: {
    configured: boolean;
    status: "unconfigured" | "live" | "down" | "unreachable";
    http: number | null;
    hint: string;
    target: string | null;
  } = {
    configured,
    status: "unconfigured",
    http: null,
    hint: OWNER_GATE,
    target: null,
  };

  if (configured && base) {
    const target = `${base}/health`;
    try {
      const r = await fetch(target, { method: "GET", redirect: "manual" });
      agui = {
        configured: true,
        status: r.ok ? "live" : "down",
        http: r.status,
        hint: r.ok
          ? "AG-UI wire answered. Still not a GSPC grade."
          : `AG-UI wire returned HTTP ${r.status}. Not MEASURED.`,
        target,
      };
    } catch (e: unknown) {
      agui = {
        configured: true,
        status: "unreachable",
        http: null,
        hint: e instanceof Error ? e.message : String(e),
        target,
      };
    }
  }

  const body = {
    schema: "csoai.compute-bridge/1",
    title: "Two-machine compute bridge — probe surface, not a scoreboard",
    contract: {
      ruling: RULING,
      quote_census_from: "public/signed/hub-census-baseline.json",
      quote_agui_from: "this probe",
      never: [
        "MEASURED",
        "a fused OWASP / SCITT / C2PA / GSPC grade",
        "a remembered RunPod IP as established",
        "a live probe copied onto GET /api/state",
      ],
      owner_gate: OWNER_GATE,
    },
    census: {
      kind: "catalogued",
      source: "public/signed/hub-census-baseline.json",
      as_of: (hubCensus as { as_of?: string }).as_of ?? null,
      as_of_field: "as_of",
      n_unique_ids: (hubCensus as { n_unique_ids?: number }).n_unique_ids ?? null,
      n_measured: (hubCensus as { n_measured?: number }).n_measured ?? 0,
      listing_state_all: (hubCensus as { listing_state_all?: string }).listing_state_all ?? "DISCOVERED",
      status_all: (hubCensus as { status_all?: string }).status_all ?? "UNMEASURED",
      complete: (hubCensus as { complete?: boolean }).complete ?? false,
      complete_reason: (hubCensus as { complete_reason?: string }).complete_reason ?? null,
      pages_done: (hubCensus as { pages_done?: number }).pages_done ?? null,
      sha256_jsonl: (hubCensus as { sha256_jsonl?: string }).sha256_jsonl ?? null,
      note: (hubCensus as { note?: string }).note ?? null,
    },
    agui,
    grokbot: {
      terminal_fns: ["VERIFY", "BOARD", "AXIS", "CENSUS", "CORRECT", "WATCH", "COMPUTE", "HELP"],
      ruling: "Type a function, get a dated vital sign. A Hub listing is DISCOVERED, never MEASURED.",
      census_fn: "CENSUS {owner/name} records a listing. It does not grade.",
    },
    runpod: {
      inventory_kind: "unmeasured",
      note:
        "This repo has no RunPod API identity. The 2026-08-22 inventory IPs are stale. " +
        "A pod being up is not a measurement. Quote this probe, never a remembered address.",
    },
    os: {
      doors: ["board", "verify", "space", "assess", "harness"],
      harness: "HTTP MCP seven tools (board_totals get_axis verify_card list_cards get_root get_card verify_inclusion) + this compute probe. npm csoai-gspc-mcp@0.1.0 still four. Not a mill-tool.",
      view_only: true,
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
