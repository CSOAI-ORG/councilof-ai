/**
 * scripts/ots_upgrade_pending.py (A-G4, 7 Oct 2026), run offline (--dry-run) on a fixture repo.
 * It must pick only pending-only proofs, leave card-root and public-root proofs to their own
 * maintainers, and skip a proof whose exact bytes another tracked file names (hex or SRI), because
 * upgrading it would break that binding. The OTS manifest naming a proof is not a binding: it is
 * rebuilt from the bytes in the same change.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FIXTURE = String.raw`
import base64, hashlib, io, pathlib, sys
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
repo = pathlib.Path(sys.argv[1])
def proof(data, btc=False):
    t = Timestamp(hashlib.sha256(data).digest())
    t.attestations.add(BitcoinBlockHeaderAttestation(970000) if btc else PendingAttestation("https://a.pool.opentimestamps.org"))
    out = io.BytesIO(); DetachedTimestampFile(OpSHA256(), t).serialize(StreamSerializationContext(out)); return out.getvalue()
def put(rel, data):
    p = repo / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data); return data
for rel, btc in [("public/interop/a.json", False), ("public/interop/b.json", True), ("public/x/c.json", False),
                 ("public/interop/card-root-2026-10-01.json", False), ("public/interop/root-abcdef12.json", False),
                 ("public/press/d.md", False)]:
    body = put(rel, ("subject " + rel).encode())
    put(rel + ".ots", proof(body, btc))
c = (repo / "public/x/c.json.ots").read_bytes()
put("public/x/binding.json", ('{"proof": "sha256-%s"}' % base64.b64encode(hashlib.sha256(c).digest()).decode()).encode())
d = (repo / "public/press/d.md.ots").read_bytes()
put("public/interop/exact-bindings.json", ('{"proof_sha256": "%s"}' % hashlib.sha256(d).hexdigest()).encode())
a = (repo / "public/interop/a.json.ots").read_bytes()
put("public/interop/ots/manifest.json", ('{"proofs": [{"sha256_of_proof": "%s"}]}' % hashlib.sha256(a).hexdigest()).encode())
`;

describe("ots_upgrade_pending.py", () => {
  it("selects pending-only proofs, defers maintained families, and skips bound proofs", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "otsup-"));
    const fx = spawnSync("python3", ["-c", FIXTURE, repo], { encoding: "utf8" });
    expect(fx.status, fx.stderr).toBe(0);
    for (const args of [["init", "-q"], ["add", "-A"]]) spawnSync("git", args, { cwd: repo });
    const report = path.join(repo, "report.json");
    const r = spawnSync("python3", [path.join(ROOT, "scripts/ots_upgrade_pending.py"), "--repo", repo, "--report", report, "--dry-run"],
      { encoding: "utf8", timeout: 60_000 });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const out = JSON.parse(fs.readFileSync(report, "utf8"));
    expect(out.dry_run).toBe(true);
    expect(out.upgraded).toEqual([]);
    // only a.json.ots is free to upgrade; the manifest naming it does not bind it
    expect(out.still_pending).toEqual(["public/interop/a.json.ots"]);
    expect(out.bound_skipped).toEqual({
      "public/press/d.md.ots": ["public/interop/exact-bindings.json"],
      "public/x/c.json.ots": ["public/x/binding.json"],
    });
    expect(out.own_maintainer_skipped).toEqual(["public/interop/card-root-2026-10-01.json.ots", "public/interop/root-abcdef12.json.ots"]);
    expect(out.chain_verified).toBe(false);
    expect(r.stdout).toMatch(/BOUND public\/x\/c\.json\.ots <- public\/x\/binding\.json/);
  }, 90_000);
});

describe("ots-upgrade.yml wiring", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/ots-upgrade.yml"), "utf8");
  it("checks explorers and rebuilds derived files before any PR, one open PR at a time", () => {
    const at = (name) => wf.indexOf(`- name: ${name}`);
    const order = ["Skip while an upgrade PR is open", "Upgrade pending-only proofs in place",
      "Check each new Bitcoin attestation against two block explorers",
      "Rebuild the OTS manifest and llms files from the proof bytes", "Open the review PR and dispatch its gates"];
    const idx = order.map(at);
    expect(idx.every((i) => i > 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(wf).toContain("python3 scripts/ots_upgrade_pending.py --report");
    expect(wf).toContain("python3 scripts/ots_block_check.py --dir");
    expect(wf).toContain('select(.headRefName | startswith("ots/upgrade-"))');
    expect(wf).toContain('branch="ots/upgrade-${GITHUB_RUN_ID}"');
    // nothing downstream runs when the upgrade step was skipped (an empty output is not "changed")
    expect(wf.match(/steps\.up\.outputs\.upgraded != '' && steps\.up\.outputs\.upgraded != '0'/g)).toHaveLength(3);
    expect(wf).not.toMatch(/HEAD:master|gh pr merge/);
  });
});
