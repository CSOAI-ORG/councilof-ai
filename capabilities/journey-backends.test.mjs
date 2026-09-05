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
const reg = JSON.parse(readFileSync(path.join(here, "registry.json"), "utf8"));
const J = reg.journey_backends ?? {};

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
    for (const name of ["ras", "remediation", "jobs"]) {
      assert.equal(
        b[name]?.availability,
        "UNAVAILABLE",
        `${name} is no longer recorded UNAVAILABLE. If the backend has landed this is good ` +
          `news — update the record and BUILD the journey; do not leave a stale state behind.`,
      );
    }
    assert.equal(b.receipts?.availability, "OWNER_GATED");
    assert.match(b.receipts?.reason ?? "", /UNPUBLISHED/);
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
    const hits = [];
    for (const f of sources(path.join(repo, "client/src"))) {
      const src = readFileSync(f, "utf8");
      if (/\/api\/(ras|remediation|jobs|receipts)\b/.test(src)) {
        hits.push(path.relative(repo, f));
      }
    }
    assert.deepEqual(
      hits,
      [],
      `these files call a journey backend that is absent in production: ${hits.join(", ")}. ` +
        `If the backend has landed, delete this assertion deliberately. If it has not, the ` +
        `surface is offering approve/fix/retest over a 404 — the faked completed fix WP-3 forbids.`,
    );
    assert.equal(J.client_reference_count, 0, "the recorded count no longer matches the tree");
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
        assert.equal(
          body.count,
          0,
          "receipts now publishes items. The journey can end in a receipt — build that ending " +
            "rather than leaving this recorded as publishing nothing.",
        );
      }
    }
  });
});
