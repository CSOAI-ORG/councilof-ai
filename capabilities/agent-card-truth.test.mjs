/**
 * agent-card-truth.test.mjs — the A2A card points at doors that open.
 *
 * WP-4 states the trap plainly: "A2A discovery is not a working task runtime." A card is cheap
 * to publish and expensive to get wrong — an agent discovers it, believes the skills, and calls
 * whatever it names.
 *
 * Audited 2026-09-05 and the card is better than the warning anticipates. Recording that
 * matters as much as recording a defect, because the next reader should not go looking for a
 * problem that was already solved:
 *
 *   · `explicitly_not` lists ["certification", "accreditation", "conformity-assessment",
 *     "legal-determination", "enforcement"]. A negative declaration in a machine-readable
 *     surface, matching the estate's doctrine. Most agent cards say only what they do.
 *   · `supportedInterfaces` names REAL working doors — /api/assess (HTTP+JSON) and /mcp
 *     (JSONRPC), both GET 200 — rather than a task endpoint that does not exist.
 *   · the one skill carrying an endpoint, article50-detect, points at /api/detect, which is 200.
 *   · `capabilities` declares streaming, pushNotifications and extendedAgentCard all FALSE.
 *
 * The card's top-level `url` is the site root, and a POST there returns 405. Under a strict
 * reading of A2A that field is the task endpoint, so a client that ignores `supportedInterfaces`
 * gets a clean method-not-allowed. That is the honest outcome given there IS no task runtime
 * (/api/a2a and /api/a2a/key both 404, recorded UNAVAILABLE in the registry) — a 405 is a door
 * that says no, not a door that pretends.
 *
 * WHAT THIS GUARDS. Not the card's design, which is sound. Its CLAIMS: every interface and every
 * skill endpoint it advertises must still answer, and the negative declaration must survive.
 * Adding a skill that points nowhere, or quietly dropping `explicitly_not`, are both easy edits
 * to a JSON file that nothing else in the estate would notice.
 *
 * Offline by default. LIVE_A2A=1 fetches the card and probes everything it names.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const CARD = "https://councilof.ai/.well-known/agent-card.json";

async function status(url) {
  try {
    return (await fetch(url, { redirect: "manual" })).status;
  } catch {
    return 0;
  }
}

describe("the A2A agent card only advertises doors that open", () => {
  it("live: the card is served and well formed", async () => {
    if (!process.env.LIVE_A2A) {
      console.log("      (offline: LIVE_A2A unset — card NOT fetched)");
      return;
    }
    const res = await fetch(CARD);
    assert.ok(res.ok, `agent-card.json HTTP ${res.status}`);
    const d = await res.json();
    assert.ok(d.protocolVersion, "no protocolVersion — the version trap WP-4 names");
    assert.ok(Array.isArray(d.skills) && d.skills.length > 0, "no skills declared");
  });

  it("live: it still declares what it is NOT", async () => {
    if (!process.env.LIVE_A2A) {
      console.log("      (offline: LIVE_A2A unset — card NOT fetched)");
      return;
    }
    const d = await (await fetch(CARD)).json();
    const not = d.explicitly_not ?? [];
    assert.ok(
      Array.isArray(not) && not.length > 0,
      "explicitly_not is gone. It is the card's negative declaration — certification, " +
        "accreditation, conformity-assessment, legal-determination, enforcement — and it is " +
        "the part that stops a discovering agent inferring authority we do not claim.",
    );
    for (const term of ["certification", "conformity-assessment", "enforcement"]) {
      assert.ok(
        not.includes(term),
        `explicitly_not no longer disclaims "${term}". "We measure, we never certify" is the ` +
          `estate's first rule; a machine-readable surface must say so too.`,
      );
    }
  });

  it("live: every interface it advertises answers", async () => {
    if (!process.env.LIVE_A2A) {
      console.log("      (offline: LIVE_A2A unset — interfaces NOT probed)");
      return;
    }
    const d = await (await fetch(CARD)).json();
    const dead = [];
    for (const i of d.supportedInterfaces ?? []) {
      const code = await status(i.url);
      if (code < 200 || code >= 400) dead.push(`${i.protocolBinding} ${i.url} -> ${code}`);
    }
    assert.deepEqual(
      dead,
      [],
      `the card advertises interfaces that do not answer: ${dead.join("; ")}. An agent that ` +
        `discovers this card will call them.`,
    );
  });

  it("live: every skill endpoint it names answers", async () => {
    if (!process.env.LIVE_A2A) {
      console.log("      (offline: LIVE_A2A unset — skills NOT probed)");
      return;
    }
    const d = await (await fetch(CARD)).json();
    const dead = [];
    for (const s of d.skills ?? []) {
      const url = s.endpoint ?? s.url ?? s.href;
      if (!url) continue; // a skill may be descriptive; only a NAMED endpoint is a promise
      const code = await status(url);
      if (code < 200 || code >= 400) dead.push(`${s.id}: ${url} -> ${code}`);
    }
    assert.deepEqual(dead, [], `skills advertise dead endpoints: ${dead.join("; ")}`);
  });

  it("live: the absent task runtime still refuses rather than pretends", async () => {
    if (!process.env.LIVE_A2A) {
      console.log("      (offline: LIVE_A2A unset — task runtime NOT probed)");
      return;
    }
    // /api/a2a is recorded UNAVAILABLE. If it ever starts answering, A2A stops being
    // discovery-only and the registry, the transport guard and this file all need updating
    // together — which is a good problem, but not one to discover by accident.
    const code = await status("https://councilof.ai/api/a2a");
    assert.ok(
      code === 404 || code >= 500,
      `/api/a2a now returns ${code}. A2A may no longer be discovery-only — update the ` +
        `capability registry and transport-availability guard in the same change.`,
    );
  });
});
