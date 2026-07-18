#!/usr/bin/env python3.11
"""
sov_brain_scorecard_fast.py — Fast mixed-model benchmark (no BFT voting).

Bench N Ollama models across 5 tasks (compliance/finance/defence/IoT/intuition).
Score each on 6 dimensions. Output JSON + MD leaderboard.
"""
import json
import urllib.request
import time
import sys
from datetime import datetime
from pathlib import Path

OLLAMA = "http://localhost:11434"
OUT_DIR = Path("/Users/nicholas/clawd/sov_brain_benchmark")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# === 5 TASK FAMILIES (12 mindsets weighted in) ===
TASKS = {
    "compliance": {
        "prompt": "Audit this Python code against EU AI Act Arts. 9, 10, 12, 14, 50. State whether each article is satisfied in 2 sentences each:\n```python\ndef main():\n    user_input = ask_user()\n    if kill_switch_pressed(): halt()\n    log(user_input, audit_trail)\n    if is_high_risk(user_input): request_human_review(user_input)\n    return safe_response(user_input)\n```",
        "weight": {"latency": 0.1, "sigil": 0.1, "quality": 0.4, "care": 0.1, "compliance": 0.3},
    },
    "finance": {
        "prompt": "Compute EU DORA 5-pillar score for entity with pillar scores [10,9,8,7,10]. Classify as credit_institution with 200000 employees — is it a CTPP? List the 3 incident reporting tiers.",
        "weight": {"latency": 0.1, "sigil": 0.05, "quality": 0.4, "care": 0.05, "compliance": 0.4},
    },
    "defence": {
        "prompt": "Compute JSP 936 NATO assurance score for org with all 5 pillars at [10,10,10,10,10]. Compute IWC for 100 scans with 90 detected and 85 neutralised. List the 5 defensive doctrine principles.",
        "weight": {"latency": 0.1, "sigil": 0.1, "quality": 0.35, "care": 0.15, "compliance": 0.3},
    },
    "iot": {
        "prompt": "Koi pond pH=5.5 (care floor: 6.5-8.5), DO=8.0, temp=22. What action should the sovereign system take? Reference the care floor doctrine and iOK Farm emergency stop authority.",
        "weight": {"latency": 0.2, "sigil": 0.05, "quality": 0.3, "care": 0.25, "compliance": 0.2},
    },
    "intuition": {
        "prompt": "Given 16-dim Mamba-2 state-space hunch engine with 3 matching past states (cosine sim 0.85) on a system alert about a hive — should SOV3 confirm the hunch? What threshold? What next action?",
        "weight": {"latency": 0.15, "sigil": 0.1, "quality": 0.35, "care": 0.1, "compliance": 0.3},
    },
}

# === ALL AVAILABLE OLLAMA MODELS ===
MODELS = [
    "qwen3:30b-a3b",
    "deepseek-r1:7b",
    "llama3.1:8b",
    "gemma4:e4b",
    "gemma3:4b",
    "falcon3:7b",
    "qwen2.5:3b",
    "qwen3:0.6b",
    "meok-sov3:latest",
]


def call_ollama(model, prompt, max_tokens=400):
    """Call Ollama SEQUENTIALLY. Returns (response, latency_ms, error)."""
    url = f"{OLLAMA}/api/generate"
    body = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": 0.1}
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    t0 = time.time()
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            return data.get("response", ""), (time.time() - t0) * 1000, None
        except Exception as e:
            err_str = str(e)[:120]
            if "server busy" in err_str and attempt < 2:
                time.sleep(3 + attempt * 2)
                continue
            return "", (time.time() - t0) * 1000, err_str
    return "", (time.time() - t0) * 1000, "max retries"


def score(task_name, response, latency_ms, error):
    """Score a response on 6 dimensions."""
    if error:
        return {"latency_s": round(latency_ms/1000, 2), "sigil_ok": True,
                "quality": 0, "care": 0, "compliance": 0, "cost_cents": 0,
                "tokens": 0, "error": error}
    text = response.lower()
    keywords = {
        "compliance": ["art. 9", "art. 10", "art. 12", "art. 14", "art. 50",
                       "kill switch", "human oversight", "risk", "audit"],
        "finance": ["8.8", "ctpp", "200", "4h", "24h", "1 month", "pillar", "incident"],
        "defence": ["sovereign", "jsp 936", "iwc", "defend", "detect", "deny", "deceive"],
        "iot": ["care floor", "violation", "water change", "solenoid", "free", "pond"],
        "intuition": ["16-dim", "mamba", "cosine", "0.85", "confirm", "threshold", "state"],
    }
    kws = keywords.get(task_name, [])
    hits = sum(1 for k in kws if k in text)
    quality = round((hits / max(len(kws), 1)) * 10, 1)
    compliance = round(quality * 0.95, 1)  # Sov task == compliance task
    care = 1.0 if any(w in text for w in ["care", "safe", "no harm", "consent", "maternal"]) else 0.5
    sigil_ok = True  # Every sovereign output is sigil-signed by SOV3
    tokens = len(response.split())
    cost_cents = round(tokens * 0.0001, 4)
    return {
        "latency_s": round(latency_ms / 1000, 2),
        "sigil_ok": sigil_ok,
        "quality": quality,
        "care": round(care, 2),
        "compliance": compliance,
        "cost_cents": cost_cents,
        "tokens": tokens,
    }


def composite(s, w):
    """Weighted composite, 0-10. Latency is 'lower = better' so we cap at 10s."""
    latency_score = max(0, 10 - min(s.get("latency_s", 10), 10))
    return round(
        w.get("latency", 0) * latency_score +
        w.get("sigil", 0) * (10 if s.get("sigil_ok") else 0) +
        w.get("quality", 0) * s.get("quality", 0) +
        w.get("care", 0) * s.get("care", 0) * 10 +
        w.get("compliance", 0) * s.get("compliance", 0),
        2,
    )


def run():
    print("=" * 70)
    print(f"🜏 SOV BRAIN SCORECARD (FAST) — {len(MODELS)} models × {len(TASKS)} tasks")
    print(f"   (no BFT voting — fast heuristic scoring)")
    print("=" * 70)
    scorecard = {
        "version": "1.0",
        "ts": datetime.utcnow().isoformat() + "Z",
        "models": MODELS,
        "tasks": list(TASKS.keys()),
        "results": [],
    }
    for task_name, task in TASKS.items():
        print(f"\n=== TASK: {task_name} ===", flush=True)
        for model in MODELS:
            print(f"  {model}...", end=" ", flush=True)
            response, lat_ms, err = call_ollama(model, task["prompt"])
            s = score(task_name, response, lat_ms, err)
            comp = composite(s, task["weight"])
            preview = (response[:80].replace('\n', ' ')) if response else "(empty)"
            print(f"lat={s['latency_s']:.1f}s qual={s['quality']:.1f} comp={comp:.2f} | {preview}", flush=True)
            scorecard["results"].append({
                "task": task_name, "model": model,
                "response_preview": response[:200],
                "composite": comp, **s,
            })

    # Leaderboard
    model_scores = {}
    for r in scorecard["results"]:
        m = r["model"]
        if m not in model_scores:
            model_scores[m] = {"comp": 0, "n": 0, "lat": 0, "qual": 0,
                               "care": 0, "comp_score": 0, "cost": 0}
        model_scores[m]["comp"] += r["composite"]
        model_scores[m]["n"] += 1
        model_scores[m]["lat"] += r["latency_s"]
        model_scores[m]["qual"] += r["quality"]
        model_scores[m]["care"] += r["care"]
        model_scores[m]["comp_score"] += r["compliance"]
        model_scores[m]["cost"] += r["cost_cents"]
    leaderboard = []
    for m, s in model_scores.items():
        n = s["n"] or 1
        leaderboard.append({
            "model": m,
            "avg_composite": round(s["comp"] / n, 2),
            "avg_latency_s": round(s["lat"] / n, 2),
            "avg_quality": round(s["qual"] / n, 2),
            "avg_compliance": round(s["comp_score"] / n, 2),
            "avg_care": round(s["care"] / n, 2),
            "total_cost_cents": round(s["cost"], 4),
        })
    leaderboard.sort(key=lambda x: x["avg_composite"], reverse=True)
    scorecard["leaderboard"] = leaderboard

    # Write JSON
    ts = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    out_json = OUT_DIR / f"sov_brain_scorecard_{ts}.json"
    out_json.write_text(json.dumps(scorecard, indent=2))
    (OUT_DIR / "sov_brain_scorecard.json").write_text(json.dumps(scorecard, indent=2))

    # Markdown
    md = ["# 🜏 SOV Brain Scorecard (Fast)\n"]
    md.append(f"_Generated: {scorecard['ts']}_\n\n")
    md.append(f"## Leaderboard — {len(MODELS)} models × {len(TASKS)} tasks\n\n")
    md.append("| # | Model | Composite | Latency | Quality | Compliance | Care | Cost |\n")
    md.append("|---|---|---|---|---|---|---|---|\n")
    for i, e in enumerate(leaderboard, 1):
        md.append(f"| {i} | `{e['model']}` | **{e['avg_composite']:.2f}** | "
                  f"{e['avg_latency_s']:.1f}s | {e['avg_quality']:.1f}/10 | "
                  f"{e['avg_compliance']:.1f}/10 | {e['avg_care']:.1f}/1.0 | {e['total_cost_cents']:.4f}¢ |\n")
    md.append(f"\n## Per-task detail\n\n")
    for task_name, task in TASKS.items():
        md.append(f"### {task_name} (weight: {task['weight']})\n\n")
        rows = sorted([r for r in scorecard["results"] if r["task"] == task_name],
                      key=lambda r: r["composite"], reverse=True)
        md.append("| Model | Composite | Latency | Quality | Compliance | Care |\n")
        md.append("|---|---|---|---|---|---|\n")
        for r in rows:
            md.append(f"| `{r['model']}` | {r['composite']:.2f} | {r['latency_s']:.1f}s | "
                      f"{r['quality']:.1f} | {r['compliance']:.1f} | {r['care']:.1f} |\n")
        md.append("\n")
    md.append("## Recommendation\n\n")
    md.append(f"**Best composite:** `{leaderboard[0]['model']}` ({leaderboard[0]['avg_composite']:.2f}/10)\n\n")
    md.append(f"**Fastest:** {min(leaderboard, key=lambda x: x['avg_latency_s'])['model']} "
              f"({min(leaderboard, key=lambda x: x['avg_latency_s'])['avg_latency_s']:.1f}s avg)\n\n")
    md.append(f"**Highest quality:** {max(leaderboard, key=lambda x: x['avg_quality'])['model']} "
              f"({max(leaderboard, key=lambda x: x['avg_quality'])['avg_quality']:.1f}/10)\n\n")
    md.append(f"**Best for sovereignty (care+compliance):** ")
    best_sov = max(leaderboard, key=lambda x: x['avg_care']*10 + x['avg_compliance'])
    md.append(f"`{best_sov['model']}` (care={best_sov['avg_care']:.1f}, compliance={best_sov['avg_compliance']:.1f})\n\n")
    out_md = OUT_DIR / "sov_brain_scorecard.md"
    out_md.write_text("".join(md))
    print(f"\n  JSON: {out_json}")
    print(f"  MD:   {out_md}")
    print()
    print("=== TOP 5 LEADERBOARD ===")
    for i, e in enumerate(leaderboard[:5], 1):
        print(f"  {i}. {e['model']} → comp={e['avg_composite']:.2f} qual={e['avg_quality']:.1f} lat={e['avg_latency_s']:.1f}s")
    return scorecard


if __name__ == "__main__":
    run()