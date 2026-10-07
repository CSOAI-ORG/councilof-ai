/**
 * scripts/reconcile_derived.py (Lane A repair, 7 Oct 2026): merging master into an automation PR
 * branch regenerates the derived files (OTS manifest, llms.txt, llms-full.txt) instead of failing on
 * them, and still fails closed on any other conflict.
 *
 * The verifier showed the wedge on real bytes: the public-root candidate, with its manifest rebuilt,
 * conflicted in all three derived files after a card-root OTS upgrade landed on master first, and the
 * candidate's reconcile step stopped on every tick. These tests run the script against throwaway git
 * repositories whose "producers" are small stand-ins with the same contract: the manifest is derived
 * from the .ots bytes plus a timestamp line (so two writers always conflict on it, as the real as_of
 * line does), and the llms files are derived from the manifest plus a "live board" value.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/reconcile_derived.py");

// Stand-in producers. STAMP plays the manifest's as_of; BOARD plays the live board llms-txt.mjs reads;
// BOARD=down makes the llms producer throw, as llms-txt.mjs does when the board is unreachable.
const STUB = String.raw`
import hashlib, json, os, pathlib, sys
mode = sys.argv[1]
M = pathlib.Path("public/interop/ots/manifest.json")
def proofs():
    return {p.as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(pathlib.Path("public/interop").glob("*.ots"))}
def llms():
    m = json.loads(M.read_text())
    board = os.environ.get("BOARD", "23 axes")
    if board == "down": sys.exit("board unreachable")
    return (f"manifest as_of {m['as_of']}\nproofs {len(m['proofs'])}\nboard {board}\n",
            f"full\nmanifest as_of {m['as_of']}\n" + "".join(f"{k} {v}\n" for k, v in m["proofs"].items()) + f"board {board}\n")
if mode == "manifest-build":
    for p in pathlib.Path("public/interop").glob("*.bad.ots"):
        p.rename(p.with_name(p.name + ".invalid"))  # the real rebuild quarantines a non-proof like this
    M.parent.mkdir(parents=True, exist_ok=True)
    M.write_text(json.dumps({"as_of": os.environ.get("STAMP", "t0"), "proofs": proofs()}, indent=2) + "\n")
elif mode == "manifest-check":
    try:
        sys.exit(0 if json.loads(M.read_text())["proofs"] == proofs() else 1)
    except Exception:
        sys.exit(1)
elif mode == "llms-build":
    a, b = llms()
    pathlib.Path("public/llms.txt").write_text(a); pathlib.Path("public/llms-full.txt").write_text(b)
elif mode == "llms-check":
    try:
        a, b = llms()
    except BaseException:
        sys.exit(1)
    sys.exit(0 if pathlib.Path("public/llms.txt").read_text() == a and pathlib.Path("public/llms-full.txt").read_text() == b else 1)
`;

const ID = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reconcile-"));
  const stub = path.join(dir, "..", `${path.basename(dir)}-stub.py`);
  fs.writeFileSync(stub, STUB);
  const env = (extra = {}) => ({ ...process.env, ...ID, STAMP: "t0", BOARD: "23 axes", ...extra });
  const git = (...args) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", env: env() });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const produce = (extra = {}) => {
    for (const m of ["manifest-build", "llms-build"]) {
      const r = spawnSync("python3", [stub, m], { cwd: dir, encoding: "utf8", env: env(extra) });
      if (r.status !== 0) throw new Error(`${m}: ${r.stderr}`);
    }
  };
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  };
  const commit = (msg) => { git("add", "-A"); git("commit", "-q", "-m", msg); return git("rev-parse", "HEAD"); };
  const reconcile = (extra = {}) => {
    const p = (m) => `python3 ${stub} ${m}`;
    const r = spawnSync("python3", [SCRIPT, "--onto", "trunk",
      "--manifest-check", p("manifest-check"), "--manifest-build", p("manifest-build"),
      "--llms-check", p("llms-check"), "--llms-build", p("llms-build")], { cwd: dir, encoding: "utf8", env: env(extra) });
    const line = r.stdout.trim().split("\n").pop() || "{}";
    return { status: r.status, out: JSON.parse(line), stderr: r.stderr };
  };
  git("init", "-q");
  git("checkout", "-q", "-b", "trunk");
  put("public/interop/a.ots", "proof a, pending\n");
  put("public/interop/root.json", '{"root": "r0"}\n');
  produce();
  commit("base");
  return { dir, git, put, produce, commit, reconcile, read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8") };
}

/** Two writers: the candidate upgrades a.ots, master gains b.ots (a card-root upgrade landing first). */
function twoWriters(f) {
  f.git("checkout", "-q", "-b", "cand");
  f.put("public/interop/a.ots", "proof a, bitcoin\n");
  f.produce({ STAMP: "t1" });
  f.commit("candidate: upgrade a");
  f.git("checkout", "-q", "trunk");
  f.put("public/interop/b.ots", "proof b, bitcoin\n");
  f.produce({ STAMP: "t2" });
  f.commit("master: card-root upgrade b");
  f.git("checkout", "-q", "cand");
}

const clean = (f) => f.git("status", "--porcelain");

describe("reconcile_derived.py", () => {
  it("control: a plain git merge of the two writers conflicts in exactly the three derived files", () => {
    const f = fixture();
    twoWriters(f);
    const r = spawnSync("git", ["merge", "--no-edit", "trunk"], { cwd: f.dir, encoding: "utf8", env: { ...process.env, ...ID } });
    expect(r.status).not.toBe(0);
    expect(f.git("diff", "--name-only", "--diff-filter=U").split("\n").sort())
      .toEqual(["public/interop/ots/manifest.json", "public/llms-full.txt", "public/llms.txt"]);
  });

  it("resolves a derived-only conflict by regenerating from the merged bytes, in one merge commit", () => {
    const f = fixture();
    twoWriters(f);
    const before = f.git("rev-parse", "HEAD");
    const { status, out, stderr } = f.reconcile({ STAMP: "t3" });
    expect(status, stderr + JSON.stringify(out)).toBe(0);
    expect(out.result).toBe("MERGED");
    expect(out.conflicts_resolved).toEqual(["public/interop/ots/manifest.json", "public/llms-full.txt", "public/llms.txt"]);
    expect(out.regenerated).toEqual(["ots-manifest", "llms"]);
    expect(out.head_before).toBe(before);
    // one merge commit whose parents are the candidate and master
    expect(f.git("rev-list", "--parents", "-n", "1", "HEAD").split(" ")).toHaveLength(3);
    expect(f.git("log", "-1", "--format=%s")).toMatch(/^Merge trunk into cand; derived files regenerated/);
    // both sides' proof bytes, and a manifest and llms that describe both
    const m = JSON.parse(f.read("public/interop/ots/manifest.json"));
    expect(Object.keys(m.proofs).sort()).toEqual(["public/interop/a.ots", "public/interop/b.ots"]);
    expect(f.read("public/interop/a.ots")).toBe("proof a, bitcoin\n");
    expect(m.as_of).toBe("t3");
    expect(f.read("public/llms.txt")).toBe("manifest as_of t3\nproofs 2\nboard 23 axes\n");
    for (const p of ["public/interop/ots/manifest.json", "public/llms.txt", "public/llms-full.txt"]) {
      expect(f.read(p)).not.toMatch(/^(<<<<<<<|=======|>>>>>>>)/m);
    }
    expect(clean(f)).toBe("");
    // the next tick has nothing to do
    expect(f.reconcile({ STAMP: "t4" }).out.result).toBe("UP_TO_DATE");
  });

  it("fails closed on a conflict outside the derived files, with the branch exactly as it was", () => {
    const f = fixture();
    f.git("checkout", "-q", "-b", "cand");
    f.put("public/interop/root.json", '{"root": "candidate"}\n');
    f.produce({ STAMP: "t1" });
    const before = f.commit("candidate root");
    f.git("checkout", "-q", "trunk");
    f.put("public/interop/root.json", '{"root": "master"}\n');
    f.produce({ STAMP: "t2" });
    f.commit("master root");
    f.git("checkout", "-q", "cand");
    const { status, out } = f.reconcile({ STAMP: "t3" });
    expect(status).toBe(1);
    expect(out.result).toBe("CONFLICT_NOT_DERIVED");
    expect(out.conflicts).toContain("public/interop/root.json");
    expect(f.git("rev-parse", "HEAD")).toBe(before);
    expect(spawnSync("git", ["rev-parse", "-q", "--verify", "MERGE_HEAD"], { cwd: f.dir }).status).not.toBe(0);
    expect(clean(f)).toBe("");
    expect(f.read("public/interop/root.json")).toBe('{"root": "candidate"}\n');
  });

  it("regenerates a derived file that went stale on its own (the live board moved), then rests", () => {
    const f = fixture();
    f.git("checkout", "-q", "-b", "cand");
    const before = f.git("rev-parse", "HEAD");
    const r1 = f.reconcile({ BOARD: "24 axes" });
    expect(r1.status, JSON.stringify(r1.out)).toBe(0);
    expect(r1.out.result).toBe("DERIVED_REGENERATED");
    expect(r1.out.regenerated).toEqual(["llms"]);
    expect(f.git("rev-parse", "HEAD^")).toBe(before);
    expect(f.git("diff", "--name-only", "HEAD^", "HEAD").split("\n").sort()).toEqual(["public/llms-full.txt", "public/llms.txt"]);
    expect(f.reconcile({ BOARD: "24 axes" }).out.result).toBe("UP_TO_DATE");
  });

  it("undoes everything when the manifest producer withdraws a served file (quarantine is a human call)", () => {
    const f = fixture();
    twoWriters(f);
    f.git("checkout", "-q", "trunk");
    f.put("public/interop/c.bad.ots", "not a proof\n");
    f.commit("master: a file the rebuild would quarantine");
    f.git("checkout", "-q", "cand");
    const before = f.git("rev-parse", "HEAD");
    const { status, out } = f.reconcile({ STAMP: "t3" });
    expect(status).toBe(1);
    expect(out.result).toBe("REFUSED");
    expect(out.why).toMatch(/outside the derived set/);
    expect(f.git("rev-parse", "HEAD")).toBe(before);
    expect(clean(f)).toBe("");
    expect(fs.existsSync(path.join(f.dir, "public/interop/c.bad.ots.invalid"))).toBe(false);
  });

  it("undoes everything when a producer cannot run (unreachable board): no guess is committed", () => {
    const f = fixture();
    twoWriters(f);
    const before = f.git("rev-parse", "HEAD");
    const { status, out } = f.reconcile({ STAMP: "t3", BOARD: "down" });
    expect(status).toBe(1);
    expect(out.result).toBe("REFUSED");
    expect(out.why).toMatch(/llms producer exited/);
    expect(f.git("rev-parse", "HEAD")).toBe(before);
    expect(clean(f)).toBe("");
  });

  it("refuses to start on a tree with tracked changes", () => {
    const f = fixture();
    f.put("public/interop/a.ots", "edited, not committed\n");
    const { status, out } = f.reconcile();
    expect(status).toBe(1);
    expect(out.result).toBe("REFUSED");
    expect(f.read("public/interop/a.ots")).toBe("edited, not committed\n");
  });
});
