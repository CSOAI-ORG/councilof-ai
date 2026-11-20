# Public front-end lane — week plan, 2026-11-20 → 2026-11-26

**Doc ID:** `csoai.public-front-end-lane-week-plan/0.2` · operator: mavis · horizon: DAYS
**Supersedes:** `docs/operations/PUBLIC-FRONT-END-LANE-WEEK-PLAN-2026-11-09.md` (0.1). A dated read
is never rewritten; this is the second reading, and it says what changed.
**Alignment:** `docs/operations/PUBLIC-SURFACE-AUDIT-2026-11-09.md`, the estate's
`docs/operations/ALIGNMENT-PLAN-2026-11-03.md`, and the two closed lanes #3783 and #3784.

## 0. What the last eleven days actually did

Plan 0.1 had six tracks. Here is each one, measured on 2026-11-20:

| track (0.1) | outcome |
|---|---|
| A — daily reading of the public surface | **done and still running.** The estate's own `scripts/audit/published-surface-audit.py` went from **2 findings to 1**. `meok.ai` is fixed by its owner: it now enforces CSP and carries `strict-transport-security`, `permissions-policy` and `x-frame-options`. |
| B — the CSP | **the blocker is gone.** `councilof.ai` now serves a `report-to` destination (Cloudflare's own endpoint, group `cf-nel`), so the traffic window 0.1 said was unobservable **is** observable. The policy is still `Report-Only`, so it still protects nothing until it is promoted. |
| C — the two stranded lanes | **both closed, with evidence on them.** #3783 landed (`c49b4e19b`) and its squash diff to master is **two lines**; #3784 was closed as superseded. In both cases the estate had already taken the work — the merge itself is the proof. |
| D — the PR backlog | **partly done.** The estate's own P5 remedy landed in #4251 (`07cfb3778`): **30 pull-request workflows** now carry the same `concurrency`/`cancel-in-progress` block `pr-gates.yml` already used, so superseded runs stop piling up behind live ones. |
| E — the npm client | **not done, and it is the one item that needs a human.** `latest` is still 0.2.0 with no provenance, and `0.0.0-stage` is still on the package. The trusted publisher on npm **expired**. See Track 1. |
| F — owner-gated rows | measured again this week; see the audit that accompanies this plan. |

## 1. Track 1 — the npm client (one human action, then it is finished)

**State, measured 2026-11-20.** The npm session is gone from everywhere on this machine: the CLI
token in `~/.npmrc` answers **401**, and the Chrome profile holds **no npmjs cookie at all**. npm's own
page says the connection has **expired**: *"This trusted publisher configuration has expired. Delete it
and create a new one."*

**What is already done and merged, so that only the two npm actions remain:**

- #3653 — the package is at **0.2.1**, the CHANGELOG records what 0.2.0 and 0.2.1 are, and the four
  records the first publish falsified were corrected.
- #3656 — the publish workflow names the **GitHub** organization (`CSOAI-ORG`, not the npm scope owner
  `CSOAI` — the mismatch that made the first CI publish fail with `E404`), and it removes
  setup-node's placeholder credential so a failed OIDC exchange surfaces as `ENEEDAUTH` instead of a
  misleading 404.

**The two actions, both on npm's web UI, both needing the account's security key:**

1. **Delete** the expired connection (organization `CSOAI`) and **create** one with organization
   `CSOAI-ORG`, repository `councilof-ai`, workflow `npm-layer0.yml`, environment empty, permissions
   *npm publish* and *npm stage publish*.
2. **Dispatch** `npm-layer0.yml` with `version=0.2.1` from master, then verify the release carries
   `dist.attestations` and its six files are byte-identical to `origin/master`'s `packages/layer0-js`.

**Close test:** `https://registry.npmjs.org/@csoai/layer0` reports `dist-tags.latest = 0.2.1`, the
`0.2.1` version document carries `dist.attestations` naming the commit and the workflow, and
`0.0.0-stage` is gone.

**Why it has waited eleven days:** npm's second factor is a WebAuthn key, and npm's WebAuthn on this
machine fails against iCloud Keychain (Apple error 1001) — and no browser on this machine holds an npm
session any more. **One sign-in is the whole blocker.** Nothing else about this track is outstanding.

## 2. Track 2 — promote the CSP (now measurable, and the static risk is low)

The policy on `councilof.ai` is still `Content-Security-Policy-Report-Only`, so it protects nothing
today. Three things have changed since 0.1 said this could not be measured:

1. **There is a reporting destination now** (`report-to` → Cloudflare's endpoint). The window can be
   read.
2. **`meok.ai` has shown the enforced form works** — that surface now runs the same policy
   *enforced*, with `frame-src` declared for the origins it embeds.
3. **The static risk on `councilof.ai` is low.** The built tree embeds **no external frame**: every
   `<iframe>` src found is either `data:` or `/globe3d.html`. The policy declares **no `frame-src`**, so
   `default-src 'self'` governs frames — which today breaks nothing, and is the one directive that
   would need a declared value before promotion if the site ever embeds one.

**Close test:** the header reads `Content-Security-Policy:` (no `-Report-Only`), the audit reports **0
findings**, and the live site still answers 200 on `/`, `/board/`, `/dashboard/`, `/catalog.json`,
`/llms.txt` and `/api/gspc`.

## 3. Track 3 — the two defects the closed lanes found (named, located, reproducible)

Neither is a reason to keep a branch open; both are work for the lane that owns the code.

1. **`scripts/github/test_repo_metadata.py`** — the public-usability lane's test calls
   `apply_descriptions()`, which master's `repo-metadata.py` replaced with `apply()`/`replan()`. It has
   to be re-derived against master's API before it can land. **Owner:** whoever owns
   `scripts/github/repo-metadata.py`. **Close test:** the test runs against master's API and the
   licence rule it pins (only MIT and Apache-2.0 are selected) stays pinned by a test.
2. **`functions/mcp/stdio-board-parity.test.ts`** — it fails against master's current board reader:
   **the stdio transport and the HTTP `board_totals` door have drifted apart** (state/reachable fields,
   and `detail` semantics). That is a parity defect in the product, not a test to delete. **Owner:** the
   MCP lane. **Close test:** the stdio reader and the HTTP door return the same board, and the parity
   test is green.

## 4. Track 4 — the backlog rule, now that the concurrency block has landed

Measured 2026-11-20: **100+ open pull requests**, **51 with auto-merge armed**, and 259 commits landed
on master in eight days. A branch that is 1100 commits behind can never catch up — GitHub's automatic
branch update cannot resolve a merge that far behind, so those lanes sat for two weeks while their
checks queued behind runs of their own older commits.

**The rule, stated from what was measured:**

- **A pull request whose files are all present on master is superseded.** Close it with the count:
  how many were identical, how many revised, how many absent. Do not merge it.
- **A pull request that still carries files absent from master is landable as a small additive change**
  — not as a branch merge. Take the absent files, put them on current master, and let the gates run
  while the diff is small enough to land.
- **Never merge a branch that has fallen more than a day behind.** Measure first, land second.

This is what happened to #3783 (landed, net two lines) and #3784 (closed, all eleven absent files
taken by other lanes within eight days).

## 5. Track 5 — the standing rules (unchanged, and they are why this week worked)

1. **PR-only.** master is protected; every landing is a branch, a pull request and green gates.
2. **One lane = one writer = one branch = one worktree.** Other lanes' surfaces are read-only; a
   conflict goes to `LANE_COORDINATION.md` as an appended notice, never as a byte counter-attack.
3. **Generated bytes regenerate through their own script.** The axis pages, `openapi.json`,
   `sitemap.xml`, the signed index and the catalogue are producers' outputs; they are never
   hand-edited.
4. **A dated read is a new document.** 0.1 of this plan stays; this is 0.2.
5. **Owner-gated rows are observed, never faked.** A security-key touch, a credential, a named human
   label and an owner's promotion decision are recorded as waiting on a named human, never simulated.
6. **A gate that cries wolf is worse than no gate** — and a lane that cannot land is a gate that cries
   wolf on the whole estate.

## 6. The invariant this week keeps

**A door is a promise only if something published names it.** On 2026-11-09, 61 doors were probed: 51
answered, 10 answered 404, and every one of those ten was named by no published surface. The estate's
own audit then found **2** findings on the live site, and today it finds **1**.

**A superseded lane is a closed lane, with its measurement on it.** The two lanes that sat for two
weeks were not rescued by force-merging them; they were measured, and the measurement showed that the
estate had already taken their work. Closing them with that evidence is what freed the backlog.
