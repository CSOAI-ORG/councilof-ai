import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

const PATH = "/interop/ots/old.ots.invalid";
const BYTES = Buffer.from([0, 255, 1, 2]);
const SHA = createHash("sha256").update(BYTES).digest("hex");

function context(
  requestPath: string,
  {
    method = "GET",
    archive = {
      schema: "csoai.retired-proof-bytes/0.1",
      members: {
        [PATH]: { sha256: SHA, bytes: BYTES.length, body_base64: BYTES.toString("base64") },
      },
    },
    assetStatus = 200,
  }: { method?: string; archive?: unknown; assetStatus?: number } = {},
) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(archive), { status: assetStatus }));
  const next = vi.fn(async () => new Response("active", { status: 200 }));
  const ctx = {
    request: new Request(`https://councilof.ai${requestPath}`, { method }),
    env: { ASSETS: { fetch } },
    next,
  };
  return { ctx, fetch, next };
}

describe("retired proof archive reader", () => {
  it("passes active interop routes through unchanged", async () => {
    const { ctx, fetch, next } = context("/interop/current.json");
    expect((await onRequest(ctx as never)).status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("serves exact retired bytes with an explicit historical state", async () => {
    const { ctx, fetch } = context(PATH);
    const response = await onRequest(ctx as never);
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(BYTES);
    expect(response.headers.get("x-evidence-state")).toBe("retired-or-invalid-historical-bytes");
    expect(response.headers.get("etag")).toBe(`"${SHA}"`);
    expect(new URL(fetch.mock.calls[0][0].url).pathname).toBe("/archive/retired-proof-bytes-v1.json");
  });

  it("supports HEAD without returning the retired bytes", async () => {
    const { ctx } = context(PATH, { method: "HEAD" });
    const response = await onRequest(ctx as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe(String(BYTES.length));
    expect(await response.arrayBuffer()).toHaveProperty("byteLength", 0);
  });

  it("fails closed if the archive is unavailable or a member fails its digest", async () => {
    const unavailable = context(PATH, { assetStatus: 404 });
    expect((await onRequest(unavailable.ctx as never)).status).toBe(503);
    const tampered = context(PATH, {
      archive: {
        schema: "csoai.retired-proof-bytes/0.1",
        members: { [PATH]: { sha256: "0".repeat(64), bytes: BYTES.length, body_base64: BYTES.toString("base64") } },
      },
    });
    expect((await onRequest(tampered.ctx as never)).status).toBe(503);
  });

  it("does not expose unknown or unsafe historical paths", async () => {
    expect((await onRequest(context("/interop/missing.invalid").ctx as never)).status).toBe(404);
    expect((await onRequest(context("/interop/../secret.invalid").ctx as never)).status).toBe(404);
    expect((await onRequest(context(PATH, { method: "POST" }).ctx as never)).status).toBe(405);
  });
});
