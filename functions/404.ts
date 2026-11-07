/**
 * GET /404 must ANSWER 404.
 *
 * WHY THIS ROUTE EXISTS. Cloudflare Pages serves the site's root `404.html` as an
 * ordinary asset for the path `/404`, so the path resolves and the status is 200.
 * A crawler reads that as a real page: the estate's own published-surface audit
 * records `https://councilof.ai/404` as a soft 404 (finding #9), and the same
 * defect on csoai.org as finding #10.
 *
 * WHY IT IS NOT A `_headers` RULE. Pages applies `_headers` to asset responses
 * only, never to a response built by code, so a header file cannot set a status.
 * The status has to be set by the code that answers the path.
 *
 * WHY THE HEADERS ARE COPIED FROM THE ASSET. The asset layer is what applies
 * `_headers`. A response built here does not receive them, so this path must
 * carry the same set as every other page on the site. They are taken from the
 * asset response rather than written out again here: a second copy of a header
 * set is a second thing to keep in step, and it drifts.
 */
type Assets = { fetch: (input: Request) => Promise<Response> };

type Context = {
  request: Request;
  env?: { ASSETS?: Assets };
};

/** The page a reader is shown when the path is not found. */
const NOT_FOUND_PAGE = "/404.html";

export async function onRequest(context: Context): Promise<Response> {
  const assets = context.env?.ASSETS;
  if (!assets) {
    // No asset layer: say so honestly rather than serve a 200.
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const asset = await assets.fetch(new Request(new URL(NOT_FOUND_PAGE, context.request.url)));
  const headers = new Headers(asset.headers);

  return new Response(asset.body, {
    status: 404,
    statusText: "Not Found",
    headers,
  });
}
