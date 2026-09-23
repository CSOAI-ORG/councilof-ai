import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, webcrypto } from "node:crypto";
import { onRequestGet } from "./request-attestation";
import { verifyX402Payment } from "./_x402";

vi.mock("./_x402", async (load) => ({
  ...await load<typeof import("./_x402")>(),
  verifyX402Payment: vi.fn(),
}));

const origin = "https://councilof.ai";
const payment = vi.mocked(verifyX402Payment);
const rootPath = "/interop/card-root-2026-09-23-aaaaaaaaaaaa.json";
const asOf = "2026-09-23T13:20:19Z";
const root = {
  kind: "csoai.card-root/1",
  as_of: asOf,
  n_leaves: 3,
  merkle_root: "a".repeat(64),
  leaves: [
    { card: "signed-governan-111111111111.json", model: "ollama:gemma3:4b", axis: "governance" },
    { card: "signed-care-222222222222.json", model: "ollama:gemma3:4b", axis: "care" },
    { card: "signed-care-333333333333.json", model: "other-model", axis: "care" },
  ],
};
const rawRoot = JSON.stringify(root);
const digest = createHash("sha256").update(rawRoot).digest("hex");
const pointer = {
  schema: "csoai.card-root-pointer/1",
  kind: "DISCOVERY_POINTER_ONLY",
  as_of: asOf,
  root_url: rootPath,
  root_sha256: digest,
  n_leaves: 3,
};
const call = async () => {
  const response = await onRequestGet({
    request: new Request(origin + "/api/request-attestation?subject=ollama:gemma3:4b"),
    env: {},
  } as Parameters<typeof onRequestGet>[0]);
  return { response, body: await response.json() as any };
};
const stubSources = (overridePointer = pointer) => vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url === origin + "/signed/card-matrix.json") {
    return Response.json({ as_of: "2026-08-19T09:24:39Z", cells: [] });
  }
  if (url === origin + "/interop/card-root-latest.json") return Response.json(overridePointer);
  if (url === origin + rootPath) return new Response(rawRoot, { headers: { "content-type": "application/json" } });
  throw new Error("unexpected fetch " + url);
}));

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  payment.mockResolvedValue({ ok: false, reason: "no payment header" } as any);
  stubSources();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("free x402 preview: separate interop corpus", () => {
  it("shows dated root references without adding them to the paid card-v1 reserve", async () => {
    const { response, body } = await call();
    expect(response.status).toBe(402);
    const preview = body.csoai.preview;
    expect(preview.signed_cards_on_file).toBe(0);
    expect(preview.read_from).toBe(origin + "/signed/card-matrix.json");
    expect(preview.interop_collection).toMatchObject({
      state: "ROOT_REFERENCES_AVAILABLE",
      pointer_url: origin + "/interop/card-root-latest.json",
      root_url: origin + rootPath,
      root_sha256: digest,
      root_as_of: asOf,
      root_active_leaves: 3,
      matching_active_leaves: 2,
      included_in_paid_reserve: false,
      signature_verification: "NOT_PERFORMED",
      root_integrity: "BYTE_MATCHES_UNSIGNED_POINTER",
    });
    expect(preview.interop_collection.sample_card_urls).toHaveLength(2);
    expect(preview.interop_collection.note).toContain("Payment does not include these references");
    expect(body.resource.description).toContain("dated /signed/card-matrix.json only");
    expect(body.resource.description).toContain("not included in the paid reserve");
  });

  it("fails closed with a null count when the pointer does not bind the served root bytes", async () => {
    stubSources({ ...pointer, root_sha256: "f".repeat(64) });
    const { response, body } = await call();
    expect(response.status).toBe(402);
    expect(body.csoai.preview.interop_collection).toMatchObject({
      state: "UNCHECKABLE",
      matching_active_leaves: null,
      root_url: null,
      included_in_paid_reserve: false,
      reason: "root bytes differ from pointer digest",
    });
    expect(body.csoai.preview.signed_cards_on_file).toBe(0);
  });

  it("keeps the old reserve distinct when its matrix is populated", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === origin + "/signed/card-matrix.json") return Response.json({
        as_of: "2026-08-19T09:24:39Z",
        cells: [{ model: "ollama:gemma3:4b", axis: "care", card: "old-card-id",
          card_url: origin + "/signed/cards/old-card-id.json", signed: true }],
      });
      if (url === origin + "/interop/card-root-latest.json") return Response.json(pointer);
      if (url === origin + rootPath) return new Response(rawRoot);
      throw new Error("unexpected fetch " + url);
    }));
    const { body } = await call();
    expect(body.csoai.preview.signed_cards_on_file).toBe(1);
    expect(body.csoai.preview.cards).toHaveLength(1);
    expect(body.csoai.preview.interop_collection.matching_active_leaves).toBe(2);
  });
});

describe("interop preview fetch cost and subject scope", () => {
  it("reads the small pointer each time but reuses one verified root across subjects", async () => {
    const nextRoot = { ...root, as_of: "2026-09-23T14:20:19Z" };
    const raw = JSON.stringify(nextRoot);
    const sha = createHash("sha256").update(raw).digest("hex");
    const nextPointer = { ...pointer, as_of: nextRoot.as_of, root_sha256: sha };
    let pointerReads = 0;
    let rootReads = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === origin + "/signed/card-matrix.json") return Response.json({ as_of: asOf, cells: [] });
      if (url === origin + "/interop/card-root-latest.json") {
        pointerReads++;
        return Response.json(nextPointer);
      }
      if (url === origin + rootPath) {
        rootReads++;
        return new Response(raw);
      }
      throw new Error("unexpected fetch " + url);
    }));
    const first = await call();
    const second = await call();
    expect(first.body.csoai.preview.interop_collection.matching_active_leaves).toBe(2);
    expect(second.body.csoai.preview.interop_collection.matching_active_leaves).toBe(2);
    expect(pointerReads).toBe(2);
    expect(rootReads).toBe(1);
    expect(first.body.csoai.preview.interop_collection.match_basis).toBe("CASE_INSENSITIVE_MODEL_SUBSTRING");
  });

  it("reports an oversized root as uncheckable without reading or claiming a zero count", async () => {
    const oversizedPointer = { ...pointer, root_sha256: "e".repeat(64) };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === origin + "/signed/card-matrix.json") return Response.json({ as_of: asOf, cells: [] });
      if (url === origin + "/interop/card-root-latest.json") return Response.json(oversizedPointer);
      if (url === origin + rootPath) return new Response("not read", {
        headers: { "content-length": String(8 * 1024 * 1024 + 1) },
      });
      throw new Error("unexpected fetch " + url);
    }));
    const { response, body } = await call();
    expect(response.status).toBe(402);
    expect(body.csoai.preview.interop_collection).toMatchObject({
      state: "UNCHECKABLE",
      matching_active_leaves: null,
      root_active_leaves: null,
      reason: "source exceeds byte limit",
      included_in_paid_reserve: false,
    });
  });
});
