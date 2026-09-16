import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRouteHeads, parseRouteTitles, rewriteDescription, rewriteHead, rewriteTitle } from "./route-title.mjs";

test("loadRouteHeads reads the real seo-head.json, including the client-only routes", () => {
  const map = loadRouteHeads();
  assert.ok(map.size > 50, `parsed only ${map.size} heads — the build would ship homepage titles`);
  for (const r of ["/art50", "/assess", "/assessment", "/countdown", "/health-inventory", "/mcp-tools",
                   "/receipt", "/rlusd", "/status", "/tool-commons"]) {
    const h = map.get(r);
    assert.ok(h?.title, `client-only route ${r} has no seo-head.json entry`);
    assert.ok(!/explore measurements and verify evidence|we measure, we sign, we re-attest/.test(h.title), `${r} maps to the homepage title`);
    assert.ok(h.description.length >= 110 && h.description.length <= 160, `${r} description is ${h.description.length} chars`);
  }
});

test("loadRouteHeads normalizes keys and returns empty for text that is not the map", () => {
  const src = JSON.stringify({ routes: { "/a/": { title: "A | X", description: "d" }, "/b": { title: "B | X" } } });
  const map = loadRouteHeads(src);
  assert.equal(map.get("/a").title, "A | X");
  assert.equal(map.get("/b").description, "");
  assert.equal(parseRouteTitles(src).get("/b"), "B | X");
  assert.equal(loadRouteHeads("export default 1").size, 0);
});

test("rewriteTitle replaces title, og:title and twitter:title, escapes, and is idempotent", () => {
  const shell = '<title>Council of AI — explore measurements and verify evidence</title>' +
    '<meta property="og:title" content="Council of AI — home" /><meta name="twitter:title" content="Council of AI — home" />';
  const t = "Article 50 & <verification> services | Council of AI";
  const once = rewriteTitle(shell, t);
  assert.equal(once,
    '<title>Article 50 &amp; &lt;verification&gt; services | Council of AI</title>' +
    '<meta property="og:title" content="Article 50 &amp; &lt;verification&gt; services | Council of AI" />' +
    '<meta name="twitter:title" content="Article 50 &amp; &lt;verification&gt; services | Council of AI" />');
  assert.equal(rewriteTitle(once, t), once);
  assert.equal(rewriteTitle(shell, undefined), shell);
  assert.equal(rewriteTitle("<main>no head</main>", t), "<main>no head</main>");
});

test("rewriteDescription replaces description, og:description and twitter:description; rewriteHead does both", () => {
  const shell = '<title>Shell</title><meta name="description" content="shell d" />' +
    '<meta property="og:description" content="shell og" /><meta name="twitter:description" content="shell tw" />';
  const out = rewriteDescription(shell, 'Says "quoted" & <plain>');
  assert.match(out, /name="description" content="Says &quot;quoted&quot; &amp; &lt;plain&gt;"/);
  assert.match(out, /og:description" content="Says &quot;quoted&quot; &amp; &lt;plain&gt;"/);
  assert.match(out, /twitter:description" content="Says &quot;quoted&quot; &amp; &lt;plain&gt;"/);
  assert.equal(rewriteDescription(shell, ""), shell);
  const both = rewriteHead(shell, { title: "T | X", description: "D" });
  assert.match(both, /<title>T \| X<\/title>/);
  assert.match(both, /name="description" content="D"/);
  assert.equal(rewriteHead(shell, null), shell);
});
