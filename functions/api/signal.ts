// /api/signal — SOV Signal Index (public name for the composed divergence product).
//
// Composes four legs into per-axis signals — it does NOT fuse them into one score:
//   1. Live regulation (east-west deadlines)     — SHIPPED  GET /api/regulation
//   2. Hive crosswalk (15 frameworks)            — SHIPPED  /crosswalk
//   3. Measured AI board                           — MEASURED GET /api/gspc (via /api/cross)
//   4. Council Space / arena sim traces          — PARTIAL  /api/arena/rounds.jsonl (MEOK fleet)
//   + Human baseline context                       — REPORTED GET /api/reported (via /api/cross)
//
// MEOK runs Council Space sim substrate (os.meok.ai). CSOAI signs measurement output only.
// No brand conflict — MEOK generates eval volume; CSOAI body publishes signed evidence.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const HIVE_FRAMEWORK_COUNT = 15;

/** Axis → hive crosswalk slugs (subset; full matrix at /crosswalk). */
const AXIS_CROSSWALK: Record<string, { frameworks: string[]; east_west: string }> = {
  governance: {
    frameworks: ["eu-ai-act", "iso-42001", "nist-ai-rmf"],
    east_west: "EU binding · US voluntary (NIST) · UK via retained EU law mirror",
  },
  safety: {
    frameworks: ["eu-ai-act", "nist-ai-rmf", "iso-42001"],
    east_west: "Art 5 in force EU · US state patchwork · CN GB standards",
  },
  provenance: {
    frameworks: ["eu-ai-act", "c2pa", "iso-42001"],
    east_west: "EU Art 50 · US CAITA · CN GB 45438 labelling",
  },
  continuity: {
    frameworks: ["eu-ai-act", "dora", "nis2"],
    east_west: "EU DORA/NIS2 · US sectoral · APAC cyber acts",
  },
  conformance: {
    frameworks: ["eu-ai-act", "iso-42001", "eu-cra"],
    east_west: "EU conformity paths · US no notified body equivalent",
  },
  openness: {
    frameworks: ["eu-ai-act", "nist-ai-rmf", "tc260"],
    east_west: "EU GPAI Arts 53–55 · US frontier transparency (SB 53) · CN TC260",
  },
  "machinery-conformity": {
    frameworks: ["eu-machinery-reg", "eu-ai-act", "iso-42001"],
    east_west: "EU Machinery Reg 2023/1230 · US OSHA-adjacent · CN product safety",
  },
  care: {
    frameworks: ["eu-ai-act", "nist-ai-rmf", "iso-42001"],
    east_west: "EU Art 5 exploitation ban · US sector guidance · CN algorithm recs",
  },
  "cross-reality": {
    frameworks: ["eu-ai-act", "c2pa", "nist-ai-rmf"],
    east_west: "EU synthetic disclosure · US deepfake statutes · CN labelling",
  },
  "detector-interop": {
    frameworks: ["eu-ai-act", "c2pa", "nist-ai-rmf"],
    east_west: "EU Art 50 detection tools · US CA provenance mandates",
  },
  "art5-safeguard": {
    frameworks: ["eu-ai-act", "nist-ai-rmf"],
    east_west: "EU prohibited practices live · US intent-based (TX TRAIGA)",
  },
  swarm: {
    frameworks: ["eu-ai-act", "iso-42001", "nist-ai-rmf"],
    east_west: "EU Art 14 human oversight · multi-agent accountability unset globally",
  },
  affect: {
    frameworks: ["eu-ai-act", "nist-ai-rmf"],
    east_west: "EU emotion recognition rules · US workplace bans emerging",
  },
  jail: {
    frameworks: ["eu-ai-act", "nist-ai-rmf"],
    east_west: "Containment floor — measured, separation UNTESTED",
  },
};

type Register = "MEASURED" | "REPORTED" | "SHIPPED" | "PARTIAL" | "GAP" | "DESIGN";

interface Env {
  BOARD_SIGN_KEY_PKCS8_B64?: string;
  SOV_ARENA_STATE?: KVNamespace;
}

function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const r = o as Record<string, unknown>;
  return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
}

async function edgeSign(body: Record<string, unknown>, b64: string | undefined) {
  if (!b64) return;
  try {
    const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    const signedBytes = canonical(body);
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    body.signature = {
      attests: "integrity of this SOV Signal Index payload as published (NOT re-attestation of upstream legs)",
      signer: "did:web:csoai.org#board-attestation-1",
      alg: "Ed25519",
      sig,
      public_key_x: jwk.x,
      sig_input: "canonical JSON (recursively sorted keys, no whitespace) with signature field removed",
      verify: "fetch /.well-known/did.json → #board-attestation-1 → verify Ed25519",
    };
  } catch {
    body.signature = { error: "signing key present but unusable — no signature emitted" };
  }
}

async function arenaLeg(env: Env) {
  const base = {
    source: "/api/arena/rounds.jsonl",
    operator: "MEOK (meok.ai / os.meok.ai) — Council Space sim fleet",
    csoai_role: "CSOAI signs composed index + GSPC board; does not operate sim runtime",
    register: "PARTIAL" as Register,
  };
  if (!env.SOV_ARENA_STATE) {
    return {
      ...base,
      present: false,
      state: "KV binding SOV_ARENA_STATE not visible",
      rounds_in_window: 0,
    };
  }
  const raw = await env.SOV_ARENA_STATE.get("rounds.jsonl");
  if (!raw?.trim()) {
    return {
      ...base,
      present: false,
      state: "KV bound but rounds.jsonl empty — fleet not synced",
      rounds_in_window: 0,
    };
  }
  const lines = raw.trim().split("\n").filter(Boolean);
  const sample = lines
    .slice(-3)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return {
    ...base,
    present: true,
    state: "live NDJSON window from MEOK arena sync",
    rounds_in_window: lines.length,
    sample_rounds: sample,
  };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const origin = new URL(ctx.request.url).origin;
  const grab = async (p: string) => {
    try {
      return await (await fetch(origin + p)).json();
    } catch {
      return null;
    }
  };

  const [cross, reg, arena] = await Promise.all([
    grab("/api/cross"),
    grab("/api/regulation"),
    arenaLeg(ctx.env),
  ]);

  const crossRows: any[] = cross?.rows ?? [];

  const signals = crossRows.map((row) => {
    const axis = row.axis as string;
    const xwalk = AXIS_CROSSWALK[axis] ?? {
      frameworks: [],
      east_west: "See /crosswalk — no frozen predicate map for this axis yet",
    };
    return {
      axis,
      registers: {
        regulation: reg ? ("SHIPPED" as Register) : ("GAP" as Register),
        east_west_crosswalk: "SHIPPED" as Register,
        measured_ai: row.measured_ai?.state?.includes("MEASURED") ? ("MEASURED" as Register) : ("GAP" as Register),
        human_baseline: cross?.legs?.human_baseline?.present ? ("REPORTED" as Register) : ("GAP" as Register),
        council_space_sim: arena.present ? ("PARTIAL" as Register) : ("GAP" as Register),
      },
      regulation: row.regulation,
      crosswalk: {
        frameworks: xwalk.frameworks,
        hive_catalogue_count: HIVE_FRAMEWORK_COUNT,
        east_west: xwalk.east_west,
        depth: "https://councilof.ai/crosswalk",
      },
      measured_ai: row.measured_ai,
      divergence_statement: row.divergence,
      sim_arena: arena.present
        ? {
            register: "PARTIAL",
            note: "Arena rounds synced; per-axis auto-join not shipped — stated alongside, not fused",
            rounds_in_window: arena.rounds_in_window,
            feed: arena.source,
          }
        : {
            register: "GAP",
            note: "Council Space narrated sims on /gspc-arena; signed round feed empty until MEOK KV sync",
            feed: arena.source,
          },
      /** No fused signal score — only composed statements per leg. */
      signal_index: null,
    };
  });

  const body: Record<string, unknown> = {
    schema: "csoai.sov-signal-index/0.1",
    name: "SOV Signal Index",
    what:
      "The third data product: regulation (east-west) × crosswalk × measured AI × arena sim context. " +
      "Composes legs from live feeds; does not certify conformance and does not emit one fused number.",
    composes_not_fuses: true,
    meok_csoai_boundary: {
      meok: "Runs Council Space sim substrate (os.meok.ai), NPC clans, arena round generation — eval volume head",
      csoai: "Publishes signed GSPC board, RECEIPT-SPEC, and this composed index — measurement body",
      conflict: "none — MEOK generates traces; CSOAI signs what is frozen and reproducible",
      council_space_url: "https://councilof.ai/gspc-arena",
      meok_gateway: "https://os.meok.ai/api",
    },
    legs: {
      regulation: {
        register: reg ? "SHIPPED" : "GAP",
        source: "/api/regulation",
        state: "cited law + east-west deadlines (EU · US · CN · KR · JP · AU)",
        present: !!reg,
      },
      east_west_crosswalk: {
        register: "SHIPPED",
        source: "/crosswalk",
        state: `${HIVE_FRAMEWORK_COUNT} hive frameworks catalogued; axis maps are illustrative subsets`,
        present: true,
      },
      measured_ai: {
        register: "MEASURED",
        source: "/api/gspc",
        state: "frozen board via /api/cross join",
        present: !!cross?.legs?.measured_ai?.present,
      },
      human_baseline: {
        register: "REPORTED",
        source: "/api/reported",
        state: "capability-level third-party baselines — not per-axis scored",
        present: !!cross?.legs?.human_baseline?.present,
      },
      council_space_sim: arena,
      divergence_compose: {
        register: "MEASURED",
        source: "/api/cross",
        state: "deterministic join — inherits cross honest_gate",
        present: !!cross,
      },
    },
    totals: {
      axes: signals.length,
      regulation_leg: reg ? "present" : "missing",
      arena_rounds_in_window: arena.rounds_in_window,
    },
    signals,
    upstream: {
      cross: "/api/cross",
      regulation: "/api/regulation",
      gspc: "/api/gspc",
      arena: "/api/arena/rounds.jsonl",
      crosswalk: "/crosswalk",
    },
    honest_gate:
      "signal_index is null on every row until a frozen, published formula exists. " +
      "This endpoint signs the composed payload only; it does not re-attest upstream legs.",
    license: "CC-BY-4.0",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  };

  await edgeSign(body, ctx.env.BOARD_SIGN_KEY_PKCS8_B64);

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
