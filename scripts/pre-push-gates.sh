#!/bin/bash
# The two CONTENT gates, run before a push instead of 12 minutes into a deploy.
#
# WHY. On 2026-09-03 four consecutive deploys failed, every one on content, none
# on infrastructure:
#
#   08:12  brand-gate  "crown jewels" — an internal codename in a public grant page
#   08:21  facts-gate  present-tense OTS anchoring claim
#   08:30  facts-gate  same
#   08:40  facts-gate  anchor-count claims ("THE 4 ANCHORS")
#
# Each cost ~12 minutes of build to discover, and three lanes spent the morning
# negotiating silence over a queue that was never actually starved — a run
# completed every ~9 minutes throughout. The queue was fine. The feedback loop
# was the problem: these same two gates take ONE SECOND here.
#
#   brand-gate over public/   1s
#   facts-gate over public/   0s
#   facts-gate --selftest     0s
#
# Install as a pre-push hook:
#     ln -sf ../../scripts/pre-push-gates.sh .git/hooks/pre-push
# Bypass for a genuine emergency:
#     git push --no-verify
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1

fail=0
echo "pre-push: content gates (the ones that fail deploys) …"

# The gate must be provably working before its verdict means anything — a gate
# that has never gone red proves nothing about the tree it just passed.
node scripts/facts-gate.mjs --selftest >/dev/null 2>&1 \
  || { echo "  ✖ facts-gate SELFTEST failed — the gate itself is broken"; fail=1; }

node scripts/facts-gate.mjs public 2>&1 | tail -40 | grep -qE "^facts-gate OK" \
  || { echo "  ✖ facts-gate: a claim in public/ contradicts facts.json"; \
       node scripts/facts-gate.mjs public 2>&1 | grep -E "FILE|TEXT|WHY" | head -12; fail=1; }

node scripts/brand-gate.mjs public >/dev/null 2>&1 \
  || { echo "  ✖ brand-gate: a forbidden display string is in public/"; \
       node scripts/brand-gate.mjs public 2>&1 | tail -8; fail=1; }

if [ "$fail" -ne 0 ]; then
  echo
  echo "  Push blocked. These are the same gates that will fail the deploy in ~12"
  echo "  minutes; fixing them now costs seconds. Remember the claim usually lives"
  echo "  in TWO places — the artifact and the generator that emits it."
  echo "  Emergency bypass: git push --no-verify"
  exit 1
fi
echo "  ✓ facts-gate + brand-gate clean"
exit 0
