import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { verifyRecord } from "./recordVerify";

/**
 * The Council OS "Verify a card" pane's actual entry point.
 *
 * THE REGRESSION THIS LOCKS DOWN. Before 2026-08-26 this function knew only the
 * estate-envelope family, so a genuine published measurement card produced
 * `Signature ✗ INVALID — no published key verifies this signature`. The pane
 * named "Verify a card" reported forgery on authentic evidence. The first test
 * below is that exact card; if it ever goes red again, the pane is lying.
 */

const root = (p: string) => new URL(`../../../${p}`, import.meta.url);
const readJson = (p: string) => JSON.parse(readFileSync(root(p), "utf8"));

const did = readJson("public/.well-known/did.json");
const index = readJson("public/signed/card_index.json");
const card = readJson(`public/signed/cards/${index.cards[0].card}.json`);

const line = (r: Awaited<ReturnType<typeof verifyRecord>>, label: string) =>
  r.lines.find((l) => l.label === label);

beforeEach(() => {
  // did.json is the ONLY network read on this path. Served from the committed
  // artifact so the test measures the verifier, not the deploy.
  vi.stubGlobal("fetch", async (url: any) => {
    if (String(url).includes("did.json"))
      return { ok: true, json: async () => did } as unknown as Response;
    throw new Error(`unexpected fetch: ${url}`);
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("verifyRecord — family dispatch", () => {
  it("VALIDATES a genuine published measurement card (the regression)", async () => {
    const r = await verifyRecord(JSON.stringify(card));
    expect(line(r, "Family")?.detail).toMatch(/Measurement card/);
    expect(line(r, "Card id")?.ok).toBe(true);
    expect(line(r, "Signature")?.ok).toBe(true);
    expect(line(r, "Signature")?.detail).toMatch(/VALID against did:web:csoai\.org#card-attestation-1/);
  });

  it("names a card's frozen framing rather than letting it read as the live count", async () => {
    const r = await verifyRecord(JSON.stringify(card));
    const f = line(r, "Framing");
    expect(f?.ok).toBeNull();
    expect(f?.detail).toMatch(/frozen — read the live count from GET \/api\/gspc/);
  });

  it("says INVALID when a card body is altered", async () => {
    const t = { ...card, body: { ...card.body, accuracy: 0.4242 } };
    const r = await verifyRecord(JSON.stringify(t));
    expect(line(r, "Card id")?.ok).toBe(false);
    expect(line(r, "Signature")?.ok).toBe(false);
  });

  it("says UNRECOGNISED — not INVALID — for a document of neither family", async () => {
    const r = await verifyRecord(JSON.stringify({ hello: "world" }));
    const f = line(r, "Family");
    expect(f?.ok).toBeNull();
    expect(f?.detail).toMatch(/UNRECOGNISED/);
    // Crucially: no Signature line claiming failure.
    expect(line(r, "Signature")).toBeUndefined();
  });

  it("still reports bad JSON as bad JSON and checks nothing", async () => {
    const r = await verifyRecord("{not json");
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].ok).toBe(false);
  });

  it("still handles the estate envelope family", async () => {
    const r = await verifyRecord(JSON.stringify({ a: 1, content_id: "deadbeef" }));
    expect(line(r, "Family")?.detail).toMatch(/Estate envelope/);
    expect(line(r, "content_id")?.ok).toBe(false);
    expect(line(r, "Signature")?.ok).toBeNull();
  });
});
