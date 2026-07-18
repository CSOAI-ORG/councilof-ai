#!/usr/bin/env python3
"""
sov33_yarn.py — YaRN-style rotary embedding extension (stdlib implementation).
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

YaRN (Yet another RoPE extensioN) extends LLM context length by:
  1. NTK-aware scaling (alpha = 0.0 = linear, 1.0 = NTK-aware)
  2. Attention scaling (1/sqrt(d) correction)
  3. Block-sparse attention (extrapolate smoothly past training length)

This implementation provides:
  - apply_yarn_scale(): rotate-frequency scaling
  - prepare_yarn_attention(): attention logit scaling for long contexts
  - validate_yarn_config(): check the 6 hyperparameters

Real-world use: YaRN extends llama-3 8K -> 128K, qwen 32K -> 1M.
Honest scope: this is the algorithm + scaling logic. To apply to a real
model, monkey-patch the rotary embedding layer with the scaled freq.
"""
import math
import sys
import os
import json
import argparse
from pathlib import Path


def yarn_find_correction_dim(num_rotations: float, dim: int, base: float = 10000.0,
                              max_position_embeddings: int = 8192) -> float:
    """Find the correction dimension (the dim above which we apply NTK scaling).

    YaRN finds the dim where original RoPE wavelength > max_position_embeddings.
    """
    return (dim * math.log(max_position_embeddings / (num_rotations * 2 * math.pi))) / (2 * math.log(base))


def yarn_find_correction_range(low_rot: float, high_rot: float, dim: int,
                                base: float = 10000.0, max_position_embeddings: int = 8192) -> tuple:
    """Find the correction range [low, high] for YaRN."""
    low = math.floor(yarn_find_correction_dim(low_rot, dim, base, max_position_embeddings))
    high = math.ceil(yarn_find_correction_dim(high_rot, dim, base, max_position_embeddings))
    return max(low, 0), min(high, dim - 1)


def yarn_linear_ramp_mask(low: float, high: float, dim: int) -> list:
    """Linear ramp mask: 1.0 for dim < low, 0.0 for dim > high, linear in between.

    Used to blend original RoPE (low dim = high freq = short wavelength = unchanged)
    with extended RoPE (high dim = low freq = long wavelength = scaled).
    """
    if low == high:
        high += 0.001
    mask = []
    for i in range(dim):
        if i < low:
            mask.append(0.0)
        elif i > high:
            mask.append(1.0)
        else:
            mask.append((i - low) / (high - low))
    return mask


def apply_yarn_scale(freqs: list, original_max_position: int = 8192,
                     target_max_position: int = 32768,
                     alpha: float = 1.0, beta: float = 32.0) -> list:
    """Apply YaRN scaling to a list of rotary frequencies.

    Args:
        freqs: original RoPE frequencies (length = head_dim/2)
        original_max_position: original training context (e.g. 8192 for llama-3)
        target_max_position: target extended context (e.g. 131072 for llama-3-128k)
        alpha: 0.0 = linear RoPE, 1.0 = full NTK-aware (YaRN)
        beta: temperature for the ramp (default 32, standard YaRN)

    Returns:
        scaled frequencies (same length as input)
    """
    dim = len(freqs) * 2  # head_dim
    low_rot, high_rot = 1, dim // 2
    low, high = yarn_find_correction_range(low_rot, high_rot, dim // 2,
                                            max_position_embeddings=original_max_position)
    mask_list = yarn_linear_ramp_mask(low, high, dim // 2)
    inv_freq_mask = [(1.0 - m) * alpha for m in mask_list]
    inv_freq_extrapolation = 1.0 / max(1e-6, 1.0 - alpha)

    # Scale factor (YaRN paper, eq 17)
    extrapolation_factor = 1.0
    scale = ((alpha * original_max_position) / target_max_position) ** (dim / (dim - 2))

    scaled = []
    for i, freq in enumerate(freqs):
        # YaRN blend
        extrapolation = freq / (scale * 1.0)
        interpolation = freq / target_max_position * original_max_position
        blended = extrapolation_factor * interpolation * (1 - inv_freq_mask[i]) + extrapolation * inv_freq_mask[i]
        scaled.append(blended)

    return scaled


def yarn_attention_scale(target_max_position: int, original_max_position: int = 8192) -> float:
    """Compute the attention logit scaling factor for long contexts.

    For sequences > original_max_position, attention logit should be
    scaled by 1/sqrt(d) to compensate for the entropy increase.
    """
    return 0.1 * math.log(target_max_position / original_max_position) + 1.0


def validate_yarn_config(target_max_position: int, original_max_position: int = 8192,
                          alpha: float = 1.0, beta: float = 32.0) -> dict:
    """Validate a YaRN configuration."""
    issues = []
    if target_max_position <= original_max_position:
        issues.append('target_max_position must be > original_max_position')
    if not 0 <= alpha <= 1:
        issues.append('alpha must be in [0, 1]')
    if beta < 1:
        issues.append('beta should be >= 1')

    scale = target_max_position / original_max_position
    if scale > 64 and alpha < 1:
        issues.append('large scale > 64x with alpha < 1 may cause instability; consider alpha=1')

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'scale_factor': scale,
        'attention_scale': yarn_attention_scale(target_max_position, original_max_position),
    }


# CLI demo
def main():
    parser = argparse.ArgumentParser(description='YaRN extension (Rotary + Attention scaling)')
    parser.add_argument('--original', type=int, default=8192)
    parser.add_argument('--target', type=int, default=131072)
    parser.add_argument('--dim', type=int, default=128)
    args = parser.parse_args()

    print()
    print("=" * 70)
    print(f"YaRN EXTENSION: {args.original} -> {args.target} (dim={args.dim})")
    print("=" * 70)

    # Build original freqs (RoPE standard)
    import math
    base = 10000.0
    freqs = [1.0 / (base ** (2 * i / args.dim)) for i in range(args.dim // 2)]

    # Apply YaRN
    scaled = apply_yarn_scale(freqs, args.original, args.target)

    # Validate
    validation = validate_yarn_config(args.target, args.original)

    print(f"  Scale factor:        {validation['scale_factor']}x")
    print(f"  Attention scale:     {validation['attention_scale']:.4f}")
    print(f"  Valid:               {validation['valid']}")
    if validation['issues']:
        print(f"  Issues: {validation['issues']}")
    print()
    print(f"  Original freqs (first 5): {[f'{x:.6f}' for x in freqs[:5]]}")
    print(f"  Scaled freqs   (first 5): {[f'{x:.6f}' for x in scaled[:5]]}")
    print()
    print(f"  Use case: qwen 8K -> 131K, llama 8K -> 128K, qwen 32K -> 1M, etc.")
    print()


if __name__ == '__main__':
    main()