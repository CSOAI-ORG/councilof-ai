# ══════════════════════════════════════════════════════════════════════════
# SOV33 SOVEREIGN — FOUR-EXPERT PROOF RUN (paste whole thing into ONE Colab cell)
# Runtime → Change runtime type → T4 GPU, then Run. Builds all 4 experts in sequence.
# compliance(801) → defense(1775) → intuition(1075) → voice(275), Qwen3-4B QLoRA 2ep each.
# ~£0. Each adapter saved to charter-N-<expert>/. On T4 this is ~2-4 hrs total.
# ══════════════════════════════════════════════════════════════════════════
import subprocess, sys, os, torch, time

print("[1/4] GPU check")
assert torch.cuda.is_available(), "No GPU. Runtime → Change runtime type → T4 GPU, then rerun."
print("   ", torch.cuda.get_device_name(0), f"{torch.cuda.get_device_properties(0).total_memory//10**9}GB")

print("[2/4] install stack (~2 min)")
subprocess.run('pip install -q "transformers>=4.44" peft trl bitsandbytes accelerate datasets', shell=True)

print("[3/4] clone kit (branch m4-handoff-2026-06-24 — pre-built expert data committed)")
if not os.path.exists("/content/clawd"):
    subprocess.run("git clone -q -b m4-handoff-2026-06-24 "
                   "https://github.com/CSOAI-ORG/clawd-workspace.git /content/clawd", shell=True)
KIT = "/content/clawd/_alignment/sovereign_merge_kit"; os.chdir(KIT)

print("[4/4] fine-tune all 4 experts in sequence")
EXPERTS = [("compliance",1),("defense",2),("intuition",3),("voice",4)]
results = {}
for name, idx in EXPERTS:
    data = f"{KIT}/expert_data/{name}.jsonl"
    n = sum(1 for _ in open(data))
    out = f"./charter-{idx}-{name}"
    print(f"\n=== EXPERT {idx}/4: {name} ({n} examples) -> {out} ===")
    t0 = time.time()
    r = subprocess.run(f"python3 02_finetune_expert.py --expert {name} "
                       f"--base Qwen/Qwen3-4B --data {data} --out {out} --epochs 2",
                       shell=True)
    ok = r.returncode == 0 and os.path.exists(out)
    results[name] = "OK" if ok else f"FAIL(exit {r.returncode})"
    print(f"   {name}: {results[name]}  ({(time.time()-t0)/60:.1f} min)")
    if not ok:
        print(f"   ⚠️ {name} failed — paste output above back to MEOK-SOV3 to diagnose. Continuing to next.")

print("\n=== PROOF SUMMARY ===")
for name, idx in EXPERTS: print(f"   charter-{idx}-{name}: {results.get(name,'skipped')}")
if all(v=="OK" for v in results.values()):
    print("   ✅ ALL 4 EXPERTS BUILT. Next: merge via 03_merge_experts.yaml (TIES on Qwen3.6-35B-A3B).")
    # update lane status so the other agent + Nick see it
    ls = "/content/clawd/_alignment/LANE_STATUS.json"
    if os.path.exists(ls):
        import json; d=json.load(open(ls))
        d["lanes"]["defense_intuition_voice_experts"]={"status":"BUILT","detail":"all 4 adapters trained on Colab T4"}
        json.dump(d, open(ls,"w"), indent=2)
        subprocess.run("cd /content/clawd && git add _alignment/LANE_STATUS.json && "
                       "git commit -q -m 'colab: all 4 experts built' && git push", shell=True)
        print("   lane status updated + pushed.")
else:
    print("   ⚠️ Some experts failed — see per-expert output above.")
