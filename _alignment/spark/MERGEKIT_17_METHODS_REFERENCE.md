# mergekit 17 Merge Methods — Complete Reference (Absorbed 15 Jul 2026)

## BASIC
1. **linear** — Weighted average of params (Model Soups, arXiv:2203.05482)
2. **slerp** — Spherical Linear Interpolation (2 models only, hypersphere path)
3. **nuslerp** — Enhanced SLERP with task-vector support
4. **multislerp** — Barycentric interpolation for >2 models on hypersphere
5. **karcher** — Riemannian barycenter / Fréchet mean (Fisher-Rao manifold)

## TASK VECTOR (need base_model)
6. **task_arithmetic** — task_vec = tuned - base; add/subtract capabilities (arXiv:2212.04089)
7. **ties** — Trim + Elect-sign + Disjoint merge (arXiv:2306.01708)
8. **dare_linear** — Drop And REscale random pruning (no sign consensus)
9. **dare_ties** — DARE pruning + TIES sign consensus (arXiv:2311.03099)
10. **della** — Adaptive magnitude-based pruning + TIES (arXiv:2406.11617)
11. **della_linear** — DELLA pruning without sign consensus
12. **breadcrumbs** — Prune smallest + largest magnitude outliers (arXiv:2312.06795)
13. **breadcrumbs_ties** — Breadcrumbs + TIES sign consensus
14. **sce** — Select/Calculate/Erase matrix-level merge (FuseChat, arXiv:2408.07990)
15. **ram** — Reinforced Agent Merging for RL-trained models
16. **ramplus_tl** — RAM+ with adaptive rescaling

## SPECIALIZED
17. **passthrough** — Layer stacking / Frankenmerge (capacity expansion)
18. **model_stock** — Stock-style merge optimizing for weight diversity
19. **nearswap** — Near-swap merge for small weight changes
20. **arcee_fusion** — Arcee's proprietary fusion method

## SOVEREIGN IMPLEMENTATION STATUS
| Method | We Have | Status |
|--------|---------|--------|
| linear | ✅ Pure PyTorch | DONE |
| ties | ✅ Pure PyTorch | DONE |
| dare_ties | ✅ Pure PyTorch | DONE |
| slerp | ✅ Pure PyTorch | DONE |
| task_arithmetic | 🔜 TODO | Next: identity fix |
| della | 📋 Absorbed | Recipe ready |
| breadcrumbs | 📋 Absorbed | Recipe ready |
| sce | 📋 Absorbed | Recipe ready |
| passthrough | 📋 Absorbed | Needs clean venv |
| evolutionary | 📋 Absorbed | Needs eval set |
