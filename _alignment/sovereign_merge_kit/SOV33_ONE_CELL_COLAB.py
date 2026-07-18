# ══════════════════════════════════════════════════════════════════════════
# 🜏 SOV33 SOVEREIGN — ONE-CELL PROOF RUN  (paste this whole thing into ONE Colab cell)
# Runtime → Change runtime type → T4 GPU, then Run. ~£0, ~1-2 hrs. Proves the pipeline.
# Builds the COMPLIANCE expert (the moat) on Qwen3.6-4B QLoRA from your REAL 801-example data.
# ══════════════════════════════════════════════════════════════════════════
import subprocess, sys, os, torch

print("🜏 [1/5] GPU check")
assert torch.cuda.is_available(), "No GPU. Runtime → Change runtime type → T4 GPU, then rerun."
print("   ✓", torch.cuda.get_device_name(0), f"{torch.cuda.get_device_properties(0).total_memory//10**9}GB")

print("🜏 [2/5] install stack (~2 min)")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("🜏 [3/5] clone kit (branch m4-handoff-2026-06-24 — has the pre-built expert data)")
if not os.path.exists("/content/clawd"):
    subprocess.run("git clone -q -b m4-handoff-2026-06-24 "
                   "https://github.com/CSOAI-ORG/clawd-workspace.git /content/clawd", shell=True)
KIT = "/content/clawd/_alignment/sovereign_merge_kit"
os.chdir(KIT)
data = f"{KIT}/expert_data/compliance.jsonl"
print("   compliance examples:", sum(1 for _ in open(data)), "(no prep needed — data is committed)")

print("🜏 [4/5] fine-tune COMPLIANCE expert on Qwen3.6-4B (QLoRA, 2 epochs)")
r = subprocess.run(f"python3 02_finetune_expert.py --expert compliance "
                   f"--base Qwen/Qwen3.6-4B --data {data} --out ./charter-1-compliance --epochs 2",
                   shell=True)
print("   finetune exit code:", r.returncode)

print("🜏 [5/5] proof result")
if r.returncode == 0 and os.path.exists("./charter-1-compliance"):
    print("   ✅ PROVEN — adapter saved to charter-1-compliance/. The pipeline works end-to-end.")
    print("   Next: repeat for defense/intuition/voice, then merge (03_merge_experts.yaml).")
else:
    print("   ⚠️ finetune did not complete — paste the output above back and I'll fix the exact error.")
