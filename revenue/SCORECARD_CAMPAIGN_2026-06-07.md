# MCP Scorecard Campaign — 2026-06-07

Used `mcp-scorecard-mcp` (100-pt, 10-category rubric) to score the whole fleet,
then drove fleet-wide improvements. All measured with the engine itself.

## Headline
| Metric | Before | After |
|---|---|---|
| Fleet mean | **62.8** | **81.6 / 100** (+18.8) |
| Flagship (≥80) | 1 | **274** |
| 50–79 | 311 | 64 |
| Weak (<50) | 27 | **1** (the scorer library itself — false negative) |
| Importable | 335/339 | **339/339** |
| Conflict markers (fleet) | 209+ files | **0** |

Per-category mean lift: Examples 1.2→8.6 · Docs surface 2.9→7.0 · Metadata 8.0→9.9
· Security 8.5→9.9 · Tests+CI 8.5→10.0 · README 8.0→9.5.

## What was done (all additive / verified)
1. **6 broken-source packages fixed + republished** (ai-bom 1.2.14, explainability,
   yaml-ai, database-universal, enterprise-checker, omnibus) — conflict markers +
   syntax corruption that silently blocked republishes. PUBLISHED+VERIFIED.
2. **Fleet artifact generation** (`_tooling/fleet_improve.py`, additive, from each
   package's own signals): 331 server cards, 283 icons, 253 README config/examples
   appends, 184 CHANGELOGs, 125 SECURITY.md, 96 llms.txt, 81 server.json, 61 CI,
   47 tests, 26 glama.json.
3. **2 stubs implemented → real products** (had broken `server:main` entry, no
   server.py): `meok-drcf-agent-crosswalk-mcp` (4 tools, £499 DRCF four-regulator
   crosswalk) + `meok-uk-adm-article22c-mcp` (6 tools, £29/mo UK ADM). Both
   gate-verified + published to PyPI (pages live, propagating).
4. **3 README-less packages** got generated READMEs (care-home-scheduling,
   cqc-compliance, nhs-gos-claims). +`_tooling/gen_readme.py`.
5. **9 LICENSE files added** (also a hatchling build blocker for the 2 stubs).
6. **"Buy Pro" docstring injection stripped** from 257 server.py (ast-gated).
7. **209+ conflict markers resolved** across READMEs + 2 pyproject + 1 server.json.
8. **129 paused rebases finalized** (`_tooling/finalize_rebases.py`) — a bulk
   "sync source with published wheels" rebase had conflicted fleet-wide on README.md
   and was left mid-rebase. All resolved (keep-both) + finalized. 0 repos mid-op.
9. **Security**: scrubbed a real PyPI token hardcoded in `upload_all.py` (gitignored,
   never pushed). → **ROTATE that PyPI token.** Test-fixture "secrets" in
   meok-mcp-hardening / agents-md-lint tests are the AWS doc key + placeholders (safe).

## Reusable tooling added (`mcp-marketplace/_tooling/`)
fleet_improve.py · gen_readme.py · strip_buypro.py · finalize_rebases.py ·
commit_push_fleet.py · (existing: republish_mcp.py, mcp-scorecard-mcp engine).

## GitHub push — COMPLETE
All **286 git package repos committed + pushed** (165 direct + 9 no-upstream + 121
diverged-recovered via `push_recover.py` pull-rebase + keep-both). Final state:
**0 unpushed · 0 mid-op · 0 dirty · 0 conflict markers.** The +18.8 is now live on
GitHub for external directory re-indexing (Glama/Smithery/mcp.so).

## Remaining / next
- **ROTATE the PyPI token** that was in `upload_all.py` (now scrubbed).
- **PyPI republish sweep** — to ship the new artifacts inside wheels for the ~330
  not-yet-republished (scorecard mostly helps GitHub/directories, so push > republish).
- **Provenance category (3.5/10)** — lowest remaining; needs monetization wiring
  (attestation / PAYG / x402) per package = a separate code campaign.
- **Transports (5.0)** — most are legitimately stdio-only fastmcp; left as-is.
- `mcp-scorecard-mcp` self-scores 17 (it's a library, no server.py) — exclude or shim.

Scoreboards: `/tmp/sb_base.{csv,json}` (before) · `/tmp/sb_final2.{csv,json}` (after).

## Update — monetization pass (2026-06-07, later)
Added a real monetization layer (Stripe upgrade + **PAYG** via MEOK_PAYG_KEY + pricing)
to **330** server.py (0 broke). Result: **fleet mean 81.6 -> 84.6**, Provenance 3.56 -> 7.30,
packages >=90 jumped **7 -> 82**. Also injected `mcp-name` into 207 READMEs (registry-ready).
Stripe funnel verified: all 18 distinct checkout links live (0 dead). OpenMCP engine built
(`_tooling/openmcp.py`) — registry flood is `mcp-publisher login github` + `openmcp.py publish`.
