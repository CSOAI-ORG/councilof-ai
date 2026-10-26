import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as manifestGet } from "./x402.json";
import { onRequestGet as verifyGet } from "../api/verify";

const ORIGIN = "https://councilof.ai";
const PUBLIC = resolve(__dirname, "../../public");
const readPublished = (path: string) => readFileSync(resolve(PUBLIC, `.${path}`), "utf8");
const verify = (url: string) => (verifyGet as any)({ request: new Request(url) });

async function advertisedVerifier() {
  const response = await (manifestGet as any)({
    request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {},
  });
  const manifest = await response.json();
  const door = manifest.free_doors.find((d: { url: string }) => new URL(d.url).pathname === "/api/verify");
  expect(door).toMatchObject({ method: "GET", free: true });
  const recordUrl = new URL(door.url).searchParams.get("record_url")!;
  return { door, recordUrl, text: readPublished(new URL(recordUrl).pathname) };
}

function servePublished(recordUrl: string, text: string) {
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const url = String(input);
    if (url === recordUrl) return new Response(text, { headers: { "content-type": "application/json" } });
    if (url === `${ORIGIN}/.well-known/did.json`) return new Response(readPublished("/.well-known/did.json"));
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("advertised free verification — anonymous first use", () => {
  it("the copied manifest URL verifies authentic published bytes with the real verifier", async () => {
    const { door, recordUrl, text } = await advertisedVerifier();
    servePublished(recordUrl, text);
    const response = await verify(door.url);
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      state: "VALID", family: "gspc.measurement-card", record_url: recordUrl,
      free: true, not_a_certification: true,
      fetched: { sha256: createHash("sha256").update(text).digest("hex") },
    });
    expect(result.id).toBe(JSON.parse(text).id);
    expect(result.checks).toContainEqual(expect.objectContaining({ ok: true, code: "live_anchor_agrees" }));
    // This immutable example establishes authenticity, not today's board counts or freshness.
    expect(door.description).toMatch(/example dated 2026-08-19/);
  });

  it("altering the example body remains INVALID", async () => {
    const { door, recordUrl, text } = await advertisedVerifier();
    const card = JSON.parse(text);
    card.body.accuracy += 0.5;
    servePublished(recordUrl, JSON.stringify(card));
    const result = await (await verify(door.url)).json();
    expect(result.state).toBe("INVALID");
    expect(result.reasons).toContain("preimage_mismatch");
  });

  it("substituting an untrusted key remains INVALID", async () => {
    const { door, recordUrl, text } = await advertisedVerifier();
    const card = JSON.parse(text);
    card.pubkey = "ab".repeat(32);
    servePublished(recordUrl, JSON.stringify(card));
    const result = await (await verify(door.url)).json();
    expect(result.state).toBe("INVALID");
    expect(result.reasons).toContain("untrusted_signer");
  });

  it("the unsupported signed index remains UNCHECKABLE", async () => {
    const recordUrl = `${ORIGIN}/signed/card_index.json`;
    servePublished(recordUrl, readPublished("/signed/card_index.json"));
    const result = await (await verify(`${ORIGIN}/api/verify?record_url=${recordUrl}`)).json();
    expect(result).toMatchObject({ state: "UNCHECKABLE", reason: "unrecognised_family" });
  });

  it.each([
    "https://example.com/card.json", "http://councilof.ai/card.json",
    "https://localhost/card.json", "https://councilof.ai.evil.example/card.json",
    "https://councilof.ai@evil.example/card.json",
  ])("refuses an unsafe record URL without fetching: %s", async (recordUrl) => {
    vi.stubGlobal("fetch", vi.fn());
    const response = await verify(`${ORIGIN}/api/verify?record_url=${encodeURIComponent(recordUrl)}`);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ state: "UNCHECKABLE", fetched: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses to read a record that redirects off the allowed origins", async () => {
    const { door } = await advertisedVerifier();
    const response = new Response("not an allowed record");
    Object.defineProperty(response, "url", { value: "https://example.com/card.json" });
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const result = await verify(door.url);
    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({ state: "UNCHECKABLE" });
    expect(response.bodyUsed).toBe(false);
  });
});
