import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./scoreboard";

function canonize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonize).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonize(object[key])}`).join(",")}}`;
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    const rendered = value.toString();
    return rendered.includes(".") ? rendered : `${rendered}.0`;
  }
  return JSON.stringify(value);
}

async function contentId(board: Record<string, unknown>): Promise<string> {
  const body = Object.fromEntries(Object.entries(board).filter(([key]) => key !== "signature"));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonize(body)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyResponse(board: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(board), {
    status: 200,
    headers: { "content-type": "application/json" },
  })));
  const response = await onRequestGet({
    request: new Request("https://councilof.ai/api/arena/scoreboard?verify=1"),
  });
  return response.json() as Promise<Record<string, unknown>>;
}

describe("arena scoreboard verifier", () => {
  it("checks the published content hash and Ed25519 signature separately", async () => {
    const board = JSON.parse(readFileSync("public/signed/arena_scoreboard.json", "utf8"));
    const result = await verifyResponse(board);
    expect(result.hash_match).toBe(true);
    expect(result.signature_valid).toBe(true);
    expect(result.verified).toBe(true);
  });

  it("rejects a recomputed content id paired with an invalid signature", async () => {
    const board = JSON.parse(readFileSync("public/signed/arena_scoreboard.json", "utf8"));
    board.generation = `${board.generation}-tampered`;
    board.signature.content_id = await contentId(board);
    board.signature.sig = "00".repeat(64);
    const result = await verifyResponse(board);
    expect(result.hash_match).toBe(true);
    expect(result.signature_valid).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.match).toBe(true);
  });
});
