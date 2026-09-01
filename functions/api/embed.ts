/**
 * GET /api/embed — machine contract for the white-label kit.
 * Counts are not typed here. The badge and embed.js read GET /api/gspc.
 */
export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.embed-kit/1",
    badge: "https://councilof.ai/api/badge",
    script: "https://councilof.ai/embed.js",
    verify: "https://councilof.ai/gspc-verify",
    human: "https://councilof.ai/badge",
    kit: "https://councilof.ai/embed",
    grammar: "measurement, not certification",
    note: "Partner branding does not change the evidence. The script fetches /api/gspc and paints unavailable rather than a typed count.",
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
