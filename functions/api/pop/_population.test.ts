import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POPULATIONS, POPULATION_IDS, otsStateFromBytes, pyDumpsSortedIndent1 } from "../_population";
import { onRequestGet as door, SKU } from "../_population_door";
import { onRequestGet as eunomia } from "../eunomia-data";
import { onRequestGet as xrplReader } from "../xrpl";
import { onRequestGet as manifest } from "../../.well-known/x402.json";
import { onRequestGet as catalog } from "../x402";
import { LEDGER } from "../corrections";
import { canonicalBytes, verifyLeaf } from "../../_lib/cardSign";
import descriptions from "../x402-descriptions.json";

/**
 * The population doors, tested against the ARTIFACTS ON DISK — every expected count here is
 * computed from public/ bytes inside the test, never typed. If an artifact is regenerated with a
 * different count the test still passes, because both sides read the same bytes; if the door
 * ever types a number, this is where it shows.
 */
const PUBLIC = resolve(__dirname, "../../../public");
const ORIGIN = "https://councilof.ai";
const EXPECTED_IDS = ["stablecoins", "swift", "xrpl", "x402-bazaar", "mcp-registry", "a2a", "ots-proofs", "layer0", "corrections", "claim-watch"];

const disk = (p: string) => JSON.parse(readFileSync(resolve(PUBLIC, "." + p), "utf8"));
const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;
const call = (h: unknown, c: unknown) => (h as (c: unknown) => Promise<Response>)(c);

/** Serve public/ from disk; /api/* is never a static file. Facilitator calls go to `facilitator`. */
function stubDisk(facilitator?: (p: string) => Response, opts: { nothing?: boolean } = {}) {
  const calls = { facilitator: 0 };
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.pathname.endsWith("/verify") || url.pathname.endsWith("/settle")) {
      calls.facilitator += 1;
      if (facilitator) return facilitator(url.pathname);
    }
    if (opts.nothing) return new Response("nope", { status: 404 });
    const f = resolve(PUBLIC, "." + url.pathname);
    if (!url.pathname.startsWith("/api/") && existsSync(f) && statSync(f).isFile()) {
      return new Response(readFileSync(f), { status: 200, headers: { "content-type": f.endsWith(".json") ? "application/json" : "application/octet-stream" } });
    }
    return new Response("nope", { status: 404 });
  });
  return calls;
}
afterEach(() => vi.unstubAllGlobals());

const facilitatorOk = (p: string) =>
  new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
const paymentHeader = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
const LIVE = { X402_FACILITATOR_URL: "https://f.example" };

async function preview(id: string) {
  const r = await call(door, ctx(`/api/pop/${id}?preview=1`));
  expect(r.status, id).toBe(200);
  return (await r.json()) as Record<string, unknown> & { state: string; n: number | null; as_of: string | null; source: string[]; head: Record<string, unknown>; reason: string | null };
}

async function testKey(): Promise<{ pkcs8b64: string; pubHex: string }> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  return { pkcs8b64: btoa(String.fromCharCode(...pkcs8)), pubHex: [...raw].map((b) => b.toString(16).padStart(2, "0")).join("") };
}

describe("registry", () => {
  it("resolves exactly the ten population ids, in order, each with a static route file", () => {
    expect([...POPULATION_IDS]).toEqual(EXPECTED_IDS);
    const files = readdirSync(__dirname).filter((f) => f.endsWith(".ts") && !f.includes(".test.") && !f.startsWith("["));
    expect(files.map((f) => f.replace(/\.ts$/, "")).sort()).toEqual([...EXPECTED_IDS].sort());
    for (const p of POPULATIONS) {
      expect(p.population, p.id).not.toMatch(/(?<![a-z0-9])\d/i); // the sentence names what a row is; numbers are read (x402 is a name)
      expect(p.tags.length, p.id).toBeLessThanOrEqual(5);
    }
  });

  it("carries a canonical description for every id, and none types a count or a price", () => {
    for (const id of EXPECTED_IDS) {
      const d = (descriptions as Record<string, string>)[`pop_${id}`];
      expect(d, id).toBeTruthy();
      expect(d).not.toMatch(/\$\s?\d|\bUSDC\b/);
      expect(d).not.toMatch(/\b\d{2,}\b/); // no typed populations in the discovery copy
    }
  });
});

describe("free preview — every reading is derived from the artifact bytes", () => {
  it("returns {state, n, as_of, source} for every id, with state one of the four", async () => {
    stubDisk();
    for (const id of EXPECTED_IDS) {
      const b = await preview(id);
      expect(["INDEXED", "MEASURED", "UNMEASURED", "UNCHECKABLE"], id).toContain(b.state);
      expect(b.n === null || Number.isInteger(b.n), id).toBe(true);
      expect(Array.isArray(b.source) && b.source.length > 0, id).toBe(true);
      expect(typeof b.head.identification, id).toBe("string");
      expect(JSON.stringify(b)).not.toMatch(/\$\s?\d/);
    }
  });

  it("stablecoins: n is the corpus index's own universe_asset_count and as_of its as_of", async () => {
    stubDisk();
    const idx = disk("/interop/stablecoin-corpus-index-2026-09-16.json");
    const b = await preview("stablecoins");
    expect(b.state).toBe("INDEXED");
    expect(b.n).toBe(idx.universe_asset_count);
    expect(b.as_of).toBe(idx.as_of);
    expect(b.head.assets_with_at_least_one_measured_deployment).toBe(idx.assets_with_at_least_one_measured_deployment);
    expect(b.head.still_unmeasured).toBe(idx.still_unmeasured);
    expect(b.n_unit).toMatch(/catalogued/);
  });

  it("swift: n is the census rows[] length, by_status sums to n, n_measured is the census's own", async () => {
    stubDisk();
    const c = disk("/interop/swift-census.json");
    const b = await preview("swift");
    expect(b.n).toBe(c.rows.length);
    expect(b.as_of).toBe(c.as_of);
    const byStatus = b.head.by_status as Record<string, number>;
    expect(Object.values(byStatus).reduce((a, x) => a + x, 0)).toBe(c.rows.length);
    expect(b.head.n_measured).toBe(c.n_measured);
    expect(b.state).toBe(c.n === c.rows.length ? "INDEXED" : "UNCHECKABLE");
  });

  it("xrpl: n is whatever the live reader returns from the root on disk — 404 there is UNMEASURED here", async () => {
    stubDisk();
    const reader = await call(xrplReader, ctx("/api/xrpl"));
    const rb = (await reader.json()) as { n?: number; assets?: unknown[]; as_of?: string; reason?: string };
    const b = await preview("xrpl");
    if (reader.status === 200) {
      expect(b.state).toBe("INDEXED");
      expect(b.n).toBe(rb.assets!.length);
      expect(b.as_of).toBe(rb.as_of);
    } else {
      expect(b.state).toBe("UNMEASURED");
      expect(b.n).toBeNull();
      expect(b.reason).toContain(rb.reason);
    }
    const reg = disk("/interop/xrpl-issuer-registry.json");
    expect((b.head.registry as { issuer_rows: number }).issuer_rows).toBe(reg.issuers.length);
  });

  it("x402-bazaar: n is null because the artifact refuses a total; frames and overlap are its own numbers; the diff is UNMEASURED", async () => {
    stubDisk();
    const pop = disk("/interop/agent-population-2026-09-17.json");
    const ours = disk("/interop/x402-door-census-2026-09-16.json");
    const b = await preview("x402-bazaar");
    expect(b.state).toBe("INDEXED");
    expect(b.n).toBeNull();
    expect(b.head.n_by_frame).toEqual({ "x402-cdp-bazaar": pop.totals["x402-cdp-bazaar"], "x402-payai-bazaar": pop.totals["x402-payai-bazaar"] });
    expect(b.head.overlap_cdp_payai).toBe(pop.pairwise_overlap["x402-cdp-bazaar ∩ x402-payai-bazaar"]);
    expect((b.head.our_doors as { n: number }).n).toBe(ours.rows.length);
    expect((b.head.diff as { state: string }).state).toBe("UNMEASURED");
    expect(b.as_of).toBe(pop.as_of);
  });

  it("mcp-registry: n is the self-listings rows[] length; versions_total and the whole-registry frame are the artifacts' own", async () => {
    stubDisk();
    const self = disk("/interop/mcp-registry-self-listings-2026-09-22.json");
    const pop = disk("/interop/agent-population-2026-09-17.json");
    const b = await preview("mcp-registry");
    expect(b.n).toBe(self.rows.length);
    expect(b.head.versions_total).toBe(self.population.versions_total);
    expect(b.head.totals_by_state).toEqual(self.totals_by_state);
    const frame = pop.sources.find((s: { source: string }) => s.source === "mcp-official-registry");
    expect((b.head.whole_registry as { distinct_keys: number }).distinct_keys).toBe(frame.distinct_keys);
    expect(b.state).toBe(self.denominator === self.rows.length ? "INDEXED" : "UNCHECKABLE");
  });

  it("a2a: n is the a2aregistry-org frame's distinct_keys and nothing is added across frames", async () => {
    stubDisk();
    const pop = disk("/interop/agent-population-2026-09-17.json");
    const frame = pop.sources.find((s: { source: string }) => s.source === "a2aregistry-org");
    const b = await preview("a2a");
    expect(b.n).toBe(frame.distinct_keys);
    expect(b.as_of).toBe(pop.as_of);
    expect(b.unmeasured.join(" ")).toMatch(/per-agent rows/);
  });

  it("ots-proofs: n is proofs[] length; by_state is counted from the rows and cross-checked with the manifest's counts", async () => {
    stubDisk();
    const m = disk("/interop/ots/manifest.json");
    const b = await preview("ots-proofs");
    expect(b.n).toBe(m.proofs.length);
    expect(b.as_of).toBe(m.as_of);
    const byState = b.head.by_state_from_rows as Record<string, number>;
    expect(Object.values(byState).reduce((a, x) => a + x, 0)).toBe(m.proofs.length);
    expect(byState.BITCOIN ?? 0).toBe(m.proofs.filter((p: { state: string }) => p.state === "BITCOIN").length);
    expect(b.state).toBe(m.counts.proofs === m.proofs.length ? "MEASURED" : "UNCHECKABLE");
  });

  it("layer0: n is probes[] length and the .ots state is the manifest row for that very artifact", async () => {
    stubDisk();
    const c = disk("/interop/layer0-ceremony-2026-09-03.json");
    const m = disk("/interop/ots/manifest.json");
    const row = m.proofs.find((p: { subject: string }) => p.subject === "/interop/layer0-ceremony-2026-09-03.json");
    const b = await preview("layer0");
    expect(b.n).toBe(c.probes.length);
    expect(b.as_of).toBe(c.as_of);
    expect(b.head.rails).toBe(c.rails.length);
    expect((b.head.ots as { state: string }).state).toBe(row ? row.state : "UNMEASURED");
  });

  it("corrections: n is LEDGER.corrections.length, in-process, and as_of is the latest entry date", async () => {
    stubDisk({ nothing: true } as never, { nothing: true });
    const b = await preview("corrections");
    expect(b.state).toBe("INDEXED");
    expect(b.n).toBe(LEDGER.corrections.length);
    expect(b.as_of).toBe([...LEDGER.corrections.map((c) => c.date)].sort().pop());
    expect(b.head.free_endpoint).toMatch(/stays free/);
  });

  it("claim-watch: file_sha256 is the served bytes, registry_digest reproduces under sorted-indent-1, .ots state is read from the proof bytes", async () => {
    stubDisk();
    const path = "/claims/claimreg-ondo-chainlink-2026-09-22.json";
    const raw = readFileSync(resolve(PUBLIC, "." + path));
    const file = JSON.parse(raw.toString("utf8"));
    const b = await preview("claim-watch");
    const claims = Object.values(file.subjects as Record<string, { claims: unknown[] }>).reduce((a, s) => a + s.claims.length, 0);
    expect(b.state).toBe("INDEXED");
    expect(b.n).toBe(claims);
    expect(b.as_of).toBe(file.created_utc);
    const row = (b.head.registries as Record<string, unknown>[])[0];
    expect(row.registry_id).toBe(file.registry_id);
    expect(row.file_sha256).toBe(sha256(raw));
    expect(row.registry_digest).toBe(file.registry_digest);
    expect(row.signature_state).toBe(file.signature_state);
    expect(row.states).toEqual({ CLAIM_CAPTURED: claims });
    // Independent reproduction of the file's own digest with python's json.dumps, not our port.
    const { registry_digest, ...rest } = file;
    let py: string | null = null;
    try {
      py = execFileSync("python3", ["-c", "import json,sys,hashlib;o=json.load(sys.stdin);print(hashlib.sha256(json.dumps(o,sort_keys=True,indent=1).encode()).hexdigest())"], { input: JSON.stringify(rest) }).toString().trim();
    } catch { /* no python here: the JS port below is still checked against the file */ }
    if (py) expect(py, "python json.dumps(sort_keys=True, indent=1) must reproduce the file's registry_digest").toBe(registry_digest);
    expect(sha256(pyDumpsSortedIndent1(rest))).toBe(registry_digest);
    expect(row.registry_digest_reproducible).toBe(true);
    // .ots: state from bytes, checked here with an independent tag scan.
    const ots = readFileSync(resolve(PUBLIC, "." + path + ".ots"));
    const hasTag = (hex: string) => ots.toString("hex").slice(62).includes(hex);
    const expected = hasTag("0588960d73d71901") ? "BITCOIN" : hasTag("83dfe30d2ef90c8e") ? "PENDING" : "UNCHECKABLE";
    expect((row.ots as { state: string; bytes: number }).state).toBe(expected);
    expect((row.ots as { bytes: number }).bytes).toBe(ots.byteLength);
    expect(otsStateFromBytes(new Uint8Array(ots))).toBe(expected);
    expect(otsStateFromBytes(new TextEncoder().encode("OTS PENDING"))).toBe("NOT_A_PROOF");
  });

  it("a missing artifact is UNMEASURED with a reason — never 500, never 0", async () => {
    stubDisk(undefined, { nothing: true });
    for (const id of EXPECTED_IDS.filter((x) => x !== "corrections")) {
      const b = await preview(id);
      expect(b.state, id).toBe("UNMEASURED");
      expect(b.n, id).toBeNull();
      expect(typeof b.reason === "string" && b.reason.length > 0, id).toBe(true);
    }
  });
});

describe("the 402 challenge", () => {
  it("is path-scoped, carries extensions.bazaar without queryParams, names the population and its as_of, and prices like the existing doors", async () => {
    stubDisk();
    const ref = await (await call(eunomia, ctx("/api/eunomia-data?feed=1"))).json() as { accepts: Record<string, unknown>[] };
    const refAccept = ref.accepts[0] as { amount: string; payTo: string; csoai_pricing: { normal_amount_atomic: string; pricing_basis: string } };
    for (const id of EXPECTED_IDS) {
      const r = await call(door, ctx(`/api/pop/${id}`));
      expect(r.status, id).toBe(402);
      expect(r.headers.get("payment-required"), id).toBeTruthy();
      const b = (await r.json()) as Record<string, unknown>;
      expect(b.x402Version).toBe(2);
      const resource = b.resource as { url: string; description: string };
      expect(resource.url).toBe(`${ORIGIN}/api/pop/${id}`);
      expect(resource.url).not.toContain("?");
      const ext = b.extensions as { bazaar: { info: { input: Record<string, unknown> }; schema: { properties: { input: { properties: Record<string, unknown> } } } } };
      expect(ext.bazaar, id).toBeTruthy();
      expect(ext.bazaar.info.input).toEqual({ type: "http", method: "GET" });
      expect(ext.bazaar.schema.properties.input.properties).not.toHaveProperty("queryParams");
      const entry = POPULATIONS.find((p) => p.id === id)!;
      const pv = await preview(id);
      expect(resource.description).toContain(entry.title);
      if (pv.as_of) expect(resource.description).toContain(pv.as_of);
      expect(resource.description).toContain(`state ${pv.state}`);
      const accepts = b.accepts as typeof ref.accepts;
      const a = accepts[0] as typeof refAccept & { resource: string };
      expect(a.resource).toBe(`${ORIGIN}/api/pop/${id}`);
      expect(a.amount).toBe(refAccept.amount);
      expect(a.payTo).toBe(refAccept.payTo);
      expect(a.csoai_pricing.normal_amount_atomic).toBe(refAccept.csoai_pricing.normal_amount_atomic);
      expect(a.csoai_pricing.pricing_basis).toBe(refAccept.csoai_pricing.pricing_basis);
      const csoai = b.csoai as Record<string, unknown>;
      expect(csoai.free_preview).toBe(`${ORIGIN}/api/pop/${id}?preview=1`);
      expect(typeof csoai.deliverable).toBe("string");
      expect((csoai.preview as { n: unknown }).n).toBe(pv.n);
      expect(JSON.stringify(b)).not.toMatch(/\$\s?\d/);
      // x402scan drops a door whose PAYMENT-REQUIRED header exceeds 16 KiB.
      expect(r.headers.get("payment-required")!.length, `${id} header`).toBeLessThan(16 * 1024);
    }
    expect(SKU).toEqual({ skuId: "issuance", tier: "reserve" });
  });

  it("still 402s when every artifact is unreadable, saying so in the description", async () => {
    stubDisk(undefined, { nothing: true });
    const r = await call(door, ctx("/api/pop/stablecoins"));
    expect(r.status).toBe(402);
    const b = (await r.json()) as { resource: { description: string }; extensions: { bazaar: unknown } };
    expect(b.resource.description).toMatch(/UNMEASURED/);
    expect(b.extensions.bazaar).toBeTruthy();
  });

  it("an unknown population is a 404 naming the known ids, and a presented payment never reaches the facilitator", async () => {
    const calls = stubDisk(facilitatorOk);
    const r = await call(door, ctx("/api/pop/unicorns", LIVE, { "x-payment": paymentHeader }));
    expect(r.status).toBe(404);
    const b = (await r.json()) as { known_ids: string[] };
    expect(b.known_ids).toEqual(EXPECTED_IDS);
    expect(calls.facilitator).toBe(0);
  });
});

describe("paid: read before settle", () => {
  it("delivers the rows, an attestation leaf whose rows_sha256 matches the delivered rows, and the facilitator's settle", async () => {
    stubDisk(facilitatorOk);
    const key = await testKey();
    for (const id of ["swift", "claim-watch", "corrections"]) {
      const r = await call(door, ctx(`/api/pop/${id}`, { ...LIVE, BOARD_SIGN_KEY_PKCS8_B64: key.pkcs8b64 }, { "x-payment": paymentHeader }));
      expect(r.status, id).toBe(200);
      expect(r.headers.get("x-payment-response"), id).toBeTruthy();
      expect(r.headers.get("x-csoai-signed")).toBe("true");
      const b = (await r.json()) as { kind: string; rows: unknown; settle: { transaction: string }; attestation: { payload: Record<string, unknown>; sha256: string; sig_ed25519: string; did: string } };
      expect(b.kind).toBe("slice");
      expect(b.rows, id).toBeTruthy();
      expect(b.settle).toMatchObject({ transaction: "0xtx", payer: "0xp" });
      const recomputed = createHash("sha256").update(Buffer.from(canonicalBytes(b.rows))).digest("hex");
      expect(b.attestation.payload.rows_sha256).toBe(recomputed);
      expect(b.attestation.did).toBe("did:web:csoai.org#board-attestation-1");
      const v = await verifyLeaf(b.attestation.payload, b.attestation.sha256, b.attestation.sig_ed25519, key.pubHex);
      expect(v).toEqual({ sha_ok: true, sig_ok: true });
    }
  });

  it("swift rows are the census rows verbatim; claim-watch rows carry the registry file parsed verbatim", async () => {
    stubDisk(facilitatorOk);
    const sw = await (await call(door, ctx("/api/pop/swift", LIVE, { "x-payment": paymentHeader }))).json() as { rows: { rows: unknown[] } };
    expect(sw.rows.rows).toEqual(disk("/interop/swift-census.json").rows);
    const cw = await (await call(door, ctx("/api/pop/claim-watch", LIVE, { "x-payment": paymentHeader }))).json() as { rows: { registries: { registry: unknown }[] } };
    expect(cw.rows.registries[0].registry).toEqual(disk("/claims/claimreg-ondo-chainlink-2026-09-22.json"));
    const cx = await (await call(door, ctx("/api/pop/corrections", LIVE, { "x-payment": paymentHeader }))).json() as { rows: { entries: { id: string; entry_sha256: string }[] } };
    expect(cx.rows.entries.map((e) => e.id)).toEqual(LEDGER.corrections.map((c) => c.id));
    expect(cx.rows.entries.every((e) => /^[0-9a-f]{64}$/.test(e.entry_sha256))).toBe(true);
  });

  it("an unsigned deploy still delivers, labelled unsigned", async () => {
    stubDisk(facilitatorOk);
    const r = await call(door, ctx("/api/pop/layer0", LIVE, { "x-payment": paymentHeader }));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-csoai-signed")).toBe("false");
    const b = (await r.json()) as { attestation: { sig_ed25519: null; unsigned_reason: string; unmeasured: string[] } };
    expect(b.attestation.sig_ed25519).toBeNull();
    expect(b.attestation.unsigned_reason).toMatch(/absent/);
    expect(b.attestation.unmeasured).toContain("sig_ed25519 (no Pages key)");
  });

  it("an UNMEASURED read answers 402 again and never contacts the facilitator", async () => {
    const calls = stubDisk(facilitatorOk, { nothing: true });
    const r = await call(door, ctx("/api/pop/ots-proofs", LIVE, { "x-payment": paymentHeader }));
    expect(r.status).toBe(402);
    const b = (await r.json()) as { error: string; csoai: { read_before_settle: { settled: boolean; state: string } } };
    expect(b.csoai.read_before_settle).toMatchObject({ settled: false, state: "UNMEASURED" });
    expect(b.error).toMatch(/not settled/);
    expect(calls.facilitator).toBe(0);
  });
});

describe("discovery", () => {
  it("the manifest lists all ten doors with query-less urls and a free_preview; the catalogue lists pop_<id>", async () => {
    const m = (await (await call(manifest, ctx("/.well-known/x402.json"))).json()) as { resources: { url: string; free_preview?: string; paid_for: string; description: string; population?: string }[] };
    for (const id of EXPECTED_IDS) {
      const row = m.resources.find((r) => r.url === `${ORIGIN}/api/pop/${id}`);
      expect(row, id).toBeTruthy();
      expect(row!.free_preview).toBe(`${ORIGIN}/api/pop/${id}?preview=1`);
      expect(row!.paid_for).toBe("assembly");
      expect(row!.population).toBe(id);
      expect(row!.description).toBe((descriptions as Record<string, string>)[`pop_${id}`]);
    }
    const c = (await (await call(catalog, ctx("/api/x402"))).json()) as { resources: { id: string; resource: string; free_preview: string }[] };
    for (const id of EXPECTED_IDS) {
      const row = c.resources.find((r) => r.id === `pop_${id}`);
      expect(row, id).toBeTruthy();
      expect(row!.resource).toBe(`${ORIGIN}/api/pop/${id}`);
    }
  });
});
