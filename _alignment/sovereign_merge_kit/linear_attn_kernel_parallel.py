"""linear_attn_kernel_parallel.py — TRUE O(n) linear attention via parallel scan.

The recurrence form is correct but Python-loop slow.
The parallel scan form (Blelloch / Hillis-Steele) gives TRUE O(n) speed.

Reference: Katharopoulos et al., "Transformers are RNNs" (2020)
Also: Yang et al., "Gated Linear Attention" (2023) - GLA / RWKV / RetNet

This is the KERNEL that makes linear attention actually O(n) on hardware.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import math


def parallel_scan_causal_linear_attention(q, k, v, eps=1e-6):
    """Causal linear attention via Hillis-Steele parallel scan.

    The recurrence:
      S_t = a_t * S_{t-1} + b_t    where a_t = 1 (no decay here), b_t = phi(k_t)^T v_t
      o_t = phi(q_t) @ S_t / (phi(q_t) @ Z_t)

    Parallel scan computes all S_t in O(log n) parallel steps.
    For simplicity here we use a direct chunked-cumsum which is O(n) on GPU.

    Returns: [B, H, N, E]
    """
    B, H, N, D = q.shape
    E = v.shape[-1]

    def phi(x):
        return F.elu(x) + 1.0

    q_phi = phi(q)
    k_phi = phi(k)

    # Compute per-position contribution b_t = phi(k_t)^T v_t  shape [B, H, D, E]
    # KV[b,h,t,d,e] = k_phi[b,h,t,d] * v[b,h,t,e]
    # Note: we keep this 5D so we can cumsum along t
    KV = k_phi.unsqueeze(-1) * v.unsqueeze(-2)  # [B, H, N, D, E]

    # Flatten the non-t dims so we can cumsum along t
    KV_flat = KV.view(B, H, N, D * E)
    S_flat = torch.cumsum(KV_flat, dim=2)  # [B, H, N, D*E]
    S = S_flat.view(B, H, N, D, E)  # back to 5D

    # Output: o_t = phi(q_t)^T S_t  (sum over D)
    o = (q_phi.unsqueeze(-1) * S).sum(dim=-2)  # [B, H, N, E]

    # Normalizer: Z_t = sum_{s<=t} phi(k_s)  shape [B, H, N, D]
    Z = torch.cumsum(k_phi, dim=2)  # [B, H, N, D]

    # norm_t = phi(q_t)^T Z_t
    norm = (q_phi * Z).sum(dim=-1).clamp(min=eps)  # [B, H, N]

    return o / norm.unsqueeze(-1)


class LinearAttention(nn.Module):
    def __init__(self, d_model, n_heads=4, head_dim=None):
        super().__init__()
        if head_dim is None:
            head_dim = d_model // n_heads
        self.n_heads = n_heads
        self.head_dim = head_dim

        self.q_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.k_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.v_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.out_proj = nn.Linear(n_heads * head_dim, d_model, bias=False)

    def forward(self, x):
        B, N, D = x.shape
        H, DH = self.n_heads, self.head_dim
        q = self.q_proj(x).view(B, N, H, DH).transpose(1, 2)
        k = self.k_proj(x).view(B, N, H, DH).transpose(1, 2)
        v = self.v_proj(x).view(B, N, H, DH).transpose(1, 2)
        o = parallel_scan_causal_linear_attention(q, k, v)
        o = o.transpose(1, 2).contiguous().view(B, N, H * DH)
        return self.out_proj(o)


class StandardAttention(nn.Module):
    def __init__(self, d_model, n_heads=4, head_dim=None):
        super().__init__()
        if head_dim is None:
            head_dim = d_model // n_heads
        self.n_heads = n_heads
        self.head_dim = head_dim
        self.q_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.k_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.v_proj = nn.Linear(d_model, n_heads * head_dim, bias=False)
        self.out_proj = nn.Linear(n_heads * head_dim, d_model, bias=False)

    def forward(self, x):
        B, N, D = x.shape
        H, DH = self.n_heads, self.head_dim
        q = self.q_proj(x).view(B, N, H, DH).transpose(1, 2)
        k = self.k_proj(x).view(B, N, H, DH).transpose(1, 2)
        v = self.v_proj(x).view(B, N, H, DH).transpose(1, 2)
        scores = torch.einsum('bhnd,bhmd->bhnm', q, k) / math.sqrt(DH)
        mask = torch.triu(torch.ones(N, N, device=x.device), diagonal=1).bool()
        scores = scores.masked_fill(mask, float('-inf'))
        attn = F.softmax(scores, dim=-1)
        o = torch.einsum('bhnm,bhmd->bhnd', attn, v)
        o = o.transpose(1, 2).contiguous().view(B, N, H * DH)
        return self.out_proj(o)


class HybridAttention(nn.Module):
    """3:1 hybrid per Kimi Linear (2510.26692 VERIFIED)."""
    def __init__(self, d_model, n_heads=4, n_linear=3):
        super().__init__()
        self.linear_layers = nn.ModuleList([
            LinearAttention(d_model, n_heads) for _ in range(n_linear)
        ])
        self.full_attn = StandardAttention(d_model, n_heads)
        self.n_linear = n_linear

    def forward(self, x):
        for layer in self.linear_layers:
            x = x + layer(x)
        x = x + self.full_attn(x)
        return x


def test_parallel():
    print("=" * 60)
    print("PARALLEL-SCAN LINEAR ATTENTION — TRUE O(n)")
    print("=" * 60)

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Device: {device}")
    torch.manual_seed(42)

    d_model = 64
    n_heads = 4
    head_dim = 16
    seq_len = 32
    batch_size = 4

    x = torch.randn(batch_size, seq_len, d_model, device=device)

    std_attn = StandardAttention(d_model, n_heads, head_dim).to(device)
    lin_attn = LinearAttention(d_model, n_heads, head_dim).to(device)
    hyb_attn = HybridAttention(d_model, n_heads, n_linear=3).to(device)

    # Forward
    std_out = std_attn(x)
    lin_out = lin_attn(x)
    hyb_out = hyb_attn(x)

    print("\n--- Forward pass ---")
    print(f"  Standard: shape={tuple(std_out.shape)}, NaN={torch.isnan(std_out).any().item()}")
    print(f"  Linear:   shape={tuple(lin_out.shape)}, NaN={torch.isnan(lin_out).any().item()}")
    print(f"  Hybrid:   shape={tuple(hyb_out.shape)}, NaN={torch.isnan(hyb_out).any().item()}")

    print("\n--- Output statistics ---")
    print(f"  Standard: mean={std_out.mean().item():.4f}, std={std_out.std().item():.4f}")
    print(f"  Linear:   mean={lin_out.mean().item():.4f}, std={lin_out.std().item():.4f}")
    print(f"  Hybrid:   mean={hyb_out.mean().item():.4f}, std={hyb_out.std().item():.4f}")

    # Speed test at varying seq lengths
    print("\n--- Speed vs seq length ---")
    import time
    for seq_test in [128, 256, 512, 1024, 2048]:
        x_test = torch.randn(batch_size, seq_test, d_model, device=device)

        # Warmup
        _ = std_attn(x_test); _ = lin_attn(x_test)

        if device == "mps":
            torch.mps.synchronize()
        t0 = time.time()
        for _ in range(5):
            _ = std_attn(x_test)
        if device == "mps":
            torch.mps.synchronize()
        std_time = (time.time() - t0) / 5

        if device == "mps":
            torch.mps.synchronize()
        t0 = time.time()
        for _ in range(5):
            _ = lin_attn(x_test)
        if device == "mps":
            torch.mps.synchronize()
        lin_time = (time.time() - t0) / 5

        speedup = std_time / lin_time if lin_time > 0 else 0
        marker = "✓" if speedup > 1 else "x"
        print(f"  seq={seq_test:>4}: std={std_time*1000:>7.2f}ms lin={lin_time*1000:>7.2f}ms  {marker} {speedup:.2f}x")

    # Causal correctness
    print("\n--- Causal correctness ---")
    torch.manual_seed(123)
    x1 = torch.randn(1, 8, d_model, device=device)
    x2 = x1.clone()
    x2[:, 4:] = torch.randn(1, 4, d_model, device=device)

    out1 = lin_attn(x1)
    out2 = lin_attn(x2)

    diff_early = (out1[:, :4] - out2[:, :4]).abs().max().item()
    diff_late = (out1[:, 4:] - out2[:, 4:]).abs().max().item()

    print(f"  Early (must match): diff={diff_early:.10f}")
    print(f"  Late (must differ):  diff={diff_late:.6f}")
    if diff_early < 1e-5:
        print("  ✓ CAUSAL MASKING CORRECT")
    else:
        print(f"  ✗ causal issue: diff={diff_early:.2e}")

    return std_attn, lin_attn, hyb_attn


if __name__ == "__main__":
    test_parallel()