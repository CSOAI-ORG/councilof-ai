/**
 * brand-gate-coverage.test.mjs — how much of the doctrine the deploy gate actually proves.
 *
 * `scripts/brand-gate.mjs` is the gate that blocks the deploy on forbidden display strings, and
 * its own comment states the principle this estate works by: "A guard that cannot fail enforces
 * nothing. This proves every rule still matches the string it exists to catch."
 *
 * Measured 2026-09-05, it proves THREE of SEVENTEEN.
 *
 *   covered    retracted_fault_tolerance, sovereign_brand, internal_codenames
 *   uncovered  defoneos_codename, cert_overclaim, framework_overclaim,
 *              first_card_price_imply, pricing_leak, internal_strategy_codename,
 *              gpai_code_signature, certify_claim, rank_for_sale, inspect_scorer,
 *              false_art50_nov, hub_queue_stickers, measured_index_sticker, infra_leak
 *
 * The uncovered fourteen include the rules that carry the estate's central doctrine —
 * `certify_claim` ("we measure, we never certify"), `rank_for_sale` ("a grade is never sold"),
 * `pricing_leak` ("no public $ prices"). If a pattern in one of those is edited and quietly
 * stops matching, the selftest still passes, the deploy still goes green, and the rule enforces
 * nothing. That is the exact shape of a silent no-op guard, on the gate that guards the most.
 *
 * THE MESSAGE MAKES IT EASIER TO MISS. On success the gate prints "3/3 rules still catch what
 * they exist to catch". That is 3 of 3 CASES, not 3 of 17 RULES, and it reads as full coverage.
 *
 * WHY THIS TEST AND NOT A PATCH. Adding the fourteen cases means editing a shared deploy gate.
 * If any rule turns out to differ from what a new case expects, the selftest starts failing and
 * every lane's deploy stops — a worse outcome than the gap. The cases should be added by whoever
 * owns those rules and knows the exact string each exists to catch. This pins the ratio so it
 * cannot silently get worse, and so the gap is visible rather than implied by a "3/3".
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(here, "..", "scripts", "brand-gate.mjs"), "utf8");

function ruleIds() {
  const block = src.slice(src.indexOf("const RULES ="), src.indexOf("// A guard that cannot fail"));
  return [...block.matchAll(/^\s*id:\s*"([^"]+)",/gm)].map((m) => m[1]);
}

function caseIds() {
  const block = src.slice(src.indexOf("const CASES ="));
  return [...block.matchAll(/^\s*\["([^"]+)",/gm)].map((m) => m[1]);
}

/** Measured 2026-09-05. This may only go UP. */
const COVERED_AT_AUDIT = 3;

describe("brand-gate proves the rules it claims to", () => {
  it("finds the rules and the selftest cases (guards against the parse matching nothing)", () => {
    assert.ok(ruleIds().length >= 15, `only ${ruleIds().length} rules parsed`);
    assert.ok(caseIds().length >= 1, "no selftest cases parsed");
  });

  it("every selftest case names a rule that still exists", () => {
    const rules = new Set(ruleIds());
    const orphans = caseIds().filter((c) => !rules.has(c));
    assert.deepEqual(
      orphans,
      [],
      `these selftest cases name rules that are gone: ${orphans.join(", ")}. The selftest would ` +
        `report them as failures rather than as coverage that no longer applies.`,
    );
  });

  it("selftest coverage has not gone backwards", () => {
    const covered = caseIds().length;
    assert.ok(
      covered >= COVERED_AT_AUDIT,
      `brand-gate selftest now covers ${covered} rules, down from ${COVERED_AT_AUDIT} at audit. ` +
        `A rule with no case is never proven to still catch anything.`,
    );
  });

  it("the doctrine rules are still present, whether or not they are proven", () => {
    // Coverage is the gap; existence is the floor. If `certify_claim` or `rank_for_sale`
    // disappears entirely, the doctrine stops being enforced at all rather than merely
    // being unproven.
    const rules = new Set(ruleIds());
    for (const id of ["certify_claim", "rank_for_sale", "pricing_leak", "cert_overclaim"]) {
      assert.ok(
        rules.has(id),
        `brand-gate no longer carries the "${id}" rule. That is the estate's own doctrine — ` +
          `"we measure, we never certify", "a grade is never sold", "no public $ prices" — ` +
          `and removing the rule removes the enforcement, not just the proof of it.`,
      );
    }
  });

  it("records that most rules are unproven, so the 3/3 message cannot be read as complete", () => {
    const rules = ruleIds();
    const covered = new Set(caseIds());
    const unproven = rules.filter((r) => !covered.has(r));
    // Not asserted to be zero — asserted to be KNOWN. When someone adds the cases, this
    // number drops and the message below stops being true, which is the point.
    assert.ok(
      unproven.length > 0,
      "every rule now has a selftest case. Good — update COVERED_AT_AUDIT and delete this " +
        "assertion, so the file stops describing a gap that has been closed.",
    );
    console.log(
      `      (brand-gate: ${covered.size} of ${rules.length} rules proven; ` +
        `${unproven.length} unproven — ${unproven.slice(0, 4).join(", ")}…)`,
    );
  });
});
