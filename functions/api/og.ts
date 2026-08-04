// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: Copyright (c) 2026 CSOAI (Council for the Safety of AI, UK)
//
// /api/og — dynamic Open Graph card.
//
// The route resolved to the application shell, so every social/AI-crawler preview of a CSOAI
// link fetched an HTML page where an image was promised. Claims E2E has been failing on it.
//
// Rendered as SVG rather than PNG on purpose: it needs no font binary, no WASM rasteriser and
// no cold-start penalty inside a Pages Function, and every consumer that matters for our
// surfaces (and the E2E content-type assertion) accepts image/svg+xml.

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] as string,
  );

// Wrap on word boundaries. A title that overflows the card silently is worse than one that
// wraps, because it looks fine to whoever ships it and broken to everyone who sees it.
const wrap = (text: string, perLine: number, maxLines: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > perLine) {
      if (cur) lines.push(cur.trim());
      cur = w;
      if (lines.length === maxLines) break;
    } else cur = (cur + " " + w).trim();
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, "…");
  }
  return lines;
};

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const title = (url.searchParams.get("title") ?? "CSOAI").slice(0, 160);
  const subtitle = (
    url.searchParams.get("subtitle") ?? "Council for the Safety of AI"
  ).slice(0, 120);

  const lines = wrap(title, 30, 3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1c"/>
      <stop offset="100%" stop-color="#132033"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="#c9a227"/>
  <text x="72" y="120" font-family="Georgia,'Times New Roman',serif" font-size="30" fill="#c9a227" letter-spacing="3">CSOAI</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${240 + i * 78}" font-family="Georgia,'Times New Roman',serif" font-size="66" font-weight="700" fill="#f5f7fa">${esc(l)}</text>`,
    )
    .join("\n  ")}
  <text x="72" y="${260 + lines.length * 78}" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="30" fill="#9fb0c4">${esc(subtitle)}</text>
  <text x="72" y="562" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="24" fill="#6f8399">csoai.org · measured, signed, publicly refutable</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
