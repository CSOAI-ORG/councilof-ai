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

// Re-derivable bindings. The three binding files on master are at fixed paths, so the fixture uses
// those paths. A proof is "upgraded" here by writing a Bitcoin-attested proof over the pending one
// (ots-upgrade.py needs the network); --rederive is what runs after ots_block_check.py.
const REDERIVE_FIXTURE = String.raw`
import base64, hashlib, io, json, pathlib, sys
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
repo, mode = pathlib.Path(sys.argv[1]), sys.argv[2]
def proof(data, heights=()):
    t = Timestamp(hashlib.sha256(data).digest())
    t.attestations.add(PendingAttestation("https://a.pool.opentimestamps.org"))
    for h in heights: t.attestations.add(BitcoinBlockHeaderAttestation(h))
    out = io.BytesIO(); DetachedTimestampFile(OpSHA256(), t).serialize(StreamSerializationContext(out)); return out.getvalue()
def put(rel, data):
    p = repo / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data); return data
sha = lambda b: hashlib.sha256(b).hexdigest()
if mode == "init":
    press = put("public/press/p.md", b"press body")
    pp = put("public/press/p.md.ots", proof(press))
    idx = put("public/measurement-capsules/v0.2/index.json", b"index body")
    ip = put("public/measurement-capsules/v0.2/index.json.ots", proof(idx))
    put("public/interop/ots-exact-bindings-v1.json", (json.dumps({"schema": "csoai.ots-exact-byte-bindings/0.1", "signed": False, "bindings": {
        "press/p.md.ots": {"target": "press/p.md", "digest": sha(press), "proof_sha256": sha(pp)}}}, indent=2) + "\n").encode())
    put("public/measurement-capsules/v0.2/anchors.json", (json.dumps({"schema": "csoai.measurement-anchors/0.1", "as_of": "2026-10-01T08:52:55Z",
        "opentimestamps": {"file": "measurement-index.json.ots", "proof_sha256": sha(ip), "state": "PENDING_CALENDAR_COMMITMENT",
                           "bitcoin_block_heights": [], "bitcoin": []}, "xrpl": {"state": "PREPARED_NOT_SUBMITTED"}}, indent=1) + "\n").encode())
    # a proof bound by a STAMPED binding file stays BOUND
    s = put("public/x/s.json", b"s body"); sp = put("public/x/s.json.ots", proof(s))
    put("public/x/stamped.json", ('{"proof_sha256": "%s"}\n' % sha(sp)).encode()); put("public/x/stamped.json.ots", b"x")
elif mode == "upgrade":  # what ots-upgrade.py would have written for the two re-derivable proofs
    for rel, subj, hs in [("public/press/p.md.ots", "public/press/p.md", (970162, 970163)),
                          ("public/measurement-capsules/v0.2/index.json.ots", "public/measurement-capsules/v0.2/index.json", (969421,))]:
        put(rel, proof((repo / subj).read_bytes(), hs))
`;

describe("ots_upgrade_pending.py re-derives the bindings it knows, and only those", () => {
  const py = (args, cwd) => spawnSync("python3", args, { cwd, encoding: "utf8", timeout: 60_000 });
  function setup() {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "otsre-"));
    expect(py(["-c", REDERIVE_FIXTURE, repo, "init"]).status).toBe(0);
    for (const args of [["init", "-q"], ["add", "-A"], ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base"]]) {
      spawnSync("git", args, { cwd: repo });
    }
    const dry = path.join(repo, "..", path.basename(repo) + "-dry.json");
    const r = py([path.join(ROOT, "scripts/ots_upgrade_pending.py"), "--repo", repo, "--report", dry, "--dry-run"]);
    expect(r.status, r.stderr).toBe(0);
    return { repo, plan: JSON.parse(fs.readFileSync(dry, "utf8")) };
  }
  const sha = (p) => spawnSync("sha256sum", [p], { encoding: "utf8" }).stdout.split(" ")[0];
  function report(repo, plan, rows) {
    const old = { "public/press/p.md.ots": sha(path.join(repo, "public/press/p.md.ots")),
      "public/measurement-capsules/v0.2/index.json.ots": sha(path.join(repo, "public/measurement-capsules/v0.2/index.json.ots")) };
    expect(py(["-c", REDERIVE_FIXTURE, repo, "upgrade"]).status).toBe(0);
    const rep = { upgraded: Object.keys(old), still_pending: [], rederive: {}, staged_as: {
      "public/press/p.md.ots": "000-p.md.ots", "public/measurement-capsules/v0.2/index.json.ots": "001-index.json.ots" } };
    for (const [p, o] of Object.entries(old)) rep.rederive[p] = { old_sha256: o, bindings: plan.rederive_pending.includes(p) ? [
      p.startsWith("public/press") ? "public/interop/ots-exact-bindings-v1.json" : "public/measurement-capsules/v0.2/anchors.json"] : [] };
    const rp = path.join(repo, "..", path.basename(repo) + "-rep.json");
    const bc = path.join(repo, "..", path.basename(repo) + "-bc.json");
    fs.writeFileSync(rp, JSON.stringify(rep));
    fs.writeFileSync(bc, JSON.stringify({ ran_at: "2026-10-07T09:00:00Z", sources: ["blockstream.info", "mempool.space"], rows }));
    const r = py([path.join(ROOT, "scripts/ots_upgrade_pending.py"), "--repo", repo, "--rederive", "--report", rp, "--block-check", bc]);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    return { out: JSON.parse(fs.readFileSync(rp, "utf8")), old };
  }
  const MATCH = [{ path: "/t/000-p.md.ots", block_height: 970162, state: "MATCHES_BLOCK_HEADER" },
    { path: "/t/000-p.md.ots", block_height: 970163, state: "MATCHES_BLOCK_HEADER" },
    { path: "/t/001-index.json.ots", block_height: 969421, state: "MATCHES_BLOCK_HEADER" }];

  it("plans: unsigned known bindings are re-derivable; a stamped binding keeps its proof BOUND", () => {
    const { plan } = setup();
    expect(plan.rederive_pending).toEqual(["public/measurement-capsules/v0.2/index.json.ots", "public/press/p.md.ots"]);
    expect(Object.keys(plan.bound_skipped)).toEqual(["public/x/s.json.ots"]);
    expect(plan.bound_skipped_why["public/x/s.json.ots"]["public/x/stamped.json"]).toMatch(/no known producer/);
    expect(plan.still_pending).toEqual(["public/measurement-capsules/v0.2/index.json.ots", "public/press/p.md.ots"]);
  });

  it("rewrites the exact-binding row and the anchors state from the explorer check, byte-layout preserved", () => {
    const { repo, plan } = setup();
    const { out } = report(repo, plan, MATCH);
    expect(out.rederive_failed).toEqual({});
    expect(Object.keys(out.rederived).sort()).toEqual(["public/measurement-capsules/v0.2/index.json.ots", "public/press/p.md.ots"]);
    const eb = JSON.parse(fs.readFileSync(path.join(repo, "public/interop/ots-exact-bindings-v1.json"), "utf8"));
    expect(eb.bindings["press/p.md.ots"].proof_sha256).toBe(sha(path.join(repo, "public/press/p.md.ots")));
    expect(eb.bindings["press/p.md.ots"].digest).toBe(sha(path.join(repo, "public/press/p.md")));
    const an = JSON.parse(fs.readFileSync(path.join(repo, "public/measurement-capsules/v0.2/anchors.json"), "utf8"));
    expect(an.opentimestamps.proof_sha256).toBe(sha(path.join(repo, "public/measurement-capsules/v0.2/index.json.ots")));
    expect(an.opentimestamps.state).toBe("BITCOIN_ATTESTED");
    expect(an.opentimestamps.bitcoin_block_heights).toEqual([969421]);
    expect(an.opentimestamps.bitcoin).toEqual([{ height: 969421, header_check: "MATCHES_BLOCK_HEADER", checked_against: ["blockstream.info", "mempool.space"] }]);
    expect(an.as_of).toBe("2026-10-01T08:52:55Z");
    // only the opentimestamps block changed: same indent-1 layout, every other line identical
    const diff = spawnSync("git", ["diff", "--numstat", "--", "public/measurement-capsules/v0.2/anchors.json", "public/interop/ots-exact-bindings-v1.json"],
      { cwd: repo, encoding: "utf8" }).stdout.trim().split("\n").map((l) => l.split("\t"));
    const added = Object.fromEntries(diff.map(([a, d, f]) => [f, [Number(a), Number(d)]]));
    expect(added["public/interop/ots-exact-bindings-v1.json"]).toEqual([1, 1]);
    const [plus, minus] = added["public/measurement-capsules/v0.2/anchors.json"];
    expect(minus).toBe(4); // proof_sha256, state and the two empty lists; nothing outside opentimestamps
    expect(plus).toBeGreaterThan(minus);
  });

  it("puts a proof back, with its binding, when the explorer check did not match every attestation", () => {
    const { repo, plan } = setup();
    const anchorsBefore = fs.readFileSync(path.join(repo, "public/measurement-capsules/v0.2/anchors.json"), "utf8");
    const { out, old } = report(repo, plan, [MATCH[0], MATCH[1], { ...MATCH[2], state: "UNCHECKABLE" }]);
    expect(Object.keys(out.rederive_failed)).toEqual(["public/measurement-capsules/v0.2/index.json.ots"]);
    expect(out.upgraded).toEqual(["public/press/p.md.ots"]);
    expect(out.still_pending).toContain("public/measurement-capsules/v0.2/index.json.ots");
    expect(sha(path.join(repo, "public/measurement-capsules/v0.2/index.json.ots"))).toBe(old["public/measurement-capsules/v0.2/index.json.ots"]);
    expect(fs.readFileSync(path.join(repo, "public/measurement-capsules/v0.2/anchors.json"), "utf8")).toBe(anchorsBefore);
  });
}, 120_000);

describe("ots-upgrade.yml wiring", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/ots-upgrade.yml"), "utf8");
  it("reconciles an open PR, checks explorers, re-derives bindings and rebuilds derived files before any push", () => {
    const at = (name) => wf.indexOf(`- name: ${name}`);
    const order = ["Find the open upgrade PR", "Reconcile the open upgrade PR with master", "Upgrade pending-only proofs in place",
      "Check each new Bitcoin attestation against two block explorers", "Re-derive the bindings of upgraded bound proofs",
      "Rebuild the OTS manifest and llms files from the proof bytes", "Commit, push and dispatch the gates once"];
    const idx = order.map(at);
    expect(idx.every((i) => i > 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(wf).toContain("python3 scripts/ots_upgrade_pending.py --report");
    expect(wf).toContain("--rederive --report");
    expect(wf).toContain("python3 scripts/ots_block_check.py --dir");
    expect(wf).toContain('startswith("ots/upgrade-")');
    expect(wf).toContain('branch="ots/upgrade-${GITHUB_RUN_ID}"');
    // the open PR is maintained, not skipped: its branch is checked out and merged with master
    expect(wf).toContain("ref: ${{ steps.open.outputs.branch || 'master' }}");
    expect(wf).toContain('python3 "$RUNNER_TEMP/reconcile_derived.py" --onto origin/master');
    expect(wf).not.toMatch(/Skip while an upgrade PR is open/);
    expect(wf).toContain("node scripts/mechanism/capsule-vc.mjs --check");
    expect(wf).not.toMatch(/HEAD:master|gh pr merge|--force/);
  });
});
