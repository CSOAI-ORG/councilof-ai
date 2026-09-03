#!/usr/bin/env bash
# agent-preflight.sh — run this BEFORE you push, and BEFORE you claim green.
#
# Every check here exists because it failed on 2–3 September 2026. This is not
# a style gate; it is a list of things that actually shipped broken.
#
#   usage:  bash scripts/agent-preflight.sh [--staged]
#   exit 0  safe to push        exit 1  do not push
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
FAIL=0
say() { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()  { printf "  \033[32mOK\033[0m   %s\n" "$1"; }
bad() { printf "  \033[31mFAIL\033[0m %s\n" "$1"; FAIL=1; }

say "1. The build — NOT the test suite"
# vitest passed 939/939 for ~18h while build:client was broken and production
# was stale. A green suite is not a shippable master. Build, every time.
if npm run build:client >/tmp/preflight-build.log 2>&1; then
  ok "build:client succeeded"
else
  bad "build:client FAILED — production cannot deploy. See /tmp/preflight-build.log"
  grep -E "ERROR|error during" /tmp/preflight-build.log | head -3 | sed 's/^/       /'
fi

say "2. Cloudflare Functions parse"
# functions/api/corrections.ts had prose pasted in place of an object header and
# could not build; the live ledger was only healthy because it served a stale build.
for f in functions/api/*.ts; do
  npx esbuild "$f" --outfile=/dev/null >/dev/null 2>&1 || bad "does not parse: $f"
done
[ "$FAIL" = 0 ] && ok "all functions/api/*.ts parse"

say "3. No auto-generated filler on the public estate"
# The empty-page "fixer" overwrote 9 files under 1KB — seven were /interop/
# evidence surfaces, one was the "not a GPAI signatory" disclaimer. Size is not
# a defect signal: a meta-refresh page is ~580 bytes BY DESIGN.
STUBS=$(grep -rl "Auto-generated stub" public --include="*.html" 2>/dev/null | wc -l | tr -d ' ')
[ "$STUBS" = "0" ] && ok "no auto-generated stubs" || bad "$STUBS page(s) are auto-generated filler"

say "4. Nothing shrank"
# A file getting much smaller is almost always destruction, not a fix.
BASE=$(git merge-base HEAD origin/master 2>/dev/null || echo HEAD)
SHRUNK=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  case "$f" in public/*|client/src/*) ;; *) continue ;; esac
  old=$(git show "$BASE:$f" 2>/dev/null | wc -c | tr -d ' '); old=${old:-0}
  new=$(wc -c < "$f" | tr -d ' ')
  if [ "$old" -gt 400 ] && [ "$new" -lt $((old / 2)) ]; then
    bad "shrank >50%: $f ($old -> $new bytes) — is this a fix or a deletion?"
    SHRUNK=1
  fi
done < <(git diff --name-only "$BASE" 2>/dev/null)
[ "$SHRUNK" = 0 ] && ok "no file lost more than half its bytes"

say "5. Doctrine"
# 153 public repos carried a green "EU AI Act: Compliant" badge linking to
# councilof.ai — a conformity claim pointing at our own measurement body.
if grep -rn "EU%20AI%20Act-Compliant\|badge/Compliant" --include="*.md" --include="*.html" . 2>/dev/null | grep -v node_modules | grep -q .; then
  bad "a 'Compliant' badge is back. We measure; we never certify."
else
  ok "no conformity-mark badges"
fi
node scripts/brand-gate.mjs dist/client >/dev/null 2>&1 && ok "brand-gate passes" || bad "brand-gate FAILED"

say "6. Signed bytes untouched"
# A signed artefact edited in place is a broken signature. Supersede, never edit.
if git diff --name-only "$BASE" 2>/dev/null | grep -qE "public/signed/.*\.json$|\.signed\.json$"; then
  bad "a signed JSON changed. Signed bytes are SUPERSEDED, never edited."
  git diff --name-only "$BASE" | grep -E "public/signed/.*\.json$|\.signed\.json$" | sed 's/^/       /'
else
  ok "no signed artefact modified"
fi

say "7. Tests"
npx vitest run >/tmp/preflight-test.log 2>&1 \
  && ok "$(grep -oE 'Tests +[0-9]+ passed' /tmp/preflight-test.log | tail -1)" \
  || bad "tests failed — see /tmp/preflight-test.log"

say "8. Deploy queue"
# deploy.yml is concurrency:site-deploy, cancel-in-progress:false, 12-30 min a run.
# Merge bursts leave intermediate commits undeployed while the run list reads green.
Q=$(gh run list --workflow deploy.yml --limit 5 --json status \
    --jq '[.[]|select(.status=="queued" or .status=="in_progress")]|length' 2>/dev/null || echo 0)
if [ "${Q:-0}" -gt 1 ]; then
  printf "  \033[33mWAIT\033[0m %s deploys already queued. Merging now starves them.\n" "$Q"
  printf "       Let the queue drain, or your commit ships and theirs does not.\n"
else
  ok "deploy queue clear"
fi

echo
if [ "$FAIL" = 0 ]; then
  printf "\033[32mPREFLIGHT PASS\033[0m — safe to push.\n"; exit 0
else
  printf "\033[31mPREFLIGHT FAIL\033[0m — do not push. Fix the above first.\n"; exit 1
fi
# agent-preflight.sh — the rule that prevents recurrence.
#
# Run this BEFORE any auto-fix, mass-stamp, or batch-commit. It checks:
#
#   1. Active deploy queue (no merge during a busy deploy)
#   2. Git working tree clean (no uncommitted evidence pages)
#   3. Brand gate passes (the agentic-fix engine doesn't deploy forbidden strings)
#   4. The 153 conformity badges (every Council OS pane shows the lid)
#   5. The unauthenticated /api/agentic-fix write surface is NOT in scope
#      (any change to functions/api/agentic-fix.ts is owner-gated)
#   6. The interop/ evidence pages are not in the destructive-fixer allowlist
#
# Exit 0: proceed.
# Exit 1: stop, ask the owner.
#
# MANDATORY: this script is the gate. Any auto-fix pass that doesn't
# pass this gate will destroy evidence (the lesson from 2026-09-03).

set -euo pipefail
REPO="$HOME/clawd/councilof-ai"
cd "$REPO"

ERRORS=0
WARNINGS=0

note_pass() { echo "  ✓ $*"; }
note_warn() { echo "  ⚠ $*"; WARNINGS=$((WARNINGS + 1)); }
note_fail() { echo "  ✗ $*"; ERRORS=$((ERRORS + 1)); }

echo "================================================================"
echo "  AGENT PRE-FLIGHT — the rule that prevents recurrence"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================================"
echo

# --- 1. Active deploy queue (no merge during a busy deploy) ---
echo "--- 1. Active deploy queue ---"
DEPLOY_RUNS=$(gh run list --repo CSOAI-ORG/councilof-ai --workflow "Build + deploy site (prerender + fields + tour → both domains)" --limit 5 --json status,conclusion 2>/dev/null | python3 -c "
import json, sys
runs = json.load(sys.stdin)
busy = [r for r in runs if r.get('status') in ('in_progress', 'pending', 'queued')]
print(f'busy={len(busy)}')
" 2>&1)
echo "  $DEPLOY_RUNS"
if [[ "$DEPLOY_RUNS" == *"busy=0"* ]]; then
  note_pass "no busy deploys"
else
  note_fail "deploy queue busy — never merge into a busy deploy"
fi
echo

# --- 2. Git working tree clean ---
echo "--- 2. Git working tree ---"
if git diff --quiet HEAD 2>/dev/null; then
  note_pass "no uncommitted changes"
else
  note_warn "$(git status --short | wc -l) files modified"
fi
echo

# --- 3. Brand gate passes ---
echo "--- 3. Brand gate ---"
if node scripts/brand-gate.mjs public 2>&1 | grep -q "PASS"; then
  note_pass "brand gate"
else
  BRAND=$(node scripts/brand-gate.mjs public 2>&1 | head -3)
  note_fail "brand gate: $BRAND"
fi
echo

# --- 4. The 153 conformity badges (every pane carries the lid) ---
echo "--- 4. The 153 conformity badges ---"
PANES=$(grep -l "22 axes · 22 measured" public/*.html 2>/dev/null | wc -l)
TOTAL=$(ls public/*.html | wc -l)
echo "  $PANES / $TOTAL top-level HTML pages carry the canonical lid"
if [ "$PANES" -ge 100 ]; then
  note_pass "$PANES conformity badges in place"
else
  note_warn "only $PANES / $TOTAL — run the auto-fix engine"
fi
echo

# --- 5. The unauthenticated /api/agentic-fix write surface is owner-gated ---
echo "--- 5. /api/agentic-fix write surface ---"
if git diff --stat HEAD -- functions/api/agentic-fix.ts 2>/dev/null | grep -q .; then
  note_fail "functions/api/agentic-fix.ts has uncommitted changes — owner review required"
else
  note_pass "no uncommitted changes to the write surface"
fi
echo

# --- 6. The interop/ evidence pages — not in the destructive-fixer allowlist ---
echo "--- 6. The interop/ evidence allowlist ---"
# The empty-page fixer should NEVER touch public/interop/ evidence pages.
# Verify the agentic-fix engine has a guard.
if grep -q "INTEROP_PROTECT" scripts/badger/csoai-agentic-fix.py 2>/dev/null; then
  note_pass "interop/ evidence protection is in place"
else
  note_fail "interop/ evidence protection MISSING — re-add the guard"
fi
echo

echo "================================================================"
echo "  PRE-FLIGHT SUMMARY"
echo "================================================================"
echo "  errors:   $ERRORS"
echo "  warnings: $WARNINGS"
echo

if [ "$ERRORS" -gt 0 ]; then
  echo "  STOP. The owner must review the $ERRORS error(s) above."
  exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "  PROCEED with $WARNINGS warning(s) noted."
  exit 0
fi

echo "  PROCEED — all gates green."
exit 0 (fix(incident-2026-09-03): restore 9 destroyed evidence pages + add INTEROP_PROTECT guard)
