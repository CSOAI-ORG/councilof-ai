import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprint, reviewRequest, runWatch, watchlist } from "./watch-sources.mjs";
import { researchSourceMetadata } from "./source-metadata.mjs";

const quiet = () => {};
const reply = (body, status = 200) => async () => new Response(body, { status });
const fixtureRegistry = {
  sources: {
    official: {
      publisher: "Official body", title: "Normative source", url: "https://example.test/spec", watch: true,
      reviewed_on: "2026-11-06", boundary: "Method reference only; data and publication rights require separate review.",
      rights_url: "https://example.test/terms", version: "1.4", license: "Declared license; dataset terms separate",
      automatic_submission: true, signed: true, private_note: "not public metadata",
    },
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
    assert.deepEqual(candidate.source, {
      id: "official", publisher: "Official body", title: "Normative source", url: "https://example.test/spec", watch: true,
      reviewed_on: "2026-11-06", boundary: "Method reference only; data and publication rights require separate review.",
      rights_url: "https://example.test/terms", version: "1.4", license: "Declared license; dataset terms separate",
    });
  }
  const stored = JSON.parse(readFileSync(confirmed.written[0], "utf8"));
  assert.deepEqual(stored, confirmed.candidates[0]);
});

test("metadata allowlist retains false and valid values without copying arbitrary source keys", () => {
  const input = {
    watch: false, reviewed_on: "2024-02-29", boundary: "Internal-only Practice results",
    rights_url: "https://example.test/terms", version: "1.4", license: "CC-BY-4.0",
    signed: true, automatic_submission: true, private_note: "secret", extra: { dangerous: true },
  };
  assert.deepEqual(researchSourceMetadata(input), {
    watch: false, reviewed_on: "2024-02-29", boundary: "Internal-only Practice results",
    rights_url: "https://example.test/terms", version: "1.4", license: "CC-BY-4.0",
  });
  assert.equal(input.private_note, "secret");
  const candidate = reviewRequest({
    axis: "axis-one", source: { id: "reference", publisher: "Owner", title: "Reference", url: "https://example.test", ...input },
    previous: { body_sha256: "a".repeat(64) }, current: { body_sha256: "b".repeat(64) },
    assessment: { basis: "fixture", confirmations: 2 }, observedAt: "2026-11-06T00:00:00Z",
  });
  assert.equal(candidate.source.watch, false);
  for (const field of ["signed", "automatic_submission", "writes_board", "model_training", "automatic_fixing", "automatic_signing", "automatic_promotion"]) {
    assert.equal(candidate[field], false);
    assert.equal(candidate.source[field], undefined);
  }
  assert.equal(candidate.measurement_state, "UNMEASURED");
  assert.equal(candidate.signature, null);
});

test("invalid metadata cannot create terms links, dates or unrestricted payloads", () => {
  for (const rights_url of ["javascript:alert(1)", "http://example.test/terms", "https://user:password@example.test/terms", {}, "x".repeat(2049)]) {
    assert.deepEqual(researchSourceMetadata({ watch: "true", reviewed_on: "2026-02-30", rights_url,
      boundary: "x".repeat(2049), version: "x".repeat(129), license: { name: "license" } }), {});
  }
  for (const source of [null, undefined, [], "metadata"]) assert.deepEqual(researchSourceMetadata(source), {});
});

test("reference-only and malformed watch flags never fetch or produce review requests", async () => {
  const files = paths();
  let fetches = 0;
  const sourceRegistry = {
    sources: {
      reference: { ...fixtureRegistry.sources.official, watch: false },
      malformed: { ...fixtureRegistry.sources.official, watch: "true" },
    },
    axes: [{ axis: "axis-one", source_ids: ["reference", "malformed"] }],
  };
  const result = await runWatch({ ...files, sourceRegistry, log: quiet,
    fetchImpl: async () => { fetches++; throw new Error("Disabled source fetched"); },
  });
  assert.equal(fetches, 0);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.written.length, 0);
  assert.equal(result.failed, 0);
  assert.deepEqual(result.state.sources, {});
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
