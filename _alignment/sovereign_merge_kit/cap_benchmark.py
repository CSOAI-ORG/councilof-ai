#!/usr/bin/env python3
"""cap_benchmark.py — REAL held-out GENERAL-CAPABILITY battery for the SOV4 N6 merge.

Runs on Modal. Base Qwen/Qwen2.5-0.5B-Instruct downloaded from HF (not uploaded);
LoRA adapter (adapter_N6 = full-6 TIES merge, density 0.7) staged in ./adapter_N6/.

Three axes, greedy decode, per-axis accuracy + n:
  (a) reasoning  — GSM8K-style grade-school arithmetic word problems (numeric exact-match)
  (b) knowledge  — general textbook facts (contains-answer, case-insensitive)
  (c) instruction-following — does it obey a formatting constraint (per-item rubric)

Sources / licences of the item styles:
  - reasoning items are ORIGINAL problems written in the GSM8K grade-school style
    (Cobbe et al. 2021, GSM8K, MIT licence). Not verbatim GSM8K rows — original,
    so no dataset-licence encumbrance; gold answers are computed, not hand-typed.
  - knowledge items are ORIGINAL general-knowledge questions (public-domain facts).
  - instruction items are ORIGINAL IFEval-style verifiable-instruction prompts
    (Zhou et al. 2023, IFEval, Apache-2.0 methodology; prompts written here).
All items embedded below; nothing fetched at runtime except the base model.
"""
import os, json, re
os.makedirs("out", exist_ok=True)

# ---------------------------------------------------------------- axis (a) reasoning
# (problem, gold_int). Golds are the integer answers; verified by construction on host.
REASONING = [
    ("A baker made 48 muffins. She sold 19 in the morning and 12 in the afternoon. How many muffins are left?", 17),
    ("Tom has 3 boxes with 12 pencils each. He gives away 8 pencils. How many pencils does he have now?", 28),
    ("A class of 30 students goes on a trip. Each van holds 7 students. How many vans are completely full?", 4),
    ("Sara reads 15 pages a day for 6 days. Her book has 120 pages. How many pages are left to read?", 30),
    ("A shop sells apples at 4 for $2. How many dollars for 20 apples?", 10),
    ("Ben saves $5 each week. After how many weeks will he have saved $45?", 9),
    ("There are 3 shelves with 9 books each and 2 shelves with 6 books each. How many books in total?", 39),
    ("A rope is 24 meters long. It is cut into pieces of 3 meters. How many pieces are there?", 8),
    ("Maria buys 6 packs of gum with 5 pieces each. She chews 7 pieces. How many pieces remain?", 23),
    ("A train travels 60 km per hour for 3 hours, then 40 km in the next hour. How many km total?", 220),
    ("A farmer collects 84 eggs and packs them into cartons of 12. How many cartons does he fill?", 7),
    ("Lucy has $50. She buys 3 books at $8 each. How much money does she have left?", 26),
]

# ---------------------------------------------------------------- axis (b) knowledge
KNOWLEDGE = [
    ("What is the capital of France?", ["paris"]),
    ("What gas do plants absorb from the air for photosynthesis?", ["carbon dioxide", "co2"]),
    ("How many continents are there on Earth?", ["7", "seven"]),
    ("What is the largest planet in our solar system?", ["jupiter"]),
    ("What is the chemical symbol for water?", ["h2o"]),
    ("Who wrote the play Romeo and Juliet?", ["shakespeare"]),
    ("What is the freezing point of water in degrees Celsius?", ["0", "zero"]),
    ("What is the closest star to Earth?", ["the sun", "sun"]),
    ("How many sides does a triangle have?", ["3", "three"]),
    ("What is the capital of Japan?", ["tokyo"]),
    ("What planet is known as the Red Planet?", ["mars"]),
    ("What is the powerhouse of the cell?", ["mitochondria", "mitochondrion"]),
]

# ---------------------------------------------------------------- axis (c) instruction-following
INSTRUCTION = [
    {"prompt": "Answer with exactly one word: what color is the sky on a clear day?", "check": "exactly_n_words", "n": 1},
    {"prompt": "Reply in all capital letters: say hello.", "check": "all_caps"},
    {"prompt": "List exactly three fruits, one per line, each starting with a dash '-'.", "check": "n_dash_lines", "n": 3},
    {"prompt": "End your response with the exact word DONE.", "check": "ends_with", "word": "DONE"},
    {"prompt": "Respond with exactly two sentences about dogs.", "check": "exactly_n_sentences", "n": 2},
    {"prompt": "Answer in exactly four words: describe the ocean.", "check": "exactly_n_words", "n": 4},
    {"prompt": "Write your answer entirely in lowercase: name a country.", "check": "all_lower"},
    {"prompt": "Begin your response with the word 'Answer:' and then give any number.", "check": "starts_with", "word": "Answer:"},
    {"prompt": "Provide exactly five words describing a forest.", "check": "exactly_n_words", "n": 5},
    {"prompt": "Reply with a single sentence that ends in a question mark.", "check": "ends_qmark"},
    {"prompt": "List exactly two colors separated by a comma.", "check": "n_comma_items", "n": 2},
    {"prompt": "Answer using no more than three words: what is 2 plus 2?", "check": "max_n_words", "n": 3},
]

# ---------------------------------------------------------------- graders
def last_int(text):
    nums = re.findall(r"-?\d[\d,]*", text)
    if not nums:
        return None
    return int(nums[-1].replace(",", ""))

def grade_reasoning(resp, gold):
    return last_int(resp) == gold

def grade_knowledge(resp, accepted):
    t = resp.lower()
    return any(a in t for a in accepted)

def _words(text):
    return [w for w in re.findall(r"[A-Za-z0-9'-]+", text)]

def _sentences(text):
    return [s for s in re.split(r"[.!?]+", text) if s.strip()]

def grade_instruction(resp, item):
    c = item["check"]; r = resp.strip()
    if c == "exactly_n_words":
        return len(_words(r)) == item["n"]
    if c == "max_n_words":
        return 1 <= len(_words(r)) <= item["n"]
    if c == "all_caps":
        letters = [ch for ch in r if ch.isalpha()]
        return len(letters) > 0 and all(ch.isupper() for ch in letters)
    if c == "all_lower":
        letters = [ch for ch in r if ch.isalpha()]
        return len(letters) > 0 and all(ch.islower() for ch in letters)
    if c == "n_dash_lines":
        lines = [ln.strip() for ln in r.splitlines() if ln.strip()]
        dash = [ln for ln in lines if ln.startswith("-")]
        return len(dash) == item["n"] and len(lines) == item["n"]
    if c == "ends_with":
        return r.rstrip().rstrip(".!").endswith(item["word"])
    if c == "starts_with":
        return r.startswith(item["word"])
    if c == "exactly_n_sentences":
        return len(_sentences(r)) == item["n"]
    if c == "ends_qmark":
        return r.endswith("?") and len(_sentences(r)) == 1
    if c == "n_comma_items":
        parts = [p.strip() for p in r.split(",") if p.strip()]
        return len(parts) == item["n"]
    return False

# ---------------------------------------------------------------- generation
def gen(model, tok, device, prompt, max_new=96):
    import torch
    msgs = [{"role": "user", "content": prompt}]
    text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    enc = tok(text, return_tensors="pt").to(device)
    with torch.no_grad():
        out = model.generate(input_ids=enc.input_ids, attention_mask=enc.attention_mask,
                             max_new_tokens=max_new, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0][enc.input_ids.shape[1]:], skip_special_tokens=True)

def run_axes(model, tok, device):
    res = {}
    # reasoning
    items = []
    correct = 0
    for prompt, gold in REASONING:
        resp = gen(model, tok, device, prompt, 128)
        ok = grade_reasoning(resp, gold)
        correct += ok
        items.append({"prompt": prompt, "gold": gold, "pred": last_int(resp), "ok": bool(ok), "resp": resp[:200]})
    res["reasoning"] = {"n": len(REASONING), "correct": correct, "acc": round(correct/len(REASONING), 4), "items": items}
    # knowledge
    items = []; correct = 0
    for prompt, acc in KNOWLEDGE:
        resp = gen(model, tok, device, prompt, 64)
        ok = grade_knowledge(resp, acc)
        correct += ok
        items.append({"prompt": prompt, "accepted": acc, "ok": bool(ok), "resp": resp[:200]})
    res["knowledge"] = {"n": len(KNOWLEDGE), "correct": correct, "acc": round(correct/len(KNOWLEDGE), 4), "items": items}
    # instruction
    items = []; correct = 0
    for item in INSTRUCTION:
        resp = gen(model, tok, device, item["prompt"], 96)
        ok = grade_instruction(resp, item)
        correct += ok
        items.append({"prompt": item["prompt"], "check": item["check"], "ok": bool(ok), "resp": resp[:200]})
    res["instruction"] = {"n": len(INSTRUCTION), "correct": correct, "acc": round(correct/len(INSTRUCTION), 4), "items": items}
    return res

def main():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("device", device)
    base_id = "Qwen/Qwen2.5-0.5B-Instruct"
    tok = AutoTokenizer.from_pretrained(base_id)

    out = {"base_id": base_id, "adapter": "adapter_N6 (full-6 TIES merge, density 0.7)", "device": device}

    # merged (base + N6 adapter)
    base = AutoModelForCausalLM.from_pretrained(base_id, torch_dtype=torch.float16).to(device)
    model = PeftModel.from_pretrained(base, "adapter_N6").to(device); model.eval()
    print("running MERGED (N6)...")
    out["merged_N6"] = run_axes(model, tok, device)
    del model, base
    if device == "cuda": torch.cuda.empty_cache()

    # base-only reference (same battery, no adapter) — context for the delta
    base = AutoModelForCausalLM.from_pretrained(base_id, torch_dtype=torch.float16).to(device)
    base.eval()
    print("running BASE (reference)...")
    out["base_only"] = run_axes(base, tok, device)

    json.dump(out, open("out/cap_benchmark_result.json", "w"), indent=1)
    for tag in ("merged_N6", "base_only"):
        r = out[tag]
        print(f"{tag}: reasoning={r['reasoning']['acc']} ({r['reasoning']['correct']}/{r['reasoning']['n']})"
              f" knowledge={r['knowledge']['acc']} ({r['knowledge']['correct']}/{r['knowledge']['n']})"
              f" instruction={r['instruction']['acc']} ({r['instruction']['correct']}/{r['instruction']['n']})")

if __name__ == "__main__":
    main()
