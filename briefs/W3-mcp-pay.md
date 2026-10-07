You are a cloud build lane for CSOAI-ORG/councilof-ai (the councilof.ai site and the GSPC measurement board). You start with no context beyond this message and the repository. Work autonomously to a finished, verified result; do not stop to ask questions.

WHO YOU ARE: sign every commit message body and the final report with the line "Lane: W3-mcp-pay (cloud routine, Claude Fable 5.1)". The GitHub identity is shared between many lanes, so this line is how the owner tells lanes apart.

SETUP
1. `git fetch origin master --depth=200` and branch from origin/master: `git checkout -B cloud/w3-mcp-pay-20261007 origin/master`. Never work on master.
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
1. Commit with a clear message (subject prefixed `lane(W3-mcp-pay): `, body ending with the "Lane:" line), then `git push -u origin cloud/w3-mcp-pay-20261007`. The push works from this sandbox; `gh` is NOT authenticated here, so do not try to open the PR yourself. The owner's main session opens and merges it on green.
2. Write the PR body you want used to `.lane-pr-body.md` at the repo root but DO NOT commit it; instead print it in full in your final message between the lines `=== PR BODY ===` and `=== END PR BODY ===`. The PR body has: Summary (plain English, 3-6 lines); What changed (files); Proof (commands run and their real output, trimmed); Not done / follow-ups; Risks. End it with "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
3. The very last line of your final message must be: `LANE-W3-mcp-pay-DONE branch=cloud/w3-mcp-pay-20261007 head=<full sha> tests=<pass|fail|partial>`.

YOUR LANE
Lane W3-mcp-pay: let a standard x402 MCP client pay the councilof.ai MCP server, and point free answers at paid fresh evidence — without prices in any text.

Code: functions/mcp/_paid.ts, functions/mcp/paid-tools.json (+ paid-tools.test.ts), mcp/gspc-server/paid-tools.json (keep the two in step if a test or producer requires it), the free tool handlers for server_evidence, mcp_trust and x402_trust (grep functions/mcp), and any tool-count pins (grep for the current tools/list count in tests and in prod-canary scripts/workflows).

Facts: functions/mcp/_paid.ts reads the payment only from the `x_payment` tool argument. The x402 MCP transport (x402 transports-v2, mcp.md, coinbase/x402 repo on GitHub — read it with curl from raw.githubusercontent.com) carries the payment in `params._meta["x402/payment"]` and returns `_meta["x402/payment-response"]`, so the standard `@x402/mcp` client can never pay us today. The server has 14 free + 5 paid tools (check the live count: `curl -s https://councilof.ai/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`).

Do:
1. BL-01: accept `_meta["x402/payment"]` alongside the `x_payment` argument (if both are present and differ, reject with a clear error); return the settlement result in `_meta["x402/payment-response"]` exactly as the spec defines, while keeping the existing response shape for `x_payment` callers. Pin both keys in paid-tools.test.ts (unpaid -> PaymentRequired; `_meta` payment path reaches verification; `x_payment` path unchanged). Prove the wire shape with the `@x402/mcp` client at the version current on npm (2.28.0 was current on 7 Oct; record the version you used) against the handler in-process or via `npx wrangler pages dev` locally (never deploy). Use a freshly generated throwaway EVM key with zero balance, created in memory for the test and never written to disk or committed; expected facilitator answer is an insufficient-balance error (e.g. invalid_exact_evm_insufficient_balance). If the facilitator is unreachable from the sandbox, stop at the in-process proof and say so.
2. BL-05: when server_evidence, mcp_trust or x402_trust answer about a subject that is UNMEASURED or stale, add `next.fresh_evidence` = the existing paid fresh-evidence door URL prefilled for that subject, one hint per transport (HTTP and MCP tool name), and no amount. The answer must be identical for every caller. Tests.
3. BL-02 (stretch, only if 1 and 2 are green): expose the existing fresh-capsule, ras/mcp-probe and ras/x402-check doors (find them under functions/) as paid MCP tools in paid-tools.json — existing doors only, descriptions without prices — so tools/list grows by exactly 3, and update every tool-count pin you find (tests, prod-canary expectations, any MCP registry/server.json tool listing that a test compares against). If a pin lives in a stamped file, do not touch it; stop BL-02 and report.

Payment buys a run or a delivery, never a grade, never a sooner or different read; verification stays free. Do not change any amount, payTo, network or asset.

Done when: paid-tools.test.ts pins both keys and passes; the free-tool pointer tests pass; the full functions/mcp test folder passes; you report the @x402/mcp proof output (or why it stopped).
