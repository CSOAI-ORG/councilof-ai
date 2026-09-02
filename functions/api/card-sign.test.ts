import { describe, expect, it } from "vitest";

import { canonicalCardBody, onRequestPost } from "./card-sign";

describe("measurement-card signer boundary", () => {
  it("uses the same compact key ordering and literal unicode as JCS card v2", () => {
    expect(canonicalCardBody({ z: 0.0, a: "Council · AI" }))
      .toBe('{"a":"Council · AI","z":0}');
  });

  it("rejects callers without GitHub OIDC before touching a signing key", async () => {
    const response = await onRequestPost({
      request: new Request("https://councilof.ai/api/card-sign", {
        method: "POST",
        body: JSON.stringify({ payload: { axis: "gspc-governance" } }),
      }),
      env: {},
    } as never);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "unauthorized" });
  });
});
