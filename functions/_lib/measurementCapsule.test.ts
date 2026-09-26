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

// Optional: the real (private) layout. MEASUREMENT_LAYOUT_DIR=/path/to/layout runs every published
// capsule through verify_capsule's id recomputation and every batch root through the TS Merkle.
const LAYOUT = process.env.MEASUREMENT_LAYOUT_DIR;
describe.skipIf(!LAYOUT)("MEASUREMENT_LAYOUT_DIR: the real layout recomputes in TypeScript", () => {
  it("every batch's leaves recompute to its root", async () => {
    const latest = JSON.parse(readFileSync(join(LAYOUT!, "latest.json"), "utf8"));
    for (const ver of latest.versions as RuleVersion[]) {
      const idx = JSON.parse(readFileSync(join(LAYOUT!, `v${ver}`, "index.json"), "utf8"));
      for (const b of idx.batches) {
        const lv = JSON.parse(readFileSync(join(LAYOUT!, `v${ver}`, b.adapter, "leaves.json"), "utf8"));
        expect((await merkle(ver, lv.leaves)).root).toBe(b.merkle_root);
        // every capsule id, recomputed from the batch's own capsule lines (index "dir" names the batch)
        const rec = JSON.parse(readFileSync(join(b.dir, "record.json"), "utf8"));
        const raw = readFileSync(join(b.dir, rec.capsules_file.path));
        const lines = (rec.capsules_file.path.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8").split("\n").filter(Boolean);
        let bad = 0;
        for (const line of lines) if ((await recomputeCapsuleId(parseLexical(line))) !== JSON.parse(line).capsule_id) bad++;
        expect(bad, `${b.adapter}: ${bad} of ${lines.length} ids do not recompute`).toBe(0);
        expect(lines.length).toBe(b.n_capsules);
      }
    }
  }, 1_800_000);
});
