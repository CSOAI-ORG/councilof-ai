import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprint, reviewRequest, runWatch, watchlist } from "./watch-sources.mjs";

const quiet = () => {};
const reply = (body, status = 200) => async () => new Response(body, { status });
const fixtureRegistry = {
  sources: {
    official: { publisher: "Official body", title: "Normative source", url: "https://example.test/spec", watch: true },
    unwatch: { publisher: "Reference", title: "Background", url: "https://example.test/background", watch: false },
  },
  axes: [
    { axis: "axis-one", source_ids: ["official"] },
    { axis: "axis-two", source_ids: ["official", "unwatch"] },
  ],
};
function paths() {
  const dir = mkdtempSync(join(tmpdir(), "gspc-research-watch-"));
  return { stateFile: join(dir, "state.json"), requestsDir: join(dir, "requests") };
}

test("watchlist deduplicates a shared source and retains every exact axis mapping", () => {
  const list = watchlist(fixtureRegistry);
  assert.equal(list.length, 1);
  assert.deepEqual(list[0].axes, ["axis-one", "axis-two"]);
  assert.equal(list[0].url, "https://example.test/spec");
});

test("failed and empty fetches cannot become observations", async () => {
  await assert.rejects(() => fingerprint("https://example.test", reply("", 200)), /FETCH_FAILED/);
  await assert.rejects(() => fingerprint("https://example.test", reply("gateway", 503)), /FETCH_FAILED/);
});

test("baseline and unchanged observations produce no candidates", async () => {
  const files = paths();
  const first = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version one"), now: "2026-10-28T00:00:00Z", log: quiet });
  const second = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version one"), now: "2026-10-28T01:00:00Z", log: quiet });
  assert.equal(first.candidates.length, 0);
  assert.equal(second.candidates.length, 0);
  assert.equal(second.unconfirmed, 0);
});

test("one changed fetch is pending; the same fingerprint after ten minutes emits unsigned axis requests", async () => {
  const files = paths();
  await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version one"), now: "2026-10-28T00:00:00Z", log: quiet });
  const pending = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version two"), now: "2026-10-28T01:00:00Z", log: quiet });
  assert.equal(pending.candidates.length, 0);
  assert.equal(pending.unconfirmed, 1);
  assert.ok(pending.state.sources.official.pending_token);

  const confirmed = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version two"), now: "2026-10-28T01:11:00Z", log: quiet });
  assert.equal(confirmed.candidates.length, 2);
  assert.equal(confirmed.written.length, 2);
  for (const [index, candidate] of confirmed.candidates.entries()) {
    assert.equal(candidate.axis, index === 0 ? "axis-one" : "axis-two");
    assert.equal(candidate.state, "AWAITING_HUMAN_REVIEW");
    assert.equal(candidate.measurement_state, "UNMEASURED");
    assert.equal(candidate.signed, false);
    assert.equal(candidate.signature, null);
    assert.equal(candidate.automatic_submission, false);
    assert.equal(candidate.writes_board, false);
    assert.equal(candidate.model_training, false);
    assert.equal(candidate.automatic_fixing, false);
    assert.equal(candidate.automatic_promotion, false);
    assert.equal(candidate.confirmations, 2);
    assert.equal(candidate.source.url, "https://example.test/spec");
  }
  const stored = JSON.parse(readFileSync(confirmed.written[0], "utf8"));
  assert.deepEqual(stored, confirmed.candidates[0]);
});

test("a failed refresh preserves the baseline and emits no candidate", async () => {
  const files = paths();
  const baseline = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("version one"), now: "2026-10-28T00:00:00Z", log: quiet });
  const digest = baseline.state.sources.official.body_sha256;
  const failed = await runWatch({ ...files, sourceRegistry: fixtureRegistry, fetchImpl: reply("bad gateway", 503), now: "2026-10-28T01:00:00Z", log: quiet });
  assert.equal(failed.failed, 1);
  assert.equal(failed.candidates.length, 0);
  assert.equal(failed.state.sources.official.body_sha256, digest);
  assert.match(failed.state.sources.official.last_error, /FETCH_FAILED/);
});

test("review-request constructor always separates source change from measurement and legal meaning", () => {
  const candidate = reviewRequest({
    axis: "axis-one",
    source: watchlist(fixtureRegistry)[0],
    previous: { body_sha256: "a".repeat(64) },
    current: { body_sha256: "b".repeat(64) },
    assessment: { basis: "body-two-fetches-660s-apart", confirmations: 2 },
    observedAt: "2026-10-28T01:11:00Z",
  });
  assert.equal(candidate.schema, "csoai.research-review-request/0.1");
  assert.equal(candidate.automatic_signing, false);
  assert.match(candidate.limitations.join(" "), /not an interpretation/);
  assert.match(candidate.limitations.join(" "), /not a measurement/);
});
