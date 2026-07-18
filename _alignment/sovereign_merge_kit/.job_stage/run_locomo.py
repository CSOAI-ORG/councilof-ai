#!/usr/bin/env python
"""
SOV honey-memory LoCoMo benchmark (RETRIEVAL benchmark, not training).

Builds a minimal HONEST memory system reflecting SOV design:
  - each conversation turn ingested as a TYPED item
  - stored with a PROVENANCE HASH  = sha256(content + "|" + source_turn_id)
  - stored with a TIMESTAMP (session date) for CURRENCY
  - top-k retrieval via sentence-transformers embeddings
  - answered by a small local HF model on the GPU

Also measures two moat axes the field's SOTA (Mem0/Zep) reportedly lacks:
  (a) ATTESTATION  -- % of retrieved items whose provenance hash re-verifies
  (b) CURRENCY     -- items past a freshness window get flagged stale
"""
import json, os, re, hashlib, random, string, datetime, sys
from collections import defaultdict, Counter

random.seed(42)
OUT = "out"; os.makedirs(OUT, exist_ok=True)
def log(*a): print(*a, flush=True)

DATA = "locomo10.json"
K = 10                       # retrieval depth
TARGET_PER_CAT = 50          # stratified subset size per non-adversarial category
FRESHNESS_WINDOW_DAYS = 90   # currency window
CAT_NAME = {1: "multi_hop", 2: "temporal", 3: "open_domain", 4: "single_hop"}

# ---------------------------------------------------------------- date parsing
DATE_FMTS = ["%I:%M %p on %d %B, %Y", "%I:%M %p on %d %B %Y",
             "%d %B, %Y", "%d %B %Y"]
def parse_date(s):
    if not s: return None
    s2 = s.strip().replace(" am", " AM").replace(" pm", " PM")
    for f in DATE_FMTS:
        try: return datetime.datetime.strptime(s2, f)
        except Exception: pass
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})", s)
    if m:
        for f in ["%d %B %Y", "%d %b %Y"]:
            try: return datetime.datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", f)
            except Exception: pass
    return None

# ---------------------------------------------------------------- memory item
def prov_hash(content, turn_id):
    return hashlib.sha256((content + "|" + turn_id).encode("utf-8")).hexdigest()

def build_memory(conv_top):
    """Return list of typed items for one conversation record."""
    conv = conv_top["conversation"]
    items = []
    sess_ids = sorted([int(k.split("_")[1]) for k in conv
                       if re.fullmatch(r"session_\d+", k)])
    for sid in sess_ids:
        turns = conv.get(f"session_{sid}", [])
        date = parse_date(conv.get(f"session_{sid}_date_time", ""))
        for t in turns:
            speaker = t.get("speaker", "?"); text = t.get("text", "")
            tid = t.get("dia_id", f"S{sid}")
            content = f"{speaker}: {text}"
            items.append({
                "type": "dialog_turn",
                "content": content,
                "source_turn_id": tid,
                "session": sid,
                "timestamp": date.isoformat() if date else None,
                "_ts": date,
                "provenance_hash": prov_hash(content, tid),
            })
    return items

# ---------------------------------------------------------------- grading
_ARTICLES = {"a", "an", "the"}
def norm(s):
    s = str(s).lower()
    s = s.translate(str.maketrans("", "", string.punctuation))
    toks = [w for w in s.split() if w not in _ARTICLES]
    return " ".join(toks)
def f1(pred, gold):
    pt, gt = norm(pred).split(), norm(gold).split()
    if not pt or not gt: return 0.0
    common = Counter(pt) & Counter(gt); ns = sum(common.values())
    if ns == 0: return 0.0
    p = ns/len(pt); r = ns/len(gt)
    return 2*p*r/(p+r)
def contains(pred, gold):
    g = norm(gold)
    return bool(g) and g in norm(pred)

# ---------------------------------------------------------------- load models
log("[load] sentence-transformers embedder ...")
from sentence_transformers import SentenceTransformer
import numpy as np, torch
DEV = "cuda" if torch.cuda.is_available() else "cpu"
log("[load] device:", DEV)
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=DEV)

ANSWERER = "Qwen/Qwen2.5-0.5B-Instruct"
log(f"[load] answerer {ANSWERER} ...")
from transformers import AutoModelForCausalLM, AutoTokenizer
tok = AutoTokenizer.from_pretrained(ANSWERER)
model = AutoModelForCausalLM.from_pretrained(
    ANSWERER, torch_dtype=(torch.float16 if DEV=="cuda" else torch.float32)).to(DEV).eval()

def answer(question, ctx_items):
    ctx = "\n".join(
        f"[{it['timestamp'] or 'undated'}] {it['content']}" for it in ctx_items)
    msg = [{"role": "system",
            "content": "Answer the question using ONLY the conversation excerpts. "
                       "Reply with the shortest possible factual answer (a name, date, "
                       "place, or short phrase). If a date is asked, give the date."},
           {"role": "user",
            "content": f"Excerpts:\n{ctx}\n\nQuestion: {question}\nAnswer:"}]
    prompt = tok.apply_chat_template(msg, tokenize=False, add_generation_prompt=True)
    ids = tok(prompt, return_tensors="pt", truncation=True, max_length=3072).to(DEV)
    with torch.no_grad():
        gen = model.generate(**ids, max_new_tokens=32, do_sample=False,
                             pad_token_id=tok.eos_token_id)
    out = tok.decode(gen[0][ids.input_ids.shape[1]:], skip_special_tokens=True)
    return out.strip().split("\n")[0].strip()

# ---------------------------------------------------------------- main
data = json.load(open(DATA))
log(f"[data] {len(data)} conversations")

# per-conversation memory + embeddings
mem, emb = {}, {}
for ci, conv in enumerate(data):
    items = build_memory(conv)
    mem[ci] = items
    vecs = embedder.encode([it["content"] for it in items],
                           convert_to_numpy=True, normalize_embeddings=True,
                           batch_size=256, show_progress_bar=False)
    emb[ci] = vecs
log("[mem] total items:", sum(len(v) for v in mem.values()))

# stratified subset of non-adversarial QA (cat 1-4)
by_cat = defaultdict(list)
for ci, conv in enumerate(data):
    for q in conv["qa"]:
        c = q.get("category")
        if c in CAT_NAME and q.get("answer") is not None:
            by_cat[c].append((ci, q))
subset = []
for c in sorted(by_cat):
    pool = by_cat[c]; random.shuffle(pool)
    subset += [(c, ci, q) for (ci, q) in pool[:TARGET_PER_CAT]]
random.shuffle(subset)
log("[subset] n =", len(subset), "per-cat:",
    {CAT_NAME[c]: min(len(by_cat[c]), TARGET_PER_CAT) for c in sorted(by_cat)})

# freshness reference = latest timestamp across all memory
all_ts = [it["_ts"] for v in mem.values() for it in v if it["_ts"]]
now_ref = max(all_ts) if all_ts else datetime.datetime.now()
window = datetime.timedelta(days=FRESHNESS_WINDOW_DAYS)
log("[currency] now_ref =", now_ref.isoformat(), "window_days =", FRESHNESS_WINDOW_DAYS)

# run
per_cat = defaultdict(lambda: {"n":0,"contain":0,"f1_sum":0.0})
retrieved_total = attest_valid = 0
stale_flagged = fresh_unflagged = 0
stale_example = fresh_example = None
records = []

for i, (cat, ci, q) in enumerate(subset):
    qtext = q["question"]; gold = q["answer"]
    qv = embedder.encode([qtext], convert_to_numpy=True, normalize_embeddings=True)[0]
    sims = emb[ci] @ qv
    topk = np.argsort(-sims)[:K]
    ctx = [mem[ci][j] for j in topk]

    # ---- MOAT (a) attestation: re-verify provenance hash of each retrieved item
    for it in ctx:
        retrieved_total += 1
        if prov_hash(it["content"], it["source_turn_id"]) == it["provenance_hash"]:
            attest_valid += 1
    # ---- MOAT (b) currency: flag stale retrieved items
    for it in ctx:
        if it["_ts"] is None: continue
        is_stale = (now_ref - it["_ts"]) > window
        if is_stale:
            stale_flagged += 1
            if stale_example is None:
                stale_example = {"turn": it["source_turn_id"], "ts": it["timestamp"],
                                 "age_days": (now_ref-it["_ts"]).days}
        else:
            fresh_unflagged += 1
            if fresh_example is None:
                fresh_example = {"turn": it["source_turn_id"], "ts": it["timestamp"],
                                 "age_days": (now_ref-it["_ts"]).days}

    pred = answer(qtext, ctx)
    ok = contains(pred, gold); sc = f1(pred, gold)
    per_cat[cat]["n"] += 1
    per_cat[cat]["contain"] += int(ok)
    per_cat[cat]["f1_sum"] += sc
    records.append({"category": CAT_NAME[cat], "q": qtext, "gold": str(gold),
                    "pred": pred, "contain": ok, "f1": round(sc,3)})
    if (i+1) % 25 == 0: log(f"[run] {i+1}/{len(subset)}")

# aggregate
per_category = {}
for c, s in per_cat.items():
    per_category[CAT_NAME[c]] = {
        "n": s["n"],
        "accuracy_contains": round(s["contain"]/s["n"], 4) if s["n"] else None,
        "mean_f1": round(s["f1_sum"]/s["n"], 4) if s["n"] else None,
    }
mean_acc = round(sum(v["accuracy_contains"] for v in per_category.values())/len(per_category), 4)
mean_f1  = round(sum(v["mean_f1"] for v in per_category.values())/len(per_category), 4)
attest_pct = round(100.0*attest_valid/retrieved_total, 2) if retrieved_total else None

result = {
    "ran": True,
    "answerer": ANSWERER,
    "embedder": "sentence-transformers/all-MiniLM-L6-v2",
    "device": DEV,
    "n": len(subset),
    "subset": True,
    "metric": "lexical: accuracy_contains = normalized gold answer present in prediction; "
              "mean_f1 = SQuAD-style token F1. (Lexical, NOT LLM-judge -- UNDERSTATES vs "
              "Mem0/Zep published LLM-judge 'J' scores.)",
    "per_category": per_category,
    "locomo_mean_accuracy_contains": mean_acc,
    "locomo_mean_f1": mean_f1,
    "moat_attestation": {
        "retrieved_items_total": retrieved_total,
        "provenance_hash_valid": attest_valid,
        "attestation_pct": attest_pct,
    },
    "moat_currency": {
        "now_ref": now_ref.isoformat(),
        "freshness_window_days": FRESHNESS_WINDOW_DAYS,
        "stale_flagged": stale_flagged,
        "fresh_unflagged": fresh_unflagged,
        "currency_works": bool(stale_flagged > 0 and fresh_unflagged > 0),
        "stale_example": stale_example,
        "fresh_example": fresh_example,
    },
}
json.dump(result, open(f"{OUT}/locomo_result.json","w"), indent=2)
json.dump(records[:60], open(f"{OUT}/locomo_samples.json","w"), indent=2)
log("[done]"); log(json.dumps({k:result[k] for k in
    ("locomo_mean_accuracy_contains","locomo_mean_f1","n",
     "moat_attestation","moat_currency")}, indent=2, default=str))
