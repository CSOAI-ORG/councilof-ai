#!/bin/bash
# MEOK 4× Quantum Brain — 4-quadrant SOV3 mesh starter
# Per the napkin master spec (sov3_4x_quantum_brain_v1)
# 4 quadrants × 33 council members = 132-hive mesh

set -e

# Per-quadrant config
declare -A QUADRANTS=(
  ["keystone"]="3101"
  ["governance"]="3102"
  ["compliance-fleet"]="3103"
  ["utility-fleet"]="3104"
)
declare -A QUADRANT_LABELS=(
  ["keystone"]="Q1 Heart"
  ["governance"]="Q2 Immune"
  ["compliance-fleet"]="Q3 Liver"
  ["utility-fleet"]="Q4 Digestive"
)

SOV3_DIR="/data/sov3"
PY="/home/nicholas/sov3/.venv/bin/python"
LOG_DIR="/tmp/4x-mesh"
mkdir -p "$LOG_DIR"

echo "=== MEOK 4× Quantum Brain — Starting 4-quadrant SOV3 mesh ==="
echo ""

# Start each quadrant
for quadrant in keystone governance compliance-fleet utility-fleet; do
  port="${QUADRANTS[$quadrant]}"
  label="${QUADRANT_LABELS[$quadrant]}"
  logfile="$LOG_DIR/${quadrant}-${port}.log"
  pidfile="$LOG_DIR/${quadrant}-${port}.pid"

  if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  ✅ $label (:$port) already UP — skipping"
    continue
  fi

  echo "  🚀 Starting $label (:$port)..."
  cd "$SOV3_DIR"
  PYTHONPATH="$SOV3_DIR" $PY -m gunicorn sovereign-mcp-server:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 1 \
    --bind 0.0.0.0:$port \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --timeout 120 \
    --graceful-timeout 30 \
    --access-logfile "$logfile" \
    --error-logfile "$logfile" \
    --log-level info \
    --pid "$pidfile" \
    --daemon

  # Wait for the port to be listening
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -1)
      echo "  ✅ $label (:$port) UP — PID $pid, log $logfile"
      break
    fi
  done
done

echo ""
echo "=== 4× QUANTUM BRAIN MESH STATUS ==="
for quadrant in keystone governance compliance-fleet utility-fleet; do
  port="${QUADRANTS[$quadrant]}"
  label="${QUADRANT_LABELS[$quadrant]}"
  if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  ✅ $label (:$port) UP"
  else
    echo "  ❌ $label (:$port) DOWN — check $LOG_DIR/${quadrant}-${port}.log"
  fi
done

echo ""
echo "=== NEXT STEPS ==="
echo "  1. Re-register 33 council members on each quadrant (132 total)"
echo "  2. Wire the 12-lens audit to route across all 4 instances"
echo "  3. Run a 4-quadrant BFT decision end-to-end"
echo "  4. Verify the 19,008 audit/cycle theoretical number"
echo ""
echo "Logs: $LOG_DIR/{keystone,governance,compliance-fleet,utility-fleet}-{{port}}.log"
