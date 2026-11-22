// SPDX-License-Identifier: MIT
// Exact-byte integrity, not a classifier for malicious intent or model compromise.
import { createHash } from "node:crypto";
const HASH = /^[a-f0-9]{64}$/;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function validPath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/") &&
    !path.includes("\\") && !path.split("/").some(x => x === "" || x === "." || x === "..");
}
export function datasetManifest(files) {
  if (!Array.isArray(files)) throw new TypeError("files must be an array");
  const rows = files.map(({path, bytes}) => {
    if (!validPath(path)) throw new Error("unsafe dataset path");
    if (!(bytes instanceof Uint8Array) && typeof bytes !== "string") throw new TypeError("bytes must be string or Uint8Array");
    const b = typeof bytes === "string" ? Buffer.from(bytes, "utf8") : Buffer.from(bytes);
    return { path, sha256: sha(b), size: b.length };
  }).sort((x,y) => x.path < y.path ? -1 : x.path > y.path ? 1 : 0);
  for (let i=1;i<rows.length;i++) if (rows[i].path === rows[i-1].path) throw new Error("duplicate path");
  const root = sha(Buffer.from(rows.map(r=>JSON.stringify([r.path,r.size,r.sha256])).join("\n"), "utf8"));
  return { schema:"csoai.dataset-manifest/0.1", digest_algorithm:"SHA-256", entries:rows, manifest_sha256:root };
}
export function compareDatasetManifests(before, after) {
  const validate = m => {
    if (m?.schema !== "csoai.dataset-manifest/0.1" || !Array.isArray(m.entries) || !HASH.test(m.manifest_sha256 ?? ""))
      throw new Error("bad manifest");
    for (const r of m.entries) if (!validPath(r.path) || !HASH.test(r.sha256) || !Number.isSafeInteger(r.size) || r.size < 0)
      throw new Error("bad manifest entry");
    const expected = sha(Buffer.from([...m.entries].sort((x,y)=>x.path < y.path ? -1 : x.path > y.path ? 1 : 0).map(r=>JSON.stringify([r.path,r.size,r.sha256])).join("\n"), "utf8"));
    if (m.manifest_sha256 !== expected) throw new Error("tampered manifest");
    if (new Set(m.entries.map(r=>r.path)).size !== m.entries.length) throw new Error("duplicate path");
  };
  validate(before); validate(after);
  const oldMap = new Map(before.entries.map(r=>[r.path,r])), newMap = new Map(after.entries.map(r=>[r.path,r]));
  const changed = [], added=[], removed=[];
  for (const [path,row] of newMap) {
    const previous=oldMap.get(path);
    if (!previous) added.push(path);
    else if (previous.sha256 !== row.sha256 || previous.size !== row.size) changed.push(path);
  }
  for (const path of oldMap.keys()) if (!newMap.has(path)) removed.push(path);
  return { schema:"csoai.dataset-delta/0.1", baseline_sha256:before.manifest_sha256,
    candidate_sha256:after.manifest_sha256, changed, added, removed, identical:!(changed.length+added.length+removed.length),
    assurance:"EXACT_BYTES_ONLY_NO_POISONING_OR_BEHAVIOURAL_VERDICT" };
}
