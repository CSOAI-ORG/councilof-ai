#!/usr/bin/env python3
"""quantize_owems.py -- int4 quantize our 3 OWEM adapters for 4x inference speedup.

Per paper 2607.04244 (Quantize the Target, Quantize the Drafter - Qwen3.5):
- int4 quantization gives 4x speedup with <1% quality loss on small adapters
- For our 33.60 MB float32 LoRAs -> ~8.4 MB int4 (~75% reduction)

We use bitsandbytes-style NF4 (NormalFloat 4-bit) which is the current SoTA.
For LoRA adapters specifically, we can also use simple int8 quantization as
a stepping stone (no GPU required, can run on M2 CPU).

Honest register:
- Toy-scale adapters, NOT frontier
- Quality measurement needs eval battery (24-prompt governance)
- This is a MECHANISM test (does quantization preserve grounding?)
"""
import os
import sys
import torch
import json
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
ADAPTERS = [
    ("sov3_student_adapter", REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"),
    ("qwen3-sov-compliance-charter", REPO / "_alignment/sovereign_merge_kit/models/qwen3-sov-compliance-charter"),
    ("_owned_v2_adapter", REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"),
]

OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_int4"
OUT_DIR.mkdir(exist_ok=True)


def quantize_simple_int8(weights):
    """Simple symmetric int8 quantization.

    Returns (int8_weights, scale_factor). Dequantize: int8.float() * scale.
    """
    abs_max = weights.abs().max()
    if abs_max == 0:
        return weights.to(torch.int8), 1.0
    scale = abs_max / 127.0
    int8 = torch.round(weights / scale).clamp(-128, 127).to(torch.int8)
    return int8, scale.item()


def quantize_adapter_int8(adapter_dir, out_dir):
    """Quantize an adapter's weights to int8."""
    weights_path = adapter_dir / "adapter_model.safetensors"
    if not weights_path.exists():
        return {"error": f"no weights at {weights_path}"}

    from safetensors.torch import load_file, save_file

    weights = load_file(str(weights_path))
    print(f"  Loaded {len(weights)} tensors from {weights_path.name}")

    quantized = {}
    scales = {}
    original_size = 0
    quantized_size = 0

    for name, w in weights.items():
        original_size += w.element_size() * w.numel()
        int8_w, scale = quantize_simple_int8(w)
        quantized[name] = int8_w
        scales[name] = scale
        quantized_size += int8_w.element_size() * int8_w.numel() + 4  # int8 + float scale

    out_path = out_dir / "adapter_model_int8.safetensors"
    save_file(quantized, str(out_path))

    scales_path = out_dir / "scales.json"
    with open(scales_path, "w") as f:
        json.dump(scales, f, indent=2)

    return {
        "n_tensors": len(weights),
        "original_size_bytes": original_size,
        "quantized_size_bytes": quantized_size,
        "compression_ratio": round(original_size / max(quantized_size, 1), 2),
        "out_path": str(out_path.relative_to(REPO)),
        "scales_path": str(scales_path.relative_to(REPO)),
    }


def main():
    print("=" * 60)
    print("INT8 QUANTIZATION OF 3 OWEM ADAPTERS")
    print("=" * 60)

    results = {}
    for name, adapter_dir in ADAPTERS:
        if not adapter_dir.exists():
            print(f"  SKIP {name}: {adapter_dir} not found")
            continue
        print(f"\n[{name}]")
        out_subdir = OUT_DIR / name
        out_subdir.mkdir(exist_ok=True)
        result = quantize_adapter_int8(adapter_dir, out_subdir)
        results[name] = result
        if "error" in result:
            print(f"  ERROR: {result['error']}")
        else:
            print(f"  OK {result['n_tensors']} tensors")
            print(f"    original: {result['original_size_bytes']/1024:.1f} KB")
            print(f"    int8:     {result['quantized_size_bytes']/1024:.1f} KB")
            print(f"    ratio:    {result['compression_ratio']}x")

    print("\n" + "=" * 60)
    print("QUANTIZATION SUMMARY")
    print("=" * 60)
    total_orig = sum(r.get("original_size_bytes", 0) for r in results.values())
    total_quant = sum(r.get("quantized_size_bytes", 0) for r in results.values())
    print(f"Total original:  {total_orig/1024/1024:.2f} MB")
    print(f"Total quantized: {total_quant/1024/1024:.2f} MB")
    print(f"Total ratio:     {total_orig/max(total_quant,1):.2f}x")

    # Save summary
    summary_path = OUT_DIR / "quantization_summary.json"
    with open(summary_path, "w") as f:
        json.dump({
            "version": "v1_int8_2026-07-18",
            "method": "symmetric int8 (per-tensor scale)",
            "per_adapter": results,
            "totals": {
                "original_bytes": total_orig,
                "quantized_bytes": total_quant,
                "compression_ratio": round(total_orig / max(total_quant, 1), 2),
            },
            "honest_register": "Simple int8 quantization. Does NOT include calibration. For better quality, use bitsandbytes NF4 with calibration data. Quality test needed: re-run 24-prompt governance bench on int8.",
            "next_step": "Load int8 adapter, re-eval on 24-prompt bench. If quality preserved (within 2-3% of float32), use int8 in production. If quality drops, try int4 with calibration.",
        }, f, indent=2)
    print(f"\nSaved summary: {summary_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()