// SELF_READ_DATASETS is held to the code, both ways (/api/momentum reports the HF downloads of these
// datasets as "read by our own services", apart from the rest, and never adds the two).
//
//   · A Pages function that reads a csoai/* dataset at request time must be listed with that file:
//     a read is a /datasets/<id>/resolve/ or /api/datasets/<id>/tree/ URL (literal, or through a
//     `const X = "csoai/…"` in the same file), or a dataset passed to the functions/_lib/reach/hf.ts
//     readers (hfTree, signedRecord, newestDaily, resolveUrl).
//   · Every "request" entry must be read by each file it names, and by no file it does not name.
//   · Every "job" entry's files must exist and read the dataset.
// A URL that only TELLS a reader where to fetch (prose inside a response) is not a read; each one is
// named below with the reason, so a new mention has to be classified, not silently ignored.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { SELF_READ_DATASETS } from "./_momentum";

const REPO = resolve(__dirname, "../..");

/** Mentions that are not reads: file -> dataset -> why. */
const NOT_READS: Record<string, Record<string, string>> = {
  "functions/api/state.ts": {
    "csoai/gspc-boards": "prose in the not-measured list, telling a reader where the root mirror is; state.ts does not probe the Hub",
  },
  "functions/api/_rulings_data.ts": {
    "csoai/gspc-jail-goldbank": "an evidence uri (with its sha256) inside signed ruling R-2026-0929-04; the generated module is served as data and fetches nothing",
  },
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|js|mjs)$/.test(name) && !/\.test\.(ts|js)$/.test(name)) out.push(p);
  }
  return out;
}

/** dataset id -> files (repo-relative) that read it at request time. */
function requestTimeReads(): Map<string, Set<string>> {
  const reads = new Map<string, Set<string>>();
  const add = (id: string, file: string) => {
    if (NOT_READS[file]?.[id]) return;
    if (!reads.has(id)) reads.set(id, new Set());
    reads.get(id)!.add(file);
  };
  for (const abs of walk(join(REPO, "functions"))) {
    const file = relative(REPO, abs).split("\\").join("/");
    const src = readFileSync(abs, "utf8");
    const consts = new Map<string, string>();
    for (const m of src.matchAll(/\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"(csoai\/[A-Za-z0-9._-]+)"/g)) consts.set(m[1], m[2]);
    for (const m of src.matchAll(/\/datasets\/(csoai\/[A-Za-z0-9._-]+)\/resolve\//g)) add(m[1], file);
    for (const m of src.matchAll(/\/api\/datasets\/(csoai\/[A-Za-z0-9._-]+)\/tree\//g)) add(m[1], file);
    for (const m of src.matchAll(/\/(?:api\/)?datasets\/\$\{([A-Za-z_][A-Za-z0-9_]*)\}\/(resolve|tree)\//g)) {
      const id = consts.get(m[1]);
      if (id && (m[2] === "resolve" || /\/api\/datasets\/\$\{/.test(m[0]))) add(id, file);
    }
    for (const m of src.matchAll(/\b(?:hfTree|signedRecord|newestDaily|resolveUrl)\(\s*(?:ctx\s*,\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*[,)]/g)) {
      const id = consts.get(m[1]);
      if (id) add(id, file);
    }
  }
  return reads;
}

describe("SELF_READ_DATASETS matches the code that reads our datasets", () => {
  const reads = requestTimeReads();
  const listed = new Map(SELF_READ_DATASETS.map((s) => [s.id, s]));

  it("lists every dataset a Pages function reads at request time, with the files that read it", () => {
    const missing = [...reads.keys()].filter((id) => listed.get(id)?.when !== "request").sort();
    expect(missing, "add these to SELF_READ_DATASETS (when: request)").toEqual([]);
    for (const [id, files] of reads) {
      expect([...files].sort(), id).toEqual([...listed.get(id)!.readers].sort());
    }
  });

  it("names no request-time dataset that no function reads", () => {
    const stale = SELF_READ_DATASETS.filter((s) => s.when === "request" && !reads.has(s.id)).map((s) => s.id);
    expect(stale, "no Pages function reads these any more; remove them or change `when`").toEqual([]);
  });

  it("every job entry's readers exist and read the dataset", () => {
    for (const s of SELF_READ_DATASETS.filter((x) => x.when === "job")) {
      expect(s.readers.length, s.id).toBeGreaterThan(0);
      for (const r of s.readers) {
        expect(existsSync(join(REPO, r)), `${s.id}: ${r} exists`).toBe(true);
        const src = readFileSync(join(REPO, r), "utf8");
        expect(src.includes(s.id), `${s.id}: ${r} names the dataset`).toBe(true);
        expect(/resolve\/|hf_hub_download|\.read\(|urlopen/.test(src), `${s.id}: ${r} reads from the Hub`).toBe(true);
      }
    }
  });

  it("is a list of distinct ids, each a csoai/* dataset", () => {
    const ids = SELF_READ_DATASETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^csoai\/[a-z0-9._-]+$/);
  });

  it("every prose exception still names a dataset its file mentions", () => {
    for (const [file, ids] of Object.entries(NOT_READS)) {
      const src = readFileSync(join(REPO, file), "utf8");
      for (const id of Object.keys(ids)) expect(src.includes(id), `${file} ${id}`).toBe(true);
    }
  });
});
