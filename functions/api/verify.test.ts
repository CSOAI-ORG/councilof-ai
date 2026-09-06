/**
 * verify.test.ts — /api/verify returns the SAME verdict as every other verifying surface.
 *
 * The endpoint adds no verification logic on purpose: it calls functions/_lib/cardVerify, the
 * module behind the MCP `verify_card` tool and /gspc-verify. So what is worth testing is not
 * "does Ed25519 work" — cardVerify has its own tests — but the three things a thin wrapper gets
 * wrong: it collapses UNCHECKABLE into INVALID, it lets an unreadable input look like a
 * judgement, and it drifts from the shared module by re-deriving something itself.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../_lib/cardVerify", async () => {
  const actual = await vi.importActual<typeof import("../_lib/cardVerify")>("../_lib/cardVerify");
  return { ...actual, verifyCard: vi.fn() };
});

import { verifyCard } from "../_lib/cardVerify";
import { onRequestGet, onRequestPost } from "./verify";

const call = (body: unknown) =>
  (onRequestPost as any)({
    request: new Request("https://councilof.ai/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  });

beforeEach(() => {
  vi.mocked(verifyCard).mockReset();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
});

describe("/api/verify", () => {
  it("GET documents the three states without judging anything", async () => {
    const r = await (onRequestGet as any)({ request: new Request("https://councilof.ai/api/verify") });
    const b = await r.json();
    expect(r.status).toBe(200);
    for (const s of ["VALID", "INVALID", "UNCHECKABLE"]) expect(b.states).toHaveProperty(s);
    expect(b.not_a_certification).toBe(true);
    expect(b.free).toBe(true);
    // The doc must not itself be a verdict.
    expect(b.state).toBeUndefined();
  });

  it("a valid card is VALID, and says it is not a certification", async () => {
    vi.mocked(verifyCard).mockResolvedValue({
      valid: true, id: "c".repeat(64), family: "gspc.measurement-card", reasons: [],
      checks: [{ label: "signature", ok: true, code: "sig_ok", detail: "" }],
    } as any);
    const b = await (await call({ card: { id: "c".repeat(64) } })).json();
    expect(b.state).toBe("VALID");
    expect(b.reason).toBeNull();
    expect(b.not_a_certification).toBe(true);
  });

  it("an invalid card is INVALID with the reason NAMED, never a bare false", async () => {
    vi.mocked(verifyCard).mockResolvedValue({
      valid: false, id: null, family: null,
      reasons: ["preimage_mismatch"],
      checks: [{ label: "preimage", ok: false, code: "preimage_mismatch", detail: "bytes differ" }],
    } as any);
    const b = await (await call({ card: { id: "x" } })).json();
    expect(b.state).toBe("INVALID");
    expect(b.reason).toBe("preimage_mismatch");
    expect(b.reasons).toContain("preimage_mismatch");
  });

  it("UNCHECKABLE is never reported as INVALID", async () => {
    // THE ASSERTION THAT MATTERS. "I could not read this" and "this card fails the rule" are
    // different findings; a caller that cannot tell them apart cannot act on either.
    const b = await (await call({ card: "not json and not a url" })).json();
    expect(b.state).toBe("UNCHECKABLE");
    expect(b.state).not.toBe("INVALID");
    expect(verifyCard).not.toHaveBeenCalled();
  });

  it("refuses to fetch a card from a host that is not ours", async () => {
    const b = await (await call({ card: "https://evil.example/card.json" })).json();
    expect(b.state).toBe("UNCHECKABLE");
    expect(String(b.reason)).toMatch(/councilof\.ai and csoai\.org/);
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("evil.example"), expect.anything());
  });

  it("an unreachable did.json does not change the verdict", async () => {
    // Trust anchors are PINNED in the verifier's source. A network failure used to be able to
    // make a signed card UNCHECKABLE; the pinned set closed that. Asserted here because this
    // endpoint is the surface where a regression would be most visible and least noticed.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    vi.mocked(verifyCard).mockResolvedValue({
      valid: true, id: "d".repeat(64), family: "gspc.measurement-card", reasons: [], checks: [],
    } as any);
    const b = await (await call({ card: { id: "d".repeat(64) } })).json();
    expect(b.state).toBe("VALID");
  });
});
