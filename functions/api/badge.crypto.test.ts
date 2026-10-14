/**
 * /api/badge against the REAL card verifier (14 Oct 2026). claim=verified used to return VERIFIED
 * before any check, and a card with signature "" passes verifyCard as valid:true with the Signature
 * check unsigned (ok:null). Every case here runs the full GET handler, the unchanged
 * functions/_lib/cardVerify.ts and Node's WebCrypto Ed25519. No private key is used: the negatives
 * need none, and the positive path is covered in badge.test.ts with the verifier's real verdict shape.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { CARD_ATTESTATION_HEX, pyCanonical, verifyCard } from "../_lib/cardVerify";
import { onRequestGet } from "./badge";

const REVISION = "b".repeat(40);
const SUBJECT = `owner/model@${REVISION}`;
const body = { kind: "gspc.measurement-card", axis: "governance", subject: { slug: "owner/model", revision: REVISION } };

const sha256Hex = async (text: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const install = (id: string, card: unknown, signed: boolean) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
      if (url.pathname === "/signed/card_index.json")
        return Response.json({ cards: [{ card: id, card_url: `/signed/cards/${id}.json`, axis: "governance", signed }] });
      if (url.pathname === `/signed/cards/${id}.json`) return Response.json(card);
      throw new Error(`unexpected fetch ${url.pathname}`);
    }),
  );

const badge = async (id: string, claim: string, format: "json" | "shields" | "svg") => {
  const q = new URLSearchParams({ card: id, subject: SUBJECT, claim });
  if (format !== "svg") q.set("format", format);
  const res = await onRequestGet({ request: new Request(`https://councilof.ai/api/badge?${q}`) } as never);
  return format === "svg" ? await res.text() : await res.json();
};

const claims = (format: string, out: unknown, claim: string): boolean => {
  if (format === "svg") return new RegExp(`<title>[^<]*: ${claim}</title>`).test(out as string);
  const o = out as { state?: string; message?: string };
  return format === "json" ? o.state === claim : o.message === claim;
};

afterEach(() => vi.unstubAllGlobals());

describe("/api/badge with the real verifier: no signature, no verified or measured", async () => {
  const id = await sha256Hex(pyCanonical(body));
  const base = { id, body, pubkey: CARD_ATTESTATION_HEX, signature: "" };
  const cases: [string, unknown, boolean][] = [
    ["empty signature, index says signed", base, true],
    ["genuinely invalid Ed25519 signature", { ...base, signature: "00".repeat(64) }, true],
    ["preimage mismatch", { ...base, body: { ...body, axis: "tampered" }, signature: "00".repeat(64) }, true],
    ["untrusted public key", { ...base, pubkey: "00".repeat(32), signature: "00".repeat(64) }, true],
    ["unsigned index entry", base, false],
  ];

  it("the control holds: the real verifier calls an empty signature valid:true with the Signature check unsigned", async () => {
    const v = await verifyCard(base, []);
    expect(v.valid).toBe(true);
    expect(v.checks.find((c) => c.label === "Signature")).toMatchObject({ ok: null, code: "unsigned" });
  });

  for (const [name, card, signed] of cases) {
    for (const claim of ["verified", "measured"]) {
      for (const format of ["json", "shields", "svg"] as const) {
        it(`${name} → no ${claim} (${format})`, async () => {
          install(id, card, signed);
          const out = await badge(id, claim, format);
          expect(claims(format, out, claim)).toBe(false);
          if (format === "json") expect((out as { color: string }).color).toBe("#9ca3af");
        });
      }
    }
  }

  it("issued stays presence-only for the same card", async () => {
    install(id, base, true);
    expect(await badge(id, "issued", "json")).toMatchObject({ state: "issued", message: "issued" });
  });
});
