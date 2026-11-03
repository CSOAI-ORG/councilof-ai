#!/usr/bin/env bash
# pre-push — the estate's content gates, installed on the BUILD POD.
#
# WHY THIS EXISTS HERE. The M4's global hook lives at /Users/nicholas/.config/git/hooks and
# is reached through an ABSOLUTE core.hooksPath. The pod's repo had NO core.hooksPath and no
# hook in .git/hooks, so a push from the pod ran NO gate at all and looked exactly like a
# clean fast-forward. (The same failure shape as a relative core.hooksPath: git resolves a
# RELATIVE hooksPath against the PROCESS's working directory, not the work tree, so the hook
# can be silently not-found.)
#
# The gates were run by hand before each pod push and did pass — but "the gate was run once,
# by hand, and the person remembered" is not a gate. This installs it so every future pod
# push is gated automatically, and it FAILS CLOSED: if the safety suite cannot be found, the
# push is refused.
#
# The M4's copy also refuses to push when no suite is found. Same rule, same reason.
set -uo pipefail
export GIT_NO_LAZY_FETCH=1

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "pre-push: cannot resolve the work tree — push blocked." >&2
  exit 1
}
cd "$ROOT" || { echo "pre-push: cannot enter $ROOT — push blocked." >&2; exit 1; }

if [ -f "${ROOT}/scripts/run-meok-proxy-tests.sh" ]; then
  echo "pre-push: running MEOK MCP proxy-path tests (required)…"
  if ! bash "${ROOT}/scripts/run-meok-proxy-tests.sh"; then
    echo "pre-push: MEOK MCP proxy-path tests FAILED — push blocked." >&2
    exit 1
  fi
  echo "pre-push: MEOK MCP proxy-path tests passed"
elif [ -f "${ROOT}/scripts/pre-push-gates.sh" ]; then
  echo "pre-push: running Council content/release gates (required)…"
  if ! bash "${ROOT}/scripts/pre-push-gates.sh"; then
    echo "pre-push: Council content/release gates FAILED — push blocked." >&2
    exit 1
  fi
  echo "pre-push: Council content/release gates passed"
else
  echo "pre-push: no repository-specific safety suite found — refusing push." >&2
  exit 1
fi

exit 0
