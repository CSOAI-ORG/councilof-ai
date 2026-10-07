You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: V2-art50-index-versioned (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/v2-art50-index-versioned-20261007 origin/master`. Never work on master.
2. Read CLAUDE.md (root) first, then council-os/LANE-PROTOCOL.md if present. CLAUDE.md is binding; where it says "deploy from the pod", ignore that — production ships only from GitHub Actions deploy.yml on master.
3. Install only what your tests need. `npm ci` at the repo root is fine (lockfile present). Never run bare `npx vite build`; the client build is `npm run build:client`.

HARD RULES (gates on master enforce most of them; a red gate means your PR cannot merge)
- Push your branch only. Never push to master, never merge, never enable auto-merge, never close or edit other PRs, never force-push any branch but your own.
- Never edit a file that has a sibling `.ots` file (OpenTimestamps-stamped) or any byte-pinned file listed in a stamped manifest. Version instead: write a new dated file and point an unsigned `*-latest.json` at it.
- Never deploy (no wrangler, no vercel). Never print, commit or move secrets. No outward actions: no emails, no issues/comments/PRs on other repositories, no registry or directory submissions, no social posts.
- Doctrine: CSOAI measures; it never certifies, never issues conformity marks, never sells a grade. UNMEASURED and INSUFFICIENT_EVIDENCE are first-class states; never invent a number, and every number you write cites its source, n and read time. No public $ or USDC prices in copy, descriptions or tool text. Verification is free. CSOAI never hosts or scores its own models or products (MEOK, sov*, SovSpace, proofof.ai) and the claimant never measures itself (label any self-check SELF and exclude it from population totals). There are three separate card corpora (public/cards-bundle.json, public/root.json card_count, public/signed/card_index.json): never add, reconcile or substitute them.
- Banned public strings are enforced by scripts/brand-gate.mjs. Run `node scripts/brand-gate.mjs <dir>` where it applies, or grep your changed public copy against its list.
- "Ordering is not change": compare multisets or identity-keyed records, never list order. "Fix the producer, not the artifact": when a committed output is wrong, fix the script that generates it and regenerate; the `gates` workflow's producer-manifest step fails when committed outputs disagree with their producers (run `node scripts/producers-check.mjs` before pushing if you touched any produced file or its producer; the list is docs/operations/PRODUCERS.json).
- Keep the PR small and gated: one lane = one branch = one coherent change. A smaller, finished, honest change beats a large unfinished one. Stop at the done-when below; list anything not done.

VERIFY BEFORE PUSHING
- Run the targeted tests for every file you touched (vitest for .ts: `npx vitest run <paths>`; python: `python3 -m pytest <paths>` or `python3 -m unittest`), plus any test that imports what you changed. Paste the real output into the report. If a test fails and you cannot fix it, say so; never claim green you did not see.
- `git diff --stat origin/master...HEAD` must show only files your lane owns.

FINISH
1. Commit with a clear message (subject prefixed `lane(V2-art50-index-versioned): `, body ending with the "Lane:" line), then `git push -u origin cloud/v2-art50-index-versioned-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-V2-art50-index-versioned-DONE branch=cloud/v2-art50-index-versioned-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane V2-art50-index-versioned: stop the rolling art50 target-index job from editing a timestamp-stamped file.

Facts: .github/workflows/art50-target-index.yml regenerates public/interop/art50-target-index.json from the live provider-diff and opens a rolling PR (latest: PR #2873, branch art50-index/pending). That file has a sibling public/interop/art50-target-index.json.ots, so every rolling PR now fails `stamped-bytes` and `gates` ("stamped-bytes-gate HEAD^1..HEAD: FAIL (1 stamped pair touched)"). Editing a stamped file is forbidden; the estate's fix is versioning, already done twice: look at how PR #2865 (hub-cards-index) and PR #2868 (mill-receipt-readiness) did it — `git log --oneline -S 'latest.json' -- public/` and read those commits (`git fetch origin master --depth=400` first if needed).

Do:
1. Leave public/interop/art50-target-index.json and its .ots byte-for-byte untouched (they remain as the stamped historical record).
2. Change the producer/workflow to write a NEW dated file per regeneration (e.g. public/interop/art50-target-index/<UTC date or timestamp>.json, following the #2865 naming) and an unsigned pointer public/interop/art50-target-index-latest.json (or the exact pointer shape #2865 used) that names the newest dated file, its sha256 and as_of. A dated file, once committed, is never rewritten; a same-day rerun writes a new timestamped name or skips when content is unchanged (compare canonical content, not order — ordering is not change).
3. Update every reader of the old path (grep functions/, client/src/, scripts/, public/ for art50-target-index) to read the pointer → dated file, falling back to the stamped legacy file if the pointer is absent. Update PRODUCERS.json / producers-check entries if the producer is registered there.
4. If the stamping workflow stamps new dated files, wire the new file into it the same way #2865 did; if not, state that the dated files are unstamped.
5. Tests: reader resolves pointer → dated file; legacy fallback; the workflow's generate step (run it locally against a recorded provider-diff fixture if the live source needs secrets) produces a new dated file without touching the stamped one. Run `node scripts/producers-check.mjs` and the stamped-bytes gate script locally (find it under scripts/, e.g. stamped-bytes*.mjs) against your branch.

Do not close PR #2873 (the main session will close it, naming this lane, after yours merges). Done when: stamped-bytes and producers-check pass locally on your branch, reader tests pass, and the PR body lists every reader you changed.
