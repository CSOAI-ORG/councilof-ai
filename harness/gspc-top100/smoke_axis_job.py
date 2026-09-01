# /// script
# requires-python = ">=3.10"
# dependencies = ["vllm", "huggingface_hub", "pydantic"]
# ///
"""SMOKE TEST — one GSPC axis over the frozen HF top-100, vLLM offline batch.

PREPARED, NOT LAUNCHED. Running this on HF Jobs spends real money on a payment
method on file. Do not launch without the owner's explicit go-ahead.

What it does (one axis, one Job):
  1. Loads the frozen top-100 census (frozen-top100.json).
  2. For each vLLM-servable candidate, loads it offline and runs ONE axis's
     frozen item bank (deterministic decoding: temperature=0, seed fixed).
  3. Emits PER-ITEM rows (model, item_id, prompt_sha, output, gold, pass/fail).
  4. Grades DETERMINISTICALLY (exact/regex gold match — no model-as-judge).
  5. Emits one card-v0 atom per model for this axis (UNSIGNED, sig=null),
     ≤3KB payload, three-state (MEASURED only after GHA signs + verifies).

INPUT the owner must mount — NOT in this repo:
  The canonical 22 frozen axis banks are the input to agents-repo board_v2.py.
  This checkout has only axis DESCRIPTORS (content/axis/*.md) and one bench pack
  (public/packs/eu-article-50/provbench.json). Point AXIS_BANK at the real frozen
  bank (deterministic items + gold) before any measurement counts.

Launch (owner, after explicit spend approval):
  hf jobs run --flavor t4-small \\
    --secrets HF_TOKEN \\
    -d ./harness/gspc-top100 \\
    python:3.12 \\
    hf jobs uv run harness/gspc-top100/smoke_axis_job.py --axis det --bank <AXIS_BANK>

Cost reality (be honest, do not under-quote):
  t4-small = $0.40/hr. Model LOAD dominates, not inference: 100 distinct repos
  loaded sequentially on one T4 is the real cost, and 34/100 are GGUF/quant repos
  that a plain vLLM HF load will REJECT. A realistic single-axis smoke over the
  66 servable candidates is a few $ and may exceed one hour, not $0.60. The
  $0.60 figure only holds for a small subset (e.g. the 10 smallest servable
  models). Prove on a subset first; report the measured wall-clock + $ before fan-out.
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from pathlib import Path

DID = "did:web:csoai.org#card-attestation-1"  # unsigned; GHA re-kids to board-attestation-1 on sign
SCHEMA = "https://councilof.ai/schema/card-v0.json"


def canonical(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def grade(output: str, gold: dict) -> bool:
    """Deterministic only. No model-as-judge. gold = {'match':'exact'|'regex','value':...}."""
    o = output.strip()
    if gold["match"] == "exact":
        return o == gold["value"].strip()
    if gold["match"] == "regex":
        return re.search(gold["value"], o) is not None
    raise ValueError(f"unknown gold match {gold['match']!r}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--axis", required=True)
    ap.add_argument("--bank", required=True, help="path to the frozen axis item bank (items + gold)")
    ap.add_argument("--census", default=str(Path(__file__).parent / "frozen-top100.json"))
    ap.add_argument("--out", default="axis-rows.jsonl")
    ap.add_argument("--limit-models", type=int, default=0, help="0=all servable; else subset for a cheap smoke")
    args = ap.parse_args()

    census = json.loads(Path(args.census).read_text())
    bank = json.loads(Path(args.bank).read_text())  # {"items":[{"id","prompt","gold":{...}}]}
    items = bank["items"]
    models = [m for m in census["models"] if m["vllm_servable_candidate"]]
    if args.limit_models:
        models = models[: args.limit_models]

    try:
        from vllm import LLM, SamplingParams
    except Exception as e:  # noqa: BLE001
        print(f"HALT — vLLM not importable ({e}); this must run on a GPU Job, not a laptop", file=sys.stderr)
        return 2

    sp = SamplingParams(temperature=0.0, seed=0, max_tokens=512)
    rows_fp = open(args.out, "w")
    atoms = []
    for m in models:
        mid = m["model_id"]
        try:
            llm = LLM(model=mid, dtype="auto", enforce_eager=True)
        except Exception as e:  # noqa: BLE001
            # honest three-state: cannot load => UNMEASURED, not a fake pass
            atoms.append(_atom(mid, args.axis, None, None, f"LOAD_FAILED: {str(e)[:120]}"))
            continue
        outs = llm.generate([it["prompt"] for it in items], sp)
        n_pass = 0
        for it, out in zip(items, outs):
            text = out.outputs[0].text
            ok = grade(text, it["gold"])
            n_pass += int(ok)
            rows_fp.write(json.dumps({
                "model": mid, "axis": args.axis, "item_id": it["id"],
                "prompt_sha256": hashlib.sha256(it["prompt"].encode()).hexdigest(),
                "output": text, "gold": it["gold"], "pass": ok,
            }, ensure_ascii=False) + "\n")
        atoms.append(_atom(mid, args.axis, n_pass, len(items), None))
    rows_fp.close()
    Path("axis-atoms.json").write_text(json.dumps(
        {"schema": "csoai.gspc-axis-atoms/0.1", "axis": args.axis, "n_atoms": len(atoms),
         "honesty": "UNSIGNED atoms. MEASURED only after GHA signs green and the card verifies VALID.",
         "atoms": atoms}, indent=1, ensure_ascii=False) + "\n")
    print(f"axis={args.axis} models={len(models)} items={len(items)} -> {len(atoms)} unsigned atoms")
    return 0


def _atom(model: str, axis: str, n_pass, n_total, load_err) -> dict:
    measured = load_err is None
    payload = {
        "kind": "csoai.gspc-axis-result/0.1", "model": model, "axis": axis,
        "status": "UNMEASURED" if not measured else "PENDING_SIGN",
        "n_pass": n_pass, "n_total": n_total,
        "deterministic_grade": True, "model_as_judge": False,
        "load_error": load_err,
        "note": "PENDING_SIGN is NOT measured. MEASURED only once GHA signs and the card verifies VALID.",
    }
    return {
        "schema": SCHEMA, "surface": f"gspc.{axis}.{model.replace('/', '--')}",
        "payload": payload, "sha256": hashlib.sha256(canonical(payload)).hexdigest(),
        "did": DID, "sig_ed25519": None,
        "note": "NO_LAPTOP_SIGN — queued for GHA OIDC signing.",
    }


if __name__ == "__main__":
    raise SystemExit(main())
