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


import { fetchOpportunitySource, opportunityObservation, opportunitySourceUrl, runOpportunityWatch, selectOpportunityRoutes, validateOpportunityRegistry } from "./watch-sources.mjs";
const opportunitySeed = JSON.parse(readFileSync(new URL("../../public/interop/opportunity-registry.json", import.meta.url), "utf8"));
const seed = () => {
  const value = structuredClone(opportunitySeed); value.last_capture = null;
  for (const r of value.routes) r.observations = r.source_urls.map(source_url => ({ source_url, state: "CATALOGUED", attempted_at: null, last_success_at: null, http_status: null, content_sha256: null, baseline_sha256: null, pending_sha256: null, pending_since: null, reason: "NOT_READ", workflow_run_url: null, artifact_url: null }));
  return value;
};
const at = "2026-11-06T07:00:00.000Z";
const later = "2026-11-06T08:00:00.000Z";
const obs = () => ({ ...seed().routes[0].observations[0], state: "CATALOGUED", attempted_at: null, last_success_at: null, http_status: null, content_sha256: null, baseline_sha256: null, pending_sha256: null, pending_since: null, reason: "NOT_READ", workflow_run_url: null, artifact_url: null });
const ok = (c) => ({ ok: true, status: 200, body_sha256: c.repeat(64) });

test("opportunity selection is all29 daily or exactly4 integrations hourly; metadata only", () => {
  assert.equal(selectOpportunityRoutes(seed(), "all").length, 29);
  assert.deepEqual(selectOpportunityRoutes(seed(), "integrations").map(r => r.route_id), ["R07", "R08", "R09", "R13"]);
  assert.equal(selectOpportunityRoutes(seed(), "integrations").flatMap(r => r.source_urls).length, 9);
  assert.throws(() => selectOpportunityRoutes(seed(), "models"), /SCOPE_INVALID/);
});

test("opportunity public contract rejects private, unknown and duplicate records", () => {
  for (const field of ["contact_email", "employee_count", "budget", "application_status"]) {
    const value = seed(); value.routes[0][field] = "private";
    assert.throws(() => validateOpportunityRegistry(value), /REGISTRY_INVALID/);
  }
  const duplicate = seed(); duplicate.routes[1].route_id = "R01";
  assert.throws(() => validateOpportunityRegistry(duplicate), /REGISTRY_INVALID/);
  const missing = seed(); missing.routes.pop();
  assert.throws(() => validateOpportunityRegistry(missing), /REGISTRY_INVALID/);
  const score = seed(); score.routes[0].observations[0].value = 0;
  assert.throws(() => validateOpportunityRegistry(score), /REGISTRY_INVALID/);
});

test("hostile URL forms are rejected before any fetch", async () => {
  for (const url of ["http://www.nist.gov/", "https://www.nist.gov@evil.example/", "https://user@www.nist.gov/", "https://www.nist.gov:444/", "https://127.0.0.1/", "https://[::1]/", "https://www.nist.gov/#x", "https://www.nist.gov/?api_key=secret", "https://unreviewed.example/"]) {
    let called = false;
    await assert.rejects(() => fetchOpportunitySource(url, { fetchImpl: async () => { called = true; return new Response("bad"); } }), /URL_REJECTED/);
    assert.equal(called, false);
  }
  assert.equal(opportunitySourceUrl("https://www.nist.gov/"), "https://www.nist.gov/");
});

test("redirects never follow or expose Location; requests omit credentials and do not send auth", async () => {
  const seen = [];
  const result = await fetchOpportunitySource("https://www.nist.gov/", { fetchImpl: async (url, options) => {
    seen.push({ url, options }); return new Response("", { status: 302, headers: { location: "http://127.0.0.1:8080/?secret=private" } });
  } });
  assert.equal(seen.length, 1); assert.equal(seen[0].options.redirect, "manual"); assert.equal(seen[0].options.credentials, "omit");
  assert.equal(seen[0].options.headers.authorization, undefined);
  assert.deepEqual(result, { ok: false, status: 302, reason: "REDIRECT_NOT_FOLLOWED" });
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("empty, blocked, challenge and oversized reads cannot produce success hashes", async () => {
  for (const [body, status, reason, maxBytes] of [["", 200, "EMPTY_BODY", 1000], ["denied", 403, "HTTP_STATUS", 1000], ["<title>Just a moment</title>", 200, "CHALLENGE_PAGE", 1000], ["🙂🙂", 200, "BODY_LIMIT", 4]]) {
    const result = await fetchOpportunitySource("https://www.nist.gov/", { fetchImpl: reply(body, status), maxBytes });
    assert.equal(result.ok, false); assert.equal(result.reason, reason); assert.equal(result.body_sha256, undefined);
  }
});

test("read deadline covers stalled response and stalled body", async () => {
  const never = () => new Promise(() => {});
  const response = await fetchOpportunitySource("https://www.nist.gov/", { fetchImpl: never, timeoutMs: 10 });
  assert.equal(response.reason, "FETCH_OR_TIMEOUT");
  const stream = new ReadableStream({ start() {}, cancel() {} });
  const body = await fetchOpportunitySource("https://www.nist.gov/", { fetchImpl: async () => new Response(stream), timeoutMs: 10 });
  assert.equal(body.reason, "FETCH_OR_TIMEOUT");
});

test("successful body hashes actual UTF8 bytes without retaining text or headers", async () => {
  const body = "public source 🙂";
  const r = await fetchOpportunitySource("https://www.nist.gov/", { fetchImpl: reply(body) });
  const { createHash } = await import("node:crypto");
  assert.equal(r.body_sha256, createHash("sha256").update(Buffer.from(body)).digest("hex"));
  assert.equal(r.bytes, Buffer.byteLength(body)); assert.equal(Object.hasOwn(r, "body"), false);
});

test("first capture is not unchanged; change requires same new hash ten minutes apart", () => {
  const first = opportunityObservation(obs(), ok("a"), at);
  assert.equal(first.state, "FIRST_CAPTURE");
  const pending = opportunityObservation(first, ok("b"), later);
  assert.equal(pending.state, "UNCONFIRMED"); assert.equal(pending.baseline_sha256, "a".repeat(64));
  const tooSoon = opportunityObservation(pending, ok("b"), "2026-11-06T08:09:59.000Z");
  assert.equal(tooSoon.state, "UNCONFIRMED");
  const changed = opportunityObservation(tooSoon, ok("b"), "2026-11-06T08:10:00.000Z");
  assert.equal(changed.state, "CHANGED"); assert.equal(changed.baseline_sha256, "b".repeat(64));
});

test("failed refresh preserves previous successful time/hash and pending confirmation", () => {
  const baseline = opportunityObservation(obs(), ok("a"), at);
  const pending = opportunityObservation(baseline, ok("b"), later);
  const failed = opportunityObservation(pending, { ok: false, status: 403, reason: "HTTP_STATUS" }, "2026-11-06T09:00:00.000Z");
  assert.equal(failed.state, "UNCHECKABLE"); assert.equal(failed.last_success_at, later);
  assert.equal(failed.content_sha256, "b".repeat(64)); assert.equal(failed.baseline_sha256, "a".repeat(64));
  assert.equal(failed.pending_since, pending.pending_since);
  const neverRead = opportunityObservation(obs(), { ok: false, status: 403, reason: "HTTP_STATUS" }, at);
  assert.equal(neverRead.last_success_at, null); assert.equal(neverRead.content_sha256, null);
});

test("hourly execution only reads9 integration URLs and leaves other routes untouched", async () => {
  const value = seed(), before = JSON.stringify(value.routes.find(r => r.route_id === "R05")), called = [];
  const result = await runOpportunityWatch(value, { scope: "integrations", clock: () => "2030-01-01T00:00:00.000Z", fetchImpl: async (url) => { called.push(url); return new Response("official source"); } });
  assert.equal(called.length, 9); assert.equal(result.last_capture.route_count, 4);
  assert.equal(JSON.stringify(result.routes.find(r => r.route_id === "R05")), before);
  assert.equal(result.last_capture.successful, 9); assert.equal(result.last_capture.executor, "LOCAL_READONLY_TRIAL");
  assert.equal(result.last_capture.workflow_run_url, null); assert.equal(result.last_capture.artifact_url, null);
  assert.equal(Object.hasOwn(result, "writes_board"), false); assert.equal(Object.hasOwn(result, "score"), false);
});

test("daily trial reads all54source URLs, binds real run links, and records failures as unknown", async () => {
  const result = await runOpportunityWatch(seed(), { scope: "all", clock: () => "2030-01-01T00:00:00.000Z", workflowRunUrl: "https://github.com/CSOAI-ORG/councilof-ai/actions/runs/123", fetchImpl: reply("denied", 403) });
  assert.equal(result.last_capture.route_count, 29); assert.equal(result.last_capture.source_count, 54);
  assert.equal(result.last_capture.successful, 0); assert.equal(result.last_capture.uncheckable, 54);
  assert.match(result.last_capture.artifact_url, /runs\/123#artifacts$/);
  assert.equal(result.routes.every(r => r.observations.every(o => o.state === "UNCHECKABLE")), true);
});

test("future timestamps and fabricated success metadata are rejected", () => {
  const value = seed(); value.routes[0].observations[0] = opportunityObservation(obs(), ok("a"), "2030-01-01T00:00:00.000Z");
  assert.throws(() => validateOpportunityRegistry(value, at), /REGISTRY_INVALID/);
  value.routes[0].observations[0].last_success_at = null;
  assert.throws(() => validateOpportunityRegistry(value), /REGISTRY_INVALID/);
});

import { mergeOpportunityBaseline } from "./watch-sources.mjs";

test("pending baseline can supply observations but cannot replace reviewed catalogue metadata", () => {
  const current = seed(), previous = seed();
  previous.routes[0].observations[0] = opportunityObservation(obs(), ok("a"), at);
  assert.equal(mergeOpportunityBaseline(current, previous).routes[0].observations[0].state, "FIRST_CAPTURE");
  previous.routes[0].name = "different catalogue";
  assert.throws(() => mergeOpportunityBaseline(current, previous), /METADATA_DIFFERS/);
});

test("valid UTC suffix and fractional variants use chronological time comparisons", () => {
  const value = seed();
  const entry = opportunityObservation(obs(), ok("a"), "2026-11-06T07:00:00.000Z");
  entry.attempted_at = "2026-11-06T07:00:00+00:00";
  entry.last_success_at = "2026-11-06T07:00:00.000Z";
  entry.state = "UNCHECKABLE"; entry.reason = "HTTP_STATUS"; entry.http_status = 403;
  value.routes[0].observations[0] = entry;
  assert.doesNotThrow(() => validateOpportunityRegistry(value));
  entry.last_success_at = "2026-11-06T07:00:00.001Z";
  assert.throws(() => validateOpportunityRegistry(value), /REGISTRY_INVALID/);
});

test("the existing workflow isolates hourly and manual metadata capture from heavy jobs", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/reg-watch.yml", import.meta.url), "utf8");
  const block = (id) => workflow.split("  " + id + ":\n")[1].split(/\n  [a-z][a-z-]*:\n/)[0];
  const guard = (id) => block(id).match(/^    if: \$\{\{ (.*) \}\}$/m)[1];
  const execute = (expression, github, inputs) => Function("github", "inputs", "return Boolean(" + expression + ");")(github, inputs);
  for (const schedule of ["45 6 * * *", "45 0-5,7-23 * * *"]) {
    const event = { event_name: "schedule", event: { schedule } };
    assert.equal(execute(guard("daily-evidence-product"), event, {}), schedule === "45 6 * * *");
    assert.equal(execute(guard("reg-watch"), event, {}), schedule === "45 6 * * *");
    assert.equal(execute(guard("opportunity-source-metadata"), event, {}), true);
  }
  for (const opportunity_only of [false, true]) for (const capture_only of [false, true]) for (const derived_reports_only of [false, true]) {
    const inputs = { opportunity_only, capture_only, derived_reports_only }, event = { event_name: "workflow_dispatch", event: {} };
    assert.equal(execute(guard("daily-evidence-product"), event, inputs), !opportunity_only && !capture_only);
    assert.equal(execute(guard("reg-watch"), event, inputs), !opportunity_only && !capture_only && !derived_reports_only);
    assert.equal(execute(guard("opportunity-source-metadata"), event, inputs), opportunity_only || capture_only);
  }
  assert.doesNotMatch(workflow, /promote_opportunities/);
  assert.doesNotMatch(workflow, /^\s*gh\s+pr\s+(merge|close)\b/m);
  assert.match(workflow, /- cron: "45 0-5,7-23 \* \* \*"/);
  assert.match(workflow, /capture_only:[\s\S]*?default: false/);
  assert.match(workflow, /concurrency:\n      group: opportunity-source-metadata/);
});

test("metadata job is read-only and publication stays with the canonical exact-packet gate and sent log", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/reg-watch.yml", import.meta.url), "utf8");
  const job = workflow.split("  opportunity-source-metadata:\n")[1];
  const readOnly = (value) => {
    assert.match(value, /permissions:\n      contents: read\n/);
    assert.doesNotMatch(value, /contents:\s*write|pull-requests:\s*write|issues:\s*write/);
    assert.doesNotMatch(value, /\bgit\s+push\b|\bgh\s+pr\s+(create|edit|update|merge|close)\b/);
    assert.doesNotMatch(value, /SNAPSHOT_PR_TOKEN|secrets\.|CAPTURE_ONLY|OPPORTUNITY_BRANCH/);
  };
  readOnly(job);
  for (const command of ["git push origin HEAD", "gh pr create", "gh pr edit", "gh pr update", "gh pr merge", "gh pr close"]) {
    assert.throws(() => readOnly(job + "\n        run: " + command + "\n"));
  }
  assert.match(job, /Publication HELD/);
  assert.match(job, /gate the exact captured artifact at 100%/);
  assert.match(job, /existing canonical sent log/);
  assert.match(job, /protected review PR/);
  assert.match(job, /Cross-run change confirmation is not guaranteed/);
  assert.match(job, /actions\/upload-artifact@v4/);
  assert.doesNotMatch(job, /git fetch|git show|git switch|git commit|gh issue/);
});

test("transport absence is unreachable; an HTTP response with unusable bytes is uncheckable", () => {
  assert.equal(opportunityObservation(obs(), { ok: false, status: null, reason: "FETCH_OR_TIMEOUT" }, at).state, "UNREACHABLE");
  assert.equal(opportunityObservation(obs(), { ok: false, status: 200, reason: "FETCH_OR_TIMEOUT" }, at).state, "UNCHECKABLE");
});

test("capture summary must bind all selected URL observations, counts, time window and run provenance", async () => {
  const base = await runOpportunityWatch(seed(), { scope: "integrations", clock: () => "2030-01-01T00:00:00.000Z", fetchImpl: reply("source") });
  for (const mutate of [v => { v.last_capture.source_count = 999; v.last_capture.successful = 999; }, v => { v.routes.find(r => r.route_id === "R07").observations[0] = obs(); }, v => { v.last_capture.started_at = "2030-01-01T00:00:00.001Z"; }, v => { v.last_capture.executor = "GITHUB_ACTIONS"; v.last_capture.workflow_run_url = "https://github.com/CSOAI-ORG/councilof-ai/actions/runs/123"; v.last_capture.artifact_url = v.last_capture.workflow_run_url + "#artifacts"; }]) {
    const value = structuredClone(base); mutate(value);
    assert.throws(() => validateOpportunityRegistry(value), /REGISTRY_INVALID/);
  }
});
