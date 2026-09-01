/**
 * Compact white-label snippets. Same card bytes, same endpoints — smaller paste.
 * Do not add VRO / Emilia / XRPL / OTS fields here; the widget hashes card-v1.
 *
 * `?embed=1` is for partners framing THIS snippet on their origin (n-site spray).
 * It is not how Council OS frames `/` `/os` `/dashboard` — those paths are
 * unframeable and break out. Spray is /embed + /badge + glass on *their* site.
 */
export const EMBED_ORIGIN = "https://councilof.ai";
export const CARD_EMBED_WIDTH = 420;
export const CARD_EMBED_HEIGHT = 340;

export function badgeSnippet(axis = "", origin = EMBED_ORIGIN): string {
  const src = axis ? `${origin}/api/badge?axis=${encodeURIComponent(axis)}` : `${origin}/api/badge`;
  const alt = axis ? `${axis} — measured by Council of AI` : "Council of AI — measured axis";
  return `<a href="${origin}/gspc-verify"><img src="${src}" alt="${alt}" height="20"></a>`;
}

export function cardSnippet(cardPath: string, origin = EMBED_ORIGIN): string {
  return (
    `<iframe src="${origin}/embed/verify?card=${cardPath}"` +
    ` width="${CARD_EMBED_WIDTH}" height="${CARD_EMBED_HEIGHT}"` +
    ` loading="lazy" style="border:0;max-width:100%"` +
    ` title="Powered by Council of AI — verify a signed measurement card"></iframe>`
  );
}
