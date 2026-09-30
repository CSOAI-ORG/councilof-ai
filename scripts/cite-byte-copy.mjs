#!/usr/bin/env node
// scripts/cite-byte-copy.mjs — give CITATION.cff a byte copy a reader can fetch and hash.
//
// The DOIs in CITATION.cff do not resolve while the Zenodo account is blocked (29 Sep 2026).
// This script keeps them, and adds one identifier that does resolve: a byte copy of the live
// board, served from this site, with the sha256 of its bytes. Nothing is typed by hand:
//
//   node scripts/cite-byte-copy.mjs [--from https://councilof.ai/api/gspc]
//     1. fetches the board bytes and writes them UNALTERED to public/interop/gspc-board-byte-copy-<stamp>.json
//     2. writes the identifier (url + sha256 + byte length + when fetched) into CITATION.cff and
//        public/CITATION.cff, replacing any earlier byte-copy identifier (older copies stay served)
//   node scripts/cite-byte-copy.mjs --check
//     re-hashes every byte copy CITATION.cff names and exits 1 on any mismatch or missing file.
//
// The copy is a snapshot, not the live board: its site_attestation (if present) verifies over its
// own bytes, and the live board may have moved on since. The identifier's description says so.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://councilof.ai";
const CFFS = ["CITATION.cff", "public/CITATION.cff"];
const MARK = "Byte copy of GET /api/gspc";
const sha = (b) => createHash("sha256").update(b).digest("hex");

/** Every byte-copy identifier in a CITATION.cff: { url, sha256, bytes }. */
export function byteCopies(cff) {
  const out = [];
  const re = /- type: url\n\s+value: "(https:\/\/councilof\.ai\/[^"]+)"\n\s+description: "Byte copy of GET \/api\/gspc[^"]*?sha256 ([0-9a-f]{64}), (\d+) bytes/g;
  let m;
  while ((m = re.exec(cff))) out.push({ url: m[1], sha256: m[2], bytes: Number(m[3]) });
  return out;
}

function check() {
  let bad = 0, n = 0;
  for (const f of CFFS) {
    const copies = byteCopies(readFileSync(join(ROOT, f), "utf8"));
    if (!copies.length) { console.error(`FAIL ${f}: no byte-copy identifier`); bad++; continue; }
    for (const c of copies) {
      n++;
      const p = join(ROOT, "public", new URL(c.url).pathname);
      if (!existsSync(p)) { console.error(`FAIL ${f}: ${c.url} → ${p} missing`); bad++; continue; }
      const b = readFileSync(p);
      if (sha(b) !== c.sha256 || b.length !== c.bytes) { console.error(`FAIL ${f}: ${c.url} sha256/bytes mismatch`); bad++; }
    }
  }
  console.log(bad ? `cite-byte-copy: ${bad} failure(s)` : `cite-byte-copy: ${n} byte-copy identifier(s) reproduce`);
  process.exit(bad ? 1 : 0);
}

async function write(from) {
  const r = await fetch(from, { headers: { accept: "application/json" } });
  if (r.status !== 200) throw new Error(`GET ${from} → HTTP ${r.status}`);
  const bytes = Buffer.from(await r.arrayBuffer());
  const board = JSON.parse(bytes.toString("utf8"));
  const fetched = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const stamp = fetched.replace(/[-:]/g, "").replace(/\d\dZ$/, "Z");
  const rel = `interop/gspc-board-byte-copy-${stamp}.json`;
  writeFileSync(join(ROOT, "public", rel), bytes);
  const hex = sha(bytes);
  const signed = board?.site_attestation?.sig ? "carries its site_attestation (verify it over these bytes)" : "carries no site_attestation";
  const block =
    `  - type: url\n` +
    `    value: "${SITE}/${rel}"\n` +
    `    description: "${MARK} as served ${fetched}: sha256 ${hex}, ${bytes.length} bytes. ` +
    `Resolves now, unlike the DOIs above. The copy ${signed}. ` +
    `A snapshot, not the live board (${SITE}/api/gspc), which may have moved on. Measurement, not certification."\n`;
  for (const f of CFFS) {
    const p = join(ROOT, f);
    let cff = readFileSync(p, "utf8");
    cff = cff.replace(/  - type: url\n    value: "[^"]+"\n    description: "Byte copy of GET \/api\/gspc[^"]*"\n/g, "");
    if (!/\nabstract:/.test(cff)) throw new Error(`${f}: no abstract: key to insert before`);
    cff = cff.replace(/\nabstract:/, `\n${block.replace(/\n$/, "")}\nabstract:`);
    writeFileSync(p, cff);
  }
  console.log(`wrote public/${rel} (${bytes.length} bytes, sha256 ${hex}) and updated ${CFFS.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  if (a.includes("--check")) check();
  else {
    const i = a.indexOf("--from");
    write(i >= 0 ? a[i + 1] : `${SITE}/api/gspc`).catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
  }
}
