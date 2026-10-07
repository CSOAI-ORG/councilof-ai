You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: W2-x402-truth (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/w2-x402-truth-20261007 origin/master`. Never work on master.
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
1. Commit with a clear message (subject prefixed `lane(W2-x402-truth): `, body ending with the "Lane:" line), then `git push -u origin cloud/w2-x402-truth-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-W2-x402-truth-DONE branch=cloud/w2-x402-truth-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane W2-x402-truth: fix three truth defects in the x402 Bazaar conformance observatory producer before it publishes again (it runs daily at 01:05Z on another host from a pinned copy of this file; the owner re-pins from master after merge).

Producer: scripts/census/x402-bazaar-conformance.py. Opt-out list: scripts/census/probe-exclusions.json. Read scripts/census/README.md and the census pages/functions that describe the crawler (grep for the UA string `csoai-x402-bazaar-conformance` and for "CSOAI-census").

Facts (read 7 Oct 2026): the 7 Oct release reports 2,884 hosts, 574 strict-v2 conformant (19.90%), +48/-27 and "price_drift 57". The diff keys on host only, and the probe takes "the first resource the index lists", so most price_drift values compare different resources on the same host (only 8 of 57 compared the same probe_url; around L295-309). The probe reads neither robots.txt nor probe-exclusions.json, and it uses a second UA. Losses (LOST/DROPPED/BROKEN/PAYTO changes) are published after one read.

Do:
1. OBS-01: diff identity = (host, probe_url, accepts_index) with a sticky resource choice per host (keep yesterday's probe_url when it is still listed). Compute price / payTo / asset drift only when the identity matches; count identity changes separately as `resource_switched`. Add tests with fixtures that reproduce the 7 Oct false-drift pattern (two resources on one host, order swapped = no drift; same URL, amount changed = drift).
2. OBS-02: honour robots.txt for the census token and probe-exclusions.json, fail-closed (if robots cannot be read because of an error other than 404, skip the host and record SKIPPED_ROBOTS_UNREADABLE; never probe an excluded host). Use one declared UA consistent with what the public crawler page promises (find it; if the page names two UAs, keep the code consistent with the page and say which). Tests: an excluded host never appears in the output; a robots Disallow is honoured.
3. OBS-03: a loss-type change seen on a single read is published as PENDING_CONFIRMATION, and only becomes a change after the next day's read confirms it. Add a `confirmation` field to diff records. Test with a transient loss.
4. OBS-08: own-estate exclusion as code — hosts and ids under councilof.ai, csoai.org, meok.ai, proofof.ai, ai.councilof/*, io.github.CSOAI-ORG/* (and any other own domain you find listed in the repo's own-estate config, if one exists — grep for "own_estate" / "ourselves") are never counted in population figures; they may appear only in a separate `ourselves` section. Unit test: fails if an own host is counted.
5. Draft (do not promote) a correction for the 6 Sep–7 Oct price_drift values in the repo's corrections-drafts format (look at council-os/corrections-drafts/ for the exact shape and naming); state that the earlier numbers mixed resource switches with drift, and give no new number you have not computed from committed bytes.

Do not run the live probe against the internet beyond a tiny smoke test (at most 3 hosts, 1 request/second, GET only). Do not touch any HF dataset or signed release file.

Done when: the new tests pass (show output), the script's own --help/dry-run still works, producers-check passes, and the PR body lists each OBS id as DONE or NOT DONE with the reason.
