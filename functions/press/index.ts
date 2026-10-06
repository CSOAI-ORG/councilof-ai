/**
 * GET /press/ — the press room, rendered from /api/press.json's exact object.
 *
 * /press has been serving "This legacy page is temporarily withdrawn." A withdrawn page is the
 * right answer to copy nobody can stand behind; it is the wrong answer forever. This replaces it
 * with a page that cannot make a claim the artifacts do not carry, because every line is read
 * from them and every line ships the command that checks it.
 *
 * It renders the SAME object the JSON endpoint returns. A second set of numbers rendered for
 * humans is how a page and its API come to disagree.
 */
import { build } from "../api/press.json";
import type { RevenueEnv } from "../api/revenue";
import { headFromGet } from "../api/_head";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Each command block scrolls sideways on a phone, so it is a keyboard stop with a name: a
// scrollable region a keyboard cannot reach is unreadable past its right edge (axe
// scrollable-region-focusable, ux-gauntlet 2026-09-26).
const pre = (s: string, label = "Command that checks this") =>
  `<pre class="p" tabindex="0" role="region" aria-label="${esc(label)}"><code>${esc(s)}</code></pre>`;

export const onRequestGet: PagesFunction<RevenueEnv> = async ({ env }) => {
  const d = await build(env);
  const c = d.corrections_this_window;
  const r = d.public_root;
  const s = d.signed_cards;

  const corrections = c.items.length
    ? c.items.map((i) => `<article><h3>${esc(i.id)} <span class="d">${esc(i.date)}</span></h3>
      <p><b>What was wrong.</b> ${esc(i.what_was_wrong)}</p>
      <p><b>How it was caught.</b> ${esc(i.how_caught)}</p>
      <p><b>Fix.</b> ${esc(i.fix)}</p>${pre(i.proof, `Proof for ${i.id}`)}</article>`).join("\n")
    : `<p class="n">No correction was issued in this window. That is a fact about the window, not a claim that nothing was wrong.</p>`;

  // FAQ, and the FAQPage node built from THE SAME answers. Two copies — one for the reader and
  // one for the crawler — is how a page and its structured data come to say different things.
  const faqHtml = d.faq.map((f) => `<article><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></article>`).join("\n");
  // The press page is where a journalist or an answer engine looks for WHO publishes. It carried
  // FAQPage only, so the legal entity was absent from the one page most likely to be asked for it
  // (live audit 2026-09-14). Same @id, name, legalName and identifiers as the site-wide
  // Organization in client/index.html, so the two nodes merge instead of competing.
  const ORG_LD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://councilof.ai/#org",
    name: "Council of AI",
    alternateName: "CSOAI",
    legalName: "CSOAI LTD",
    identifier: [
      { "@type": "PropertyValue", propertyID: "Companies House", value: "16939677" },
      { "@type": "PropertyValue", propertyID: "DID", value: "did:web:csoai.org" },
    ],
    url: "https://councilof.ai/",
  });
  const faqLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });

  const notAnnounced = d.not_announced.map((n) => `<article><h3>${esc(n.subject)} — <span class="u">${esc(n.state)}</span></h3><p>${esc(n.why)}</p>${pre(n.proof, `Check for ${n.subject}`)}</article>`).join("\n");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Press — Council of AI</title>
<script type="application/ld+json">${faqLd}</script>
<script type="application/ld+json">${ORG_LD}</script>
<meta name="description" content="What changed at the Council of AI, with the command that proves each line. Derived from the corrections ledger, the public root and the signed card index. Measurement, not certification.">
<link rel="canonical" href="https://councilof.ai/press/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://councilof.ai/press/">
<meta property="og:title" content="Press — Council of AI">
<meta property="og:description" content="What changed at the Council of AI, with the command that proves each line. Measurement, not certification.">
<meta property="og:image" content="https://councilof.ai/og-image.png">
<link rel="alternate" type="application/rss+xml" title="Corrections" href="https://councilof.ai/feeds/corrections.xml">
<link rel="alternate" type="application/rss+xml" title="Signed cards" href="https://councilof.ai/feeds/cards.xml">
<link rel="alternate" type="application/rss+xml" title="Public root" href="https://councilof.ai/feeds/roots.xml">
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .4rem}h2{margin:2.4rem 0 .6rem;font-size:1.2rem;border-bottom:1px solid var(--line);padding-bottom:.35rem}
h3{margin:1.4rem 0 .3rem;font-size:1rem}
.lede{color:var(--mut);margin:0 0 1.4rem}
.d{color:var(--mut);font-weight:400;font-size:.85rem}
.u{color:#b45309}.n{color:var(--mut)}
.p{background:var(--pre);border:1px solid var(--line);border-radius:6px;padding:.6rem .7rem;overflow-x:auto;font-size:.82rem;margin:.5rem 0 0}
dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:.35rem 1rem;margin:.6rem 0}dt{color:var(--mut)}dd{margin:0;min-width:0;overflow-wrap:anywhere}
p,h3{overflow-wrap:anywhere}
.p:focus-visible{outline:2px solid #047857;outline-offset:2px}
article{border-left:2px solid var(--line);padding-left:1rem;margin:1.2rem 0}
footer{margin-top:3rem;color:var(--mut);font-size:.85rem;border-top:1px solid var(--line);padding-top:1rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style></head><body><main>
<h1>Press</h1>
<div style="border-left:3px solid #b45309;padding-left:1rem;margin:0 0 1.4rem">
<p><strong>Press contact:</strong> Nicholas Templeman, founder — <a href="mailto:contact@csoai.org?subject=Press">contact@csoai.org</a></p>
<p class="n">For deadline queries, include <strong>PRESS URGENT</strong> in the subject.</p>
<p class="n"><a href="/feeds/corrections.xml">Corrections feed (RSS)</a> — every correction is published here first.</p>
</div>
<p class="lede">${esc(d.doctrine)}</p>
<p class="lede">Window <b>${esc(d.window.from)} → ${esc(d.window.to)}</b>. ${esc(d.window.derivation)}</p>
${pre(d.window.proof, "Command that derives this window")}

<h2>Corrections issued in this window — ${esc(c.value)} of ${esc(c.total)} total</h2>
<p>${esc(c.note)}</p>
${corrections}

<h2>The public root</h2>
<dl>
<dt>merkle_root</dt><dd><code>${esc(r.merkle_root)}</code></dd>
<dt>leaves</dt><dd>${esc(r.leaves)}</dd>
<dt>as_of</dt><dd>${esc(r.as_of)}</dd>
<dt>signature</dt><dd>${esc(r.signature_state)}</dd>
</dl>
<p>${esc(r.scope)}</p>${pre(r.proof, "Command that checks the public root")}

<h2>Signed measurement cards</h2>
<p>${esc(s.indexed)} indexed, ${esc(s.added_this_window)} added in this window. ${esc(s.corpus_note)}</p>
${pre(s.verify_one, "Command that verifies one signed card")}

<h2>Distribution surfaces</h2>
<p>${esc(d.distribution_surfaces.note)}</p>${pre(d.distribution_surfaces.proof, "Command that checks the distribution surfaces")}

<h2>Commercial evidence</h2>
<p>${esc(d.commercial_evidence.note)}</p>${pre(d.commercial_evidence.proof, "Command that checks the commercial evidence")}

<h2>Questions we are actually asked</h2>
<p class="n">The questions are ours. Every answer is computed from the ledger, the board or the root at request time, so an answer cannot be edited into something the artifacts do not support.</p>
${faqHtml}

<h2>Claims we refuse to overstate</h2>
<p class="n">Measured gaps and unavailable sources remain visible. Each item includes the command that checks its state.</p>
${notAnnounced}

<footer>
<p>Machine-readable: <a href="/api/press.json">/api/press.json</a> — this page renders that exact object.</p>
<p>Feeds: <a href="/feeds/corrections.xml">corrections</a> · <a href="/feeds/cards.xml">cards</a> · <a href="/feeds/roots.xml">public root</a></p>
<p>${esc(d.publisher)}. ${esc(d.license)}. Verification is free and needs no account.</p>
</footer>
</main></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
