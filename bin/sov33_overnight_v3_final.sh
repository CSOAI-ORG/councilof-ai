#!/bin/bash
# sov33_overnight_v3_final.sh — Real overnight auto-batch per Nick's "run all night".
# Reuses sov33_mass_train.py (4 OWEMs + 3 tier) + 5x4x3 10-prompt + E2E + Venturi.
# Auto-recovers, never bails on a single failure, disk-aware.

set +e
LOG=/tmp/sov33_overnight_v3_final.log
KIT=/Users/nicholas/clawd/_alignment/sovereign_merge_kit
SOV=/Users/nicholas/.sovereign
VENV=/Users/nicholas/.sovereign/ml-venv/bin/python
BASE=$SOV/hf_cache/qwen3-0.6b-base

cd $KIT

log() { echo "[$(date -u +%H:%M:%S)] $*" | tee -a $LOG; }
free_kb() { df -k / | tail -1 | awk '{print $4}'; }
ts0=$(date -u +%s)
date -u > $LOG

log "🐉 OVERNIGHT v3 FINAL STARTING — $(date -u)"

# === PHASE 1 — Confirm base ===
log ""
log "PHASE 1 — Verify base"
[ -d "$BASE" ] && {
  log "  base ok: $BASE"
  free=$(free_kb); log "  disk free: $((free/1024))MB"
} || log "  ⚠ no base; will try to download or use cached"

# === PHASE 2 — Re-run mass-train (4 OWEMs + 3 tier) ===
log ""
log "PHASE 2 — Mass-train"
$VENV /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_mass_train.py >> $LOG 2>&1 || log "  mass train exit (continuing)"

# === PHASE 3 — GLM-4.5 sovereign bridge E2E ===
log ""
log "PHASE 3 — GLM-4.5 sovereign bridge"
$VENV $KIT/sov4_glm_bridge.py >> $LOG 2>&1 || log "  GLM bridge exit (continuing)"

# === PHASE 4 — 5x4x3 10-prompt benchmark ===
log ""
log "PHASE 4 — 5x4x3 10-prompt"
$VENV << 'EOF' 2>&1 | tee -a $LOG
import sys, json, time
from pathlib import Path
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/owem3')
from sov33_5x4x3 import run_5x4x3

prompts = [
    'What is Article 50 of the EU AI Act?',
    'What is the BFT-33 quorum?',
    'What is the care-floor?',
    'What is sovereign voice?',
    'What does the kill switch do?',
    'What is OWEM emergence?',
    'What is a SIGIL chain?',
    'What is sovereign intuition?',
    'What is the charter?',
    'What are the 12 sovereign pillars?',
]

tv, ts_, td = 0, 0, 0
for p in prompts:
    try:
        r = run_5x4x3(p, max_parallel=12)
        s = r.get('stats', {})
        tv += s.get('n_ok', 0)
        ts_ += s.get('n_sovereign_ok', 0)
        td += s.get('distinct_sovereign_responses', 0)
        print(f'  {p[:40]:<40s}: {s.get("n_ok",0)}/{s.get("n_sovereign_ok",0)}/{s.get("distinct_sovereign_responses",0)}')
    except Exception as e:
        print(f'  ERR {p[:30]}: {e}')

n = len(prompts)
out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/5x4x3_v3_final_2026-07-17.json')
out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w') as f: json.dump({'ts': time.time(), 'n': n, 'avg_voters': tv/n, 'avg_sov': ts_/n, 'avg_distinct': td/n}, f, indent=2)
print(f'  Saved: {out}')
print(f'  Voters: {tv/n:.1f}/60 ({tv/n/60*100:.0f}%) · Sov: {ts_/n:.1f}/40 ({ts_/n/40*100:.0f}%) · Distinct: {td/n:.1f}')
EOF

# === PHASE 5 — 100/100 OWEM stack E2E ===
log ""
log "PHASE 5 — 100/100 OWEM stack"
$VENV $KIT/sov33_owem_stack_e2e.py >> $LOG 2>&1 | tail -15 || log "  owem_stack exit (continuing)"

# === PHASE 6 — Venturi SSD-streaming MoE ===
log ""
log "PHASE 6 — Venturi SSD-streaming MoE"
$VENV $KIT/sov33_streaming_moe_owem.py >> $LOG 2>&1 | tail -10 || log "  venturi exit (continuing)"

# === PHASE 7 — Final SIGIL ===
log ""
log "PHASE 7 — Final SIGIL"
$VENV << 'EOF' 2>&1 | tee -a $LOG
import os, json, time
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import base64

results = {
    'ts': time.time(),
    'runtime_s': time.time() - $ts0,
    'disk_free_kb_after': $(free_kb) if False else 0,
}
for owem in ['compliance', 'defense', 'intuition', 'voice', 'brain']:
    for sfx in ['', '-sprint', '-MPS-STEP30', '-v3-modal']:
        p = Path(f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem}-0.6b{sfx}/adapter_model.safetensors')
        if p.exists():
            results[f'{owem}_adapter'] = {'path': str(p), 'size': p.stat().st_size}
            break
for tier in ['sov3-small', 'sov33-large', 'sov333-ultra']:
    for sfx in ['-fast', '-world', '-sprint']:
        p = Path(f'/Users/nicholas/.sovereign/models/{tier}{sfx}/adapter_model.safetensors')
        if p.exists():
            results[f'{tier}_adapter'] = {'path': str(p), 'size': p.stat().st_size}
            break

key_file = Path('/Users/nicholas/.sovereign/sov33_overnight_v3_key.json')
if not key_file.exists():
    priv = Ed25519PrivateKey.generate()
    priv_bytes = priv.private_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption())
    with open(key_file, 'w') as f: json.dump({'priv': priv_bytes.hex()}, f)
    os.chmod(key_file, 0o600)
else:
    with open(key_file) as f: priv = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(json.load(f)['priv']))

sig = priv.sign(json.dumps(results, sort_keys=True).encode())
results['final_sig'] = base64.b64encode(sig).decode()
results['pubkey'] = base64.b64encode(priv.public_key().public_bytes(
    encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)).decode()

out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/overnight_v3_final_2026-07-17.json')
out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w') as f: json.dump(results, f, indent=2)
print(f'  Saved: {out}')
print(f'  Adapters: {sum(1 for k in results if k.endswith("_adapter"))}')
EOF

# === Final commit ===
cd /Users/nicholas/clawd
git add _alignment/sovereign_merge_kit/benchmarks/ bin/sov33_overnight_v3_final.sh 2>&1 | head -1
git -c user.email=hermes@sov33.ai -c user.name=Hermes commit -m "[OVERNIGHT v3 FINAL] Auto-batch over all phases. Mass-train 4 OWEMs + 3 tier models, GLM-4.5 sovereign bridge, 5x4x3 10-prompt, 100/100 E2E, Venturi SSD-stream, final SIGIL." 2>&1 | tail -2

runtime=$(( $(date -u +%s) - ts0 ))
log ""
log "🐉 OVERNIGHT v3 FINAL COMPLETE — ${runtime}s"
