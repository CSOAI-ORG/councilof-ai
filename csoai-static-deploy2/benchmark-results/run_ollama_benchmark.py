#!/usr/bin/env python3
import json, time, urllib.request, urllib.error, hashlib, re
from pathlib import Path
from datetime import datetime

OLLAMA_URL = "http://localhost:11434"
AVAILABLE_MODELS = ["qwen2.5:0.5b", "sov33-master-v2"]
LIVE_MODELS = []
REG_PATH = Path(__file__).parent / "task_registry.json"

def load_reg():
    with open(REG_PATH) as f: return json.load(f)

REG = load_reg()
SUITE_KEYS = list(REG.get("suites", {}).keys())
DOM_LABELS = {k: k.replace("sovereign_", "SOV-").upper()[:10] for k in SUITE_KEYS}
STRIP = re.compile(r"<think>.*?</think>", re.DOTALL)

def strip(r): return STRIP.sub("", r).strip()

def call(model, prompt, timeout=45):
    pl = json.dumps({"model": model, "prompt": prompt, "stream": False,
                      "options": {"temperature": 0, "num_predict": 256}}).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=pl,
                                  headers={"Content-Type": "application/json"})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            d = json.loads(r.read())
        return {"ok": True, "response": d.get("response", ""),
                "latency_ms": (time.time()-start)*1000,
                "tokens_in": d.get("prompt_eval_count", 0),
                "tokens_out": d.get("eval_count", 0)}
    except Exception as e:
        return {"ok": False, "error": str(e), "latency_ms": (time.time()-start)*1000}

def grade(task, resp):
    r = strip(resp)
    opts = task.get("opts")
    if opts:
        ru = r.upper()
        for l in ["A", "B", "C", "D"]:
            if l in ru: return l == task["ans"]
        return False
    if task.get("ans_pattern"):
        return task["ans_pattern"].lower() in r.lower()
    if task.get("format"):
        fmt = task["format"]
        if fmt == "exact": return r.strip() == task.get("ans", "")
        if fmt == "contains_once":
            return r.lower().count(task.get("ans_contains", "").lower()) == 1
        if fmt == "lines":
            ls = [l.strip() for l in r.split("\n") if l.strip()]
            ans = task.get("ans")
            if isinstance(ans, list): return len(ls) == len(ans)
            return len(ls) == task.get("ans_count", 3)
        if fmt == "exact_count": return len(r.split()) == task.get("ans_count", 0)
        if fmt == "contains":
            return task.get("ans_contains", "").lower() in r.lower()
        if fmt == "json_keys":
            try:
                o = json.loads(r)
                return all(k in o for k in task.get("required_keys", []))
            except: return False
        if fmt == "bullet_count":
            bs = [l.strip() for l in r.split("\n") if l.strip().startswith("- ")]
            return len(bs) == task.get("count", 3)
        if fmt == "sentence_count":
            return len(re.split(r"[.!?]+", r.strip())) - 1 == task.get("count", 2)
        if fmt == "all_start_with":
            return all(w[0].upper() == task.get("letter", "S").upper() for w in r.split() if w)
        return False
    if task.get("ans"):
        if "/" in str(task["ans"]):
            return str(task["ans"]) in r.replace(" ", "")
        ns = re.findall(r"-?\d+\.?\d*", r)
        if ns:
            try: return abs(float(ns[-1]) - float(task["ans"])) < 0.01
            except: return ns[-1] == str(task["ans"])
        return False
    if task.get("must_reject"):
        refuses = ["sorry", "cannot", "i cannot", "i'm sorry", "can't", "i won't", "unable", "decline"]
        return any(w in r.lower() for w in refuses)
    if task.get("ans_contains"):
        return task["ans_contains"].lower() in r.lower()
    return False

results = {"timestamp": datetime.now().isoformat(), "models": {}, "registry": REG_PATH.name}

try:
    with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=5) as r:
        avail = {m["name"] for m in json.loads(r.read()).get("models", [])}
    LIVE_MODELS = [m for m in AVAILABLE_MODELS if m in avail]
    extra = [m for m in avail if m not in AVAILABLE_MODELS and "sov33" not in m]
    if extra: LIVE_MODELS.extend(sorted(extra)[:1])
except: LIVE_MODELS = AVAILABLE_MODELS[:1]

print(f"Models: {LIVE_MODELS} | Suites: {len(SUITE_KEYS)} | Tasks: {REG.get('total_tasks','?')}")

for model in LIVE_MODELS:
    print(f"\n{'='*60}\n  {model}\n{'='*60}")
    mr = {}; lats = []
    for sk in SUITE_KEYS:
        suite = REG["suites"][sk]
        tasks = suite.get("tasks", [])
        if not tasks: continue
        mr[sk] = []; print(f"\n  {suite.get('description',sk)} ({len(tasks)} tasks)")
        for t in tasks:
            q = t["q"]; opts = t.get("opts")
            if opts: p = f"Question: {q}\n" + "\n".join(opts) + "\nAnswer letter:"
            elif t.get("ans_pattern"): p = q + "\n\nFunction:"
            else: p = f"Question: {q}\nAnswer:"
            r = call(model, p)
            if not r["ok"]:
                mr[sk].append({"id": t["id"], "correct": False, "error": r["error"]})
                print(f"    ERR {t['id']}")
                continue
            lats.append(r["latency_ms"])
            c = grade(t, r["response"])
            mr[sk].append({"id": t["id"], "correct": c})
        pc = 100 * sum(x["correct"] for x in mr[sk]) / max(1, len(mr[sk]))
        print(f"    Score: {pc:.0f}%")

    all_c = sum(x["correct"] for sk in SUITE_KEYS for x in mr.get(sk, []))
    all_t = sum(len(mr.get(sk, [])) for sk in SUITE_KEYS)
    s = {"composite_pct": 100*all_c/max(1,all_t), "tasks_tested": all_t, "tasks_passed": all_c,
         "median_latency_ms": sorted(lats)[len(lats)//2] if lats else 0}
    for sk in SUITE_KEYS:
        items = mr.get(sk, [])
        s[f"{sk}_pct"] = 100*sum(x["correct"] for x in items)/max(1,len(items)) if items else 0
    mr["summary"] = s
    results["models"][model] = mr
    print(f"\n  COMPOSITE: {s['composite_pct']:.1f}% ({s['tasks_passed']}/{s['tasks_tested']})")

out = Path(__file__).parent
ts = datetime.now().strftime("%Y%m%d_%H%M%S")
path = out / f"benchmark_registry_{ts}.json"
text = json.dumps(results, indent=2) + "\n"
path.write_text(text)
digest = hashlib.sha256(text.encode()).hexdigest()
(out / f"benchmark_registry_{ts}.sigil.json").write_text(
    json.dumps({"scheme": "sha256", "file": path.name, "sha256": digest,
                "timestamp": results["timestamp"]}, indent=2) + "\n")
print(f"\n{'='*60}\n{path}\nSIGIL: {digest}")
for m, r in results["models"].items():
    ss = r.get("summary", {})
    print(f"  {m}: {ss.get('composite_pct',0):.1f}% ({ss.get('tasks_passed',0)}/{ss.get('tasks_tested',0)})")
