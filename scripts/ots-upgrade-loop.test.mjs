// @vitest-environment node
// Safe publication-fragment regressions only. Never execute the complete updater,
// including with OTS_NO_GIT=1: earlier proof/producers run before that guard.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASH = "/bin/bash";
const SAFE_ENV = { PATH: "", LC_ALL: "C", BASH_ENV: "", ENV: "" };
const source = readFileSync(fileURLToPath(new URL("./ots-upgrade-loop.sh", import.meta.url)), "utf8");
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const BUSY = "\n  # Busy-master race (measured 2026-09-12):";
const FLUSH = "\n# Flush stranded commits even on quiet runs.";
const FETCH_MARKER = "\n  git fetch -q origin master 2>/dev/null\n";
const STRANDED = '\nif [ "${OTS_NO_GIT:-0}" != "1" ] && [ "$(git rev-list --count origin/master..master 2>/dev/null || echo 0)" != "0" ]; then\n';
const AFTER = "\nAFTER=";
const occurrences = (text, needle) => text.split(needle).length - 1;
function uniqueIndex(text, marker) {
  if (occurrences(text, marker) !== 1) throw new Error("Publication boundary must be unique: " + marker);
  return text.indexOf(marker);
}
function extractPublication(text) {
  const busy = uniqueIndex(text, BUSY), flush = uniqueIndex(text, FLUSH);
  const stranded = uniqueIndex(text, STRANDED), after = uniqueIndex(text, AFTER);
  if (!(busy < flush && flush < stranded && stranded < after)) throw new Error("Publication boundaries out of order");
  const region = text.slice(busy, flush);
  const start = uniqueIndex(region, FETCH_MARKER);
  const tail = region.slice(start + 1);
  if (!tail.endsWith("\nfi\n")) throw new Error("Missing unique first outer-if closing boundary");
  const first = tail.slice(0, -"\nfi\n".length) + "\n";
  const second = text.slice(stranded + 1, after);
  if (!second.endsWith("\nfi\n")) throw new Error("Missing stranded-if closing boundary");
  return { first, stranded: second };
}
const fragments = extractPublication(source);
// These exact hashes limit execution to the independently retained small fragments.
// A future fragment edit must update this safety admission with its source review.
const APPROVED = {
  first: "2176fe4a07e61fea7dd890217fc137fc895ee97f5d15a8210a39357e5fb71cd5",
  stranded: "faa790e275709c7bb3bbe078cc31d3a438de25b5c27fc6af15abbc6018d0159e",
  oldFirst: "30fca061339bf84052d04113754efad20b779e6caae24f6079808b66b9fd9228",
  oldStranded: "012ed766131d70662cdcf277a872347a5a33301e674cfa45f183b0c5d2f8fe5a",
};
// Exact OLD publication fragments from original 8253-byte source, not the updater.
const OLD_FIRST = "  git fetch -q origin master 2>/dev/null\n  git rebase -q origin/master 2>/dev/null\n  CSOAI_ALLOW_MASTER_PUSH=1 git push -q origin master 2>/dev/null && echo \"$(TS) pushed upgrades\" >> \"$LOG\" \\\n    || git push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease 2>/dev/null && echo \"$(TS) pushed upgrades to origin/ots/pending-upgrades\" >> \"$LOG\" \\\n    || echo \"$(TS) upgrades committed locally; push deferred (remote moved) — next run retries\" >> \"$LOG\"\n";
const OLD_STRANDED = "if [ \"${OTS_NO_GIT:-0}\" != \"1\" ] && [ \"$(git rev-list --count origin/master..master 2>/dev/null || echo 0)\" != \"0\" ]; then\n  STASH_BEFORE=$(git rev-parse -q --verify refs/stash 2>/dev/null || true)\n  git stash -q 2>/dev/null || true\n  STASH_AFTER=$(git rev-parse -q --verify refs/stash 2>/dev/null || true)\n  git fetch -q origin master 2>/dev/null\n  if git rebase -q origin/master 2>/dev/null; then\n    CSOAI_ALLOW_MASTER_PUSH=1 git push -q origin master 2>/dev/null && echo \"$(TS) flushed stranded upgrade commit(s)\" >> \"$LOG\" \\\n      || git push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease 2>/dev/null && echo \"$(TS) synced stranded upgrade commit(s) to origin/ots/pending-upgrades\" >> \"$LOG\" \\\n      || echo \"$(TS) stranded commit(s) still local; push deferred — next run retries\" >> \"$LOG\"\n  else\n    git rebase --abort 2>/dev/null\n    echo \"$(TS) stranded commit(s) could not rebase cleanly — left local, needs an operator\" >> \"$LOG\"\n  fi\n  if [ -n \"$STASH_AFTER\" ] && [ \"$STASH_AFTER\" != \"$STASH_BEFORE\" ]; then\n    git stash pop -q 2>/dev/null || true\n  fi\nfi\n";
const BASH_STUB = "set -uo pipefail\nLOG=\"$FIXTURE_LOG\"\nSTASH_STATE=\"$FAKE_OLD_STASH\"\nTS() { printf '%s' 'FIXTURE-TIME'; }\ncommand_not_found_handle() {\n  printf 'UNEXPECTED_COMMAND\\t%s\\n' \"$*\" >> \"$UNKNOWN_CALLS\"\n  return 127\n}\ngit() {\n  { printf 'git'; printf '\\t%s' \"$@\"; printf '\\n'; } >> \"$GIT_CALLS\"\n  printf '%s\\n' \"${CSOAI_ALLOW_MASTER_PUSH-unset}\" >> \"$OVERRIDE_VALUES\"\n  case \"$*\" in\n    'fetch -q origin master') return \"$FAKE_FETCH_RC\" ;;\n    'rebase -q origin/master') return \"$FAKE_REBASE_RC\" ;;\n    'rebase --abort') return 0 ;;\n    'push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease')\n      return \"$FAKE_PUSH_RC\" ;;\n    'push -q origin master')\n      printf '%s\\n' 'MASTER_BLOCKED' >> \"$BLOCKED_MASTER\"\n      return 86 ;;\n    'rev-list --count origin/master..master')\n      if [ \"$FAKE_REVLIST_RC\" != '0' ]; then return \"$FAKE_REVLIST_RC\"; fi\n      printf '%s\\n' \"$FAKE_AHEAD\"\n      return 0 ;;\n    'rev-parse -q --verify refs/stash')\n      if [ -n \"$STASH_STATE\" ]; then printf '%s\\n' \"$STASH_STATE\"; return 0; fi\n      return 1 ;;\n    'stash -q')\n      if [ \"$FAKE_STASH_RC\" != '0' ]; then return \"$FAKE_STASH_RC\"; fi\n      if [ \"$FAKE_MAKE_STASH\" = '1' ]; then STASH_STATE='fixture-own-new-stash'; fi\n      return 0 ;;\n    'stash pop -q') STASH_STATE=\"$FAKE_OLD_STASH\"; return 0 ;;\n    *) printf 'UNEXPECTED_GIT\\t%s\\n' \"$*\" >> \"$UNKNOWN_CALLS\"; return 97 ;;\n  esac\n}\n";
const DEFAULTS = {
  OTS_NO_GIT: "0", FAKE_AHEAD: "1", FAKE_FETCH_RC: "0", FAKE_REBASE_RC: "0",
  FAKE_PUSH_RC: "0", FAKE_REVLIST_RC: "0", FAKE_STASH_RC: "0",
  FAKE_OLD_STASH: "fixture-older-stash", FAKE_MAKE_STASH: "1",
};
const FETCH = ["fetch", "-q", "origin", "master"];
const REBASE = ["rebase", "-q", "origin/master"];
const REVIEW = ["push", "-q", "origin", "HEAD:refs/heads/ots/pending-upgrades", "--force-with-lease"];
const MASTER = ["push", "-q", "origin", "master"];
const REVLIST = ["rev-list", "--count", "origin/master..master"];
const REVPARSE = ["rev-parse", "-q", "--verify", "refs/stash"];
const STASH = ["stash", "-q"];
const POP = ["stash", "pop", "-q"];
const ABORT = ["rebase", "--abort"];
const lines = (text) => text.split("\n").filter(Boolean);
function runFragment(fragment, scenario = {}) {
  if (!Object.values(APPROVED).includes(sha256(fragment))) throw new Error("Refusing unapproved executable fragment");
  for (const key of Object.keys(scenario)) {
    if (!Object.hasOwn(DEFAULTS, key)) throw new Error("Unrecognized fixture setting: " + key);
  }
  const dir = mkdtempSync(join(tmpdir(), "csoai-ots-publication-fixture-"));
  const paths = {
    FIXTURE_LOG: join(dir, "publication.log"), GIT_CALLS: join(dir, "git-calls.log"),
    OVERRIDE_VALUES: join(dir, "override-values.log"), BLOCKED_MASTER: join(dir, "blocked-master.log"),
    UNKNOWN_CALLS: join(dir, "unknown-calls.log"),
  };
  try {
    for (const path of Object.values(paths)) writeFileSync(path, "", { mode: 0o600 });
    const result = spawnSync(BASH, ["--noprofile", "--norc", "-s"], {
      input: BASH_STUB + "\n" + fragment,
      encoding: "utf8", cwd: dir, timeout: 2000, maxBuffer: 65536,
      env: { ...SAFE_ENV, ...DEFAULTS, ...scenario, ...paths },
    });
    expect(result.error, "fixture process error").toBeUndefined();
    expect(result.signal, "fixture process signal").toBeNull();
    expect(result.status, "fixture process stderr: " + result.stderr).toBe(0);
    const unknown = readFileSync(paths.UNKNOWN_CALLS, "utf8");
    expect(unknown, "every executable/argument vector must be an admitted fake Git call").toBe("");
    return {
      calls: lines(readFileSync(paths.GIT_CALLS, "utf8")).map((line) => line.split("\t").slice(1)),
      log: readFileSync(paths.FIXTURE_LOG, "utf8"),
      blocked: lines(readFileSync(paths.BLOCKED_MASTER, "utf8")),
      overrides: lines(readFileSync(paths.OVERRIDE_VALUES, "utf8")),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const pushes = (out) => out.calls.filter((args) => args[0] === "push");
function noMaster(out) {
  expect(out.blocked).toEqual([]);
  expect(out.calls).not.toContainEqual(MASTER);
  expect(out.overrides).not.toContain("1");
}

describe("OTS updater publication fragments — isolated fake Git only", () => {
  it("the complete candidate is syntactically valid without executing any part", () => {
    const result = spawnSync(BASH, ["--noprofile", "--norc", "-n"], {
      input: source, encoding: "utf8", env: SAFE_ENV, timeout: 2000, maxBuffer: 65536,
    });
    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status, result.stderr).toBe(0);
  });

  it("binds the exact two-hunk candidate and two review targets without a master override", () => {
    expect(Buffer.byteLength(source, "utf8")).toBe(8056);
    expect(sha256(source)).toBe("1cad60be792015374ab548533899c7f4e1b788a61e99777e3d663bfdf0dac691");
    expect(source).not.toContain("CSOAI_ALLOW_MASTER_PUSH");
    expect(source).not.toMatch(/git\s+push\s+-q\s+origin\s+master(?:\s|$)/m);
    expect(occurrences(source, "git push -q origin HEAD:refs/heads/ots/pending-upgrades --force-with-lease")).toBe(2);
    expect(sha256(fragments.first)).toBe(APPROVED.first);
    expect(sha256(fragments.stranded)).toBe(APPROVED.stranded);
    expect(sha256(OLD_FIRST)).toBe(APPROVED.oldFirst);
    expect(sha256(OLD_STRANDED)).toBe(APPROVED.oldStranded);
  });

  it("publishes the first candidate only to the review branch and logs that success", () => {
    const out = runFragment(fragments.first);
    expect(out.calls).toEqual([FETCH, REBASE, REVIEW]);
    expect(out.log).toBe("FIXTURE-TIME pushed upgrades to origin/ots/pending-upgrades\n");
    noMaster(out);
  });

  it("first review-push failure logs deferral without success or a guessed remote cause", () => {
    const out = runFragment(fragments.first, { FAKE_PUSH_RC: "1" });
    expect(out.calls).toEqual([FETCH, REBASE, REVIEW]);
    expect(out.log).toBe("FIXTURE-TIME review-branch push failed; candidate state needs owner review; no master push attempted\n");
    expect(out.log).not.toContain("pushed upgrades");
    expect(out.log).not.toMatch(/remote moved|committed locally/);
    noMaster(out);
  });

  it("preserves the first block's existing unconditional fetch/rebase flow without inventing a fix", () => {
    for (const scenario of [{ FAKE_FETCH_RC: "1" }, { FAKE_REBASE_RC: "1" }]) {
      const out = runFragment(fragments.first, scenario);
      // Existing behavior: this block still attempts the review push. It has no abort guard.
      expect(out.calls).toEqual([FETCH, REBASE, REVIEW]);
      expect(out.calls).not.toContainEqual(ABORT);
      noMaster(out);
    }
  });

  it("stranded success restores only the stash created by this run", () => {
    const out = runFragment(fragments.stranded);
    expect(out.calls).toEqual([REVLIST, REVPARSE, STASH, REVPARSE, FETCH, REBASE, REVIEW, POP]);
    expect(out.log).toBe("FIXTURE-TIME synced stranded upgrade commit(s) to origin/ots/pending-upgrades\n");
    noMaster(out);
  });

  it("stranded review-push failure reports failure and still restores its own new stash", () => {
    const out = runFragment(fragments.stranded, { FAKE_PUSH_RC: "1" });
    expect(pushes(out)).toEqual([REVIEW]);
    expect(out.calls.at(-1)).toEqual(POP);
    expect(out.log).toBe("FIXTURE-TIME review-branch push failed; stranded candidate state needs owner review; no master push attempted\n");
    expect(out.log).not.toContain("synced stranded");
    expect(out.log).not.toMatch(/remote moved|committed locally/);
    noMaster(out);
  });

  it("stranded rebase failure aborts, attempts no push and restores only its new stash", () => {
    const out = runFragment(fragments.stranded, { FAKE_REBASE_RC: "1" });
    expect(out.calls).toEqual([REVLIST, REVPARSE, STASH, REVPARSE, FETCH, REBASE, ABORT, POP]);
    expect(pushes(out)).toEqual([]);
    expect(out.log).toBe("FIXTURE-TIME stranded commit(s) could not rebase cleanly — left local, needs an operator\n");
    expect(out.log).not.toContain("synced stranded");
    noMaster(out);
  });

  it("does not pop an older stash when this run creates no new stash", () => {
    const out = runFragment(fragments.stranded, { FAKE_MAKE_STASH: "0" });
    expect(pushes(out)).toEqual([REVIEW]);
    expect(out.calls).not.toContainEqual(POP);
    noMaster(out);
  });

  it("does not pop anything when there was no stash and this run creates none", () => {
    const out = runFragment(fragments.stranded, { FAKE_OLD_STASH: "", FAKE_MAKE_STASH: "0" });
    expect(pushes(out)).toEqual([REVIEW]);
    expect(out.calls).not.toContainEqual(POP);
    noMaster(out);
  });

  it("a failed stash operation cannot pop the pre-existing older stash", () => {
    const out = runFragment(fragments.stranded, { FAKE_STASH_RC: "1" });
    expect(pushes(out)).toEqual([REVIEW]);
    expect(out.calls).not.toContainEqual(POP);
    noMaster(out);
  });

  it("the stranded OTS_NO_GIT guard skips every fake Git call", () => {
    const out = runFragment(fragments.stranded, { OTS_NO_GIT: "1" });
    expect(out.calls).toEqual([]);
    expect(out.log).toBe("");
    noMaster(out);
  });

  it("a quiet no-ahead stranded run only reads the ahead count", () => {
    const out = runFragment(fragments.stranded, { FAKE_AHEAD: "0" });
    expect(out.calls).toEqual([REVLIST]);
    expect(out.log).toBe("");
    noMaster(out);
  });

  it("an unreadable ahead count follows the existing zero fallback without a push", () => {
    const out = runFragment(fragments.stranded, { FAKE_REVLIST_RC: "1" });
    expect(out.calls).toEqual([REVLIST]);
    expect(out.log).toBe("");
    noMaster(out);
  });

  it("the two OLD fragment fixtures demonstrate master attempts that fake Git blocks", () => {
    for (const old of [OLD_FIRST, OLD_STRANDED]) {
      const out = runFragment(old);
      expect(out.blocked).toEqual(["MASTER_BLOCKED"]);
      expect(pushes(out)).toEqual([MASTER, REVIEW]);
      expect(out.overrides).toContain("1");
    }
  });
});
