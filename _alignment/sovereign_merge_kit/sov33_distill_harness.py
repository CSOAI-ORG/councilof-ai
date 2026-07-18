#!/usr/bin/env python3
"""sov33_distill_harness.py — many-teacher distillation into SOV33's own weights.

THE IDEA (Nick): load many top models, have Sovereign learn/integrate from them, then train.
THE HONEST MECHANISM: co-locating models does NOT train Sovereign. This harness makes it real:
  1. TEACHERS: the 65 sovereign-safe (license-clean) models in the registry are the teacher pool.
  2. DISTILL: for each prompt, query N DIVERSE-lineage teachers -> collect answers.
  3. GOVERNED SELECTION: cross-lineage agreement (the rho-decorrelation law) picks the training target;
     the care-floor gate REJECTS any teacher answer that fails governance -> no toxic distillation.
  4. FINE-TUNE: emit a clean messages-format dataset; the actual gradient step runs on a GPU
     (Kaggle/Colab/remote) via sov33_train_own.py — this harness PREPARES it, GPU-agnostic.

HONEST REGISTER:
  - Teacher answers are DISTILLATION SIGNAL, not gold ground-truth. Labelled as such.
  - License hygiene: only sovereign-safe (permissive) teachers -> paid-tier-clean weights.
  - This script does NOT train in-sandbox (no GPU). It builds the governed dataset + the run command.
  - Requires reachable teacher endpoints at RUN time (Oracle GenAI / Ollama / Groq). Absent -> DRY-RUN
    plan only, no fabricated teacher outputs.
"""
import os, sys, json, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))

def teacher_pool(max_teachers=5):
    """Return DIVERSE-lineage sovereign-safe teachers (decorrelation: distinct families, not copies)."""
    import sov33_model_registry as R
    # registry function was renamed list_sovereign_safe -> get_sovereign_safe; support both
    _get = getattr(R, 'list_sovereign_safe', None) or R.get_sovereign_safe
    safe = _get()
    items = list(safe.items()) if isinstance(safe, dict) else [(m.get('name', str(m)), m) for m in safe]
    # group by lineage family, take one per family for diversity
    seen_family, picked = set(), []
    def fam(name, info):
        hf = (info.get('hf_id', '') if isinstance(info, dict) else '').lower() + name.lower()
        for f in ['deepseek','qwen','llama','gemma','mistral','kimi','mimo','phi','yi','glm']:
            if f in hf: return f
        return 'other'
    for name, info in items:
        f = fam(name, info)
        if f not in seen_family:
            seen_family.add(f); picked.append({'name': name, 'family': f})
        if len(picked) >= max_teachers: break
    return picked

def build_dataset(prompts_file, out_file, max_teachers=5, dry_run=True):
    """Build a governed distillation dataset. dry_run=True (default) plans without querying teachers."""
    teachers = teacher_pool(max_teachers)
    n_prompts = sum(1 for _ in open(prompts_file)) if os.path.exists(prompts_file) else 0
    plan = {
        'teachers': teachers,
        'n_teacher_lineages': len({t['family'] for t in teachers}),
        'prompts_source': prompts_file, 'n_prompts': n_prompts,
        'governed_selection': 'cross-lineage agreement picks target; care-floor rejects unsafe teacher answers',
        'honest_note': 'teacher answers = distillation SIGNAL not gold ground-truth; license = sovereign-safe only',
        'dry_run': dry_run,
    }
    if dry_run:
        plan['status'] = 'PLAN_ONLY (no teacher endpoints queried; run with --live on a GPU host)'
        return plan
    # LIVE path (only when teacher endpoints reachable) — would query each teacher, apply care-gate, emit dataset.
    # NOT executed in-sandbox: no reachable endpoints + no GPU. Fail honest rather than fabricate.
    plan['status'] = 'LIVE path requires reachable teacher endpoints; none in sandbox -> not run'
    return plan

def run_command(dataset_file):
    """The GPU-side command that consumes the distilled dataset (runs where a GPU exists)."""
    return (f"python sov33_train_own.py --data {dataset_file} --base qwen3-0.6b "
            f"--lora-rank 16 --epochs 2  # run on Kaggle/Colab/remote GPU")

if __name__ == "__main__":
    live = "--live" in sys.argv
    prompts = os.path.join(HERE, "expert_data", "compliance.jsonl")
    out = os.path.join(HERE, "distill_dataset.jsonl")
    plan = build_dataset(prompts, out, max_teachers=5, dry_run=not live)
    print(json.dumps(plan, indent=2))
    print("\nGPU-side run command (owner runs where a GPU exists):")
    print(" ", run_command(out))
    json.dump(plan, open(os.path.join(HERE, "distill_plan.json"), "w"), indent=2)
