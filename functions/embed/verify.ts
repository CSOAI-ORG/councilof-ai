/**
 * GET /embed/verify — the self-contained, self-verifying card widget at a clean URL.
 *
 * Third parties embed it as:
 *   <iframe src="https://councilof.ai/embed/verify?card=/signals/cross-border-card.signed.json"
 *           width="580" height="420" style="border:0" title="Council of AI — verify signed card"></iframe>
 *
 * The widget itself lives as a static asset at /embed/verify.html (single source of
 * truth). This function serves those exact bytes at the extension-less path so the
 * iframe URL reads cleanly and the query string is preserved by the client. It adds
 * nothing to the HTML: all verification is Ed25519 done in the visitor's browser.
 */
export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const asset = new URL("/embed/verify.html", url.origin).toString();
  const res = await fetch(asset);
  if (!res.ok) {
    return new Response("verify widget unavailable", { status: 502, headers: { "content-type": "text/plain" } });
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
