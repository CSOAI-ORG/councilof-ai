// The published source texts of the frozen corpus must regenerate every manifest hash and the root,
// in JavaScript and with the original Python normaliser, and the two normalisers must agree.
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error: plain ESM script, no type declarations
import { parseSources, verifySources, SOURCES, MANIFEST, FROZEN_TEXT_CAP } from "./frozen-sources.mjs";
// @ts-expect-error: plain ESM script, no type declarations
import { normalise, provisionHash, corpusRoot } from "./normaliser-v1.mjs";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p));
const manifest = JSON.parse(read(MANIFEST).toString("utf8"));
const rows = parseSources(read(SOURCES));
const coverage = JSON.parse(read("public/mechanism/coverage.json").toString("utf8"));
const PINNED_ROOT = "37e2e10d53feaa9e12097f45113e1234510be0ca471e1a0848f5805db3e367c7";

const python = spawnSync("python3", ["--version"]).status === 0;
const runPython = (args: string[], input?: string) =>
  spawnSync("python3", args, { cwd: ROOT, input, encoding: "utf8", env: { ...process.env, PYTHONSAFEPATH: "" } });

describe("frozen provision source texts", () => {
  it("regenerate every manifest hash and the corpus root", () => {
    const v = verifySources(rows, manifest);
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.rows).toBe(Object.keys(manifest.anchors).length);
    expect(v.hashes_reproduced).toBe(Object.keys(manifest.anchors).length);
    expect(v.hashes_reproduced).toBe(417);
    expect(v.corpus_root).toBe(manifest.corpus_root);
    expect(v.corpus_root).toBe(PINNED_ROOT);
  });

  it("each row carries a source and is unique; texts at the frozen cap are listed, not hidden", () => {
    const ids = rows.map((r: { provision_id: string }) => r.provision_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rows) {
      expect(r.source?.kind, r.provision_id).toMatch(/^(git_db|cellar_xhtml_refetch)$/);
      if (r.source.kind === "git_db") expect(r.source.db_sha256).toMatch(/^[0-9a-f]{64}$/);
      else expect(r.source.xhtml_sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    const capped = rows.filter((r: { text: string }) => [...r.text].length === FROZEN_TEXT_CAP).map((r: { provision_id: string }) => r.provision_id).sort();
    expect(verifySources(rows, manifest).texts_at_frozen_cap).toEqual(capped);
    expect(rows.filter((r: { truncated_at_10000: boolean }) => r.truncated_at_10000).map((r: { provision_id: string }) => r.provision_id).sort()).toEqual(capped);
    expect(capped).toEqual(
      ["32022L2464:1", "32022L2464:3", "32022L2464:25", "32022L2464:29", "32022L2555:6", "32022L2555:32", "32022R2554:3", "32024R1689:3", "32024R1689:5", "32024R2847:3", "32024R2847:13"].sort(),
    );
    const flipped = rows.map((r: object, i: number) => (i === 0 ? { ...r, truncated_at_10000: !(r as { truncated_at_10000: boolean }).truncated_at_10000 } : r));
    expect(verifySources(flipped, manifest).problems.join()).toMatch(/truncated_at_10000/);
  });

  it("fails on one changed character, a dropped row, a duplicate row or a stray row", () => {
    const edited = rows.map((r: object, i: number) => (i === 7 ? { ...r, text: `${(r as { text: string }).text}.` } : r));
    const e = verifySources(edited, manifest);
    expect(e.ok).toBe(false);
    expect(e.hashes_reproduced).toBe(rows.length - 1);
    expect(e.corpus_root_reproduced).toBe(false);
    expect(verifySources(rows.slice(1), manifest).ok).toBe(false);
    expect(verifySources([...rows, rows[0]], manifest).problems.join()).toMatch(/more than one row/);
    expect(verifySources([...rows, { ...rows[0], provision_id: "32024R1689:999" }], manifest).problems.join()).toMatch(/not in the manifest/);
  });

  it("the coverage report states what the texts prove, derived from these bytes", () => {
    expect(coverage.corpus.source_database_state).toBe("SOURCE_BYTES_RECOVERED");
    expect(coverage.corpus.source_texts.sha256).toBe(createHash("sha256").update(read(SOURCES)).digest("hex"));
    expect(coverage.corpus.source_texts.hashes_reproduced).toBe(Object.keys(manifest.anchors).length);
    expect(coverage.corpus.source_texts.licence).toMatch(/2011\/833\/EU/);
  });

  it("the JS normaliser keeps the Python rules: editorial marks, quotes, dashes, whitespace, casefold", () => {
    expect(normalise("  \u25baM3 Article\u00a01 \u2014 \u201cText\u201d (OJ L 123, 1.1.2020, p. 1) [consolidated text] \u25bcB ")).toBe(
      'article 1 - "text"',
    );
    expect(normalise("Stra\u00dfe \u1e9e \u03a3\u03c2 \ufb01")).toBe("strasse ss \u03c3\u03c3 fi");
    expect(normalise("a\u00adb\u200bc")).toBe("abc");
    expect(() => normalise(null)).toThrow(/UNKNOWN/);
    expect(provisionHash("x")).toBe(createHash("sha256").update("1.0.0\u0000x").digest("hex"));
    expect(corpusRoot(manifest.anchors)).toBe(manifest.corpus_root);
  });

  it.skipIf(!python)("agrees with the original Python normaliser on hard cases", () => {
    const cases = [
      "\u25baM\u0663 x", "\u25bc\u0130 y", "CONSOL\u0130DATED TEXT", "consol\u0131dated text", "a\u001cb\u0085c\u2028d\u3000e",
      "\u212a\u017f\u0130\u0131", "\u13a0\u13f8\uab70", "\u0587\u1e9e\u1f80\u00b5", "(OJ\u2003L 1) \u25ba C12\t z", " \ufeff lead",
    ];
    const r = runPython(
      ["-c", "import json,sys,importlib.util as u;s=u.spec_from_file_location('n','scripts/mechanism/normaliser_v1.py');m=u.module_from_spec(s);s.loader.exec_module(m);print(json.dumps([m.normalise(c) for c in json.load(sys.stdin)]))"],
      JSON.stringify(cases),
    );
    expect(r.status, r.stderr).toBe(0);
    expect(cases.map((c) => normalise(c))).toEqual(JSON.parse(r.stdout));
  });

  it.skipIf(!python)("the Python reproduce script passes, with its tamper self-test", () => {
    const r = runPython(["scripts/mechanism/verify_frozen_sources.py", "--selftest"]);
    expect(r.status, r.stderr).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.hashes_reproduced).toBe(417);
    expect(out.corpus_root).toBe(PINNED_ROOT);
    expect(out.problems).toEqual([]);
  });
});
