import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost as post } from "./marking-evidence";
import { extractManifestStore, parseJumbf } from "../../_lib/c2pa";
import { onRequest as mcp } from "../../mcp/[[path]]";

/**
 * The four shapes measured LOCALLY against this handler on master 09a2394c9b (20 Nov 2026, never in
 * production), each sent to the FREE preview at the 20 MiB input cap:
 *   - 2,550,256 JUMBF boxes: the preview answered 200 "DETECTED" after ~4 s and ~870 MB of heap;
 *   - a claim declaring 20,971,346 empty CBOR arrays: 200 "DETECTED" after ~3.6 s and ~1 GB;
 *   - 600,000 nested superboxes: an uncaught RangeError (stack overflow) out of the handler;
 *   - a decodable ~20 MiB claim: an uncaught RangeError from the Sig_structure encoder's spread.
 * A Workers isolate is limited to 128 MB. With the parser budget each is answered within it:
 * the first three as UNCHECKABLE with a reason (never NOT_DETECTED, never a partial positive), the
 * fourth by reaching the signature check. The MCP tool art50_marking_evidence forwards to this
 * route, so its preview and its paid call get the same answers.
 */
const ORIGIN = "https://councilof.ai";
const EP = "/api/art50/marking-evidence";
const MAX = 20 * 1024 * 1024;
const te = new TextEncoder();
const C2PA_UUID = Uint8Array.from("6332706100110010800000aa00389b71".match(/../g)!.map((h) => parseInt(h, 16)));
const JUMB = te.encode("jumb");
const FREE = te.encode("free");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jumd(uuid: Uint8Array, label: string | null): Uint8Array {
  const lab = label ? te.encode(`${label}\0`) : new Uint8Array(0);
  const out = new Uint8Array(25 + lab.length);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(te.encode("jumd"), 4);
  out.set(uuid, 8);
  out[24] = label ? 3 : 0;
  out.set(lab, 25);
  return out;
}
function box(type: string, ...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(8 + parts.reduce((n, p) => n + p.length, 0));
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(te.encode(type), 4);
  let o = 8;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** One c2pa superbox holding 255 superboxes of 10,000 empty `free` boxes each. */
function boxFlood(): Uint8Array {
  const top = jumd(C2PA_UUID, "c2pa");
  const child = jumd(new Uint8Array(16), null);
  const childLen = 8 + child.length + 10_000 * 8;
  const b = new Uint8Array(8 + top.length + 255 * childLen);
  const dv = new DataView(b.buffer);
  dv.setUint32(0, b.length);
  b.set(JUMB, 4);
  b.set(top, 8);
  for (let k = 0, o = 8 + top.length; k < 255; k++, o += childLen) {
    dv.setUint32(o, childLen);
    b.set(JUMB, o + 4);
    b.set(child, o + 8);
    for (let p = o + 8 + child.length; p < o + childLen; p += 8) {
      dv.setUint32(p, 8);
      b.set(FREE, p + 4);
    }
  }
  return b;
}

/** A c2pa.claim box whose CBOR array head declares as many empty arrays as fill the 20 MiB cap. */
function wideClaim(): { store: Uint8Array; declared: number } {
  const top = jumd(C2PA_UUID, "c2pa");
  const manifest = jumd(new Uint8Array(16), "urn:uuid:00000000-0000-4000-8000-000000000000");
  const claim = jumd(new Uint8Array(16), "c2pa.claim");
  const declared = MAX - (8 + top.length + 8 + manifest.length + 8 + claim.length + 8 + 5);
  const cbor = new Uint8Array(5 + declared).fill(0x80);
  cbor[0] = 0x9a;
  new DataView(cbor.buffer).setUint32(1, declared);
  return { store: box("jumb", top, box("jumb", manifest, box("jumb", claim, box("cbor", cbor)))), declared };
}

/** `levels` nested superboxes: the outermost labelled c2pa, every inner one unlabelled. */
function deepNest(levels: number): Uint8Array {
  const top = jumd(C2PA_UUID, "c2pa");
  const inner = jumd(new Uint8Array(16), null);
  const b = new Uint8Array(8 + top.length + (levels - 1) * (8 + inner.length) + 8);
  const dv = new DataView(b.buffer);
  dv.setUint32(0, b.length);
  b.set(JUMB, 4);
  b.set(top, 8);
  let o = 8 + top.length;
  for (let k = 1; k < levels; k++, o += 8 + inner.length) {
    dv.setUint32(o, b.length - o);
    b.set(JUMB, o + 4);
    b.set(inner, o + 8);
  }
  dv.setUint32(o, 8);
  b.set(FREE, o + 4);
  return b;
}

/** A decodable claim map carrying a byte string to the cap, beside c2pa-rs C.jpg's real COSE_Sign1. */
function bigClaim(): Uint8Array {
  const jpg = new Uint8Array(readFileSync(resolve(__dirname, "../../../fixtures/c2pa/c2pa-rs-C.jpg")));
  const active = parseJumbf(extractManifestStore(jpg).store!)[0].children.filter((x) => x.type === "jumb").at(-1)!;
  const signature = active.children.find((x) => x.label === "c2pa.signature")!.full;
  const top = jumd(C2PA_UUID, "c2pa");
  const manifest = jumd(new Uint8Array(16), "urn:uuid:00000000-0000-4000-8000-000000000001");
  const claim = jumd(new Uint8Array(16), "c2pa.claim");
  const n = MAX - (8 + top.length + 8 + manifest.length + 8 + claim.length + 8 + signature.length) - 8;
  const cbor = new Uint8Array(8 + n);
  cbor.set([0xa1, 0x61, 0x6b, 0x5a], 0); // {"k": h'…'} with a 4-byte length head
  new DataView(cbor.buffer).setUint32(4, n);
  return box("jumb", top, box("jumb", manifest, box("jumb", claim, box("cbor", cbor)), signature));
}

type Check = { method: string; result: string; note?: string };
async function preview(bytes: Uint8Array) {
  const r = await post({
    request: new Request(`${ORIGIN}${EP}?preview=1`, { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bytes }),
    env: {},
    params: {},
  } as never);
  return { status: r.status, body: await r.json() };
}
function c2paResults(measurement: { checked: Check[] }) {
  return Object.fromEntries(measurement.checked.filter((c) => c.method.startsWith("c2pa.")).map((c) => [c.method, c.result]));
}
function expectRefused(body: { measurement: { checked: Check[]; statements: string[]; gaps: Record<string, string> } }, part: RegExp) {
  expect(c2paResults(body.measurement)).toEqual({
    "c2pa.manifest-store": "UNCHECKABLE",
    "c2pa.assertion-hashes": "UNCHECKABLE",
    "c2pa.hard-binding": "UNCHECKABLE",
    "c2pa.claim-signature": "UNCHECKABLE",
  });
  expect(body.measurement.gaps["c2pa.manifest-store"]).toMatch(part);
  const said = body.measurement.statements.join(" ");
  expect(said).not.toContain("marking detected by method c2pa.manifest-store");
  expect(said).not.toContain("marking not detected by method c2pa.manifest-store");
}

describe("the free preview at the 20 MiB cap, the shapes measured on master", () => {
  it("answers 2,550,256 JUMBF boxes as UNCHECKABLE instead of walking every box", async () => {
    const bytes = boxFlood();
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX);
    const { status, body } = await preview(bytes);
    expect(status).toBe(200);
    expectRefused(body, /JUMBF boxes budget exceeded/);
  });

  it("answers a claim declaring 20,971,346 empty CBOR arrays as UNCHECKABLE before allocating them", async () => {
    const { store, declared } = wideClaim();
    expect([store.byteLength, declared]).toEqual([MAX, 20_971_346]);
    const { status, body } = await preview(store);
    expect(status).toBe(200);
    expectRefused(body, /CBOR items budget exceeded/);
  });

  it("answers 600,000 nested superboxes as UNCHECKABLE instead of overflowing the stack", async () => {
    const bytes = deepNest(600_000);
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX);
    const { status, body } = await preview(bytes);
    expect(status).toBe(200);
    expectRefused(body, /JUMBF depth budget exceeded/);
  });

  it("carries a decodable 20 MiB claim through to the signature check without a spread overflow", async () => {
    const bytes = bigClaim();
    expect(bytes.byteLength).toBe(MAX);
    const { status, body } = await preview(bytes);
    expect(status).toBe(200);
    // The claim was replaced, so the real c2pa-rs signature no longer covers it.
    expect(c2paResults(body.measurement)["c2pa.claim-signature"]).toBe("INVALID");
  });
});

describe("the MCP tool art50_marking_evidence, forwarded to this route", () => {
  const facilitator: string[] = [];
  function sameOrigin() {
    facilitator.length = 0;
    vi.stubGlobal("fetch", async (input: Request | string | URL, init?: RequestInit) => {
      const req = input instanceof Request ? input : new Request(String(input), init);
      const u = new URL(req.url);
      if (u.origin === ORIGIN && u.pathname === EP) {
        return post({ request: req, env: { X402_FACILITATOR_URL: "https://facilitator.invalid" }, params: {} } as never);
      }
      facilitator.push(req.url);
      return new Response("unexpected subrequest", { status: 500 });
    });
  }
  async function callTool(args: Record<string, unknown>) {
    const response = await mcp({
      request: new Request(`${ORIGIN}/mcp`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "art50_marking_evidence", arguments: args } }),
      }),
      env: {},
      params: {},
    } as never);
    const text = await response.text();
    const json = (response.headers.get("content-type") ?? "").includes("text/event-stream")
      ? text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("")
      : text;
    return JSON.parse(json).result as { isError: boolean; structuredContent: Record<string, any> };
  }
  const manifest_b64 = () => Buffer.from(deepNest(70)).toString("base64");

  it("delivers the free preview of an over-budget manifest as UNCHECKABLE, with the reason", async () => {
    sameOrigin();
    const r = await callTool({ manifest_b64: manifest_b64(), preview: true });
    expect(r.structuredContent.status).toBe("DELIVERED");
    expectRefused(r.structuredContent.deliverable, /JUMBF depth budget exceeded/);
    expect(facilitator).toEqual([]);
  });

  it("refuses a paid call 422 before the facilitator is reached, and delivers nothing", async () => {
    sameOrigin();
    const x_payment = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await callTool({ manifest_b64: manifest_b64(), x_payment });
    expect(r.isError).toBe(true);
    expect(r.structuredContent).toMatchObject({ status: "HTTP_422", http_status: 422, delivery_state: "NOT_DELIVERED" });
    expect(r.structuredContent.reason).toMatch(/JUMBF depth budget exceeded/);
    expect(r.structuredContent.body).toMatchObject({ error: "parser_resource_limit", state: "UNCHECKABLE", payment_taken: false });
    expect(facilitator).toEqual([]);
  });
});
