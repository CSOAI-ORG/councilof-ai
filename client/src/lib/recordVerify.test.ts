import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { lookupRecordUseStatus, verifyRecord } from "./recordVerify";

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
    expect(r.state).toBe("VALID");
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
    expect(r.state).toBe("INVALID");
    expect(line(r, "Card id")?.ok).toBe(false);
    expect(line(r, "Signature")?.ok).toBe(false);
  });

  it("says UNRECOGNISED — not INVALID — for a document of neither family", async () => {
    const r = await verifyRecord(JSON.stringify({ hello: "world" }));
    // Three states, never two: "could not check" is a different claim from "forged".
    expect(r.state).toBe("UNCHECKABLE");
    const f = line(r, "Family");
    expect(f?.ok).toBeNull();
    expect(f?.detail).toMatch(/UNRECOGNISED/);
    // Crucially: no Signature line claiming failure.
    expect(line(r, "Signature")).toBeUndefined();
  });

  it("still reports bad JSON as bad JSON and checks nothing", async () => {
    const r = await verifyRecord("{not json");
    // Unparsable input is UNCHECKABLE, not INVALID: nothing was judged.
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reasons).toEqual(["parse_error"]);
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


describe("lookupRecordUseStatus — independent of signature validity", () => {
  const boardCard = JSON.stringify({ did: "did:web:csoai.org#board-attestation-1", id: "card-123" });

  it("marks a withdrawn, unadmitted card using the public ledger and links its correction", async () => {
    vi.stubGlobal("fetch", async (url: any) => {
      if (String(url).includes("WITHDRAWN.jsonl")) return {
        ok: true,
        text: async () => JSON.stringify({ withdrawn_id: "card-123", correction: "C-2026-0924-03" }) + "\n",
      } as unknown as Response;
      throw new Error("unexpected fetch");
    });
    const status = await lookupRecordUseStatus(boardCard);
    expect(status.state).toBe("WITHDRAWN");
    expect(status.detail).toMatch(/unadmitted and withdrawn from quotable use/);
    expect(status.reference).toBe("/corrections/mill16-unadmitted-2026-09-24.json");
  });

  it("does not mistake absence from the withdrawal ledger for admission", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => "" }) as unknown as Response);
    const status = await lookupRecordUseStatus(boardCard);
    expect(status.state).toBe("NOT_ESTABLISHED");
    expect(status.detail).toMatch(/does not establish GSPC admission or quotability/);
  });

  it("fails closed when the withdrawal ledger is unreachable or malformed", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
    expect((await lookupRecordUseStatus(boardCard)).state).toBe("UNCHECKABLE");
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => "{bad json" }) as unknown as Response);
    expect((await lookupRecordUseStatus(boardCard)).state).toBe("UNCHECKABLE");
  });
});

/**
 * A card-v0/v1 leaf has no `id`: it is named by its sha256 (paid-route lane, 7 Oct 2026). The
 * record a paid art50 pack sends its buyer to check used to show "Card id is missing" (UNCHECKABLE)
 * under its VALID verdict; it is now looked up by that sha256.
 */
describe("lookupRecordUseStatus — a leaf is looked up by its sha256", () => {
  const sha = "ab".repeat(32);
  const leaf = JSON.stringify({ did: "did:web:csoai.org#board-attestation-1", payload: { kind: "k" }, sha256: sha, sig_ed25519: "cd".repeat(64) });

  it("absence is NOT_ESTABLISHED, never 'Card id is missing'", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => "" }) as unknown as Response);
    const s = await lookupRecordUseStatus(leaf);
    expect(s.state).toBe("NOT_ESTABLISHED");
    expect(s.detail).not.toMatch(/Card id is missing/);
  });

  it("a leaf listed by its sha256 reads WITHDRAWN", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: true, text: async () => JSON.stringify({ withdrawn_id: sha, correction: "C-x" }) + "\n" }) as unknown as Response);
    expect((await lookupRecordUseStatus(leaf)).state).toBe("WITHDRAWN");
  });

  it("a board-signed record with neither an id nor a leaf's sha256 still says its id is missing", async () => {
    expect((await lookupRecordUseStatus(JSON.stringify({ did: "did:web:csoai.org#board-attestation-1" }))).state).toBe("UNCHECKABLE");
  });
});
