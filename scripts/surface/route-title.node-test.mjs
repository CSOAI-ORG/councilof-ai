import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRouteTitles, rewriteTitle } from "./route-title.mjs";

test("parseRouteTitles reads the real App.tsx map, including the client-only routes", () => {
  const map = parseRouteTitles(readFileSync("client/src/App.tsx", "utf8"));
  assert.ok(map.size > 50, `parsed only ${map.size} titles — the build would ship homepage titles`);
  for (const r of ["/art50", "/assess", "/assessment", "/countdown", "/health-inventory", "/mcp-tools",
                   "/receipt", "/rlusd", "/status", "/tool-commons"]) {
    assert.ok(map.get(r), `client-only route ${r} has no ROUTE_TITLES entry`);
    assert.ok(!/explore measurements and verify evidence/.test(map.get(r)), `${r} maps to the homepage title`);
  }
});

test("parseRouteTitles normalizes keys and returns empty for a source without the map", () => {
  const src = 'const ROUTE_TITLES: Record<string, string> = {\n  "/a/": "A | X",\n  "/b": "B | X",\n};';
  const map = parseRouteTitles(src);
  assert.equal(map.get("/a"), "A | X");
  assert.equal(map.get("/b"), "B | X");
  assert.equal(parseRouteTitles("export default 1").size, 0);
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
