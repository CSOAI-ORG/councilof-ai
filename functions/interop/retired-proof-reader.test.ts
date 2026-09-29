import { describe, expect, it } from "vitest";
import { createHash, webcrypto } from "node:crypto";
import { eligible, exactHistoricalResponse } from "./[[path]]";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const make = (path = "/interop/old-proof.ots.invalid", body = Buffer.from([0, 255, 1, 2])) => ({
  schema: "csoai.retired-proof-bytes/0.1",
  members: {
    [path]: {
      sha256: createHash("sha256").update(body).digest("hex"),
      bytes: body.length,
      body_base64: body.toString("base64"),
    },
  },
});

describe("retired proof reader", () => {
  it("admits only bounded interop .invalid URLs", () => {
    expect(eligible("/interop/a/b.invalid")).toBe(true);
    expect(eligible("/interop/../secret.invalid")).toBe(false);
    expect(eligible("/cards/a.invalid")).toBe(false);
    expect(eligible("/interop/live.json")).toBe(false);
  });

  it("restores exact bytes and labels them historical-invalid", async () => {
    const path = "/interop/old-proof.ots.invalid";
    const body = Buffer.from([0, 255, 1, 2]);
    const response = await exactHistoricalResponse(new Request("https://councilof.ai" + path), make(path, body));
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(body);
    expect(response.headers.get("x-csoai-evidence-state")).toBe("HISTORICAL_INVALID_NOT_A_VALID_PROOF");
    expect(response.headers.get("x-csoai-content-sha256")).toBe(createHash("sha256").update(body).digest("hex"));
  });

  it("fails closed on digest tampering", async () => {
    const archive = make();
    (archive.members["/interop/old-proof.ots.invalid"] as any).sha256 = "0".repeat(64);
    const response = await exactHistoricalResponse(new Request("https://councilof.ai/interop/old-proof.ots.invalid"), archive);
    expect(response.status).toBe(503);
  });

  it("HEAD returns no body while keeping the digest", async () => {
    const path = "/interop/old-proof.ots.invalid";
    const response = await exactHistoricalResponse(new Request("https://councilof.ai" + path, { method: "HEAD" }), make(path));
    expect(response.status).toBe(200);
    expect((await response.arrayBuffer()).byteLength).toBe(0);
    expect(response.headers.get("x-csoai-content-sha256")).toMatch(/^[a-f0-9]{64}$/);
  });
});
