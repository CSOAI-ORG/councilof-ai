import { test } from "node:test";
import assert from "node:assert/strict";
import { coversWindow, resolveHold, COVERAGE } from "../src/monitor-attestation.mjs";

const W = { closesAt: "2026-09-04T12:00:00Z", stagedPosition: 100, streamId: "s1" };
const att = (o = {}) => ({
  schemaVersion: "councilof.ai/monitor-attestation/1",
  monitor: { id: "did:web:monitor.example#m1", lineage: "Llama (Meta)" },
  signedAt: "2026-09-04T12:00:01Z",
  lastProcessed: { position: 100, streamId: "s1" },
  ...o,
});

test("both legs hold → COVERED", () => {
  assert.equal(coversWindow(att(), W).state, COVERAGE.COVERED);
});

test("signed before the close does NOT cover, however good the position", () => {
  const r = coversWindow(att({ signedAt: "2026-09-04T11:59:59Z", lastProcessed: { position: 999, streamId: "s1" } }), W);
  assert.equal(r.state, COVERAGE.NOT_COVERED);
  assert.match(r.why, /signed before the window closed/);
});

test("position lagging the staged record does NOT cover, however late the signature", () => {
  const r = coversWindow(att({ signedAt: "2026-09-05T00:00:00Z", lastProcessed: { position: 99, streamId: "s1" } }), W);
  assert.equal(r.state, COVERAGE.NOT_COVERED);
  assert.match(r.why, /lags the staged record/);
});

test("exact boundary counts as coverage — 'at or after', 'at or beyond'", () => {
  assert.equal(coversWindow(att({ signedAt: W.closesAt, lastProcessed: { position: 100, streamId: "s1" } }), W).state,
               COVERAGE.COVERED);
});

test("a different stream is UNCHECKABLE, not a lagging position", () => {
  const r = coversWindow(att({ lastProcessed: { position: 100, streamId: "other" } }), W);
  assert.equal(r.state, COVERAGE.UNCHECKABLE);
});

test("missing or malformed inputs are UNCHECKABLE, never a pass", () => {
  assert.equal(coversWindow(null, W).state, COVERAGE.UNCHECKABLE);
  assert.equal(coversWindow(att({ signedAt: "not-a-date" }), W).state, COVERAGE.UNCHECKABLE);
  assert.equal(coversWindow(att({ lastProcessed: { position: "100" } }), W).state, COVERAGE.UNCHECKABLE);
  assert.equal(coversWindow(att({ schemaVersion: "something/2" }), W).state, COVERAGE.UNCHECKABLE);
});

test("absent coverage degrades to a gate — it never releases", () => {
  const r = resolveHold(att({ signedAt: "2026-09-04T11:00:00Z" }), W);
  assert.equal(r.state, "degraded-to-gate");
  assert.notEqual(r.state, "released");
});

test("a critical action never releases on expiry, even with perfect coverage", () => {
  const r = resolveHold(att(), W, { reversibility: "critical" });
  assert.equal(r.state, "staged-gated");
});

test("an objection suspends regardless of coverage", () => {
  assert.equal(resolveHold(att(), W, { objection: true }).state, "suspended");
});

test("§4: perfect attendance with zero interventions is flagged, not silently released", () => {
  const r = coversWindow(att({ interventions: { windowSeconds: 86400, count: 0 } }), W);
  assert.equal(r.state, COVERAGE.COVERED);
  assert.match(String(r.warnings), /dysfunction alert/);
});

test("§4: a monitor that saw drills and flagged none is flagged", () => {
  const r = coversWindow(att({ interventions: { drillsSeen: 5, drillsFlagged: 0 } }), W);
  assert.match(String(r.warnings), /failed every drill/);
});

test("an n_eff floor is enforceable, and unmeasured independence is UNCHECKABLE not a pass", () => {
  assert.equal(coversWindow(att(), W, { minNEff: 2 }).state, COVERAGE.UNCHECKABLE);
  const low = coversWindow(att({ independence: { nEff: 1.0, nLegs: 3, rhoVsProposer: 1.0 } }), W, { minNEff: 2 });
  assert.equal(low.state, COVERAGE.NOT_COVERED);
  assert.match(low.why, /below the deployment floor/);
  const okd = coversWindow(att({ independence: { nEff: 2.4, nLegs: 3, rhoVsProposer: 0.12 } }), W, { minNEff: 2 });
  assert.equal(okd.state, COVERAGE.COVERED);
});

test("the measured 2026-09-04 council would NOT satisfy a floor of 2", () => {
  const measured = { nEff: 1.0, rhoVsProposer: 1.0, nLegs: 3, measuredOver: 10 };
  assert.equal(coversWindow(att({ independence: measured }), W, { minNEff: 2 }).state, COVERAGE.NOT_COVERED);
});
