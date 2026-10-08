// Synthetic producer responses only. These tests establish consumer behavior,
// not a current ledger read, chain reconciliation or customer outcome.
import { beforeEach, describe, it } from "vitest";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { _resetCache, buildFootprint, getFootprint, REVENUE_MAX_BYTES, TTL_SECONDS, type Deps } from "./footprint";

const OBSERVED = "2026-10-08T01:00:00.000Z";
const fixtureBody = (over: Record<string, unknown> = {}) => ({
  schema: "csoai.revenue/0.1",
  one_number: { id: "distinct_nonself_payers", status: "MEASURED", records_unreadable: 0, all_time: 3, last_30d: 2,
    repeat_nonself_payers: { all_time: 1, last_30d: 0 }, ...over },
});
function fixture(body: unknown = fixtureBody(), status = 200, raw: string = JSON.stringify(body) ?? "") {
  const calls: string[] = [];
  let observed = OBSERVED;
  const deps: Deps = {
    origin: "https://councilof.ai", now: () => observed,
    fetch: (async (input: RequestInfo | URL) => {
      const url = String(input); calls.push(url);
      if (url.endsWith("/api/revenue")) return new Response(raw, { status });
      if (url.endsWith("/api/gspc")) return Response.json({ as_of: OBSERVED, totals: { public_count: 0 } });
      if (url.endsWith("/api/state")) return Response.json({ card_chain: { bodies_verified_valid: { value: 0, as_of: OBSERVED } } });
      if (url.startsWith("https://api.github.com/")) return Response.json({ stargazers_count: 0 });
      throw new Error("Unexpected injected fixture URL: " + url);
    }) as typeof fetch,
  };
  return { deps, calls, raw, setObserved: (value: string) => { observed = value; } };
}
const rows = async (f: ReturnType<typeof fixture>) => {
  const p = await buildFootprint(f.deps);
  return [p.economic_use, p.repeat_payers];
};
beforeEach(_resetCache);

describe("revenue consumer: source identity, unknown states and settlement-only scope", () => {
  it("does not invent producer time from the observation clock", async () => {
    for (const row of await rows(fixture())) {
      assert.equal(row.as_of, null);
      assert.equal(row.source_time_state, "UNPUBLISHED");
      assert.equal(row.checked_at, OBSERVED);
    }
  });
  it("preserves a declared valid producer time without authenticating it", async () => {
    const as_of = "2026-10-07T23:00:00Z";
    for (const row of await rows(fixture({ ...fixtureBody(), as_of }))) {
      assert.equal(row.as_of, as_of);
      assert.equal(row.source_time_state, "DECLARED");
      assert.equal(row.custody_state, "UNQUALIFIED");
    }
  });
  it("rejects a normalized but nonexistent calendar date", async () => {
    for (const row of await rows(fixture({ ...fixtureBody(), as_of: "2026-02-30T12:00:00Z" }))) {
      assert.equal(row.as_of, null);
      assert.equal(row.source_time_state, "INVALID");
    }
  });
  for (const count of [0, 1]) it("reads the published repeat-wallet count " + count, async () => {
    const [, repeat] = await rows(fixture(fixtureBody({ repeat_nonself_payers: { all_time: count, last_30d: 0 } })));
    assert.equal(repeat.state, "READ"); assert.equal(repeat.value, count);
    assert.match(String(repeat.qualification), /no independent.*buyer identity/);
  });
  it("keeps absent repeat measurement unknown rather than zero", async () => {
    const [, repeat] = await rows(fixture(fixtureBody({ repeat_nonself_payers: null })));
    assert.equal(repeat.state, "UNMEASURED"); assert.equal(repeat.value, null);
  });
  for (const status of [401, 403]) it("keeps both denied rows unknown for HTTP " + status, async () => {
    for (const row of await rows(fixture(null, status, "denied"))) {
      assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
      assert.equal(row.as_of, null); assert.equal(row.http_status, status);
    }
  });
  it("cannot promote a producer's non-measured status into a count", async () => {
    for (const status of ["UNMEASURED", "UNCHECKABLE", "UNKNOWN", "PARTIAL"]) {
      for (const row of await rows(fixture(fixtureBody({ status, all_time: 99 })))) {
        assert.notEqual(row.state, "READ"); assert.equal(row.value, null);
      }
    }
  });
  it("rejects malformed distinct-wallet counts", async () => {
    for (const all_time of [-1, 1.5, "3", Number.MAX_SAFE_INTEGER + 1]) {
      const [economic] = await rows(fixture(fixtureBody({ all_time })));
      assert.equal(economic.state, "UNCHECKABLE"); assert.equal(economic.value, null);
    }
  });
  it("rejects repeats exceeding distinct wallets in the same snapshot", async () => {
    const [, repeat] = await rows(fixture(fixtureBody({ repeat_nonself_payers: { all_time: 4, last_30d: 0 } })));
    assert.equal(repeat.state, "UNCHECKABLE"); assert.equal(repeat.value, null);
  });
  it("withholds impossible windows while retaining valid all-time observations", async () => {
    const [economic, repeat] = await rows(fixture(fixtureBody({ last_30d: 4, repeat_nonself_payers: { all_time: 1, last_30d: 2 } })));
    assert.equal(economic.value, 3); assert.equal(repeat.value, 1);
    for (const row of [economic, repeat]) {
      assert.equal(row.last_30d, null); assert.equal(row.last_30d_state, "INVALID");
    }
  });
  it("withholds repeat wallets exceeding the published active wallets in the same 30-day window", async () => {
    const [economic, repeat] = await rows(fixture(fixtureBody({ all_time: 3, last_30d: 0, repeat_nonself_payers: { all_time: 1, last_30d: 1 } })));
    assert.equal(economic.last_30d, 0);
    assert.equal(repeat.state, "READ"); assert.equal(repeat.value, 1);
    assert.equal(repeat.last_30d, null); assert.equal(repeat.last_30d_state, "INVALID");
  });
  it("binds both rows to one exact response body without reserializing it", async () => {
    const f = fixture(undefined, 200, JSON.stringify(fixtureBody(), null, 2) + "\n");
    const digest = createHash("sha256").update(f.raw).digest("hex");
    for (const row of await rows(f)) assert.equal(row.source_body_sha256, digest);
    assert.equal(f.calls.filter(url => url.endsWith("/api/revenue")).length, 1);
  });
  it("does not refresh source observation time or fingerprint on a cache hit", async () => {
    const f = fixture();
    const first = await getFootprint(f.deps, 0);
    f.setObserved("2026-10-08T02:00:00.000Z");
    const hit = await getFootprint(f.deps, TTL_SECONDS * 1000 - 1);
    assert.equal(hit.cache, "HIT");
    assert.equal(hit.payload.economic_use.checked_at, OBSERVED);
    assert.equal(hit.payload.economic_use.source_body_sha256, first.payload.economic_use.source_body_sha256);
    assert.equal(f.calls.filter(url => url.endsWith("/api/revenue")).length, 1);
    const refreshed = await getFootprint(f.deps, TTL_SECONDS * 1000 + 1);
    assert.equal(refreshed.cache, "MISS");
    assert.equal(refreshed.payload.economic_use.checked_at, "2026-10-08T02:00:00.000Z");
    assert.equal(f.calls.filter(url => url.endsWith("/api/revenue")).length, 2);
  });
  it("keeps invalid JSON and wrong body shapes uncheckable", async () => {
    for (const f of [fixture(null, 200, "{not json"), fixture([])]) {
      for (const row of await rows(f)) {
        assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
      }
    }
  });
  it("requires the published producer schema and count identity", async () => {
    for (const body of [
      { ...fixtureBody(), schema: undefined },
      { ...fixtureBody(), schema: "csoai.revenue/0.2" },
      fixtureBody({ id: undefined }),
      fixtureBody({ id: "independent_customers" }),
      { schema: "csoai.revenue/0.1", one_number: [] },
    ]) for (const row of await rows(fixture(body))) {
      assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
    }
  });
  for (const count of [0, 3]) it("reads the measured distinct-wallet count " + count + " with readable coverage", async () => {
    const [economic] = await rows(fixture(fixtureBody({ all_time: count, last_30d: 0,
      repeat_nonself_payers: { all_time: 0, last_30d: 0 } })));
    assert.equal(economic.state, "READ"); assert.equal(economic.value, count);
    assert.match(String(economic.unit), /wallets/);
    assert.equal(economic.records_unreadable, 0);
  });
  it("withholds all counts if settlement records are unreadable, including apparent zeros", async () => {
    for (const all_time of [0, 3]) for (const row of await rows(fixture(fixtureBody({ records_unreadable: 1,
      all_time, last_30d: 0, repeat_nonself_payers: { all_time: 0, last_30d: 0 } })))) {
      assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
      assert.match(String(row.reason), /unreadable settlement records/);
    }
  });
  it("keeps absent or invalid record coverage unknown", async () => {
    for (const records_unreadable of [undefined, null, -1, 0.5, "0", Number.MAX_SAFE_INTEGER + 1]) {
      for (const row of await rows(fixture(fixtureBody({ records_unreadable })))) {
        assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
      }
    }
  });
  it("withholds repeat windows whose matching distinct-wallet window cannot be checked", async () => {
    for (const last_30d of [undefined, null, -1, 4, "2"]) {
      const [economic, repeat] = await rows(fixture(fixtureBody({ last_30d,
        repeat_nonself_payers: { all_time: 1, last_30d: 0 } })));
      assert.equal(economic.value, 3); assert.equal(economic.last_30d, null);
      assert.equal(repeat.value, 1); assert.equal(repeat.last_30d, null);
      assert.equal(repeat.last_30d_state, "UNCHECKABLE");
    }
  });
  it("retains valid all-time counts when recent measurement is unpublished", async () => {
    const [economic, repeat] = await rows(fixture(fixtureBody({ last_30d: undefined,
      repeat_nonself_payers: { all_time: 1, last_30d: undefined } })));
    assert.equal(economic.value, 3); assert.equal(repeat.value, 1);
    for (const row of [economic, repeat]) {
      assert.equal(row.state, "READ"); assert.equal(row.last_30d, null);
      assert.equal(row.last_30d_state, "UNPUBLISHED");
    }
  });
  it("rejects malformed repeat counts without substituting zero", async () => {
    for (const all_time of [-1, 0.5, "0", Number.MAX_SAFE_INTEGER + 1]) {
      const [, repeat] = await rows(fixture(fixtureBody({ repeat_nonself_payers: { all_time, last_30d: 0 } })));
      assert.equal(repeat.state, "UNCHECKABLE"); assert.equal(repeat.value, null);
    }
  });
  it("rejects an oversized producer response before retaining an unbounded body", async () => {
    for (const row of await rows(fixture(null, 200, " ".repeat(REVENUE_MAX_BYTES + 1)))) {
      assert.equal(row.state, "UNCHECKABLE"); assert.equal(row.value, null);
      assert.equal(row.source_body_sha256, null);
      assert.match(String(row.reason), /byte cap/);
    }
  });
});
