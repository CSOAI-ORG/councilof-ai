import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as get, onRequestPost as post, KIND, SURFACE } from "./marking-evidence";
import { ART50_2_TEXT } from "../../_lib/art50Law";
import { verifyLeaf } from "../../_lib/cardSign";
import { ESTATE_PAY_TO } from "../_x402_config";

/** Real public samples (fixtures/c2pa/README.md cites the c2pa-rs URLs and pins the hashes). */
const FIX = resolve(__dirname, "../../../fixtures/c2pa");
const C_JPG = new Uint8Array(readFileSync(resolve(FIX, "c2pa-rs-C.jpg")));
const PLAIN_PNG = new Uint8Array(readFileSync(resolve(FIX, "c2pa-rs-libpng-test.png")));
const C_SHA = "a2d14755db55de67a47c04090340d8266e892367be4104a45626d7a6fa6e9ffd";

const ORIGIN = "https://councilof.ai";
const EP = "/api/art50/marking-evidence";
const ctx = (path: string, env: Record<string, unknown> = {}, init: RequestInit = {}) =>
  ({ request: new Request(ORIGIN + path, init), env, params: {} }) as never;

/** The binding wording rule: results are "detected / not detected by method"; these words never appear. */
const FORBIDDEN = /\b(non-?compliant|compliant|certified|certif(?:y|ies|ication)|absent|unsafe|safe|legal evidence|guarantee[sd]? that)\b/i;

function stubFetch(facilitator?: (p: string) => Response) {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (facilitator && (url.pathname.endsWith("/verify") || url.pathname.endsWith("/settle"))) return facilitator(url.pathname);
    if (url.hostname === "cdn.example" && url.pathname === "/C.jpg") return new Response(C_JPG, { status: 200, headers: { "content-type": "image/jpeg" } });
    if (url.hostname === "cdn.example" && url.pathname === "/plain.png") return new Response(PLAIN_PNG, { status: 200, headers: { "content-type": "image/png" } });
    if (url.hostname === "cdn.example" && url.pathname === "/huge.bin") return new Response("x", { status: 200, headers: { "content-length": String(100 * 1024 * 1024) } });
    void init;
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

async function testKey(): Promise<{ pkcs8b64: string; pubHex: string }> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  return { pkcs8b64: btoa(String.fromCharCode(...pkcs8)), pubHex: [...raw].map((b) => b.toString(16).padStart(2, "0")).join("") };
}

describe("free preview (?preview=1) — the full measurement, unsigned", () => {
  it("URL mode on the real C2PA sample: manifest DETECTED, hashes / binding / signature recomputed VALID, chain trust and watermarks UNCHECKABLE", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?preview=1&url=https://cdn.example/C.jpg`));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b).toMatchObject({ schema: KIND, mode: "preview", signed: false });
    expect(b.measurement.subject).toMatchObject({ sha256: C_SHA, bytes: C_JPG.byteLength, container: "jpeg", source: "url" });
    const by = Object.fromEntries(b.measurement.checked.map((c: { method: string; result: string }) => [c.method, c.result]));
    expect(by["c2pa.manifest-store"]).toBe("DETECTED");
    expect(by["c2pa.assertion-hashes"]).toBe("VALID");
    expect(by["c2pa.hard-binding"]).toBe("VALID");
    expect(by["c2pa.claim-signature"]).toBe("VALID");
    expect(by["iptc.digitalSourceType"]).toBe("NOT_DETECTED");
    expect(b.measurement.unmeasured).toEqual(expect.arrayContaining(["c2pa.chain-trust", "watermark.synthid", "watermark.keyed", "watermark.dwtdct", "text.watermark"]));
    for (const k of b.measurement.unmeasured) expect(typeof b.measurement.gaps[k]).toBe("string");
    expect(b.measurement.gaps["watermark.synthid"]).toMatch(/synthid-text/);
    expect(b.measurement.statements[0]).toBe("marking detected by method c2pa.manifest-store");
    expect(b.card).toBeUndefined();
    expect(JSON.stringify(b)).not.toMatch(FORBIDDEN);
  });

  it("carries the verbatim Article 50(2) text, its sha256, the EUR-Lex URL, the dates and the Art 99(4) ceiling", async () => {
    stubFetch();
    const b = await (await get(ctx(`${EP}?preview=1&url=https://cdn.example/plain.png`))).json();
    expect(b.law.text).toBe(ART50_2_TEXT);
    expect(b.law.text).toMatch(/^Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure/);
    const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ART50_2_TEXT)))].map((x) => x.toString(16).padStart(2, "0")).join("");
    expect(b.law.text_sha256).toBe(sha);
    expect(b.law.sources.eur_lex).toBe("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng");
    expect(b.law.dates).toMatchObject({ applies_from: "2026-08-02", pre_existing_systems_until: "2026-12-02" });
    expect(b.law.fine_ceiling).toMatchObject({ ceiling_eur: 15_000_000, ceiling_turnover_pct: 3 });
  });

  it("POST raw bytes of the non-C2PA sample: 'marking not detected by method …', never 'absent'", async () => {
    stubFetch();
    const r = await post(ctx(`${EP}?preview=1`, {}, { method: "POST", headers: { "content-type": "image/png" }, body: PLAIN_PNG }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.measurement.subject).toMatchObject({ container: "png", source: "upload", bytes: PLAIN_PNG.byteLength });
    expect(b.measurement.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.measurement.statements).toContain("marking not detected by method iptc.digitalSourceType");
    expect(b.measurement.checked.find((c: { method: string }) => c.method === "c2pa.claim-signature")).toBeUndefined();
    expect(JSON.stringify(b)).not.toMatch(FORBIDDEN);
  });

  it("manifest-only mode (JSON manifest_b64) verifies the claim and declares the hard binding UNCHECKABLE", async () => {
    stubFetch();
    const { extractManifestStore } = await import("../../_lib/c2pa");
    const store = extractManifestStore(C_JPG).store!;
    const manifest_b64 = btoa(String.fromCharCode(...store));
    const r = await post(ctx(`${EP}?preview=1`, {}, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest_b64 }) }));
    expect(r.status).toBe(200);
    const b = await r.json();
    const by = Object.fromEntries(b.measurement.checked.map((c: { method: string; result: string }) => [c.method, c.result]));
    expect(by["c2pa.claim-signature"]).toBe("VALID");
    expect(by["c2pa.hard-binding"]).toBe("UNCHECKABLE");
    expect(b.measurement.unmeasured).toContain("iptc.digitalSourceType");
  });

  it("refuses a private URL (400) and an over-cap body (413) without measuring", async () => {
    stubFetch();
    expect((await get(ctx(`${EP}?preview=1&url=http://localhost:8788/x.jpg`))).status).toBe(400);
    expect((await get(ctx(`${EP}?preview=1&url=https://cdn.example/huge.bin`))).status).toBe(413);
  });
});

describe("x402 rail — price only inside the 402", () => {
  it("unpaid: 402 with a complete challenge and the free measurement as preview", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?url=https://cdn.example/plain.png`));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.accepts[0]).toMatchObject({ payTo: ESTATE_PAY_TO, network: "eip155:8453" });
    expect(b.csoai.preview.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.csoai.never).toContain("conformity opinion");
    expect(JSON.stringify(b.csoai.preview)).not.toMatch(FORBIDDEN);
  });

  it("paid: ONE card-v0 leaf (art50.marking-evidence) citing the settle tx, ≤3KB, unsigned-declared without a key", async () => {
    stubFetch((p) => new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base", payer: "0xp" })));
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await get(ctx(`${EP}?url=https://cdn.example/C.jpg`, { X402_FACILITATOR_URL: "https://f.example" }, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const b = await r.json();
    expect(b.mode).toBe("x402");
    expect(b.card.surface).toBe(SURFACE);
    expect(b.card.subject).toBe(`sha256:${C_SHA}`);
    expect(b.card.payload.kind).toBe(KIND);
    expect(b.card.payload.payment).toMatchObject({ mode: "x402", transaction: "0xtx" });
    expect(b.card.source_urls).toContain("https://basescan.org/tx/0xtx");
    expect(b.card.source_urls).toContain("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng");
    expect(b.card.sig_ed25519).toBeNull();
    expect(b.card.unmeasured).toEqual(expect.arrayContaining(["root_inclusion", "sig_ed25519", "watermark.synthid", "c2pa.chain-trust"]));
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(JSON.stringify(b.card)).not.toMatch(FORBIDDEN);
  });
});

describe("invoice rail — ?commissioned_by=<org>&invoice=gbp", () => {
  it("issues the same pack now with payment {mode: invoice-gbp, reference: CSOAI-A50-<id>} and states no price", async () => {
    stubFetch();
    const r = await post(ctx(`${EP}?commissioned_by=${encodeURIComponent("Acme Design Ltd")}&invoice=gbp`, {}, { method: "POST", headers: { "content-type": "image/png" }, body: PLAIN_PNG }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.mode).toBe("invoice-gbp");
    expect(b.payment).toMatchObject({ mode: "invoice-gbp", commissioned_by: "Acme Design Ltd", currency: "GBP" });
    expect(b.payment.reference).toMatch(/^CSOAI-A50-[0-9A-F]{10}$/);
    expect(b.card.payload.payment.reference).toBe(b.payment.reference);
    expect(b.card.tags).toContain("rail:invoice-gbp");
    expect(b.invoice.amount).toBeNull();
    expect(b.invoice.issuer).toMatch(/16939677/);
    expect(b.card.payload.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.card.payload.law.fine_ceiling).toMatch(/15,000,000|3%/);
    expect(b.bytes).toBeLessThanOrEqual(3072);
    const s = JSON.stringify(b);
    expect(s).not.toMatch(FORBIDDEN);
    expect(s).not.toMatch(/USD|\$\s?\d|£\s?\d|price/i);
  });

  it("refuses invoice=gbp without an organisation", async () => {
    stubFetch();
    expect((await get(ctx(`${EP}?invoice=gbp&url=https://cdn.example/plain.png`))).status).toBe(400);
  });

  it("signs the leaf with Ed25519 when the Pages key is present, and the signature verifies against the raw public key", async () => {
    stubFetch();
    const { pkcs8b64, pubHex } = await testKey();
    const r = await get(ctx(`${EP}?commissioned_by=Acme&invoice=gbp&url=https://cdn.example/C.jpg`, { BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.signed).toBe(true);
    expect(b.card.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(b.card.unmeasured).not.toContain("sig_ed25519");
    const v = await verifyLeaf(b.card.payload, b.card.sha256, b.card.sig_ed25519, pubHex);
    expect(v).toEqual({ sha_ok: true, sig_ok: true });
    expect(b.card.payload.fetched_at).toBe(b.card.as_of);
    expect(b.card.payload.checked.find((c: { method: string }) => c.method === "c2pa.claim-signature").result).toBe("VALID");
  });
});
