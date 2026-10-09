# GSPC listing copy pack — NEW sites (2026-10-01)

Use VERBATIM. Do not invent counts. Board line is derived from https://councilof.ai/api/gspc.

## Product Hunt
**Tagline (60):** Open AI measurement board — test, verify, correct
**Description:**
GSPC is an open measurement board for AI systems: Governance, Safety, Provenance, Continuity. We run frozen, published tests and sign the results (Ed25519). Measurement, not certification — we never sell a score or grade. Connect an MCP client to https://councilof.ai/mcp/free and ask what was measured.
**Topics:** Artificial Intelligence, Developer Tools, Open Source, Data & Analytics
**URL:** https://councilof.ai
**Maker comment:** Built by CSOAI Ltd (UK). 23 axes measured today. Offline-verifiable card chain. Happy to answer measurement-method questions.

## There's An AI For That / Toolify / Futurepedia / OpenTools
**Name:** GSPC
**Category:** AI Safety / AI Analytics / Developer Tools
**Short:** Open AI measurement board (GSPC) — what was tested for this task, why a route was allowed, what happened, when the conclusion changed.
**Long:** GSPC measures AI systems on 23 published axes (governance, safety, provenance, continuity + financial fact axes). Results are signed measurement cards on an Ed25519 chain — anyone can recompute and challenge. Free MCP door: https://councilof.ai/mcp/free (14 tools). Full door adds 5 x402-metered evidence tools. Measurement, not certification.
**Pricing:** Free to read · x402 pay-per-evidence (metered tools)
**URL:** https://councilof.ai
**MCP URL:** https://councilof.ai/mcp/free

## AlternativeTo
**Name:** GSPC
**Description:** Open measurement board for AI model/agent behaviour (governance, safety, provenance, continuity). Alternative to opaque safety scores and vendor dashboards — public frozen splits, signed cards, correction ledger.

## DevHunt
**Name:** GSPC — Open AI measurement board
**Description:** MCP + API that answers: what was measured, with what evidence, and when it changed. 14 free tools. 335 signed cards. Anyone can recompute.
**URL:** https://councilof.ai
**Repo:** (omit — no GitHub this pass; link /gspc-verify docs instead)

## Hashnode / Medium post title
**Title:** We measure AI; we do not certify it — GSPC’s open board
**Subtitle:** 23 axes, signed cards, MCP door, and a correction ledger. How to recompute our numbers.
**CTA:** Try the free MCP: https://councilof.ai/mcp/free

## SaaSHub
**Name:** GSPC
**Category:** AI Safety, Compliance, Developer Tools
**Pitch:** Independent, evidence-backed AI measurement with signed results and public corrections.

## BetaList / F6S / Wellfound / Crunchbase
**Company:** CSOAI Ltd
**One-liner:** Independent AI measurement body — GSPC board, signed evidence, not a certificate vendor.
**HQ:** United Kingdom (Companies House 16939677)
**Website:** https://councilof.ai
**Contact:** nicholas@csoai.org

## Proof block (paste into any "verification / more info" field)
```
curl -s https://councilof.ai/api/gspc | jq .totals.public_count
curl -s https://councilof.ai/api/gspc | jq .totals.measured_axes
# free MCP door (14 tools)
curl -s -X POST https://councilof.ai/mcp/free -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | head
# signed cards offline verify
open https://councilof.ai/gspc-verify
```

## Banned phrases (brand/truth gates)
- never "sell a score/rank/grade/certificate"
- never "world-leading" / "100/100 A+++++" without labeling it CSOAI's own rubric
- never "Bitcoin-confirmed" unless status says so
- never collapse signed → admitted → measured → paid
- never name CSGA / James Castle / Terranova
