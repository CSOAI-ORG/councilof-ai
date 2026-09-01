// functions/api/findings.ts — the REGULATION-FINDINGS query surface.
//
// Serves and filters the materialised findings index (public/signed/findings_index.json),
// which joins every signed (model × axis) card to its regulator crosswalk POINTERS and the
// statutory fine tier for each. Read-only, deterministic, no model consulted, no clock.
//
// The index is a static signed-tree artifact — a stranger can also GET /signed/findings_index.json
// directly and verify every finding's card. This endpoint adds query + a keyword RAG over the
// same rows so agents and humans do not each re-implement the join.
//
//   GET /api/findings                         → whole index (honest wrapper)
//   GET /api/findings?model=<id>              → per-model view: all findings + regulators + tiers
//   GET /api/findings?regulator=<id>          → per-regulator index: axes, findings, fine tiers
//   GET /api/findings?axis=<id>               → per-axis view
//   GET /api/findings?q=<text>                → keyword search over findings (the shippable RAG)
//   GET /api/findings?view=models|regulators|axes  → just the rollup lists
//
// HONESTY inherited from the index and never softened here: findings are DISCOVERED behind signed
// cards; mappings are 'relevant-to' pointers, never determinations; fines are the tier's statutory
// maximum, cited, never asserted as owed. This handler adds NO new claim.

interface Env { [k: string]: unknown }

async function loadIndex(request: Request): Promise<any | null> {
  try {
    const res = await fetch(new URL("/signed/findings_index.json", request.url), { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const norm = (s: string) => (s || "").toString().toLowerCase().trim();

// A deterministic keyword search over the findings rows. Not a neural retriever — it is the
// portable RAG that ships to the edge, where the 4.4GB pod corpus FTS is unreachable. Each
// query term must be present (AND); rows are ranked by how many distinct terms hit and where.
function search(index: any, q: string) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored = [];
  for (const f of index.findings) {
    const hay = f.search_text || "";
    let matched = 0;
    let strong = 0;
    for (const t of terms) {
      if (hay.includes(t)) {
        matched += 1;
        // a hit in the axis/regulator/obligation text ranks above a bare model-name hit
        if ((f.axis_label && norm(f.axis_label).includes(t)) ||
            f.crosswalk?.pointers?.some((p: any) => norm(p.obligation).includes(t) || norm(p.regulator_name).includes(t))) strong += 1;
      }
    }
    if (matched === terms.length) scored.push({ f, score: matched * 10 + strong });
  }
  scored.sort((a, b) => b.score - a.score || (b.f.measurement.accuracy - a.f.measurement.accuracy));
  return scored.map((s) => s.f);
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  const index = await loadIndex(request);
  const headers = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" };

  if (!index) {
    return new Response(JSON.stringify({
      schema: "csoai.regulation-findings/0.1",
      error: "findings index unavailable",
      detail: "public/signed/findings_index.json did not resolve. Rebuild with `node scripts/build-findings-index.mjs` and redeploy.",
    }, null, 1), { status: 503, headers });
  }

  const honesty = index.honesty;
  const wrap = (extra: Record<string, unknown>) => new Response(
    JSON.stringify({ schema: "csoai.regulation-findings/0.1", honesty, as_of: index.as_of, source: "/signed/findings_index.json", ...extra }, null, 1),
    { status: 200, headers },
  );

  const model = url.searchParams.get("model");
  const regulator = url.searchParams.get("regulator");
  const axis = url.searchParams.get("axis");
  const q = url.searchParams.get("q");
  const view = url.searchParams.get("view");

  // ── keyword RAG ──────────────────────────────────────────────────────────────
  if (q != null) {
    const hits = search(index, q);
    return wrap({
      query: q,
      mode: "keyword-search",
      rag_note: "Deterministic keyword search over the findings rows — the portable RAG that runs at the edge. A richer SEMANTIC search over the full corpus + crosswalk docs exists as an offline FTS index (sink pod, corpus-index.sqlite, FTS5 `doc MATCH`); it is not reachable from the edge and is documented as the upgrade path, not wired into production.",
      n_hits: hits.length,
      hits: hits.slice(0, 50),
      truncated: hits.length > 50,
    });
  }

  // ── per-model view ───────────────────────────────────────────────────────────
  if (model != null) {
    const m = index.models.find((x: any) => norm(x.model) === norm(model));
    const findings = index.findings.filter((f: any) => norm(f.model) === norm(model));
    if (!findings.length) {
      return new Response(JSON.stringify({ schema: "csoai.regulation-findings/0.1", error: "no signed findings for that model", model, known_models: index.models.map((x: any) => x.model) }, null, 1), { status: 404, headers });
    }
    const regsTouched = [...new Set(findings.flatMap((f: any) => f.crosswalk.pointers.map((p: any) => p.regulator)))].sort();
    return wrap({
      mode: "per-model",
      model: m?.model ?? model,
      name_published: m?.name_published ?? true,
      n_findings: findings.length,
      mean_accuracy: m?.mean_accuracy ?? null,
      regulators: regsTouched.map((rid) => index.regulators.find((r: any) => r.id === rid)).filter(Boolean).map((r: any) => ({ id: r.id, name: r.name, kind: r.kind, fine_regime: r.fine_regime })),
      findings,
    });
  }

  // ── per-regulator index ──────────────────────────────────────────────────────
  if (regulator != null) {
    const r = index.regulators.find((x: any) => norm(x.id) === norm(regulator) || norm(x.name) === norm(regulator));
    if (!r) {
      return new Response(JSON.stringify({ schema: "csoai.regulation-findings/0.1", error: "unknown regulator", regulator, known_regulators: index.regulators.map((x: any) => x.id) }, null, 1), { status: 404, headers });
    }
    const findings = index.findings.filter((f: any) => f.crosswalk.pointers.some((p: any) => p.regulator === r.id));
    return wrap({ mode: "per-regulator", regulator: r, n_findings: findings.length, findings });
  }

  // ── per-axis view ────────────────────────────────────────────────────────────
  if (axis != null) {
    const a = index.axes.find((x: any) => norm(x.axis) === norm(axis));
    if (!a) {
      return new Response(JSON.stringify({ schema: "csoai.regulation-findings/0.1", error: "unknown axis", axis, known_axes: index.axes.map((x: any) => x.axis) }, null, 1), { status: 404, headers });
    }
    const findings = index.findings.filter((f: any) => f.axis === a.axis);
    return wrap({ mode: "per-axis", axis: a, n_findings: findings.length, findings });
  }

  // ── rollups only ─────────────────────────────────────────────────────────────
  if (view === "models") return wrap({ mode: "models", models: index.models });
  if (view === "regulators") return wrap({ mode: "regulators", regulators: index.regulators });
  if (view === "axes") return wrap({ mode: "axes", axes: index.axes });

  // ── whole index ──────────────────────────────────────────────────────────────
  return wrap({
    mode: "index",
    counts: index.counts,
    fine_tiers: index.fine_tiers,
    regulators: index.regulators,
    axes: index.axes,
    models: index.models,
    findings: index.findings,
  });
};
