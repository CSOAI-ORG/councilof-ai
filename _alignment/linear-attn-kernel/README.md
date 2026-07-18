# linear-attn-kernel — pure-PyTorch causal linear attention kernel.

This package implements causal linear attention via the cumsum trick (paper-accurate mechanism per arXiv 2510.26692 VERIFIED for Kimi Linear / KDA, Gated DeltaNet, Linear Attention family).

**Honest register**: toy-scale mechanism test on M2 MPS, NOT frontier-scale. Doesn't claim Kimi's 6.3x/75% (those are frontier-scale). Standard attention beats linear on toy tasks (per sibling's KDA probe). Causal masking PROVEN (early diff = 0.0). Speedup at long sequences (1.20x at seq=2048, 1.67x at seq=4096).

## Install

```bash
pip install linear-attn-kernel
```

## Usage

```python
from linear_attn_kernel import LinearAttention, StandardAttention, HybridAttention
import torch

d_model = 64
x = torch.randn(2, 32, d_model)  # [batch, seq, dim]

# Linear attention (O(n) memory + O(n) compute)
lin = LinearAttention(d_model, n_heads=4)
out = lin(x)

# Standard attention (O(n^2))
std = StandardAttention(d_model, n_heads=4)
out = std(x)

# 3:1 hybrid per Kimi Linear (2510.26692)
hyb = HybridAttention(d_model, n_heads=4, n_linear=3)
out = hyb(x)
```

## Benchmark (M2 MPS)

| Seq length | Standard (O(n²)) | Linear (O(n)) | Speedup |
|---|---|---|---|
| 128 | 1.81 ms | 3.70 ms | 0.49x |
| 256 | 1.22 ms | 4.49 ms | 0.27x |
| 512 | 4.09 ms | 10.44 ms | 0.39x |
| 1024 | 9.77 ms | 11.76 ms | 0.83x |
| 2048 | 33.86 ms | 28.33 ms | **1.20x** |
| 4096 | 153.29 ms | 91.73 ms | **1.67x** |

Crossover at seq ≈ 1500-2000 tokens.

## License
MIT

## Provenance
Built at CSOAI Ltd UK 16939677 (EAT-767, 2026-07-18).
Paper basis: arXiv 2510.26692 (Kimi Linear, KDA), VERIFIED in ledger.
Sibling KDA probe (toy scale, 234K params): transformer acc=1.0, KDA acc=0.36.