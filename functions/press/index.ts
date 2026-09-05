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

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pre = (s: string) => `<pre class="p"><code>${esc(s)}</code></pre>`;

export const onRequestGet: PagesFunction = async () => {
  const d = build();
  const c = d.corrections_this_window;
  const r = d.public_root;
  const s = d.signed_cards;

  const corrections = c.items.length
    ? c.items.map((i) => `<article><h3>${esc(i.id)} <span class="d">${esc(i.date)}</span></h3>
      <p><b>What was wrong.</b> ${esc(i.what_was_wrong)}</p>
      <p><b>How it was caught.</b> ${esc(i.how_caught)}</p>
      <p><b>Fix.</b> ${esc(i.fix)}</p>${pre(i.proof)}</article>`).join("\n")
    : `<p class="n">No correction was issued in this window. That is a fact about the window, not a claim that nothing was wrong.</p>`;

  // FAQ, and the FAQPage node built from THE SAME answers. Two copies — one for the reader and
  // one for the crawler — is how a page and its structured data come to say different things.
  const faqHtml = d.faq.map((f) => `<article><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></article>`).join("\n");
  const faqLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });

  const notAnnounced = d.not_announced.map((n) => `<article><h3>${esc(n.subject)} — <span class="u">${esc(n.state)}</span></h3><p>${esc(n.why)}</p>${pre(n.proof)}</article>`).join("\n");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Press — Council of AI</title>
<script type="application/ld+json">${faqLd}</script>
<meta name="description" content="What changed at the Council of AI, with the command that proves each line. Derived from the corrections ledger, the public root and the signed card index. Measurement, not certification.">
<link rel="canonical" href="https://councilof.ai/press/">
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
dl{display:grid;grid-template-columns:max-content 1fr;gap:.35rem 1rem;margin:.6rem 0}dt{color:var(--mut)}
article{border-left:2px solid var(--line);padding-left:1rem;margin:1.2rem 0}
footer{margin-top:3rem;color:var(--mut);font-size:.85rem;border-top:1px solid var(--line);padding-top:1rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style></head><body><main>
<h1>Press</h1>
<p class="lede">${esc(d.doctrine)}</p>
<p class="lede">Window <b>${esc(d.window.from)} → ${esc(d.window.to)}</b>. ${esc(d.window.derivation)}</p>
${pre(d.window.proof)}

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
<p>${esc(r.scope)}</p>${pre(r.proof)}

<h2>Signed measurement cards</h2>
<p>${esc(s.indexed)} indexed, ${esc(s.added_this_window)} added in this window. ${esc(s.corpus_note)}</p>
${pre(s.verify_one)}

<h2>Distribution surfaces</h2>
<p>${esc(d.distribution_surfaces.note)}</p>${pre(d.distribution_surfaces.proof)}

<h2>Questions we are actually asked</h2>
<p class="n">The questions are ours. Every answer is computed from the ledger, the board or the root at request time, so an answer cannot be edited into something the artifacts do not support.</p>
${faqHtml}

<h2>What we are NOT announcing</h2>
<p class="n">A press page that silently drops the things that did not happen is marketing. These are named with the command that shows their state.</p>
${notAnnounced}

<footer>
<p>Machine-readable: <a href="/api/press.json">/api/press.json</a> — this page renders that exact object.</p>
<p>Feeds: <a href="/feeds/corrections.xml">corrections</a> · <a href="/feeds/cards.xml">cards</a> · <a href="/feeds/roots.xml">public root</a></p>
<p>${esc(d.publisher)}. ${esc(d.license)}. Verification is free and needs no account.</p>
</footer>
</main></body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};
