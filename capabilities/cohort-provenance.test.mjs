/**
 * cohort-provenance.test.mjs — the per-model cohort is served and the product never shows it.
 *
 * WP-2 requires the board to show source, observation date, instrument, COHORT, sample size and
 * ties, and states that a signed result is not automatically verified. Measured against runtime
 * on 2026-09-05 for axis "jail", the only axis carrying per-model rows.
 *
 * THE FINDING, NOW CLOSED. /api/gspc?axis=jail serves per_model — seven complete confusion
 * matrices — plus quotable_models, and until 1da8fb2f nothing in client/ rendered them. AxisProof
 * now shows the cohort, so the assertion that recorded the gap has been removed rather than left
 * to pass vacuously. What remains here is the data integrity the renderer depends on.
 *
 * TWO THINGS I EXPECTED TO FIND AND DID NOT, recorded because a test that only keeps its
 * confirmed suspicions is not evidence:
 *
 *   - I expected `?axis=` to drop measured_on. It does not. The filtered response carries the
 *     full measured_on including living_stamp with verification_state: SIGNED. My first probe
 *     read the AXIS ENTRY rather than the RESPONSE and I mistook absence there for absence
 *     everywhere. ApiDocs is accurate.
 *   - I expected the UI to conflate SIGNED with verified. It does not. BoardAttestation renders
 *     `verification_state || "UNVERIFIABLE"`, osChat falls back to "UNSTATED", and GSPCVerify
 *     distinguishes a signed root envelope from its leaves. The doctrine is already held.
 *
 * So this file asserts the integrity of the cohort data and the one real gap, and nothing else.
 *
 * Offline by default. LIVE_GSPC=1 fetches runtime; a skipped comparison is reported, not passed.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
const AXIS = "jail";

async function axis() {
  const r = await fetch(`https://councilof.ai/api/gspc?axis=${AXIS}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).axes[0];
}

const skip = (why) => {
  console.log(`      (offline: ${why} — comparison NOT made)`);
};

describe("cohort provenance", () => {
  it("every per-model confusion matrix sums to that model's own n", async () => {
    if (!process.env.LIVE_GSPC) return skip("LIVE_GSPC unset");
    const a = await axis();
    const pm = a.per_model || {};
    assert.ok(Object.keys(pm).length > 0, "jail should carry per_model rows");
    for (const [model, r] of Object.entries(pm)) {
      const sum = r.tp + r.fp + r.tn + r.fn;
      assert.equal(sum, r.n, `${model}: tp+fp+tn+fn=${sum} but n=${r.n}`);
    }
  });

  it("axis n is not the sum of per-model n, and nothing may present it as one", async () => {
    if (!process.env.LIVE_GSPC) return skip("LIVE_GSPC unset");
    const a = await axis();
    const perModelTotal = Object.values(a.per_model).reduce((s, r) => s + r.n, 0);
    assert.notEqual(
      a.n,
      perModelTotal,
      `axis n (${a.n}) coincidentally equals the sum of per-model n (${perModelTotal}). ` +
        `They mean different things — n is the gold-item count, per-model n is usable ` +
        `responses. If they ever match, the copy must still not add them.`,
    );
  });

  it("quotable_models and per_model describe the same cohort", async () => {
    if (!process.env.LIVE_GSPC) return skip("LIVE_GSPC unset");
    const a = await axis();
    const quotable = [...(a.quotable_models || [])].sort();
    const flagged = Object.entries(a.per_model)
      .filter(([, r]) => r.quotable)
      .map(([m]) => m)
      .sort();
    assert.deepEqual(
      quotable,
      flagged,
      "quotable_models disagrees with the per_model quotable flags — one list is stale",
    );
  });

});
