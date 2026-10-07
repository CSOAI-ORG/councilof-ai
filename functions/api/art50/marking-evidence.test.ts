import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as get, onRequestPost as post, KIND, SURFACE } from "./marking-evidence";
import { ART50_2_TEXT, ART111_4_TEXT } from "../../_lib/art50Law";
import { verifyLeaf } from "../../_lib/cardSign";
import { ESTATE_PAY_TO } from "../_x402_config";
import { ART50_SCOPE, ART50_SCOPE_SIGNED } from "../../_lib/art50Scope";
import { verifyCardV0 } from "../../_lib/cardV0Verify";

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

  it("carries the verbatim Article 50(2) text, its sha256, the EUR-Lex URLs and the dates with their verbatim basis — and no fine ceiling", async () => {
    stubFetch();
    const b = await (await get(ctx(`${EP}?preview=1&url=https://cdn.example/plain.png`))).json();
    expect(b.law.text).toBe(ART50_2_TEXT);
    expect(b.law.text).toMatch(/^Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure/);
    const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ART50_2_TEXT)))].map((x) => x.toString(16).padStart(2, "0")).join("");
    expect(b.law.text_sha256).toBe(sha);
    expect(b.law.sources.eur_lex).toBe("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng");
    expect(b.law.sources.eur_lex_2026_1744).toBe("https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng");
    expect(b.law.dates).toMatchObject({ applies_from: "2026-08-02", pre_existing_systems_until: "2026-12-02" });
    // The 2 Dec date rests on the OJ text (Art 111(4), added by 2026/1744 Art 1(39)(b)), never on a
    // Commission FAQ nobody re-read. The verbatim words ride along so the scope is the law's, not ours.
    expect(b.law.dates.pre_existing_basis).toBe(
      "Article 111(4), Regulation (EU) 2024/1689, as added by Regulation (EU) 2026/1744 Article 1(39)(b) (OJ L, 24.7.2026; in force 27 July 2026)",
    );
    expect(b.law.dates.pre_existing_text).toBe(ART111_4_TEXT);
    expect(ART111_4_TEXT).toMatch(/placed on the market before 2 August 2026 shall take the necessary steps in order to comply with Article 50\(2\) by 2 December 2026\.$/);
    expect(b.law.sources.commission_faq).toBeUndefined();
    expect(JSON.stringify(b.law)).not.toMatch(/FAQ|owner brief|not re-read/i);
    // No penalty figure beside a detection result (dropped 2026-09-30; Art 99(6)/(6a) make any single figure incomplete).
    expect(b.law.fine_ceiling).toBeUndefined();
    expect(JSON.stringify(b)).not.toMatch(/15[ ,.]?000[ ,.]?000|99\(4\)|turnover/);
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
  it("rejects missing input before preview or any facilitator call", async () => {
    const fetchSpy = vi.fn(async () => new Response("unexpected network call", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    const payment = btoa(
      JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }),
    );

    const paid = await get(
      ctx(`${EP}?vendor=openai`, { X402_FACILITATOR_URL: "https://f.example" }, { headers: { "x-payment": payment } }),
    );
    expect(paid.status).toBe(400);
    expect((await paid.json()).reason).toMatch(/before presenting payment/);
    expect(fetchSpy).not.toHaveBeenCalled();

    const preview = await get(ctx(`${EP}?vendor=openai&preview=1`));
    expect(preview.status).toBe(400);
    expect((await preview.json()).measurement).toBeUndefined();
  });

  it("rejects empty or malformed base64 before x402 settlement or invoice issuance", async () => {
    const fetchSpy = vi.fn(async () => new Response("unexpected network call", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    const payment = btoa(
      JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }),
    );

    const paid = await post(
      ctx(`${EP}`, { X402_FACILITATOR_URL: "https://f.example" }, {
        method: "POST",
        headers: { "content-type": "application/json", "x-payment": payment },
        body: JSON.stringify({ bytes_b64: "   " }),
      }),
    );
    expect(paid.status).toBe(400);
    expect((await paid.json()).reason).toMatch(/empty body/);

    const invoice = await post(
      ctx(`${EP}?commissioned_by=Acme&invoice=gbp`, {}, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manifest_b64: "   " }),
      }),
    );
    expect(invoice.status).toBe(400);
    expect(await invoice.json()).toMatchObject({
      error: "uncheckable",
      reason: expect.stringMatching(/empty body/),
    });

    const malformed = await post(
      ctx(`${EP}`, { X402_FACILITATOR_URL: "https://f.example" }, {
        method: "POST",
        headers: { "content-type": "application/json", "x-payment": payment },
        body: JSON.stringify({ bytes_b64: "not!base64" }),
      }),
    );
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).reason).toBe("bytes_b64 not decodable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

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

  it("a presented payment with no url/bytes never reaches the facilitator", async () => {
    let facilitatorCalls = 0;
    stubFetch(() => {
      facilitatorCalls += 1;
      return new Response(JSON.stringify({ isValid: true, success: true, transaction: "0xtx" }));
    });
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await get(ctx(EP, { X402_FACILITATOR_URL: "https://f.example" }, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(400);
    expect((await r.json()).reason).toMatch(/before presenting payment/);
    expect(facilitatorCalls).toBe(0);
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
    expect(b.card.source_urls).toContain("https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng");
    expect(b.card.payload.law).toMatchObject({ pre_existing_until: "2026-12-02", pre_existing_basis: expect.stringMatching(/^Art 111\(4\).*2026\/1744 Art 1\(39\)\(b\)$/) });
    expect(b.card.payload.law.fine_ceiling).toBeUndefined();
    expect(b.card.sig_ed25519).toBeNull();
    expect(b.card.unmeasured).toEqual(expect.arrayContaining(["root_inclusion", "sig_ed25519", "watermark.synthid", "c2pa.chain-trust"]));
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(JSON.stringify(b.card)).not.toMatch(FORBIDDEN);
  });
});

describe("invoice rail — ?commissioned_by=<org>&invoice=gbp", () => {
  // INVOICE = A QUOTATION UNTIL PAID (7 Oct 2026, sell organ SG-04 + M1). Before this date the
  // invoice rail signed and returned the pack at once and counted an issuance, so any caller could
  // skip the paid door by typing an organisation name. Now: the free measurement and a recorded
  // reference; the signed pack only after the owner writes the paid mark.
  const kvStore = () => {
    const store = new Map<string, string>();
    return { store, get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
  };

  it("returns the unsigned measurement and a recorded reference, never the signed pack, and states no price", async () => {
    stubFetch();
    const kv = kvStore();
    const r = await post(ctx(`${EP}?commissioned_by=${encodeURIComponent("Acme Design Ltd")}&invoice=gbp`, { REVENUE_KV: kv }, { method: "POST", headers: { "content-type": "image/png" }, body: PLAIN_PNG }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.mode).toBe("invoice-gbp");
    expect(b.state).toBe("AWAITING_PAYMENT");
    expect(b.signed).toBe(false);
    expect(b.card).toBeNull();
    expect(JSON.stringify(b)).not.toMatch(/sig_ed25519/);
    expect(b.payment).toMatchObject({ mode: "invoice-gbp", commissioned_by: "Acme Design Ltd", currency: "GBP", state: "AWAITING_PAYMENT" });
    expect(b.payment.reference).toMatch(/^CSOAI-A50-[0-9A-F]{10}$/);
    expect(b.measurement.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.invoice.amount).toBeNull();
    expect(b.invoice.issuer).toMatch(/16939677/);
    // the per-door wording: this door DID record the request, and says what it holds
    expect(b.invoice.recorded).toBe(true);
    expect(b.invoice.recorded_under).toBe(`REVENUE_KV art50-invoice:${b.payment.reference}`);
    expect(b.invoice.recorded_note).toMatch(/^Recorded under reference CSOAI-A50-/);
    expect(b.invoice.recorded_note).toMatch(/No contact details are stored/);
    expect(JSON.stringify(b)).not.toMatch(/No datastore is bound|NOT recorded/);
    expect(b.release.how).toContain("invoice=gbp");
    // the buyer is told, before paying, that a paid reference holds no secret
    expect(b.release.who).toMatch(/any request that names this organisation and this output/);
    expect(b.release.who).toMatch(/holds no secret/);
    const rec = JSON.parse(kv.store.get(`art50-invoice:${b.payment.reference}`) ?? "null");
    expect(rec).toMatchObject({ reference: b.payment.reference, commissioned_by: "Acme Design Ltd", state: "AWAITING_PAYMENT", contact: null, subject_sha256: b.measurement.subject.sha256 });
    // counted as an invoice request, never as an issuance
    expect(kv.store.get("count:invoice_requested")).toBe("1");
    expect(kv.store.has("count:issuances")).toBe(false);
    expect([...kv.store.keys()].some((k) => k.startsWith("art50:"))).toBe(false);
    const s = JSON.stringify(b);
    expect(s).not.toMatch(FORBIDDEN);
    expect(s).not.toMatch(/USD|\$\s?\d|£\s?\d|price/i);
  });

  it("the same organisation and bytes find the same reference, recorded and counted once", async () => {
    stubFetch();
    const kv = kvStore();
    const ask = () => get(ctx(`${EP}?commissioned_by=Acme&invoice=gbp&url=https://cdn.example/plain.png`, { REVENUE_KV: kv }));
    const a = await (await ask()).json();
    const b = await (await ask()).json();
    expect(b.payment.reference).toBe(a.payment.reference);
    expect(kv.store.get("count:invoice_requested")).toBe("1");
    // the organisation's case does not make a second reference; another output does
    const c = await (await get(ctx(`${EP}?commissioned_by=ACME&invoice=gbp&url=https://cdn.example/plain.png`, { REVENUE_KV: kv }))).json();
    expect(c.payment.reference).toBe(a.payment.reference);
    const d = await (await get(ctx(`${EP}?commissioned_by=Acme&invoice=gbp&url=https://cdn.example/C.jpg`, { REVENUE_KV: kv }))).json();
    expect(d.payment.reference).not.toBe(a.payment.reference);
    expect(kv.store.get("count:invoice_requested")).toBe("2");
  });

  it("without a store it says the request was NOT recorded, and still releases nothing", async () => {
    stubFetch();
    const b = await (await get(ctx(`${EP}?commissioned_by=Acme&invoice=gbp&url=https://cdn.example/plain.png`))).json();
    expect(b.signed).toBe(false);
    expect(b.card).toBeNull();
    expect(b.invoice.recorded).toBe(false);
    expect(b.invoice.recorded_note).toMatch(/NOT recorded/);
    expect(b.invoice.recorded_note).not.toMatch(/No datastore is bound/);
  });

  it("refuses invoice=gbp without an organisation", async () => {
    stubFetch();
    expect((await get(ctx(`${EP}?invoice=gbp&url=https://cdn.example/plain.png`))).status).toBe(400);
  });

  it("releases the signed pack only after the owner marks the reference paid, and counts the issuance once", async () => {
    stubFetch();
    const { pkcs8b64, pubHex } = await testKey();
    const kv = kvStore();
    const env = { BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, REVENUE_KV: kv };
    const ask = async () => (await get(ctx(`${EP}?commissioned_by=Acme&invoice=gbp&url=https://cdn.example/C.jpg`, env))).json();
    const before = await ask();
    expect(before.signed).toBe(false);
    expect(before.card).toBeNull();
    const ref = before.payment.reference;
    // the owner, and only the owner, writes the paid mark (Cloudflare dashboard → REVENUE_KV)
    kv.store.set(`art50-invoice-paid:${ref}`, "INV-0001 paid");
    const b = await ask();
    expect(b.state).toBe("RELEASED");
    expect(b.signed).toBe(true);
    expect(b.payment).toMatchObject({ mode: "invoice-gbp", reference: ref, state: "MARKED_PAID" });
    expect(b.card.payload.payment.reference).toBe(ref);
    expect(b.card.tags).toContain("rail:invoice-gbp");
    expect(b.card.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(b.card.unmeasured).not.toContain("sig_ed25519");
    const v = await verifyLeaf(b.card.payload, b.card.sha256, b.card.sig_ed25519, pubHex);
    expect(v).toEqual({ sha_ok: true, sig_ok: true });
    expect(b.card.payload.fetched_at).toBe(b.card.as_of);
    expect(b.card.payload.checked.find((c: { method: string }) => c.method === "c2pa.claim-signature").result).toBe("VALID");
    expect(b.card.payload.law.fine_ceiling).toBeUndefined();
    expect(b.card.payload.law.pre_existing_basis).toMatch(/Art 111\(4\)/);
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(JSON.stringify(b)).not.toContain("INV-0001"); // the owner's mark is read, never echoed
    expect(kv.store.get("count:issuances")).toBe("1");
    expect(JSON.parse(kv.store.get(`art50-invoice:${ref}`)!)).toMatchObject({ state: "RELEASED", leaf_sha256: b.card.sha256 });
    // asking again re-delivers the paid pack; it is not a second sale
    const again = await ask();
    expect(again.signed).toBe(true);
    expect(kv.store.get("count:issuances")).toBe("1");
    expect(kv.store.get("count:invoice_requested")).toBe("1");
  });
});

/**
 * SCOPE IN EVERY PACK (owner-approved wording, growth plan Gate 0, 7 Oct 2026): the pack detects C2PA
 * and IPTC metadata only; NOT_DETECTED does not mean "unmarked" (Art 50(2) is technology-neutral);
 * CSOAI is a C2PA member. And the paid route end to end with a mocked facilitator: 402 → settle →
 * the signed pack → the settlement recorded as SELF for an X402_SELF_WALLETS payer → the card
 * verifies under the same verdict the free checker uses.
 */
describe("scope — every pack says what it can and cannot see", () => {
  const SELF = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
  const kv = () => {
    const store = new Map<string, string>();
    return { store, get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
  };

  it("the scope text itself: metadata only, NOT_DETECTED is not 'unmarked', C2PA membership disclosed", () => {
    expect(ART50_SCOPE.detects).toMatch(/^C2PA and IPTC metadata only/);
    expect(ART50_SCOPE.not_detected).toMatch(/does not mean the output is unmarked/);
    expect(ART50_SCOPE.not_detected).toMatch(/technology-neutral/);
    expect(ART50_SCOPE.disclosure).toMatch(/CSOAI is a member of the C2PA/);
    expect(ART50_SCOPE_SIGNED.disclosure).toBe("CSOAI is a C2PA member");
    expect(JSON.stringify(ART50_SCOPE)).not.toMatch(FORBIDDEN);
  });

  it("the free preview carries the scope beside a NOT_DETECTED result", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?preview=1&url=https://cdn.example/plain.png`));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.scope).toEqual(ART50_SCOPE);
    expect(b.measurement.checked.find((c: { method: string }) => c.method === "c2pa.manifest-store").result).toBe("NOT_DETECTED");
  });

  it("the 402 carries the scope before anyone pays", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?url=https://cdn.example/plain.png`));
    expect(r.status).toBe(402);
    const b = await r.json();
    expect(b.csoai.scope).toEqual(ART50_SCOPE);
    expect(b.resource.description).toMatch(/C2PA and IPTC metadata only/);
    expect(b.resource.description).toMatch(/CSOAI is a C2PA member/);
  });

  it("paid end to end (mocked facilitator): signed pack with scope in the leaf, self payer recorded as self, card verifies", async () => {
    let settles = 0;
    stubFetch((p) => {
      if (p.endsWith("/settle")) settles += 1;
      return new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xselftest", network: "base", payer: SELF }));
    });
    const { pkcs8b64, pubHex } = await testKey();
    const store = kv();
    const env = { X402_FACILITATOR_URL: "https://f.example", X402_SELF_WALLETS: SELF, BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, REVENUE_KV: store };
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await get(ctx(`${EP}?url=https://cdn.example/plain.png`, env, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(200);
    expect(settles).toBe(1);
    const b = await r.json();
    // the pack and the signed leaf both state the scope
    expect(b.scope).toEqual(ART50_SCOPE);
    expect(b.card.payload.scope).toEqual(ART50_SCOPE_SIGNED);
    expect(b.card.payload.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(b.signed).toBe(true);
    expect(b.verify).toBe(`${ORIGIN}/gspc-verify`);
    expect(JSON.stringify(b.card)).not.toMatch(FORBIDDEN);
    // the settlement is recorded, and as the estate paying itself (never a buyer, never revenue)
    const rec = JSON.parse(store.store.get("settled:tx:0xselftest") ?? "null");
    expect(rec).toMatchObject({ transaction: "0xselftest", self: true });
    expect(rec.funding_class).not.toBe("UNKNOWN");
    // and the delivered card verifies under the shared card-v0 verdict (the throwaway key stands in
    // for the pinned board key, which this test does not hold)
    const v = await verifyCardV0(b.card, JSON.stringify(b.card), [{ id: "did:web:csoai.org#board-attestation-1", hex: pubHex }]);
    expect(v.state).toBe("VALID");
    // under the real pinned key a throwaway signature is a positive INVALID, never UNCHECKABLE
    const pinned = await verifyCardV0(b.card, JSON.stringify(b.card));
    expect(pinned.state).toBe("INVALID");
    expect(pinned.reasons).toEqual(["signature_invalid"]);
  });
});

/**
 * SCOPE IN EVERY PACK (owner-approved wording, growth plan Gate 0, 7 Oct 2026): the pack detects C2PA
 * and IPTC metadata only; NOT_DETECTED does not mean "unmarked" (Art 50(2) is technology-neutral);
 * CSOAI is a C2PA member. And the paid route end to end with a mocked facilitator: 402 → settle →
 * the signed pack → the settlement recorded as SELF for an X402_SELF_WALLETS payer → the card
 * verifies under the same verdict the free checker uses.
 */
describe("scope — every pack says what it can and cannot see", () => {
  const SELF = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
  const kv = () => {
    const store = new Map<string, string>();
    return { store, get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
  };

  it("the scope text itself: metadata only, NOT_DETECTED is not 'unmarked', C2PA membership disclosed", () => {
    expect(ART50_SCOPE.detects).toMatch(/^C2PA and IPTC metadata only/);
    expect(ART50_SCOPE.not_detected).toMatch(/does not mean the output is unmarked/);
    expect(ART50_SCOPE.not_detected).toMatch(/technology-neutral/);
    expect(ART50_SCOPE.disclosure).toMatch(/CSOAI is a member of the C2PA/);
    expect(ART50_SCOPE_SIGNED.disclosure).toBe("CSOAI is a C2PA member");
    expect(JSON.stringify(ART50_SCOPE)).not.toMatch(FORBIDDEN);
  });

  it("the free preview carries the scope beside a NOT_DETECTED result", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?preview=1&url=https://cdn.example/plain.png`));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.scope).toEqual(ART50_SCOPE);
    expect(b.measurement.checked.find((c: { method: string }) => c.method === "c2pa.manifest-store").result).toBe("NOT_DETECTED");
  });

  it("the 402 carries the scope before anyone pays", async () => {
    stubFetch();
    const r = await get(ctx(`${EP}?url=https://cdn.example/plain.png`));
    expect(r.status).toBe(402);
    const b = await r.json();
    expect(b.csoai.scope).toEqual(ART50_SCOPE);
    expect(b.resource.description).toMatch(/C2PA and IPTC metadata only/);
    expect(b.resource.description).toMatch(/CSOAI is a C2PA member/);
  });

  it("paid end to end (mocked facilitator): signed pack with scope in the leaf, self payer recorded as self, card verifies", async () => {
    let settles = 0;
    stubFetch((p) => {
      if (p.endsWith("/settle")) settles += 1;
      return new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xselftest", network: "base", payer: SELF }));
    });
    const { pkcs8b64, pubHex } = await testKey();
    const store = kv();
    const env = { X402_FACILITATOR_URL: "https://f.example", X402_SELF_WALLETS: SELF, BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, REVENUE_KV: store };
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await get(ctx(`${EP}?url=https://cdn.example/plain.png`, env, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(200);
    expect(settles).toBe(1);
    const b = await r.json();
    // the pack and the signed leaf both state the scope
    expect(b.scope).toEqual(ART50_SCOPE);
    expect(b.card.payload.scope).toEqual(ART50_SCOPE_SIGNED);
    expect(b.card.payload.statements).toContain("marking not detected by method c2pa.manifest-store");
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(b.signed).toBe(true);
    expect(b.verify).toBe(`${ORIGIN}/gspc-verify`);
    expect(JSON.stringify(b.card)).not.toMatch(FORBIDDEN);
    // the settlement is recorded, and as the estate paying itself (never a buyer, never revenue)
    const rec = JSON.parse(store.store.get("settled:tx:0xselftest") ?? "null");
    expect(rec).toMatchObject({ transaction: "0xselftest", self: true });
    expect(rec.funding_class).not.toBe("UNKNOWN");
    // and the delivered card verifies under the shared card-v0 verdict (the throwaway key stands in
    // for the pinned board key, which this test does not hold)
    const v = await verifyCardV0(b.card, JSON.stringify(b.card), [{ id: "did:web:csoai.org#board-attestation-1", hex: pubHex }]);
    expect(v.state).toBe("VALID");
    // under the real pinned key a throwaway signature is a positive INVALID, never UNCHECKABLE
    const pinned = await verifyCardV0(b.card, JSON.stringify(b.card));
    expect(pinned.state).toBe("INVALID");
    expect(pinned.reasons).toEqual(["signature_invalid"]);
  });
});
