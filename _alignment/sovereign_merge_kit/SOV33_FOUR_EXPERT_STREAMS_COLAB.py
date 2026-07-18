# ══════════════════════════════════════════════════════════════════════════
# 🜏 SOV33 SOVEREIGN — FOUR EXPERTS, STREAMING (paste whole thing into ONE cell)
# Trains all 4 experts SEQUENTIALLY with STREAMING tqdm output.
# 
# Runtime → Change runtime type → T4 GPU, then Run. ~2-4 hrs total.
# compliance(801) → defense(1775) → intuition(1075) → voice(275)
# All QLoRA on Qwen3-4B, 2 epochs each, saved to charter-N-<expert>/
# 
# KEY: the original used subprocess.run which buffers tqdm. This streams.
# ══════════════════════════════════════════════════════════════════════════
import subprocess, sys, os, torch, time

print("🜏 [1/5] GPU check")
assert torch.cuda.is_available(), "No GPU. Runtime → Change runtime type → T4 GPU, then rerun."
print(f"   ✓ {torch.cuda.get_device_name(0)} ({torch.cuda.get_device_properties(0).total_memory//10**9}GB)")

print("🜏 [2/5] install stack (~2 min)")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("🜏 [3/5] clone kit")
if not os.path.exists("/content/clawd"):
    subprocess.run("git clone -q -b m4-handoff-2026-06-24 "
                   "https://github.com/CSOAI-ORG/clawd-workspace.git /content/clawd", shell=True)
KIT = "/content/clawd/_alignment/sovereign_merge_kit"
os.chdir(KIT)

EXPERTS = [
    ("compliance", 1, 801),
    ("defense", 2, 1775),
    ("intuition", 3, 1075),
    ("voice", 4, 275),
]

print("🜏 [4/5] fine-tune all 4 experts SEQUENTIALLY (with STREAMING output)")
print("    Each expert takes ~30-60 min on T4. Total: 2-4 hrs.")
print()

overall_t0 = time.time()
results = {}

for name, idx, n_expected in EXPERTS:
    data = f"{KIT}/expert_data/{name}.jsonl"
    n = sum(1 for _ in open(data)) if os.path.exists(data) else 0
    out = f"./charter-{idx}-{name}"
    print()
    print("=" * 70)
    print(f"🜏 EXPERT {idx}/4: {name} ({n} examples expected, {n} found)")
    print(f"    Output: {out}")
    print("=" * 70)
    sys.stdout.flush()

    t0 = time.time()
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["TRANSFORMERS_VERBOSITY"] = "info"
    
    cmd = f"python3 -u 02_finetune_expert.py --expert {name} --base Qwen/Qwen3-4B --data {data} --out {out} --epochs 2"
    
    # STREAM: use Popen, read line by line
    proc = subprocess.Popen(
        cmd, shell=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        bufsize=1, universal_newlines=True,
        env=env,
    )
    for line in iter(proc.stdout.readline, ''):
        line = line.rstrip()
        if line:
            print(f"  [{name}] {line}")
            sys.stdout.flush()
    proc.wait()
    
    elapsed = (time.time() - t0) / 60
    ok = proc.returncode == 0 and os.path.exists(out)
    results[name] = {"ok": ok, "minutes": round(elapsed, 1), "exit": proc.returncode}
    status = "✅" if ok else "❌"
    print(f"   {status} {name}: exit={proc.returncode} ({elapsed:.1f} min)")
    sys.stdout.flush()

total_min = (time.time() - overall_t0) / 60
print()
print("=" * 70)
print(f"🜏 ALL 4 EXPERTS DONE ({total_min:.0f} min total)")
print("=" * 70)
for name, idx, _ in EXPERTS:
    r = results.get(name, {})
    mark = "✅" if r.get("ok") else "❌"
    print(f"   {mark} charter-{idx}-{name}: {r.get('exit')} ({r.get('minutes')} min)")

if all(r.get("ok") for r in results.values()):
    print()
    print("🎉 ALL 4 EXPERTS BUILT. Next steps on Mac:")
    print("   1. Zip all 4: !zip -r /content/sov33_adapters.zip charter-*/")
    print("   2. Download sov33_adapters.zip")
    print("   3. On Mac: unzip to ~/.sovereign/models/")
    print("   4. Re-run: python -c \"from sov33_owem_emergence import print_emergence_report; print_emergence_report()\"")
    print("      → should now show L1 (Multi-expert OWEM) with 4 experts")
    print("   5. Run charter QA battery to verify each expert:")
    print("      python sov33_charter_qa.py  (the 20-prompt test)")
else:
    print()
    print("⚠️ Some experts failed. The streaming output above shows the exact error.")
    print("   Paste back to MEOK-SOV3 for diagnosis.")
