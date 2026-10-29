import { afterEach, describe, expect, it, vi } from "vitest";
import { getRootTool } from "./_board";

afterEach(() => vi.unstubAllGlobals());

describe("public-root retrieval boundary", () => {
  it("returns retrieved metadata without treating VALID as cryptographic verification", async () => {
    const fetch = vi.fn(async () => Response.json({
      kind: "fixture", as_of: "2026-10-29", card_count: 2,
      merkle_root: "unverified-fixture", note: "Fixture only",
    }));
    vi.stubGlobal("fetch", fetch);
    const result = await getRootTool("https://example.test");
    expect(result).toEqual({
      state: "VALID", source: "https://example.test/root.json", kind: "fixture",
      as_of: "2026-10-29", card_count: 2, merkle_root: "unverified-fixture",
      note: "Fixture only", not_a_certification: true, not_gspc: true,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("https://example.test/root.json", {
      headers: { accept: "application/json" },
    });
  });

  it.each([
    ["HTTP failure", () => new Response("Unavailable", { status: 503 })],
    ["unreadable JSON", () => new Response("not JSON", { status: 200 })],
    ["unusable null payload", () => Response.json(null)],
    ["network failure", () => { throw new Error("network fixture"); }],
  ])("reports %s as UNREACHABLE without substituting measurement values", async (_name, response) => {
    vi.stubGlobal("fetch", vi.fn(async () => response()));
    const result = await getRootTool("https://example.test");
    expect(result).toMatchObject({ state: "UNREACHABLE", reachable: false, not_gspc: true });
    expect(result).not.toHaveProperty("merkle_root");
    expect(result).not.toHaveProperty("card_count");
  });
});
