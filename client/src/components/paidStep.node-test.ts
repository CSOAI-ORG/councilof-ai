import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAID_STEP_COMMISSION, PAID_STEP_FEED, PAID_STEP_HREF, PAID_STEP_LINE } from "./paidStep.ts";

const here = dirname(fileURLToPath(import.meta.url));

test("names the live catalog and feed door, never a price", () => {
  assert.equal(PAID_STEP_HREF, "/api/x402");
  assert.equal(PAID_STEP_FEED, "/api/eunomia-data?feed=1");
  assert.equal(PAID_STEP_COMMISSION, "/api/request-attestation");
  assert.match(PAID_STEP_LINE.toLowerCase(), /verification is free/);
  assert.match(PAID_STEP_LINE, /commission_card/);
  assert.equal(/\$/.test(PAID_STEP_LINE), false);
});

test("Footer.tsx renders the shipped line", () => {
  const src = readFileSync(join(here, "Footer.tsx"), "utf8");
  assert.match(src, /from ['"]\.\/paidStep['"]/);
  assert.match(src, /PAID_STEP_LINE/);
  assert.match(src, /PAID_STEP_HREF/);
  assert.match(src, /data-paid-step/);
});
