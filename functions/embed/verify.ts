/**
 * GET /embed/verify — the self-contained, self-verifying card widget at a clean URL.
 *
 * Third parties embed it as:
 *   <iframe src="https://councilof.ai/embed/verify?card=/signals/cross-border-card.signed.json"
 *           width="420" height="340" style="border:0" title="Verify a signed measurement card"></iframe>
 *
 * The widget itself lives as a static asset at /embed/verify.html (single source of
 * truth). This function serves those exact bytes at the extension-less path so the
 * iframe URL reads cleanly and the query string is preserved by the client. It adds
 * nothing to the HTML: all verification is Ed25519 done in the visitor's browser.
 *
 * WHY IT USES env.ASSETS AND NOT fetch() — found by operating it, 2026-08-26.
 * This handler used to do `fetch(new URL("/embed/verify.html", url.origin))`. Pages'
 * html_handling answers `/embed/verify.html` with `308 → /embed/verify`, which is THIS
 * function, which fetched `/embed/verify.html` again. Production answered every embed
 * with:
 *     $ curl -o /dev/null -w '%{http_code}' https://councilof.ai/embed/verify
 *     502
 * — a Cloudflare "Bad gateway" page, on the exact URL the /embed page's Copy button hands
 * to third parties to paste into their own sites. Locally the same request simply never
 * returned. `env.ASSETS.fetch` reads the asset directly and cannot re-enter the router.
 */
interface Env {
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const assetUrl = new URL("/embed/verify.html", url.origin).toString();

  let res: Response | null = null;
  try {
    // The asset binding, not the network: fetching our own origin re-enters this handler.
    res = env.ASSETS ? await env.ASSETS.fetch(assetUrl) : null;
  } catch {
    res = null;
  }

  if (!res || !res.ok) {
    // Say which step failed rather than returning a bare 502 the embedder cannot diagnose.
    return new Response(
      "verify widget unavailable: /embed/verify.html could not be read from the asset store" +
        (res ? ` (HTTP ${res.status})` : " (no ASSETS binding on this deployment)"),
      { status: 502, headers: { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*" } },
    );
  }

  const html = await res.text();
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      // Embeddable in third-party pages by design — this is a public, read-only widget.
      "access-control-allow-origin": "*",
    },
  });
};
