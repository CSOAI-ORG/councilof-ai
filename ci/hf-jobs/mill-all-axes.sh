#!/usr/bin/env bash
# ci/hf-jobs/mill-all-axes.sh — GSPC mill as a standing N-site on Hugging Face Jobs.
#
# N-Sites doctrine: same fail-closed instrument on every free site, pull → run → push,
# INCOMPLETE never passes, one account per site, published free allowance only.
#
# What it does (one job, sequential, one axis after another):
#   pull  — hub-queue queue.jsonl + the public frozen bank csoai/gspc-<short>/items.jsonl
#   run   — harness/gspc-top100/mill_hub_queue.py --pick 300 --grade 8 --probe-first
#           --dead harness/gspc-top100/dead_slugs.jsonl --items 30   (the fixed picker)
#   push  — csoai/gspc-hub-cards/staged-unsigned/<date>/<axis>/  (cards, mill-report.json,
#           skip.jsonl, mill.log, dead_slugs.jsonl) + staged-unsigned/<date>/MANIFEST.json
#
# What it never does: write mill-cards/, INDEX.jsonl, cards.jsonl, hub-queue, or the word
# MEASURED anywhere. Every card it stages carries "signature": null and is UNSIGNED.
# A card becomes MEASURED only after an Ed25519 signature verifies VALID under
# did:web:csoai.org#board-attestation-1 — signing runs elsewhere (GitHub Actions OIDC signer).
#
# Exit codes: 0 COMPLETE · 2 fail-closed preflight · 3 inference balance/credit halt · 4 INCOMPLETE
# Env: HF_TOKEN (required; org write + Inference Providers) · DAY (default UTC today) · GRADE (default 8)
set -euo pipefail

: "${HF_TOKEN:?FAIL CLOSED: HF_TOKEN secret missing}"
DAY="${DAY:-$(date -u +%F)}"
GRADE="${GRADE:-8}"
REPO="csoai/gspc-hub-cards"
PREFIX="staged-unsigned/${DAY}"
PICKER="harness/gspc-top100/mill_hub_queue.py"
DEAD="harness/gspc-top100/dead_slugs.jsonl"
# hub-queue uses the board's long axis ids; the public frozen banks live at csoai/gspc-<short>/items.jsonl.
# Only axes the picker knows (MODEL_AXES) are listed; an unknown id would silently fall back to governance.
AXES="governance:gov machinery-conformity:mach detector-interop:det art5-safeguard:art5 cross-reality:xr provenance:prv jail:jail swarm:swarm care:care affect:affect"
STATEMENT="UNSIGNED — becomes MEASURED only after a VALID signature; nothing here is a rank"

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }

# ---- preflight (fail closed) -------------------------------------------------------------------
[ -f "$PICKER" ] || { echo "FAIL CLOSED: $PICKER missing"; exit 2; }
if ! grep -q -- '--probe-first' "$PICKER"; then
  # The fixed picker lives on lane/mill-picker until merged; overlay it from the mirror bundle if present.
  if [ -n "${BUNDLE:-}" ] && R=$(git bundle list-heads "$BUNDLE" | awk '/lane\/mill-picker$/{print $2; exit}') && [ -n "$R" ]; then
    git fetch -q "$BUNDLE" "$R:refs/heads/_picker" && git checkout -q _picker -- "$PICKER" "$DEAD" 2>/dev/null || true
  fi
  grep -q -- '--probe-first' "$PICKER" || { echo "FAIL CLOSED: picker lacks --probe-first (unfixed picker never runs here)"; exit 2; }
fi
for k in "measured_flips" "signature"; do grep -q "$k" "$PICKER" || { echo "FAIL CLOSED: picker shape unexpected ($k)"; exit 2; }; done
command -v hf >/dev/null || pip install -q huggingface_hub >/dev/null 2>&1
command -v hf >/dev/null || { echo "FAIL CLOSED: hf CLI unavailable"; exit 2; }
mkdir -p mill-in/banks out
curl -fsSL https://huggingface.co/datasets/csoai/hub-queue/resolve/main/queue.jsonl -o mill-in/queue.jsonl || { echo "FAIL CLOSED: hub-queue queue.jsonl unreachable"; exit 2; }
QUEUE_N=$(grep -c . mill-in/queue.jsonl)
export HF_INFERENCE_TOKEN="$HF_TOKEN"

# persistent dead slugs: repo file ∪ what earlier runs published under staged-unsigned/<day>/
merge_dead() {
  local remote="$1"
  python3 - "$DEAD" "$remote" <<'PY'
import json, sys
p, remote = sys.argv[1], sys.argv[2]
rows = {}
for f in (p, remote):
    try:
        for l in open(f):
            if l.strip():
                o = json.loads(l); rows.setdefault(o["id"], o)
    except FileNotFoundError:
        pass
open(p, "w").write("".join(json.dumps(r) + "\n" for r in rows.values()))
print(len(rows))
PY
}
curl -fsSL "https://huggingface.co/datasets/${REPO}/resolve/main/${PREFIX}/dead_slugs.jsonl" -o /tmp/dead_remote.jsonl 2>/dev/null || : > /tmp/dead_remote.jsonl
DEAD_BEFORE=$(merge_dead /tmp/dead_remote.jsonl)
log "queue rows=$QUEUE_N dead slugs known=$DEAD_BEFORE day=$DAY grade=$GRADE"

# ---- per axis ----------------------------------------------------------------------------------
STATUS=COMPLETE
HALT=""
for pair in $AXES; do
  AXIS=${pair%%:*}; DS=${pair##*:}
  OUT="out/${AXIS}"; mkdir -p "$OUT"
  if ! curl -fsSL "https://huggingface.co/datasets/csoai/gspc-${DS}/resolve/main/items.jsonl" -o "mill-in/banks/${AXIS}.jsonl"; then
    log "$AXIS: no public frozen bank (csoai/gspc-${DS}) — stays UNMEASURED, nothing staged"
    printf '{"axis":"%s","status":"NO-PUBLIC-BANK","bank":"csoai/gspc-%s"}\n' "$AXIS" "$DS" > "$OUT/axis-status.json"
    continue
  fi
  MILL_RC=0
  python3 "$PICKER" --queue mill-in/queue.jsonl --out "$OUT" --axis "$AXIS" --pick 300 --grade "$GRADE" --probe-first \
    --dead "$DEAD" --banks mill-in/banks --items 30 > "$OUT/mill.log" 2>&1 || MILL_RC=$?
  # the mill's own dead file for this run is the delta; the merged persistent file is what travels
  [ -f "$OUT/dead_slugs.jsonl" ] && mv "$OUT/dead_slugs.jsonl" "$OUT/dead_slugs.new.jsonl"
  cp "$DEAD" "$OUT/dead_slugs.jsonl"
  printf '%s\n' "$STATEMENT. hits/n are card bytes, not a score. n<30 unquotable. TIE is never a win. Not a certificate." > "$OUT/UNSIGNED.txt"
  AXST=COMPLETE
  if [ "$MILL_RC" -ne 0 ]; then AXST=INCOMPLETE; STATUS=INCOMPLETE; fi
  if [ -f "$OUT/mill-report.json" ] && grep -q '"measured_flips": [1-9]' "$OUT/mill-report.json"; then
    echo "FAIL CLOSED: mill reported a MEASURED flip — this site never flips"; exit 2
  fi
  if grep -qiE 'HTTP 402|insufficient (credit|balance)|credits? (exhausted|limit)|exceeded your monthly' "$OUT/mill.log" "$OUT/skip.jsonl" 2>/dev/null; then
    HALT="$(grep -ihoE '.{0,80}(HTTP 402|insufficient (credit|balance)|credits? (exhausted|limit)|exceeded your monthly).{0,120}' "$OUT/mill.log" "$OUT/skip.jsonl" 2>/dev/null | head -1)"
    AXST=HALTED-BALANCE; STATUS=HALTED-BALANCE
  fi
  printf '{"axis":"%s","status":"%s","mill_rc":%s,"bank":"csoai/gspc-%s"}\n' "$AXIS" "$AXST" "$MILL_RC" "$DS" > "$OUT/axis-status.json"
  hf upload "$REPO" "$OUT" "${PREFIX}/${AXIS}" --repo-type dataset --commit-message "${PREFIX} ${AXIS}: UNSIGNED mill output (${AXST}; not MEASURED, not a rank)" >/dev/null
  hf upload "$REPO" "$DEAD" "${PREFIX}/dead_slugs.jsonl" --repo-type dataset --commit-message "${PREFIX}: dead_slugs.jsonl after ${AXIS}" >/dev/null
  log "$AXIS: $AXST rc=$MILL_RC staged=$( [ -f "$OUT/mill-report.json" ] && python3 -c "import json;print(len(json.load(open('$OUT/mill-report.json'))['staged_unsigned']))" || echo 0 ) uploaded ${PREFIX}/${AXIS}"
  if [ -n "$HALT" ]; then log "inference balance/credit halt (verbatim): $HALT"; break; fi
done

# ---- MANIFEST.json (coverage across all 22 axes, honestly) -------------------------------------
python3 - "$DAY" "$STATUS" "$DEAD" "$DEAD_BEFORE" "$QUEUE_N" "$STATEMENT" "$HALT" <<'PY'
import json, sys, glob, os, collections, datetime, urllib.request
day, status, dead_path, dead_before, queue_n, statement, halt = sys.argv[1:8]
axes = {}
cards = []
for st in sorted(glob.glob("out/*/axis-status.json")):
    d = os.path.dirname(st); ax = os.path.basename(d)
    a = json.load(open(st))
    rep = {}
    if os.path.exists(f"{d}/mill-report.json"):
        rep = json.load(open(f"{d}/mill-report.json"))
    hist = collections.Counter()
    if os.path.exists(f"{d}/skip.jsonl"):
        for l in open(f"{d}/skip.jsonl"):
            if l.strip():
                hist[(json.loads(l).get("reason") or "")[:90]] += 1
    staged = rep.get("staged_unsigned", [])
    for s in staged:
        cards.append({"model": s["id"], "axis": ax, "card": s["card"], "n": s["n"], "hits": s["hits"], "route": s.get("route"), "bytes": s.get("bytes"), "signature": None, "state": "STAGED-UNSIGNED"})
    axes[ax] = {"status": a["status"], "bank": a.get("bank"), "picked": rep.get("picked"), "graded": rep.get("graded"), "staged": len(staged),
                "measured_flips": rep.get("measured_flips", 0), "dead_new": rep.get("dead_new"), "skip_histogram": dict(hist.most_common(12)), "as_of": rep.get("as_of")}
dead = [json.loads(l) for l in open(dead_path) if l.strip()]
lid = None
try:
    t = json.load(urllib.request.urlopen("https://councilof.ai/api/gspc", timeout=30)).get("totals", {})
    lid = t.get("lid"); board_axes = t.get("axes")
except Exception as e:
    lid = f"UNCHECKABLE (GET /api/gspc failed: {type(e).__name__})"; board_axes = None
run_axes = [a for a, v in axes.items() if v["status"] != "NO-PUBLIC-BANK"]
manifest = {
    "kind": "csoai.gspc-staged-unsigned/0.1",
    "as_of": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    "day": day,
    "site": "hf_jobs",
    "instrument": "harness/gspc-top100/mill_hub_queue.py --pick 300 --grade 8 --probe-first --dead harness/gspc-top100/dead_slugs.jsonl --items 30",
    "status": status,
    "statement": statement,
    "lid": lid,
    "queue_rows": int(queue_n),
    "axes": axes,
    "cards": cards,
    "total_staged": len(cards),
    "dead_slugs": dead,
    "dead_slugs_known_before": int(dead_before),
    "dead_slugs_added": len(dead) - int(dead_before),
    "halt": halt or None,
    "coverage_22": {
        "board_axes_total": board_axes,
        "model_comparison_axes": 14,
        "model_comparison_with_public_bank_run_by_this_site": run_axes,
        "model_comparison_without_public_bank_not_run": {"safety": "bank is private", "continuity": "no bank", "conformance": "no bank", "openness": "no bank"},
        "deterministic_fact_axes": 8,
        "deterministic_fact_note": "the 8 fact axes are produced by the publisher adapters (XRPL / SWIFT / BENJI / notices), never by this mill; their leaves stage on master and sign in GitHub Actions",
        "never_here": ["MEASURED", "mill-cards/", "INDEX.jsonl", "cards.jsonl", "hub-queue writes", "a rank"],
    },
    "sign_path": "owner: GitHub Actions hub-queue-land.yml (or an HF Jobs runner holding BOARD_SIGN_KEY_PKCS8_B64) signs each staged card body under did:web:csoai.org#board-attestation-1, verifies VALID, writes mill-cards/signed-*.json + INDEX.jsonl, then hub-queue-flip.yml flips the (id, axis) cell. Until then every card here is UNSIGNED.",
}
json.dump(manifest, open("out/MANIFEST.json", "w"), indent=2)
print("MANIFEST", status, "axes", len(axes), "staged", len(cards), "dead", len(dead))
PY
hf upload "$REPO" out/MANIFEST.json "${PREFIX}/MANIFEST.json" --repo-type dataset --commit-message "${PREFIX}: MANIFEST.json (${STATUS}; UNSIGNED; not a rank)" >/dev/null
printf '{"day":"%s","status":"%s"}\n' "$DAY" "$STATUS" > out/LATEST.json
hf upload "$REPO" out/LATEST.json "staged-unsigned/LATEST.json" --repo-type dataset --commit-message "staged-unsigned/LATEST.json → ${DAY}" >/dev/null
log "uploaded ${PREFIX}/MANIFEST.json status=$STATUS"
case "$STATUS" in
  COMPLETE) exit 0 ;;
  HALTED-BALANCE) exit 3 ;;
  *) exit 4 ;;
esac
