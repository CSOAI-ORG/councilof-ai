import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost, SKILL_IDS } from "./a2a";

function request(input: unknown, id = "axis-1") {
  return new Request("https://councilof.ai/api/a2a", {
    method: "POST",
    headers: { "content-type": "application/json", "a2a-version": "1.0" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "SendMessage",
      params: { message: { messageId: "m-1", role: "ROLE_USER", parts: [{ data: { skill: "axis-specialist", input } }] } },
    }),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("A2A axis-specialist", () => {
  it("is declared and serves the full index without network access", async () => {
    expect(SKILL_IDS).toContain("axis-specialist");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await onRequestPost({ request: request({}) } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    const data = body.result.message.parts[1].data;
    expect(data.state).toBe("INDEX_UNSIGNED");
    expect(data.payload.specialists).toHaveLength(33);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["governance", "effect-binding", "serving-fidelity"])("routes %s to its own specialist", async (axis) => {
    const response = await onRequestPost({ request: request({ axis }) } as any);
    const body = await response.json();
    const data = body.result.message.parts[1].data;
    expect(data.payload.axis).toBe(axis);
    expect(data.payload.specialist.cluster_id).toBe(`meok-axis-${axis}`);
    expect(data.payload.human_gate.decision).toBe("HOLD");
    expect(data.payload.human_gate.may_apply).toBe(false);
  });

  it.each([
    [{ axis: "not-an-axis" }, "unknown axis"],
    [{ axis: "governance", apply: true }, "accepts only optional axis"],
    [{ axis: 33 }, "exact kebab-case"],
  ])("refuses invalid input without invoking a source", async (input, reason) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await onRequestPost({ request: request(input) } as any);
    const body = await response.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
    expect(body.error.message).toContain(reason);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
