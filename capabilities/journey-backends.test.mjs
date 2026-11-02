/**
 * journey-backends.test.mjs — what the case-model journey can actually reach.
 *
 * WP-3 asks for one case model carried across every audience: ask, scope, inspect, explain,
 * propose, approve, fix, retest, receipt, monitor. It also says a missing backend must show
 * the EXACT unavailable capability and must never fake a completed fix.
 *
 * Probed 2026-09-05 against production, unauthenticated:
 *
 *   /api/findings          200   CSOAI fleet, schema + honesty + as_of   VERIFIED
 *   /api/ras               404   not_found                               UNAVAILABLE
 *   /api/ras/status        404   not_found                               UNAVAILABLE
 *   /api/remediation       404   not_found                               UNAVAILABLE
 *   /api/jobs              404   not_found                               UNAVAILABLE
 *   /api/receipts/latest   200   UNPUBLISHED, items [], count 0          OWNER_GATED
 *
 * So the journey is reachable as far as `explain` and no further. That is the finding this
 * file pins, for two reasons.
 *
 * FIRST, so the gap stops being an assumption. It was carried between handoffs as a sentence
 * ("WP-3 is blocked") with no date and no evidence. Now it is a dated measurement that a
 * reader can re-run.
 *
 * SECOND, so it FAILS when the backend arrives. When TUI 1 lands the RAS loop, /api/ras stops
 * returning 404 and this suite goes red — which is the handoff signal, not a regression. The
 * failure message says so, so nobody "fixes" it by loosening the assertion.
 *
 * The offline half asserts the honest client state: nothing under client/ references these
 * endpoints. A surface that begins offering approve/fix/retest while they still 404 would be
 * describing an action the estate cannot take, and that is what WP-3 forbids.
 *
 * Offline by default. LIVE_JOURNEY=1 re-probes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
// THE RECORD LIVES IN ITS OWN FILE. capabilities/registry.json is a GENERATED VIEW of
// council-os/capabilities.json ("do not hand-edit"), and it never carried a journey block,
// so this file read an empty object and every assertion failed - inside a test that no gate
// ran, which is why the drift survived from 2026-09-05 to 2026-11-02.
const J = JSON.parse(readFileSync(path.join(here, "journey-backends.json"), "utf8"));

/** The endpoints the journey needs, and what each recorded state permits. */
const EXPECTED = {
  UNAVAILABLE: (s) => s === 404 || s >= 500,
  OWNER_GATED: (s) => s === 200 || s === 402 || s === 503,
  VERIFIED: (s) => s === 200,
};

/** Every .ts/.tsx under client/src, so the reference check cannot miss a directory. */
function sources(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

describe("the journey reaches exactly as far as runtime allows", () => {
  it("every journey backend carries a state, a reason and the endpoint it was read from", () => {
    const b = J.backends ?? {};
    assert.ok(Object.keys(b).length >= 5, "expected the five probed journey backends");
    for (const [name, e] of Object.entries(b)) {
      assert.ok(EXPECTED[e.availability], `${name}: ${e.availability} is not a recorded state`);
      assert.ok(String(e.reason || "").length > 40, `${name} needs a reason, not a label`);
      assert.ok(e.endpoint, `${name} must name the endpoint its state was read from`);
    }
  });

  it("records that the execute half of the journey has no runtime", () => {
    const b = J.backends ?? {};
    for (const name of ["ras", "ras_status", "remediation", "jobs"]) {
      assert.equal(
        b[name]?.availability,
        "UNAVAILABLE",
        `${name} is no longer recorded UNAVAILABLE. If the backend has landed this is good ` +
          `news — update the record and BUILD the journey; do not leave a stale state behind.`,
      );
    }
    // The receipt ending LANDED. This row said UNPUBLISHED with an empty count from
    // 2026-09-05; /api/receipts/latest now answers 200, status PUBLISHED, count 26. The
    // test's own instruction for that moment was to build the ending rather than leave the
    // record behind — so the record now says VERIFIED and the journey reaches its receipt.
    assert.equal(b.receipts?.availability, "VERIFIED");
    assert.doesNotMatch(b.receipts?.reason ?? "", /UNPUBLISHED/);
  });

  it("does not let the one live input imply the whole journey works", () => {
    const b = J.backends ?? {};
    assert.equal(b.findings?.availability, "VERIFIED");
    assert.match(
      String(J.consequence_for_wp3_and_wp6 ?? ""),
      /propose|onward/i,
      "the registry must state where the journey stops, not merely list endpoint states",
    );
  });

  it("no client surface offers an execute path the estate cannot take", () => {
    // EXACT PATHS, NOT PREFIXES. The blunt regex this used to use flagged ANY mention of
    // "/api/ras" — including /api/ras/supply and /api/ras/mcp-probe, which answer 402 and
    // are live metered endpoints. A check that fires on a working endpoint teaches everyone to
    // ignore it. So the forbidden set is taken from the record's UNAVAILABLE rows.
    const unavailable = new Set(
      Object.entries(J.backends ?? {})
        .filter(([, e]) => e.availability === "UNAVAILABLE")
        .map(([, e]) => e.endpoint),
    );
    const hits = [];
    for (const f of sources(path.join(repo, "client/src"))) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/\/api\/[a-z0-9/_-]+/gi)) {
        const p = m[0].replace(/\/+$/, "");
        if (unavailable.has(p)) hits.push(`${path.relative(repo, f)} -> ${p}`);
      }
    }
    assert.deepEqual(
      hits,
      [],
      `these files call a journey backend that is absent in production: ${hits.join(", ")}. ` +
        `If the backend has landed, delete this assertion deliberately. If it has not, the ` +
        `surface is offering approve/fix/retest over a 404 — the faked completed fix WP-3 forbids.`,
    );
    assert.equal(J.client_reference_count, hits.length, "the recorded count no longer matches the tree");
  });

  it("live: each journey backend still answers as recorded", async () => {
    if (!process.env.LIVE_JOURNEY) {
      console.log("      (offline: LIVE_JOURNEY unset — journey backends NOT re-probed)");
      return;
    }
    for (const [name, e] of Object.entries(J.backends ?? {})) {
      const res = await fetch(`https://councilof.ai${e.endpoint}`, { redirect: "manual" });
      assert.ok(
        EXPECTED[e.availability](res.status),
        `${name} is recorded ${e.availability} but ${e.endpoint} returned ${res.status}. ` +
          `If the RAS loop has landed, THIS FAILURE IS THE HANDOFF SIGNAL: build the journey ` +
          `and update this record. Do not relax the assertion to make it pass.`,
      );
      if (name === "receipts") {
        const body = await res.json();
        // FLIPPED 2026-11-02. This used to assert count === 0, with the message "receipts now
        // publishes items. The journey can end in a receipt — build that ending rather than
        // leaving this recorded as publishing nothing." That is what happened: the feed now
        // publishes 26 aggregate items. So the ending exists, and the assertion now holds the
        // record to it rather than to the absence that has been replaced.
        assert.ok(
          Number(body.count) > 0 && body.status === "PUBLISHED",
          `receipts no longer publishes a receipt: status=${body.status} count=${body.count}. ` +
            `If the feed went back to empty, the journey's ending is gone — record that, ` +
            `do not assume it.`,
        );
      }
    }
  });
});
