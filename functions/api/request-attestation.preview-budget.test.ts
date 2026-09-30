import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { onRequestGet, PREVIEW_BUDGET_MS } from "./request-attestation";
import { verifyX402Payment } from "./_x402";

vi.mock("./_x402", async (load) => ({
  ...await load<typeof import("./_x402")>(),
  verifyX402Payment: vi.fn(),
}));

const origin = "https://councilof.ai";
const payment = vi.mocked(verifyX402Payment);
// The manifest's issuance example (/.well-known/x402.json) — the URL the buyer canary probes.
const example = origin + "/api/request-attestation?subject=model-or-subject-id";

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  payment.mockResolvedValue({ ok: false, reason: "no payment header" } as any);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("the unpaid 402 is never hostage to its preview reads", () => {
  it("answers 402 within the budget when every same-origin read stalls, and says the preview was not read", async () => {
    vi.useFakeTimers();
    const pending: string[] = [];
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      pending.push(String(input));
      return new Promise<Response>(() => {}); // a read that never answers
    }));
    const late: Promise<unknown>[] = [];
    const answer = onRequestGet({
      request: new Request(example),
      env: {},
      waitUntil: (p: Promise<unknown>) => { late.push(p); },
    } as unknown as Parameters<typeof onRequestGet>[0]);
    await vi.advanceTimersByTimeAsync(PREVIEW_BUDGET_MS);
    const response = await answer;
    expect(response.status).toBe(402);
    expect(PREVIEW_BUDGET_MS).toBeLessThan(5000);
    // both preview reads were started side by side, not one after the other
    expect(pending).toContain(origin + "/signed/card-matrix.json");
    expect(pending).toContain(origin + "/interop/card-root-latest.json");
    // the unfinished reads are handed to waitUntil so they can still warm the isolate cache
    expect(late).toHaveLength(1);
    const body = await response.json() as any;
    const preview = body.csoai.preview;
    expect(preview.signed_cards_on_file).toBeNull(); // unread is UNCHECKABLE, never "0 on file"
    expect(preview.read_from).toContain(`not read within ${PREVIEW_BUDGET_MS} ms`);
    expect(preview.interop_collection).toMatchObject({
      state: "UNCHECKABLE",
      matching_active_leaves: null,
      included_in_paid_reserve: false,
    });
    expect(preview.interop_collection.reason).toContain(`not read within ${PREVIEW_BUDGET_MS} ms`);
    expect(response.headers.get("payment-required")).toBeTruthy();
  });

  it("an unreadable matrix reports a null count, not an empty reserve", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === origin + "/signed/card-matrix.json") return new Response("unavailable", { status: 503 });
      return new Response("unavailable", { status: 503 });
    }));
    const response = await onRequestGet({ request: new Request(example), env: {} } as Parameters<typeof onRequestGet>[0]);
    expect(response.status).toBe(402);
    const body = await response.json() as any;
    expect(body.csoai.preview.signed_cards_on_file).toBeNull();
    expect(body.csoai.preview.read_from).toContain("HTTP 503");
    expect(body.csoai.preview.interop_collection.state).toBe("UNCHECKABLE");
  });
});
