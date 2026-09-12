/**
 * GET /api/owasp-report — OWASP LLM Top 10 ↔ GSPC axis coverage report.
 *
 * The mapping (public/interop/owasp-llm-mapping.json v0.2) is RELATED-TO,
 * never equivalence; the report asserts NO measurement by itself. A join is
 * published only where a GSPC axis measures the same adversarial family —
 * v0.1 mapped 10/10 and was rejected in review (#1876) because joins like
 * LLM10 → reserve-attestation were not defensible. v0.2 keeps one join
 * (LLM01 → jail) and leaves the other nine categories UNMAPPED and visible:
 * the gap is the report.
 *
 * Per-category state is DERIVED at request time from the live board modules
 * (AXES_A/AXES_B/AXES_FIN) — never typed:
 *   covered-by-live-instrument = a mapped axis is MEASURED on the board now
 *   mapped-unmeasured          = join exists, axis currently UNMEASURED
 *   unmapped                   = no defensible join exists (reason carried)
 * Unknown axis slugs are reported as UNRESOLVABLE, never silently dropped.
 *
 * Not a 23rd axis. Not a fused OWASP/GSPC grade (banned: compute.ts).
 * Not a compliance claim against the OWASP list.
 */
import mapping from "../../public/interop/owasp-llm-mapping.json";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";
import type { AxisScore } from "./_gspc_types";

const AXES: AxisScore[] = [...AXES_A, ...AXES_B, ...AXES_FIN];

const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

type MappingCategory = {
  id: string;
  name: string;
  axes: string[];
  relation_note?: string;
  unmapped_reason?: string;
};

export const onRequestGet: PagesFunction = async () => {
  const categories = (mapping as { categories: MappingCategory[] }).categories;
  const rows = categories.map((c) => {
    const axisStates = c.axes.map((slug) => {
      const a = AXES.find((x) => x.axis === slug);
      if (!a) return { axis: slug, status: "UNRESOLVABLE" as const };
      return {
        axis: slug,
        status: a.status,
        ...(a.kind === "model-comparison" && typeof a.accuracy === "number"
          ? { leader_accuracy: a.accuracy, n: a.n ?? null }
          : {}),
      };
    });
    const coverage =
      c.axes.length === 0
        ? ("unmapped" as const)
        : axisStates.some((s) => s.status === "MEASURED")
          ? ("covered-by-live-instrument" as const)
          : ("mapped-unmeasured" as const);
    return {
      id: c.id,
      name: c.name,
      axes: axisStates,
      coverage,
      ...(c.relation_note ? { relation_note: c.relation_note } : {}),
      ...(c.unmapped_reason ? { unmapped_reason: c.unmapped_reason } : {}),
    };
  });
  const covered = rows.filter((r) => r.coverage === "covered-by-live-instrument").length;
  const unmapped = rows.filter((r) => r.coverage === "unmapped").length;
  return json({
    schema: "csoai.owasp-report/0.2",
    writes_board: false,
    as_of_mapping: (mapping as { as_of?: string }).as_of ?? null,
    relation: (mapping as { relation?: string }).relation ?? null,
    mapping_history: (mapping as { history?: string }).history ?? null,
    counts: {
      categories: rows.length,
      covered_by_live_instrument: covered,
      mapped_unmeasured: rows.length - covered - unmapped,
      unmapped,
      unresolvable_axes: rows.flatMap((r) => r.axes).filter((a) => a.status === "UNRESOLVABLE").length,
    },
    categories: rows,
    honesty:
      "Coverage here means a mapped GSPC axis is MEASURED on the live board — derived from the same modules GET /api/gspc serves, at request time. The OWASP category itself is a risk area, not a test we ran. Nine of ten categories carry no join; that gap is stated, not smoothed over. No fused grade, no compliance claim, no typed counts.",
    verify: "GET /api/gspc for the per-axis board rows this report derives from.",
  });
};
