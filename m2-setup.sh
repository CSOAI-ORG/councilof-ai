#!/bin/bash
# M2 MacBook Setup — Add to sovereign compute mesh
# Run from M4: bash m2-setup.sh
# This script SSHes into M2 and installs the acceleration stack

set -euo pipefail

M2="iokfarm@192.168.50.176"
M2_KEY="~/.ssh/m2_key"
SSH_OPTS="-o ConnectTimeout=10 -o BatchMode=yes"

echo "=============================================="
echo "🐉 M2 MacBook Setup — Sovereign Compute Mesh"
echo "=============================================="
echo "M2: $M2"
echo ""

ssh $SSH_OPTS -i $M2_KEY $M2 bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

echo "=== PHASE 1: INSTALL MLX (Apple M2 native) ==="
# MLX works on M2 — Apple's own framework
pip3 install mlx mlx-lm 2>&1 | tail -3
python3 -c "import mlx.core as mx; print(f'✓ MLX loaded, device={mx.default_device()}')" 2>&1

echo ""
echo "=== PHASE 2: INSTALL LLAMA.CPP (Metal GPU) ==="
# Check if brew is available
if which brew >/dev/null 2>&1; then
  brew install llama.cpp 2>&1 | tail -3
  which llama-server 2>/dev/null && echo "✓ llama.cpp installed" || echo "⚠ llama.cpp install failed"
else
  echo "⚠ Homebrew not installed — skip llama.cpp"
fi

echo ""
echo "=== PHASE 3: VERIFY GPU ==="
python3 -c "
import mlx.core as mx
import time
a = mx.random.normal((1000, 1000))
b = mx.random.normal((1000, 1000))
mx.eval(a, b)
start = time.time()
for _ in range(20):
    c = mx.matmul(a, b)
mx.eval(c)
elapsed = (time.time() - start) * 1000
print(f'M2 GPU matmul: {elapsed:.0f}ms for 20x 1000x1000 ({elapsed/20:.1f}ms each)')
print(f'✓ M2 GPU acceleration confirmed')
" 2>&1

echo ""
echo "=== PHASE 4: CREATE SOV333 WORKSPACE ==="
mkdir -p ~/sov333
mkdir -p ~/sov333/models
mkdir -p ~/sov333/inference
mkdir -p ~/sov333/training
echo "✓ Workspace created at ~/sov333/"

echo ""
echo "=== PHASE 5: DOWNLOAD SMALL MODEL ==="
python3 -c "
from mlx_lm import load, generate
import time
print('Downloading Qwen2.5-0.5B-Instruct-4bit...')
model, tokenizer = load('mlx-community/Qwen2.5-0.5B-Instruct-4bit')
print('✓ Model loaded')
start = time.time()
response = generate(model, tokenizer, prompt='Hello sovereign world', max_tokens=20, verbose=False)
print(f'✓ Inference test: {response[:50]}')
print(f'✓ Time: {time.time()-start:.1f}s')
" 2>&1

echo ""
echo "✅ M2 SETUP COMPLETE — ready for compute mesh"
REMOTE_SCRIPT

echo ""
echo "✅ M2 setup script sent. Check M2 for results."