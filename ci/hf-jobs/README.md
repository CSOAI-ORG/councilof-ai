# ci/hf-jobs — the retired second runner (Hugging Face Jobs)

> **Both HF Jobs runners are RETIRED (6 Oct 2026).** Owner ruling, 6 Oct 2026 (SINGLE WRITER, top of
> CLAUDE.md and _alignment/ALIGNMENT_2026-10-06.md): GitHub master is the ONLY production writer of
> councilof.ai and changes only through a gated pull request; .github/workflows/deploy.yml ships it.
> - `deploy.sh` is a stub that refuses to run (exit 3); its old body is at `892c355cb`.
> - `public-root.sh` is a stub that refuses to run (exit 3); its old body is at `268dada7`. It was a
>   second master writer: it signed with an HF-held copy of the board key and pushed master with a PAT.
>
> Nothing here may deploy councilof.ai or write master. What remains: the image and the mirror tools.

GitHub limited the CSOAI-ORG account's Actions in September 2026 (support ticket #4720908: runs died
at runner start). This directory was the insurance: the site deploy and the hourly signed public root
could run on [Hugging Face Jobs](https://huggingface.co/docs/hub/jobs) under the `csoai` org. Under the
single-writer ruling an insurance writer is a second writer, so both routes are retired. The public root
is produced only by `.github/workflows/public-root.yml`: it signs through the GitHub-OIDC relay to
`/api/board-sign`, witnesses the exact bytes, runs the release gate and banks the signed tree on
`public-root/pending` behind one pull request. A stalled root is honest (the run goes red and keeps its
halt health as an artifact); a root from a second writer is not.

| file | what |
|---|---|
| `deploy.sh` | **RETIRED 2026-10-06** (single-writer ruling). A stub that refuses to run; it was deploy.yml as an HF Job |
| `public-root.sh` | **RETIRED 2026-10-06** (single-writer ruling). A stub that refuses to run; it was public-root.yml as an HF Job that pushed master |
| `lib.sh` | step ledger, fail-closed helpers, source resolution, token-free git credential helper; sourced by no runner since 6 Oct 2026 |
| `Dockerfile` + `bootstrap.sh` | the `csoai/ci-runner` image (Playwright base + Python 3.11 + wrangler + git) |
| `space-card.md` | README front-matter for the Docker Space that builds that image |
| `mirror-refresh.sh` | refresh the private git-bundle mirror `csoai/councilof-ai-mirror` (a read-only backup) |
| `steps-drift.test.mjs` | pins that both runners stay retired, the image tag, and no-secret-echo |

## What runs where

| pipeline | GitHub (the only writer) | HF Jobs |
|---|---|---|
| site deploy | `deploy.yml` from GitHub master | **none** — retired 2026-10-06 |
| public root | `public-root.yml` hourly (`7 * * * *`) → PR from `public-root/pending`; `public-root-candidate-upgrade.yml` promotes it after Bitcoin confirmation | **none** — retired 2026-10-06 |
| mirror | — | `mirror-refresh.sh`, read-only bundles |

### If an HF schedule for the root was ever created

Suspend and delete it from a hosted shell (`hf jobs scheduled ps --namespace csoai`, then
`hf jobs scheduled suspend <id>` and `hf jobs scheduled delete <id>`), and delete the HF-held copies of
`BOARD_SIGN_KEY_PKCS8_B64` and `GIT_PUSH_TOKEN` with it; revoke that PAT on GitHub. A schedule left in
place now runs the stub from GitHub master and exits 3, so it can no longer write, but it still holds
the key.

## The image (kept; no runner uses it now)

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

Both runners that used this image are retired, so nothing needs it to exist. It is kept because
the drift test still pins its Playwright tag; delete it with its test if it is never wanted again.

### Build the image (only if a future, ruled use needs it)

```bash
hf repos create csoai/ci-runner --type space --space-sdk docker --private
hf upload csoai/ci-runner ci/hf-jobs/Dockerfile Dockerfile --repo-type space
hf upload csoai/ci-runner ci/hf-jobs/bootstrap.sh bootstrap.sh --repo-type space
hf upload csoai/ci-runner ci/hf-jobs/space-card.md README.md --repo-type space
# wait for the Space build to show "Running" (free CPU tier; it serves a tool-version page on :7860)
```

Rebuild whenever `package-lock.json` bumps `playwright` (the test tells you) — bump the
`FROM` tag and re-upload.

## Mirror — refresh and restore (read-only backup)

```bash
bash ci/hf-jobs/mirror-refresh.sh              # bundles origin/master → hf://datasets/csoai/councilof-ai-mirror
# restore anywhere:
hf download csoai/councilof-ai-mirror --repo-type dataset --local-dir m --include '*.bundle'
git init repo && git -C repo fetch "$(ls -1t m/*.bundle | head -1)" '+refs/*:refs/bundle/*'
git -C repo checkout --detach refs/bundle/remotes/origin/master   # bundles made with --all use refs/bundle/heads/master
```

The dataset currently holds `councilof-ai-mirror-20260902.bundle` (private). A bundle is a
snapshot; refresh it after every merge you would want to be able to deploy without GitHub.

## What was and was not tested here (2 Sep 2026, before retirement; kept as history)

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
