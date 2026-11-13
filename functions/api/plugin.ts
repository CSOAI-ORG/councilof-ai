/**
 * GET /api/plugin — the Council of AI agent plugin: what it is, how to install it, where it lives.
 *
 * FREE, FOREVER, FOR EVERYONE. There is no price on this surface and there is no paid variant of
 * it. The board and the verification endpoint are the public product; the paid rails assemble
 * evidence packs for agents that need them filed, and they are not a way to buy a verdict.
 *
 * The payload is a public file, so the endpoint cannot drift from what the repository declares.
 */
import manifest from "../../public/agent-plugin/manifest.json";
import matrix from "../../public/agent-plugin/platform-matrix.json";
import { headFromGet } from "./_head";

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
    ...manifest,
    // Counts are derived from the matrix array, never typed.
    platform_families: platforms.length,
    platform_families_by_adapter: byFamily,
    platforms_present_on_this_estate: platforms.filter((p) => p.state === "present").length,
    platforms_without_a_target: platforms.filter((p) => p.state !== "present").length,
    surfaces: {
      platforms: "https://councilof.ai/api/plugin/platforms",
      reports: "https://councilof.ai/api/reports",
    },
    framing: "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
