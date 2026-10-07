You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: W7-harness-core (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/w7-harness-core-20261007 origin/master`. Never work on master.
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
1. Commit with a clear message (subject prefixed `lane(W7-harness-core): `, body ending with the "Lane:" line), then `git push -u origin cloud/w7-harness-core-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-W7-harness-core-DONE branch=cloud/w7-harness-core-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane W7-harness-core: one instrument, one reproduction-capsule schema — the foundation of an installable `gspc-eval` runner.

Code: scripts/runpod_gspc_worker.py (+ scripts/test_runpod_gspc_worker.py), packages/repro (manifest schema and tests), public/schema/ (served schemas; see how existing schemas are laid out and listed), eval-ci pins (grep for "eval-ci" and grader pins).

Do:
1. H01: factor a `gspc_core` module out of scripts/runpod_gspc_worker.py — exact-label answer parser, grader, Wilson interval, transport-failure exclusion, items hashing (items_sha256) — and make the worker import it, so there is one instrument. Behaviour must be byte-identical: find stored mill run outputs committed in the repo that carry per-item answers plus items_sha256 (grep for items_sha256 under public/, data/, cards/ or hf mirrors), pick 3 from different models, re-grade them with gspc_core and show the reproduced items_sha256 and scores match byte for byte. If fewer than 3 such runs are committed, use what exists and say how many. The worker's existing tests must still pass. No grader behaviour change; if eval-ci pins the grader by hash, the pin must still match (or explain precisely why it legitimately moves).
2. H04: `reproduction-capsule/0.1` JSON Schema, CC0-1.0: the existing repro manifest (packages/repro) plus subject identity class, inputs inclusion proof, outputs and a comparison block. Reuse existing schema fragments ($ref) rather than redefining. UNCHECKABLE is a value a verifier may report, never one a producer fills in. Put it where the repo serves schemas under /schema/ (follow the existing layout and any index file that lists schemas), with fixtures: one valid capsule, and tamper controls (a changed output hash, a missing inclusion proof, a producer-filled UNCHECKABLE) that must fail validation. Add a test that validates all fixtures.
3. Do not create the packages/gspc-eval CLI yet (H03 is the next lane); you may add a short design note at packages/gspc-core/README.md or alongside the module explaining the interface H03 will import.

Guardrails: issuer is always "self" for anything a stranger produces, never CSOAI; state CANDIDATE; n<30 is unquotable; unrun axes stay UNMEASURED. Apache-2.0 for code, CC0 for the schema.

Done when: the 3-run byte-identical re-grade is shown in the PR body with hashes; worker tests pass; schema fixtures test passes; producers-check passes if you touched any produced file.
