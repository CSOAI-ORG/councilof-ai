#!/usr/bin/env node
/**
 * npm-guide-facts — GENERATE the install guide's npm-facts block from the one dated capture.
 *
 * WHY THIS EXISTS. The guide tells a reader which release is on npm, how many tool names
 * that release carries, how many the live door carries, and which names differ. Those are
 * facts about the WORLD, so they belong in ONE dated record — distribution/npm/
 * npm-publish-check.json, written by scripts/harness-x/npm-publish-live.mjs — and in no
 * other place. They used to also live as PROSE, hand-written, in two files.
 *
 * WHAT HAD HAPPENED, THREE TIMES. #3703 corrected the guide against the capture of
 * 2026-11-01T11:54Z, which recorded npm's 0.2.4 (52 names) against a door serving 53.
 * The estate's own release workflow then published 0.2.5 at 15:07:36Z. Nothing refreshed
 * the capture, so the guide went on telling readers that the latest published release was
 * 0.2.4. #3731 fixed it. #3745 was force-rebuilt and DROPPED that fix, so the false claim
 * went back onto master with the wave. #3810 fixed it again. Three times a human or an
 * agent had to notice a drift that a script could have noticed.
 *
 * The fix is not a third correction. It is to make the prose DERIVED, the way the tool
 * catalogue in the same file already is (<!-- mcp-tool-catalog:start -->). This script
 * regenerates the npm-facts block from the capture; the check mode fails when the
 * committed block no longer matches; the workflow runs the producer and opens a PR when
 * they disagree. A publish that moves the fleet now produces a PULL REQUEST, not a false
 * claim that a stranger reads for weeks.
 *
 * BOTH COPIES ARE WRITTEN. llms-install.md and public/llms-install.md are two files that
 * must be byte-identical; the published one is the one a reader opens. A block corrected
 * in one and not the other is two claims, one of them false.
 *
 * WHAT IT NEVER DOES. It never edits the capture (a capture is dated and never edited),
 * never touches the repo's tool set, never claims a published release is the contract,
 * and never asserts anything the capture does not record.
 *
 * Usage:
 *   node scripts/harness-x/npm-guide-facts.mjs --write     rewrite both copies from the capture
 *   node scripts/harness-x/npm-guide-facts.mjs --check     fail if either copy has drifted
 *   node scripts/harness-x/npm-guide-facts.mjs --selftest  prove the check can fail
 * Exit:  0 in sync · 1 drifted · 2 UNCHECKABLE (no readable capture)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CAPTURE = "distribution/npm/npm-publish-check.json";
const GUIDES = ["llms-install.md", "public/llms-install.md"];
const SUBMISSION = "docs/operations/submissions/mcp-so-submission.md";
const START = "<!-- mcp-npm-facts:start -->";
const END = "<!-- mcp-npm-facts:end -->";

export function applySubmission(text, capture) {
  const pub = capture.published;
  return text
    .replace(
      /^- \*\*npm package:\*\* csoai-gspc-mcp \(v[^)]+\)$/m,
      `- **npm package:** csoai-gspc-mcp (v${pub.version})`,
    )
    .replace(
      /^- \*\*stdio:\*\* npx -y csoai-gspc-mcp@[^\s]+$/m,
      `- **stdio:** npx -y csoai-gspc-mcp@${pub.version}`,
    )
    .replace(
      /checked \*\*[^*]+\*\*, records published `[^`]+` \(published [^)]+\)/,
      `checked **${capture.checked_at}**, records published \`${pub.version}\` (published ${pub.published_at})`,
    );
}

/** The capture's date, as the day the tarball was measured. Never typed. */
const measuredDay = (iso) => String(iso).slice(0, 10);

/**
 * The block. Every number and every name in it comes from the capture or from the
 * prepared package.json. There is no literal fact in this function.
 */
export function buildBlock(capture, preparedVersion) {
  const pub = capture.published;
  const door = capture.live_door;
  const diff = capture.diff;
  const pubTotal = pub.free_tools + pub.metered_tools;
  const differs = diff.live_only.length > 0 || diff.published_only.length > 0;
  const day = measuredDay(capture.checked_at);

  const lines = [];

  // 1. The identity, and whether a local install is offered at all.
  lines.push(
    "The package identity is `csoai-gspc-mcp` (not the stale scoped name previously",
    "shown here). " +
      (differs
        ? "The latest measured release has different tool names from the remote."
        : "The latest measured release carries the same tool names as the remote.") +
      "\nThis guide gives the remote configuration above; alternatively use",
    "the free read-only door https://councilof.ai/mcp/free.",
  );
  lines.push("");

  // 2. Which release is published, how many names it carries, and whether npm has
  //    deprecated it. All three are read from the registry document by the producer.
  lines.push(
    `The latest published release is \`${pub.version}\` (published ${pub.published_at}). Its published tarball carries`,
    `${pubTotal} tool names — ${pub.free_tools} free + ${pub.metered_tools} metered — measured from the tarball's own manifests`,
    `on ${day}, not from this repository. ` +
      (pub.deprecated
        ? "It **is** marked deprecated on npm, which is why\n`npm view csoai-gspc-mcp@latest deprecated` prints a notice:"
        : "It is **not** marked deprecated on npm, which is why\n`npm view csoai-gspc-mcp@latest deprecated` prints nothing:") +
      " deprecation is not the",
    "signal here, the name comparison is.",
  );
  lines.push("");

  // 3. The comparison with the live door. This is the sentence that was false three times.
  if (!differs) {
    lines.push(
      `That release carries the same ${pubTotal} tool names as the live door. The live door`,
      `served ${door.total_tools} names at the same moment. Re-run the comparison — \`npm pack`,
      "csoai-gspc-mcp@latest`, extract `gspc-tools.json` and `paid-tools.json`, diff",
      "against the door's `tools/list` — whenever either side moves, and treat the diff,",
      "not npm's deprecation flag, as the signal.",
    );
  } else {
    const gap = door.total_tools - pubTotal;
    const dir = [];
    if (diff.live_only.length > 0) {
      dir.push(
        gap === 1
          ? "the published tarball is one name short, and\nthe name it lacks is"
          : `the published tarball is ${gap} names short, and\nthe names it lacks are`,
      );
      dir.push(diff.live_only.map((n) => `\`${n}\``).join(", ") + ", which the door added after");
      dir.push(`\`${pub.version}\` was published.`);
    }
    if (diff.published_only.length > 0) {
      dir.push(
        `The published release carries ${diff.published_only.length} name(s) the door does not serve: ` +
          diff.published_only.map((n) => `\`${n}\``).join(", ") + ".",
      );
    } else {
      dir.push("No\npublished name is missing from the door.");
    }
    lines.push(
      "That release is **not** name-for-name identical to the live door. The live door",
      `served ${door.total_tools} names at the same moment: ${dir.join(" ")} Re-run the comparison — \`npm pack`,
      "csoai-gspc-mcp@latest`, extract `gspc-tools.json` and `paid-tools.json`, diff",
      "against the door's `tools/list` — whenever either side moves, and treat the diff,",
      "not npm's deprecation flag, as the signal.",
    );
  }
  lines.push("");

  // 4. Distinguish a prepared version from one present in the dated registry capture.
  if (preparedVersion === pub.version) {
    lines.push(
      `The repository source version \`${preparedVersion}\` is the published release identified by this dated capture.`,
      `Recheck \`npm view csoai-gspc-mcp@${preparedVersion} version\` before relying on its availability.`,
      "Name parity does not establish runtime or behavioural equivalence with the remote.",
    );
  } else {
    lines.push(
      `The repository currently prepares \`${preparedVersion}\`, but that source version is **not a`,
      `published npm release** until \`npm view csoai-gspc-mcp@${preparedVersion} version\` confirms that`,
      "exact version. Do not install or advertise any published release as the contract",
      "before that independent check.",
    );
  }

  return [START, ...lines, END].join("\n");
}

/** Replace the block in a guide, or refuse. A half-written guide is a false claim. */
export function applyBlock(text, block, label) {
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error(`${label}: the guide carries no ${START} / ${END} markers`);
  }
  if (end < start) throw new Error(`${label}: the npm-facts markers are in the wrong order`);
  return text.slice(0, start) + block + text.slice(end + END.length);
}

const read = (rel) => readFileSync(resolve(REPO, rel), "utf8");

function load() {
  let capture;
  try {
    capture = JSON.parse(read(CAPTURE));
  } catch (e) {
    throw new Error(`UNCHECKABLE: ${CAPTURE} cannot be read: ${e.message}`);
  }
  if (capture.schema !== "csoai.npm-publish-check/1") {
    throw new Error(`UNCHECKABLE: ${CAPTURE} carries an unknown schema ${capture.schema}`);
  }
  const pkg = JSON.parse(read("mcp/gspc-server/package.json"));
  return { capture, preparedVersion: pkg.version };
}

const digest = (text) => createHash("sha256").update(text, "utf8").digest("hex");

function main(argv) {
  const mode = argv[2] || "--check";

  if (mode === "--selftest") {
    // THE CHECK MUST BE ABLE TO FAIL. A guard that has never gone red proves nothing.
    const { capture, preparedVersion } = load();
    const block = buildBlock(capture, preparedVersion);
    const guide = read("llms-install.md");
    if (!guide.includes(START) || !guide.includes(END)) {
      throw new Error("selftest: the guide carries no npm-facts markers");
    }
    // 1. an in-sync guide passes
    const synced = applyBlock(guide, block, "selftest");
    if (applyBlock(synced, block, "selftest") !== synced) {
      throw new Error("selftest: applying the block twice changed the text");
    }
    // 2. a drifted guide is DETECTED
    const drifted = synced.replace(String(capture.live_door.total_tools), String(capture.live_door.total_tools + 1));
    if (drifted === synced) throw new Error("selftest: the drift fixture did not change the text");
    if (applyBlock(drifted, block, "selftest") === drifted) {
      throw new Error("selftest: a drifted guide was accepted — the check cannot fail");
    }
    // 3. a capture with no differences produces the parity sentence, and one WITH a
    //    difference must not produce it — the exact false claim the register recorded.
    const parity = JSON.parse(JSON.stringify(capture));
    parity.diff = { live_only: [], published_only: [] };
    const parityBlock = buildBlock(parity, preparedVersion);
    if (!/carries the same \d+ tool names as the live door/.test(parityBlock)) {
      throw new Error("selftest: a capture with no differences must state parity");
    }
    if (/carries the same \d+ tool names as the live door/.test(block) && capture.diff.live_only.length + capture.diff.published_only.length > 0) {
      throw new Error("selftest: the block claims parity while the capture records a difference");
    }
    const publishedBlock = buildBlock(parity, parity.published.version);
    if (publishedBlock.includes("not a\npublished npm release") || !publishedBlock.includes("is the published release identified")) {
      throw new Error("selftest: a captured published version must not be described as unpublished");
    }
    // 4. the block must never claim a published release is the contract
    if (block.includes("is the contract") && !block.includes("Do not install or advertise")) {
      throw new Error("selftest: the block advertises a published release as the contract");
    }
    // 5. the staged mcp.so submission pin is updated deterministically
    const subSample = read(SUBMISSION);
    const bumpedCapture = JSON.parse(JSON.stringify(capture));
    bumpedCapture.published.version = "9.9.9";
    bumpedCapture.checked_at = "2099-01-01T00:00:00.000Z";
    const bumpedSub = applySubmission(subSample, bumpedCapture);
    if (!bumpedSub.includes("csoai-gspc-mcp (v9.9.9)") || !bumpedSub.includes("npx -y csoai-gspc-mcp@9.9.9") || !bumpedSub.includes("2099-01-01T00:00:00.000Z")) {
      throw new Error("selftest: applySubmission failed to update mcp-so-submission.md pins");
    }
    console.log("✓ npm-guide-facts selftest: drift is detected, parity is conditional, the contract is never advertised");
    return 0;
  }

  const { capture, preparedVersion } = load();
  const block = buildBlock(capture, preparedVersion);
  let drifted = 0;

  for (const rel of GUIDES) {
    const text = read(rel);
    let current;
    try {
      current = applyBlock(text, block, rel);
    } catch (e) {
      console.error(`  ✖ ${rel}: ${e.message}`);
      drifted = 1;
      continue;
    }
    if (current === text) {
      console.log(`  ✓ ${rel}: the npm facts match the capture (${capture.checked_at})`);
      continue;
    }
    drifted = 1;
    if (mode === "--write") {
      writeFileSync(resolve(REPO, rel), current);
      console.log(`  ↻ ${rel}: rewritten from the capture (${capture.checked_at})`);
    } else {
      console.error(`  ✖ ${rel}: the npm facts have DRIFTED from the capture (${capture.checked_at})`);
      console.error(`      committed: ${digest(text)}`);
      console.error(`      derived : ${digest(current)}`);
      console.error(`      run: node scripts/harness-x/npm-guide-facts.mjs --write`);
    }
  }

  const subText = read(SUBMISSION);
  const nextSub = applySubmission(subText, capture);
  if (nextSub === subText) {
    console.log(`  ✓ ${SUBMISSION}: the npm facts match the capture (${capture.checked_at})`);
  } else {
    drifted = 1;
    if (mode === "--write") {
      writeFileSync(resolve(REPO, SUBMISSION), nextSub);
      console.log(`  ↻ ${SUBMISSION}: rewritten from the capture (${capture.checked_at})`);
    } else {
      console.error(`  ✖ ${SUBMISSION}: the npm facts have DRIFTED from the capture (${capture.checked_at})`);
    }
  }

  if (mode === "--write") {
    // The two copies are two files and must be byte-identical: the published one is
    // the one a reader opens.
    const a = readFileSync(resolve(REPO, GUIDES[0]));
    const b = readFileSync(resolve(REPO, GUIDES[1]));
    if (!a.equals(b)) {
      console.error("  ✖ the two guide copies are NOT byte-identical after the rewrite");
      return 1;
    }
    console.log(`  ✓ both copies are byte-identical (${digest(a.toString("utf8"))})`);
    return 0;
  }

  return drifted;
}

process.exit(main(process.argv));
