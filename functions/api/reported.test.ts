import { describe, expect, it } from "vitest";
import { onRequestGet } from "./reported";

/* Regression for the 2026-09-04 deploy outage. This endpoint returned 200 with no `entries`
 * key, /insurers refused the payload and rendered "REPORTED fetch failed: …", and the
 * prerender guard correctly refused to ship a page containing that string — blocking the
 * deploy of eight merged PRs. An empty array is a kept promise; a missing key is a broken one. */

const call = () =>
  onRequestGet({
    request: new Request("https://councilof.ai/api/reported"),
    env: {},
    params: {},
  } as never);

describe("/api/reported honours its own contract", () => {
  it("always returns an entries array, even when empty", async () => {
    const body = (await (await call()).json()) as Record<string, unknown>;
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.count).toBe((body.entries as unknown[]).length);
  });

  it("does not claim to fetch a source it never reads", async () => {
    const body = (await (await call()).json()) as Record<string, unknown>;
    const note = String(body.note ?? "");
    expect(note).not.toMatch(/live data fetched/i);
    // /api/corrections is a different ledger with a different row shape; naming it as this
    // endpoint's source is what made the original stub look wired when it was not.
    expect(body.source).toBeUndefined();
  });

  it("satisfies the shape the page validates before rendering", async () => {
    // Exactly the check in client/src/pages/Insurers.tsx.
    const d = (await (await call()).json()) as { entries?: unknown };
    expect(!d || !Array.isArray(d.entries)).toBe(false);
  });
});
