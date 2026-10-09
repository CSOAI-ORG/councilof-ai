# CSOAI production-path audit — 21 September 2026

**Scope:** read-only source and deployment-path audit for the three prepared Council of AI patches. No checkout, reset, installation, push, merge, deployment, or Cloudflare change was performed.

## Decision

There is a **defined controlled production route**, but there is **no clean, ready-to-publish working copy on this Mac**.

The current direct-publisher checkout must not be used as the release source. It contains 99 working-tree changes, including generated and evidence files, plus a pre-existing `.direct-release-validation.json`. Its validator hashes whatever bytes happen to be present; it does not require a clean Git tree or prove that the bytes derive from a reviewed source revision.

The safe route is to create a fresh release checkout from the verified remote `master`, apply only the three focused commits, run their tests plus the normal release gates, then use the normal GitHub Actions path when source access is restored. A direct Cloudflare release is an owner-only fallback after the same clean-source and validation gates.

## Controlled Council of AI source and target

| Item | Verified state |
|---|---|
| Canonical source repository | `https://github.com/CSOAI-ORG/councilof-ai.git` |
| Remote `master` observed through Git | `043c8c432d1d984416b973fd6e652d02e4b60bbd` |
| GitHub REST visibility | `404 Not Found` at audit time; this does not invalidate the authenticated Git read, but it prevents treating the web/API surface as an available review or Actions control path. |
| Production workflow | `.github/workflows/deploy.yml`, named **Build + deploy site (gated production branch)** |
| Workflow trigger | Push to `master` for `client/**`, `public/**`, `functions/**`, `scripts/**`, `package.json`, `wrangler.jsonc`, or the workflow file itself. |
| Pages project | `councilof-ai` |
| Canonical domain / production alias | `https://councilof.ai` and `https://councilof-ai.pages.dev` |
| Deployment branch | `master` only, after a read-only target/binding preflight. |
| Configuration source | `wrangler.jsonc` in the same repository, with `pages_build_output_dir: ./dist/client`. |
| Current public probe at `2026-09-21T17:59:47Z` | `councilof.ai` 200 / 258,731 bytes; `councilof-ai.pages.dev` 200 / 258,463 bytes. This establishes reachability only, not that either response contains the pending patches. |

`DEPLOY-LOCK.md` in the source repository specifies GitHub Actions on `master` as the normal writer. It prohibits ordinary direct `wrangler pages deploy` calls because an ungated upload previously replaced the prerendered trust surface. The workflow runs source, evidence, sitemap, redirect, size, build, prerender, dashboard-shell, structured-data, link, content, signed-JSON, well-known, price, facts, Pages-target, and post-upload readback gates before it can be considered released.

The workflow’s final write is explicitly:

```sh
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=master --commit-dirty=true
```

That command belongs to the gated workflow. It is not a standalone release instruction.

## Why nearby copies are not release sources

| Location | State | Release conclusion |
|---|---|---|
| `/Users/nicholas/clawd/councilof-ai-work` | Remote points to the canonical source, but it is on `fix/deploy-trigger-coupling` at `3dfb20e…` with 1,200 working-tree entries. | Do not build, commit, or deploy from it. |
| `/Users/nicholas/clawd/council-direct-publisher-20260920` | `release-20260920` at `043c8c…`, but `origin` is only the local dirty worktree, not the verified GitHub remote. It has 99 working-tree entries and a pre-existing validation receipt. | Not a clean baseline; do not validate or publish from it. |
| `/Users/nicholas/clawd/csoai-site-work` | Separate `CSOAI-ORG/csoai-static-deploy2` repository at `f8b287a…`, with 14 untracked entries. | This is the static `csoai.org` estate, not the Council of AI Functions/application source. Do not use it for `councilof.ai`. |
| `/Users/nicholas/_release/csoai-evidence-spine-20260919` | Separate release branch at `89340b…` with untracked `node_modules`. | Not a verified remote-`master` release baseline. |

The new public GitHub account and its profile/evidence repositories are public continuity records. They are not the `councilof.ai` application source and do not grant production deployment authority.

## Three prepared patches

All three commits are clean worktrees. They share merge base `3ffcb2ad4672fc4811c005e14edc18d87bbfbec5` with the observed remote `master`. The source paths touched by each patch are unchanged between that merge base and `043c8c…`; each patch passes `git diff --check`; and a read-only `git merge-tree --quiet origin/master <commit>` returned exit code 0 for each. This establishes a strong candidate for clean application, not a completed integration.

| Commit | Purpose | Touched source class | Candidate application result |
|---|---|---|---|
| `cbe0bc971758afa12640c704d34d572e32c5a564` | Footer and organization metadata link to the new public GitHub profile and evidence mirror. | `client/` and focused Node tests | Candidate clean apply. |
| `a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5` | Correct feed self-link and MCP discovery wording/state. | `functions/` and focused Vitest tests | Candidate clean apply. |
| `7e2d5646a1061f671d95fbc0cb5bf2ff27f7ea39` | Record a local mill-status receipt without dispatching, publishing, signing, or SSH actions. | New `scripts/` files and Python tests | Candidate clean apply. |

The first two affect served application behavior only after a successful gated deployment. The third affects local receipt generation and does not itself sign, anchor, publish, or make the worker current.

## Exact safe integration sequence

Run these only in a new empty release directory after confirming enough disk space and source-access authority. Do not substitute an existing worktree.

```sh
export RELEASE_DIR="$HOME/clawd/_release/councilof-ai-clean-20260921"
git clone --branch master https://github.com/CSOAI-ORG/councilof-ai.git "$RELEASE_DIR"
git -C "$RELEASE_DIR" status --short
git -C "$RELEASE_DIR" rev-parse HEAD
git -C "$RELEASE_DIR" ls-remote origin refs/heads/master
```

Proceed only when the status is empty and the checkout SHA equals the remote `master` SHA. Then create reviewable patch files from the three existing clean worktrees and apply them to the fresh checkout:

```sh
mkdir -p "$RELEASE_DIR/patches"
git -C "$HOME/clawd/wt-footer-public-source-mirror-20260921" format-patch -1 --stdout cbe0bc971758afa12640c704d34d572e32c5a564 > "$RELEASE_DIR/patches/01-footer-public-source-mirror.patch"
git -C "$HOME/clawd/wt-feed-mcp-public-pointer-20260921" format-patch -1 --stdout a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5 > "$RELEASE_DIR/patches/02-feed-mcp-public-pointer.patch"
git -C "$HOME/clawd/wt-mill-local-receipt-20260921" format-patch -1 --stdout 7e2d5646a1061f671d95fbc0cb5bf2ff27f7ea39 > "$RELEASE_DIR/patches/03-mill-local-receipt.patch"
git -C "$RELEASE_DIR" am --3way patches/01-footer-public-source-mirror.patch patches/02-feed-mcp-public-pointer.patch patches/03-mill-local-receipt.patch
```

If `git am` stops, use only this rollback in the new checkout and retain the conflict output for review:

```sh
git -C "$RELEASE_DIR" am --abort
```

Before creating a review branch or requesting a merge, run the focused checks in the fresh checkout:

```sh
node --test client/index.publicGithubProfile.node-test.mjs client/src/components/Footer.publicSourceMirror.node-test.mjs
npx vitest run functions/api/feed.xml.test.ts functions/mcp/mcp-discovery.test.ts
python3 scripts/test_record_mill_signing_status.py
git diff --check origin/master...HEAD
git status --short
```

Then run the repository’s normal PR/release gates from the fresh checkout. The production action remains: reviewed branch → PR → owner merge to `master` → GitHub Actions deployment → apex and production-alias readback immediately and after the trailing-clobber window.

## Owner-only fallback if GitHub Actions cannot run

A direct publication can be made safe only after an owner creates a clean direct-publisher root from the fresh release checkout above, preserves the exact applied commit list, builds the site, and inspects the validation receipt before any upload. The current `council-direct-publisher-20260920` directory fails the clean-source prerequisite and must not be reused.

The fallback requires all of the following before publishing:

1. An explicit owner decision to use the direct path for this exact clean source revision.
2. Empty tracked and untracked Git status except known ignored build artifacts.
3. Successful focused checks and full validator output.
4. A newly generated `.direct-release-validation.json` whose inventory matches the release tree.
5. Cloudflare production-target preflight proving project `councilof-ai` and branch `master`.
6. Immediate and delayed reads of both `councilof.ai` and `councilof-ai.pages.dev`, plus the existing live root-witness check.

Until those conditions are met, direct publishing remains blocked. No direct deployment was attempted during this audit.
