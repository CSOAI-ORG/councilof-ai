import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./_chatGrounded";

const BOARD = {
  axes: [
    {
      axis: "governance",
      family: "gspc",
      kind: "model-comparison",
      status: "MEASURED",
      n: 32,
      accuracy: 0.75,
    },
    {
      axis: "provenance-controls",
      family: "financial",
      kind: "deterministic-facts",
      status: "MEASURED",
      n: 6,
      accuracy: null,
    },
  ],
  totals: {
    axes: 2,
    measured_axes: 2,
    unmeasured_axes: 0,
    public_count: "2 axis · 2 measured",
  },
  jail_floor: null,
};

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/chat evidence-state definitions", () => {
  it("grounds 'What does measured mean?' without promoting it to compliance or a signature", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(BOARD, {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("https://councilof.ai/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "What does measured mean?" },
        ],
      }),
    });
    const response = await onRequestPost({
      request,
      env: {},
    } as Parameters<typeof onRequestPost>[0]);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.state).toBe("grounded");
    expect(body.signature).toBeNull();
    expect(body.model).toBeNull();
    expect(body.answer).toMatch(/admitted measurement cell/i);
    expect(body.answer).toContain("2 axis · 2 measured");
    expect(body.answer).toMatch(/does not mean safe, compliant, approved or certified/i);
    expect(body.answer).toMatch(/Signing and anchoring are separate evidence states/i);
    expect(fetchMock).toHaveBeenCalledWith("https://councilof.ai/api/gspc");
  });
});
