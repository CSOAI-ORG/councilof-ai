import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { onRequestGet } from "./index";
import { deriveClaimReactions, reactionSummary } from "../../../_lib/claimReactions";

const line = (o: Record<string, unknown>) => JSON.stringify({ schema: "csoai.claim-event/0.1", ...o });
const root = resolve(__dirname, "../../../..");
const feedDir = resolve(root, "public/claims/events/v0.1");
const bodies = {
  "/claims/events/v0.1/events.jsonl": readFileSync(resolve(feedDir, "events.jsonl")),
  "/claims/events/v0.1/head.json": readFileSync(resolve(feedDir, "head.json")),
  "/claims/events/v0.1/head.signed.json": readFileSync(resolve(feedDir, "head.signed.json")),
};
const ctx = (path: string, replacements: Record<string, Buffer> = {}) => ({
  request: new Request(`https://councilof.ai${path}`),
  env: { ASSETS: { fetch: async (req: Request | string) => {
    const p = new URL(typeof req === "string" ? req : req.url).pathname;
    const bytes = replacements[p] ?? bodies[p as keyof typeof bodies];
    return bytes ? new Response(bytes, { status: 200 }) : new Response("<!doctype html>", { status: 200 });
  } } },
}) as unknown as Parameters<typeof onRequestGet>[0];

describe("claim reaction projection", () => {
  it("does not turn confirmation into a finding or an action", () => {
    const [r] = deriveClaimReactions([line({ seq: 0, kind: "event", claim: "c1", change_state: "CONFIRMED", recorded_state: "CLAIM_MEASURED" })]);
    expect(r.reaction_state).toBe("NO_CHANGE");
    expect(r.evidence_freshness).toBe("NOT_EVALUATED");
    expect(r.counter_reaction.required).toBe(false);
    expect(r.reason).toMatch(/not a claim that the evidence is fresh/);
  });

  it("turns a recorded state transition into a bounded recheck plus counter-reaction", () => {
    const rows = [
      line({ seq: 0, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_CAPTURED" }),
      line({ seq: 1, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "UNMEASURED" }),
    ];
    const r = deriveClaimReactions(rows)[1];
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.counter_reaction.required).toBe(true);
    expect(r.counter_reaction.boundary).toMatch(/does not decide/);
  });

  it.each(["CORRECTED", "WITHDRAWN", "QUARANTINED"])("routes %s through re-verification even when signed", (change_state) => {
    const [r] = deriveClaimReactions([line({ seq: 0, kind: "event", claim: "c1", change_state, object_state: "SIGNED" })]);
    expect(r.reaction_state).toBe("RECHECK_REQUIRED");
    expect(r.counter_reaction.required).toBe(true);
  });

  it("keeps source failure separate from change evidence", () => {
    const [r] = deriveClaimReactions([line({ seq: 0, kind: "event", claim: "c1", object_state: "FETCH_FAILED" })]);
    expect(r.reaction_state).toBe("SOURCE_RETRY_REQUIRED");
  });

  it("labels baseline and signed receipt without escalating them", () => {
    const r = deriveClaimReactions([
      line({ seq: 0, kind: "atoms", baseline: true, subject_sealed_id: "s1" }),
      line({ seq: 1, kind: "event", claim: "*", object_state: "SIGNED" }),
    ]);
    expect(r.map((x) => x.reaction_state)).toEqual(["BASELINE_ONLY", "DELIVERY_RECEIPT"]);
    expect(reactionSummary(r).n_counter_reaction_required).toBe(0);
  });

  it("replays prior state when an exclusive sequence cursor is used", () => {
    const r = deriveClaimReactions([
      line({ seq: 0, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_CAPTURED" }),
      line({ seq: 1, kind: "event", subject_sealed_id: "s1", claim: "c1", recorded_state: "CLAIM_MEASURED" }),
    ], 0);
    expect(r).toHaveLength(1);
    expect(r[0].event_seq).toBe(1);
    expect(r[0].reaction_state).toBe("RECHECK_REQUIRED");
  });

  it("serves reactions only from the locally verified committed feed and exposes its as-of", async () => {
    const r = await onRequestGet(ctx("/api/claims/reactions"));
    expect(r.status).toBe(200);
    const body = await r.json() as Record<string, unknown>;
    expect(body.state).toBe("LIVE");
    expect(body.source_verification).toBe("VERIFIES");
    expect(body.source_as_of).toBe("2026-09-28T13:20:04Z");
    expect(body.evidence_freshness).toBe("NOT_EVALUATED");
    expect(body.authority_state).toMatch(/^NONE:/);
    expect(body.n_events).toBe(9);
  });

  it("fails closed when the feed head or signature bytes are changed", async () => {
    const altered = Buffer.from(bodies["/claims/events/v0.1/head.json"]);
    altered[10] ^= 1;
    const r = await onRequestGet(ctx("/api/claims/reactions", { "/claims/events/v0.1/head.json": altered }));
    expect(r.status).toBe(503);
  });

  it("rejects malformed cursors", async () => {
    const r = await onRequestGet(ctx("/api/claims/reactions?since=1.2"));
    expect(r.status).toBe(400);
    expect((await r.json()).state).toBe("BAD_INPUT");
  });
});
