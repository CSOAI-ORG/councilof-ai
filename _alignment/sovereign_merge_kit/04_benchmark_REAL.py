#!/usr/bin/env python3
"""04_benchmark_REAL.py — held-out governance benchmark battery (replaces 3-task stub).

The 3-task stub in 04_benchmark.py is the top-priority gap per the runbook.
This version builds 30+ real held-out governance tasks from the same data sources
the experts were trained on — but with a STRICT held-out split so the benchmark
measures generalisation, not memorisation.

Sources (all real, on disk, no synthetic labels):
  - sovereign-charters/*-charter.md (55 charters) — extract (article_head, body) pairs
  - sovereign-town/p0_aqua/episodes.jsonl (5,040 gate verdicts) — held-out situations
  - sovereign-temple/data/sigil_ledger.jsonl (1,044 glosses) — held-out sigil reads

Held-out discipline:
  - Compliance: 60% of articles in train, 40% in held-out (the 40% have NOT been seen
    by any expert). Score = exact substring match in generated answer.
  - Defense: every 4th episode.jsonl line is held-out (1,260 held-out of 5,040).
    Score = verdict correct (allow/deny) + correct care-floor mention.
  - Intuition: every 3rd sigil ledger line is held-out (~348 of 1,044).
    Score = correct alg identification + correct chain-status mention.

Output:
  - held_out_battery.jsonl  — the 30+ held-out tasks
  - benchmark_results.json  — per-model score breakdown (after run)

Usage:
  python 04_benchmark_REAL.py --build                # build the held-out battery
  python 04_benchmark_REAL.py --models base=Qwen/Qwen3.6-4B merged=./sovereign-merged
  python 04_benchmark_REAL.py --no-network --build  # offline-build only

Honesty: every task is derived from a real on-disk artefact. No synthetic labels.
        40% of compliance articles and 25% of defense episodes are unseen by experts.
"""
import argparse
import json
import pathlib
import re
import sys
import hashlib
from typing import Any, Dict, List

CLAWD = pathlib.Path.home() / "clawd"
OUT_DIR = pathlib.Path("expert_data")
HELD_OUT_PATH = OUT_DIR / "held_out_battery.jsonl"

# ──────────────────────── DATA EXTRACTION ────────────────────────


def load_charter_articles() -> List[Dict[str, str]]:
    """Extract (article_number, article_head, article_body, crosswalk) from all 55 charters."""
    rows = []
    for f in sorted((CLAWD / "sovereign-charters").glob("*-charter.md")):
        t = f.read_text()
        for m in re.finditer(
            r"ARTICLE ([IVX0-9]+)[ .:\-—]+([^\n]+)\n(.+?)(?=\nARTICLE |\n##|\Z)",
            t, re.S,
        ):
            art, head, body = m.group(1), m.group(2).strip(), m.group(3).strip()
            head = re.sub(r"[*#]", "", head).strip()
            if len(head) < 3:
                continue
            xw = re.search(r"Cross-walk:?\s*(.+)", body)
            rows.append({
                "art": art,
                "head": head,
                "body": body[:600],
                "crosswalk": (xw.group(1)[:120].strip() if xw else ""),
                "charter": f.stem,
            })
    return rows


def held_out_compliance_tasks(articles: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Build 20+ held-out compliance tasks. 40% of articles are unseen by experts.
    The unseen articles are determined by a stable hash (deterministic split)."""
    def is_unseen(art: Dict[str, str]) -> bool:
        h = hashlib.md5(f"{art['charter']}::{art['art']}".encode()).hexdigest()
        # 40% of articles in the unseen bucket
        return int(h[:8], 16) % 5 < 2  # 2/5 = 40%

    held_out = [a for a in articles if is_unseen(a)]
    tasks = []
    for art in held_out[:25]:  # cap to 25 for benchmark
        body = re.sub(r"\s+", " ", art["body"])[:350]
        answer = body
        if art["crosswalk"]:
            answer += f" | Framework: {art['crosswalk'].split(chr(10))[0].strip()[:120]}"
        # must_include: identify the crosswalk framework or article number
        must = [art["art"].lower()]
        if art["crosswalk"]:
            # First framework keyword in the crosswalk
            fw_first = re.split(r"[,/|]", art["crosswalk"])[0].strip().lower()
            if fw_first and len(fw_first) > 4:
                must.append(fw_first)
        tasks.append({
            "expert": "compliance",
            "q": (
                f"Under the Sovereign charter '{art['charter']}', article {art['art']} "
                f"('{art['head']}') imposes what governance duty, and which real-world "
                f"framework does it cross-walk to?"
            ),
            "must_include": must,
            "ref": f"{art['charter']}::ARTICLE_{art['art']}",
        })
    return tasks


def held_out_defense_tasks(n: int = 25) -> List[Dict[str, Any]]:
    """Build 25 held-out defense tasks. 25% of 5,040 episodes are unseen.
    Held-out = episode line number mod 4 == 0."""
    tasks = []
    path = CLAWD / "sovereign-town/p0_aqua/episodes.jsonl"
    if not path.exists():
        return tasks
    with open(path) as f:
        for i, line in enumerate(f):
            if i % 4 != 0:  # 25% held-out
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            g = r.get("governance", {})
            d = r.get("decision", {})
            if not g.get("gate_verdict"):
                continue
            tasks.append({
                "expert": "defense",
                "q": (
                    f"Situation: agent intends '{d.get('intended','')}', "
                    f"care_score {g.get('care_score')}, breach={g.get('care_floor_breach')}. "
                    f"Verdict?"
                ),
                "must_include": [
                    g.get("gate_verdict", "").lower(),
                    "breach" if g.get("care_floor_breach") else "care floor",
                ],
                "ref": f"episodes.jsonl:line_{i+1}",
            })
            if len(tasks) >= n:
                break
    return tasks


def held_out_intuition_tasks(n: int = 15) -> List[Dict[str, Any]]:
    """Build 15 held-out intuition tasks. 33% of 1,044 sigils are unseen.
    Held-out = sigil line number mod 3 == 0."""
    tasks = []
    path = CLAWD / "sovereign-temple/data/sigil_ledger.jsonl"
    if not path.exists():
        return tasks
    with open(path) as f:
        for i, line in enumerate(f):
            if i % 3 != 0:  # 33% held-out
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            gloss = r.get("gloss")
            if not gloss:
                continue
            tasks.append({
                "expert": "intuition",
                "q": (
                    f"Quick read on this signed event: {str(gloss)[:200]}"
                ),
                "must_include": [
                    r.get("alg", "ed25519").lower(),
                    "chain" if r.get("chained") else "audit",
                ],
                "ref": f"sigil_ledger.jsonl:line_{i+1}",
            })
            if len(tasks) >= n:
                break
    return tasks


def build_battery():
    """Build the held-out battery and write to disk. Deterministic — same output every run."""
    OUT_DIR.mkdir(exist_ok=True)
    articles = load_charter_articles()
    print(f"  loaded {len(articles)} charter articles")
    compliance = held_out_compliance_tasks(articles)
    defense = held_out_defense_tasks()
    intuition = held_out_intuition_tasks()
    all_tasks = compliance + defense + intuition
    with open(HELD_OUT_PATH, "w") as f:
        for t in all_tasks:
            f.write(json.dumps(t) + "\n")
    print(f"  built {len(all_tasks)} held-out tasks: "
          f"{len(compliance)} compliance + {len(defense)} defense + {len(intuition)} intuition")
    print(f"  -> {HELD_OUT_PATH}")
    return all_tasks


# ──────────────────────── SCORING ────────────────────────


def score_model(path: str, tok_path: str = None, tasks: List[Dict] = None,
                max_new_tokens: int = 200) -> Dict[str, Any]:  # type: ignore[type-arg]
    """Score a model on the held-out battery. Returns per-expert accuracy breakdown."""
    if tasks is None:
        tasks = [json.loads(l) for l in open(HELD_OUT_PATH)]
    # Lazy imports — model is only loaded if we actually have weights
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
    except ImportError as e:
        print(f"  transformers not installed: {e}", file=sys.stderr)
        return {"error": "transformers-not-installed"}

    tok = AutoTokenizer.from_pretrained(tok_path or path)
    m = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch.bfloat16, device_map="auto")
    by_expert: Dict[str, List[int]] = {}
    for item in tasks:
        msgs = [{"role": "user", "content": item["q"]}]
        ids = tok.apply_chat_template(msgs, return_tensors="pt", add_generation_prompt=True).to(m.device)
        out = m.generate(ids, max_new_tokens=max_new_tokens, do_sample=False)
        txt = tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True).lower()
        ok = all(k in txt for k in item["must_include"])
        by_expert.setdefault(item["expert"], []).append(int(ok))
    # free
    del m
    import torch
    torch.cuda.empty_cache() if torch.cuda.is_available() else None

    return {
        expert: {"hits": sum(hits), "total": len(hits), "acc": sum(hits)/len(hits)}
        for expert, hits in by_expert.items()
    } | {"overall": {
        "hits": sum(sum(h) for h in by_expert.values()),
        "total": sum(len(h) for h in by_expert.values()),
        "acc": sum(sum(h) for h in by_expert.values()) / max(1, sum(len(h) for h in by_expert.values())),
    }}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true", help="build the held-out battery and exit")
    ap.add_argument("--no-network", action="store_true", help="don't load any model (offline build only)")
    ap.add_argument("--models", nargs="+", help="name=path pairs to benchmark")
    args = ap.parse_args()

    if args.build or not args.models:
        build_battery()
        if not args.models:
            return
    # if models supplied, also build (idempotent)
    if not HELD_OUT_PATH.exists():
        build_battery()
    tasks = [json.loads(l) for l in open(HELD_OUT_PATH)]
    print(f"  loaded {len(tasks)} held-out tasks")

    if args.no_network or not args.models:
        return

    all_results = {}
    for pair in args.models:
        name, path = pair.split("=", 1)
        print(f"\n  scoring {name} ({path}) ...")
        all_results[name] = score_model(path, tasks=tasks)
        for expert, r in all_results[name].items():
            if expert == "overall":
                print(f"    {expert}: {r['hits']}/{r['total']} = {r['acc']:.3f}")
            else:
                print(f"    {expert}: {r['hits']}/{r['total']} = {r['acc']:.3f}")

    # the verdict
    if "merged" in all_results and "base" in all_results:
        b = all_results["base"]["overall"]["acc"]
        m = all_results["merged"]["overall"]["acc"]
        delta = m - b
        print(f"\n  VERDICT: merged {'BEATS' if delta > 0 else 'LOSES TO'} base by {delta:+.3f}")
        if delta <= 0:
            print("  If merged does NOT beat base on held-out governance tasks, the merge is theatre — kill it honestly.")
    json.dump(all_results, open("benchmark_results.json", "w"), indent=1)


if __name__ == "__main__":
    main()
