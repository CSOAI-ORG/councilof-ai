#!/bin/bash
# mac_sovereign_launcher.sh — Start the full sovereign substrate on this M4.
# Each component is independent. Run in background via LaunchAgent or manually.

set -e
CLAWD="/Users/nicholas/clawd"
SOVEREIGN="$CLAWD/_alignment/sovereign_merge_kit"
LOG_DIR="$HOME/.sovereign/logs"

mkdir -p "$LOG_DIR"

echo "🥁 Sovereign Substrate Launcher — M4 16GB"
echo "============================================"
echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# 1. Verify Ollama is alive
echo ""
echo "[1/7] Ollama heart..."
if ! curl -sf --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "  Ollama not responding on :11434 — starting..."
    open -a Ollama
    sleep 5
fi

if curl -sf --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
    OLLAMA_MODEL=$(curl -sf http://localhost:11434/api/tags | python3 -c "import json,sys; print(json.load(sys.stdin)['models'][0]['name'])" 2>/dev/null || echo "unknown")
    echo "  ✓ Ollama alive on :11434 (model: $OLLAMA_MODEL)"
else
    echo "  ✗ Ollama FAILED to start"
fi

# 2. SOV3 MEOK MCP gateway
echo ""
echo "[2/7] SOV3 MEOK MCP gateway..."
if curl -sf --max-time 3 http://localhost:8888/api/status >/dev/null 2>&1; then
    SOV3_STATUS=$(curl -sf http://localhost:8888/api/status | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
    echo "  ✓ SOV3 :8888 alive (status: $SOV3_STATUS)"
else
    echo "  ⚠️  SOV3 :8888 not responding"
fi

# 3. uvicorn backend
echo ""
echo "[3/7] uvicorn backend (:8000)..."
if curl -sI --max-time 3 http://localhost:8000/ 2>&1 | grep -q "200\|404"; then
    echo "  ✓ uvicorn alive on :8000"
else
    echo "  ⚠️  uvicorn :8000 not responding"
fi

# 4. DRUM heartbeat (1s quick test)
echo ""
echo "[4/7] DRUM heartbeat..."
if [ -f "$SOVEREIGN/drum/drum_heartbeat.py" ]; then
    python3 "$SOVEREIGN/drum/drum_heartbeat.py" 10 > "$LOG_DIR/drum.log" 2>&1 &
    DRUM_PID=$!
    sleep 12
    if kill -0 $DRUM_PID 2>/dev/null; then
        kill $DRUM_PID 2>/dev/null || true
    fi
    if grep -q "complete" "$LOG_DIR/drum.log"; then
        LAST_DIGEST=$(tail -1 "$LOG_DIR/drum.log" | grep -oE 'digest: [a-f0-9]{16}' | head -1)
        echo "  ✓ DRUM ran for 10s, $LAST_DIGEST"
    else
        echo "  ⚠️  DRUM check $LOG_DIR/drum.log"
    fi
else
    echo "  ✗ DRUM script missing"
fi

# 5. Sovereign Mindset Flywheel (1 cycle)
echo ""
echo "[5/7] Mindset Flywheel (1 cycle)..."
if [ -f "$SOVEREIGN/mindset/principle_6_compounding_flywheel.py" ]; then
    python3 "$SOVEREIGN/mindset/principle_6_compounding_flywheel.py" 1 > "$LOG_DIR/flywheel.log" 2>&1
    if [ $? -eq 0 ]; then
        GATE=$(grep -oE 'gate=[0-9.]+' "$LOG_DIR/flywheel.log" | tail -1)
        echo "  ✓ Mindset Flywheel: $GATE"
    else
        echo "  ⚠️  Mindset Flywheel exit non-zero"
    fi
else
    echo "  ✗ Mindset Flywheel missing"
fi

# 6. Sovereign Framework Forge (1 cycle)
echo ""
echo "[6/7] Framework Forge (1 cycle)..."
if [ -f "$SOVEREIGN/framework_forge/principle_7_framework_forge.py" ]; then
    python3 "$SOVEREIGN/framework_forge/principle_7_framework_forge.py" 1 > "$LOG_DIR/forge.log" 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✓ Framework Forge ran"
    fi
else
    echo "  ✗ Framework Forge missing"
fi

# 7. OWEM sample (head only)
echo ""
echo "[7/7] SOV33³ OWEM v3.0 sample..."
if [ -f "$SOVEREIGN/sov33_owem_v3.py" ]; then
    python3 "$SOVEREIGN/sov33_owem_v3.py" > "$LOG_DIR/owem.log" 2>&1 &
    OWEM_PID=$!
    sleep 14
    kill $OWEM_PID 2>/dev/null || true
    if [ -s "$LOG_DIR/owem.log" ]; then
        echo "  ✓ OWEM ran (head of $(wc -l < "$LOG_DIR/owem.log") lines)"
    else
        echo "  ⚠️  OWEM check $LOG_DIR/owem.log"
    fi
else
    echo "  ✗ OWEM missing"
fi

echo ""
echo "🥁 Sovereign Substrate Launcher — DONE"
echo "============================================"
echo ""
echo "Logs:    $LOG_DIR/"
echo "SIGIL:   $HOME/.sovereign/"
echo ""
echo "Run interactively:"
echo "  Ollama:   curl http://localhost:11434/api/tags"
echo "  SOV3:     curl http://localhost:8888/api/status"
echo "  uvicorn:  curl -sI http://localhost:8000/"
echo "  DRUM:     python3 $SOVEREIGN/drum/drum_heartbeat.py 60"
echo "  Flywheel: python3 $SOVEREIGN/mindset/principle_6_compounding_flywheel.py 3"
echo "  Forge:    python3 $SOVEREIGN/framework_forge/principle_7_framework_forge.py 3"
echo "  OWEM:     python3 $SOVEREIGN/sov33_owem_v3.py"
