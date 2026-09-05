/**
 * The $250 bundle is the estate's largest SKU and it had no way to buy it with money.
 *
 * It declares rail "x402-or-invoice" and its notes describe "a CSOAI LTD invoice for a first
 * human deal", but every served surface — the free preview's `buy` block and the 402 challenge —
 * named only the USDC path. An organisation that needs an Article 50 evidence pack and raises
 * POs rather than holding a Base wallet reached a demand for USDC and had nowhere to go.
 *
 * These assert the door exists AND that it stays a door, not a delivery chute: the SKU's own
 * rule is that the owner invoices and the Function only issues the reference, so the quotation
 * must never carry the assembled pack, and must never carry an amount — a price on this estate
 * lives inside a 402 challenge or on the invoice, never on a plain GET.
 */
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./evidence-bundle";

const ORIGIN = "https://councilof.ai";
const call = async (qs: string) => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(`${ORIGIN}/api/evidence-bundle?${qs}`),
    env: {},
  });
  return { res, body: (await res.json()) as Record<string, unknown> };
};
const INVOICE = "obligation=article-50&subject=openai&bundle=1&invoice=gbp&commissioned_by=ACME%20Ltd";

describe("evidence-bundle — the human door", () => {
  it("issues a quotation with a stable reference for a named organisation", async () => {
    const { res, body } = await call(INVOICE);
    expect(res.status).toBe(200);
    expect(body.kind).toBe("quotation");
    expect(body.mode).toBe("invoice-gbp");
    expect(String(body.reference)).toMatch(/^CSOAI-EB-[0-9A-F]{12}$/);
    expect(body.commissioned_by).toBe("ACME Ltd");
  });

  it("the reference is deterministic for the same deal and differs for another buyer", async () => {
    const a = await call(INVOICE);
    const b = await call(INVOICE);
    const c = await call(INVOICE.replace("ACME%20Ltd", "Globex%20SA"));
    expect(a.body.reference).toBe(b.body.reference);
    expect(c.body.reference).not.toBe(a.body.reference);
  });

  it("refuses to quote without a named legal entity — an invoice needs a payer", async () => {
    const { res, body } = await call("obligation=article-50&bundle=1&invoice=gbp");
    expect(res.status).toBe(400);
    expect(body.error).toBe("missing_commissioned_by");
  });

  it("never releases the pack — the owner invoices, the Function only issues the reference", async () => {
    const { body } = await call(INVOICE);
    // The paid path returns the assembled OSCAL bundle; a quotation must carry none of it.
    for (const k of ["oscal", "bundle", "cards_full", "manifest_card", "sig_ed25519"]) {
      expect(body[k], `quotation leaked ${k}`).toBeUndefined();
    }
  });

  it("names no amount — a price belongs in a 402 challenge or on the invoice, not on a GET", async () => {
    const { body } = await call(INVOICE);
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/[£$€]\s?\d/);
    expect(text).not.toMatch(/\b\d+(?:\.\d\d)?\s?(?:GBP|USD|USDC|EUR)\b/);
    expect(text).not.toMatch(/\b250\b/);
  });

  it("the free preview advertises the door, so a buyer finds it without reading source", async () => {
    const { body } = await call("obligation=article-50&subject=openai");
    const buy = body.buy as Record<string, unknown>;
    expect((buy.invoice as Record<string, string>).how).toContain("invoice=gbp");
  });

  it("the 402 challenge names the door too, for an agent that cannot pay USDC", async () => {
    const { res } = await call("obligation=article-50&subject=openai&bundle=1");
    expect(res.status).toBe(402);
    const ch = JSON.parse(atob(res.headers.get("payment-required")!));
    expect(JSON.stringify(ch.csoai ?? ch)).toContain("invoice=gbp");
  });
});
