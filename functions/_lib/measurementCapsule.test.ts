/**
 * Measurement-capsule readers. Every expected id and root below comes from the REFERENCE
 * implementation (the capsule lane's venturi_capsule.py) via __fixtures__/measurement/make_fixture.py,
 * and the served layout from scripts/measurement_capsule_layout.py — the TypeScript never grades its
 * own homework. Synthetic capsules only.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import VECTORS from "./__fixtures__/measurement/capsule-vectors.json";
import ENDPOINTS from "./__fixtures__/measurement/endpoint-vectors.json";
import BUNDLE from "./__fixtures__/measurement/layout-bundle.json";
import SPLIT from "./__fixtures__/measurement/layout-bundle-split.json";
import {
  DOCTRINE,
  merkle,
  rootFromProof,
  parseLexical,
  recomputeCapsuleId,
  normaliseEndpoint,
  measurementIndex,
  verifyCapsule,
  serverEvidence,
  verifySidecar,
  sha256HexOf,
  batchSlug,
  type RuleVersion,
} from "./measurementCapsule";

vi.setConfig({ testTimeout: 60_000 }); // WebCrypto digests are slow on a loaded 1 GB host; correctness, not speed, is tested
const ORIGIN = "https://councilof.ai";
const FILES = (BUNDLE as { files: Record<string, string> }).files;

function serve(files: Record<string, string>) {
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    return path in files ? new Response(files[path], { status: 200 }) : new Response("<!doctype html>", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("capsule ids and Merkle roots match the reference implementation", () => {
  for (const [name, ver] of [["v02", "0.2"], ["v01", "0.1"]] as const) {
    const set = (VECTORS as Record<string, { lines: string[]; ids: string[]; root: string; roots_by_size: Record<string, string> }>)[name];
    it(`${name}: every capsule id recomputes from its JSON text (number lexemes kept)`, async () => {
      for (const line of set.lines) {
        const id = (JSON.parse(line) as { capsule_id: string }).capsule_id;
        expect(await recomputeCapsuleId(parseLexical(line))).toBe(id);
      }
    });
    it(`${name}: the root at every tree size matches, and every audit path folds back to it`, async () => {
      for (const [n, root] of Object.entries(set.roots_by_size)) {
        const ids = set.ids.slice(0, Number(n));
        for (const id of ids) {
          const m = await merkle(ver as RuleVersion, ids, id);
          expect(m.root).toBe(root);
          expect(await rootFromProof(ver as RuleVersion, id, m.path)).toBe(root);
        }
      }
    });
  }
  it("v0.1 float lexemes (1.0, 1e-05, 1.2345678901234567e+19) survive only as TEXT — an object loses them", async () => {
    const line = (VECTORS as { v01: { lines: string[] } }).v01.lines.find((l) => l.includes("1e-05"))!;
    const id = (JSON.parse(line) as { capsule_id: string }).capsule_id;
    expect(await recomputeCapsuleId(parseLexical(line))).toBe(id);
    expect(await recomputeCapsuleId(parseLexical(JSON.stringify(JSON.parse(line))))).not.toBe(id);
  });
  it("0.1 and 0.2 roots over the same ids differ (domain separation is real)", async () => {
    const ids = (VECTORS as { v02: { ids: string[] } }).v02.ids;
    expect((await merkle("0.1", ids)).root).not.toBe((await merkle("0.2", ids)).root);
  });
});

describe("endpoint normalisation (shared vectors with the Python generator)", () => {
  for (const [input, expected] of (ENDPOINTS as { vectors: [string, string | null][] }).vectors) {
    it(JSON.stringify(input), () => expect(normaliseEndpoint(input)).toBe(expected));
  }
});

describe("signed sidecar verification against the pinned board key (a real public artifact)", () => {
  const dir = join(__dirname, "..", "..", "public", "interop");
  const bytesPath = join(dir, "axis-doors-2026-09-22.json");
  const sidecarPath = join(dir, "axis-doors-2026-09-22.signed.json");
  const have = existsSync(bytesPath) && existsSync(sidecarPath);
  it.skipIf(!have)("VERIFIES on the published bytes; FAILS on one changed byte or a changed payload", async () => {
    const text = readFileSync(bytesPath, "utf8");
    const sidecar = readFileSync(sidecarPath, "utf8");
    const ok = await verifySidecar({ state: "OK", url: "x", text: sidecar, json: JSON.parse(sidecar) }, text);
    expect(ok.state).toBe("VERIFIES");
    expect(ok.did).toBe("did:web:csoai.org#board-attestation-1");
    const pinsFail = await verifySidecar({ state: "OK", url: "x", text: sidecar, json: JSON.parse(sidecar) }, text + " ");
    expect(pinsFail.state).toBe("FAILS");
    const j = JSON.parse(sidecar);
    j.payload.not_a_grade += ".";
    expect((await verifySidecar({ state: "OK", url: "x", text: "", json: j }, text)).state).toBe("FAILS");
    j.signature.did = "did:web:example.com#k";
    expect((await verifySidecar({ state: "OK", url: "x", text: "", json: j }, text)).reason).toMatch(/not a pinned key/);
  });
  it("an absent sidecar is ABSENT, never VERIFIES", async () => {
    expect((await verifySidecar({ state: "NOT_PUBLISHED", url: "x", reason: "HTTP 404" }, "{}")).state).toBe("ABSENT");
  });
});

describe("readers over the served layout", () => {
  const v02 = (VECTORS as { v02: { lines: string[]; root: string } }).v02;

  it("measurement_index: PUBLISHED with roots, batches, states and signature/anchor states", async () => {
    serve(FILES);
    const r = await measurementIndex(ORIGIN);
    expect(r.state).toBe("PUBLISHED");
    expect(r.doctrine).toBe(DOCTRINE);
    expect(r.version).toBe("0.2");
    expect(r.n_batches).toBe(2);
    const cp = (r.batches as Array<Record<string, unknown>>).find((b) => b.adapter === "contract_parity")!;
    expect(cp.merkle_root).toBe(v02.root);
    expect(cp.leaves_url).toBe(`${ORIGIN}/measurement-capsules/v0.2/contract_parity/leaves.json`);
    expect((r.signature as Record<string, unknown>).state).toBe("ABSENT");
    expect((r.anchors as Record<string, unknown>).state).toBe("NOT_PUBLISHED");
    expect((r.publication as Record<string, unknown>).state).not.toBe("PUBLIC");
  });

  it("measurement_index: anchors and publication come from the anchors.json published beside the index", async () => {
    const anchors = {
      schema: "csoai.measurement-anchors/0.1",
      opentimestamps: { state: "BITCOIN_ATTESTED", bitcoin_block_heights: [968674] },
      rekor: [{ subject: "daily index", logIndex: 2968539665, state: "INCLUDED (inclusion proof verifies)" }],
      xrpl: { state: "PREPARED_NOT_SUBMITTED" },
      publication: { state: "PUBLIC", approved: "2026-09-26", by: "signed publication record" },
    };
    serve({ ...FILES, "/measurement-capsules/v0.2/anchors.json": JSON.stringify(anchors) });
    const r = await measurementIndex(ORIGIN);
    const a = r.anchors as Record<string, unknown>;
    expect(a.state).toBe("PUBLISHED");
    expect((a.opentimestamps as Record<string, unknown>).bitcoin_block_heights).toEqual([968674]);
    expect((a.rekor as Array<Record<string, unknown>>)[0].logIndex).toBe(2968539665);
    expect((r.publication as Record<string, unknown>).state).toBe("PUBLIC");
  });

  it("measurement_index: without anchors.json, a served OTS proof is PARTIAL (reported, not parsed); none is invented", async () => {
    serve({ ...FILES, "/measurement-capsules/v0.2/index.json.ots": "\u0000OpenTimestamps\u0000\u0000Proof" });
    const a = (await measurementIndex(ORIGIN)).anchors as Record<string, unknown>;
    expect(a.state).toBe("PARTIAL");
    expect((a.opentimestamps as Record<string, unknown>).state).toBe("PROOF_PUBLISHED_UNPARSED");
    expect(a.rekor).toBe("NOT_STATED");
  });

  it("nothing published: NOT_PUBLISHED everywhere — no invented index", async () => {
    serve({});
    expect((await measurementIndex(ORIGIN)).state).toBe("NOT_PUBLISHED");
    expect((await verifyCapsule(ORIGIN, v02.lines[0])).state).toBe("NOT_PUBLISHED");
    const se = await serverEvidence(ORIGIN, "https://svc1.example/mcp");
    expect(se.state).toBe("NOT_PUBLISHED");
    expect(se.capsules).toEqual([]);
  });

  it("verify_capsule: INCLUDED with an audit path that folds to the batch root", async () => {
    serve(FILES);
    for (const line of v02.lines) {
      const r = await verifyCapsule(ORIGIN, line);
      expect(r.state).toBe("INCLUDED");
      expect((r.capsule_id as Record<string, unknown>).state).toBe("RECOMPUTES");
      expect((r.batch as Record<string, unknown>).merkle_root).toBe(v02.root);
      expect((r.inclusion as Record<string, unknown>).recomputed_root).toBe(v02.root);
    }
    const a2a = (BUNDLE as { a2a_lines: string[] }).a2a_lines[0];
    expect((await verifyCapsule(ORIGIN, JSON.parse(a2a))).state).toBe("INCLUDED"); // object form, exact for v0.2 (JCS)
  });

  it("verify_capsule: a changed byte is ID_MISMATCH; a valid but unpublished capsule is NOT_INCLUDED", async () => {
    serve(FILES);
    const tampered = v02.lines[0].replace('"CONSISTENT"', '"INCONSISTENT"');
    expect((await verifyCapsule(ORIGIN, tampered)).state).toBe("ID_MISMATCH");
    const c = JSON.parse(v02.lines[0]);
    c.observed_at = "2026-09-27T00:00:00Z";
    delete c.capsule_id;
    const text = JSON.stringify(c);
    c.capsule_id = await recomputeCapsuleId(parseLexical(text));
    expect((await verifyCapsule(ORIGIN, JSON.stringify(c))).state).toBe("NOT_INCLUDED");
  });

  it("verify_capsule: a v0.1 capsule against a v0.2-only origin is NOT_PUBLISHED (rule chosen by schema, never guessed)", async () => {
    serve(FILES);
    const r = await verifyCapsule(ORIGIN, (VECTORS as { v01: { lines: string[] } }).v01.lines[0]);
    expect(r.state).toBe("NOT_PUBLISHED");
    expect(String(r.reason)).toMatch(/v0\.1/);
  });

  it("verify_capsule: garbage input is UNCHECKABLE, never an exception", async () => {
    serve(FILES);
    expect((await verifyCapsule(ORIGIN, "{not json")).state).toBe("UNCHECKABLE");
    expect((await verifyCapsule(ORIGIN, 42)).state).toBe("UNCHECKABLE");
    expect((await verifyCapsule(ORIGIN, JSON.stringify({ schema: "csoai.other/1", capsule_id: "x" }))).state).toBe("UNCHECKABLE");
  });

  it("server_evidence: every capsule about the endpoint, across batches, with root and inclusion pointer", async () => {
    serve(FILES);
    const r = await serverEvidence(ORIGIN, "https://SVC1.example/mcp/");
    expect(r.state).toBe("MEASURED");
    expect(r.endpoint).toBe("https://svc1.example/mcp");
    const caps = r.capsules as Array<Record<string, unknown>>;
    expect(caps.length).toBeGreaterThan(0);
    for (const c of caps) {
      for (const k of ["capsule_id", "measurement_state", "observed_at", "correction_pointer", "limitations", "batch", "inclusion"]) expect(c).toHaveProperty(k);
      expect((c.batch as Record<string, unknown>).merkle_root).toBe(v02.root);
    }
    expect(r.other_endpoints_measured_at_this_origin).toEqual(["https://svc1.example/.well-known/agent-card.json"]);
    const text = JSON.stringify(r);
    expect(text).not.toMatch(/"(verdict|score|rating|rank|grade|clean|safe|trusted)"\s*:/i);
  });

  it("server_evidence: an unknown endpoint is NOT_MEASURED with an empty list — never an error, never clean", async () => {
    serve(FILES);
    for (const u of ["https://never-measured.example/mcp", "not a url", ""]) {
      const r = await serverEvidence(ORIGIN, u);
      expect(r.state).toBe("NOT_MEASURED");
      expect(r.capsules).toEqual([]);
      expect(r.doctrine).toBe(DOCTRINE);
      expect(JSON.stringify(r)).not.toMatch(/\bclean\b(?! or unclean)/i);
    }
  });

  it("server_evidence: the shard key is sha256 of the normalised URL, first two hex", async () => {
    serve(FILES);
    const r = await serverEvidence(ORIGIN, "https://svc4.example/mcp");
    expect(r.key).toBe(await sha256HexOf("https://svc4.example/mcp"));
    expect(String(r.shard_url)).toContain(`/endpoints/${String(r.key).slice(0, 2)}.json`);
  });
});

describe("one adapter in two batches (the 2026-09-26 mill_cross_runtime shape)", () => {
  const v02 = (VECTORS as { v02: { lines: string[] } }).v02;
  const SPLIT_FILES = (SPLIT as { files: Record<string, string> }).files;
  const roots = (SPLIT as { roots: string[] }).roots;

  it("batchSlug: the adapter alone when unique, adapter + 12 hex of the root when shared", () => {
    const one = [{ adapter: "a", merkle_root: "ab".repeat(32) }, { adapter: "b", merkle_root: "cd".repeat(32) }];
    expect(batchSlug(one, one[0])).toBe("a");
    const two = [{ adapter: "m", merkle_root: "5ae00c1f4c2ed290" + "0".repeat(48) }, { adapter: "m", merkle_root: "78226433e9e433b3" + "0".repeat(48) }];
    expect(two.map((b) => batchSlug(two, b))).toEqual(["m-5ae00c1f4c2e", "m-78226433e9e4"]);
  });

  it("the layout gives each batch its own directory, and measurement_index points at each", async () => {
    serve(SPLIT_FILES);
    const r = await measurementIndex(ORIGIN);
    const bs = r.batches as Array<Record<string, unknown>>;
    expect(bs.map((b) => b.merkle_root)).toEqual(roots);
    expect(new Set(bs.map((b) => b.leaves_url)).size).toBe(2);
    for (const b of bs) expect(String(b.leaves_url)).toContain(`/contract_parity-${String(b.merkle_root).slice(0, 12)}/leaves.json`);
  });

  it("verify_capsule finds every capsule in whichever batch holds it — none is NOT_INCLUDED", async () => {
    serve(SPLIT_FILES);
    for (const [i, line] of v02.lines.entries()) {
      const r = await verifyCapsule(ORIGIN, line);
      expect(r.state, `line ${i}`).toBe("INCLUDED");
      expect((r.batch as Record<string, unknown>).merkle_root).toBe(roots[i < 6 ? 0 : 1]);
      expect((r.inclusion as Record<string, unknown>).recomputed_root).toBe(roots[i < 6 ? 0 : 1]);
    }
  });

  it("server_evidence entries carry their own batch's leaves pointer and the exact capsule line", async () => {
    serve(SPLIT_FILES);
    const r = await serverEvidence(ORIGIN, "https://svc1.example/mcp");
    const caps = r.capsules as Array<{ capsule_id: string; capsule_json: string; batch: { merkle_root: string }; inclusion: { leaves: string } }>;
    expect(caps.length).toBeGreaterThan(0);
    for (const c of caps) {
      expect(c.inclusion.leaves).toContain(c.batch.merkle_root.slice(0, 12));
      expect(await recomputeCapsuleId(parseLexical(c.capsule_json))).toBe(c.capsule_id);
    }
  });
});

// Optional: the real (private) layout. MEASUREMENT_LAYOUT_DIR=/path/to/layout runs every published
// capsule through verify_capsule's id recomputation and every batch root through the TS Merkle.
const LAYOUT = process.env.MEASUREMENT_LAYOUT_DIR;
describe.skipIf(!LAYOUT)("MEASUREMENT_LAYOUT_DIR: the real layout recomputes in TypeScript", () => {
  it("every batch's leaves recompute to its root", async () => {
    const latest = JSON.parse(readFileSync(join(LAYOUT!, "latest.json"), "utf8"));
    for (const ver of latest.versions as RuleVersion[]) {
      const idx = JSON.parse(readFileSync(join(LAYOUT!, `v${ver}`, "index.json"), "utf8"));
      for (const b of idx.batches) {
        const dir = join(LAYOUT!, `v${ver}`, batchSlug(idx.batches, b));
        const lv = JSON.parse(readFileSync(join(dir, "leaves.json"), "utf8"));
        expect((await merkle(ver, lv.leaves)).root).toBe(b.merkle_root);
        // every capsule id, recomputed from the capsule lines the layout PUBLISHES for this batch
        const rec = JSON.parse(readFileSync(join(dir, "record.json"), "utf8"));
        const raw = readFileSync(join(dir, rec.capsules_file.path.split("/").pop()));
        const lines = (rec.capsules_file.path.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean);
        let bad = 0;
        for (const line of lines) if ((await recomputeCapsuleId(parseLexical(line))) !== JSON.parse(line).capsule_id) bad++;
        expect(bad, `${b.adapter}: ${bad} of ${lines.length} ids do not recompute`).toBe(0);
        expect(lines.length).toBe(b.n_capsules);
      }
    }
  }, 1_800_000);

  it("every shard entry's capsule_json is the exact line: it recomputes to the entry's capsule_id", async () => {
    const latest = JSON.parse(readFileSync(join(LAYOUT!, "latest.json"), "utf8"));
    let n = 0;
    let bad = 0;
    for (let s = 0; s < 256; s++) {
      const shard = JSON.parse(readFileSync(join(LAYOUT!, `v${latest.version}`, "endpoints", `${s.toString(16).padStart(2, "0")}.json`), "utf8"));
      for (const ent of Object.values(shard.endpoints) as Array<{ capsules: Array<{ capsule_id: string; capsule_json: string }> }>)
        for (const c of ent.capsules) {
          n++;
          if ((await recomputeCapsuleId(parseLexical(c.capsule_json))) !== c.capsule_id) bad++;
        }
    }
    expect(n).toBeGreaterThan(0);
    expect(bad, `${bad} of ${n} shard lines do not recompute`).toBe(0);
  }, 1_800_000);
});
