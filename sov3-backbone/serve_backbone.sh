#!/usr/bin/env bash
# ============================================================================
# serve_backbone.sh — SOV3 Sovereign-Offline Backbone bootstrap
# ----------------------------------------------------------------------------
# Provisions the LOCAL sovereign tier of the SOV3 router:
#   DeepSeek-V4-Flash (MIT)  ->  quantize Q4_K_M  ->  serve via llama.cpp
#
# SAFETY: The ~80GB weight download is GATED. Nothing huge runs unless you
# explicitly set  SOV3_ALLOW_DOWNLOAD=1  AND uncomment the download block.
# Running this script with no env set only checks tooling + prints a plan.
#
# DO NOT run the download on the 16GB / ~6.5GB-free M4 laptop. Target a box
# with >=120GB free disk and >=64GB RAM (or a rented GPU). See HARDWARE notes
# at the bottom of this file.
# ============================================================================
set -euo pipefail

# ---- Config (override via env) ---------------------------------------------
MODEL_REPO="${SOV3_MODEL_REPO:-deepseek-ai/DeepSeek-V4-Flash}"   # MIT license
WORKDIR="${SOV3_WORKDIR:-$HOME/sov3-models}"
HF_DIR="$WORKDIR/DeepSeek-V4-Flash-hf"          # raw HF weights (~80GB BF16)
GGUF_F16="$WORKDIR/DeepSeek-V4-Flash-f16.gguf"  # converted, full precision
GGUF_Q4="$WORKDIR/DeepSeek-V4-Flash-Q4_K_M.gguf" # quantized target (~serve this)
LLAMA_DIR="${SOV3_LLAMA_DIR:-$WORKDIR/llama.cpp}"
QUANT="${SOV3_QUANT:-Q4_K_M}"
SERVE_PORT="${SOV3_PORT:-8080}"
SERVE_CTX="${SOV3_CTX:-16384}"
SERVE_NGL="${SOV3_NGL:-999}"   # offload all layers to GPU/Metal where available

echo "=== SOV3 backbone bootstrap ==="
echo "    repo:   $MODEL_REPO (MIT)"
echo "    work:   $WORKDIR"
echo "    quant:  $QUANT  ->  $GGUF_Q4"
echo "    serve:  127.0.0.1:$SERVE_PORT  (ctx=$SERVE_CTX)"
echo

mkdir -p "$WORKDIR"

# ---- Step 0: tooling check (cheap, always runs) ----------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "MISSING: $1"; MISSING=1; }; }
MISSING=0
need git
need cmake
need python3
if ! command -v huggingface-cli >/dev/null 2>&1; then
  echo "NOTE: huggingface-cli not found (pip install -U 'huggingface_hub[cli]')"
fi
[ "$MISSING" = "1" ] && echo "Install the MISSING tools before proceeding."

# ---- Step 1: build llama.cpp (small clone, ~hundreds of MB) -----------------
# Guarded so a bare run does not compile unless you ask for it.
if [ "${SOV3_BUILD_LLAMA:-0}" = "1" ]; then
  if [ ! -d "$LLAMA_DIR" ]; then
    git clone --depth 1 https://github.com/ggml-org/llama.cpp "$LLAMA_DIR"
  fi
  cmake -S "$LLAMA_DIR" -B "$LLAMA_DIR/build" -DGGML_METAL=ON
  cmake --build "$LLAMA_DIR/build" --config Release -j
  echo "llama.cpp built -> $LLAMA_DIR/build/bin"
else
  echo "[skipped] llama.cpp build. Set SOV3_BUILD_LLAMA=1 to build."
fi

# ============================================================================
# Step 2: GATED WEIGHT DOWNLOAD  (~80GB)  <-- THE BIG ONE
# ----------------------------------------------------------------------------
# This block is DOUBLE-GUARDED:
#   (1) the env flag SOV3_ALLOW_DOWNLOAD must equal 1, AND
#   (2) the command below must be UNCOMMENTED by hand.
# This makes accidental 80GB pulls effectively impossible.
# ============================================================================
if [ "${SOV3_ALLOW_DOWNLOAD:-0}" = "1" ]; then
  echo ">>> SOV3_ALLOW_DOWNLOAD=1 set. Download is permitted IF uncommented."
  echo ">>> Free disk needed: ~200GB (80 raw + ~80 f16 gguf + ~45 Q4)."

  # --- UNCOMMENT THE NEXT LINE WHEN NICK SAYS GO -----------------------------
  # huggingface-cli download "$MODEL_REPO" --local-dir "$HF_DIR" --local-dir-use-symlinks False

  echo ">>> (download line is still commented — nothing downloaded)"
else
  echo "[gated] weight download. Set SOV3_ALLOW_DOWNLOAD=1 AND uncomment the"
  echo "        huggingface-cli line in this script to fetch ~80GB. Skipping."
fi

# ---- Step 3: convert HF -> GGUF f16 (only if weights exist) -----------------
if [ -d "$HF_DIR" ] && [ ! -f "$GGUF_F16" ]; then
  python3 "$LLAMA_DIR/convert_hf_to_gguf.py" "$HF_DIR" --outfile "$GGUF_F16" --outtype f16
else
  echo "[skipped] HF->GGUF convert (weights absent or f16 already present)."
fi

# ---- Step 4: quantize f16 -> Q4_K_M ----------------------------------------
if [ -f "$GGUF_F16" ] && [ ! -f "$GGUF_Q4" ]; then
  "$LLAMA_DIR/build/bin/llama-quantize" "$GGUF_F16" "$GGUF_Q4" "$QUANT"
else
  echo "[skipped] quantize (f16 absent or Q4 already present)."
fi

# ---- Step 5: serve (OpenAI-compatible /v1 endpoint on localhost) ------------
if [ -f "$GGUF_Q4" ]; then
  echo ">>> serving $GGUF_Q4 on 127.0.0.1:$SERVE_PORT"
  exec "$LLAMA_DIR/build/bin/llama-server" \
    --model "$GGUF_Q4" \
    --host 127.0.0.1 --port "$SERVE_PORT" \
    --ctx-size "$SERVE_CTX" \
    --n-gpu-layers "$SERVE_NGL" \
    --jinja
else
  echo "[not serving] Q4 model absent. Complete the gated steps first."
fi

# ============================================================================
# HARDWARE / DISK NOTES
# ----------------------------------------------------------------------------
# DeepSeek-V4-Flash is a large MoE. Plan for:
#   * raw BF16 HF weights : ~80 GB
#   * intermediate f16 GGUF: ~80 GB (delete after quantize to reclaim)
#   * final Q4_K_M GGUF    : ~40-50 GB  <-- this is what you serve
#   -> peak transient disk : ~200 GB ; steady-state : ~45 GB
#
# To actually RUN Q4_K_M inference you want RAM/VRAM >= the Q4 file (~45GB)
# plus KV cache headroom. The current M4 laptop (16GB RAM, ~6.5GB free disk)
# CANNOT do this. Options when Nick gives the go:
#   1. Rented GPU (e.g. 1xH100/A100 80GB or 2xA6000) — fastest, cleanest.
#   2. A Mac Studio / box with >=64GB unified mem + >=250GB free SSD.
#   3. External NVMe (>=250GB) attached for the convert/quantize staging.
# After producing the ~45GB Q4 GGUF once, only that file needs to travel.
# ============================================================================
