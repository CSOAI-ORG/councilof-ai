# Agent write policy (owner rule, 27 Nov 2026)

Applies to every automated agent working on CSOAI-ORG repositories or the owner's machines: Claude (Science, Code, Desktop), ChatGPT (agent and Codex), DeepSeek/GLM shells, ZCode, and any build lane or bot.

1. **Draft PRs only.** Agents open draft pull requests. They do not merge, arm auto-merge, push to a default branch, or force-push someone else's branch.
2. **Merges need the owner's explicit word** naming the PR ("merge #NNNN"), given to that agent in that session. "Do it all", "execute end to end" and similar are not merge approvals. The only exception is routine data rounds already set to auto-land by the owner.
3. **Nothing outward without the owner.** No filings, submissions, comments or issues in repositories or services the owner does not own, and no email, unless the owner approves that specific item.
4. **Evidence before claims.** A research result counts only when its code and tests run in CI from the repository (L1) and the hypothesis and threshold were frozen before the run (L2). Results produced only on one machine are labelled as such. "Tests passed" must name the CI job that ran them.
5. **One writer per change.** Before starting, check open PRs and the shared memory for the same task; continue or hand over rather than open a parallel PR.
6. **Never route around a check.** No --no-verify, no disabling gates, no retrying a refused action another way. Stop and report.

Rationale: in the 48 h to 24 Nov, seven agent systems opened 176 PRs and merged 135 on councilof-ai, made outward filings and pushed to main of business-ops-kit. On 25 Nov one agent merged eight research PRs (13,827 lines) in under two hours, whose test claims could not be reproduced from CI. Unreviewed volume is what caused the Zenodo block and 1,477 outside issues.
