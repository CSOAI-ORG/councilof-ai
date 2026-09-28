import { describe, expect, it, vi } from "vitest";
import { buildBodyState, onRequestGet } from "./body-state";

describe("/api/body-state retired GitHub observer", () => {
  it("does not query GitHub or manufacture current stage timestamps", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("retired source must not be queried");
    });
    try {
      const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0]);
      const body = await response.json() as ReturnType<typeof buildBodyState>;
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(fetcher).not.toHaveBeenCalled();
      expect(body.status).toBe("SOURCE_RETIRED");
      expect(body.total).toBeNull();
      expect(body.stages).toEqual([]);
      expect(body.former_source).toMatchObject({
        last_run_at: null, last_success_at: null, last_failure_at: null,
      });
      expect("as_of" in body).toBe(false);
      expect(body.current_observability.worker).toBe("/api/worker");
      expect(body.current_observability.limitation).toContain("not a replacement");
    } finally {
      fetcher.mockRestore();
    }
  });

  it("reports the retired source without claiming the RunPod worker or signing is healthy", () => {
    const body = buildBodyState();
    expect(body.former_source.state).toBe("NOT_A_CURRENT_OPERATIONS_SOURCE");
    expect(body.honesty).toContain("does not mean no jobs are running");
    expect(JSON.stringify(body)).not.toMatch(/"status":\s*"LIVE"|"state":\s*"ok"/);
  });
});
