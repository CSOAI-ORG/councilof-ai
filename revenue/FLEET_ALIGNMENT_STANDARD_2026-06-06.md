# MEOK Fleet Alignment Standard — bring ALL MCPs up to scratch
Date: 2026-06-06 · Scope: every MCP ever built (~323 PyPI packages / ~410 public repos)
Goal: align the whole fleet to the standard the top-3 (eu-ai-act, dora, cra) set, via the MCP Scorecard + OpenMCP standards.

## THE STANDARD (every MCP must hit — the "top-3 bar")
Hygiene → Metadata → Quality → Distribution → Monetization → Provenance.
1. **Hygiene:** importable + gate-clean — NO "Buy Pro" docstring injection, no unicode/syntax landmines, no committed secrets/PII.
2. **Metadata:** valid `server.json` (MCP registry) + `glama.json` + `smithery.yaml`; OSI license; pinned deps.
3. **Quality:** README (problem→solution, install, env-var config, ≥3 examples, security note, **working buy link w/ LAUNCH50**); every tool described; tests + green CI.
4. **Security (OSSF):** `mcp` GitHub topic, CodeQL, Dependabot, OpenSSF Scorecard CI; (later) branch-protection + cosign signed-releases.
5. **Transports:** stdio everywhere; streamable-HTTP for flagships (→ ChatGPT/claude.ai connectors).
6. **Monetization:** correct Stripe buy link + PAYG meter + signed attestation where applicable.
7. **AEO/GEO:** `llms.txt`, LLM-retrievable descriptions, FAQ/structured data → discoverable in ChatGPT/Claude/Perplexity/Google AI.

## THE PROCESS (Scorecard-driven, gate-safe, per package)
`score → fix gaps (HYGIENE FIRST) → gate-check (must import) → republish → re-score → repeat until 100`.
Never ship a non-importable wheel — the gate-protected publisher (`mcp-marketplace/_tooling/`) enforces this.

## HYGIENE FIRST — the fleet-wide debt to clear before anything else
- **Strip the "Buy Pro" docstring injection from ~260 packages** (it caused the £0 import-breakage class + blocks republish). Detect: `grep -rl "Buy Pro: https://www.csoai.org/checkout"`. Fix: remove the injected block, repair the module docstring, `py_compile` to verify.
- **Repair the 6 multiply-corrupted source files** (omnibus-tracker, hash-utils, diff-ai, database-universal, yaml-ai, enterprise-compliance-checker) — restore from the published wheel (the published versions work) rather than hand-patch.
- Re-publish the fixed ones via the gate harness.

## TIERS — don't treat all 323 equally (diminishing returns)
- **Flagship (~15, the earners):** 100/100 end-to-end. *GitHub-side DONE (topics + CodeQL/Dependabot/Scorecard/server.json); code-side next (examples + HTTP transport + republish).*
- **Active mid-tier (~50, real downloads):** baseline-good → climb to 100.
- **Long tail (~260):** hygiene + importable + registry-listed + baseline metadata. Not full 100 — just clean, safe, discoverable, buyable.

## THE ENGINE (how 323 get done autonomously)
- **Scorecard engine** (`mcp-marketplace/mcp-scorecard-mcp`) = measure (nightly re-score → gap map).
- **Lifters** (templated F1–F7 + the workflow set) = apply GitHub-side fixes.
- **Gate-protected publisher** (`mcp-marketplace/_tooling`) = republish safely. **LOCAL — needs PyPI tokens.**
- **Ralph** = grind the long tail, one package at a time, against this standard.
- **Daily cloud routine** (`trig_012ZuQEQ…`) = continuous GitHub-side lift + revenue-regression guard + digest.
- **Parallel agents** = batch the GitHub-side alignment across repos.

## GATING (needs Nick / local — flag, don't block)
- PyPI **republish** (gate harness + tokens) — local only.
- Glama / Smithery / Anthropic-registry **submissions** — semi-manual.
- Branch-protection + cosign signing — careful, per-repo.

## DEFINITION OF DONE
Flagships at 100/100 (live + sellable); mid-tier climbing; long tail clean + importable + listed; nightly Scorecard trend rising; zero injection/landmines fleet-wide; zero PII/secrets public.
