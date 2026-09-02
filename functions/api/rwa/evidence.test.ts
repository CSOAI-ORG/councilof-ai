import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CSOAI_LID } from "../_x402";
import { onRequestGet as evidence, VERDICT_RE, LSF, decodeHexDomain, decodeCurrency, fitToCap, toPreview, ATTESTS } from "./evidence";
import { ESTATE_PAY_TO } from "../_x402_config";
import { canonicalBytes, PAYLOAD_CAP_BYTES } from "../../_lib/cardSign";

const ORIGIN = "https://councilof.ai";
const ADDR = "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

// The free leaf the eater staged for the same asset — the paid card must carry the same schema.
const staged = JSON.parse(readFileSync(new URL("../../../public/interop/xrpl-swift-eater-2026-09/card-xrpl-bbrl-unsigned.json", import.meta.url), "utf8"));

const TOML = `[[ACCOUNTS]]\naddress = "${ADDR}"\n[[TOKENS]]\nissuer = "${ADDR}"\n`;
const HTML = "<!doctype html><html></html>";

function stub(opts: { toml?: string; rpcDown?: boolean; facilitator?: boolean } = {}) {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    const path = url.pathname;
    if (url.host === "f.example") return new Response(JSON.stringify(path.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base" }));
    if (url.host === "xrplcluster.com") {
      if (opts.rpcDown) return new Response("{}", { status: 503 });
      const method = JSON.parse(String(init?.body)).method;
      if (method === "account_info") return new Response(JSON.stringify({ result: { status: "success", ledger_index: 106707163, account_data: { Flags: 8388608, Domain: "746F6B656E732E6272617A6163726970746F2E636F6D2E6272", Sequence: 90545243 } } }));
      return new Response(JSON.stringify({ result: { status: "success", ledger_index: 106707163, obligations: { "4242524C00000000000000000000000000000000": "40156575.17639076" } } }));
    }
    if (url.host.endsWith("ripple.com")) return new Response("{}", { status: 503 });
    if (path === "/api/xrpl") return new Response(JSON.stringify({ as_of: "2026-09-02T07:13:27Z", assets: [{ symbol: "BBRL", issuer: "Braza Bank", issuer_address: ADDR, holders: 40, supply: 65399060, verified_via: "Bidirectional domain match", unmeasured: [], sig_ed25519: "aa" }] }));
    if (path === "/.well-known/xrp-ledger.toml") return new Response(opts.toml ?? TOML, { headers: { "content-type": opts.toml === HTML ? "text/html" : "text/plain" } });
    if (url.host === "api.xrpscan.com") return new Response(JSON.stringify([{ account: ADDR, name: "BBRL", domain: "bbrl.braza.com.br" }]), { headers: { "content-type": "application/json" } });
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("/api/rwa/evidence — helpers match the eater", () => {
  it("decodes hex Domain and 40-hex currency codes like xrpl_swift_eater.py", () => {
    expect(decodeHexDomain("746F6B656E732E6272617A6163726970746F2E636F6D2E6272")).toBe("tokens.brazacripto.com.br");
    expect(decodeCurrency("4242524C00000000000000000000000000000000")).toBe("BBRL");
    expect(decodeCurrency("USD")).toBe("USD");
    expect(LSF.require_auth).toBe(0x00040000);
    expect(LSF.global_freeze).toBe(0x00400000);
  });
  it("the attests line and every fixed string pass the eater's verdict gate", () => {
    expect(VERDICT_RE.test(ATTESTS)).toBe(false);
    expect(VERDICT_RE.test("measured_at")).toBe(true); // why the field is fetched_at, as on the free leaf
  });
});

describe("/api/rwa/evidence — doors", () => {
  it("400 without a usable asset; 404 for an asset the free reader does not list (no payment taken)", async () => {
    stub();
    expect((await evidence(ctx("/api/rwa/evidence"))).status).toBe(400);
    const r = await evidence(ctx("/api/rwa/evidence?asset=NOPE&preview=1"));
    expect(r.status).toBe(404);
    expect((await r.json()).known_symbols).toEqual(["BBRL"]);
  });

  it("402: the same accepts entry as request-attestation, payTo from ESTATE_PAY_TO, preview pointer, no verdict words", async () => {
    stub();
    const r = await evidence(ctx("/api/rwa/evidence?asset=BBRL"));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.accepts).toHaveLength(1);
    expect(b.accepts[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: ESTATE_PAY_TO, asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", extra: { name: "USD Coin", version: "2" } });
    expect(b.csoai.free_preview).toBe(`${ORIGIN}/api/rwa/evidence?asset=BBRL&preview=1`);
    expect(b.csoai.free_reader).toBe(`${ORIGIN}/api/xrpl`);
    // The board lid is a fixed, reviewed sentence carried verbatim in EVERY 402
    // challenge (owner ruling, PR #1159). It contains "22 axes measured" — a board
    // count, not a verdict about this asset — and it ends "not a certificate".
    // Scan the whole body with ONLY that constant excised, so any other verdict
    // word anywhere in the response still fails this test.
    const bodyWithoutLid = JSON.stringify(b).split(JSON.stringify(CSOAI_LID).slice(1, -1)).join("");
    expect(VERDICT_RE.test(bodyWithoutLid)).toBe(false);
  });

  it("preview is free: unsigned state, no signature, no raw-fetch hashes, same payload keys as the staged free leaf", async () => {
    stub();
    const r = await evidence(ctx("/api/rwa/evidence?asset=BBRL&preview=1"));
    expect(r.status).toBe(200);
    const { card } = await r.json();
    expect(card.preview).toBe(true);
    expect(card).not.toHaveProperty("sig_ed25519");
    expect(card).not.toHaveProperty("sha256");
    expect(card.payload).not.toHaveProperty("inputs_sha256");
    expect(card.payload.toml).not.toHaveProperty("sha256");
    expect(card.payload.directory).not.toHaveProperty("sha256");
    expect(card.payload).toMatchObject({ kind: "csoai.eater.xrpl-issuer/0.1", state: "PROBED", symbol: "BBRL", two_way_domain: "PASS", account_root: { flags: 8388608, domain: "tokens.brazacripto.com.br", flags_decoded: { default_ripple: true, require_auth: false, global_freeze: false, no_freeze: false } }, onchain_obligation: { currency_decoded: "BBRL", value: "40156575.17639076" } });
    // Same payload schema as the staged free leaf (inputs_sha256 is the one key a preview withholds).
    const stagedKeys = Object.keys(staged.payload).sort();
    const ours = Object.keys(card.payload).sort();
    for (const k of stagedKeys.filter((k) => k !== "inputs_sha256")) expect(ours, `missing eater key ${k}`).toContain(k);
    expect(ours.filter((k) => !stagedKeys.includes(k))).toEqual(["attests"]);
  });

  it("paid: ONE canonical card-v0 (public.notice), ≤3072 bytes, sha256 = sha256(canonical payload), unsigned declared without a key, settle echoed", async () => {
    stub({ facilitator: true });
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await evidence(ctx("/api/rwa/evidence?asset=" + ADDR, { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": hdr }));
    const text = await r.text();
    expect(r.status, text).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    expect(r.headers.get("x-csoai-signed")).toBe("false");
    const card = JSON.parse(text);
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(PAYLOAD_CAP_BYTES);
    expect(text).toBe(new TextDecoder().decode(canonicalBytes(card))); // body IS the canonical bytes
    expect(card.schema).toBe(staged.schema);
    expect(card.surface).toBe("public.notice");
    expect(card.sig_ed25519).toBeNull();
    expect(card.unmeasured.some((u: string) => u.startsWith("sig_ed25519"))).toBe(true);
    expect(card.payload.inputs_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(card.payload.toml.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(card.source_urls.every((u: string) => u.startsWith("https://"))).toBe(true);
    expect(VERDICT_RE.test(text)).toBe(false);
    const sha = [...new Uint8Array(await crypto.subtle.digest("SHA-256", canonicalBytes(card.payload)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(card.sha256).toBe(sha);
    expect(card.subject).toMatch(/^XRPL BBRL \(Braza Bank\) two-way domain PASS/);
  });

  it("paid + Pages key: signs under #board-attestation-1 and a stranger verifies with the raw public key", async () => {
    stub({ facilitator: true });
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pkcs8 = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey))));
    const hdr = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
    const r = await evidence(ctx("/api/rwa/evidence?asset=BBRL", { X402_FACILITATOR_URL: "https://f.example", BOARD_SIGN_KEY_PKCS8_B64: pkcs8 }, { "x-payment": hdr }));
    const card = await r.json();
    expect(card.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(card.sig_ed25519).toMatch(/^[0-9a-f]{128}$/);
    const sig = Uint8Array.from(card.sig_ed25519.match(/../g).map((h: string) => parseInt(h, 16)));
    expect(await crypto.subtle.verify({ name: "Ed25519" }, kp.publicKey, sig, canonicalBytes(card.payload))).toBe(true);
    expect(card.tags).toContain("signed");
  });

  it("three-state: HTML at the TOML URL is FAIL; unreachable RPC is UNMEASURED state, never FAIL", async () => {
    stub({ toml: HTML });
    let card = (await (await evidence(ctx("/api/rwa/evidence?asset=BBRL&preview=1"))).json()).card;
    expect(card.payload.two_way_domain).toBe("FAIL");
    expect(card.payload.absent).toContain("TOML body at .well-known/xrp-ledger.toml");
    stub({ rpcDown: true });
    card = (await (await evidence(ctx("/api/rwa/evidence?asset=BBRL&preview=1"))).json()).card;
    expect(card.payload.state).toBe("UNMEASURED");
    expect(card.payload.two_way_domain).toBe("UNCHECKABLE");
    expect(card.payload.account_root).toBeNull();
  });

  it("fitToCap drops carriers, never facts; toPreview never leaks a hash", () => {
    const big = { checked: ["x".repeat(4000)], account_root: { domain_hex: "aa", flags: 1 }, reader: { url: "u", as_of: "t", holders: 1, sig_ed25519_present: true, verified_via: "v" }, onchain_obligation: { value: "1" } };
    const p = fitToCap(big);
    expect(canonicalBytes(p).byteLength).toBeLessThanOrEqual(PAYLOAD_CAP_BYTES);
    expect(p.onchain_obligation).toEqual({ value: "1" });
    const pv = toPreview({ sha256: "a", sig_ed25519: "b", payload: { inputs_sha256: "c", toml: { sha256: "d", http: 200 } } });
    expect(JSON.stringify(pv)).not.toMatch(/"sha256":|"inputs_sha256":|"sig_ed25519":/);
  });
});
