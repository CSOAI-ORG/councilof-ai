import { describe, expect, it } from "vitest";
import { buildFixProposal, onRequestGet, onRequestPost } from "./agentic-fix";

describe("agentic fix proposal boundary", () => {
  it("never turns a request into a queue claim", () => {
    expect(
      buildFixProposal({
        problem_id: "brand-gate::index",
        kind: "brand-gate",
        auto: false,
      }),
    ).toMatchObject({
      state: "PROPOSAL_ONLY",
      executed: false,
      queued: false,
      requested_scope: "specific",
    });
  });

  it("advertises the missing execution controls", async () => {
    const response = await onRequestGet({} as never);
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      state: "PROPOSAL_ONLY",
      writes: false,
      queue_bound: false,
      worker_bound: false,
    });
  });

  it("fails closed instead of returning a fake 202", async () => {
    const response = await onRequestPost({
      request: new Request("https://councilof.ai/api/agentic-fix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auto: true }),
      }),
    } as never);
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(501);
    expect(body).toMatchObject({
      state: "EXECUTION_UNAVAILABLE",
      executed: false,
      queued: false,
    });
  });
});
