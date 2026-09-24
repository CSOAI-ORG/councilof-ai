import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("client/src/pages/ClaimMaintenance.tsx", "utf8");
const head = JSON.parse(readFileSync("client/src/data/seo-head.json", "utf8"));

test("claim-maintenance has one route head producer and a bounded description", () => {
  const description = head.routes["/claim-maintenance"].description;
  assert.ok(description.length >= 110 && description.length <= 160);
  assert.match(page, /import seoHead from "\.\.\/data\/seo-head\.json"/);
  assert.match(page, /const PAGE_DESCRIPTION = seoHead\.routes\["\/claim-maintenance"\]\.description/);
  assert.match(page, /description: PAGE_DESCRIPTION/);

  const helmet = page.match(/<Helmet>([\s\S]*?)<\/Helmet>/)?.[1];
  assert.ok(helmet, "page keeps its JSON-LD script in Helmet");
  assert.match(helmet, /type="application\/ld\+json"/);
  assert.doesNotMatch(helmet, /<title\b|<meta\b|<link\b/i,
    "the central route-head writer alone owns title, description, OG and canonical tags");
});
