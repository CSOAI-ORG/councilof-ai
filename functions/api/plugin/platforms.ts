/**
 * GET /api/plugin/platforms — every AI platform family the Council of AI plugin ships for.
 *
 * ONE declaration, N renders: the matrix is a public file and this endpoint is its projection.
 * A platform with no install target is CATALOGUED, not LIVE. Absence is an answer.
 */
import matrix from "../../../public/agent-plugin/platform-matrix.json";

const json = (body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  const platforms = matrix.platforms;
  const byFamily = platforms.reduce<Record<string, number>>((acc, p) => {
    acc[p.family] = (acc[p.family] ?? 0) + 1;
    return acc;
  }, {});
  return json({
    schema: matrix.schema,
    what: matrix.what,
    canonical: matrix.canonical,
    adapters: matrix.adapters,
    totals: {
      platform_families: platforms.length,
      by_adapter: byFamily,
      present_on_this_estate: platforms.filter((p) => p.state === "present").length,
      catalogued_without_a_target: platforms.filter((p) => p.state !== "present").length,
      own_builds_not_overwritten: platforms.filter((p) => p.install?.type === "none").length,
    },
    platforms,
    doctrine: matrix.doctrine,
    framing: "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
  });
};
