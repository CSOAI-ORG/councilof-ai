// Provable archive surface: public/archive/index.json + public/archive/<subject>/index.json.
//
// Generated at publish time by scripts/build_archive_index.py (bytes only, no key, no
// network) and backfilled from the git history of public/root.json. This gate holds the
// SHAPE: kinds, append-only ordering, dedupe key, entry fields, subject dirs, and the
// vocabulary line (point-in-time facts; never a verdict word, never MEASURED).
//
// It also checks the recorded EVM permission-state fixtures produce ≤3KB cards with the
// right vocabulary, by replaying the adapter through python (no network).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const ARCHIVE = path.join(ROOT, "public", "archive");
const CAP = 3072;
const INDEX_KIND = "csoai.provable-archive-index/0.1";
const SUBJECT_KIND = "csoai.provable-archive-subject/0.1";
const FORBIDDEN = /\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)(?<!Not )(?<!never )MEASURED/;
const VERDICT =
  /\b(hacked|broken|non-?compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b/i;

function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}
const bytes = (s: string) => Buffer.byteLength(s, "utf8");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const haveArchive = existsSync(path.join(ARCHIVE, "index.json"));

describe("public/archive/index.json (provable archive top index)", () => {
  it.skipIf(!haveArchive)("declares its kind, method, root and witness pointer", () => {
    const top = readJson(path.join(ARCHIVE, "index.json"));
    expect(top.kind).toBe(INDEX_KIND);
    expect(top.method).toMatch(/PROVABLE-ARCHIVE-METHOD\.md$/);
    expect(top.root).toBe("https://councilof.ai/root.json");
    expect(top.witness_pointer).toBe("https://councilof.ai/interop/root-witness-pointer.json");
    expect(Array.isArray(top.subjects)).toBe(true);
    expect(top.subjects.length).toBeGreaterThan(0);
    expect(top.roots_indexed).toBeGreaterThan(0);
    expect(top.note).toMatch(/not a rate/i);
    expect(top.note).toMatch(/not for use in or as a financial instrument/i);
    expect(FORBIDDEN.test(JSON.stringify(top))).toBe(false);
  });

  it.skipIf(!haveArchive)("every subject row points at an existing subject index with the same counts", () => {
    const top = readJson(path.join(ARCHIVE, "index.json"));
    for (const s of top.subjects) {
      expect(s.url).toBe(`/archive/${s.dir}/index.json`);
      expect(s.dir).toMatch(/^[a-z0-9.-]+$/);
      const doc = readJson(path.join(ARCHIVE, s.dir, "index.json"));
      expect(doc.kind).toBe(SUBJECT_KIND);
      expect(doc.subject).toBe(s.subject);
      expect(doc.n).toBe(s.n);
      expect(doc.entries.length).toBe(s.n);
      expect(doc.first_as_of).toBe(s.first_as_of);
      expect(doc.last_as_of).toBe(s.last_as_of);
      if (s.latest) expect(s.latest.sha256).toBe(doc.entries[doc.entries.length - 1].sha256);
    }
  });
});

describe("public/archive/<subject>/index.json (append-only series)", () => {
  const dirs = haveArchive
    ? readdirSync(ARCHIVE, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(path.join(ARCHIVE, d.name, "index.json"))).map((d) => d.name)
    : [];

  it.skipIf(!haveArchive)("has at least the XRPL locked series backfilled from git", () => {
    expect(dirs.filter((d) => d.startsWith("xrpl-")).length).toBeGreaterThanOrEqual(1);
  });

  for (const dir of dirs) {
    it(`${dir}: entries are time-ordered, unique on (as_of, sha256), and carry the root + witness refs`, () => {
      const doc = readJson(path.join(ARCHIVE, dir, "index.json"));
      expect(doc.dir).toBe(dir);
      // XRPL symbols may carry non-ASCII (EURØP); EVM subjects are ASCII by construction.
      expect(doc.subject).toMatch(/^(xrpl:[^\s:]+|evm:[A-Za-z0-9-]+:[a-z]+|evm-events:[A-Za-z0-9-]+:[a-z]+|evm-events:scan:[a-z]+)$/);
      expect(doc.note).toMatch(/append-only/i);
      expect(FORBIDDEN.test(JSON.stringify(doc))).toBe(false);
      expect(VERDICT.test(doc.note)).toBe(false);
      const seen = new Set<string>();
      let prev = "";
      for (const e of doc.entries) {
        expect(e.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(e.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(e.card_url).toBe(`/cards/${e.sha256.slice(0, 16)}.json`);
        expect(e.root_merkle).toMatch(/^[0-9a-f]{64}$/);
        expect(e.root_sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(typeof e.root_signed).toBe("boolean");
        expect(typeof e.leaf_signed).toBe("boolean");
        expect("rekor_logIndex" in e).toBe(true);
        expect("ots_path" in e).toBe(true);
        expect("eip1186_proof_sha256" in e).toBe(true);
        if (e.rekor_logIndex != null) expect(e.rekor_url).toBe(`https://rekor.sigstore.dev/api/v1/log/entries?logIndex=${e.rekor_logIndex}`);
        if (e.eip1186_proof_sha256) expect(e.eip1186_proof_url).toBe(`/archive/proofs/eip1186/${e.eip1186_proof_sha256.slice(0, 16)}.json`);
        if (doc.subject.startsWith("evm:")) {
          expect(e.block).toBeGreaterThan(0);
          expect(e.block_hash).toMatch(/^0x[0-9a-f]{64}$/);
        }
        const key = `${e.as_of}|${e.sha256}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(e.as_of >= prev).toBe(true);
        prev = e.as_of;
      }
      // the month files hold the full bytes for every entry
      const months = readdirSync(path.join(ARCHIVE, dir)).filter((f) => /^\d{4}-\d{2}\.jsonl$/.test(f));
      const lines = months.flatMap((m) => readFileSync(path.join(ARCHIVE, dir, m), "utf8").split("\n").filter(Boolean));
      const recorded = new Set(lines.map((l) => { const r = JSON.parse(l); return `${r.root_as_of}|${r.card.sha256}`; }));
      for (const k of seen) expect(recorded.has(k)).toBe(true);
    });
  }
});

describe("EIP-1186 proof blobs beside the archive", () => {
  const dir = path.join(ARCHIVE, "proofs", "eip1186");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  it("proof directory is either absent (no publish yet) or holds only <sha16>.json files", () => {
    for (const f of files) expect(f).toMatch(/^[0-9a-f]{16}\.json$/);
  });
  for (const f of files) {
    it(`${f}: content-addressed by sha256(canonical(result)) and names its block hash`, () => {
      const blob = readJson(path.join(dir, f));
      expect(blob.kind).toBe("csoai.eip1186-proof/0.1");
      expect(f).toBe(`${blob.sha256.slice(0, 16)}.json`);
      expect(blob.block_hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(Array.isArray(blob.result.accountProof)).toBe(true);
      expect(blob.result.accountProof.length).toBeGreaterThan(0);
      const { createHash } = require("node:crypto");
      expect(createHash("sha256").update(canonical(blob.result), "utf8").digest("hex")).toBe(blob.sha256);
      expect(FORBIDDEN.test(blob.note + blob.verify)).toBe(false);
    });
  }
});

describe("EVM permission-state cards replayed from recorded fixtures (python, no network)", () => {
  const script = `
import json, sys
sys.path.insert(0, "scripts")
from adapters import evm_permissions as ep, evm_permission_events as ev
fx = "scripts/adapters/fixtures/"
a = ep.collect(transport=ep.replay_transport(fx + "evm-permissions"), spacing=0, only="BUIDL,USDY,USTB,mTBILL,bIB01,TBILL")
b = ev.collect(None, transport=ep.replay_transport(fx + "evm-events"), state=ev.empty_state(), spacing=0, only="BUIDL,USDY,USTB,mTBILL,bIB01,TBILL")
print(json.dumps({"state": a["leaves"], "events": b["leaves"]}, ensure_ascii=False))
`;
  let out: { state: any[]; events: any[] } | null = null;
  try {
    out = JSON.parse(execFileSync("python3", ["-c", script], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  } catch (e) {
    out = null;
  }

  it.skipIf(!out)("state leaves: ≤3072 canonical bytes, block hash, proof pointer, no forbidden words", () => {
    expect(out!.state.length).toBeGreaterThanOrEqual(12);
    for (const leaf of out!.state) {
      const p = leaf.payload;
      expect(bytes(canonical(p))).toBeLessThanOrEqual(CAP);
      expect(leaf.surface).toBe("public.notice");
      expect(p.schema).toBe("csoai.evm.permission-state/0.1");
      expect(p.subject).toMatch(/^evm:[A-Za-z0-9-]+:[a-z]+$/);
      expect(p.block_hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(Array.isArray(p.checked) ? false : typeof p.checked === "object").toBe(true);
      expect(Array.isArray(p.absent)).toBe(true);
      expect(Array.isArray(p.unmeasured)).toBe(true);
      expect(p.unmeasured.length).toBeGreaterThan(0);
      expect(p.attests).toMatch(/historical permission state at block \d+/);
      if (p.proof) expect(p.proof.url).toBe(`/archive/proofs/eip1186/${p.proof.sha256.slice(0, 16)}.json`);
      expect(FORBIDDEN.test(JSON.stringify(leaf))).toBe(false);
      expect(VERDICT.test(JSON.stringify(leaf))).toBe(false);
    }
  });

  it.skipIf(!out)("event/scan leaves: ≤3072 canonical bytes, per-chain scan coverage, no forbidden words", () => {
    expect(out!.events.length).toBeGreaterThan(0);
    for (const leaf of out!.events) {
      const p = leaf.payload;
      expect(bytes(canonical(p))).toBeLessThanOrEqual(CAP);
      expect(p.subject).toMatch(/^evm-events:/);
      expect(p.head.block_hash).toMatch(/^0x[0-9a-f]{64}$/);
      if (p.schema === "csoai.evm.permission-scan/0.1") {
        expect(p.subject).toMatch(/^evm-events:scan:[a-z]+$/);
        for (const r of p.coverage) expect(r.from).toBeLessThanOrEqual(r.to);
      }
      expect(FORBIDDEN.test(JSON.stringify(leaf))).toBe(false);
    }
  });
});
