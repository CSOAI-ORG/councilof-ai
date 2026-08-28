/**
 * Planned-ready lock — drives the shipped files with node:test
 * (worktree has no node_modules; vitest companions exist for full npm test).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

describe("SKU lock (shipped Products.tsx)", () => {
  const src = read("client/src/pages/Products.tsx");
  const block = src.match(/export const SKUS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
  const ids = [...block.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
  const hrefs = [...block.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
  const tags = [...block.matchAll(/tag: "([^"]+)"/g)].map((m) => m[1]);

  it("exposes exactly four public SKUs", () => {
    assert.deepEqual(ids, ["verify", "os", "ledger", "data"]);
  });

  it("never sells a grade or a certificate", () => {
    const blob = block.toLowerCase();
    assert.equal(/start certification/.test(blob), false);
    assert.equal(/certified analyst/.test(blob), false);
    assert.equal(/conformity mark/.test(blob), false);
    assert.match(block, /never a purchased public rank|never buy a score/);
  });

  it("keeps Verify free and OS as the workspace", () => {
    assert.equal(hrefs[0], "/gspc-verify");
    assert.equal(hrefs[1], "/os");
    assert.match(tags[0].toLowerCase(), /free/);
  });
});

describe("commercial legal surface (shipped LicensingAgreement.tsx)", () => {
  const src = read("client/src/pages/legal/LicensingAgreement.tsx");
  it("does not grant certification", () => {
    assert.equal(/Start Certification/.test(src), false);
    assert.equal(/CSOAI Certified Analyst/.test(src), false);
  });
  it("is a measurement licence with nobody-ranked-pays", () => {
    assert.match(src, /Measurement licence/);
    assert.match(src, /Nobody ranked pays/);
  });
});

describe("Council OS compose (shipped docker-compose.yml)", () => {
  const src = read("council-os/docker-compose.yml");
  it("is exactly four services with healthchecks", () => {
    const body = src.split(/^services:\s*$/m)[1]?.split(/^volumes:/m)[0] ?? "";
    const names = [...body.matchAll(/^  ([a-z0-9-]+):\s*$/gm)].map((m) => m[1]);
    assert.deepEqual(names, ["postgres", "redis", "api", "nginx"]);
    for (const name of names) {
      const start = body.indexOf(`  ${name}:`);
      const rest = names.slice(names.indexOf(name) + 1);
      const end = rest.length ? body.indexOf(`  ${rest[0]}:`) : body.length;
      assert.match(body.slice(start, end), /healthcheck:/);
    }
  });
});

describe("Pages Functions no longer shadow the new doors", () => {
  it("does not 308 /council-licensing to /honesty", () => {
    assert.equal(existsSync(join(root, "functions/council-licensing.ts")), false);
    assert.equal(existsSync(join(root, "functions/council-licensing/index.ts")), false);
  });
  it("sends /badges to /badge and /verify-certificate to the verifier", () => {
    assert.match(read("functions/badges.ts"), /location: "\/badge"/);
    assert.match(read("functions/verify-certificate.ts"), /location: "\/gspc-verify\//);
    assert.equal(/os\?lobby=home/.test(read("functions/badges.ts")), false);
    assert.equal(/honesty/.test(read("functions/verify-certificate.ts")), false);
  });
});

describe("new product surfaces", () => {
  const blob = [
    read("client/src/pages/Products.tsx"),
    read("client/src/pages/CouncilLicensingLanding.tsx"),
    read("client/src/pages/legal/LicensingAgreement.tsx"),
  ].join("\n");
  it("do not add a preference-arena or router product", () => {
    assert.equal(/Bradley-Terry votes/.test(blob), false);
    assert.equal(/LLM-as-judge/.test(blob), false);
    assert.equal(/route by cost, latency, fallbacks/i.test(blob), false);
  });
});
