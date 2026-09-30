import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import DOC from "@/data/a2a-tck-jcs-2026-09-27.json";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const DIR = "public/interop/a2a-jcs-2026-09-27/";

describe("/interop/a2a-jcs-2026-09-27 — every count is the runner's own record", () => {
  it("each implementation's counts equal its published runner record, whose sha256 matches", () => {
    for (const i of DOC.implementations) {
      const raw = readFileSync(root + DIR + i.record);
      expect(createHash("sha256").update(raw).digest("hex"), i.record).toBe(i.record_sha256);
      const rec = JSON.parse(raw.toString("utf8"));
      expect(rec.corpusDigest).toBe(DOC.vectors.corpus_digest);
      for (const [t, v] of Object.entries(i.targets)) {
        expect(v.passed, `${i.key} ${t}`).toBe(rec.targets[t].passed);
        expect(v.vectors, `${i.key} ${t}`).toBe(rec.targets[t].vectors);
      }
    }
  });

  it("the census verifier passes every vector on both rule paths, before and after the rfc8785 swap", () => {
    for (const k of ["probe", "probe1x", "probe_patched", "probe_patched_1x", "reference"]) {
      const i = DOC.implementations.find((x) => x.key === k)!;
      expect(i.targets["card-signing-input"].passed, k).toBe(57);
      expect(i.targets["card-signing-input"].vectors, k).toBe(57);
    }
  });

  it("no census verdict changes, and the per-card file that names hosts is not published", () => {
    for (const c of DOC.census) expect(c.signed_cards_whose_signing_input_changes, c.run).toBe(0);
    expect(existsSync(root + DIR + "runs/census_strict_jcs.txt")).toBe(false);
    expect(readdirSync(root + DIR + "runs").sort()).toEqual(
      [...DOC.implementations.map((i) => i.record.replace("runs/", "")), "fuzz_beyond_corpus.txt", "table.json"].sort(),
    );
    expect(readFileSync(root + DIR + "summary.json", "utf8")).toBe(readFileSync(root + "client/src/data/a2a-tck-jcs-2026-09-27.json", "utf8"));
  });
});
