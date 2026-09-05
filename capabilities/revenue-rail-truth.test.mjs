/**
 * revenue-rail-truth.test.mjs — the money surface must not contradict the rail it describes.
 *
 * WP-6 asks for measured conversion and verified receipts rather than promised revenue. The
 * measurement itself is honest, and this is worth stating plainly because it is the number the
 * whole work package exists to produce:
 *
 *   /api/revenue → one_number.all_time 0 · last_30d 0 · settlements 0, status MEASURED
 *   /api/revenue → settled_usdc null, UNMEASURED ("null, never 0" — 0 would assert a count)
 *   /api/receipts/latest → UNPUBLISHED, 0 items
 *
 * ZERO REAL BUYERS, EVER, and the surface says so with a MEASURED status rather than a blank.
 * That is the correct construction and nothing here tries to improve the number.
 *
 * THE DEFECT WAS THE PROSE BESIDE IT. counters.json told the public "SKU-1. No live settle path
 * (x402 is fail-closed, mode:mock)" and "Null until X402_PAY_TO + a facilitator are provisioned",
 * and /api/revenue published both verbatim. Neither was true:
 *
 *   /.well-known/x402.json                mode "live"
 *   /api/request-attestation              a complete Base/USDC 402 challenge, real payTo
 *   functions/api/_x402.ts                calls /verify THEN /settle since 2026-09-02
 *   /api/revenue provisioning.kv_bound    true
 *
 * The facilitator was provisioned 2026-09-03. `contract.null_rule` in revenue.ts had ALREADY been
 * corrected to derive its wording from railMode(env), with a comment explaining that a stale
 * comment about a money rail is worse than none — and the SKU note one field below still said
 * mock. The fix was applied to the sentence someone was looking at, and the neighbour kept
 * telling buyers the rail was unbuilt.
 *
 * "Null because nothing has settled" and "null because there is no rail" are opposite facts about
 * a business. Only one of them is true, and it was publishing the other.
 *
 * Offline by default. LIVE_REVENUE=1 compares the notes against the live rail.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COUNTERS = path.join(repo, "counters.json");
const MANIFEST = "https://councilof.ai/.well-known/x402.json";
const REVENUE = "https://councilof.ai/api/revenue";

/** Claims that the paid rail does not exist. Read only OUTSIDE quotation marks. */
const DENIES_RAIL = /\bno live settle path\b|\bmode\s*:\s*mock\b|\bis fail-closed, mode\b|until .{0,40}facilitator (?:are|is) provisioned/i;

/**
 * A correction has to be able to quote what it replaced. Every guard in this lane that scanned
 * for a phrase ended up matching its own documentation of the fix — five times — so quoted spans
 * are removed before the note is read. What a note ASSERTS is what it says outside quotes.
 */
function unquoted(s) {
  return String(s).replace(/"[^"]*"/g, " ").replace(/“[^”]*”/g, " ");
}

function revenueNotes() {
  const c = JSON.parse(readFileSync(COUNTERS, "utf8")).counters ?? {};
  return Object.entries(c)
    .filter(([id]) => id.startsWith("revenue_"))
    .flatMap(([id, v]) =>
      ["note", "evidence", "phrasing"]
        .filter((k) => typeof v?.[k] === "string")
        .map((k) => ({ where: `${id}.${k}`, text: v[k] })),
    );
}

describe("the revenue counters describe the rail that actually exists", () => {
  it("finds the revenue counters (guards against the walk matching nothing)", () => {
    const notes = revenueNotes();
    assert.ok(
      notes.length >= 4,
      `only ${notes.length} revenue counter strings found — counters.json changed shape and this ` +
        `guard is reading nothing`,
    );
  });

  it("live: no counter claims the rail is mock or unbuilt while it reports live", async () => {
    if (!process.env.LIVE_REVENUE) {
      console.log("      (offline: LIVE_REVENUE unset — rail mode NOT fetched)");
      return;
    }
    const manifest = await (await fetch(MANIFEST)).json();
    if (manifest.mode !== "live") {
      console.log(`      (rail reports mode "${manifest.mode}" — nothing to contradict)`);
      return;
    }
    const liars = revenueNotes()
      .filter(({ text }) => DENIES_RAIL.test(unquoted(text)))
      .map(({ where, text }) => `${where}: ${text.slice(0, 90)}`);
    assert.deepEqual(
      liars,
      [],
      `/.well-known/x402.json reports mode "live" and a facilitator is provisioned, but these ` +
        `counter strings still tell the public the rail is mock or unbuilt: ${liars.join("; ")}. ` +
        `/api/revenue publishes them verbatim. "Null because nothing has settled" and "null ` +
        `because there is no rail" are opposite facts about this business.`,
    );
  });

  it("live: the one number is still MEASURED rather than quietly blank", async () => {
    if (!process.env.LIVE_REVENUE) {
      console.log("      (offline: LIVE_REVENUE unset — revenue NOT fetched)");
      return;
    }
    const d = await (await fetch(REVENUE)).json();
    const one = d.one_number ?? {};
    assert.equal(
      one.status,
      "MEASURED",
      `one_number.status is "${one.status}", not MEASURED. Zero distinct non-self payers is a ` +
        `measurement and must be published as one; downgrading it to null or UNMEASURED hides ` +
        `the number WP-6 exists to report.`,
    );
    for (const k of ["all_time", "last_30d", "settlements"]) {
      assert.equal(typeof one[k], "number", `one_number.${k} is not a number`);
    }
    assert.match(
      String(one.definition ?? ""),
      /excluding .*(payTo|self)/i,
      "one_number no longer excludes wallets we control. A wallet we own paying us is not a buyer, " +
        "and the definition saying so is what stops the number being trivially inflatable.",
    );
  });

  it("live: settled_usdc stays null rather than becoming a zero", async () => {
    if (!process.env.LIVE_REVENUE) {
      console.log("      (offline: LIVE_REVENUE unset — revenue NOT fetched)");
      return;
    }
    const d = await (await fetch(REVENUE)).json();
    const s = d.settled_usdc ?? {};
    assert.ok(
      s.count === null || typeof s.count === "number",
      "settled_usdc.count is neither null nor a number",
    );
    if (s.count === null) {
      assert.equal(
        s.status,
        "UNMEASURED",
        "settled_usdc has no value but is not marked UNMEASURED — a null with a measured status " +
          "reads as zero revenue confirmed, which is a different claim from no reading taken.",
      );
    }
  });
});
