"""linear_attn_kernel.py — REAL linear-attention kernel (toy + small scale).

Per sibling's KDA probe (sov33_kda_decorr_probe.py):
  - 234K params, ctx<=14, toy scale
  - KDA acc = 0.361, transformer acc = 1.0

Per arXiv 2510.26692 (Kimi Linear / KDA - VERIFIED):
  - 3:1 hybrid ratio (3 linear : 1 full attention)
  - Gated DeltaNet-style linear attention
  - Slot-in at fine-tune, not just pretrain

Implementation:
  - Causal masking via recurrence: O_t = O_{t-1} + phi(q_t) * (phi(k_t)^T v_t)
  - Normalizer state Z_t = Z_{t-1} + phi(k_t)
  - Output: o_t = phi(q_t) @ O_t / (phi(q_t) @ Z_t)

Honest register:
  - Toy-scale mechanism test (not capability claim)
  - Doesn't claim Kimi's 6.3x/75% (those are frontier-scale)
  - MECHANISM test: does the kernel run, produce sensible output, scale linearly?
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import math


def causal_linear_attention(q, k, v, eps=1e-6):
    """Linear attention with causal masking via recurrence.

    State: O [B, H, D, E] = sum_{s<=t} phi(k_s)^T v_s
           Z [B, H, D]     = sum_{s<=t} phi(k_s)
    Output: o_t = phi(q_t)^T O_t / (phi(q_t)^T Z_t)

    Args:
        q: [B, H, N, D] where D is head_dim
        k: [B, H, N, D]
        v: [B, H, N, E] where E is value_dim (usually = D)
    """
    B, H, N, D = q.shape
    E = v.shape[-1]

    def phi(x):
        return F.elu(x) + 1.0

    q_phi = phi(q)  # [B, H, N, D]
    k_phi = phi(k)
    v_phi = v

    # Recurrence form (cleaner einsum)
    O = torch.zeros(B, H, D, E, device=q.device, dtype=q.dtype)
    Z = torch.zeros(B, H, D, device=q.device, dtype=q.dtype)
    outputs = []

    for t in range(N):
        # Update state with this timestep
        # k[b,h,d] * v[b,h,e] -> O[b,h,d,e]
        O = O + k_phi[:, :, t].unsqueeze(-1) * v_phi[:, :, t].unsqueeze(-2)
        Z = Z + k_phi[:, :, t]
        # Output: q[b,h,d] @ O[b,h,d,e] / (q[b,h,d] @ Z[b,h,d])
        o_t = (q_phi[:, :, t].unsqueeze(-1) * O).sum(dim=-2)  # [B, H, E]
        z_t = (q_phi[:, :, t] * Z).sum(dim=-1).clamp(min=eps)  # [B, H]
        outputs.append(o_t / z_t.unsqueeze(-1))

    return torch.stack(outputs, dim=2)  # [B, H, N, E]


class LinearAttention(nn.Module):
    """Linear attention layer with causal masking."""
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

        o = causal_linear_attention(q, k, v)
        o = o.transpose(1, 2).contiguous().view(B, N, H * DH)
        return self.out_proj(o)


class StandardAttention(nn.Module):
    """Standard O(n^2) attention for comparison."""
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


def test_kernel():
    """Test the linear attention kernel."""
    print("=" * 60)
    print("LINEAR ATTENTION KERNEL — REAL TEST")
    print("=" * 60)

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Device: {device}")

    torch.manual_seed(42)

    d_model = 64
    n_heads = 4
    head_dim = 16
    seq_len = 16  # smaller for speed in causal test
    batch_size = 4

    x = torch.randn(batch_size, seq_len, d_model, device=device)

    std_attn = StandardAttention(d_model, n_heads, head_dim).to(device)
    lin_attn = LinearAttention(d_model, n_heads, head_dim).to(device)
    hyb_attn = HybridAttention(d_model, n_heads, n_linear=3).to(device)

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

    # Speed test
    print("\n--- Speed comparison ---")
    x_long = torch.randn(batch_size, 512, d_model, device=device)
    x_xl = torch.randn(batch_size, 1024, d_model, device=device)

    import time
    for seq_label, x_test in [("seq=512", x_long), ("seq=1024", x_xl)]:
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

        print(f"  {seq_label}:")
        print(f"    Standard O(n^2): {std_time*1000:.2f} ms")
        print(f"    Linear O(n):     {lin_time*1000:.2f} ms (recurrence)")
        if lin_time > 0 and std_time > 0:
            speedup = std_time / lin_time
            marker = "✓" if speedup > 1 else "="
            print(f"    {marker} Speedup: {speedup:.2f}x")

    # Causal correctness test
    print("\n--- Causal correctness test ---")
    torch.manual_seed(123)
    x1 = torch.randn(1, 8, d_model, device=device)
    x2 = x1.clone()
    x2[:, 4:] = torch.randn(1, 4, d_model, device=device)

    out1 = lin_attn(x1)
    out2 = lin_attn(x2)

    diff_early = (out1[:, :4] - out2[:, :4]).abs().max().item()
    diff_late = (out1[:, 4:] - out2[:, 4:]).abs().max().item()

    print(f"  Early positions (should be IDENTICAL): diff={diff_early:.10f}")
    print(f"  Late positions (should be DIFFERENT): diff={diff_late:.6f}")
    if diff_early < 1e-5:
        print("  ✓ Causal masking CORRECT")
    else:
        print(f"  ✗ Causal masking issue (diff={diff_early:.2e})")

    # Standard attention sanity check
    out1_std = std_attn(x1)
    out2_std = std_attn(x2)
    diff_early_std = (out1_std[:, :4] - out2_std[:, :4]).abs().max().item()
    print(f"  Standard sanity: early diff={diff_early_std:.10f}")

    return std_attn, lin_attn, hyb_attn


if __name__ == "__main__":
    test_kernel()