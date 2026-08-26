#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# deploy-site.sh — the ONE hand-deploy path for councilof.ai (Pages project councilof-ai).
#
# WHY THIS EXISTS (three broken deploys on 2026-08-26):
#   councilof.ai follows the Pages PRODUCTION alias. Which branch name the dashboard
#   treats as production has changed more than once (master / main / production), so a
#   hand-deploy of `--branch=master` alone left the apex on a stale build while
#   master.councilof-ai.pages.dev was perfectly correct — and the operator, checking
#   the preview URL, saw green. .github/workflows/deploy.yml already ships all three
#   names for exactly this reason; hand-deploys kept shipping one.
#
#   Two rules fall out of that, and this script enforces both:
#     1. Write ALL THREE alias names from the SAME dist/client, every time.
#     2. Verify the APEX. Not the preview URL, not the *.pages.dev host — the apex,
#        because the apex is the only host a user or an IETF implementer will type.
#        A deploy that cannot be seen at councilof.ai did not happen.
#
# Preflight runs the same blocking gates as deploy.yml, plus the two guards that exist
# because a hard platform limit surfaced at the last possible step:
#     pages-size-guard.mjs   — 25 MiB per file (a 32.7 MiB video killed a deploy at upload)
#     redirects-guard.mjs    — 100 dynamic rules (the cap silently ate the SPA catch-all)
#
# ─────────────────────────────────────────────────────────────────────────────
# READ DEPLOY-LOCK.md BEFORE USING THE DIRECT MODE.
#
# DEPLOY-LOCK.md is explicit: "Direct `wrangler pages deploy … --project-name=councilof-ai`
# is prohibited", and .github/workflows/deploy.yml is "the only writer". drift-guard.mjs
# exists to go RED when someone ignores that, because ungated hand-deploys have clobbered
# the gated build before.
#
# So this script's DEFAULT is not to deploy. Its sanctioned path is --via-actions, which
# triggers the official workflow and then verifies the apex — the missing half of
# `gh workflow run deploy.yml`, which today tells you the run started and nothing about
# whether councilof.ai ever changed.
#
# The direct path still exists, because operators were demonstrably already running raw
# `wrangler pages deploy` by hand (that is how three deploys broke on 2026-08-26 by
# writing one alias instead of three). A gated, three-alias, apex-verified hand-deploy is
# strictly safer than the ad-hoc command it replaces. It requires an explicit flag so that
# using it is a decision, never a default.
#
# Usage:
#   bash scripts/deploy-site.sh --via-actions   # SANCTIONED: trigger deploy.yml, then verify the apex
#   bash scripts/deploy-site.sh --preflight     # gates only against existing dist/client, NO deploy
#   bash scripts/deploy-site.sh --dry           # build + gates, print the deploy commands, do not run them
#   bash scripts/deploy-site.sh --verify-only   # just re-check what the apex is serving right now
#   bash scripts/deploy-site.sh --selftest      # prove the apex verifier can FAIL (no deploy)
#   bash scripts/deploy-site.sh --direct --break-deploy-lock
#                                               # build + gates + write all 3 aliases + verify apex
#   bash scripts/deploy-site.sh --skip-build --direct --break-deploy-lock
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT="councilof-ai"
APEX="https://councilof.ai"
PREVIEW="https://councilof-ai.pages.dev"
BRANCHES=(master main production)
DIST="dist/client"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

MODE="${1:---help}"
ACK=""
for a in "$@"; do [ "$a" = "--break-deploy-lock" ] && ACK=1; done
case "$MODE" in
  --via-actions|--preflight|--direct|--skip-build|--dry|--verify-only|--selftest) ;;
  --help|-h) sed -n '1,60p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *) echo "FATAL: unknown mode '$MODE'. Run with --help." >&2; exit 2 ;;
esac

say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ok()   { printf '   \033[32mok\033[0m   %s\n' "$*"; }
bad()  { printf '   \033[31mFAIL\033[0m %s\n' "$*"; }

command -v npx  >/dev/null 2>&1 || { echo "FATAL: npx not found"; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "FATAL: curl not found"; exit 2; }

# ─────────────────────────────────────────────────────────────────────────────
# apex_bundles — what /assets/*.js does a host's homepage actually reference?
# Cache-busted, redirect-following, and it asks for the APEX by name.
# ─────────────────────────────────────────────────────────────────────────────
apex_bundles() {
  curl -sS --max-time 25 -L \
    -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' \
    "$1/?deploy-check=$(date +%s%N)" \
  | grep -oE '/assets/index\.[A-Za-z0-9._-]+\.js' | sort -u
}
apex_bytes() {
  curl -sS --max-time 25 -L -H 'Cache-Control: no-cache' "$1/?deploy-check=$(date +%s%N)" | wc -c | tr -d ' '
}

verify_apex() {
  local want="$1" tries="${2:-10}" sleep_s="${3:-15}"
  say "Verifying the APEX ($APEX) serves the bytes we just built"
  echo "   NOTE: this checks $APEX itself. A green $PREVIEW proves nothing about the apex."
  echo "   want: $(echo "$want" | tr '\n' ' ')"
  local i got bytes
  for i in $(seq 1 "$tries"); do
    got="$(apex_bundles "$APEX" || true)"
    bytes="$(apex_bytes "$APEX" || echo 0)"
    if [ "$got" = "$want" ] && [ "${bytes:-0}" -ge 20000 ]; then
      ok "$APEX serves $(echo "$got" | tr '\n' ' ')(${bytes} bytes homepage)"
      return 0
    fi
    echo "   try $i/$tries: apex has [$(echo "$got" | tr '\n' ' ')] ${bytes}b — waiting ${sleep_s}s"
    [ "$i" -lt "$tries" ] && sleep "$sleep_s"
  done
  bad "$APEX did NOT converge on the build we shipped."
  echo "     wanted : $(echo "$want" | tr '\n' ' ')"
  echo "     apex   : $(echo "$got" | tr '\n' ' ')  (${bytes} bytes)"
  echo "     preview: $(apex_bundles "$PREVIEW" | tr '\n' ' ')"
  echo ""
  echo "   If the preview line matches and the apex line does not, the Pages dashboard's"
  echo "   production_branch is a name this script did not write. Check it, add the name to"
  echo "   BRANCHES at the top of this file, and re-run. Do NOT call this deploy done."
  return 1
}

# A verifier that cannot fail is decoration. This proves the apex check actually
# discriminates: it must REJECT a bundle name the apex does not serve, and ACCEPT
# the one it does. Runs against the live apex, deploys nothing.
if [ "$MODE" = "--selftest" ]; then
  say "Selftest: can verify_apex tell a wrong build from the right one?"
  echo "   (live read of $APEX, no deploy)"
  REAL="$(apex_bundles "$APEX")"
  [ -n "$REAL" ] || { bad "could not read any /assets/index.*.js from $APEX — cannot selftest"; exit 1; }

  echo ""
  echo "   case 1: a bundle the apex does NOT serve -> verifier must FAIL"
  if verify_apex "/assets/index.r2-DEFINITELYNOTREAL.js" 2 2 >/tmp/deploy-site-selftest.log 2>&1; then
    bad "verifier ACCEPTED a bundle the apex does not serve. It would green-light a stale apex."
    exit 1
  fi
  ok "rejected, as it must"

  echo ""
  echo "   case 2: the bundle the apex IS serving -> verifier must PASS"
  if verify_apex "$REAL" 2 2 >/tmp/deploy-site-selftest.log 2>&1; then
    ok "accepted $REAL"
  else
    bad "verifier REJECTED the bundle the apex is actually serving — it would block every good deploy."
    sed 's/^/        /' /tmp/deploy-site-selftest.log | tail -12
    exit 1
  fi
  say "Selftest passed: the apex verifier discriminates"
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# --via-actions — the sanctioned path. `gh workflow run deploy.yml` on its own tells you
# a run was QUEUED and nothing about whether councilof.ai ever changed; on 2026-08-26 the
# queue was 14 deep with 0 running and the deploy never executed at all. This waits for
# the run, then verifies the apex, so "deployed" means the apex serves it.
# ─────────────────────────────────────────────────────────────────────────────
if [ "$MODE" = "--via-actions" ]; then
  command -v gh >/dev/null 2>&1 || { echo "FATAL: gh CLI not found — needed to trigger and watch deploy.yml"; exit 2; }
  BEFORE="$(apex_bundles "$APEX" || true)"
  say "Triggering the official deploy workflow (deploy.yml, ref master)"
  echo "   apex is currently on: $(echo "$BEFORE" | tr '\n' ' ')"
  gh workflow run deploy.yml --ref master

  say "Waiting for the run to start (it queues behind every other workflow on the runner)"
  RUN_ID=""
  for i in $(seq 1 40); do
    RUN_ID="$(gh run list --workflow=deploy.yml --limit 1 --json databaseId,status,createdAt               --jq '.[0].databaseId' 2>/dev/null || true)"
    ST="$(gh run list --workflow=deploy.yml --limit 1 --json status --jq '.[0].status' 2>/dev/null || echo unknown)"
    echo "   run $RUN_ID status=$ST"
    [ "$ST" = "in_progress" ] && break
    if [ "$ST" = "queued" ] && [ "$i" -eq 40 ]; then
      bad "still QUEUED after ~10 minutes. The runner pool is starved — that is the failure, not the deploy."
      echo "     Check: gh run list --limit 30   (how many are queued vs running?)"
      exit 7
    fi
    sleep 15
  done

  say "Watching run $RUN_ID"
  gh run watch "$RUN_ID" --exit-status || { bad "deploy.yml run $RUN_ID FAILED"; exit 8; }

  say "Workflow green — now checking the thing the workflow cannot check for you"
  AFTER_WANT="$(apex_bundles "$PREVIEW" || true)"
  if [ -z "$AFTER_WANT" ]; then bad "could not read a bundle from $PREVIEW"; exit 9; fi
  verify_apex "$AFTER_WANT" 10 15 || { bad "workflow green but the APEX did not take it."; exit 6; }
  node scripts/assert-prerender-live.mjs --label via-actions --host "$APEX" --also "$PREVIEW"
  say "DEPLOY CONFIRMED at $APEX (via GitHub Actions)"
  exit 0
fi

if [ "$MODE" = "--verify-only" ]; then
  say "Verify-only: what is the apex serving right now?"
  echo "   apex    $APEX     -> $(apex_bundles "$APEX"    | tr '\n' ' ') ($(apex_bytes "$APEX") bytes)"
  echo "   preview $PREVIEW  -> $(apex_bundles "$PREVIEW" | tr '\n' ' ') ($(apex_bytes "$PREVIEW") bytes)"
  exit 0
fi

# ── build ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "--direct" ] || [ "$MODE" = "--dry" ]; then
  say "Build + prerender"
  npm run build:client
  node scripts/prerender.mjs --dist "$DIST" --wait 900 --min 350
fi

[ -d "$DIST" ] && [ -f "$DIST/index.html" ] || {
  echo "FATAL: $DIST/index.html missing. Run without --skip-build/--preflight, or build first." >&2
  exit 3
}

# ── preflight: every blocking gate, source-level first, then dist-level ──────
say "Preflight gates"
FAILED=0
gate() {
  local name="$1"; shift
  if "$@" >/tmp/deploy-site-gate.log 2>&1; then
    ok "$name"
  else
    bad "$name"
    sed 's/^/        /' /tmp/deploy-site-gate.log | tail -25
    FAILED=1
  fi
}

# Guards prove themselves before they judge anything: a guard that has silently
# stopped biting passes everything, which is worse than no guard at all.
gate "redirects-guard selftest"      node scripts/redirects-guard.mjs --selftest
gate "no-conflict-markers selftest"  node scripts/no-conflict-markers.mjs --selftest

gate "one-door-guard"                node scripts/one-door-guard.mjs
gate "no-conflict-markers"           node scripts/no-conflict-markers.mjs
gate "redirects-guard (_redirects)"  node scripts/redirects-guard.mjs public/_redirects
gate "pages-size-guard (25 MiB)"     node scripts/pages-size-guard.mjs "$DIST"
gate "check-prerender"               node scripts/check-prerender.mjs "$DIST"
gate "brand-gate"                    node scripts/brand-gate.mjs "$DIST"
gate "signed-json-guard"             node scripts/signed-json-guard.mjs "$DIST"
gate "price-gate"                    node scripts/price-gate.mjs "$DIST"
gate "facts-gate"                    node scripts/facts-gate.mjs "$DIST"

# The routes deploy.yml treats as load-bearing must be real files in the tree.
MISSING=""
for p in sov-os/index.html api-docs/index.html os/index.html gspc-verify/index.html; do
  [ -f "$DIST/$p" ] || MISSING="$MISSING $p"
done
if [ -n "$MISSING" ]; then bad "dist bundle guard — missing:$MISSING"; FAILED=1; else ok "dist bundle guard"; fi

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "x preflight FAILED. Nothing was deployed. Fix the gates above and re-run."
  exit 4
fi
echo ""
ok "all preflight gates green"

WANT_BUNDLES="$(grep -oE '/assets/index\.[A-Za-z0-9._-]+\.js' "$DIST/index.html" | sort -u)"
[ -n "$WANT_BUNDLES" ] || { echo "FATAL: no /assets/index.*.js in $DIST/index.html — build looks broken"; exit 5; }
echo "   built bundle: $(echo "$WANT_BUNDLES" | tr '\n' ' ')"
echo "   commit:       $(git rev-parse --short HEAD 2>/dev/null || echo no-git)"

if [ "$MODE" = "--preflight" ]; then
  say "Preflight only — NOTHING WAS DEPLOYED"
  echo "   Would have written branches: ${BRANCHES[*]}  (project $PROJECT)"
  echo "   Would then have verified:    $APEX"
  exit 0
fi

if [ "$MODE" = "--dry" ]; then
  say "Dry run — NOTHING WAS DEPLOYED"
  for b in "${BRANCHES[@]}"; do
    echo "   npx wrangler pages deploy $DIST --project-name=$PROJECT --branch=$b --commit-dirty=true"
  done
  echo "   then: verify $APEX serves $(echo "$WANT_BUNDLES" | tr '\n' ' ')"
  exit 0
fi

# ── deploy: ALL THREE alias names, same tree, no exceptions ──────────────────
if [ -z "$ACK" ]; then
  say "REFUSING to deploy — DEPLOY-LOCK.md"
  cat <<'LOCK'
   DEPLOY-LOCK.md: "Direct `wrangler pages deploy … --project-name=councilof-ai` is
   prohibited." .github/workflows/deploy.yml is the only sanctioned writer, because an
   ungated direct deploy has clobbered the gated build before — that is why
   scripts/drift-guard.mjs exists and why it goes RED within minutes of a hand-deploy.

   Preflight above is GREEN. Nothing was deployed. Do one of:

     bash scripts/deploy-site.sh --via-actions
         Trigger the official workflow and then verify the apex. This is the path.

     git push          (the workflow fires on push to master)

   If you are the deploy lane and you have decided to write production by hand anyway,
   say so explicitly:

     bash scripts/deploy-site.sh --direct --break-deploy-lock

   Expect drift-guard to notice. That is the system working, not a false alarm.
LOCK
  exit 0
fi

: "${CLOUDFLARE_API_TOKEN:?FATAL: CLOUDFLARE_API_TOKEN not set — the deploy would fail halfway}"
say "DEPLOY-LOCK deliberately overridden (--break-deploy-lock) by $(git config user.name 2>/dev/null || echo unknown) at $(date -u +%FT%TZ)"
say "Deploying $DIST to $PROJECT on ALL alias names: ${BRANCHES[*]}"
for b in "${BRANCHES[@]}"; do
  echo ""
  echo "   -> branch $b"
  npx wrangler pages deploy "$DIST" --project-name="$PROJECT" --branch="$b" --commit-dirty=true
done

# ── verify the apex, not the preview ─────────────────────────────────────────
sleep 20
if ! verify_apex "$WANT_BUNDLES" 10 15; then
  echo ""
  echo "x DEPLOY NOT CONFIRMED. The upload succeeded but $APEX is not serving it."
  echo "  Do not report this deploy as done."
  exit 6
fi

say "Apex confirmed — deep-link + prerender assertion"
node scripts/assert-prerender-live.mjs --label deploy-site --host "$APEX" --also "$PREVIEW"
say "DEPLOY CONFIRMED at $APEX"
