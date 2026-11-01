import { afterEach, describe, expect, it, vi } from "vitest";
import { evidenceDeliveryInput } from "../_lib/__fixtures__/evidenceDelivery";
import { A2A_ERROR, SKILL_IDS, onRequestGet, onRequestPost } from "./a2a";

async function call(input: unknown, legacy = false) {
  const dataPart = { skill: "evidence-delivery", input };
  const request = new Request("https://councilof.ai/api/a2a", {
    method: "POST",
    headers: legacy ? { "content-type": "application/json" } : { "content-type": "application/json", "a2a-version": "1.0" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "evidence-1",
      method: legacy ? "message/send" : "SendMessage",
      params: { message: {
        messageId: "m-evidence-1",
        contextId: "ctx-evidence-1",
        role: legacy ? "user" : "ROLE_USER",
        ...(legacy ? { kind: "message" } : {}),
        parts: [legacy ? { kind: "data", data: dataPart } : { data: dataPart, mediaType: "application/json" }],
      } },
    }),
  });
  const response = await onRequestPost({ request } as never);
  return { response, body: await response.json() as any };
}

afterEach(() => vi.unstubAllGlobals());

describe("A2A evidence-delivery", () => {
  it("is on the derived contract and returns a Message without fetching another source", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(SKILL_IDS).toContain("evidence-delivery");
    const contract = await onRequestGet({ request: new Request("https://councilof.ai/api/a2a") } as never);
    expect((await contract.json() as any).skills).toContain("evidence-delivery");

    const { response, body } = await call(evidenceDeliveryInput());
    expect(response.status).toBe(200);
    expect(body.error).toBeUndefined();
    expect(body.result.message).toMatchObject({ contextId: "ctx-evidence-1", role: "ROLE_AGENT" });
    expect(body.result.message.parts[1].data).toMatchObject({
      receipt_id: evidenceDeliveryInput().draft.receipt_id,
      council_measurement_performed: false,
      source_digest_recomputed: false,
      signed: false,
      anchored: false,
      adapter_storage_performed: false,
    });
    expect(body.result).not.toHaveProperty("task");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves the same skill through the A2A 0.3 compatibility shape", async () => {
    const { response, body } = await call(evidenceDeliveryInput(), true);
    expect(response.headers.get("a2a-version")).toBe("0.3");
    expect(body.error).toBeUndefined();
    expect(body.result).toMatchObject({ kind: "message", role: "agent", contextId: "ctx-evidence-1" });
    expect(body.result.parts[1].data.schema).toBe("council-os.evidence-delivery-result/1.0");
  });

  it("fails closed before delivery when review or negative-control evidence is invalid", async () => {
    const missingReview = evidenceDeliveryInput();
    missingReview.draft.meok_him.reviewer = "";
    const sameDigest = evidenceDeliveryInput();
    sameDigest.draft.evidence.negative_control_sha256 = sameDigest.draft.evidence.input_sha256;
    for (const input of [missingReview, sameDigest, {}, { draft: null }]) {
      const { body } = await call(input);
      expect(body.result).toBeUndefined();
      expect(body.error.code).toBe(A2A_ERROR.INVALID_PARAMS);
      expect(body.error.data[0].reason).toBe("INVALID_SKILL_INPUT");
      expect(body.error.data[0].metadata.skill).toBe("evidence-delivery");
    }
  });
});
