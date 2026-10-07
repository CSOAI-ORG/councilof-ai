/**
 * Repair round, 7 Oct 2026. The invoice rail became a quotation until paid (sell organ SG-04 + M1),
 * but the Article 50 pane still drew its answer as an issued pack: at 390 px a stranger who pressed
 * "Commission (GBP invoice)" read "PACK ISSUED · UNSIGNED", "0 bytes of signed payload" and a
 * "card-v0 leaf" Copy block holding `null`, although nothing was issued (state AWAITING_PAYMENT).
 *
 * The bodies below are the real Function's answers (functions/api/art50/marking-evidence.ts), not a
 * hand-written fixture, so the pane is held to the contract the door actually serves.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PackView, isAwaitingPayment } from "./LobbyArt50Pane";

// The Function is loaded by path, not by a static import: a static import would pull its Workers-only
// ambient types (KVNamespace, PagesFunction) into the client tsc program that scripts/ts-ratchet.mjs counts.
const FUNCTION = resolve(__dirname, "../../../../functions/api/art50/marking-evidence.ts");
type Handler = (ctx: unknown) => Promise<Response>;
const get: Handler = async (ctx) => ((await import(/* @vite-ignore */ FUNCTION)) as { onRequestGet: Handler }).onRequestGet(ctx);

const PLAIN_PNG = new Uint8Array(readFileSync(resolve(__dirname, "../../../../fixtures/c2pa/c2pa-rs-libpng-test.png")));
const ASK = "https://councilof.ai/api/art50/marking-evidence?commissioned_by=Acme%20Design%20Ltd&invoice=gbp&url=https://cdn.example/plain.png";

function stubOutput() {
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.hostname === "cdn.example" && url.pathname === "/plain.png") return new Response(PLAIN_PNG, { status: 200, headers: { "content-type": "image/png" } });
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

function memKv() {
  const store = new Map<string, string>();
  return { store, get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
}

async function testKey(): Promise<string> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  return btoa(String.fromCharCode(...pkcs8));
}

const ask = async (env: Record<string, unknown>) => (await get({ request: new Request(ASK), env, params: {} })).json();
const render = (pack: unknown) => renderToStaticMarkup(createElement(PackView, { pack: pack as never }));

describe("Article 50 pane — the invoice rail's answer before payment", () => {
  it("is drawn as a quotation with its reference and next step, never as an issued pack", async () => {
    stubOutput();
    const body = await ask({ REVENUE_KV: memKv() });
    expect(body.state).toBe("AWAITING_PAYMENT");
    expect(isAwaitingPayment(body)).toBe(true);
    const html = render(body);
    expect(html).toContain('data-testid="art50-quotation"');
    expect(html).toContain("Quotation · awaiting payment · nothing signed yet");
    expect(html).toContain(body.payment.reference);
    expect(html).toContain(`marks reference ${body.payment.reference} paid`);
    expect(html).toContain("This request issued no pack and signed nothing.");
    expect(html).toContain("Email the reference to CSOAI");
    expect(html).toContain("holds no secret");
    // the false statements the verifier read at 390 px
    expect(html).not.toMatch(/Pack issued/i);
    expect(html).not.toContain("bytes of signed payload");
    expect(html).not.toContain("card-v0 leaf");
    expect(html).not.toContain("null");
    expect(html).not.toContain("Check this pack is genuine");
    expect(html).not.toContain("Verify this card");
  });

  it("is drawn as an issued pack only once the owner's paid mark releases a card", async () => {
    stubOutput();
    const kv = memKv();
    const env = { REVENUE_KV: kv, BOARD_SIGN_KEY_PKCS8_B64: await testKey() };
    const before = await ask(env);
    kv.store.set(`art50-invoice-paid:${before.payment.reference}`, "marked paid");
    const after = await ask(env);
    expect(after.state).toBe("RELEASED");
    expect(isAwaitingPayment(after)).toBe(false);
    const html = render(after);
    expect(html).toContain('data-testid="art50-pack-issued"');
    expect(html).toContain("Pack issued · signed");
    expect(html).toContain("The card-v0 leaf (verify at /gspc-verify)");
    expect(html).toContain("Released because CSOAI LTD marked this reference paid.");
    expect(html).not.toContain("awaiting payment");
  });

  it("a body without a card is never an issued pack, whatever its state says", () => {
    expect(isAwaitingPayment({ state: undefined, card: null })).toBe(true);
    expect(isAwaitingPayment({ state: "RELEASED", card: { sha256: "x" } })).toBe(false);
  });
});
