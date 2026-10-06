#!/usr/bin/env bash
# ci/hf-jobs/deploy.sh — RETIRED 2026-10-06. It deploys nothing.
#
# Owner ruling, 6 Oct 2026 (SINGLE WRITER): GitHub master, shipped by
# .github/workflows/deploy.yml, is the ONLY production writer of councilof.ai.
# This script was a second route to the same Cloudflare Pages project: an HF Job
# running the workflow's build and its three `wrangler pages deploy` alias writes.
# A second writer is how production was overwritten on 28 Sep, 30 Sep and 5 Oct,
# so the route is retired rather than kept in sync. Its last working body is in
# git history (892c355cb:ci/hf-jobs/deploy.sh).
#
# To change the site: branch from GitHub master -> PR -> merge; deploy.yml ships it.
# ci/hf-jobs/steps-drift.test.mjs fails if this file ever deploys again.
echo "ci/hf-jobs/deploy.sh is retired (single-writer ruling, 6 Oct 2026): councilof.ai is deployed only by .github/workflows/deploy.yml from GitHub master." >&2
exit 3
