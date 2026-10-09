# x402 paid-door GSPC lid correction — 23 September 2026

Observed 06:55 UTC. Source-only change; **not deployed**.

- Public `GET https://councilof.ai/api/gspc` returned `totals.axes=23`, `measured_axes=23`, `fact_runs=9` and a 23-axis `totals.lid`.
- Public `GET https://councilof.ai/api/pop/stablecoins` returned HTTP 402; its `csoai.lid` still says 22 axes and 8 fact runs. Its existing price was 10,000 atomic Base USDC, asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, payTo `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`; Bazaar `info` and `schema` were present. This route offers the frozen 425-asset slice; that is distinct from later claim-capture universes.
- The shared source constant in `functions/api/_x402.ts` was the mismatch. A one-file change replaces the frozen numerical sentence with a pointer to the live `GET /api/gspc` `totals.lid` and retains “TIE is TIE” and “not a certificate.” This also prevents the next axis-count change from silently aging paid-door metadata.
- Candidate commit `fa5a7996d3994229f0243d0f374c02e925560e93`, branch `codex/bazaar-lid-current-20260923` on the existing RunPod `pod` bare remote. Remote ref readback matched the commit. Source file SHA-256 `6e81ec9cfa4874d02779b18289b5e09df863ad743c56e50afc6dcd8669f3a286`.
- Focused check passed: exactly one changed file, only its comment and constant changed, no payment code edited; the live 402 challenge retained amount, asset, payee, and Bazaar block. `git diff --check` passed. Full application test suite was not run in this isolated checkout.
- The temporary worktree was removed after the branch push. No master merge, GitHub push, payment, or Cloudflare deploy occurred. Public 402 remains stale until the source is safely released through the established production gate.
