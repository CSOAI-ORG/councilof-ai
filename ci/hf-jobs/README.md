# ci/hf-jobs — the second runner (Hugging Face Jobs)

GitHub has limited the CSOAI-ORG account's Actions (support ticket #4720908: runs die at
runner start, up to 7 business days). This directory is the insurance: the two critical
pipelines — the gated site deploy and the hourly signed public root — can run on
[Hugging Face Jobs](https://huggingface.co/docs/hub/jobs) under the `csoai` org.

**It is not a new pipeline.** `deploy.sh` is `.github/workflows/deploy.yml`; `public-root.sh`
is `.github/workflows/public-root.yml`. Same scripts, same gates, same order, same outputs.
`steps-drift.test.mjs` (runs under `npm test`) fails if a named step is added to a workflow
and not to its shell twin, if the prerender command or the three `wrangler pages deploy`
alias writes change on one side only, or if the runner image's Playwright tag drifts from
`package-lock.json`.

| file | what |
|---|---|
| `deploy.sh <source> [ref]` | deploy.yml: guards → build → prerender → 9 gates → `wrangler pages deploy` ×3 → apex assert / recheck / anti-clobber / hold |
| `public-root.sh <source> [ref]` | public-root.yml: `publish_public_root.py` → `witness_public_root.py` → `eas_attest_root.mjs` → commit + push to master (halt-health on failure) |
| `lib.sh` | step ledger, fail-closed helpers, source resolution (git URL → bundle → HF mirror fallback), token-free git credential helper |
| `Dockerfile` + `bootstrap.sh` | the `csoai/ci-runner` image (Playwright base + Python 3.11 + wrangler + git) |
| `space-card.md` | README front-matter for the Docker Space that builds that image |
| `mirror-refresh.sh` | refresh the private git-bundle mirror `csoai/councilof-ai-mirror` |
| `steps-drift.test.mjs` | the drift guard between the two runners |

## What runs where

| pipeline | GitHub (primary) | HF Jobs (insurance) |
|---|---|---|
| site deploy | `deploy.yml` on push / 3-hourly cron | `hf jobs run … deploy.sh` on demand (no schedule — two writers racing the Pages alias is the clobber the workflow already fights) |
| public root | `public-root.yml` hourly (`7 * * * *`) | `hf jobs scheduled run "7 * * * *" … public-root.sh`, `--no-concurrency` (= the workflow's `concurrency` group) |
| site host | Cloudflare Pages project `councilof-ai` | same project, same `wrangler` commands, same three aliases (`master`, `main`, `production`) |
| source | GitHub checkout | GitHub clone over HTTPS (private repo → `GIT_PUSH_TOKEN`), or the HF mirror bundle when GitHub is unreachable |

Doctrine kept: never a bare `vite build` (it is `npm run build:client`); the prerender is
`bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350`, lane-safe as
written; `wrangler pages deploy` runs from a hosted job, never a laptop; the root job never
prerenders and never runs wrangler; a missing `BOARD_SIGN_KEY_PKCS8_B64` halts with exit 3
and publishes nothing new; no secret is ever printed (presence + length only).

## The image — and why

HF Jobs run an **existing** container image; a job cannot build a Dockerfile, and there is no
Docker on this Mac nor a working GitHub Actions to build one. The HF-native build path is a
**Docker Space**: HF builds `Dockerfile` on its own infra and the result is pullable as
`hf.co/spaces/csoai/ci-runner`. The base is `mcr.microsoft.com/playwright:v<lock>-noble`
(Ubuntu 24.04, Node 22, Chromium + all system deps at the exact Playwright version
`package-lock.json` pins, so the prerender's `npx playwright install --with-deps chromium`
is a no-op instead of a download). `bootstrap.sh` adds git, a CPython 3.11 venv
(`public-root.yml` pins 3.11; noble ships 3.12), `cryptography`, `opentimestamps-client`,
`wrangler@4`, and the `hf` CLI. A `hf jobs uv run` script cannot do this: the deploy needs
Node and a browser, not Python.

Until the Space exists you can run on the bare Playwright image and bootstrap at job start
(adds ~2 min; see the fallback command below). Node is 22 here vs `setup-node 20` on GHA;
`engines` is `>=20` and `deploy.sh` refuses anything below 20.

### One-time: build the image (owner, once)

```bash
hf repos create csoai/ci-runner --type space --space-sdk docker --private
hf upload csoai/ci-runner ci/hf-jobs/Dockerfile Dockerfile --repo-type space
hf upload csoai/ci-runner ci/hf-jobs/bootstrap.sh bootstrap.sh --repo-type space
hf upload csoai/ci-runner ci/hf-jobs/space-card.md README.md --repo-type space
# wait for the Space build to show "Running" (free CPU tier; it serves a tool-version page on :7860)
```

Rebuild whenever `package-lock.json` bumps `playwright` (the test tells you) — bump the
`FROM` tag and re-upload.

## Secrets the owner must add on HF — same names as GitHub

HF Jobs have **no server-side secret vault**. Secrets are bound to a job or a schedule at
creation time (`--secrets NAME=value` or `--secrets-file .env.secrets`), encrypted server-side
and stored with that job/schedule. The value therefore transits the shell that creates the
job. **Create jobs from a hosted shell (a pod, K3, an HF Job), never from a laptop** — the
board key must not touch a laptop, and a `.env.secrets` file is the one artefact to shred
afterwards.

| secret | used by | GitHub name | note |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy | same | Pages deploy on project `councilof-ai` |
| `CLOUDFLARE_ACCOUNT_ID` | deploy | same | |
| `BOARD_SIGN_KEY_PKCS8_B64` | public-root | same | **the board key — see custody below** |
| `HF_TOKEN` | both | same | private-mirror download; exported as `HUGGING_FACE_HUB_TOKEN` too |
| `GIT_PUSH_TOKEN` | public-root (required), deploy (read of the private repo) | new on both sides | fine-grained PAT, `contents: write` on `CSOAI-ORG/councilof-ai` only; a clone is HTTPS with a credential helper, the token never enters a URL or a log |
| `EAS_ATTESTER_PRIVATE_KEY`, `BASE_RPC_URL` | public-root | same | optional; EAS step records "did not attest" honestly without them |
| `HUGGINGFACE_TOKEN`, `HF_INFERENCE_TOKEN` | public-root | same | optional pass-through |

### Key custody — the honest note

`public-root.yml` today signs with either the GitHub secret `BOARD_SIGN_KEY_PKCS8_B64` or the
GitHub-OIDC relay to Pages `/api/board-sign`. HF Jobs have no GitHub OIDC, so on HF **the
PKCS8 key is the only signer path**. Putting it on an HF schedule makes Hugging Face a
**second key-custody location** alongside GitHub Secrets (which cannot be read back out, so
the key must be re-entered from wherever the owner keeps the original). That is the owner's
decision, not this lane's. If it is a no: run the deploy lane only and leave the root job to
GitHub — a stalled root is honest ("halt health"), an unsigned root is not. A cleaner future
is an HF-Job-identity relay into `/api/board-sign`, but that is a new signer path and needs
its own ruling.

## Commands

All from a hosted shell with `hf auth login` as a member with write on `csoai`.
`--namespace csoai` bills the org and keeps the jobs visible to the org.

### Deploy — on demand

```bash
# from the pre-built image (recommended)
hf jobs run --namespace csoai --flavor cpu-upgrade --timeout 45m \
  --secrets-file .env.secrets \
  hf.co/spaces/csoai/ci-runner \
  bash -lc 'git -c credential.helper="!f(){ echo username=x-access-token; echo password=\$GIT_PUSH_TOKEN; }; f" \
              clone -q https://github.com/CSOAI-ORG/councilof-ai.git /w \
            && cd /w && bash ci/hf-jobs/deploy.sh /w master'
```

`.env.secrets` for the deploy: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`GIT_PUSH_TOKEN`, `HF_TOKEN`. The wrapper clone gets `ci/hf-jobs/` into the container via a
credential helper (the token never enters a URL, a log, or `.git/config`); `deploy.sh` then
clones `/w` at the requested ref and re-points `origin` at GitHub. Pass the GitHub URL as
`<source>` instead if you want the script itself to prove GitHub is reachable (and fall back
to the mirror if not).

GitHub unreachable? Mount the mirror and point the script at it — no git token needed:

```bash
hf jobs run --namespace csoai --flavor cpu-upgrade --timeout 45m \
  --secrets CLOUDFLARE_API_TOKEN=… --secrets CLOUDFLARE_ACCOUNT_ID=… --secrets HF_TOKEN \
  -v hf://datasets/csoai/councilof-ai-mirror:/mirror:ro \
  hf.co/spaces/csoai/ci-runner \
  bash -lc 'git init -q /w && git -C /w fetch -q $(ls -1t /mirror/*.bundle | head -1) "+refs/*:refs/bundle/*" \
            && git -C /w checkout -q --detach refs/bundle/heads/master 2>/dev/null || git -C /w checkout -q --detach refs/bundle/remotes/origin/master; \
            cd /w && bash ci/hf-jobs/deploy.sh /mirror master'
```

Fallback with no Space yet (bare Playwright image, bootstrap at start, add ~2 min):

```bash
hf jobs run --namespace csoai --flavor cpu-upgrade --timeout 60m --secrets-file .env.secrets \
  mcr.microsoft.com/playwright:v1.61.1-noble \
  bash -lc 'git -c credential.helper="!f(){ echo username=x-access-token; echo password=\$GIT_PUSH_TOKEN; }; f" \
              clone -q https://github.com/CSOAI-ORG/councilof-ai.git /w \
            && bash /w/ci/hf-jobs/bootstrap.sh && export PATH=/opt/py311/bin:$PATH \
            && bash /w/ci/hf-jobs/deploy.sh /w master'
```

### Public root — hourly

```bash
hf jobs scheduled run "7 * * * *" --namespace csoai --flavor cpu-basic --timeout 15m --no-concurrency \
  --secrets-file .env.secrets \
  hf.co/spaces/csoai/ci-runner \
  bash -lc 'git -c credential.helper="!f(){ echo username=x-access-token; echo password=\$GIT_PUSH_TOKEN; }; f" \
              clone -q https://github.com/CSOAI-ORG/councilof-ai.git /w \
            && cd /w && PATH=/opt/py311/bin:$PATH bash ci/hf-jobs/public-root.sh /w master'
hf jobs scheduled ps --namespace csoai            # note the id
hf jobs scheduled suspend <id>                    # the moment GitHub Actions is restored — one writer
hf jobs scheduled trigger <id>                    # run it now
```

`.env.secrets` for the root: `BOARD_SIGN_KEY_PKCS8_B64`, `GIT_PUSH_TOKEN`, `HF_TOKEN`,
optionally `EAS_ATTESTER_PRIVATE_KEY`, `BASE_RPC_URL`. The root job clones GitHub only — the
mirror is deliberately not a fallback here, because a root computed on a stale snapshot must
never be pushed (the push would be rejected as non-fast-forward anyway; it fails closed).

### Dry runs (nothing deployed, nothing pushed)

```bash
DRY_RUN=1 bash ci/hf-jobs/deploy.sh      https://github.com/CSOAI-ORG/councilof-ai.git master   # every gate, no upload
DRY_RUN=1 bash ci/hf-jobs/public-root.sh https://github.com/CSOAI-ORG/councilof-ai.git master   # = workflow_dispatch dry_run=true
```

Same on HF: add `-e DRY_RUN=1` to either `hf jobs run` above (secrets are then optional).

### Watch a run

```bash
hf jobs ps --namespace csoai
hf jobs logs <job_id>
hf jobs inspect <job_id>
```

### Mirror — refresh and restore

```bash
bash ci/hf-jobs/mirror-refresh.sh              # bundles origin/master → hf://datasets/csoai/councilof-ai-mirror
# restore anywhere:
hf download csoai/councilof-ai-mirror --repo-type dataset --local-dir m --include '*.bundle'
git init repo && git -C repo fetch "$(ls -1t m/*.bundle | head -1)" '+refs/*:refs/bundle/*'
git -C repo checkout --detach refs/bundle/remotes/origin/master   # bundles made with --all use refs/bundle/heads/master
```

The dataset currently holds `councilof-ai-mirror-20260902.bundle` (private). A bundle is a
snapshot; refresh it after every merge you would want to be able to deploy without GitHub.

## Cost per run

Prices from `hf jobs hardware` (2026-09-02) and
[Jobs pricing](https://huggingface.co/docs/hub/jobs-pricing): billed per minute while
Starting/Running, image build time is free, a failing job is suspended and stops billing.
Jobs need a positive credit balance on the org (PRO/Team/Enterprise monthly credits count).

| flavor | spec | $/h | deploy (~30 min prerender + gates) | root (~3 min) |
|---|---|---|---|---|
| `cpu-basic` (default) | 2 vCPU · 16 GB | $0.01 | ~$0.007 (may need the 60 m timeout: half the cores of a GHA runner) | ~$0.0005 → **≈ $0.36 / month hourly** |
| `cpu-upgrade` (recommended for deploy) | 8 vCPU · 32 GB | $0.03 | **≈ $0.015** | ~$0.0015 |
| `cpu-xl` | 16 vCPU · 124 GB | $1.00 | ~$0.50 — not needed | |

GHA `ubuntu-latest` is 4 vCPU / 16 GB and the prerender takes ~20 min there; `cpu-upgrade`
is the safe like-for-like. The whole insurance costs cents per day.

## What was and was not tested here

- **Could:** `bash -n` on every script; `npx vitest run ci/hf-jobs` — 7/7 green (step lists,
  prerender command, wrangler triple, gate scripts, Dockerfile tag, no-secret-echo);
  `DRY_RUN=1 public-root.sh` end-to-end on this Mac: adapters ran, `HALT-ON-MISSING-KEY`
  fail-closed with exit 3, the four later steps skipped exactly as `if: success()` would;
  `DRY_RUN=1 deploy.sh` on this Mac against this branch: steps 1–6 green (one-door,
  conflict markers, redirects guard, size guard, install deps, `npm run build:client`); step 7
  (`prerender-run.sh --dist dist/client --wait 900 --min 350`) reached 526 routes rendered
  with 0 errors and was then **stopped for time** (own run only, via the wrapper's scoped
  cleanup). Steps 8–15 (check-prerender and the six dist gates) were therefore not executed
  locally — they are covered by `bash -n`, the drift test, and being the workflow's own
  one-line commands verbatim. Source resolution was exercised separately with fixtures:
  both bundle styles, a directory of bundles, a local path (origin re-pointed to GitHub),
  a dead URL falling back to the mirror, a raw SHA, and a bad ref failing closed.
- **Could not:** run the container. Docker is not installed on this Mac (`docker info`
  absent) and shellcheck is not installed, so `bootstrap.sh`/`Dockerfile` are validated by
  syntax and by reading, not by a build. No HF Job was launched: that bills the org, so it is
  the owner's first command. Suggested smoke, cents: the deploy fallback command above with
  `-e DRY_RUN=1` and no `.env.secrets`.
- **Not exercised:** the private-mirror volume mount (`-v hf://datasets/...`) on a private
  dataset — documented per the Jobs guide; confirm with the smoke run.
