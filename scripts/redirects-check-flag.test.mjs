// scripts/generate-redirects.mjs --check must COMPARE, never regenerate.
//
// 2026-09-23: it had no argv handling at all, so `--check` was silently ignored and the run
// rewrote public/_redirects. Running the check on a clean tree therefore left the tree dirty
// with a change the lane never made — and because the file is 700 lines of generated rules, that
// diff rides quietly into whatever commit comes next. The observed drift (one missing /reach
// rule) was real, but nobody should have to discover it by finding their working tree modified.
//
// These tests run the real script against a SANDBOX ROOT rather than the repository, because a
// test that proves "--check does not write" by writing to public/_redirects would be the same
// defect wearing a different hat. The script derives every path from its own location
// (import.meta.url -> ROOT), so copying it into a temp scripts/ dir and symlinking client/,
// functions/ and each entry of public/ beside it gives it a complete, real input tree whose only
// writable file is the sandbox's own _redirects.
import { execFileSync } from "node:child_process";
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  rmSync, statSync, symlinkSync, utimesSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT_REL = "scripts/generate-redirects.mjs";

const sandboxes = [];
afterAll(() => {
  for (const dir of sandboxes) rmSync(dir, { recursive: true, force: true });
});

/**
 * A throwaway ROOT the script can read as if it were the repo. Everything is symlinked (the
 * script only ever does readFileSync/existsSync, both of which follow symlinks), except
 * public/_redirects, which is a real copy so the sandbox can be mutated and inspected.
 */
function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), "redirects-check-"));
  sandboxes.push(dir);
  mkdirSync(join(dir, "scripts"));
  copyFileSync(join(REPO, SCRIPT_REL), join(dir, SCRIPT_REL));
  for (const top of ["client", "functions"]) symlinkSync(join(REPO, top), join(dir, top), "dir");
  mkdirSync(join(dir, "public"));
  for (const entry of readdirSync(join(REPO, "public"))) {
    if (entry === "_redirects") continue;
    symlinkSync(join(REPO, "public", entry), join(dir, "public", entry));
  }
  copyFileSync(join(REPO, "public/_redirects"), join(dir, "public/_redirects"));
  return dir;
}

/** Run the sandboxed script; never throws, so a non-zero exit is an assertable value. */
function run(dir, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [join(dir, SCRIPT_REL), ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    return { status: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

/** Bytes + mtime, the two things --check must leave alone. Buffer, not string: bytes means bytes. */
function fingerprint(file) {
  const st = statSync(file);
  return { bytes: readFileSync(file), mtimeMs: st.mtimeMs, size: st.size };
}

describe("generate-redirects.mjs --check", () => {
  it("leaves the file's bytes AND its mtime untouched on a clean tree", () => {
    const dir = sandbox();
    const out = join(dir, "public/_redirects");

    // "Clean" = the committed file already equals what the producer derives. Seed that state with
    // the producer itself rather than trusting the repo copy to be in sync, so this test measures
    // the flag's behaviour and not some other lane's pending regeneration.
    expect(run(dir).status).toBe(0);

    // Backdate the mtime by an hour. Without this a rewrite could land in the same coarse
    // filesystem tick as the seed and the timestamp comparison would pass over a real write.
    const backdated = Date.now() / 1000 - 3600;
    utimesSync(out, backdated, backdated);
    const before = fingerprint(out);

    const checked = run(dir, ["--check"]);
    expect(checked.status, checked.stderr).toBe(0);

    const after = fingerprint(out);
    expect(after.bytes.equals(before.bytes)).toBe(true);
    expect(after.size).toBe(before.size);
    // The load-bearing assertion. Identical bytes prove nothing on their own: writeFileSync with
    // the same content is still a write, and still dirties nothing visible except this number.
    expect(after.mtimeMs).toBe(before.mtimeMs);
  });

  it("exits non-zero when the committed file genuinely drifts — and still does not rewrite it", () => {
    const dir = sandbox();
    const out = join(dir, "public/_redirects");
    expect(run(dir).status).toBe(0);

    // Drop one real rule, exactly the shape of the drift found on 2026-09-23: a concrete <Route>
    // whose bare→trailing-slash rule is absent from the committed file.
    const generated = readFileSync(out, "utf8");
    const lines = generated.split("\n");
    const victim = lines.findIndex((l) => /^\/[a-z0-9-]+ {2}\/[a-z0-9-]+\/ {2}308$/.test(l));
    expect(victim, "no bare→slash rule to remove — the fixture assumption changed").toBeGreaterThan(-1);
    const dropped = lines[victim];
    lines.splice(victim, 1);
    const drifted = lines.join("\n");
    writeFileSync(out, drifted);
    const backdated = Date.now() / 1000 - 3600;
    utimesSync(out, backdated, backdated);
    const before = fingerprint(out);

    const checked = run(dir, ["--check"]);
    expect(checked.status, `--check passed with ${dropped} removed`).not.toBe(0);
    expect(checked.stderr).toMatch(/does not match/);
    expect(checked.stderr).toMatch(/node scripts\/generate-redirects\.mjs/);

    // A failing check must not repair its own subject either: the drift is the lane's to commit.
    const after = fingerprint(out);
    expect(after.bytes.equals(before.bytes)).toBe(true);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(readFileSync(out, "utf8")).not.toContain(dropped);

    // And the ordinary run — the one that IS allowed to write — puts the rule back.
    expect(run(dir).status).toBe(0);
    expect(readFileSync(out, "utf8")).toBe(generated);
  });

  it("rejects an unrecognised flag instead of silently regenerating", () => {
    // The whole defect in one line: an unknown argument used to fall through to the write path,
    // so a typo'd or aspirational flag looked like it did something read-only.
    const dir = sandbox();
    const out = join(dir, "public/_redirects");
    expect(run(dir).status).toBe(0);
    const backdated = Date.now() / 1000 - 3600;
    utimesSync(out, backdated, backdated);
    const before = fingerprint(out);

    const bogus = run(dir, ["--dry-run"]);
    expect(bogus.status).toBe(2);
    expect(bogus.stderr).toMatch(/unknown argument/);
    expect(fingerprint(out).mtimeMs).toBe(before.mtimeMs);
  });
});

describe("the sandbox is a faithful stand-in for the repo", () => {
  // If the sandbox silently lost an input the script reads, every test above would still pass
  // while proving nothing about the real tree. Pin it: same script, same inputs, same bytes.
  it("derives byte-identical output to a run against the repository itself", () => {
    const dir = sandbox();
    expect(run(dir).status).toBe(0);
    const fromSandbox = readFileSync(join(dir, "public/_redirects"), "utf8");
    const fromRepo = readFileSync(join(REPO, "public/_redirects"), "utf8");
    // Compared against a --check of the real tree rather than a write to it: if the repo copy is
    // in sync with its producer, these agree; if it is not, say which, and do not touch it.
    const repoCheck = run(REPO, ["--check"]);
    if (repoCheck.status === 0) expect(fromSandbox).toBe(fromRepo);
    else expect(fromSandbox).not.toBe(fromRepo);
    expect(existsSync(join(dir, "functions"))).toBe(true);
  });
});
