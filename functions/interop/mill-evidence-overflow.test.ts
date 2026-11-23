import { describe, expect, it, vi } from "vitest";
import overflowMap from "../../scripts/hf/mill_evidence_overflow_map.json";
import { onRequest } from "./[[path]]";

function fakeContext(path: string, method = "GET") {
  const next = vi.fn(async () => new Response("legacy", { status: 200 }));
  const ctx = {
    request: new Request("https://councilof.ai/" + path, { method }),
    env: { ASSETS: { fetch: vi.fn() } },
    next,
  };
  return { ctx, next };
}

describe("capacity-sharded mill evidence routing", () => {
  const admissions = Object.keys(overflowMap.entries).filter((p) => p.endsWith(".json"));
  const itemRows = Object.keys(overflowMap.entries).filter((p) => p.endsWith(".jsonl"));
  it("preserves both admission JSON and per-item JSONL in the approved map", () => {
    expect(admissions).toHaveLength(2952);
    expect(itemRows).toHaveLength(656);
  });

  for (const logical of [admissions[0], itemRows[0]]) {
    it("redirects an exact pinned path into the deterministic HF shard: " + logical, async () => {
      const { ctx, next } = fakeContext(logical);
      const response = await onRequest(ctx as never);
      const name = logical.split("/").at(-1)!;
      const digest = name.match(/-([0-9a-f]{12})\.(?:json|jsonl)$/)![1];
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/" +
        `${overflowMap.destination_prefix}/${digest[0]}/${name}`,
      );
      expect(next).not.toHaveBeenCalled();
    });
  }

  it("retains the old physical HF route for an unmapped historical admission", async () => {
    const { ctx, next } = fakeContext("interop/mill-evidence/admission-002b38d34e08.json");
    expect((await onRequest(ctx as never)).status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects writes to the pinned historical mapping", async () => {
    const { ctx, next } = fakeContext(admissions[0], "POST");
    expect((await onRequest(ctx as never)).status).toBe(405);
    expect(next).not.toHaveBeenCalled();
  });
});
