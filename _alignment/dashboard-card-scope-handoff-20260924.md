# Dashboard signed-card scope — M4 review handoff (24 September 2026)

**State:** review branch available on the RunPod bare repository; not merged or deployed. GitHub was not used.

| Item | Exact value |
| --- | --- |
| Local source | `/Users/nicholas/clawd/wt-codex-dashboard-card-scope-20260924`, `codex/dashboard-card-scope-20260924` |
| Change commit | `71f42f8e015a0f3348dc807fafc8a4f898e6df46` |
| RunPod review ref | `/workspace/git/councilof-ai.git` `refs/heads/codex/dashboard-card-scope-review-20260924-71f42f8e0` |
| Verified remote ref | `71f42f8e015a0f3348dc807fafc8a4f898e6df46` (`commit`) |
| RunPod master after review push | `be2e2ca2e46e5140539f98cd3e95ac8383e8f0d6` (unchanged) |

The public measurement index at `https://councilof.ai/signed/card_index.json` contains 335 cards. `/api/cards` reports 336 signed cards because it also includes one separately published cross-border card. The dashboard is labelled as the measurement-card index but currently displays the combined 336; the homepage displays 335. This commit makes `/api/dashboard/stats` subtract the separate card from its indexed and signed totals when `/api/cards` explicitly reports that card. It preserves null when the upstream count is unavailable and does not change `/api/cards` or the index. Signature presence remains distinct from independent verification.

Only `functions/api/dashboard/stats.ts` and `functions/api/dashboard/stats.test.ts` changed. The focused regression case asserts that a 336-card aggregate with the signed cross-border card gives dashboard `cards.count=335` and `cards.signed=335`. Direct execution of the handler passed four cases (index alone, signed extra card, unsigned extra card, and unavailable `/api/cards`); `git diff --check` passed. Full Vitest and TypeScript checks remain for the release lane because this isolated worktree has no installed `node_modules` (`TS2688` for `@cloudflare/workers-types`). The two source files at the commit's parent matched the RunPod publisher source when checked, but the review commit is not a fast-forward of current RunPod master: integrate the two-file change in a clean release branch, then run normal release checks.

M4 owns the existing guarded Cloudflare publisher. After integration and its normal deployment gate, anonymous served readback should show `/api/dashboard/stats` `cards.count=335`, `cards.signed=335`, and the measured dashboard tile 335 indexed cards. `/api/cards` should remain 336 including the separate cross-border card; `/signed/card_index.json` and the homepage should remain 335. Until M4 publishes, production's 336 dashboard display is expected. No shared checkout, deploy lock, bare master, or production deployment was changed here.

## Separate release-contract documentation review

A docs-only change to `AGENTS.md` and `DEPLOY-LOCK.md` is available at RunPod bare ref `refs/heads/codex/publisher-contract-review-20260924-v2-cb1e93cf3`, exactly `cb1e93cf3c121ad7edc02ead7e6611adb48eada6`. This is the review tip; the earlier ref `refs/heads/codex/publisher-contract-review-20260924-13c658f39` at `13c658f39dc8cf088fdee8295020821c734856f2` is **superseded** and should not be selected for release. The reviewed base versions of both files byte-match bare `master` at `be2e2ca2e46e5140539f98cd3e95ac8383e8f0d6`; `git diff --check` passed on both docs commits. The tip correctly names the existing `/workspace/lanes/loops/deploy-prod.sh`, `/workspace/ci/deploy.lock`, local bare source, Cloudflare destination, M4 ownership, and the script's prerequisite that `build-gates.sh` pass for the **same ref** before deployment. Both review pushes left bare `master` at the same SHA and did not deploy.
