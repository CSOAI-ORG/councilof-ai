import { test } from "node:test";
import assert from "node:assert/strict";
import { normRoute, rewriteCanonical, servedUrl } from "./canonical-url.mjs";

const O = "https://councilof.ai";

test("servedUrl: directory-index routes carry the trailing slash; root does not", () => {
  assert.equal(servedUrl("/quickstart", O), `${O}/quickstart/`);
  assert.equal(servedUrl("/quickstart/", O), `${O}/quickstart/`);
  assert.equal(servedUrl("/", O), O);
  assert.equal(normRoute("/gspc-arena?view=globe"), "/gspc-arena");
});

test("rewriteCanonical: slashless self and the shell's homepage default both become the served URL", () => {
  const baked = `<link rel="canonical" href="${O}/about"><meta property="og:url" content="${O}/about"><meta name="twitter:url" content="${O}/about">`;
  assert.equal(rewriteCanonical(baked, "/about", O),
    `<link rel="canonical" href="${O}/about/"><meta property="og:url" content="${O}/about/"><meta name="twitter:url" content="${O}/about/">`);
  const shell = `<link rel="canonical" href="${O}" />`;
  assert.equal(rewriteCanonical(shell, "/art50", O), `<link rel="canonical" href="${O}/art50/" />`);
});

test("rewriteCanonical: leaves real alias targets, query routes and the homepage alone", () => {
  const alias = `<link rel="canonical" href="${O}/dashboard">`;
  assert.equal(rewriteCanonical(alias, "/arena-scoreboard", O), alias);
  const q = `<link rel="canonical" href="${O}/gspc-arena">`;
  assert.equal(rewriteCanonical(q, "/gspc-arena?view=globe", O), q);
  const home = `<link rel="canonical" href="${O}" />`;
  assert.equal(rewriteCanonical(home, "/", O), home);
  const already = `<link rel="canonical" href="${O}/about/">`;
  assert.equal(rewriteCanonical(already, "/about", O), already);
});

test("rewriteCanonical: with servedRoutes, an alias target named without its slash becomes its served URL", () => {
  const served = new Set(["/dashboard", "/faq", "/coliseum"]);
  // /coliseum client-redirects to /dashboard; the snapshot bakes the target without a slash (308s).
  const alias = `<link rel="canonical" href="${O}/dashboard"><meta property="og:url" content="${O}/dashboard"><meta name="twitter:url" content="${O}/dashboard">`;
  assert.equal(rewriteCanonical(alias, "/coliseum", O, served),
    `<link rel="canonical" href="${O}/dashboard/"><meta property="og:url" content="${O}/dashboard/"><meta name="twitter:url" content="${O}/dashboard/">`);
  assert.equal(rewriteCanonical(`<link rel="canonical" href="${O}/faq">`, "/faqs", O, served),
    `<link rel="canonical" href="${O}/faq/">`);
  // Not a prerendered route (a public/ static file served extensionless): left alone.
  const staticPage = `<link rel="canonical" href="${O}/civic">`;
  assert.equal(rewriteCanonical(staticPage, "/coliseum", O, served), staticPage);
  // Off-domain, already slashed, and query-string canonicals: left alone; idempotent.
  const off = `<link rel="canonical" href="https://app.rwa.xyz/assets/BENJI">`;
  assert.equal(rewriteCanonical(off, "/coliseum", O, served), off);
  const once = rewriteCanonical(alias, "/coliseum", O, served);
  assert.equal(rewriteCanonical(once, "/coliseum", O, served), once);
  const q = `<link rel="canonical" href="${O}/dashboard?tab=play">`;
  assert.equal(rewriteCanonical(q, "/coliseum", O, served), q);
});
