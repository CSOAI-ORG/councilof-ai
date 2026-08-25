/**
 * GET /blog/* — interim 308 to /blog/ for cold-load deep links (J-D2).
 * Homepage linked six posts that honest-404 on the static host until prerender snapshots land.
 * Known live index: /blog/. Measurement not certification.
 */
const DEAD = new Set([
  "layer-0-agent-economy-trust",
  "eu-ai-act-article-50-countdown",
  "choosing-ai-compliance-vendor",
  "dora-compliance-uk-financial-services",
  "ai-governance-vs-compliance",
  "nis2-compliance-critical-infrastructure",
]);

export function onRequest(context: { params: { path?: string | string[] }; next: () => Promise<Response> }) {
  const raw = context.params.path;
  const slug = Array.isArray(raw) ? raw[0] : (raw || "").split("/")[0];
  if (slug && DEAD.has(slug)) {
    return new Response(null, {
      status: 308,
      headers: {
        location: "/blog/",
        "cache-control": "public, max-age=300",
      },
    });
  }
  return context.next();
}
