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
    board_embed: {
      iframe: "https://councilof.ai/embed/board",
      web_component: "https://councilof.ai/embed/gspc-board.js",
      web_component_tag: "<gspc-board></gspc-board>",
      oembed: "https://councilof.ai/oembed?url=https%3A%2F%2Fcouncilof.ai%2Fembed%2Fboard&format=json",
      shows: "totals.public_count and measured_on.date (as_of) from GET /api/gspc, verbatim, with a link to /gspc; no badge and no score",
    },
    feeds: {
      board_changes_json: "https://councilof.ai/feeds/board.json",
      board_changes_atom: "https://councilof.ai/feeds/board.atom",
    },
    cite: {
      bibtex: "https://councilof.ai/cite/gspc?format=bibtex",
      csl_json: "https://councilof.ai/cite/gspc?format=csl",
      both: "https://councilof.ai/cite/gspc?format=json",
    },
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
