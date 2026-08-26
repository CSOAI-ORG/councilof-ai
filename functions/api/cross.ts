// /api/cross — the divergence layer (internal codename: east-west; NOT a public name —
// "Dorado" (the internal codename) is trademark-occupied across storage/fintech/genomics, kept internal only).
//
// Composes three feeds nobody else cross-references into one map: what regulation
// REQUIRES (/api/regulation), what AI actually DOES (/api/gspc, MEASURED), and what
// HUMANS do (/api/reported, REPORTED). It computes only — it adds no new claim, and
// inherits each leg's data-state honesty. No LLM judge; deterministic join.
//
// HONEST SCOPE:
//  · The regulation↔axis link below is a real, defensible mapping to the governing
//    instrument for each axis.
//  · The human-baseline leg is CAPABILITY-LEVEL REPORTED (ARC-AGI/GAIA/GPQA), not yet
//    per-axis — stated, not hidden.
//  · There is NO market-data leg. A live index/market feed would be a fourth, REPORTED
//    leg contingent on a real cited source; it is not fabricated here.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

// axis → the governing instrument (real correspondences, cited to the article).
const AXIS_LAW: Record<string, { obligation: string; instrument: string }> = {
  gov:   { obligation: "high-risk classification + conformity (Annex III use-cases)", instrument: "EU AI Act Art 6 / Annex III" },
  art5:  { obligation: "prohibited-practice prohibition", instrument: "EU AI Act Art 5" },
  det:   { obligation: "synthetic-content marking + detection interop", instrument: "EU AI Act Art 50" },
  prv:   { obligation: "data governance + automated-decision rights", instrument: "GDPR Art 22 / EU AI Act Art 10" },
  mach:  { obligation: "safety-component conformity assessment", instrument: "EU Machinery Reg 2023/1230" },
  mcp:   { obligation: "interoperability + technical documentation", instrument: "EU AI Act Art 11 / Annex IV" },
  oss:   { obligation: "GPAI transparency (systemic-risk carve-out)", instrument: "EU AI Act Art 53–55" },
  care:  { obligation: "vulnerability protection (Art 5 exploitation ban)", instrument: "EU AI Act Art 5(1)(b)" },
  affect:{ obligation: "emotion-recognition disclosure", instrument: "EU AI Act Art 50 / Art 5 workplace ban" },
  agi:   { obligation: "systemic-risk safety + incident reporting", instrument: "EU AI Act Art 55 / Commitment 9" },
  asi:   { obligation: "continuity / systemic-risk mitigation", instrument: "EU AI Act Art 55" },
  xr:    { obligation: "synthetic-human disclosure (cross-reality)", instrument: "EU AI Act Art 50" },
  swarm: { obligation: "multi-agent oversight (human oversight duty)", instrument: "EU AI Act Art 14" },
};

interface Env { [k: string]: unknown }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const origin = new URL(ctx.request.url).origin;
  const grab = async (p: string) => { try { return await (await fetch(origin + p)).json(); } catch { return null; } };
  const [board, reg, rep] = await Promise.all([grab("/api/gspc"), grab("/api/regulation"), grab("/api/reported")]);

  const axes: any[] = board?.axes ?? [];
  const regByInstr: Record<string, any> = {};
  for (const d of reg?.deadlines ?? []) regByInstr[d.instrument] = d;

  const rows = axes.map((a) => {
    const law = AXIS_LAW[a.axis];
    // link the penalty via the EU-AI-Act record when the instrument is an Art of it
    const penalty = law?.instrument?.startsWith("EU AI Act")
      ? (reg?.penalty_tiers_eu_ai_act?.most_obligations_incl_art50_and_gpai ?? null)
      : null;
    return {
      axis: a.axis,
      measured_ai: {
        leader: a.leader,
        accuracy: a.accuracy,
        accuracy_is: a.accuracy_is ?? "point estimate",
        separation: a.separation,
        n: a.n,
        state: a.status === "MEASURED" ? "MEASURED (signed)" : a.status,
      },
      regulation: law ? { obligation: law.obligation, instrument: law.instrument, penalty_exposure: penalty } : { note: "no single governing instrument mapped for this axis" },
      divergence: law
        ? `The instrument (${law.instrument}) requires ${law.obligation}. Measured leader ${a.leader} scores ${(a.accuracy * 100).toFixed(1)}%${a.accuracy_is ? " (" + a.accuracy_is + ")" : ""} on the frozen split; separation ${a.separation}. Whether that clears the obligation is a legal question, not a measured one — this cell states the gap, it does not certify.`
        : null,
    };
  });

  const body: Record<string, unknown> = {
    schema: "csoai.cross/0.1",
    what: "The divergence layer. NOT one fused gap number — regulation and a bond price are not commensurable on one scale. Conformance to the in-force provision is the deterministic axis; the measured-AI result and the human baseline are reported ALONGSIDE as context, each labelled by data state. It composes; it does not fuse.",
    legs: {
      regulation: { source: "/api/regulation", state: "statement of law, cited", present: !!reg },
      measured_ai: { source: "/api/gspc", state: "MEASURED (signed board)", present: !!board },
      human_baseline: { source: "/api/reported", state: "REPORTED (cited third-party)", present: !!rep, note: "CAPABILITY-LEVEL baselines (ARC-AGI/GAIA/GPQA), not yet per-axis — stated, not hidden. REPORTED context only: human labels carry inherent noise (literature ~63.5% mean agreement), so the human leg is never deterministically SCORED — it is reported with its source, never fused into a measured cell." },
      market_data: { state: "NOT PRESENT — a live index/market leg would be a fourth REPORTED leg contingent on a real cited source; it is not fabricated here" },
    },
    east_west: "Jurisdictional divergence (EU · US states · China · Korea · Japan · Australia) lives in /api/regulation — the same measured-AI number carries different obligations and penalties across regimes.",
    human_baselines_sample: (rep?.entries ?? rep?.reported ?? []).slice(0, 5),
    rows,
    honest_gate: "This cross composes live feeds and is signed at the edge with #board-attestation-1 — the SAME key and mechanism as /api/gspc. The signature attests the INTEGRITY of this composed payload as served; it does not re-attest the underlying legs (each carries its own data-state and, where present, its own signature). No key → no signature field.",
    license: "CC-BY-4.0",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  };

  // Edge-sign the composed payload with the dedicated board-attestation key
  // (#board-attestation-1, Cloudflare secret BOARD_SIGN_KEY_PKCS8_B64; public half
  // in did.json) — the SAME mechanism /api/gspc uses. Now that /api/gspc carries a
  // verifiable signature, the cross carries one too (per its own honest_gate).
  // No key → NO signature field: honest absence, never a fabricated one.
  const b64 = (ctx.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT signature — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this composed divergence payload as published by the site (NOT a re-attestation of the underlying legs)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the signature field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → recompute canonical JSON and verify Ed25519 against did.json",
      };
    } catch {
      body.signature = { error: "signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
