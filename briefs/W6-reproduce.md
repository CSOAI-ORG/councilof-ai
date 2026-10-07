You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: W6-reproduce (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/w6-reproduce-20261007 origin/master`. Never work on master.
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
1. Commit with a clear message (subject prefixed `lane(W6-reproduce): `, body ending with the "Lane:" line), then `git push -u origin cloud/w6-reproduce-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-W6-reproduce-DONE branch=cloud/w6-reproduce-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane W6-reproduce: make it easy for a stranger to check our work, and count only real outside reproductions.

1. X-01: `public/interop/reproductions.json` — a register of external reproductions (schema: who, what artifact sha256, which tier, tool + version, result VALID/INVALID/UNCHECKABLE, date, link to their own public evidence, and `kind`: EXTERNAL or SELF). Seed it with zero EXTERNAL rows and our own canaries labelled SELF (e.g. the verify-card run: find scripts/verify-card*.mjs or packages/*verif*; the 7 Oct proof work found 0 external reproductions recorded). Add `external_reproductions` to /api/state (functions/api/state.ts or wherever /api/state is assembled) reading that file: {external_count, self_count, as_of, source_url}. The external count moves only for a non-CSOAI report that cites a sha and a verify result. Test that SELF rows never count as external.
2. X-02: a `/reproduce/` page in the client (client/src/pages; follow how other pages are wired — routes, nav if appropriate, sitemap/prerender lists, and PRIMARY_PATHS: grep for PRIMARY_PATHS; a new page that misses that wiring ships as "archived"). Three tiers, plain English, each with copy-paste commands that you have actually run in this sandbox against production and that work: Tier 1 verify (check a signed card and the signed index with our verifier — free, ~20 s); Tier 2 re-derive (recompute a published number from its public input files); Tier 3 re-observe (re-run a small public probe yourself, politely: 1 req/s, GET only). Each tier states what it proves and what it does not. Link to reproductions.json and say how to report a result (GitHub issue on this repo with a template: add .github/ISSUE_TEMPLATE/reproduction.yml).
3. Check the page at phone (390x844) and desktop widths with Playwright (chromium at /opt/pw-browsers) after `npm run build:client` + a local static serve; no horizontal overflow; screenshots stay in /tmp.

Doctrine: measure, never certify; no prices; numbers cite source, n, read time. Done when: tests pass, the page builds and renders at both widths, every command on the page was run and its output pasted in the PR body.
