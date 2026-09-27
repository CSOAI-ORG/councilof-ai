import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { onRequest } from "./[[path]]";

const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const archived = Uint8Array.from([0, 255, 1, 2]);
const member = {
  sha256: sha(archived),
  bytes: archived.byteLength,
  body_base64: Buffer.from(archived).toString("base64"),
};
const archive = (override: Record<string, unknown> = {}) => ({
  schema: "csoai.retired-proof-bytes/0.1",
  evidence_state: "RETIRED_OR_INVALID_HISTORICAL_BYTES_ONLY",
  members: { "/interop/ots/old.ots.invalid": member },
  ...override,
});

function ctx(
  path: string,
  options: {
    method?: string;
    next?: Response;
    archiveDoc?: unknown;
    archiveStatus?: number;
    assets?: boolean;
  } = {},
) {
  let archiveReads = 0;
  const context: any = {
    request: new Request("https://councilof.ai" + path, {
      method: options.method || "GET",
    }),
    next: async () => options.next || new Response("not found", { status: 404 }),
    env: {},
  };
  if (options.assets !== false) {
    context.env.ASSETS = {
      fetch: async () => {
        archiveReads += 1;
        return new Response(JSON.stringify(options.archiveDoc ?? archive()), {
          status: options.archiveStatus ?? 200,
          headers: { "content-type": "application/json" },
        });
      },
    };
  }
  return { context, archiveReads: () => archiveReads };
}

describe("retired proof byte fallback", () => {
  it("never replaces an existing static asset", async () => {
    const c = ctx("/interop/live.json", { next: new Response("live", { status: 200 }) });
    const r = await onRequest(c.context);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("live");
    expect(c.archiveReads()).toBe(0);
  });

  it("serves exact archived bytes only for an explicit .invalid path", async () => {
    const c = ctx("/interop/ots/old.ots.invalid");
    const r = await onRequest(c.context);
    expect(r.status).toBe(200);
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(archived);
    expect(r.headers.get("x-csoai-evidence-state")).toBe(
      "RETIRED_OR_INVALID_HISTORICAL_BYTES_ONLY",
    );
    expect(r.headers.get("x-csoai-sha256")).toBe(member.sha256);
    expect(c.archiveReads()).toBe(1);
  });

  it("supports HEAD without returning historical bytes", async () => {
    const c = ctx("/interop/ots/old.ots.invalid", { method: "HEAD" });
    const r = await onRequest(c.context);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-length")).toBe(String(archived.byteLength));
    expect((await r.arrayBuffer()).byteLength).toBe(0);
  });

  it("returns the original 404 for an unknown retired path", async () => {
    const c = ctx("/interop/unknown.invalid");
    const r = await onRequest(c.context);
    expect(r.status).toBe(404);
  });

  it("fails closed if archived bytes do not match their digest", async () => {
    const bad = archive({
      members: {
        "/interop/ots/old.ots.invalid": { ...member, sha256: "0".repeat(64) },
      },
    });
    const c = ctx("/interop/ots/old.ots.invalid", { archiveDoc: bad });
    const r = await onRequest(c.context);
    expect(r.status).toBe(503);
    expect(r.headers.get("x-csoai-evidence-state")).toBe("UNCHECKABLE");
  });

  it("fails closed when a candidate archived path has no asset binding", async () => {
    const c = ctx("/interop/ots/old.ots.invalid", { assets: false });
    const r = await onRequest(c.context);
    expect(r.status).toBe(503);
  });

  it("does not turn traversal or non-GET methods into archive reads", async () => {
    const traversal = ctx("/interop/%2e%2e/secret.invalid");
    expect((await onRequest(traversal.context)).status).toBe(404);
    expect(traversal.archiveReads()).toBe(0);
    const post = ctx("/interop/ots/old.ots.invalid", { method: "POST" });
    expect((await onRequest(post.context)).status).toBe(404);
    expect(post.archiveReads()).toBe(0);
  });
});
