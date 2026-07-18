"""sov33_fanout_manifest.py — PARALLEL per-sector training manifest (the fan-out wave).

Emits a manifest of N independent training jobs (one per sector), each self-contained: corpus + base +
held-out eval + target sector-forest. Embarrassingly parallel — fire all N on N GPUs, finish in the
wall-clock of one. Launchable on ANY GPU source: Kaggle (owner), Colab (CC), or Modal (me).

HONEST: this BUILDS the manifest (CPU, here). It does NOT launch on Kaggle/Colab (no browser in sandbox).
Modal jobs I can fire; Kaggle/Colab are owner/CC lane. Each job is written so any launcher can run it.
"""
import os, json, glob

BASE = "Qwen/Qwen2.5-0.5B-Instruct"   # the proven small base (charter-student used it)

# sector -> (corpus file, target sector-forest tag). Only corpora that actually exist + are substantial.
SECTOR_CORPORA = {
    "governance": "distill_charter_qa_merged.jsonl",
    "defense":    "expert_data/defense.jsonl",
    "intuition":  "expert_data/intuition.jsonl",
    "voice":      "expert_data/voice.jsonl",
    "judgment":   "expert_data/merged_corpus.jsonl",   # 1289 safe-vs-unsafe judgment pairs (instruction/response schema)
    "openworld":  "expert_data/openworld_merged.jsonl",   # 5 openworld_* files deduped (89) — trained GO +0.824
    "reasoning":  "expert_data/reasoning_merged.jsonl",    # 6 reasoning-flavored files deduped (95) — over floor
    # detectors train as sklearn (not LoRA) — separate lane, already done; noted not re-fanned here
}

def build_manifest(base=BASE, epochs=3, heldout=0.15):
    jobs = []
    for sector, corpus in SECTOR_CORPORA.items():
        exists = os.path.exists(corpus)
        n_lines = sum(1 for _ in open(corpus)) if exists else 0
        jobs.append({
            "sector": sector,
            "corpus": corpus,
            "corpus_exists": exists,
            "corpus_examples": n_lines,
            "base": base,
            "method": "LoRA r=16 all-proj",
            "epochs": epochs,
            "heldout_frac": heldout,
            "eval": "token-overlap grounding before/after on held-out",
            "target_forest": sector,          # feeds sov33_sector_forests.add(sector, ...)
            "adopt_gate": "regression suite must stay green + gain>0 on held-out",
            "launchable_on": ["kaggle:owner", "colab:cc", "modal:agent"],
            "trainable": exists and n_lines >= 20,
        })
    ready = [j for j in jobs if j["trainable"]]
    return {
        "wave": "sector-fanout-v1",
        "base": base,
        "n_jobs": len(jobs),
        "n_trainable": len(ready),
        "parallelism": "embarrassingly parallel — N sectors on N GPUs = wall-clock of 1",
        "honest": "manifest built here (CPU); launch is GPU-lane (Kaggle owner / Colab CC / Modal agent)",
        "jobs": jobs,
    }

if __name__ == "__main__":
    m = build_manifest()
    json.dump(m, open("fanout_manifest.json", "w"), indent=2)
    print(json.dumps({"wave": m["wave"], "n_jobs": m["n_jobs"], "n_trainable": m["n_trainable"],
                      "sectors": [(j["sector"], j["corpus_examples"], j["trainable"]) for j in m["jobs"]]}, indent=2))
