import { describe, expect, it, vi } from "vitest";
import { evidenceHandoffRequest, submitEvidenceHandoff } from "./CouncilEvidenceDeliveryPane";

function handoff() {
  return {
    schema: "council-os.a2a-evidence-handoff/1.1",
    handoff_state: "PREPARED_NOT_SUBMITTED",
    transport: { endpoint: "https://untrusted.example/must-not-be-used" },
    request: {
      jsonrpc: "2.0",
      id: "receipt-1",
      method: "SendMessage",
      params: { message: { messageId: "m-1", role: "ROLE_USER", parts: [{ data: { skill: "evidence-delivery", input: { draft: { schema: "server-revalidates-this" } } } }] } },
    },
  };
}

describe("Council Evidence Delivery host bridge", () => {
  it("accepts only the prepared Evidence Delivery SendMessage shape", () => {
    expect(evidenceHandoffRequest(handoff())).toEqual(handoff().request);
    for (const payload of [null, {}, { ...handoff(), handoff_state: "SUBMITTED" }]) {
      expect(() => evidenceHandoffRequest(payload)).toThrow();
    }
    const wrongSkill = handoff();
    (wrongSkill.request.params.message.parts[0].data as any).skill = "gspc-board";
    expect(() => evidenceHandoffRequest(wrongSkill)).toThrow("Evidence Delivery");
  });

  it("submits only to same-origin /api/a2a, without credentials, after the host action", async () => {
    const fetcher = vi.fn(async () => Response.json({
      jsonrpc: "2.0", id: "receipt-1",
      result: { message: { messageId: "reply-1", role: "ROLE_AGENT", parts: [{ text: "received" }, { data: { receipt_id: "receipt-1", signed: false } }] } },
    }));
    const message = await submitEvidenceHandoff(handoff(), fetcher as unknown as typeof fetch);
    expect(message.messageId).toBe("reply-1");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/a2a");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("omit");
    expect(init?.headers).toEqual({ "content-type": "application/json", "a2a-version": "1.0" });
    expect(JSON.parse(String(init?.body))).toEqual(handoff().request);
  });

  it("surfaces a JSON-RPC validation error instead of claiming delivery", async () => {
    const fetcher = vi.fn(async () => Response.json({ jsonrpc: "2.0", id: "receipt-1", error: { code: -32602, message: "Named MEOK H.I.M. review is required" } }));
    await expect(submitEvidenceHandoff(handoff(), fetcher as unknown as typeof fetch)).rejects.toThrow("Named MEOK H.I.M.");
  });
});
