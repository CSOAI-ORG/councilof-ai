import { describe, expect, it } from "vitest";
import { REGULATION_FEED, onRequestGet } from "./regulation";

describe("GET /api/regulation", () => {
  it("serves the bounded cited deadline register and no generic write surface", async () => {
    const response = await onRequestGet({ env: {} } as never);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.schema).toBe("csoai.regulation-deadlines/0.1");
    expect(body.scope_note).toContain("not a determination");
    expect(body.deadlines).toHaveLength(20);
    expect(body).not.toHaveProperty("received");
    expect(body).not.toHaveProperty("signature");
    expect(REGULATION_FEED.deadlines.every((item) => item.basis)).toBe(true);
  });

  it("surfaces a configured-but-invalid signing key without a fake signature", async () => {
    const response = await onRequestGet({
      env: { BOARD_SIGN_KEY_PKCS8_B64: "not-base64-key-material" },
    } as never);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.signature).toEqual({
      error: "signing key present but unusable — no signature was emitted",
    });
  });
});
