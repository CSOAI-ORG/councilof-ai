#!/usr/bin/env python3
"""sovereign_distill.py — the REAL 'train correctly & fast' move: DISTILLATION.
NVIDIA's free hosted BIG model (up to 405B) is the TEACHER — it GENERATES high-quality training data.
Your small sovereign model is the STUDENT — trained on that data (QLoRA) on a free Colab/Kaggle GPU.
Big model teaches small model. This is how you get a genuinely smarter sovereign WITHOUT owning big GPUs.

Honest split:
  - NVIDIA API = INFERENCE (teacher generates data + answers). You do NOT train on it.
  - Free GPU (Colab) = TRAINING (student QLoRA on the generated data). Small models, but REAL.
  - This script = the teacher step. Output feeds sov33_gpu_fire.py on the GPU.

Keys come from env (NVIDIA_API_KEY etc.) — never handled here. Falls back to local if no key (lower quality).
"""
import os, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sovereign_router import dispatch, available
from sovereign_kb import kb

ANGLES = ["a busy compliance officer asking a direct question",
          "a non-expert asking in plain English",
          "a yes/no question with a short justification",
          "a real-world scenario ('a company does X — is that allowed?')",
          "an auditor asking what evidence is required",
          "someone asking how it differs from a related rule"]

def gen_examples(n_per_fact=2):
    KB = kb(); out = []; seen = set()
    for src, fact in KB:
        for i in range(n_per_fact):
            angle = ANGLES[i % len(ANGLES)]
            prompt = (f"Based ONLY on this fact, write ONE realistic QUESTION from the perspective of {angle}, "
                      f"and a correct concise ANSWER that cites [{src}]. Vary the wording. Return JSON only: "
                      f'{{"instruction": "...", "response": "..."}}.\nFACT ({src}): {fact}')
            ans, who = dispatch(prompt, system="You generate diverse, clean instruction/response training pairs.",
                                tier="smart", max_tokens=300, temperature=0.8)   # higher temp = diversity
            if not ans: continue
            try:
                j = json.loads(ans[ans.find("{"):ans.rfind("}")+1])
                instr = (j.get("instruction") or "").strip()
                key = instr.lower()[:60]
                if instr and j.get("response") and key not in seen:      # dedup on instruction
                    seen.add(key); j["_teacher"] = who; j["_source"] = src; out.append(j)
            except Exception:
                pass
    return out

def main():
    av = available()
    teacher_ok = any(k in av for k in ("nvidia","glm","minimax","groq"))
    print(f"=== SOVEREIGN DISTILL — teacher backends available: {av} ===")
    if not teacher_ok:
        print("No hosted teacher configured (best = NVIDIA 405B). Set NVIDIA_API_KEY to use a big teacher;")
        print("without it, generation falls back to the local small model (low quality — set the key).")
    ex = gen_examples(n_per_fact=int(os.environ.get("SOV_N_PER_FACT","2")))
    path = "expert_data/sovereign_distilled.jsonl"
    os.makedirs("expert_data", exist_ok=True)
    with open(path, "w") as f:
        for e in ex: f.write(json.dumps({"instruction": e["instruction"], "response": e["response"]}) + "\n")
    teachers = sorted(set(e.get("_teacher") for e in ex))
    print(f"\ngenerated {len(ex)} training pairs (teachers: {teachers}) -> {path}")
    print("Next: on a free Colab/Kaggle GPU, run sov33_gpu_fire.py (QLoRA) on this jsonl to train the student.")
    if ex: print("\nsample:", json.dumps(ex[0], ensure_ascii=False)[:300])

if __name__ == "__main__":
    main()
