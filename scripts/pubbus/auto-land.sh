#!/usr/bin/env bash
# scripts/pubbus/auto-land.sh — gated auto-land + deploy for councilof.ai. DESIGN; NOT ENABLED.
#
# One pass: fetch lane bundles that carry a READY marker, merge them ONE AT A TIME onto canonical
# master, run each lane's own tests, then the full deploy gates on the merged tree, deploy only if
# every gate passes, verify the live site, and only then submit IndexNow. Anything red stops the
# pass before the deploy; a rejected lane is recorded and skipped, never force-merged.
#
# It refuses to run unless ALL of these hold (see docs/operations/PUBLICATION-BUS.md):
#   ENABLE_AUTO_LAND=1            the owner has switched it on (it is off by default)
#   CLOUDFLARE_API_TOKEN          an owner-issued, Pages:Edit-scoped API token. The wrangler OAuth
#   CLOUDFLARE_ACCOUNT_ID         login rotates/expires and cannot run unattended.
#   >= 8 GB RAM                   build + prerender (Chromium) do not fit in less. oracle-micro-2
#                                 (1 GB) can NOT run this; an HF Jobs cpu-upgrade job or a RunPod
#                                 CPU pod can.
#
# READY marker contract: beside ~/lanes/<lane>.bundle, a file ~/lanes/<lane>.READY holding JSON
#   {"branch": "lane/<lane>", "head": "<40-hex>", "base": "master", "tests": ["<cmd>", ...]}
# written by the lane when it is done. The pass lands the bundle only if the bundle's head equals
# "head". After a landing the marker is renamed <lane>.LANDED-<sha>; after a rejection,
# <lane>.REJECTED-<sha> with the reason in the pass report.
#
#   ENABLE_AUTO_LAND=1 CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
#     bash scripts/pubbus/auto-land.sh [--dry-run] [--no-deploy]
set -euo pipefail

DRY=0; NODEPLOY=0
for a in "$@"; do case "$a" in --dry-run) DRY=1 ;; --no-deploy) NODEPLOY=1 ;; *) echo "unknown arg $a" >&2; exit 2 ;; esac; done

LANES_SRC=${LANES_SRC:-oracle-micro-2:lanes}          # where bundles + markers live (rsync source)
MASTER_SRC=${MASTER_SRC:-oracle-micro-2:mirrors/councilof-ai.git}   # canonical master (read here; pushed at the end)
WORK=${WORK:-$HOME/auto-land}
SITE=${SITE:-https://councilof.ai}
PROJECT=${PAGES_PROJECT:-councilof-ai}
REPORT=$WORK/report-$(date -u +%Y%m%dT%H%M%SZ).json
log() { echo "[auto-land $(date -u +%H:%M:%SZ)] $*"; }
die() { log "REFUSED: $*"; exit 3; }

# ---- 0. preflight: every refusal names its reason ---------------------------------------------
[ "${ENABLE_AUTO_LAND:-0}" = "1" ] || die "ENABLE_AUTO_LAND is not 1 (auto-land is off by default; the owner enables it)"
if [ "$DRY" = 0 ] && [ "$NODEPLOY" = 0 ]; then
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] || die "no CLOUDFLARE_API_TOKEN: an owner-issued Pages:Edit token is required for unattended deploys"
  [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || die "no CLOUDFLARE_ACCOUNT_ID"
fi
MEM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)
[ "$MEM_KB" -ge 7800000 ] || die "MemTotal ${MEM_KB} kB < 8 GB: build + prerender need >= 8 GB (use HF Jobs cpu-upgrade or a RunPod CPU pod)"
for t in git node npm python3 rsync curl; do command -v "$t" >/dev/null || die "missing tool: $t"; done
mkdir -p "$WORK/inbox"
exec 9>"$WORK/auto-land.lock"; flock -n 9 || { log "another pass holds the lock; exiting"; exit 0; }

# ---- 1. canonical master, clean -----------------------------------------------------------------
rm -rf "$WORK/tree"
git clone -q "$MASTER_SRC" "$WORK/tree"
cd "$WORK/tree"
git config user.name CSOAI; git config user.email nicholas@csoai.org
BASE=$(git rev-parse HEAD)
[ -z "$(git status --porcelain)" ] || die "fresh clone is not clean"
git checkout -q -b auto-land/integration
LIVE_TOTALS_BEFORE=$(curl -fsS "$SITE/api/gspc" | python3 -c 'import json,sys; t=json.load(sys.stdin)["totals"]; print(json.dumps({k:t.get(k) for k in ("axes","measured_axes","unmeasured_axes","public_count")}, sort_keys=True))') \
  || die "live /api/gspc unreadable before the pass: UNMEASURED baseline, no deploy"

# ---- 2. READY bundles ---------------------------------------------------------------------------
rsync -q -a --include='*.READY' --include='*.bundle' --exclude='*' "$LANES_SRC/" "$WORK/inbox/" || die "cannot read $LANES_SRC"
LANDED=(); REJECTED=()
for marker in $(ls -1tr "$WORK"/inbox/*.READY 2>/dev/null); do
  lane=$(basename "$marker" .READY); bundle="$WORK/inbox/$lane.bundle"
  branch=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["branch"])' "$marker")
  head=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["head"])' "$marker")
  reject() { log "REJECT $lane: $1"; REJECTED+=("$lane: $1"); git merge --abort 2>/dev/null || true; git reset -q --hard "$2"; }
  pre=$(git rev-parse HEAD)
  [ -f "$bundle" ] || { reject "READY marker without a bundle" "$pre"; continue; }
  git bundle verify -q "$bundle" >/dev/null 2>&1 || { reject "bundle does not verify" "$pre"; continue; }
  git fetch -q "$bundle" "$branch:refs/lanes/$lane" || { reject "branch $branch not in bundle" "$pre"; continue; }
  [ "$(git rev-parse "refs/lanes/$lane")" = "$head" ] || { reject "bundle head != marker head" "$pre"; continue; }
  git merge -q --no-ff -m "land: merge $branch ($(git rev-parse --short "$head"))" "refs/lanes/$lane" \
    || { reject "merge conflict against the integration branch" "$pre"; continue; }
  ok=1
  while IFS= read -r cmd; do
    [ -z "$cmd" ] && continue
    log "  $lane test: $cmd"
    bash -c "$cmd" > "$WORK/test-$lane.log" 2>&1 || { ok=0; break; }
  done < <(python3 -c 'import json,sys; [print(c) for c in json.load(open(sys.argv[1])).get("tests",[])]' "$marker")
  [ "$ok" = 1 ] || { reject "lane test failed (see test-$lane.log)" "$pre"; continue; }
  LANDED+=("$lane:$head")
done
[ "${#LANDED[@]}" -gt 0 ] || { log "nothing READY landed (${#REJECTED[@]} rejected)"; exit 0; }

# ---- 3. the full deploy gates, on the merged tree -----------------------------------------------
gate() { local name=$1; shift; log "gate: $name"; "$@" > "$WORK/gate-$name.log" 2>&1 || die "gate $name FAILED (see $WORK/gate-$name.log); nothing deployed"; }
gate npm-ci npm ci --no-audit --no-fund --loglevel=error
gate custody-guard node scripts/custody-wording-guard.mjs
gate pubbus-tests node --test scripts/pubbus/pubbus.node-test.mjs scripts/custody-wording-guard.node-test.mjs
gate llms-check node scripts/llms-txt.mjs --check
gate build rm -rf dist/client
gate build-client npm run build:client
gate prerender bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350
gate brand-gate node scripts/brand-gate.mjs dist/client
gate signed-json-guard node scripts/signed-json-guard.mjs dist/client
gate facts-gate node scripts/facts-gate.mjs dist/client
gate runtime-truth node scripts/council-runtime-truth-gate.mjs
gate sitemap-truth node scripts/sitemap-truth-gate.mjs
rm -rf dist/client/functions dist/client/proofs   # as deploy-prod.sh: Functions deploy from root; proofs live on the HF mirror
gate pages-size node scripts/pages-size-guard.mjs dist/client

if [ "$DRY" = 1 ] || [ "$NODEPLOY" = 1 ]; then log "gates green; --dry-run/--no-deploy: stopping before deploy"; exit 0; fi

# ---- 4. deploy (token, never the OAuth login) ---------------------------------------------------
gate deploy npx --yes wrangler@3 pages deploy dist/client --project-name "$PROJECT" --branch master --commit-hash "$(git rev-parse HEAD)" --commit-dirty=false

# ---- 5. verify live -----------------------------------------------------------------------------
sleep 60
curl -fsS "$SITE/api/health" >/dev/null || die "post-deploy: /api/health not 200 - investigate before anything else; IndexNow NOT submitted"
LIVE_TOTALS_AFTER=$(curl -fsS "$SITE/api/gspc" | python3 -c 'import json,sys; t=json.load(sys.stdin)["totals"]; print(json.dumps({k:t.get(k) for k in ("axes","measured_axes","unmeasured_axes","public_count")}, sort_keys=True))')
if [ "$LIVE_TOTALS_BEFORE" != "$LIVE_TOTALS_AFTER" ]; then
  log "NOTE: board totals moved ($LIVE_TOTALS_BEFORE -> $LIVE_TOTALS_AFTER); a landed lane changed the board - check it was meant to"
fi
want=$(sha256sum dist/client/evidence/published-records.json 2>/dev/null | cut -d' ' -f1 || true)
if [ -n "$want" ]; then
  got=$(curl -fsS "$SITE/evidence/published-records.json?cb=$RANDOM" | sha256sum | cut -d' ' -f1)
  [ "$want" = "$got" ] || die "post-deploy: served published-records.json differs from the build; IndexNow NOT submitted"
fi
while read -r u; do
  [ -z "$u" ] && continue
  case "$(curl -s -o /dev/null -w '%{http_code}' "$u")" in 200|308) : ;; *) die "post-deploy: $u does not answer; IndexNow NOT submitted" ;; esac
done < <(grep -v '^$' council-os/pubbus/indexnow-pending.txt 2>/dev/null | head -50)

# ---- 6. only now: land master, IndexNow, clear the pending list --------------------------------
git push -q "$MASTER_SRC" auto-land/integration:master   # the landing role's single write to the canonical mirror
if [ -s council-os/pubbus/indexnow-pending.txt ]; then
  node scripts/indexnow-submit.mjs --changed --file council-os/pubbus/indexnow-pending.txt > "$WORK/indexnow.log" 2>&1 || log "IndexNow submission reported errors (see indexnow.log); the site is live regardless"
  : > council-os/pubbus/indexnow-pending.txt
  git commit -q -s -m "pubbus: IndexNow submitted after deploy $(git rev-parse --short HEAD); pending list cleared" council-os/pubbus/indexnow-pending.txt
  git push -q "$MASTER_SRC" auto-land/integration:master
fi
for l in "${LANDED[@]}"; do lane=${l%%:*}; ssh "${LANES_SRC%%:*}" "mv ~/lanes/$lane.READY ~/lanes/$lane.LANDED-${l##*:}" || true; done
python3 - "$REPORT" "$BASE" "$(git rev-parse HEAD)" "${LANDED[*]:-}" "${REJECTED[*]:-}" <<'PY'
import json, sys
out, base, head, landed, rejected = sys.argv[1:6]
json.dump({"base": base, "head": head, "landed": landed.split(), "rejected": rejected, "deployed": True}, open(out, "w"), indent=1)
PY
log "landed ${#LANDED[@]}, rejected ${#REJECTED[@]}, deployed $(git rev-parse --short HEAD); report $REPORT"
