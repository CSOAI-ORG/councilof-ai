#!/bin/bash
# Full pipeline on the pod: build -> prerender -> gates -> wrangler pages deploy (councilof-ai, master).
# GitHub is not in this loop. Run only after build-gates.sh has passed for the same ref.
set -uo pipefail
# One deploy at a time, enforced by the kernel, not by pgrep (22 Sep 2026: two waiters launched 33 s apart and raced).
exec 9>/workspace/ci/deploy.lock; flock -n 9 || { echo "another deploy holds /workspace/ci/deploy.lock; exiting"; exit 0; }
export PATH=/workspace/tools/node/bin:$PATH
# The HF write token (evidence-sync only) never reaches npm, vite, prerender or wrangler: keep it unexported.
EVTOK=${HF_TOKEN:-}; unset HF_TOKEN
CI=/workspace/ci/councilof-ai; LOG=/workspace/ci/deploy-prod.log; REF=${1:-master}
echo "=== deploy-prod $(date -u +%FT%TZ) ref=$REF" | tee -a $LOG
cd $CI && git fetch -q origin && git checkout -q -f "origin/$REF" && echo "  at $(git rev-parse --short HEAD)" | tee -a $LOG
# Protect all previously served sitemap URLs before any source build.
/usr/bin/python3 /workspace/csoai-scale-engine/release_guard/sitemap_guard.py --public-dir public --baseline /workspace/csoai-scale-engine/release_guard/sitemap-known-public.json --receipt /workspace/ci/sitemap-source-check.json --observe-live >/workspace/ci/sitemap-source-check.log 2>&1 || { echo "  sitemap-source FAILED; missing or uncheckable served URLs; build held" | tee -a "$LOG"; exit 13; }
echo "  sitemap-source ok" | tee -a "$LOG"
# Required exact-byte root-witness gate. No stale proof aliases pass into another release.
/usr/bin/python3 scripts/root-witness-release-gate.py --phase candidate --public-dir public >/workspace/ci/root-witness-candidate.log 2>&1 || { echo "  root-witness-candidate FAILED; upload blocked" | tee -a "$LOG"; exit 11; }
echo "  root-witness-candidate ok" | tee -a "$LOG"
# The mill may land a new root after the :45 trust-chain pass. Refuse a
# pointer whose exact OTS sidecar is missing from the manifest in this ref.
/usr/bin/python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir public >/workspace/ci/root-ots-source.log 2>&1 || { echo "  root-ots-source FAILED; upload blocked" | tee -a "$LOG"; exit 14; }
echo "  root-ots-source ok" | tee -a "$LOG"
# Always rebuild (22 Sep 2026): a ref change with a stale dist/ shipped Functions from the new ref over static files from the old one.
rm -rf dist/client; npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1; npm run build:client >/workspace/ci/build.log 2>&1 && echo "  build ok: $(find dist/client -type f | wc -l) files" | tee -a $LOG || { echo "  build FAILED" | tee -a $LOG; tail -5 /workspace/ci/build.log; exit 4; }
t0=$(date +%s)
HTML=$(find dist/client -name "*.html" 2>/dev/null | wc -l)
if [ "${SKIP_PRERENDER:-0}" = "1" ] && [ "$HTML" -ge 350 ]; then
  echo "  prerender skipped by SKIP_PRERENDER=1 (dist/client already holds $HTML html files from this ref)" | tee -a $LOG
elif [ -x scripts/prerender-run.sh ] || [ -f scripts/prerender-run.sh ]; then
  bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350 >/workspace/ci/prerender.log 2>&1 && echo "  prerender ok ($(( $(date +%s)-t0 ))s): $(grep -oE "[0-9]+ (pages|routes)" /workspace/ci/prerender.log | tail -1)" | tee -a $LOG || { echo "  prerender FAILED ($(( $(date +%s)-t0 ))s) — see prerender.log" | tee -a $LOG; tail -4 /workspace/ci/prerender.log | sed "s/^/    /"; exit 5; }
fi
node scripts/brand-gate.mjs dist/client >/workspace/ci/brand-gate.log 2>&1 && echo "  brand-gate ok" | tee -a $LOG || { echo "  brand-gate FAILED" | tee -a $LOG; exit 6; }
node scripts/signed-json-guard.mjs dist/client >/workspace/ci/signed-json-guard.log 2>&1 && echo "  signed-json-guard ok" | tee -a $LOG || { echo "  signed-json-guard FAILED" | tee -a $LOG; exit 7; }
# Instrument guard (27 Sep 2026): a private canary token in the built site means a held-out slice
# leaked. The gate holds only leak-scan digests from the signed commitments records and exits 2
# when there is no record (an unread list is not a clean scan), which blocks here too.
{ node scripts/canary-leak-gate.mjs --selftest && node scripts/canary-leak-gate.mjs dist/client public; } >/workspace/ci/canary-leak-gate.log 2>&1 && echo "  canary-leak-gate ok: $(tail -1 /workspace/ci/canary-leak-gate.log | cut -c1-120)" | tee -a $LOG || { echo "  canary-leak-gate FAILED (exit held; file + digest only, never the token)" | tee -a $LOG; tail -4 /workspace/ci/canary-leak-gate.log | sed "s/^/    /"; exit 15; }
# Sandbox wall (28 Sep 2026): SovSpace sandbox records (reactions, prediction commits, scores, the calibration ledger,
# the scoreboard), its predictor ids, its twin signing key and its data URLs never ship on councilof.ai. Selftest first,
# so a guard that cannot fail holds the deploy too. Known exceptions are named in the guard and printed on every run.
{ node scripts/sandbox-wall-guard.mjs --selftest && node scripts/sandbox-wall-guard.mjs dist/client functions; } >/workspace/ci/sandbox-wall-guard.log 2>&1 && echo "  sandbox-wall-guard ok: $(tail -1 /workspace/ci/sandbox-wall-guard.log | cut -c1-120)" | tee -a $LOG || { echo "  sandbox-wall-guard FAILED (sandbox bytes on a measurement surface)" | tee -a $LOG; tail -5 /workspace/ci/sandbox-wall-guard.log | sed "s/^/    /"; exit 18; }
# functions/ is deployed by Pages from the project root, never as static assets; prod 404s it. Drop it, then
# run the repo's own Pages guard so a file-cap breach fails HERE with the count, not at upload after a 6-minute prerender.
rm -rf dist/client/functions
# Owner decisions 22 Sep (proofs/) and 28 Sep 2026 (cards/): both leave the upload to stay under Pages' 20,000-file cap.
# Every /proofs/* and /cards/* link keeps resolving via a 302 to the PUBLIC HF dataset csoai/councilof-ai-evidence, which
# the evidence-sync gate below makes byte-equal to this build before the upload (it holds the deploy otherwise).
rm -rf dist/client/proofs dist/client/cards
grep -q '^/cards/\* ' dist/client/_redirects 2>/dev/null || python3 - <<'PYI'
import pathlib, re
p = pathlib.Path("dist/client/_redirects"); L = p.read_text().splitlines()
EV = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main"
block = ["# proofs/ and cards/ live on HF csoai/councilof-ai-evidence (Pages 20,000-file cap; decided 2026-09-22 / 2026-09-28)",
         *([f"/proofs/* {EV}/proofs/:splat 302"] if not any(l.startswith("/proofs/*") for l in L) else []),
         f"/cards/* {EV}/cards/:splat 302", ""]
i = next((k for k, l in enumerate(L) if re.match(r"^/\S*\*\s", l)), len(L))   # before the first splat rule, never after the catch-all
L[i:i] = block; p.write_text("\n".join(L) + "\n"); print(f"    /proofs/* rule inserted at line {i+1}")
PYI
[ -f scripts/redirects-guard.mjs ] && { node scripts/redirects-guard.mjs dist/client/_redirects >/workspace/ci/redirects-guard.log 2>&1 && echo "  redirects-guard ok" | tee -a $LOG || { echo "  redirects-guard FAILED" | tee -a $LOG; tail -3 /workspace/ci/redirects-guard.log | sed "s/^/    /"; exit 10; }; }
node scripts/pages-size-guard.mjs dist/client >/workspace/ci/pages-size-guard.log 2>&1 && echo "  pages-size-guard ok: $(find dist/client -type f | wc -l) files" | tee -a $LOG || { echo "  pages-size-guard FAILED: $(find dist/client -type f | wc -l) files (cap 20,000)" | tee -a $LOG; tail -3 /workspace/ci/pages-size-guard.log | sed "s/^/    /"; exit 9; }
# Bind critical built witness bytes back to the candidate which passed the full gate.
/usr/bin/python3 - <<'PYW' || { echo "  built root-witness bytes diverged; upload blocked" | tee -a "$LOG"; exit 12; }
from pathlib import Path
for rel in ["root.json", "interop/root-witness-latest.json", "interop/root-witness-pointer.json", "interop/ots-exact-bindings-v1.json"]:
 a=Path("public")/rel;b=Path("dist/client")/rel
 if a.exists():
  assert b.exists() and a.read_bytes()==b.read_bytes(), rel
print("  built root-witness bytes match gated source")
PYW
# Recheck the actual built sitemap and the four served-only/protected pages.
/usr/bin/python3 /workspace/csoai-scale-engine/release_guard/sitemap_guard.py --public-dir dist/client --baseline /workspace/csoai-scale-engine/release_guard/sitemap-known-public.json --receipt /workspace/ci/sitemap-built-check.json --built >/workspace/ci/sitemap-built-check.log 2>&1 || { echo "  sitemap-built FAILED; upload blocked" | tee -a "$LOG"; exit 13; }
echo "  sitemap-built ok" | tee -a "$LOG"
# Recheck the exact tree about to upload. Prerender must not drop or rewrite
# the pointer, root, proof, or the manifest row binding all three.
/usr/bin/python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir dist/client >/workspace/ci/root-ots-built.log 2>&1 || { echo "  root-ots-built FAILED; upload blocked" | tee -a "$LOG"; exit 14; }
echo "  root-ots-built ok" | tee -a "$LOG"
# Evidence sync (28 Sep 2026): cards/ and proofs/ are served from HF, so the dataset must hold THIS build's bytes before
# the upload, or /api/proof and MCP get_card would serve paths into the previous root. HF_TOKEN comes only from the
# environment (streamed on stdin by the Oracle auto-land trigger); without it the gate is check-only and holds on any drift.
HF_TOKEN=$EVTOK /usr/bin/python3 scripts/pod-loops/evidence_sync.py ${EVTOK:+--apply} --public-dir public --message "sync from councilof.ai build $(git rev-parse --short HEAD)" --receipt /workspace/ci/evidence-sync.json >/workspace/ci/evidence-sync.log 2>&1 && echo "  evidence-sync ok: $(tail -1 /workspace/ci/evidence-sync.log | cut -c1-160)" | tee -a $LOG || { echo "  evidence-sync FAILED; upload blocked" | tee -a $LOG; tail -3 /workspace/ci/evidence-sync.log | sed "s/^/    /"; exit 17; }
npx wrangler pages deploy dist/client --project-name=councilof-ai --branch=master --commit-dirty=true >/workspace/ci/wrangler-deploy.log 2>&1 && echo "  DEPLOYED: $(grep -oE "https://[a-z0-9]+\.councilof-ai\.pages\.dev" /workspace/ci/wrangler-deploy.log | tail -1)" | tee -a $LOG || { echo "  deploy FAILED" | tee -a $LOG; tail -4 /workspace/ci/wrangler-deploy.log | sed "s/^/    /"; exit 8; }
echo "=== done $(date -u +%FT%TZ)" | tee -a $LOG
