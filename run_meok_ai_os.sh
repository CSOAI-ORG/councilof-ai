#!/usr/bin/env bash
# MEOK AI OS — sovereign substrate runner.
#
# Stand up the Python venv, install deps, generate SIGIL keys, clone the
# Cesium for UE plugin if missing, start the IoT relay, and document the
# next steps for booting the UE5 editor.
#
# Re-runnable: safe to invoke multiple times.
set -euo pipefail

cd "$(dirname "$0")"
PROJ_ROOT="$(pwd)/meok-ai-os-ue5"
PY_DIR="${PROJ_ROOT}/Python"
VENV="${HOME}/.meok/venv"
SIGIL_DIR="${HOME}/.meok/sigil"
CESIUM_DIR="${HOME}/.meok/CesiumForUnreal"

# ---------------------------------------------------------------------------
# Pretty banner
# ---------------------------------------------------------------------------
cat <<'BANNER'
  ┌───────────────────────────────────────────────────────────────┐
  │  MEOK AI OS — sovereign substrate runner                     │
  │  13 Queens | 11 Temples | 7 Archetypes | 22 Arcana | 33 Hives│
  └───────────────────────────────────────────────────────────────┘
BANNER

# ---------------------------------------------------------------------------
# 0. Sanity
# ---------------------------------------------------------------------------
if [[ ! -d "${PROJ_ROOT}" ]]; then
  echo "[MEOK] project directory missing: ${PROJ_ROOT}" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Python venv + deps
# ---------------------------------------------------------------------------
PYTHON_BIN="${PYTHON_BIN:-python3}"
mkdir -p "${HOME}/.meok"
if [[ ! -d "${VENV}" ]]; then
  echo "[MEOK] creating venv at ${VENV}"
  "${PYTHON_BIN}" -m venv "${VENV}"
fi
# shellcheck source=/dev/null
source "${VENV}/bin/activate"
pip install --quiet --upgrade pip wheel

echo "[MEOK] installing runtime deps (best-effort, graceful on missing wheels)"
pip install --quiet fastapi 'uvicorn[standard]' pydantic httpx paho-mqtt pyyaml \
                   || true
# Optional — only present if user has them locally; these are NOT required
# for the test suite to pass.
pip install --quiet kokoro-onnx faster-whisper soundfile 2>/dev/null || true

# ---------------------------------------------------------------------------
# 2. Cesium for UE — clone if missing
# ---------------------------------------------------------------------------
mkdir -p "${HOME}/.meok"
if [[ ! -d "${CESIUM_DIR}/.git" ]]; then
  echo "[MEOK] cloning Cesium for Unreal (shallow) → ${CESIUM_DIR}"
  git clone --depth 1 https://github.com/CesiumGS/cesium-unreal.git "${CESIUM_DIR}" \
       || echo "[MEOK] WARNING: cesium clone failed (offline?) — install the plugin manually."
else
  echo "[MEOK] cesium-unreal already present at ${CESIUM_DIR}"
fi

# ---------------------------------------------------------------------------
# 3. SIGIL chain bootstrap — generate the sovereign root key
# ---------------------------------------------------------------------------
mkdir -p "${SIGIL_DIR}"
SIGIL_CHAIN="${SIGIL_DIR}/chain.jsonl"
if [[ ! -s "${SIGIL_CHAIN}" ]]; then
  echo "[MEOK] bootstrapping SIGIL chain at ${SIGIL_CHAIN}"
  python "${PY_DIR}/meok_bridge.py" \
      sigil_append "${SIGIL_CHAIN}" "king.oversight" "sovereign.boot" \
      "{\"who\":\"MEOK\",\"when\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
      >/dev/null
fi

# Generate 13 queen identities (one per council seat)
QUEEN_DOMAINS=(queen.audit queen.governance queen.justice queen.finance \
               queen.architecture queen.health queen.education queen.environment \
               queen.comms queen.defense queen.diplomacy queen.research queen.culture)
QUEEN_SIGILS=(Jude Aya Sibyl Theodora Vyrta Asha Sibilla Rana Lyra Bast Inara Mhet Ceridwen)
for i in "${!QUEEN_DOMAINS[@]}"; do
  id="${SIGIL_DIR}/queen_${i}_identity.json"
  if [[ ! -s "${id}" ]]; then
    python "${PY_DIR}/meok_bridge.py" identity_generate \
        "${QUEEN_DOMAINS[$i]}" "$i" "${QUEEN_SIGILS[$i]}" > "${id}"
  fi
done
echo "[MEOK] SIGIL: 13 queen identities seeded at ${SIGIL_DIR}"

# ---------------------------------------------------------------------------
# 4. Sanity probes (no editor required)
# ---------------------------------------------------------------------------
echo "[MEOK] banner:" &&       python "${PY_DIR}/meok_bridge.py" banner
echo "[MEOK] council_seats:" && python "${PY_DIR}/meok_bridge.py" council_seats | head -c 240; echo
echo "[MEOK] hive_geo:" &&      python "${PY_DIR}/meok_bridge.py" hive_geo | head -c 200; echo
echo "[MEOK] bft_tally 9/13:" && python "${PY_DIR}/meok_bridge.py" bft_tally 9 4 0 0 13
python "${PY_DIR}/meok_bridge.py" sigil_verify "${SIGIL_CHAIN}"

# ---------------------------------------------------------------------------
# 5. IoT relay (background) — only if not already up
# ---------------------------------------------------------------------------
if ! curl -sS --max-time 1 "http://localhost:${MEOK_RELAY_PORT:-8810}/health" >/dev/null 2>&1; then
  echo "[MEOK] starting IoT relay on :${MEOK_RELAY_PORT:-8810}"
  nohup python "${PY_DIR}/meok_iot_relay.py" > "${HOME}/.meok/iot_relay.log" 2>&1 &
  sleep 1
  curl -sS "http://localhost:${MEOK_RELAY_PORT:-8810}/health" || true
else
  echo "[MEOK] IoT relay already running"
fi

# ---------------------------------------------------------------------------
# 6. Run the test suite (10 plugins × ≥10 tests = 50+)
# ---------------------------------------------------------------------------
echo "[MEOK] running 50-test suite"
(cd "${PROJ_ROOT}/.." && python -m pytest test_meok_ue5.py -q --tb=short 2>&1 | tail -n 40)

# ---------------------------------------------------------------------------
# 7. Next steps for the operator
# ---------------------------------------------------------------------------
cat <<'NEXT'

[MEOK] substrate is live. Next steps for the operator:

  1) Open the project in UE5 5.8
       open -a "Epic Games Launcher"           # macOS
       /opt/UnrealEngine_5.8/Engine/Binaries/Linux/UnrealEditor \
            "$(pwd)/meok-ai-os-ue5/MEOK_AI_OS.uproject"   # Linux
       "C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" ^
            "meok-ai-os-ue5\MEOK_AI_OS.uproject"           # Windows

  2) Verify the editor menu shows 33 hive entries + 6 sections
       (init_unreal.py registers them automatically on editor startup)

  3) Set MEOK_CESIUM_TOKEN in your env for 3D Earth:
       export MEOK_CESIUM_TOKEN="your_ion_token"
       # without a token the globe renders 33 hive markers on a flat grid

  4) Package for Linux:
       ./meok-ai-os-ue5/Packaging/build.sh

  5) Ship to the sovereign pixel-stream fleet:
       export MEOK_STREAM_BIN=$(which meok-stream || echo "meok-stream")
       ./meok-ai-os-ue5/Packaging/pixel_stream.sh

NEXT
