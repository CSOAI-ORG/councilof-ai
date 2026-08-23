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
      what: "human-preference Elo (crowd votes, Bradley-Terry + CIs) — REPORTED context",
      state: "assessed for the benchmark-quality register; overlap cells populated where verified",
      models: [] as unknown[],
      note: "LMArena ranks by human vote; we measure deterministically. Never fused.",
    },
    openrouter: {
      source: "https://openrouter.ai/rankings",
      what: "routing + usage ranking (token revenue / real usage) — REPORTED context",
      state: "catalogue snapshot held at /_data/openrouter-models.json; rankings cited not scraped",
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
