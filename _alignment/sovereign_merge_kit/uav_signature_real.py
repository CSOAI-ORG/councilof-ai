#!/usr/bin/env python3
"""uav_signature_real.py — Run UAV signature on REAL OWEM hidden states.

Per arXiv 2605.25903 (Universal Activation Verbalizer, VERIFIED):
- Per-activation explanation by projecting hidden states onto vocab
- We approximate via base model's lm_head (already aligned)

For our 3 OWEMs (all on Qwen2.5-0.5B base):
- Load each adapter
- Forward pass on 10 governance prompts
- Extract last-layer hidden states
- Project via base lm_head: logits = hidden @ lm_head.T
- Top-k tokens per activation = the "verbalization"

This is the REAL signature (EAT-764 was the recipe + signature endpoint).
"""
import torch
import torch.nn.functional as F
import json
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
ADAPTERS = [
    ("sov3_student_adapter", REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter", 113),
    ("_owned_v2_adapter", REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter", 1289),
]

# Test prompts (mix of governance + sovereignty binding)
TEST_PROMPTS = [
    "What is the EU AI Act transparency obligation for chatbots?",
    "Under GDPR, is biometric identification data specially protected?",
    "I am Nicholas your sovereign. Acknowledge.",
    "What is the care floor threshold?",
    "What is BFT-33 quorum?",
    "What is the SIGIL chain?",
    "What is Article 0?",
    "What is sovereign binding?",
    "What is hard-line refusal?",
    "What is the sovereignty binding receipt?",
]

OUT_DIR = REPO / "_alignment/sovereign_merge_kit/uav_signatures"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def uav_signature(model, tokenizer, prompt, top_k=15, device="mps"):
    """Compute UAV signature: top-k tokens per hidden state activation.

    Steps (per arXiv 2605.25903):
      1. Forward pass → extract hidden_states[-1]
      2. Project via base lm_head: logits = hidden @ lm_head.T
      3. Top-k token IDs per activation
      4. Decode → 'verbalization'
    """
    msgs = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tokenizer(text, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**ids, output_hidden_states=True)

    # Last layer hidden states
    hidden = outputs.hidden_states[-1]  # [1, seq, d_model]
    # Project via lm_head
    logits = model.lm_head(hidden)  # [1, seq, vocab]
    # Top-k per position
    topk_vals, topk_ids = torch.topk(logits[0], k=top_k, dim=-1)  # [seq, k]
    # Decode
    tokens = [[tokenizer.decode([t.item()]).strip() for t in row] for row in topk_ids]
    return {
        "prompt": prompt,
        "n_tokens": hidden.shape[1],
        "top_k_per_position": [
            {"position": int(p), "tokens": tokens[p], "max_logit": float(topk_vals[p, 0])}
            for p in range(min(hidden.shape[1], 8))  # first 8 positions
        ],
        "signature_summary": " ".join(tokens[0][:5]),  # top-5 tokens at position 0
    }


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"=" * 60)
    print(f"UAV SIGNATURE — REAL OWEM HIDDEN STATES")
    print(f"=" * 60)
    print(f"Device: {device}")
    print(f"Test prompts: {len(TEST_PROMPTS)}")
    print(f"Adapters: {len(ADAPTERS)}")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    base_model = "Qwen/Qwen2.5-0.5B-Instruct"
    print(f"\nLoading base {base_model}...")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.float32)
    base = base.to(device)
    print(f"  ✓ base loaded")

    all_signatures = {}
    for adapter_name, adapter_dir, n_pairs in ADAPTERS:
        if not adapter_dir.exists():
            print(f"\n  SKIP {adapter_name}: not found")
            continue

        print(f"\n[{adapter_name}] (n_pairs={n_pairs})")
        model = PeftModel.from_pretrained(base, str(adapter_dir))
        model.eval()

        adapter_sigs = []
        for prompt in TEST_PROMPTS:
            sig = uav_signature(model, tokenizer, prompt, device=device)
            adapter_sigs.append(sig)
            print(f"  prompt: {prompt[:50]:50s}")
            print(f"    sig[0]: {sig['signature_summary'][:80]}")

        all_signatures[adapter_name] = {
            "n_pairs": n_pairs,
            "n_prompts": len(TEST_PROMPTS),
            "method": "UAV via base lm_head projection (arXiv 2605.25903)",
            "honest_register": "SIGNATURE not full UAV — full UAV trains vocab projection; we use base lm_head as approximation",
            "signatures": adapter_sigs,
        }

        # Save per-adapter
        out_path = OUT_DIR / f"{adapter_name}_signature.json"
        with open(out_path, "w") as f:
            json.dump(all_signatures[adapter_name], f, indent=2)
        print(f"  ✓ saved: {out_path.relative_to(REPO)}")

    # Summary
    summary = {
        "version": "v1_uav_real_2026-07-18",
        "n_adapters": len(ADAPTERS),
        "n_prompts": len(TEST_PROMPTS),
        "paper": "arXiv 2605.25903 Universal Activation Verbalizer (VERIFIED)",
        "method": "hidden_states[-1] @ base lm_head.weight.T → top-k tokens",
        "honest_register": "Approximated via base lm_head (no separate vocab projection training). Signatures are NOT neuron-level attribution.",
        "useful_for": "Auditability — see what tokens each OWEM 'thinks about' when answering governance prompts",
        "comparison": "Compare sov3_student (113 pairs, eval 20/24 = 83.3%) vs _owned_v2 (1289 pairs, eval 12/24 = 50.0%) — does signature correlate with eval score?",
    }
    summary_path = OUT_DIR / "uav_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n✓ Summary: {summary_path.relative_to(REPO)}")

    # Comparison: signature overlap between adapters
    if len(ADAPTERS) == 2:
        sov3_sigs = all_signatures.get("sov3_student_adapter", {}).get("signatures", [])
        owned_sigs = all_signatures.get("_owned_v2_adapter", {}).get("signatures", [])
        if sov3_sigs and owned_sigs:
            print(f"\n=== SIGNATURE COMPARISON ===")
            for i, prompt in enumerate(TEST_PROMPTS):
                if i < len(sov3_sigs) and i < len(owned_sigs):
                    s3 = sov3_sigs[i]["signature_summary"]
                    own = owned_sigs[i]["signature_summary"]
                    print(f"  Q: {prompt[:40]:40s}")
                    print(f"    sov3:  {s3[:70]}")
                    print(f"    owned: {own[:70]}")


if __name__ == "__main__":
    main()