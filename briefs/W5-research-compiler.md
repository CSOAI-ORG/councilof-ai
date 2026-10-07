You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: W5-research-compiler (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/w5-research-compiler-20261007 origin/master`. Never work on master.
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
1. Commit with a clear message (subject prefixed `lane(W5-research-compiler): `, body ending with the "Lane:" line), then `git push -u origin cloud/w5-research-compiler-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-W5-research-compiler-DONE branch=cloud/w5-research-compiler-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane W5-research-compiler: a weekly, reproducible research digest compiled only from data we already publish — drafts only, nothing auto-publishes.

1. M35 `scripts/research/compile.py` (+ tests) answering four questions from existing public data, each figure carrying source URL, n and read time, and UNMEASURED when the data is not reachable (never fill a gap):
   a. x402 strict-v2 conformance share over time — from the HF dataset csoai/x402-bazaar-conformance releases (find how the repo reads it: grep for x402-bazaar-conformance; use the HF datasets API anonymously; if private, mark UNMEASURED and note the workflow will need the existing HF token secret).
   b. A2A agent-card signature-verified share — from the A2A card census records (grep census/a2a).
   c. MCP tool-drift share — from the tool-drift records (grep tool_drift / tool-drift).
   d. Claim D7 survival — from the claims register/outcomes committed in the repo.
   Output: `research/findings/<UTC date>.json` (unsigned, marked DRAFT; the signer path comes later) and `research/drafts/<UTC date>.md` — a plain-English draft note with 4 small figures or tables (matplotlib PNGs are fine if small) and a "what this does not show" section.
2. R-01 `scripts/research/rederive_x402.py`: reproduce a 30-day per-host conformance flip matrix (CONFORMANT↔NOT, by host+probe_url identity, multiset comparison — ordering is not change) from the HF release files alone, and print its own inputs' sha256s.
3. `.github/workflows/research-compiler.yml`: weekly (Monday 05:20Z) + workflow_dispatch; runs the compiler and opens a PR `bot/research-<date>` with the draft files (copy the PR-opening pattern and permissions from an existing workflow such as mill-jobs-land.yml; note in the workflow that bot-token PRs need a close/reopen to trigger checks). Never commits to master directly.
4. Run the compiler once in this sandbox and commit that first draft output with your PR so reviewers can see it.

Doctrine: measure, never certify; own estate (councilof.ai, csoai.org, meok.ai, proofof.ai, CSOAI-ORG ids) excluded from population figures; no prices; never compare across the three card corpora. Done when: tests pass, the first draft is generated from real data with every figure sourced, and the workflow file validates (actionlint if available, else a YAML parse).
