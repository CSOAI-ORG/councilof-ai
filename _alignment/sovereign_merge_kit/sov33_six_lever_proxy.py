#!/usr/bin/env python3
"""sov33_six_lever_proxy.py — HONEST CPU proxy of the 6-lever MoE-streaming stack. COMPUTE-AVOIDED, not tok/s.

Measures what each lever changes in a quantity I can ACTUALLY compute on CPU: experts-loaded-per-token and
compute-avoided factor. Explicitly NOT a wall-clock speedup — real tok/s is SSD-bandwidth bound and must be
measured on the owner's Mac (see SOV33_COLIBRI_RUNBOOK). This exists so the 6 levers are measurable KNOBS,
not an assumed 25x. Each lever's number here is a footprint/compute ratio, honestly bounded by the 64x ceiling
(6 of 384 experts active).
"""
N_TOTAL, N_ACTIVE = 384, 6

def levers(lru_hit=0.75, prefetch_acc=0.70, batch=8):
    """Two DISTINCT metrics, kept separate so neither is overstated:
      - compute_avoided_x: how much matmul you skip. Ceiling = 64x (6/384 active). Only SSD-stream changes this.
      - disk_loads_per_tok: how many experts actually hit disk. LRU + prefetch reduce THIS (latency), NOT compute.
    Conflating them (the old bug) produced impossible '853x' — caching does not avoid compute, it hides latency."""
    ceiling = N_TOTAL / N_ACTIVE
    rows=[]  # (lever, disk_loads_per_tok, compute_avoided_x)
    rows.append(("0 baseline (load all 384)",           N_TOTAL,             1.0))
    rows.append(("1 SSD-stream (6 active)",             N_ACTIVE,            ceiling))   # THE compute win
    disk_lru = N_ACTIVE*(1-lru_hit)
    rows.append((f"5 +LRU {int(lru_hit*100)}% (latency)",  round(disk_lru,2),  ceiling)) # compute unchanged
    disk_pf = disk_lru*(1-prefetch_acc)
    rows.append((f"6 +prefetch {int(prefetch_acc*100)}% (latency)", round(disk_pf,2), ceiling))
    rows.append((f"3 +batch-{batch} (overhead/tok)",    round(disk_pf,2),    ceiling))
    rows.append(("4 +SIGIL inline (free)",              round(disk_pf,2),    ceiling))
    return ceiling, rows

if __name__=="__main__":
    ceiling, rows = levers()
    print("=== 6-LEVER PROXY — two honest metrics, kept separate (NOT wall-clock tok/s) ===\n")
    print(f"  compute-avoided ceiling = {ceiling:.0f}x (6/384 active). ONLY SSD-stream changes compute; LRU/")
    print(f"  prefetch/batch reduce DISK LOADS (latency), not compute — so compute_avoided stays 64x, not 853x.\n")
    print(f"  {'lever':>32} {'disk_loads/tok':>15} {'compute_avoided':>16}")
    for name, loads, factor in rows:
        print(f"  {name:>32} {loads:>15} {str(round(factor,1))+'x':>16}")
    print(f"\n  HONEST: compute_avoided caps at 64x (arithmetic — skip idle experts). disk_loads/tok falls further")
    print(f"  with LRU 75% + prefetch 70% (ASSUMED hit-rates) but that is LATENCY-hiding, not compute avoided.")
    print(f"  NEITHER is wall-clock tok/s — that is SSD-bandwidth bound, measured on the owner's Mac (RUNBOOK).")
