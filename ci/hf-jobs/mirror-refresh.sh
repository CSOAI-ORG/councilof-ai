#!/usr/bin/env bash
# ci/hf-jobs/mirror-refresh.sh — RETIRED 2026-11-21. It uploads nothing.
#
# It bundled origin/master and uploaded the bundle to the Hugging Face dataset
# csoai/councilof-ai-mirror, a read-only backup of this repository. That dataset was deleted on
# 21 Nov 2026, and `hf upload` would create a new dataset under the same name, so the script is a
# stub that refuses to run rather than a target that can be swapped. Its last working body is in
# git history (961349b693eb:ci/hf-jobs/mirror-refresh.sh).
#
# There is no bundle mirror now; the repository is cloned from GitHub. A new backup target is an
# owner decision, made outside this script.
# ci/hf-jobs/steps-drift.test.mjs fails if this file ever uploads, bundles or runs git again.
echo "ci/hf-jobs/mirror-refresh.sh is retired (21 Nov 2026): its target, the Hugging Face dataset csoai/councilof-ai-mirror, was deleted, and this script does not re-create it." >&2
exit 3
