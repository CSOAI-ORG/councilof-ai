import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { headerHtml, primaryLinks, rewrite, staticPages, SHIELD_SVG } from "./static-shell.mjs";

test("the static header carries the app's shield mark, wordmark and PRIMARY_LINKS — no invented nav, no letter-in-a-square", () => {
  const h = headerHtml();
  assert.ok(h.includes(SHIELD_SVG));
  assert.ok(h.includes('class="logo-word">Council of AI<'));
  for (const l of primaryLinks()) assert.ok(h.includes(`href="${l.href}">${l.name}<`), l.href);
  assert.ok(!/logo-mark/.test(h));
});

test("rewrite replaces an old header and its rules, and is idempotent", () => {
  const old = '<style>\n  .logo-mark { width: 30px; }\n  .nav a { color: red; }\n</style>\n<header class="site-header"><a class="logo" href="/"><span class="logo-mark">C</span></a><nav class="nav"><a href="/ras">RAS</a></nav></header>\n<main>x</main>';
  const once = rewrite(old);
  assert.ok(once && !once.includes("logo-mark") && !once.includes("/ras") && once.includes("static-shell brand-v1"));
  assert.equal(rewrite(once), once);
  assert.equal(rewrite("<main>no header</main>"), null);
});

test("every committed static page with a site header is already on the brand header (run the producer if this fails)", () => {
  const links = primaryLinks();
  const stale = staticPages().filter((p) => { const h = readFileSync(p, "utf8"); const n = rewrite(h, links); return n !== null && n !== h; });
  assert.deepEqual(stale, []);
  for (const p of staticPages()) assert.ok(!readFileSync(p, "utf8").includes('class="logo-mark"'), p);
});
