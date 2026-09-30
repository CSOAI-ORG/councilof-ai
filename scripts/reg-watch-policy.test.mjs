import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { assessFingerprint, fetchOk, EMPTY_SHA256, CONFIRM_MIN_GAP_MS } from "./reg-watch-policy.mjs";

const at = "2026-09-12T12:00:00Z";
const later = (iso, ms) => new Date(Date.parse(iso) + ms).toISOString();
const base = {
  method: "body",
  last_modified: "",
  etag: "",
  body_sha256: "a".repeat(64),
  first_seen: "2026-09-01T00:00:00Z",
  checked: "2026-09-11T00:00:00Z",
};

test("unchanged Last-Modified suppresses body rendering churn", () => {
  const previous = { ...base, last_modified: "Thu, 03 Sep 2026 16:52:26 GMT" };
  const current = { ...previous, body_sha256: "b".repeat(64) };
  const result = assessFingerprint(previous, current, at);
  expect(result.changed).toBe(false);
  expect(result.basis).toBe("last-modified-stable");
});

test("first body-only drift is held as UNCONFIRMED, baseline kept", () => {
  const current = { ...base, body_sha256: "b".repeat(64) };
  const result = assessFingerprint(base, current, at);
  expect(result.changed).toBe(false);
  expect(result.state).toBe("UNCONFIRMED");
  expect(result.next.body_sha256).toBe(base.body_sha256);
  expect(result.next.pending_body_sha256).toBe(current.body_sha256);
  expect(result.next.pending_first_seen).toBe(at);
});

test("the same candidate on a fetch >= 10 minutes later confirms a change", () => {
  const candidate = "b".repeat(64);
  const previous = { ...base, pending_body_sha256: candidate, pending_first_seen: at, pending_seen: 1 };
  const result = assessFingerprint(previous, { ...base, body_sha256: candidate }, later(at, CONFIRM_MIN_GAP_MS));
  expect(result.changed).toBe(true);
  expect(result.state).toBe("CHANGED");
  expect(result.confirmations).toBe(2);
  expect(result.next.body_sha256).toBe(candidate);
  expect("pending_body_sha256" in result.next).toBe(false);
});

test("the same candidate seen again under 10 minutes stays UNCONFIRMED and keeps its first-seen clock", () => {
  const candidate = "b".repeat(64);
  const previous = { ...base, pending_body_sha256: candidate, pending_first_seen: at, pending_seen: 1 };
  const result = assessFingerprint(previous, { ...base, body_sha256: candidate }, later(at, CONFIRM_MIN_GAP_MS - 1000));
  expect(result.changed).toBe(false);
  expect(result.state).toBe("UNCONFIRMED");
  expect(result.next.pending_first_seen).toBe(at);
  expect(result.next.pending_seen).toBe(2);
});

test("a Last-Modified change also needs two fetches", () => {
  const previous = { ...base, last_modified: "Thu, 03 Sep 2026 16:52:26 GMT" };
  const current = { ...previous, last_modified: "Fri, 04 Sep 2026 09:00:00 GMT" };
  const r1 = assessFingerprint(previous, current, at);
  expect(r1.changed).toBe(false);
  const r2 = assessFingerprint(r1.next, current, later(at, CONFIRM_MIN_GAP_MS));
  expect(r2.changed).toBe(true);
  expect(r2.next.last_modified).toBe(current.last_modified);
});

test("a different second candidate stays pending", () => {
  const previous = { ...base, pending_body_sha256: "b".repeat(64), pending_first_seen: at, pending_seen: 1 };
  const current = { ...base, body_sha256: "c".repeat(64) };
  const result = assessFingerprint(previous, current, later(at, 86400000));
  expect(result.changed).toBe(false);
  expect(result.next.pending_body_sha256).toBe(current.body_sha256);
});

test("a body that returns to baseline clears the pending candidate", () => {
  const previous = { ...base, pending_body_sha256: "b".repeat(64), pending_first_seen: at, pending_seen: 1 };
  const result = assessFingerprint(previous, base, later(at, 86400000));
  expect(result.changed).toBe(false);
  expect("pending_body_sha256" in result.next).toBe(false);
});

test("an empty body is FETCH_FAILED: never a change, never a candidate, baseline and pending kept", () => {
  const previous = { ...base, pending_body_sha256: "b".repeat(64), pending_first_seen: at, pending_seen: 1 };
  const result = assessFingerprint(previous, { ...base, body_sha256: EMPTY_SHA256 }, later(at, 86400000));
  expect(result.changed).toBe(false);
  expect(result.state).toBe("FETCH_FAILED");
  expect(result.next.body_sha256).toBe(base.body_sha256);
  expect(result.next.pending_body_sha256).toBe("b".repeat(64));
});

test("a legacy empty-body pending candidate (reg-watch-state.json, 14 Sep) can never confirm", () => {
  const previous = { ...base, pending_body_sha256: EMPTY_SHA256, pending_first_seen: at, pending_seen: 1 };
  const r = assessFingerprint(previous, { ...base, body_sha256: EMPTY_SHA256 }, later(at, 86400000));
  expect(r.changed).toBe(false);
  expect(r.state).toBe("FETCH_FAILED");
});

test("fetch_ok: 2xx, non-empty, not the empty-string hash", () => {
  expect(fetchOk({ status: 200, bodyLength: 10, bodySha256: "a".repeat(64) })).toBe(true);
  expect(fetchOk({ status: 206, bodyLength: 10, bodySha256: "a".repeat(64) })).toBe(true);
  expect(fetchOk({ status: 200, bodyLength: 0, bodySha256: EMPTY_SHA256 })).toBe(false);
  expect(fetchOk({ status: 200, bodyLength: 10, bodySha256: EMPTY_SHA256 })).toBe(false);
  expect(fetchOk({ status: 304, bodyLength: 10, bodySha256: "a".repeat(64) })).toBe(false);
  expect(fetchOk({ status: 503, bodyLength: 10, bodySha256: "a".repeat(64) })).toBe(false);
});

test("harness-router change-detection fixtures (61): false-change rate 0, miss rate 0, unknowns never flagged", () => {
  const fx = JSON.parse(
    readFileSync(new URL("./watch/fixtures/harness-router-20260929/change_detect.json", import.meta.url), "utf8"),
  );
  const ok = (h) => Boolean(h) && h !== EMPTY_SHA256;
  const t0 = "2026-09-29T00:00:00Z";
  const fp = [];
  const miss = [];
  const unk = [];
  const n = { no_change: 0, change: 0, unknown: 0 };
  for (const c of fx) {
    n[c.truth]++;
    const baseline = ok(c.prev) ? c.prev : c.last_good;
    let flagged = false;
    if (baseline) {
      const s0 = { ...base, body_sha256: baseline };
      const r1 = assessFingerprint(s0, { ...base, body_sha256: c.cur }, t0);
      flagged = r1.changed;
      if (c.confirm != null) {
        const r2 = assessFingerprint(r1.next, { ...base, body_sha256: c.confirm }, later(t0, CONFIRM_MIN_GAP_MS));
        flagged = flagged || r2.changed;
      }
    }
    if (c.truth === "no_change" && flagged) fp.push(c.id);
    if (c.truth === "change" && !flagged) miss.push(c.id);
    if (c.truth === "unknown" && flagged) unk.push(c.id);
  }
  expect(n).toEqual({ no_change: 29, change: 10, unknown: 22 });
  expect(fp).toEqual([]);
  expect(miss).toEqual([]);
  expect(unk).toEqual([]);
});
