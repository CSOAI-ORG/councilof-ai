import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { MIRROR_SERVED_PREFIXES, onRequest } from "./[[path]]";

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
    nextResponse = new Response("active", { status: 200 }),
  }: {
    method?: string;
    archive?: unknown;
    assetStatus?: number;
    nextResponse?: Response;
  } = {},
) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(archive), { status: assetStatus }));
  const next = vi.fn(async () => nextResponse.clone());
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
    const unknown = context("/interop/missing.invalid");
    expect((await onRequest(unknown.ctx as never)).status).toBe(404);
    // An unknown path is not a mirror-served one, so the redirect chain is never
    // consulted for it: the Function refuses the URL itself.
    expect(unknown.next).not.toHaveBeenCalled();
    expect((await onRequest(context("/interop/../secret.invalid").ctx as never)).status).toBe(404);
    expect((await onRequest(context(PATH, { method: "POST" }).ctx as never)).status).toBe(405);
  });

  // MEASURED 2026-11-06. The published index names 1,898 /interop/ots/**.invalid
  // paths as hf-mirror; every sampled one was HTTP 404 at the site while the mirror
  // served the exact indexed bytes. This Function answered 404 for any .invalid path
  // it did not hold in the archive, and the packer never archived the mirror-served
  // ones -- so it shadowed the _redirects rule that reaches them. It must defer.
  describe("mirror-served retired paths", () => {
    const MIRROR_PATH = "/interop/ots/old.ots.invalid";
    const EMPTY_ARCHIVE = { schema: "csoai.retired-proof-bytes/0.1", members: {} };

    it("defers to the redirect chain instead of refusing the URL", async () => {
      const { ctx, next } = context(MIRROR_PATH, {
        archive: EMPTY_ARCHIVE,
        nextResponse: new Response(null, {
          status: 302,
          headers: {
            location:
              "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/interop/ots/old.ots.invalid",
          },
        }),
      });
      const response = await onRequest(ctx as never);
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain("councilof-ai-evidence");
      expect(response.headers.get("x-evidence-state")).toBe("retired-or-invalid-historical-bytes");
      expect(next).toHaveBeenCalledOnce();
    });

    it("marks the historical state when the chain already resolved the bytes", async () => {
      const { ctx } = context(MIRROR_PATH, {
        archive: EMPTY_ARCHIVE,
        nextResponse: new Response("retired bytes", { status: 200 }),
      });
      const response = await onRequest(ctx as never);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("retired bytes");
      expect(response.headers.get("x-evidence-state")).toBe("retired-or-invalid-historical-bytes");
    });

    it("still refuses when neither the archive nor the chain can serve the path", async () => {
      const { ctx } = context(MIRROR_PATH, {
        archive: EMPTY_ARCHIVE,
        nextResponse: new Response("not found", { status: 404 }),
      });
      expect((await onRequest(ctx as never)).status).toBe(404);
    });
  });

  // The mirror-served list is the Function's knowledge of public/_redirects. If the
  // two drift apart, a mirror directory is added and its retired members 404 again
  // exactly as they did on 2026-11-06. This gate makes the drift a build failure
  // instead of a silent dead door.
  it("the mirror-served list agrees with public/_redirects", () => {
    const redirects = readFileSync(new URL("../../public/_redirects", import.meta.url), "utf8");
    const declared = redirects
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split(/\s+/))
      .filter(([, target]) => /^https:\/\/huggingface\.co\//.test(target || ""))
      .map(([from]) => from)
      .filter((from) => from.endsWith("/*"))
      .map((from) => from.replace(/\/\*$/, "/"))
      .filter((from) => from.startsWith("/interop/"));
    expect([...new Set(declared)].sort()).toEqual([...MIRROR_SERVED_PREFIXES].sort());
  });
});
