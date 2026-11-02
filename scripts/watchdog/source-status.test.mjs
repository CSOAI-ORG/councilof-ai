import test from "node:test";
import assert from "node:assert/strict";
import registry from "../../data/watchdog/source-registry.json" with { type: "json" };
import { checkSource, createStatus, stateForHttp, validRegistry } from "./source-status.mjs";

test("registry inventories distinct source roles and keeps ingestion disabled", () => {
  assert.equal(validRegistry(registry), true);
  assert.equal(new Set(registry.sources.map((source) => source.id)).size, registry.sources.length);
  assert.ok(registry.sources.some((source) => source.id === "aiid"));
  assert.ok(registry.sources.some((source) => source.id === "oecd-aim"));
  assert.ok(registry.sources.some((source) => source.id === "aiaaic"));
  assert.ok(registry.sources.some((source) => source.id === "avid"));
  assert.ok(registry.sources.some((source) => source.id === "mitre-atlas"));
  assert.ok(registry.sources.some((source) => source.id === "eu-ai-act-serious-incident-channel" && !source.watch));
  assert.equal(registry.controls.fetch_incident_records, false);
  assert.equal(registry.controls.writes_gspc, false);
});

test("HTTP status is described as endpoint reachability, not incident state", () => {
  assert.equal(stateForHttp(200), "REACHABLE");
  assert.equal(stateForHttp(302), "REDIRECTED");
  assert.equal(stateForHttp(403), "ACCESS_LIMITED");
  assert.equal(stateForHttp(404), "NOT_FOUND");
  assert.equal(stateForHttp(405), "METHOD_UNSUPPORTED");
  assert.equal(stateForHttp(503), "UNAVAILABLE");
});

test("every monitored source receives a HEAD request and the snapshot stores only status metadata", async () => {
  const calls = [];
  const result = await createStatus({
    observedAt: "2026-10-31T12:00:00.000Z",
    fetchImpl: async (url, init) => {
      calls.push({ url, method: init.method, redirect: init.redirect });
      return new Response(null, { status: 200 });
    }
  });
  const watched = registry.sources.filter((source) => source.watch);
  assert.equal(calls.length, watched.length);
  assert.ok(calls.every((call) => call.method === "HEAD" && call.redirect === "manual"));
  assert.equal(result.schema, "csoai.watchdog-source-status/0.1");
  assert.equal(result.collection_scope, "SOURCE_PAGE_METADATA_ONLY");
  assert.equal(result.summary.registered_sources, registry.sources.length);
  assert.equal(result.summary.monitored_sources, watched.length);
  assert.equal(result.summary.reachable_source_pages, watched.length);
  assert.equal(result.sources.find((item) => item.id === "eu-ai-act-serious-incident-channel").state, "NOT_MONITORED");
  assert.equal("incident_records" in result, false);
  assert.equal("body" in result.sources[0], false);
  assert.equal(result.controls.download_snapshots, false);
  assert.equal(result.controls.automatic_action, false);
  assert.equal(result.controls.writes_gspc, false);
});

test("network failure is recorded as unreachable without leaking a URL or error message", async () => {
  const source = registry.sources.find((item) => item.id === "aiid");
  const result = await checkSource(source, async () => { throw new Error("private detail https://secret.invalid/path"); }, "2026-10-31T12:00:00.000Z");
  assert.equal(result.state, "UNREACHABLE");
  assert.equal(result.error_code, "Error");
  assert.equal(JSON.stringify(result).includes("secret.invalid"), false);
});

test("the monitor refuses registry URLs with credentials, query strings, fragments, or unsafe controls", () => {
  const withQuery = structuredClone(registry);
  withQuery.sources[0].url += "?export=all";
  assert.equal(validRegistry(withQuery), false);
  const unsafe = structuredClone(registry);
  unsafe.controls.writes_gspc = true;
  assert.equal(validRegistry(unsafe), false);
  const enabled = structuredClone(registry);
  enabled.sources[0].ingestion_enabled = true;
  assert.equal(validRegistry(enabled), false);
});

test("unwatched legal reporting channels are never contacted", async () => {
  let called = false;
  const source = registry.sources.find((item) => !item.watch);
  const result = await checkSource(source, async () => { called = true; return new Response(null, { status: 200 }); });
  assert.equal(called, false);
  assert.equal(result.state, "NOT_MONITORED");
  assert.equal(result.http_status, null);
  assert.equal(result.checked_at, null);
});
