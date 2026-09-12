import { expect, test } from "vitest";
import { assessFingerprint } from "./reg-watch-policy.mjs";

const at = "2026-09-12T12:00:00Z";
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
  expect(result.basis).toBe("last-modified");
});

test("first body-only drift is held as a candidate", () => {
  const current = { ...base, body_sha256: "b".repeat(64) };
  const result = assessFingerprint(base, current, at);
  expect(result.changed).toBe(false);
  expect(result.basis).toBe("body-candidate-pending-confirmation");
  expect(result.next.body_sha256).toBe(base.body_sha256);
  expect(result.next.pending_body_sha256).toBe(current.body_sha256);
});

test("the same body-only candidate on the next run confirms a change", () => {
  const candidate = "b".repeat(64);
  const previous = { ...base, pending_body_sha256: candidate, pending_seen: 1 };
  const current = { ...base, body_sha256: candidate };
  const result = assessFingerprint(previous, current, at);
  expect(result.changed).toBe(true);
  expect(result.basis).toBe("body-two-consecutive-observations");
  expect(result.next.body_sha256).toBe(candidate);
  expect("pending_body_sha256" in result.next).toBe(false);
});

test("a different second body candidate stays pending", () => {
  const previous = { ...base, pending_body_sha256: "b".repeat(64), pending_seen: 1 };
  const current = { ...base, body_sha256: "c".repeat(64) };
  const result = assessFingerprint(previous, current, at);
  expect(result.changed).toBe(false);
  expect(result.next.pending_body_sha256).toBe(current.body_sha256);
});

test("a body that returns to baseline clears the pending candidate", () => {
  const previous = { ...base, pending_body_sha256: "b".repeat(64), pending_seen: 1 };
  const result = assessFingerprint(previous, base, at);
  expect(result.changed).toBe(false);
  expect("pending_body_sha256" in result.next).toBe(false);
});
