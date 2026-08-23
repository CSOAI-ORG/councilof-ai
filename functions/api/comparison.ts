// functions/api/comparison.ts — MEASURED vs REPORTED comparison surface.
// The "OpenRouter routes inference. CSOAI refines it into signed, continuously-
// verifiable measurement data." positioning, made concrete:
//   RAIL 1 (MEASURED): our deterministic arena Elo with Wilson CIs, from the
//   sibling signed static feed /arena/elo_reference.json (csoai.arena-elo-reference/0.1,
//   Ed25519 JWT) — the SAME feed /gspc-scoreboard verifies.
//   RAIL 2 (REPORTED): LMArena human-vote Elo + OpenRouter usage/routing, cited
//   and attributed. Never blended into rail 1 — displayed side by side.
// Register: measurement, not certification. MEASURED cells are ours and signed;
// REPORTED cells are third-party context with attribution. Where we have no
// overlap data, the cell stays UNKNOWN-honest — never a fabricated number.
interface Env {
  KV?: unknown;
}

export async function onRequestGet({ env, request }: { env: Env; request: Request }) {
  const ts = new Date().toISOString();

  // RAIL 1: OUR measured Elo — refetch the signed static feed server-side so the
  // endpoint stays correct even if the caller's browser cache is stale.
  let measured = null;
  let measuredErr: string | null = null;
  try {
    const target = new URL("/arena/elo_reference.json", request.url);
    const res = await fetch(target, { headers: { accept: "application/json" } });
    if (res.ok) measured = await res.json();
    else measuredErr = `feed HTTP ${res.status}`;
  } catch (e) {
    measuredErr = String(e);
  }

  // RAIL 2: REPORTED legs — documented, attributed, UNKNOWN where we have no
  // verified overlap. These are context rails; they are never merged into
  // measured cells and never quoted as our measurement.
  const reported = {
    lmarena: {
      source: "https://lmarena.ai/leaderboard",
      methodology: "Bradley-Terry model on crowdsourced pairwise human votes, scaled to Elo, 95% bootstrap CIs; per-category breakdowns (text/coding/math/creative/vision) published",
      what: "human-preference Elo — REPORTED context, never our measurement",
      state: "assessed 2026-08-23 (register entry lmarena); methodology we ADOPT the CI + category discipline from, and REFUSE vote-as-truth certification",
      adopt: ["Bradley-Terry + bootstrap 95% CI statistical framing", "per-category segmentation (text/coding/math/creative/vision)"],
      refuse: ["human preference treated as verified capability ('vote-as-truth')", "version drift behind a pinned slug as a stable model identity"],
      honest_unknowns: ["exact bootstrap parameters not fully public", "vote-manipulation detection machinery not fully public (2025 study alleges provider-size bias — the-decoder.com)"],
      models: [] as unknown[],
      note: "LMArena ranks by human vote; we measure deterministically. Never fused.",
    },
    openrouter: {
      source: "https://openrouter.ai/rankings",
      methodology: "real-market token spend / revenue share (Data API) + cost-aware Auto Router (per-task fit under cost constraints, ~30 task types, 7-day spend horizon)",
      what: "routing + usage ranking — REPORTED context, a demand proxy not a quality benchmark",
      state: "assessed 2026-08-23 (register entry openrouter); we ADOPT the cost-aware routing framing and usage telemetry, and REFUSE reading usage-share as capability",
      adopt: ["cost-aware routing framing (route to best-fit model under cost constraints)", "usage / app analytics as demand-and-cost telemetry"],
      refuse: ["token revenue / usage share read as a capability or quality benchmark (confounded by price, marketing, volume)"],
      honest_unknowns: ["exact live catalogue count is volatile (third-party Mar-2026 snapshot: 342 models / 57 providers)", "no CIs and no contamination controls — observational usage, not a controlled evaluation"],
      models: [] as unknown[],
      note: "OpenRouter routes inference; CSOAI refines it into signed, continuously-verifiable measurement data.",
    },
  };

  // Overlap: models we measure that also appear on LMArena/OpenRouter are listed
  // here ONLY when we have a cited, attributed number. Today we hold no verified
  // cross-platform Elo for our small fleet models — so the cells stay UNKNOWN.
  // This is the honest state: no fabricated overlap, no invented comparison.
  const overlap: unknown[] = [];

  return Response.json({
    schema: "csoai.comparison/0.1",
    name: "Measured vs Reported — the comparison surface (never fused)",
    ts,
    register: "measurement, not certification — MEASURED cells signed; REPORTED cells attributed; no rail blends into another",
    rails: {
      measured: {
        source: "/arena/elo_reference.json",
        state: measured ? "MEASURED (signed static feed, Ed25519 JWT — verify via /gspc-verify or in-browser)" : `feed unavailable: ${measuredErr || "unknown"}`,
        present: !!measured,
        leaderboard: measured?.leaderboard ?? [],
        per_axis: measured?.per_axis ?? {},
        content_id: measured?.content_id ?? null,
        method: measured?.method ?? "Bradley-Terry Elo, K=32, Wilson 95% CI, n>=5",
      },
      reported: reported,
      overlap: {
        state: overlap.length ? "verified overlap cells" : "UNKNOWN — no verified cross-platform Elo for our fleet models yet (honest, not fabricated)",
        cells: overlap,
        gate: "a reported cell is only populated when we hold a cited, attributed number for the SAME model we measured",
      },
    },
    the_pairing: {
      claim: "measured behaviour (signed) beside human preference / usage context (cited) — two rails, one page, never one blended number",
      caveat: "Elo from human votes and Elo from deterministic referees are not commensurable on one scale; we display both and state which is which",
      limitations: [
        "overlap cells are UNKNOWN until a cited cross-platform number exists for a measured model",
        "REPORTED rails carry third-party methodology (vote collection, routing) we assess but do not endorse",
        "no causation claimed between rails",
      ],
    },
    honest_gate: {
      never_fused: true,
      never_certifies: true,
      unmeasured_stays_unmeasured: true,
      nobody_ranked_pays: true,
    },
  }, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}
