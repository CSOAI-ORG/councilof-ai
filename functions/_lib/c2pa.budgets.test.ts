import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cborDecode,
  cborEncode,
  extractManifestStore,
  inspectC2pa,
  parseJumbf,
  parseLeafCert,
} from "./c2pa";
import { measure, onRequestGet } from "../api/art50/marking-evidence";
import * as x402 from "../api/_x402";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const te = new TextEncoder();
function box(type: string, body: Uint8Array) {
  const out = new Uint8Array(body.length + 8);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(te.encode(type), 4);
  out.set(body, 8);
  return out;
}
function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
function nestedStore(depth: number) {
  const desc = box("jumd", new Uint8Array(17));
  let out = box("free", new Uint8Array());
  for (let n = 0; n < depth; n++) out = box("jumb", concat(desc, out));
  return out;
}
describe("binary evidence parser resource budgets", () => {
  it("bounds CBOR nested values and wide declared collections", () => {
    expect(() =>
      cborDecode(Uint8Array.from([...Array(70).fill(0x81), 0xf6])),
    ).toThrow(/budget/);
    expect(() =>
      cborDecode(Uint8Array.from([0x99, 0x27, 0x11, ...Array(10_001).fill(0)])),
    ).toThrow(/budget/);
  });
  it("counts JUMBF boxes across nested levels", () => {
    expect(() => parseJumbf(nestedStore(70))).toThrow(/budget/);
    const children = concat(
      ...Array.from({ length: 5001 }, () => box("free", new Uint8Array())),
    );
    const branch = box(
      "jumb",
      concat(box("jumd", new Uint8Array(17)), children),
    );
    expect(() => parseJumbf(concat(branch, branch))).toThrow(/budget/);
  });
  it("refuses unbounded DER breadth before interpreting a certificate", () => {
    const nodes = Uint8Array.from(Array(10_001).fill([5, 0]).flat());
    const header = Uint8Array.from([
      0x30,
      0x82,
      nodes.length >> 8,
      nodes.length & 255,
    ]);
    expect(() => parseLeafCert(concat(header, nodes))).toThrow(/budget/);
  });
  it("reports parser refusal as UNCHECKABLE without claiming marking was not detected", async () => {
    const manifest = nestedStore(70);
    const r = await inspectC2pa(null, manifest);
    expect(r.manifest_store_present).toBeNull();
    expect(r.manifest_count).toBeNull();
    expect(r.assertion_hashes.status).toBe("UNCHECKABLE");
    expect(r.data_hash.status).toBe("UNCHECKABLE");
    expect(r.signature.status).toBe("UNCHECKABLE");
    expect(r.signature.reason).toContain("budget");
    expect(r.notes.join(" ")).not.toContain("internally consistent");
    const m = await measure({
      bytes: null,
      manifest,
      source: "manifest-only",
      url: null,
      http: null,
      error: null,
    });
    expect(m.checked).toContainEqual(
      expect.objectContaining({
        method: "c2pa.manifest-store",
        result: "UNCHECKABLE",
      }),
    );
    expect(m.statements.join(" ")).not.toContain(
      "marking not detected by method c2pa.manifest-store",
    );
  });
  it("encodes an opaque20MiB byte string without an argument-spread limit", () => {
    const bytes = new Uint8Array(20 * 1024 * 1024);
    bytes[bytes.length - 1] = 42;
    const encoded = cborEncode(bytes);
    expect(encoded.length).toBe(bytes.length + 5);
    expect(encoded.at(-1)).toBe(42);
  });
  it("discards earlier cryptographic positives when a real fixture reaches a late COSE limit", async () => {
    const asset = new Uint8Array(
      readFileSync(resolve(__dirname, "../../fixtures/c2pa/c2pa-rs-C.jpg")),
    );
    const store = new Uint8Array(extractManifestStore(asset).store!);
    const active = parseJumbf(store)[0]
      .children.filter((b) => b.type === "jumb")
      .at(-1)!;
    const signature = active.children
      .find((b) => b.label === "c2pa.signature")!
      .children.find((b) => b.type === "cbor")!.body;
    signature.fill(0);
    signature.set(Uint8Array.from([...Array(70).fill(0x81), 0xf6]));
    const r = await inspectC2pa(null, store);
    expect(r.parser_budget_exceeded).toBe(true);
    expect(r.signature.reason).toContain("CBOR depth budget");
    expect([
      r.assertion_hashes.status,
      r.data_hash.status,
      r.signature.status,
    ]).toEqual(["UNCHECKABLE", "UNCHECKABLE", "UNCHECKABLE"]);
    expect(r.assertion_hashes.checked).toBeNull();
    expect(r.notes.join(" ")).not.toContain("internally consistent");
  });
  it.each([false, true])(
    "refuses an unperformed inspection before payment or invoice (invoice=%s)",
    async (invoice) => {
      const network = vi.fn(() => {
        throw new Error("No facilitator or invoice transport expected");
      });
      vi.stubGlobal("fetch", network);
      const verify = vi.spyOn(x402, "verifyX402Payment");
      const manifest = nestedStore(70);
      const url =
        "https://councilof.ai/api/art50/marking-evidence" +
        (invoice
          ? "?invoice=gbp&commissioned_by=Parser%20Budget%20Fixture"
          : "");
      const request = new Request(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": "offline-fixture",
        },
        body: JSON.stringify({
          manifest_b64: btoa(String.fromCharCode(...manifest)),
        }),
      });
      const response = await onRequestGet({
        request,
        env: { X402_FACILITATOR_URL: "https://facilitator.invalid" },
        params: {},
      } as never);
      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body).toMatchObject({
        state: "UNCHECKABLE",
        error: "parser_resource_limit",
        payment_taken: false,
      });
      expect(body).not.toHaveProperty("card");
      expect(body).not.toHaveProperty("handoff");
      expect(network).not.toHaveBeenCalled();
      expect(verify).not.toHaveBeenCalled();
    },
  );
});
