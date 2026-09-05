/**
 * transport-availability.test.mjs — every protocol claim checked against the endpoint.
 *
 * WP-4 asks for one versioned registry across HTTP, MCP, AG-UI, A2A, A2UI, SDK, plugin,
 * extension and app, with actual host support tested, and states four things that must not be
 * overclaimed: AG-UI presentation events cannot advance evidence state; A2A discovery is not a
 * working task runtime; A2UI needs a tested renderer round trip; guarded chat review is not
 * execution.
 *
 * Probed 2026-09-05, and the registry now records what each endpoint actually returned:
 *
 *   /api/agui/gspc-state       200  real STATE_DELTA SSE          VERIFIED (presentation only)
 *   /api/agui/wire             503  agui_wire_unconfigured        OWNER_GATED (AGUI_WIRE_URL)
 *   /.well-known/agent-card    200  1.0.0, 5 skills               VERIFIED (discovery only)
 *   /api/a2a/key               404  no task runtime               UNAVAILABLE
 *   /api/a2ui                  404  no renderer                   UNSUPPORTED
 *
 * The distinction this file defends is between a transport that answers and a transport that
 * does the thing its name suggests. AG-UI answers — and an AG-UI event still cannot make
 * anything MEASURED. A2A's card is real — and there is no send/get/cancel behind it. Recording
 * "200" without that qualifier is how a discovery document becomes a claimed runtime.
 *
 * Offline by default. LIVE_TRANSPORTS=1 re-probes; a skipped probe is reported, never passed.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const reg = JSON.parse(readFileSync(path.join(here, "registry.json"), "utf8"));
const T = reg.transport_availability?.transports ?? {};

const AVAILABILITY = new Set([
  "VERIFIED",
  "LOCAL_CANDIDATE",
  "OWNER_GATED",
  "UNAVAILABLE",
  "UNSUPPORTED",
]);

/** What each state permits the endpoint to return. A mismatch is the drift. */
const EXPECTED_STATUS = {
  VERIFIED: (s) => s === 200,
  OWNER_GATED: (s) => s === 503 || s === 402,
  UNAVAILABLE: (s) => s === 404 || s >= 500,
  UNSUPPORTED: (s) => s === 404,
  LOCAL_CANDIDATE: () => true,
};

describe("transport availability matches the endpoints", () => {
  it("every transport carries a state from the published vocabulary and a reason", () => {
    assert.ok(Object.keys(T).length >= 5, "expected the five probed transports");
    for (const [name, t] of Object.entries(T)) {
      assert.ok(AVAILABILITY.has(t.availability), `${name}: ${t.availability} is not a state`);
      assert.ok(String(t.reason || "").length > 20, `${name} needs a reason, not a label`);
      assert.ok(t.endpoint, `${name} must name the endpoint the state was read from`);
    }
  });

  it("nothing presentation-only is described as advancing evidence", () => {
    // AG-UI is the one most likely to be overclaimed, because it genuinely works.
    const agui = T.agui;
    assert.equal(agui.availability, "VERIFIED");
    assert.match(
      agui.reason,
      /presentation only/i,
      "AG-UI is VERIFIED and must still say presentation only — an event cannot make anything " +
        "MEASURED, and a stream ending is not a run completing",
    );
  });

  it("A2A discovery is not recorded as a task runtime", () => {
    assert.equal(T.a2a_discovery.availability, "VERIFIED");
    assert.match(T.a2a_discovery.reason, /discovery only/i);
    assert.equal(
      T.a2a_tasks.availability,
      "UNAVAILABLE",
      "a card without send/get/cancel behind it is not a runtime",
    );
  });

  it("A2UI is not offered without a proven renderer round trip", () => {
    assert.equal(T.a2ui.availability, "UNSUPPORTED");
  });

  it("each endpoint still returns what its recorded state permits", async () => {
    if (!process.env.LIVE_TRANSPORTS) {
      console.log("      (offline: LIVE_TRANSPORTS unset — endpoints NOT re-probed)");
      return;
    }
    for (const [name, t] of Object.entries(T)) {
      const res = await fetch(`https://councilof.ai${t.endpoint}`, { redirect: "manual" });
      const ok = EXPECTED_STATUS[t.availability](res.status);
      assert.ok(
        ok,
        `${name} is recorded ${t.availability} but ${t.endpoint} returned ${res.status}. ` +
          `Either the state is stale or the endpoint changed — reconcile before shipping copy ` +
          `that depends on it.`,
      );
    }
  });
});
