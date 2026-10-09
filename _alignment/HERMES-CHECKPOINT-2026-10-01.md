
## Hermes Checkpoint — 2026-10-01T10:40Z
- Production: 8/8 200 (/, llms.txt, root.json, feeds/corrections.xml, merge-me, custody, mcp, api/revenue)
- Open PRs: 30 (4 MERGEABLE non-draft incl. #2770 SURFACES header fix; 11 CONFLICTING non-draft; rest drafts)
- Deep measurements:
  - Hub cells: 384 measured / 384 cells (586 rows − 184 dupes − 18 withdrawn; 0 superseded)
  - GSPC: 23/23 measured axes (2 financial-run Ed25519 signed)
  - Stablecoins: 425 indexed, **1 deeply measured**, 1 signed, 1 current-root-included (readiness as_of 2026-09-15)
  - Wrappers: 24 indexed, 24 signed
  - RWA/XRPL: 8 named/located, 6 mainnet-verified, 8 control-facts MEASURED
  - Signed cards: 335 indexed · Root leaves: 319 · SEPARATE_CORPORA, 0 overlap
- Kaggle: no `/api/kaggle` (404). Public twin only: `https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board` (named in llms.txt). `/kaggle` also 404.
- Revenue: 0.02 USDC (20000 atomic, Base; 1 outside settlement / 1 distinct non-self payer). REVENUE_KV bound.
- Spend: readiness/metadata build cost fields = $0 (existing-data SKUs only). GitHub billing API 404 (user-account). Actions still account-disabled (dispatch 422 from MODELS cycle) so no Actions spend accruing.
- Contradictions / drift:
  1. **MCP tool count drift:** live `/mcp` reports **19 tools (14 free + 5 metered)** v1.4.4 — older STATUS said 13 (9 free + 4 mcp_trust). Live surface wins; old 13 is stale.
  2. **Root age:** as_of 2026-09-30T05:05:34Z (~29h). Expected daily 05:00Z root-daily; today's may be Actions-blocked. OTS=CONFIRMED_BITCOIN, Rekor=WITNESSED on that root.
  3. **`/wrappers` vs `/wrappers/`:** bare path 308 empty body; slash 200 (5× "Wrapped-asset parity"). SURFACES cron probe without `-L` reports 0.
  4. **PR backlog:** 11 non-draft CONFLICTING — several old (art50 #2730, fail-closed revenue #2705). Needs triage, not silent merge.
  5. **Kaggle twin** exists as dataset but no live estate endpoint — do not invent `/api/kaggle`.
- Live changes (this hour):
  - SURFACES lane: PR **#2770** opened (static header producer rewrite, 20 pages). Not self-merged.
  - 20 PRs merged in prior 24h (from GitHub list window).
  - Pod still unreachable (MODELS 10:12Z); Actions still 422 (MODELS 10:14Z).
- Status: GREEN (production 8/8) / WATCH (root age, PR conflicts, MCP count doc drift) / BLOCKED (Actions, pod)

