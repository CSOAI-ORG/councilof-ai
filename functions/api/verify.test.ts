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

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CARD_ATTESTATION_HEX, verifyCard } from "../_lib/cardVerify";
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

  it("a card that could not be checked is UNCHECKABLE, not INVALID", async () => {
    // The same rule through the verifyCard door: an unrecognised shape or a browser
    // gap means nothing was judged, so the endpoint must not paint it as a failure.
    vi.mocked(verifyCard).mockResolvedValue({
      valid: false, id: null, family: "unknown",
      reasons: ["unrecognised_family"],
      checks: [{ label: "family", ok: null, code: "unrecognised_family", detail: "not a shape we publish" }],
    } as any);
    const b = await (await call({ card: { hello: "world" } })).json();
    expect(b.state).toBe("UNCHECKABLE");
    expect(b.reason).toBe("unrecognised_family");
  });

  it("a browser gap never whitewashes a real failure — mixed reasons stay INVALID", async () => {
    vi.mocked(verifyCard).mockResolvedValue({
      valid: false, id: "e".repeat(64), family: "gspc.measurement-card",
      reasons: ["preimage_mismatch", "ed25519_unsupported"],
      checks: [{ label: "preimage", ok: false, code: "preimage_mismatch", detail: "bytes differ" }],
    } as any);
    const b = await (await call({ card: { id: "e".repeat(64) } })).json();
    expect(b.state).toBe("INVALID");
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

  describe("the live did.json cross-check reads the published keys, not just their ids", () => {
    // E2E 2026-10-07: every POST /api/verify answer carried "Live anchor cross-check — ok:false —
    // The live did.json does not list this key while the pinned set also does", for a key that
    // did.json on both hosts lists, while the MCP `verify_card` tool reading the same document
    // said "agrees". The endpoint's own did.json reader kept only the method ids and left every
    // key hex empty, so the cross-check could never match. It must use cardVerify.anchorsFromDid.
    const DID = readFileSync(resolve(__dirname, "../../public/.well-known/did.json"), "utf8");
    const CARD = JSON.parse(
      readFileSync(
        resolve(__dirname, "../../public/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json"),
        "utf8",
      ),
    );
    const serveDid = () =>
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          String(url).endsWith("/.well-known/did.json")
            ? new Response(DID, { status: 200, headers: { "content-type": "application/json" } })
            : new Response("{}", { status: 404 }),
        ),
      );

    it("hands verifyCard the decoded key bytes of every published verification method", async () => {
      serveDid();
      vi.mocked(verifyCard).mockResolvedValue({
        valid: true, id: "e".repeat(64), family: "gspc.measurement-card", reasons: [], checks: [],
      } as any);
      await call({ card: { id: "e".repeat(64) } });
      expect(verifyCard).toHaveBeenCalledTimes(1);
      const anchors = vi.mocked(verifyCard).mock.calls[0][1] as { id: string; hex: string }[];
      expect(anchors.length).toBeGreaterThan(0);
      for (const a of anchors) expect(a.hex).toMatch(/^[0-9a-f]{64}$/);
      expect(anchors).toContainEqual({ id: "did:web:csoai.org#card-attestation-1", hex: CARD_ATTESTATION_HEX });
    });

    it("so a published card's cross-check row says the live document AGREES (advisory, verdict unchanged)", async () => {
      serveDid();
      const actual = await vi.importActual<typeof import("../_lib/cardVerify")>("../_lib/cardVerify");
      vi.mocked(verifyCard).mockImplementation(actual.verifyCard);
      const b = await (await call({ card: CARD })).json();
      expect(b.state).toBe("VALID");
      const row = b.checks.find((c: { check: string }) => c.check === "Live anchor cross-check");
      expect(row).toMatchObject({ ok: true, code: "live_anchor_agrees" });
      expect(row.detail).not.toMatch(/does not list/);
    });
  });
});
