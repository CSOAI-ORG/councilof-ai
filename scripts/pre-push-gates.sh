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

# Keep the gate's own words. With its output discarded, a gate that CRASHED
# (ENOENT in a sparse worktree, 2026-09-05) was announced here as "wallet
# credential material is tracked" — a finding it never made. A crash and a
# finding are different verdicts; print what the gate actually said.
wallet_out=$(node scripts/wallet-credential-gate.mjs --selftest 2>&1 \
  && node scripts/wallet-credential-gate.mjs 2>&1) \
  || { echo "  ✖ wallet-credential-gate failed — its verdict:"; printf '%s\n' "$wallet_out" | tail -8 | sed 's/^/      /'; fail=1; }

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

# ADDED 2026-09-05. price-gate joined the deploy as a blocking step and immediately
# stopped one: 60 published_price findings, every one of them a NUMBER in a public
# JSON file (.well-known/*, interop/x402-*), none in HTML. That is the machine
# surface an agent reads without a human ever seeing the page, which is why the
# doctrine treats it as the worse place to print a price, not the safer one.
# --json-only is the half that needs no dist, so it runs here in a second.
node scripts/price-gate.mjs --selftest >/dev/null 2>&1 \
  || { echo "  ✖ price-gate SELFTEST failed — the gate itself is broken"; fail=1; }

node scripts/price-gate.mjs --json-only >/dev/null 2>&1 \
  || { echo "  ✖ price-gate: a published price is in public/ JSON (no public $ prices)"; \
       node scripts/price-gate.mjs --json-only 2>&1 | grep -E "^\s+\S+\.json:" | head -12; fail=1; }

if [ "$fail" -ne 0 ]; then
  echo
  echo "  Push blocked. These are the same gates that will fail the deploy in ~12"
  echo "  minutes; fixing them now costs seconds. Remember the claim usually lives"
  echo "  in TWO places — the artifact and the generator that emits it."
  echo "  Emergency bypass: git push --no-verify"
  exit 1
fi
echo "  ✓ wallet-credential-gate + facts-gate + brand-gate + price-gate clean"
exit 0
