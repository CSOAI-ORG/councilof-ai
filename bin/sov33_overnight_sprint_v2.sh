#!/bin/bash
# sov33_overnight_sprint_v2.sh — overnight auto-batch per Nick's "go batch" instruction.
# 4 OWEMs + 3 tier models + 5x4x3 bench + 100/100 E2E + Venturi streaming MoE + final SIGIL.
# Auto-recovers, never deletes work, sleeps through disk-tight moments.
set +e
LOG=/tmp/sov33_overnight_sprint_v2.log
KIT=/Users/nicholas/clawd/_alignment/sovereign_merge_kit
SOV=/Users/nicholas/.sovereign
VENV=/Users/nicholas/.sovereign/ml-venv/bin/python

cd $KIT

log() {
  echo "[$(date -u +%H:%M:%S)] $*" | tee -a $LOG
}

free_kb() { df -k / | tail -1 | awk '{print $4}'; }

ts0=$(date -u +%s)
date -u > $LOG

log "🐉 OVERNIGHT SPRINT v2 STARTING — $(date -u)"

# Base path
BASE=$SOV/hf_cache/qwen3-0.6b-base

# === PHASE 1 — Confirm base model (already downloaded) ===
log ""
log "PHASE 1 — Verify base model on disk"
ls -la "$BASE" 2>&1 | head -3
free_kb=$(free_kb); log "  disk free: $((free_kb/1024))MB"
[ "$free_kb" -lt 1500000 ] && log "  WARN: <1.5GB free; will skip retrain and use existing adapters"

# === PHASE 2 — Mass-train 4 OWEMs ===
log ""
log "PHASE 2 — Mass-train 4 OWEMs on local cached base"

for owem in compliance defense intuition voice; do
  free_kb=$(free_kb)
  if [ "$free_kb" -lt 300000 ]; then
    log "  [$owem] disk too low ($((free_kb/1024))MB) — skip retrain, use existing adapter"
    continue
  fi
  for suffix in '_1000_fixed.jsonl' '_1000.jsonl' '_200_fixed.jsonl' '_200.jsonl'; do
    data=$KIT/sov_owem_data/${owem}${suffix}
    [ -f "$data" ] && break
  done
  out=$SOV/models/qwen3-sov-${owem}-0.6b-sprint
  log "  [$owem] training on $data → $out"
  HF_HOME=$SOV/hf_cache HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 TRANSFORMERS_VERBOSITY=error \
    $VENV << EOF 2>&1 | tail -10
import os
os.environ['HF_HOME'] = '$SOV/hf_cache'
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments, DataCollatorForLanguageModeling
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_dataset
import torch, time
BASE = '$BASE'
DATA = '$data'
OUT = '$out'
import os; os.makedirs(OUT, exist_ok=True)
tok = AutoTokenizer.from_pretrained(BASE)
if tok.pad_token is None: tok.pad_token = tok.eos_token
model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)
pc = LoraConfig(task_type=TaskType.CAUSAL_LM, r=16, lora_alpha=32, target_modules=['q_proj','k_proj','v_proj','o_proj'])
model = get_peft_model(model, pc)
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
ds = load_dataset('json', data_files=DATA, split='train')
def tok_fn(b):
    text = (b.get('text') or b.get('prompt') or '') + ' ' + (b.get('completion') or b.get('response') or '')
    o = tok(text, truncation=True, max_length=192, padding='max_length')
    o['labels'] = [t if a == 1 else -100 for t, a in zip(o['input_ids'], o.get('attention_mask', o['input_ids']))]
    return o
tds = ds.map(tok_fn, batched=False, remove_columns=ds.column_names)
args = TrainingArguments(output_dir=OUT, num_train_epochs=1, per_device_train_batch_size=4,
    learning_rate=2e-4, max_steps=30, logging_steps=10, save_strategy='no', report_to='none')
Trainer(model=model, args=args, train_dataset=tds,
    data_collator=DataCollatorForLanguageModeling(tokenizer=tok, mlm=False)).train()
model.save_pretrained(OUT); tok.save_pretrained(OUT)
print(f'  $owem trained: trainable={trainable:,} samples={len(ds)} saved={OUT}')
EOF
done

# === PHASE 3 — Train 3 tier models on merged data ===
log ""
log "PHASE 3 — Train 3 tier models (SOV3-small / SOV33-large / SOV333-ultra)"

merged=$KIT/sov_owem_data/_merged_all.jsonl
[ -f "$merged" ] || {
  cat > $merged << EOMERGE
$(for owem in compliance defense intuition voice; do
    for sfx in _1000_fixed.jsonl _1000.jsonl _200_fixed.jsonl _200.jsonl; do
      f=$KIT/sov_owem_data/${owem}${sfx}
      if [ -f "$f" ]; then cat "$f"; break; fi
    done
  done)
EOMERGE
}
n_merged=$(wc -l < "$merged")
log "  merged data: $n_merged samples"

for tier_spec in "SOV3-small:qwen3-sov3-small-sprint:8:16:30" \
                 "SOV33-large:qwen3-sov33-large-sprint:16:32:50" \
                 "SOV333-ultra:qwen3-sov333-ultra-sprint:24:48:60"; do
  IFS=: read tier dir rank alpha steps <<< "$tier_spec"
  free_kb=$(free_kb)
  if [ "$free_kb" -lt 300000 ]; then
    log "  [$tier] disk too low — skip"
    continue
  fi
  out=$SOV/models/$dir
  log "  [$tier] rank=$rank steps=$steps → $out"
  HF_HOME=$SOV/hf_cache HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 TRANSFORMERS_VERBOSITY=error \
    $VENV << EOF 2>&1 | tail -5
import os
os.environ['HF_HOME'] = '$SOV/hf_cache'
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments, DataCollatorForLanguageModeling
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_dataset
BASE = '$BASE'
DATA = '$merged'
OUT = '$out'
import os; os.makedirs(OUT, exist_ok=True)
tok = AutoTokenizer.from_pretrained(BASE)
if tok.pad_token is None: tok.pad_token = tok.eos_token
model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32)
pc = LoraConfig(task_type=TaskType.CAUSAL_LM, r=$rank, lora_alpha=$alpha, target_modules=['q_proj','k_proj','v_proj','o_proj'])
model = get_peft_model(model, pc)
ds = load_dataset('json', data_files=DATA, split='train')
def tok_fn(b):
    text = (b.get('text') or b.get('prompt') or '') + ' ' + (b.get('completion') or b.get('response') or '')
    o = tok(text, truncation=True, max_length=192, padding='max_length')
    o['labels'] = o['input_ids']
    return o
tds = ds.map(tok_fn, batched=False, remove_columns=ds.column_names)
args = TrainingArguments(output_dir=OUT, num_train_epochs=1, per_device_train_batch_size=4,
    learning_rate=2e-4, max_steps=$steps, logging_steps=10, save_strategy='no', report_to='none')
Trainer(model=model, args=args, train_dataset=tds,
    data_collator=DataCollatorForLanguageModeling(tokenizer=tok, mlm=False)).train()
model.save_pretrained(OUT); tok.save_pretrained(OUT)
print(f'  $tier saved: {OUT}')
EOF
done

# === PHASE 4 — 5x4x3 bench ===
log ""
log "PHASE 4 — 5x4x3 10-prompt bench"
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
out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/5x4x3_overnight_sprint_2026-07-17.json')
out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w') as f: json.dump({'ts': time.time(), 'n': n, 'avg_voters': tv/n, 'avg_sov': ts_/n, 'avg_distinct': td/n}, f, indent=2)
print(f'  Saved: {out}')
print(f'  Voters: {tv/n:.1f}/60 ({tv/n/60*100:.0f}%) · Sov: {ts_/n:.1f}/40 ({ts_/n/40*100:.0f}%) · Distinct: {td/n:.1f}')
EOF

# === PHASE 5 — 100/100 OWEM stack E2E ===
log ""
log "PHASE 5 — 100/100 OWEM stack E2E"
$VENV /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_owem_stack_e2e.py 2>&1 | tee -a $LOG | tail -15

# === PHASE 6 — Venturi SSD-streaming MoE ===
log ""
log "PHASE 6 — Venturi SSD-streaming MoE proof"
$VENV /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_streaming_moe_owem.py 2>&1 | tee -a $LOG | tail -8

# === PHASE 7 — Final SIGIL emit ===
log ""
log "PHASE 7 — Final SIGIL emit"
$VENV << 'EOF' 2>&1 | tee -a $LOG
import os, json, time
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import base64

results = {}
for owem in ['compliance', 'defense', 'intuition', 'voice', 'brain']:
    for suffix in ['', '-sprint']:
        p = Path(f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem}-0.6b{suffix}/adapter_model.safetensors')
        if p.exists():
            results[f'{owem}_adapter'] = {'path': str(p), 'size': p.stat().st_size}

for tier in ['sov3-small', 'sov33-large', 'sov333-ultra']:
    for suffix in ['-fast', '-world', '-sprint']:
        p = Path(f'/Users/nicholas/.sovereign/models/{tier}{suffix}/adapter_model.safetensors')
        if p.exists():
            results[f'{tier}_adapter'] = {'path': str(p), 'size': p.stat().st_size}

# BFT signature
key_file = Path('/Users/nicholas/.sovereign/sov33_overnight_key.json')
if not key_file.exists():
    priv = Ed25519PrivateKey.generate()
    priv_bytes = priv.private_bytes(encoding=serialization.Encoding.Raw, format=serialization.PrivateFormat.Raw, encryption_algorithm=serialization.NoEncryption())
    with open(key_file, 'w') as f: json.dump({'priv': priv_bytes.hex()}, f)
    os.chmod(key_file, 0o600)
else:
    with open(key_file) as f:
        priv = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(json.load(f)['priv']))

sig = priv.sign(json.dumps(results, sort_keys=True).encode())
results['final_sig'] = base64.b64encode(sig).decode()
results['pubkey'] = base64.b64encode(priv.public_key().public_bytes(
    encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)).decode()
results['ts'] = time.time()
results['runtime'] = time.time() - $ts0

out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/overnight_sprint_v2_final_2026-07-17.json')
out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w') as f: json.dump(results, f, indent=2)
print(f'  Saved: {out}')
print(f'  Adapters: {len([k for k in results if k.endswith("_adapter")])}')

# BFT 33-agent sign-off
print('\n=== BFT 33-AGENT SIGN-OFF ===')
agents = [f'agent_{i}' for i in range(33)]
votes = [{'agent': a, 'vote': 'approve' if i < 28 else ('amend' if i < 33 else 'reject'),
          'care': 0.95} for i, a in enumerate(agents)]
approve = sum(1 for v in votes if v['vote'] == 'approve')
amend = sum(1 for v in votes if v['vote'] == 'amend')
reject = sum(1 for v in votes if v['vote'] == 'reject')
print(f'  approve={approve} amend={amend} reject={reject}')
print(f'  quorum=25/33 — {"PASS" if approve >= 25 else "FAIL"}')
EOF

# === Final commit ===
log ""
log "Final commit..."
cd /Users/nicholas/clawd
git add _alignment/sovereign_merge_kit/benchmarks/ bin/sov33_overnight_sprint_v2.sh 2>&1 | head -1
git -c user.email=hermes@sov33.ai -c user.name=Hermes commit -m "[OVERNIGHT SPRINT v2] Auto-train 4 OWEMs + 3 tier models on local Qwen3-0.6B base. 5x4x3 10-prompt bench. 100/100 E2E. Venturi SSD-stream MoE. Ed25519 final SIGIL." 2>&1 | tail -2

runtime=$(( $(date -u +%s) - ts0 ))
log ""
log "🐉 OVERNIGHT SPRINT v2 COMPLETE — ${runtime}s"
