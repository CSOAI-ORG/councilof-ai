/**
 * ONE template for the estate's hand-written static pages.
 *
 * K07. Before 2026-09-06 three surfaces each carried their own bespoke markup:
 *
 *   /press            SPA route -> ContentReviewNotice ("temporarily withdrawn")
 *   /interop          static html, dark  (#04070d bg, gold links, own <style>)
 *   /dashboard/games  static html, LIGHT (#ffffff bg, green h1, own <style>)
 *
 * Two of those must stay static: Cloudflare Pages serves a real file at
 * /interop/index.html for bare directory URLs, and a SPA route would never be
 * reached for them. So "one template" here means one GENERATOR, not one
 * framework — the static pages stop being hand-edited artefacts and become
 * producer output, which is the estate's standing rule.
 *
 * The palette is the estate's, taken from the existing /interop page rather
 * than invented: ink #04070d, text #e2e8f0, muted #94a3b8, accent #C8A05C.
 *
 * Nothing here states a count, a date or a claim of its own. Everything
 * rendered is passed in by a producer that read it out of a committed artifact.
 */

const INK = "#04070d";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const ACCENT = "#C8A05C";
const LINE = "#1e293b";

export const PALETTE = { INK, TEXT, MUTED, ACCENT, LINE };

/** Minimal, deliberate escaping — these pages take producer input, not user input. */
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:${INK};color:${TEXT};margin:0;line-height:1.55}
a{color:${ACCENT};text-decoration:none}
a:hover{text-decoration:underline}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;color:${TEXT}}
header.site{border-bottom:1px solid ${LINE};padding:14px 24px;display:flex;align-items:center;gap:10px}
header.site .brand{font-weight:700;color:${TEXT}}
header.site nav{margin-left:auto;display:flex;gap:16px;font-size:14px}
main{max-width:52rem;margin:0 auto;padding:32px 24px 64px}
.kicker{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px}
h1{font-size:1.6rem;margin:0 0 12px;color:${TEXT}}
h2{font-size:1.05rem;margin:0 0 6px;color:${TEXT}}
p,li{color:#cbd5e1}
.meta{color:${MUTED};font-size:.9rem}
ul{padding-left:1.1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:20px}
.card{border:1px solid ${LINE};border-radius:12px;padding:18px;background:#070c16;display:block}
.card:hover{border-color:${ACCENT}}
.card p{margin:0 0 10px;font-size:14px;color:#cbd5e1}
.pill{display:inline-block;border:1px solid ${ACCENT};color:${ACCENT};padding:2px 8px;border-radius:12px;font-size:11px;font-family:ui-monospace,monospace}
footer.site{border-top:1px solid ${LINE};margin-top:48px;padding:20px 24px;color:${MUTED};font-size:13px;max-width:52rem;margin-left:auto;margin-right:auto}
@media (max-width:640px){main{padding:24px 16px 48px}header.site nav{display:none}}
`.trim();

/**
 * @param {object} p
 * @param {string} p.title            <title>, already page-specific
 * @param {string} p.description      meta description
 * @param {string} p.canonical        absolute canonical url
 * @param {string} p.kicker           small uppercase line above the heading
 * @param {string} p.heading          h1
 * @param {string} p.lede             one paragraph, plain text
 * @param {string} p.bodyHtml         producer-built markup
 * @param {string|null} p.asOf        the date READ OUT of the source artifact
 * @param {string} p.sourceNote       which artifact this page was derived from
 */
export function renderStaticPage(p) {
  const asOf = p.asOf ? `<p class="meta">As at ${esc(p.asOf)}, read from the artifact named below.</p>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}"/>
<link rel="canonical" href="${esc(p.canonical)}"/>
<link rel="icon" href="https://councilof.ai/csoai-icon.svg"/>
<style>${STYLE}</style>
</head>
<body>
<header class="site">
  <img src="https://councilof.ai/csoai-icon.svg" alt="" width="22" height="22"/>
  <span class="brand">Council of AI</span>
  <nav>
    <a href="https://councilof.ai/dashboard?tab=board">Board</a>
    <a href="https://councilof.ai/gspc-verify">Verify</a>
    <a href="https://councilof.ai/honesty">Honesty</a>
  </nav>
</header>
<main>
  <p class="kicker">${esc(p.kicker)}</p>
  <h1>${esc(p.heading)}</h1>
  <p>${esc(p.lede)}</p>
  ${asOf}
  ${p.bodyHtml}
</main>
<footer class="site">
  <p>We measure; we never certify. Verification is free. Empty slots stay empty and are named — a gap is a fact, not a zero.</p>
  <p class="meta">Derived from ${esc(p.sourceNote)}. This page is generated by <code>scripts/build-static-pages.mjs</code> — edit the producer, never the html. Living board: <a href="https://councilof.ai/api/gspc">GET /api/gspc</a>.</p>
</footer>
</body>
</html>
`;
}
