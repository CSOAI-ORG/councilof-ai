import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { onRequestGet } from "./request-attestation";
import { verifyX402Payment } from "./_x402";
import { signPayload } from "../_lib/cardSign";

vi.mock("./_x402", async (load) => ({
  ...(await load<typeof import("./_x402")>()),
  verifyX402Payment: vi.fn(),
}));
vi.mock("../_lib/cardSign", async (load) => ({
  ...(await load<typeof import("../_lib/cardSign")>()),
  signPayload: vi.fn(),
}));

/**
 * PAID FAILURE PATHS ARE EXPLICIT STATES, NEVER SILENT PARTIALS (2026-10-13 defect).
 *
 * Reported: request-attestation reliability 88% — 1-in-8 requests returned an incomplete
 * deliverable. Two shapes on the PAID path could produce that with no way for the buyer to tell
 * it from success:
 *
 *   1. RESERVE READ FAILED SILENTLY. reserveFor() reports read:false on a failed or stalled
 *      /signed/card-matrix.json read, and the unpaid preview has honored that since 2026-09-28
 *      (signed_cards_on_file: null — "unread is UNCHECKABLE, never 0 on file"). The paid payload
 *      dropped the flag: a failed read reached the payer as reserve_count 0 / reserve_returned 0
 *      / reserve: [] — indistinguishable from a subject with nothing on file. Worse, the
 *      diagnostic string ("…json HTTP 503") was cited in source_urls as if it were a URL,
 *      because it starts with "http".
 *   2. SETTLED, THEN ISSUANCE FAILED. signPayload() throws over its 3KB payload cap; the handler
 *      answered a bare 500 with no x-payment-response — a payer already charged got neither the
 *      deliverable nor the settlement receipt the x402 spec says to echo back.
 *
 * Both must be checkable states: UNCHECKABLE / INCOMPLETE with the reason, count null (never 0),
 * and the payment receipt echoed whenever settlement happened.
 */
const origin = "https://councilof.ai";
const payment = vi.mocked(verifyX402Payment);
const sign = vi.mocked(signPayload);
// A subject the typed commission contract admits (hub-shaped → QUEUED).
const url = origin + "/api/request-attestation?subject=" + encodeURIComponent("org/model-name");
const SETTLED = {
  ok: true,
  reason: "settled",
  paymentResponse: "cHltZW50LXJlY2VpcHQtZW52ZWxvcGU=",
  settlement: { transaction: "0xabc", network: "eip155:8453", payer: "0xpayer" },
} as unknown as Awaited<ReturnType<typeof verifyX402Payment>>;

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  payment.mockResolvedValue(SETTLED);
  sign.mockImplementation(async (payload: Record<string, unknown>) => ({
    sha256: "a".repeat(64),
    sig_ed25519: null,
    did: null,
    bytes: JSON.stringify(payload).length,
    unsigned_reason: "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env",
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const call = () =>
  onRequestGet({ request: new Request(url), env: {} } as unknown as Parameters<typeof onRequestGet>[0]);

describe("a paid request whose reserve read fails is INCOMPLETE, never an empty reserve", () => {
  it("reports UNCHECKABLE with a null count and the reason — not reserve_count 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status: 503 })));
    const response = await call();
    expect(response.status).toBe(200); // the buyer paid; the receipt is still issued
    const body = (await response.json()) as any;
    const p = body.card.payload;
    expect(p.reserve_state).toBe("UNCHECKABLE");
    expect(p.deliverable_state).toBe("INCOMPLETE_RESERVE_UNREAD");
    expect(p.reserve_count).toBeNull(); // unread is null, NEVER 0
    expect(p.reserve_returned).toBeNull();
    expect(p.reserve).toEqual([]);
    expect(p.reserve_unread_reason).toContain("HTTP 503");
    // the card admits what it could not see
    expect(body.card.unmeasured).toContain("reserve");
    // and it never cites a diagnostic string as a URL
    for (const u of body.card.source_urls) expect(() => new URL(u)).not.toThrow();
    expect(body.card.source_urls.join(" ")).not.toMatch(/HTTP \d/);
    expect(body.card.source_urls).toContain(origin + "/signed/card-matrix.json");
  });

  it("a matrix read that rejects is the same explicit state, not a thrown request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed: connection reset by peer");
    }));
    const response = await call();
    expect(response.status).toBe(200);
    const p = ((await response.json()) as any).card.payload;
    expect(p.reserve_state).toBe("UNCHECKABLE");
    expect(p.reserve_count).toBeNull();
    expect(p.reserve_unread_reason).toContain("connection reset");
  });
});

describe("an honest empty reserve stays a zero, and the two are distinguishable", () => {
  it("read but no matching cards: READ, reserve_count 0, COMPLETE", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        as_of: "2026-10-13T00:00:00Z",
        cells: [{ model: "someone else entirely", axis: "safety", card: "signed-safety-000000000000.json", card_url: "x", signed: true }],
      }), { status: 200, headers: { "content-type": "application/json" } })));
    const response = await call();
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    const p = body.card.payload;
    expect(p.reserve_state).toBe("READ");
    expect(p.deliverable_state).toBe("COMPLETE");
    expect(p.reserve_count).toBe(0); // a read zero is a fact, and stays 0
    expect(p.reserve_unread_reason).toBeNull();
    expect(body.card.unmeasured).not.toContain("reserve");
  });
});

describe("a settled payment whose receipt cannot issue is never answered with a bare 500", () => {
  it("answers SETTLED_DELIVERABLE_NOT_ISSUED and echoes the payment receipt", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ as_of: "2026-10-13T00:00:00Z", cells: [] }), { status: 200 })));
    sign.mockRejectedValue(new Error("payload 4000 bytes exceeds 3072 cap"));
    const response = await call();
    expect(response.status).toBe(500);
    const body = (await response.json()) as any;
    expect(body.state).toBe("SETTLED_DELIVERABLE_NOT_ISSUED");
    expect(body.deliverable_state).toBe("INCOMPLETE_ISSUANCE_FAILED");
    expect(body.reason).toContain("3072 cap");
    expect(body.settle.transaction).toBe("0xabc");
    // the x402 settlement receipt travels with the failure — a payer is never charged and
    // answered without it
    expect(response.headers.get("x-payment-response")).toBe(SETTLED.paymentResponse);
  });
});
