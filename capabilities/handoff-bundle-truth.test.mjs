/**
 * handoff-bundle-truth.test.mjs — the handoff's own numbers, checked like everyone else's.
 *
 * This lane spent a day finding claims that were true when written and false by the time they
 * were read: CLAUDE.md retiring an owner ruling, npm metadata a version behind, a component
 * header asserting a signature that does not verify, eight game pages promising a signed card.
 *
 * The handoff bundle developed exactly the same disease, five times:
 *
 *   · Rollback said "only TWO commits have user-visible effect" at 53 commits, when 22 files do.
 *     A reviewer reverting on that basis would have been misled.
 *   · "unreachable routes — currently 2" long after this branch removed both.
 *   · "capability drift incidents — baseline 1" long after six were caught.
 *   · Three of four screenshots listed; the missing one was the WP-3 evidence.
 *   · "Other 72 HTTP/A2A capabilities UNASSESSED — only MCP can be checked" after five more
 *     surfaces had been probed.
 *
 * Every one was caught by re-reading, which is the mechanism that failed everywhere else in this
 * estate. A document nobody re-reads is not evidence; it is a story about evidence. So the
 * counts that a reader would act on are now asserted from the repository itself.
 *
 * NOT ASSERTED: prose. This checks numbers and file references — the claims that go stale on
 * their own as the branch moves, without anyone touching the sentence.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const DIR = path.join(repo, "operator/handoffs/2026-09-05");
const BUNDLE = path.join(DIR, "CLAUDE-MASTER-BUNDLE.md");
const text = readFileSync(BUNDLE, "utf8");

describe("the handoff bundle's own claims", () => {
  it("references every screenshot that exists, and no screenshot that does not", () => {
    const onDisk = readdirSync(DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
    assert.ok(onDisk.length > 0, "no screenshots in the handoff directory");

    const unlisted = onDisk.filter((f) => !text.includes(f));
    assert.deepEqual(
      unlisted,
      [],
      `these screenshots are in the handoff directory but never referenced: ${unlisted.join(", ")}. ` +
        `An unreferenced screenshot is evidence the reviewer never finds — this is how the WP-3 ` +
        `image went missing from the section whose job is listing evidence.`,
    );

    const referenced = [...text.matchAll(/operator\/handoffs\/2026-09-05\/([\w.-]+\.(?:jpg|jpeg|png))/gi)].map(
      (m) => m[1],
    );
    const missing = [...new Set(referenced)].filter((f) => !onDisk.includes(f));
    assert.deepEqual(
      missing,
      [],
      `the bundle points at screenshots that are not there: ${missing.join(", ")}`,
    );
  });

  it("its capability-guard count matches the guards that exist", () => {
    const files = readdirSync(here).filter((f) => f.endsWith(".test.mjs"));
    assert.ok(files.length > 5, "the capabilities directory did not enumerate");
    // The bundle quotes a passing count from `node --test capabilities/*.test.mjs`. That number
    // is a TEST count, not a file count, so this asserts the weaker, stable thing: every guard
    // file is named somewhere in the bundle, so none was added without being handed over.
    const unmentioned = files.filter((f) => !text.includes(f));
    assert.deepEqual(
      unmentioned,
      [],
      `these capability guards exist but the handoff never names them: ${unmentioned.join(", ")}. ` +
        `A guard root does not know about is a guard root will not run.`,
    );
  });

  it("the guard count it quotes is the guard count that exists", () => {
    // THE SIXTH STALENESS. The bundle quoted "82 passed" twice and "83 passed" once while the
    // suite stood at 86 — three different numbers for one figure, none of them current. The
    // original comment here declined to assert it because a TEST count is not a FILE count.
    // That reasoning was right and the conclusion was wrong: the test count IS derivable
    // statically, one `it(` per test, so there is no excuse for the bundle disagreeing with it.
    const files = readdirSync(here).filter((f) => f.endsWith(".test.mjs"));
    const tests = files
      .map((f) => (readFileSync(path.join(here, f), "utf8").match(/^\s*it\(/gm) ?? []).length)
      .reduce((a, b) => a + b, 0);
    assert.ok(tests > 50, `only ${tests} capability tests counted — the parse is wrong`);

    const quoted = [...new Set([...text.matchAll(/(\d+) passed(?:,| at handoff| at)/g)].map((m) => Number(m[1])))]
      .filter((n) => n > 50 && n < 400 && n !== 643);
    assert.ok(quoted.length > 0, "the bundle no longer quotes a capability-guard pass count");
    const wrong = quoted.filter((n) => n !== tests);
    assert.deepEqual(
      wrong,
      [],
      `the bundle quotes ${wrong.join(", ")} capability tests passing; there are ${tests}. Root is ` +
        `told to run the suite and compare, so a stale number turns a green run into a discrepancy ` +
        `to investigate. Update every occurrence, not the first one found.`,
    );
  });

  it("every file it lists under Files is actually in the branch", () => {
    const block = text.slice(text.indexOf("## Files"), text.indexOf("## Tests"));
    const listed = [...block.matchAll(/^([a-z][\w./*-]+\.\w+)$/gim)].map((m) => m[1]);
    assert.ok(listed.length > 5, "the Files block did not parse");
    const gone = listed.filter(
      (f) => !f.includes("*") && !existsSync(path.join(repo, f)),
    );
    assert.deepEqual(
      gone,
      [],
      `the handoff lists files that are not in the branch: ${gone.join(", ")}. Either they were ` +
        `renamed after the list was written, or the list was aspirational.`,
    );
  });

  it("its Rollback section still grades reverts by what they cost", () => {
    // THE FIRST VERSION OF THIS ASSERTION FAILED ON THE FIXED BUNDLE. It searched for the
    // absence of "Only TWO commits have user-visible effect" — and the corrected Rollback
    // section QUOTES that sentence while explaining why it was wrong. The guard matched the
    // documentation of the fix, not the fault. That is the fourth time in this session a guard
    // of mine has done that, so it now asserts the presence of the correction rather than the
    // absence of a phrase that legitimately appears in describing it.
    const rollback = text.slice(text.indexOf("## Rollback"), text.indexOf("## Growth metrics"));
    assert.ok(rollback.length > 400, "the Rollback section did not parse");
    assert.match(
      rollback,
      /RESTORES AN UNTRUE CLAIM/,
      "the Rollback section no longer separates reverts that merely undo an improvement from " +
        "reverts that REPUBLISH something untrue. That distinction is the only reason the " +
        "section is worth reading before reverting anything.",
    );
    assert.match(rollback, /REMOVES TRUE INFORMATION/);
    assert.match(rollback, /invisible/i);
  });

  it("every changed path in the branch is listed under Files", () => {
    // THE PROPERTY THAT DOES NOT ROT. The bundle used to tell root "the diff must show ~64
    // files" — a number that was 61 by the time it was read, because master advances roughly
    // every 100 seconds and every rebase moves the counts. A reviewer who runs that check and
    // sees a mismatch either doubts a sound branch or learns to skip the check. Both are worse
    // than no check.
    //
    // So the bundle now states the property instead: every path in the diff appears under
    // Files. This asserts it, which is the only way the promise stays true.
    let changed;
    try {
      changed = execFileSync("git", ["diff", "--name-only", "origin/master...HEAD"], {
        cwd: repo,
        encoding: "utf8",
      })
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    } catch {
      console.log("      (no git or no origin/master — diff NOT compared)");
      return;
    }
    if (!changed.length) return;
    const block = text.slice(text.indexOf("## Files"), text.indexOf("## Tests"));
    const unlisted = changed.filter((f) => !block.includes(f));
    assert.deepEqual(
      unlisted,
      [],
      `these files are changed in the branch but are not listed under Files in the handoff: ` +
        `${unlisted.join(", ")}. Root is told to verify that every path in the diff appears ` +
        `there; an unlisted path makes that instruction fail on a sound branch.`,
    );
  });

  it("its Tests section builds before it reads the build", () => {
    // The previous version listed `npm run build:client` AFTER brand-gate and
    // signed-json-guard, both of which read dist/client. In a fresh clone those fail before the
    // build has run, and a reviewer who hits that reasonably distrusts the rest of the bundle.
    const block = text.slice(text.indexOf("## Tests"), text.indexOf("## Screenshot"));
    // ONLY the indented command lines. The prose above them explains this very fix and so
    // MENTIONS `npm run build:client`; an indexOf over the whole block found that sentence
    // instead of the command and passed vacuously — the guard was checking its own
    // explanation. Fifth time in this session; see the comment on the Rollback assertion.
    const cmds = block
      .split("\n")
      .filter((l) => /^ {4}\S/.test(l))
      .map((l) => l.trim());
    const at = (needle) => cmds.findIndex((l) => l.startsWith(needle));
    const build = at("npm run build:client");
    const brand = at("node scripts/brand-gate.mjs dist/client");
    const signed = at("node scripts/signed-json-guard.mjs dist/client");
    assert.ok(
      build >= 0 && brand >= 0 && signed >= 0,
      `the Tests block's COMMAND lines did not parse (build=${build} brand=${brand} signed=${signed}). ` +
        `If the formatting changed, fix the parse — do not let it match prose again.`,
    );
    assert.ok(
      build < brand && build < signed,
      "the Tests section tells root to run a gate over dist/client before building it. In a " +
        "fresh clone that fails on an absent directory, and the reproduction steps stop " +
        "reproducing anything.",
    );
  });
});
