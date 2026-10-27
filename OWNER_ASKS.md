# OWNER ASKS — current external blockers + handoff items

Single source of truth. Updated when state changes. Do not scatter through reports.

Last updated: 2026-10-27 (rewritten from the state verified today; the 2026-09-17 list is
superseded and kept in git history).

Every state below was checked against a live endpoint on 2026-10-27. The evidence line says how.

---

## 1. OpenRouter credit — BLOCKING the frontier-vs-MEOK comparison

**State**: the key authenticates and the model exists; the balance is zero.
**Evidence**: `GET https://openrouter.ai/api/v1/models` → 200, 464 models, including
`openai/gpt-6.1-terra` and `openai/gpt-6.1-terra-pro`. A chat completion to
`openai/gpt-6.1-terra` → **HTTP 402**, *"Insufficient credits. This account never purchased
credits."*
**Owner action**: add credit at <https://openrouter.ai/settings/credits>, or supply an OpenAI key
with balance for `gpt-6.1-terra` (see #2).
**What it unblocks**: the comparison harness already exists and has already been run against a
frontier model (Kimi K3.1 Pro vs MEOK, 24 items, paired exact McNemar p = 6.10 × 10⁻⁵). The
Terra arm is one command:
`inspect eval gspc_governance.py --model openrouter/openai/gpt-6.1-terra`
plus a 237-item GSPC-gov run with the mill's grader. The plan and the arm-split discipline are
written up in `docs/measurement/GPT-6-1-TERRA-2026-10-27.md`.

## 2. OpenAI API key — INVALID

**State**: rejected.
**Evidence**: `GET https://api.openai.com/v1/models` → *"Incorrect API key provided: sk-proj-…"*.
**Owner action**: replace with a valid key for the account that owns `gpt-6.1-terra`, and put it
where the publisher can read it (env or `~/.env`), never in the repo.

## 3. `GSPC_BOARD_TOKEN` in CI — DEAD

**State**: the CI secret is dead; the local `gh` token works.
**Evidence**: the CI run of `gspc-spray.yml` on 2026-10-27 failed the GitHub mirror with
*"Invalid username or token"*; a local run with the `gh` CLI token **PUBLISHED** the same
snapshot to `CSOAI-ORG/gspc-board` at `as_of 2026-10-26T19:19:22Z`.
**Owner action**: mint a fine-grained PAT with `contents: write` on `CSOAI-ORG/gspc-board` and
store it as the `GSPC_BOARD_TOKEN` secret, so CI publishes the mirror without a human.

## 4. Zenodo — ACCOUNT BLOCKED

**State**: refused.
**Evidence**: `POST https://zenodo.org/api/deposit/depositions` → **HTTP 403** *"Permission
denied."* Every CSOAI Zenodo record answers 410; the DOIs are kept as the records' permanent
names and published with status `UNCHECKABLE` rather than silently dropped. The live board, the
signed cards and the per-item rows are the resolvable artefacts.
**Owner action**: appeal with Zenodo, or accept that only the HF DOIs are citable.

## 5. npm — WebAuthn account, no publish path

**State**: blocked by design of the account, not by a bug.
**Evidence**: the publisher reports *"the npm account is WebAuthn (not TOTP): `npm publish --otp=`
can never work and web login returns EOTP."*
**Owner action**: mint a granular access token with **Bypass 2FA** at npmjs.com → Access Tokens
and store it as the `NPM_TOKEN` secret. The publisher does not attempt npm until then.

## 6. The shared pre-commit hook calls a script that does not exist — BLOCKING EVERY LANE

**State**: the hook is broken repo-wide, not failing on any particular change.
**Evidence**: `~/.config/git/hooks/pre-commit` (rewritten 05:10 on 2026-10-27) makes the MEOK
MCP proxy-path tests mandatory and calls `${ROOT}/scripts/run-meok-proxy-tests.sh`. That script
exists in **no branch and no ref** of this repository, and `meok/mcp/` does not exist here
either, so the hook aborts on *"No such file or directory"* before testing anything. Every commit
in every lane is blocked until the script lands.
**Owner action**: land `scripts/run-meok-proxy-tests.sh` and `meok/mcp/`, or restore the
repository-scoped skip the hook used to have.

## 7. No host can run the full pre-push build

**State**: the content gates' `build:client` + `prerender:dashboard` stage needs a full checkout
and more memory than either host has.
**Evidence**: the M4's lane worktree is deliberately sparse (no `node_modules`), so the hook
aborts at the Chromium probe; the M2 has **956 MiB RAM** and `node` dies with
`FatalProcessOutOfMemory` inside `build:client`.
**Owner action**: either run the gate on a host with ≥ 4 GB RAM and a full checkout, or accept
that CI (`pr-gates.yml`) is the gate and the local hook is advisory for lane pushes. The
source-level content gates **were** run locally and pass: wallet-credential (39,697 tracked
paths), canary-leak (3,759 files, 0 leaks), brand-gate, price-gate, facts-gate selftest.

## 8. The M4's disk — was 100 % full

**State**: fixed, and the working set is moving to the M2.
**Evidence**: the M4 was at 518 MiB free on 2026-10-27. Regenerable caches were trashed
(`codex-runtimes` 3.5 GB, `uv` 1.0 GB, `mobile-app-building` 689 MB, Cypress, the Kimi/ShipIt
updater caches, `ms-playwright`, Homebrew and pip caches) → 4.1 GiB free.
**Owner action**: none, but note the standing rule: the M4 holds the lane worktree only; heavy
work runs on the M2. RunPod holds 3 running CPU pods and **1.1 TB of network volume**
(`csoai-backup-ro` 800 GB, `sov-workspace-mtl4` 200 GB, `council-os-benchmark-data-20261027`
100 GB) — that is where the working set goes, not onto the M4.

## 9. Lane worktrees are not claimed — a lane's worktree can be deleted underneath it

**State**: a parallel lane's cleanup removed a live worktree mid-session.
**Evidence**: on 2026-10-27 the `lane/bench-suite` worktree directory was emptied while it was
in use; the branch and its commits survived in the shared object store and the worktree was
rebuilt with `git worktree prune` + `--no-checkout` + `sparse-checkout`, but the staged (not yet
committed) changes were lost and had to be redone.
**Owner action**: make `scripts/lane.mjs` claim a worktree before a cleanup can remove it, and
have cleanup refuse a worktree whose branch has unmerged commits.

## 10. The duplicate Kimi plugin — DECISION NEEDED

**State**: two plugins are enabled in the Kimi desktop home, both pointing at the same door.
**Evidence**: `council-os-gspc` (hand-built earlier, one skill, MIT) and `gspc` (this lane's
plugin, two skills + the MCP server). One redundant skill; no duplicate *tools*.
**Owner action**: disable the older `council-os-gspc` (reversible) or keep both. The estate's
plugin is the one validated by Kimi's own validator.

---

## Resolved since 2026-09-17

| # | Item | State | Evidence |
|---|------|-------|----------|
| 1 | RunPod SSH heartbeat | RESOLVED, differently | The old endpoint `194.26.196.156:22081` is gone. RunPod itself is healthy: 3 CPU pods running (`meok-him-production-20261027`, `council-os-benchmark-live-20261027`, `csoai-build-cpu-writer-20261001`) and 1.1 TB of network volume. |
| 2 | GitHub Actions disabled | RESOLVED | `gh workflow list` works; workflows are `active`; CI runs and reports. |
| 3 | Board signing key unreachable | RESOLVED | `~/.secrets/card-attestation-2.ed25519` and `board-sign-pod-token` are on the M2 (956 MiB RAM, 8.7 GB free), and the root publisher is producing new roots. |
| 7 | HF token org-write scope | RESOLVED | The M2's token: `whoami` → `Nicholastempleman`, org `csoai`, role **write**. It published the board twin (dataset + space) on 2026-10-27. |
| 8 | Kaggle CLI not authenticated | RESOLVED | Authenticated, and the dataset now carries **CC BY 4.0** (was CC0), with the estate's own verifier reporting `EXTERNALLY_VERIFIED` and 8 of 8 files byte-identical to HF. |
| 9 | Board re-signing | RESOLVED | The live root advanced and the board is served from the repository's bytes. |
| 4 | COSE interop key | NEVER USE | unchanged — that key is forbidden for any purpose. |
| 6 | Cloudflare zone setting | NOT THE SAME THING | `councilof.ai` serves normally; the 403s seen were `openai.com` refusing an automated client, which is their bot policy, not our zone. |
| 5 | xAI spending limit | UNVERIFIED | No xAI call was made in this cycle. |

## Where the board's surfaces stand (2026-10-27, `as_of 2026-10-26T19:19:22Z`)

| Surface | State | Where |
|---|---|---|
| Live board | LIVE | <https://councilof.ai/api/gspc> |
| Hugging Face dataset + Space | LIVE | `csoai/gspc-board` |
| Kaggle | LIVE, licence **CC BY 4.0** | `nicktempleman/csoai-gspc-living-board` |
| PyPI | LIVE | `csoai-gspc` 0.2.20261026 |
| GitHub mirror | LIVE | `CSOAI-ORG/gspc-board` |
| Zenodo | BLOCKED (#4) | 403 |
| npm | BLOCKED (#5) | WebAuthn account |
| EEE datastore | PR OPEN | <https://huggingface.co/datasets/evaleval/EEE_datastore/pull/241> |

**Until a blocker is resolved, the estate runs without it. Nothing is faked, no workaround obscures the wait.**
