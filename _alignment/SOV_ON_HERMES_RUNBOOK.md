# Runbook — Serve OUR SOV Models on Hermes/Ollama + Operate-Test-Improve Loop
Run on the MAC (m2) — the sandbox can't reach your Mac's Ollama (loopback/LAN). Free, local.
Verified paths (2026-07-15): adapter base = Qwen/Qwen2.5-0.5B-Instruct; governed shim + evolve loop present.

## WHAT THIS ACHIEVES
Our trained SOV3 student (eval-proven governance model) becomes a LIVE model Hermes/the cockpit can
call — every call care-gated + signed by our shim — and every good decision feeds a governed retrain loop.
= "our models operating on Hermes, testing and improving as we go."

## PRECONDITIONS (on the Mac)
- ollama installed + running (`ollama serve`)
- python env with: transformers, peft, torch (the sov33ft env already has these)
- llama.cpp for GGUF conversion (`brew install llama.cpp` OR clone ggerganov/llama.cpp)
- repo at ~/clawd, on branch m4-handoff-2026-06-24, `git pull` first

## STEP 1 — Merge our adapter into base weights (LoRA -> full model)
cd ~/clawd/_alignment/sovereign_merge_kit
python3 - << 'PY'
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
BASE="Qwen/Qwen2.5-0.5B-Instruct"
ADP="models/sov3_student_adapter"
m=AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.float16)
m=PeftModel.from_pretrained(m,ADP); m=m.merge_and_unload()   # bake LoRA into weights
m.save_pretrained("models/sov3_merged"); AutoTokenizer.from_pretrained(BASE).save_pretrained("models/sov3_merged")
print("merged -> models/sov3_merged")
PY

## STEP 2 — Convert to GGUF (Ollama's format)
# from your llama.cpp checkout:
python3 convert_hf_to_gguf.py ~/clawd/_alignment/sovereign_merge_kit/models/sov3_merged \
  --outfile ~/clawd/_alignment/sovereign_merge_kit/models/sov3.gguf --outtype q8_0

## STEP 3 — ollama create (our model becomes a Hermes-callable model)
cd ~/clawd/_alignment/sovereign_merge_kit/models
cat > Modelfile << 'EOF'
FROM ./sov3.gguf
TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""
PARAMETER temperature 0.2
SYSTEM "You are SOV3, a sovereign governance model. Ground answers in EU AI Act / governance law."
EOF
ollama create sov3 -f Modelfile
ollama run sov3 "What must a provider do before placing a high-risk AI system on the market?"   # smoke test

## STEP 4 — Point the governed shim at it (care-gate + sign every call)
# the shim already routes to ollama; set the model name to sov3
cd ~/clawd/_alignment/sovereign_merge_kit
export SOV33_SIGIL_DIR="$HOME/.sov33_sigil"; mkdir -p "$SOV33_SIGIL_DIR"
python3 sov_openai_shim.py    # governed endpoint at localhost:8802/v1
# now Hermes / Open WebUI / the cockpit point at localhost:8802/v1 -> talk to GOVERNED sov3

## STEP 5 — Turn on the operate-test-improve loop
# every call through sov4.ask()/decide_full() logs a signed decision to the ledger.
# harvest clean/high-care pairs for the next governed retrain:
python3 sov4_evolve.py         # reads ledger -> writes clean retrain pairs (excludes care-vetoed)
# then: retrain adapter on harvested pairs -> eval on gov_eval_battery.json -> SWAP ONLY IF BETTER -> re-ollama-create.

## THE LOOP (this is the flywheel)
serve sov3 (Ollama/Hermes) -> operate via governed shim (care-gate+sign) -> ledger logs signed decisions
-> sov4_evolve harvests clean pairs -> retrain -> eval held-out -> swap-only-if-better -> re-serve -> repeat.

## HONEST BOUNDS
- Runs on the MAC (free, local) — the sandbox can't reach Mac Ollama. This is a YOU/CC-on-Mac runbook.
- SOV3 is the 0.5B student — small, governance-tuned; it grounds in law (83% held-out) but is NOT a frontier brain.
- "Improve as we go" is GOVERNED: only care-passed decisions become training data (proven: harmful filtered out).
- Swap-only-if-better: never replace the served model unless the new one beats it on the held-out battery.
- No emergence claim from this loop — it improves the single SOV3 student; emergence is the separate diverse-arch MoA path.
