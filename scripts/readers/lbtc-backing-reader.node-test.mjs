import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

describe("lbtc-backing-reader", () => {
  it("produces valid JSON with required fields", () => {
    const out = execFileSync("node", ["scripts/readers/lbtc-backing-reader.mjs"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    const card = JSON.parse(out);

    assert.equal(card.schema, "csoai.lbtc-backing/0.1");
    assert.equal(card.measurement_class, "OBSERVED-UNSIGNED");
    assert.ok(card.as_of);
    assert.ok(card.data);
    assert.ok(card.data.circulating_supply_btc > 0);
    assert.ok(card.data.federation_reserves_btc > 0);
    assert.ok(card.data.backing_ratio > 0 && card.data.backing_ratio <= 1);
    assert.ok(card.data.deficit_btc >= 0);
    assert.ok(card.incident);
    assert.ok(card.incident.remediation_claims.length > 0);
    assert.ok(card.sources.supply);
    assert.ok(card.sources.reserves);
  });

  it("backing ratio matches manual calculation", () => {
    const out = execFileSync("node", ["scripts/readers/lbtc-backing-reader.mjs"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    const card = JSON.parse(out);
    const expected = card.data.federation_reserves_btc / card.data.circulating_supply_btc;
    assert.ok(
      Math.abs(card.data.backing_ratio - expected) < 0.0001,
      `backing_ratio ${card.data.backing_ratio} != reserves/supply ${expected}`
    );
  });

  it("card has incident with remediation fuse", () => {
    const out = execFileSync("node", ["scripts/readers/lbtc-backing-reader.mjs"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    const card = JSON.parse(out);
    const claim = card.incident.remediation_claims[0];
    assert.equal(claim.status, "TRACKED");
    assert.ok(claim.fuse_days > 0);
    assert.ok(claim.source);
  });
});
