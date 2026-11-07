#!/usr/bin/env node
/**
 * lane-truth-check.mjs — measure every LANES.md row's `state` claim against the pull
 * request it names, and report the claims that are FALSE.
 *
 * WHY THIS EXISTS. council-os/LANES.md is a LIVE CLAIM REGISTER: its own first line says
 * "live lane claims. Check before starting ANY work". A row's state cell is a claim about
 * the present, not a dated record — and it lies quietly. MEASURED 2026-11-07: eleven rows
 * claimed `open` whose pull request had already merged. Three of them were from the same
 * morning (#4034 merged 05:36:17Z, #4037 05:48:51Z, #4041 06:22:55Z); one had been
 * claiming `open` since 27 October. Every one of the eleven belonged to one owner, and no
 * other owner's row was false. A lane that reads a false `open` will either avoid a
 * territory that is already finished, or re-do work that has already landed.
 *
 * WHAT IT DOES NOT DO. It never edits the board. A correction is a human judgement about
 * what a row should now claim; this instrument only says which claims disagree with the
 * repository's own record. It is also not a gate: it never fails a pull request, because a
 * rule that is red on every merge protects nothing.
 *
 * THREE STATES, NOT TWO. `measured` (the claims were compared with the repository's own
 * record), `false` (a claim disagrees), and `unknown` (the comparison could not be made —
 * the API was unreachable, or the board could not be read). Absence is a state: an
 * unmeasurable board is NEVER reported as "no false claims". That distinction is the whole
 * point — a check that could not see must say so rather than pass.
 *
 * EXIT CODES (the exit code IS the result, not an error):
 *   0  measured, and every comparable claim agrees with the repository's record
 *   1  measured, and at least one claim is FALSE (the rows are named)
 *   2  could not measure (unknown)
 *
 * USAGE
 *   node scripts/surface/lane-truth-check.mjs --selftest
 *   node scripts/surface/lane-truth-check.mjs                 # report on stdout
 *   node scripts/surface/lane-truth-check.mjs --json out.json # the dated record
 *   COAI_LANES=<path> node scripts/surface/lane-truth-check.mjs
 *
 * The resolver is injectable, so the selftest proves each verdict against a FIXTURE and
 * never touches the network. A guard that has stopped working must fail loudly rather
 * than pass everything silently.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = process.env.GITHUB_REPOSITORY || "CSOAI-ORG/councilof-ai";
const OWNER = REPO.split("/")[0];
const DEFAULT_LANES = "council-os/LANES.md";

// The state words a row may claim. A row that claims something else is NOT comparable and
// is skipped: absence is a state, and "not a state word" is not "false".
const CLAIM_WORDS = new Set(["open", "merged", "closed"]);

// --------------------------------------------------------------------------- parsing

/**
 * A row is a table line with at least four cells:
 *   | lane id | branch | owner | state | description |
 * The header the board actually carries is `| lane | owner | files/territory | state |`,
 * which does not describe these cells — the CONTENT is what every row has always been,
 * and the board has grown prose sections with the same shape. What matters for a claim
 * check is the shape: id, branch, owner, state.
 */
export function parseLanes(text) {
  const rows = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    const [lane, branchCell, owner, stateCell] = cells;
    if (!lane || lane === "lane" || /^-+$/.test(lane)) continue;
    const state = stateCell.replace(/`/g, "").trim();
    const claimWord = state.split(/[\s(]/)[0].toLowerCase();
    const branch = branchCell.replace(/`/g, "").trim();
    // The second cell is a branch only when it looks like one: no spaces, one slash.
    const isBranch = /^[\w.-]+\/[\w./-]+$/.test(branch) && !branch.includes(" ");
    // A claim may carry its own EVIDENCE — `merged (via #3570)` — which names the pull
    // request the claim rests on. The evidence is checked, not the bare word.
    const evidence = (state.match(/#(\d+)/) || [])[1] || null;
    rows.push({
      line: i + 1,
      lane: lane.replace(/`/g, ""),
      branch: isBranch ? branch : null,
      owner: owner.replace(/`/g, ""),
      state,
      claimWord: CLAIM_WORDS.has(claimWord) ? claimWord : null,
      evidence,
    });
  }
  return rows;
}

// --------------------------------------------------------------------------- verdicts

/**
 * reality: "merged" | "open" | "closed" | "no-pr" | "unknown"
 * claim:   "open" | "merged" | "closed"
 */
export function verdict(claim, reality) {
  if (!claim) return "not-comparable";
  if (!reality || reality === "unknown") return "unknown";
  if (reality === "no-pr") {
    // A row that claims `open` and names a branch no pull request ever carried is a claim
    // about something that does not exist. It is FALSE, and it is the most misleading kind:
    // it looks like live work.
    return claim === "open" ? "FALSE_OPEN_BUT_NO_PR" : "FALSE_" + claim.toUpperCase() + "_BUT_NO_PR";
  }
  const agrees = {
    open: reality === "open",
    merged: reality === "merged",
    closed: reality === "closed",
  }[claim];
  if (agrees) return "agrees";
  return `FALSE_${claim.toUpperCase()}_BUT_${reality.toUpperCase().replace("-", "_")}`;
}

// --------------------------------------------------------------------------- resolving

/**
 * Resolve a branch to the pull requests that carried it. The repository's own record is
 * the only authority used: no third-party count, no live site, nothing that can be stale
 * in a way this cannot see.
 */
export async function resolveBranch(branch) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error("no GITHUB_TOKEN");
  const url = `https://api.github.com/repos/${REPO}/pulls?state=all&head=${encodeURIComponent(
    `${OWNER}:${branch}`
  )}&per_page=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "csoai-lane-truth-check/1.0",
    },
  });
  if (!res.ok) throw new Error(`GET pulls?head=${branch} -> ${res.status}`);
  const prs = await res.json();
  if (!prs.length) return { reality: "no-pr", prs: [] };
  const prsByUpdated = [...prs].sort((a, b) =>
    String(a.updated_at).localeCompare(String(b.updated_at))
  );
  const latest = prsByUpdated[prsByUpdated.length - 1];
  const reality = latest.merged_at ? "merged" : latest.state === "open" ? "open" : "closed";
  return {
    reality,
    prs: prs.map((p) => ({
      number: p.number,
      state: p.state,
      merged: !!p.merged_at,
      merged_at: p.merged_at,
      updated_at: p.updated_at,
      draft: !!p.draft,
    })),
  };
}

// --------------------------------------------------------------------------- measure

/**
 * @param {string} lanesPath
 * @param {(branch: string) => Promise<{reality: string, prs: any[]}>} resolver
 */
export async function measure(lanesPath, resolver, resolveNumber = resolverByNumber) {
  let text;
  try {
    text = readFileSync(lanesPath, "utf8");
  } catch (e) {
    return { state: "unknown", reason: `the board could not be read: ${e.message}`, rows: [] };
  }
  const rows = parseLanes(text);
  const comparable = rows.filter((r) => r.claimWord);
  const records = [];
  for (const row of comparable) {
    const rec = { ...row, reality: "unknown", verdict: "not-comparable", prs: null };
    if (!row.branch) {
      // A claim that names no branch cannot be compared with anything. That is its own
      // state — NOT a false claim, and NOT the same as "we tried and could not see".
      rec.verdict = "not-comparable";
      records.push(rec);
      continue;
    }
    let resolved;
    try {
      resolved = await resolver(row.branch);
    } catch (e) {
      rec.reason = `the repository's record could not be read: ${e.message}`;
      rec.verdict = "unknown";
      records.push(rec);
      continue;
    }
    rec.reality = resolved.reality;
    rec.prs = resolved.prs;
    // A claim that names its evidence is judged on THAT pull request: `merged (via #3570)`
    // is true exactly when #3570 is merged, whether or not the row's own branch was merged.
    if (row.evidence) {
      const ev = (resolved.prs || []).find((p) => String(p.number) === row.evidence);
      if (ev) {
        rec.reality = ev.merged ? "merged" : ev.state === "open" ? "open" : "closed";
        rec.evidence_pr = ev.number;
      } else {
        // The named evidence is not in this branch's pull requests; resolve it directly.
        try {
          const evResolved = await resolveNumber(row.evidence);
          rec.reality = evResolved.reality;
          rec.evidence_pr = Number(row.evidence);
          rec.prs = evResolved.prs;
        } catch (e) {
          rec.verdict = "unknown";
          rec.reason = `the named evidence #${row.evidence} could not be read: ${e.message}`;
          records.push(rec);
          continue;
        }
      }
    }
    rec.verdict = verdict(row.claimWord, rec.reality);
    records.push(rec);
  }
  const falseRows = records.filter((r) => String(r.verdict).startsWith("FALSE"));
  const unknownRows = records.filter((r) => r.verdict === "unknown");
  return {
    state: unknownRows.length ? "unknown" : falseRows.length ? "false" : "measured",
    measured_at: new Date().toISOString(),
    repo: REPO,
    lanes_path: lanesPath,
    rows_total: rows.length,
    rows_comparable: comparable.length,
    false_claims: falseRows.length,
    unknown_rows: unknownRows.length,
    rows: records,
  };
}

export async function resolverByNumber(number) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error("no GITHUB_TOKEN");
  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls/${number}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "csoai-lane-truth-check/1.0",
    },
  });
  if (!res.ok) throw new Error(`GET pulls/${number} -> ${res.status}`);
  const p = await res.json();
  return {
    reality: p.merged_at ? "merged" : p.state === "open" ? "open" : "closed",
    prs: [
      { number: p.number, state: p.state, merged: !!p.merged_at, merged_at: p.merged_at },
    ],
  };
}

// --------------------------------------------------------------------------- selftest

async function selftest() {
  const cases = [];
  const check = (name, ok, detail = "") => cases.push({ name, ok: !!ok, detail });

  // 1. the row that started this: claims open, merged a week ago.
  check(
    "a row claiming open whose pull request merged is FALSE",
    verdict("open", "merged") === "FALSE_OPEN_BUT_MERGED"
  );
  // 2. and the reverse.
  check(
    "a row claiming merged whose pull request is open is FALSE",
    verdict("merged", "open") === "FALSE_MERGED_BUT_OPEN"
  );
  // 3. a row claiming open with no pull request at all.
  check(
    "a row claiming open with no pull request is FALSE",
    verdict("open", "no-pr") === "FALSE_OPEN_BUT_NO_PR"
  );
  // 4. honest rows agree.
  check("a row claiming open with an open pull request agrees", verdict("open", "open") === "agrees");
  check("a row claiming merged with a merged pull request agrees", verdict("merged", "merged") === "agrees");
  check("a row claiming closed with a closed pull request agrees", verdict("closed", "closed") === "agrees");
  // 5. absence is a state: an unmeasurable reality is UNKNOWN, never "agrees".
  check("an unknown reality is UNKNOWN, not agreement", verdict("open", "unknown") === "unknown");
  check("a non-state word is not comparable", verdict(null, "merged") === "not-comparable");

  // 6. the parser reads the board's actual shape and ignores the header.
  const fixture = [
    "# LANES — live lane claims.",
    "",
    "| lane | owner | files/territory | state |",
    "|---|---|---|---|",
    "| `lane-a` | `fix/lane-a` | `mavis` | open | a description |",
    "| `lane-b` | `fix/lane-b` | `mavis` | merged (via #3570) | another description |",
    "| `lane-c` | not a branch | claude | open | a claim with nothing to compare it against |",
    "| `lane-d` | `fix/lane-d` | grok | RUNNING | a prose state word |",
  ].join("\n");
  const parsed = parseLanes(fixture);
  check("the parser reads every row with four cells", parsed.length === 4, `parsed ${parsed.length}`);
  check("the header is not a row", !parsed.some((r) => r.lane === "lane"));
  check("a branch cell is recognised", parsed[0].branch === "fix/lane-a");
  check("a prose cell is not a branch", parsed[2].branch === null);
  check("a prose state word is not comparable", parsed[3].claimWord === null);
  check("a claim may carry its evidence", parsed[1].evidence === "3570");
  check("evidence does not change the claim word", parsed[1].claimWord === "merged");

  // 7. the instrument end to end, against a FIXTURE resolver — no network.
  const dir = mkdtempSync(join(tmpdir(), "lane-truth-"));
  const path = join(dir, "LANES.md");
  writeFileSync(path, fixture);
  const fake = async (branch) => {
    if (branch === "fix/lane-a") return { reality: "merged", prs: [{ number: 10, state: "closed", merged: true }] };
    if (branch === "fix/lane-b") return { reality: "merged", prs: [{ number: 11, state: "closed", merged: true }] };
    return { reality: "open", prs: [{ number: 12, state: "open", merged: false }] };
  };
  // The evidence resolver is injected too, so the selftest never touches the network.
  const fakeNumber = async (number) => {
    if (String(number) === "3570") return { reality: "merged", prs: [{ number: 3570, state: "closed", merged: true }] };
    throw new Error(`no fixture for #${number}`);
  };
  const m = await measure(path, fake, fakeNumber);
  check("the instrument measures the board", m.state === "false", `state=${m.state}`);
  check("it finds exactly the false claim", m.false_claims === 1, `false=${m.false_claims}`);
  check(
    "it names the false row",
    m.rows.find((r) => r.lane === "lane-a")?.verdict === "FALSE_OPEN_BUT_MERGED"
  );
  check(
    "the row whose evidence is merged agrees",
    m.rows.find((r) => r.lane === "lane-b")?.verdict === "agrees"
  );
  check("a row with no branch is not comparable", m.rows.find((r) => r.lane === "lane-c")?.verdict === "not-comparable");
  check(
    "a row whose state word is prose is not measured at all",
    !m.rows.some((r) => r.lane === "lane-d")
  );

  // 8. a resolver that FAILS must produce UNKNOWN, never a clean bill of health.
  const broken = await measure(path, async () => {
    throw new Error("the API is unreachable");
  }, fakeNumber);
  check("an unmeasurable board is UNKNOWN", broken.state === "unknown", `state=${broken.state}`);
  check("an unmeasurable board never reports zero false claims as truth", broken.false_claims === 0 && broken.unknown_rows > 0);

  // 9. a board that cannot be read is UNKNOWN too.
  const missing = await measure(join(dir, "no-such-file.md"), fake);
  check("a missing board is UNKNOWN", missing.state === "unknown");

  rmSync(dir, { recursive: true, force: true });

  let failed = 0;
  for (const c of cases) {
    if (!c.ok) failed++;
    console.log(`${c.ok ? "ok  " : "FAIL"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`lane-truth-check selftest: ${cases.length - failed}/${cases.length} passed`);
  if (failed) process.exit(1);
}

// --------------------------------------------------------------------------- main

const argv = process.argv.slice(2);
if (argv.includes("--selftest")) {
  await selftest();
} else {
  const jsonAt = argv.indexOf("--json");
  const lanesPath = process.env.COAI_LANES || DEFAULT_LANES;
  let result;
  try {
    result = await measure(lanesPath, resolveBranch);
  } catch (e) {
    result = { state: "unknown", reason: e.message, rows: [], false_claims: 0 };
  }
  if (jsonAt > -1 && argv[jsonAt + 1]) {
    writeFileSync(argv[jsonAt + 1], JSON.stringify(result, null, 2));
    console.log(`wrote ${argv[jsonAt + 1]}`);
  }
  const falses = result.rows.filter((r) => String(r.verdict).startsWith("FALSE"));
  console.log(`lane board: ${result.rows_total} rows, ${result.rows_comparable} comparable`);
  console.log(`state: ${result.state}`);
  if (result.reason) console.log(`reason: ${result.reason}`);
  console.log(`false claims: ${result.false_claims}`);
  for (const r of falses) {
    console.log(
      `  line ${r.line} ${r.lane} — claims ${r.state}, the record says ${r.reality}` +
        (r.prs ? ` (${r.prs.map((p) => "#" + p.number).join(", ")})` : "")
    );
  }
  if (result.state === "unknown") process.exit(2);
  if (result.false_claims > 0) process.exit(1);
}
