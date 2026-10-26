#!/usr/bin/env bash
# ci/hf-jobs/public-root.sh — RETIRED 2026-10-06. It publishes nothing.
#
# Owner ruling, 6 Oct 2026 (SINGLE WRITER): GitHub master is the ONLY production writer of
# councilof.ai and changes only through a gated pull request; .github/workflows/deploy.yml ships it.
# This script was a second route to master: a Hugging Face Job that ran public-root.yml's steps,
# signed with a copy of the board key held on HF (a second key-custody location), and ran
# `git push origin HEAD:master` with a PAT. A second master writer is what the ruling ends,
# so the route is retired rather than kept in sync. Its last working body is in git history
# (268dada7:ci/hf-jobs/public-root.sh).
#
# The public root is produced by .github/workflows/public-root.yml only: it signs through the
# GitHub-OIDC relay to /api/board-sign, witnesses the exact bytes, runs the release gate and banks
# the signed tree on public-root/pending behind one pull request.
# ci/hf-jobs/steps-drift.test.mjs fails if this file ever signs, pushes or publishes again.
echo "ci/hf-jobs/public-root.sh is retired (single-writer ruling, 6 Oct 2026): the public root is produced only by .github/workflows/public-root.yml, which opens a pull request to GitHub master and never pushes it." >&2
exit 3
