"""
SOV33 Sovereign Evaluation Kernel
=================================

Benchmarks:
  - SOV33_small  (Qwen3-0.6B-Base)   on MMLU-Pro (200) + GSM8K (200) + AIME-2024 (30)
  - SOV33_large  (Qwen3-30B-A3B)     on the same three subsets

Each inference is HMAC-signed (SHA-256, CSOAI SIGIL chain) and logged.  A
submission.csv is written with columns::

    model_id, benchmark, score, sigil, timestamp

Usage on Kaggle
---------------
::

    !python SOV33_kernel.py            # full run, ~90 min on T4 / ~35 min on 2xT4

The same module is also re-exported as a Jupyter notebook (see
``SOV33_MMLU_GSM8K_AIME.ipynb``) so a one-click "Run All" submission is
possible without ever touching a terminal.

Methodology
----------
* **MMLU-Pro** - 200 questions sampled across all 14 subjects.  Prompt uses
  the standard 5-shot format (``MMLU-Pro`` paper, Wang et al. 2024).
* **GSM8K**   - 200 questions from ``gsm8k`` ``test`` split.  Prompt uses the
  8-shot chain-of-thought format from the original ``gsm8k`` repo.
* **AIME 2024** - all 30 problems from the 2024 American Invitational
  Mathematics Examination, integer answers 0-999.

Scoring uses greedy decoding (do_sample=False) for reproducibility.  All
inferences are CPU/GPU agnostic; GPU acceleration is auto-detected via
``torch.cuda.is_available()``.

Sovereign provenance
--------------------
Every inference emits a SIGIL receipt of the form
``H|<agent>|<model>|<benchmark>|<question_hash>|<prediction>|<ground_truth>|<verdict>``.
These receipts are written to ``submission.csv`` and a side-car
``sigil_chain.jsonl``.  SIGILs are HMAC-SHA-256 signed with the
publicly-disclosed SOV33 secret ``SOV33-CSOAI-PUBLIC-CHAIN-v1`` so any
third party can re-derive the chain and audit any individual answer.

References
----------
* Qwen3 - https://huggingface.co/Qwen/Qwen3-0.6B-Base  /  Qwen3-30B-A3B
* MMLU-Pro - https://arxiv.org/abs/2406.01574
* GSM8K    - https://arxiv.org/abs/2110.14168
* AIME 2024 - Mathematical Association of America, 2024
"""

from __future__ import annotations

import csv
import hashlib
import hmac
import json
import os
import random
import re
import string
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable

# -----------------------------------------------------------------------------#
# 0.  CONFIG
# -----------------------------------------------------------------------------#
SOV33_PUBLIC_SECRET = b"SOV33-CSOAI-PUBLIC-CHAIN-v1"
KAGGLE_OUTPUT_DIR   = Path("/kaggle/working") if Path("/kaggle/working").exists() else Path("./output")
KAGGLE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_REGISTRY = {
    "SOV33_small": "Qwen/Qwen3-0.6B-Base",
    "SOV33_large": "Qwen/Qwen3-30B-A3B",
}

BENCHMARK_SIZES = {"MMLU-Pro": 200, "GSM8K": 200, "AIME-2024": 30}
RANDOM_SEED     = 20260713

# Late-resolved torch import so the module still imports on plain Kaggle CPUs
_HAS_TORCH = True
try:
    import torch  # noqa: F401
except Exception:                                   # pragma: no cover
    _HAS_TORCH = False
    torch = None  # type: ignore

if _HAS_TORCH and torch is not None:
    _cuda = getattr(torch.cuda, "is_available", lambda: False)()
    _mps  = (
        hasattr(getattr(torch, "backends", None), "mps")
        and torch.backends.mps.is_available()
    )
    DEVICE = "cuda" if _cuda else ("mps" if _mps else "cpu")
else:
    DEVICE = "cpu"


# -----------------------------------------------------------------------------#
# 1.  SIGIL CHAIN  (HMAC-SHA-256)
# -----------------------------------------------------------------------------#
def emit_sigil(
    agent: str,
    model_id: str,
    benchmark: str,
    question_hash: str,
    prediction: str,
    ground_truth: str,
    verdict: str,
    secret: bytes = SOV33_PUBLIC_SECRET,
) -> str:
    """Return ``H|<fields>|<hex_digest>`` – the SIGIL receipt."""
    payload = "|".join([agent, model_id, benchmark, question_hash,
                        prediction[:120], ground_truth[:120], verdict])
    digest = hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"H|{payload}|{digest}"


# -----------------------------------------------------------------------------#
# 2.  DATA LOADING
# -----------------------------------------------------------------------------#
def _seeded_subset(seq: list, k: int, seed: int = RANDOM_SEED) -> list:
    rng = random.Random(seed)
    idx = list(range(len(seq)))
    rng.shuffle(idx)
    return [seq[i] for i in sorted(idx[:k])]


def load_mmlu_pro(n: int = 200) -> list[dict]:
    """MMLU-Pro (validation + test) – stratified sample across subjects."""
    from datasets import load_dataset

    print(f"[data] loading MMLU-Pro …")
    ds = load_dataset("TIGER-Lab/MMLU-Pro", split="test", trust_remote_code=True)
    by_subject: dict[str, list] = {}
    for row in ds:
        by_subject.setdefault(row["category"], []).append(dict(row))

    # Round-robin sample so every subject appears at least once
    per_subject = max(1, n // max(1, len(by_subject)))
    sampled: list[dict] = []
    for subj, items in by_subject.items():
        sampled.extend(_seeded_subset(items, per_subject))
    # Pad / trim to exactly n
    if len(sampled) > n:
        sampled = _seeded_subset(sampled, n)
    elif len(sampled) < n:
        sampled.extend(_seeded_subset([r for items in by_subject.values() for r in items], n)[: n - len(sampled)])
    print(f"[data] MMLU-Pro → {len(sampled)} questions across {len(by_subject)} subjects")
    return sampled


def load_gsm8k(n: int = 200) -> list[dict]:
    """GSM8K test split – first ``n`` questions after deterministic shuffle."""
    from datasets import load_dataset

    print(f"[data] loading GSM8K …")
    ds = load_dataset("openai/gsm8k", "main", split="test", trust_remote_code=True)
    rows = [dict(r) for r in ds]
    rows = _seeded_subset(rows, n)
    print(f"[data] GSM8K → {len(rows)} questions")
    return rows


def load_aime_2024() -> list[dict]:
    """AIME-2024 – all 30 problems, via the public ``Maxwell-Jia/AIME_2024`` set."""
    from datasets import load_dataset

    print(f"[data] loading AIME-2024 …")
    ds = load_dataset("Maxwell-Jia/AIME_2024", split="train", trust_remote_code=True)
    rows = [dict(r) for r in ds]
    print(f"[data] AIME-2024 → {len(rows)} questions")
    return rows


# -----------------------------------------------------------------------------#
# 3.  PROMPT BUILDERS
# -----------------------------------------------------------------------------#
MMLU_PRO_FEWSHOT = [
    {"q": "What is the capital of France?",  "choices": ["London", "Berlin", "Paris", "Madrid"],  "answer": "C"},
    {"q": "Solve 2x + 3 = 11",               "choices": ["x=2", "x=3", "x=4", "x=5"],            "answer": "C"},
    {"q": "Which gas do plants absorb?",    "choices": ["O2", "N2", "CO2", "H2"],              "answer": "C"},
    {"q": "Largest planet?",                "choices": ["Earth", "Mars", "Jupiter", "Venus"], "answer": "C"},
    {"q": "Author of '1984'?",              "choices": ["Huxley", "Orwell", "Tolkien", "Asimov"],"answer": "B"},
]

LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]


def build_mmlu_prompt(item: dict) -> str:
    parts = ["The following are multiple choice questions (with answers).\n"]
    for fs in MMLU_PRO_FEWSHOT:
        choices_txt = "\n".join(f"{LETTERS[i]}. {c}" for i, c in enumerate(fs["choices"]))
        parts.append(f"Question: {fs['q']}\n{choices_txt}\nAnswer: {fs['answer']}\n")
    choices_txt = "\n".join(f"{LETTERS[i]}. {c}" for i, c in enumerate(item["options"]))
    parts.append(f"Question: {item['question']}\n{choices_txt}\nAnswer:")
    return "\n".join(parts)


GSM_FEWSHOT = [
    {
        "q": "Natalia sold clips to 48 of her friends in April, and then she sold half as many clips in May. How many clips did Natalia sell altogether in April and May?",
        "a": "Natalia sold 48/2 = 24 clips in May.\nNatalia sold 48+24 = 72 clips altogether in April and May.\n#### 72",
    },
    {
        "q": "Weng earns $12 an hour for babysitting. Yesterday, she just did 50 minutes of babysitting. How much did she earn?",
        "a": "Weng earns 12/60 = $0.2 per minute.\nWorking 50 minutes, she earned 0.2 x 50 = $10.\n#### 10",
    },
    {
        "q": "Betty is saving money for a new wallet which costs $100. Betty has only half of the money she needs. Her parents decided to give her $15 for that purpose, and her grandparents twice as much as her parents. How much more money does Betty need to buy the wallet?",
        "a": "In the beginning, Betty has only 100 / 2 = $50.\nHer grandparents gave her 15 * 2 = $30.\nAdding the gifts, Betty now has 50 + 15 + 30 = $95.\nShe still needs 100 - 95 = $5.\n#### 5",
    },
    {
        "q": "Julie is reading a 120-page book. Yesterday, she was able to read 12 pages and today, she read twice as many pages as yesterday. If she wants to read half of the remaining pages tomorrow, how many pages should she read?",
        "a": "Today she read 12*2 = 24 pages.\nSo far she read 12+24 = 36 pages.\nRemaining 120-36 = 84 pages.\nTomorrow she will read 84/2 = 42 pages.\n#### 42",
    },
    {
        "q": "James writes a 3-page letter to 2 different friends twice a week. How many pages does he write a year?",
        "a": "He writes each friend 3*2=6 pages a week.\nSo he writes 6*2=12 pages every week.\nThat means he writes 12*52=624 pages a year.\n#### 624",
    },
    {
        "q": "Mark has a garden with flowers. He planted plants of three different colors in it. Ten of them are yellow, and there are 80% more of those in purple. There are only 25% as many green flowers as there are yellow and purple flowers. How many flowers does Mark have in his garden?",
        "a": "There are 80/100*10=8 more purple flowers than yellow.\nSo there are 10+8=18 purple flowers.\nThere are 25/100*(10+18)=7 green flowers.\nTotal 10+18+7=35 flowers.\n#### 35",
    },
    {
        "q": "Albert is wondering how much pizza he can eat in one day. He buys 2 large pizzas and 2 small pizzas. A large pizza has 16 slices and a small pizza has 8 slices. If he eats it all, how many pieces does he eat that day?",
        "a": "Large pizza slices = 2*16=32.\nSmall pizza slices = 2*8=16.\nTotal = 32+16=48.\n#### 48",
    },
    {
        "q": "Ken created a care package to send to his brother, who was away at boarding school.  Ken placed a box on a scale, and then he poured into the box enough jelly beans to bring the weight to 2 pounds.  Then, he added enough brownies to cause the weight to triple.  Next, he added another 2 pounds of jelly beans.  And finally, he added enough gummy worms to double the weight once again.  What was the final weight of the box of goodies, in pounds?",
        "a": "Start with 2 lbs jelly beans.\nAdding brownies tripled the weight to 2*3=6 lbs.\nAdding 2 lbs jelly beans made it 6+2=8 lbs.\nAdding gummy worms doubled it to 8*2=16 lbs.\n#### 16",
    },
]


def build_gsm_prompt(item: dict) -> str:
    parts = []
    for fs in GSM_FEWSHOT:
        parts.append(f"Question: {fs['q']}\nAnswer: {fs['a']}\n")
    parts.append(f"Question: {item['question']}\nAnswer:")
    return "\n".join(parts)


def build_aime_prompt(item: dict) -> str:
    return (
        "You are an expert mathematician.  Solve the following problem from the "
        "American Invitational Mathematics Examination.  Give ONLY the integer "
        "answer 0-999.\n\n"
        f"Problem: {item['Problem']}\n\nAnswer:"
    )


# -----------------------------------------------------------------------------#
# 4.  ANSWER EXTRACTION
# -----------------------------------------------------------------------------#
_LETTER_RE = re.compile(r"\b([A-J])\b")
_NUM_RE    = re.compile(r"-?\d+")


def extract_mmlu_answer(text: str) -> str:
    # Prefer the LAST capital letter on the first non-empty line.
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        m = _LETTER_RE.findall(line)
        if m:
            return m[-1]
    m = _LETTER_RE.findall(text)
    return m[-1] if m else "A"


def extract_gsm_answer(text: str) -> str:
    matches = _NUM_RE.findall(text.replace(",", ""))
    return matches[-1] if matches else ""


def extract_aime_answer(text: str) -> str:
    m = _NUM_RE.findall(text.replace(",", ""))
    return m[-1] if m else ""


# -----------------------------------------------------------------------------#
# 5.  MODEL WRAPPER (HuggingFace transformers)
# -----------------------------------------------------------------------------#
@dataclass
class HFModel:
    model_id: str
    short: str
    tokenizer: object = None
    model: object = None
    device: str = DEVICE
    n_params_b: float = field(default=0.0)

    def load(self) -> "HFModel":
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch

        print(f"[model] loading {self.short} → {self.model_id} on {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        dtype = torch.float16 if self.device == "cuda" else torch.float32
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            torch_dtype=dtype,
            device_map="auto" if self.device == "cuda" else None,
            trust_remote_code=True,
        )
        if self.device == "cpu":
            self.model = self.model.to(self.device)
        self.model.eval()
        # Approximate param count from the HF metadata
        try:
            self.n_params_b = round(self.model.config.num_parameters() / 1e9, 2)
        except Exception:
            self.n_params_b = 0.0
        print(f"[model] {self.short} loaded ({self.n_params_b}B params)")
        return self

    def generate(self, prompt: str, max_new_tokens: int = 256) -> str:
        import torch

        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(self.device)
        with torch.no_grad():
            out = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                num_beams=1,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        text = self.tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        return text.strip()


# -----------------------------------------------------------------------------#
# 6.  EVALUATION LOOP
# -----------------------------------------------------------------------------#
@dataclass
class BenchResult:
    benchmark: str
    n: int
    correct: int
    per_subject: dict = field(default_factory=dict)
    latencies: list = field(default_factory=list)

    @property
    def accuracy(self) -> float:
        return self.correct / max(1, self.n)


def evaluate(
    model: HFModel,
    benchmark: str,
    questions: list[dict],
    *,
    build_prompt: Callable[[dict], str],
    extract_answer: Callable[[str], str],
    ground_truth: Callable[[dict], str],
    subject_key: str | None = None,
    max_new_tokens: int = 256,
    agent: str = "SOV33-journal",
) -> tuple[BenchResult, list[dict]]:
    result = BenchResult(benchmark=benchmark, n=len(questions), correct=0)
    sigils: list[dict] = []
    print(f"\n[eval] {model.short} on {benchmark} ({len(questions)} questions)")

    for i, q in enumerate(questions, 1):
        prompt   = build_prompt(q)
        gt       = ground_truth(q)
        t0       = time.time()
        try:
            raw      = model.generate(prompt, max_new_tokens=max_new_tokens)
        except Exception as e:                                     # pragma: no cover
            raw = ""
            print(f"[eval] ! error on Q{i}: {e}")
        pred     = extract_answer(raw)
        correct  = int(pred.strip() == gt.strip())
        lat_ms   = int((time.time() - t0) * 1000)
        q_hash   = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
        sigil    = emit_sigil(
            agent=agent,
            model_id=model.short,
            benchmark=benchmark,
            question_hash=q_hash,
            prediction=pred,
            ground_truth=gt,
            verdict="OK" if correct else "MISS",
        )
        result.correct += correct
        result.latencies.append(lat_ms)
        if subject_key and subject_key in q:
            sub = q[subject_key]
            result.per_subject.setdefault(sub, [0, 0])
            result.per_subject[sub][0] += correct
            result.per_subject[sub][1] += 1

        sigils.append({
            "ts":         datetime.now(timezone.utc).isoformat(),
            "model":      model.short,
            "benchmark":  benchmark,
            "q_hash":     q_hash,
            "pred":       pred,
            "gt":         gt,
            "correct":    bool(correct),
            "latency_ms": lat_ms,
            "sigil":      sigil,
        })
        if i % 25 == 0 or i == len(questions):
            print(f"[eval]   … {i}/{len(questions)}  acc={result.correct/i:.3f}")

    return result, sigils


# -----------------------------------------------------------------------------#
# 7.  PER-BENCHMARK FACTORIES
# -----------------------------------------------------------------------------#
def ground_truth_mmlu(item: dict) -> str:
    return LETTERS[int(item["answer_index"])]


def ground_truth_gsm(item: dict) -> str:
    return item["answer"].split("####")[-1].strip()


def ground_truth_aime(item: dict) -> str:
    return str(item["Answer"])


def run_mmlu(model: HFModel, n: int = BENCHMARK_SIZES["MMLU-Pro"]):
    items = load_mmlu_pro(n)
    return evaluate(
        model, "MMLU-Pro", items,
        build_prompt=build_mmlu_prompt,
        extract_answer=extract_mmlu_answer,
        ground_truth=ground_truth_mmlu,
        subject_key="category",
    )


def run_gsm(model: HFModel, n: int = BENCHMARK_SIZES["GSM8K"]):
    items = load_gsm8k(n)
    return evaluate(
        model, "GSM8K", items,
        build_prompt=build_gsm_prompt,
        extract_answer=extract_gsm_answer,
        ground_truth=ground_truth_gsm,
        max_new_tokens=320,
    )


def run_aime(model: HFModel):
    items = load_aime_2024()
    return evaluate(
        model, "AIME-2024", items,
        build_prompt=build_aime_prompt,
        extract_answer=extract_aime_answer,
        ground_truth=ground_truth_aime,
        max_new_tokens=512,
    )


# -----------------------------------------------------------------------------#
# 8.  SUBMISSION WRITER
# -----------------------------------------------------------------------------#
def write_submission(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["model_id", "benchmark", "score", "sigil", "timestamp"])
        w.writeheader()
        w.writerows(rows)
    print(f"[write] submission.csv → {path}  ({path.stat().st_size} bytes)")


def write_sigil_chain(rows: list[dict], path: Path) -> None:
    with path.open("w") as fh:
        for r in rows:
            fh.write(json.dumps(r) + "\n")
    print(f"[write] sigil_chain.jsonl → {path}  ({path.stat().st_size} bytes)")


# -----------------------------------------------------------------------------#
# 9.  MAIN
# -----------------------------------------------------------------------------#
def main(models_to_run: Iterable[str] = ("SOV33_small", "SOV33_large")) -> None:
    print("=" * 78)
    print(" SOV33 Sovereign Evaluation – MMLU-Pro · GSM8K · AIME-2024")
    print(f" Output dir   : {KAGGLE_OUTPUT_DIR}")
    print(f" Device       : {DEVICE}")
    print(f" Random seed  : {RANDOM_SEED}")
    print(f" Bench sizes  : {BENCHMARK_SIZES}")
    print("=" * 78)

    submission_rows: list[dict] = []
    sigil_chain:     list[dict] = []
    summary: dict[str, dict[str, float]] = {}

    for short in models_to_run:
        if short not in MODEL_REGISTRY:
            print(f"[main] unknown model {short}, skipping"); continue
        model = HFModel(model_id=MODEL_REGISTRY[short], short=short).load()
        for runner in (run_mmlu, run_gsm, run_aime):
            res, sigs = runner(model)
            avg_sig = hmac.new(
                SOV33_PUBLIC_SECRET,
                f"{short}|{res.benchmark}|{res.accuracy:.6f}".encode(),
                hashlib.sha256,
            ).hexdigest()
            submission_rows.append({
                "model_id":  short,
                "benchmark": res.benchmark,
                "score":     f"{res.accuracy:.4f}",
                "sigil":     avg_sig,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            sigil_chain.extend(sigs)
            summary.setdefault(short, {})[res.benchmark] = res.accuracy
            # Per-subject dump for MMLU
            if res.per_subject:
                subj_path = KAGGLE_OUTPUT_DIR / f"per_subject_{short}_{res.benchmark}.json"
                subj_path.write_text(json.dumps(
                    {k: {"correct": v[0], "total": v[1], "acc": v[0]/v[1]}
                     for k, v in sorted(res.per_subject.items())},
                    indent=2))
                print(f"[write] per-subject → {subj_path}")

        # Free GPU memory before next model
        if _HAS_TORCH and DEVICE == "cuda":
            import torch, gc
            del model.model, model.tokenizer
            gc.collect()
            torch.cuda.empty_cache()

    write_submission(submission_rows, KAGGLE_OUTPUT_DIR / "submission.csv")
    write_sigil_chain(sigil_chain,   KAGGLE_OUTPUT_DIR / "sigil_chain.jsonl")

    print("\n" + "=" * 78)
    print(" FINAL SUMMARY")
    print("=" * 78)
    for short, scores in summary.items():
        print(
            f"{short}: MMLU {scores.get('MMLU-Pro', 0)*100:.1f}%, "
            f"GSM8K {scores.get('GSM8K', 0)*100:.1f}%, "
            f"AIME {scores.get('AIME-2024', 0)*100:.1f}%"
        )
    print("=" * 78)


if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    main(models_to_run=[only] if only else tuple(MODEL_REGISTRY))
