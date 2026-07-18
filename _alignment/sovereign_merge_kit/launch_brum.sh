#!/bin/bash
# launch_brum.sh — get the BRUM engine MOVING (run in a REAL terminal on the Mac, not the sandbox).
# Starts the governed SOV endpoint with BRUM as the router: request -> BRUM route -> brain -> care-gate -> SIGIL -> out.
set -e
cd "$(dirname "$0")"

export SOV33_SIGIL_DIR="${SOV33_SIGIL_DIR:-$HOME/.sovereign}"
export PYTHONPATH="$PWD:$PYTHONPATH"
export SOV_SHIM_PORT="${SOV_SHIM_PORT:-8802}"
mkdir -p "$SOV33_SIGIL_DIR"

# --- auto-use local venv if present (so sklearn/joblib -> the 72% trained router) ---
if [ -f "$PWD/.venv/bin/activate" ]; then
  source "$PWD/.venv/bin/activate"
  echo "  [venv] using $PWD/.venv (trained router available if sklearn installed here)"
else
  echo "  [venv] none found — create one for the 72% router:"
  echo "         python3 -m venv .venv && source .venv/bin/activate && pip install scikit-learn joblib"
fi

# --- free the port if a stale BRUM is already holding it (fixes 'Address already in use') ---
if lsof -ti:"$SOV_SHIM_PORT" >/dev/null 2>&1; then
  echo "  [port] $SOV_SHIM_PORT already in use — stopping the stale server first"
  lsof -ti:"$SOV_SHIM_PORT" | xargs kill 2>/dev/null || true
  sleep 1
fi

echo "=== BRUM ENGINE PREFLIGHT ==="
python3 - <<'PY'
import sys
ok = True
# 1. trained router present?
try:
    import sov33_brum, sov33_trained_router
    r = sov33_brum.drive("preflight: does this comply with GDPR?")
    print(f"  BRUM router: OK (method={r['route_method']})")
except Exception as e:
    print(f"  BRUM router: MISSING ({e}) — run _train_router.py first"); ok=False
# 2. care-gate present?
try:
    from sov33_care_local import score_local, FLOOR
    print(f"  care-gate: OK (floor={FLOOR})")
except Exception as e:
    print(f"  care-gate: MISSING ({e})"); ok=False
# 3. SIGIL present?
try:
    from sov33_ed25519_sigil import Ed25519Sigil
    print("  SIGIL: OK")
except Exception as e:
    print(f"  SIGIL: MISSING ({e})"); ok=False
# 4. model endpoint? (the honest gap — BRUM routes, but a brain must generate)
import os
has_online = any(os.environ.get(k) for k in ("NVIDIA_API_KEY","OCI_CONFIG","GROQ_API_KEY"))
print(f"  model endpoint: {'online tier keys present' if has_online else 'NONE — BRUM routes but no brain to generate (load an adapter or set an online key)'}")
sys.exit(0 if ok else 1)
PY

echo ""
echo "=== STARTING GOVERNED ENDPOINT on http://localhost:${SOV_SHIM_PORT}/v1 ==="
echo "  BRUM routes -> brain generates -> care-gate (floor) -> SIGIL sign -> response"
echo "  Point Open WebUI / any OpenAI client at http://localhost:${SOV_SHIM_PORT}/v1"
echo "  Ctrl-C to stop. To run detached: nohup ./launch_brum.sh > brum.log 2>&1 &"
echo ""
exec python3 sov_openai_shim.py
