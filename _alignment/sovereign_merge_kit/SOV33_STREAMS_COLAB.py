# ══════════════════════════════════════════════════════════════════════════
# 🜏 SOV33 SOVEREIGN — STREAMING COLAB RUNNER (paste whole thing into ONE cell)
# Same as SOV33_ONE_CELL_COLAB but with STREAMING output so you see the tqdm bars.
# 
# The original uses subprocess.run() which buffers tqdm in Colab.
# This version uses Popen + line-buffered output so you see EVERY step.
# 
# Runtime → Change runtime type → T4 GPU, then Run. ~1-2 hrs for compliance expert.
# ══════════════════════════════════════════════════════════════════════════
import subprocess, sys, os, torch, threading, time, queue

print("🜏 [1/6] GPU check")
assert torch.cuda.is_available(), "No GPU. Runtime → Change runtime type → T4 GPU, then rerun."
print(f"   ✓ {torch.cuda.get_device_name(0)} ({torch.cuda.get_device_properties(0).total_memory//10**9}GB)")

print("🜏 [2/6] install stack (~2 min)")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("🜏 [3/6] clone kit")
if not os.path.exists("/content/clawd"):
    subprocess.run("git clone -q -b m4-handoff-2026-06-24 "
                   "https://github.com/CSOAI-ORG/clawd-workspace.git /content/clawd", shell=True)
KIT = "/content/clawd/_alignment/sovereign_merge_kit"

print("🜏 [4/6] pick expert")
expert = os.environ.get("SOV33_EXPERT", "compliance")
data = f"{KIT}/expert_data/{expert}.jsonl"
n = sum(1 for _ in open(data))
print(f"   expert: {expert}, examples: {n}")

print(f"🜏 [5/6] STREAMING fine-tune of {expert}")
print("   (You should see tqdm progress bars below as each step runs)")
print()

# STREAMING: use Popen with line-buffered stdout
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"  # Force unbuffered output
env["TRANSFORMERS_VERBOSITY"] = "info"

cmd = (f"cd {KIT} && python3 -u 02_finetune_expert.py --expert {expert} "
       f"--base Qwen/Qwen3-4B --data {data} --out ./charter-1-{expert} --epochs 2")
print(f"$ {cmd}")
print("─" * 70)

proc = subprocess.Popen(
    cmd, shell=True,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    bufsize=1, universal_newlines=True,
    env=env,
)

# Stream output line by line
output_lines = []
for line in iter(proc.stdout.readline, ''):
    line = line.rstrip()
    if line:
        print(line)
        output_lines.append(line)
    sys.stdout.flush()

proc.wait()
exit_code = proc.returncode

print("─" * 70)
print(f"🜏 [6/6] fine-tune exit code: {exit_code}")

if exit_code == 0 and os.path.exists(f"./charter-1-{expert}"):
    print(f"   ✅ PROVEN — adapter saved to charter-1-{expert}/")
    print()
    print("   NEXT STEPS:")
    print("   1. The adapter is on Colab. Download to your Mac:")
    print(f"      Files panel → /content/charter-1-{expert}/ → download all files")
    print(f"      Or zip: !zip -r /content/sov33-{expert}.zip charter-1-{expert}/")
    print()
    print("   2. On Mac, place at ~/.sovereign/models/charter-1-{expert}/")
    print()
    print("   3. Tell SOV33 to use it:")
    print(f"      python -c \"import sov33; print(sov33.capability_substrate_explorer())\"")
    print()
    print("   4. Re-run OWEM emergence — should transition L0 -> L1:")
    print("      python -c \"from sov33_owem_emergence import print_emergence_report; print_emergence_report()\"")
else:
    print(f"   ⚠️ fine-tune did not complete (exit {exit_code})")
    print("   The output above shows the last 200+ lines for diagnosis.")
    print("   Paste back to MEOK-SOV3 and I'll fix the exact error.")
