# H.I.M. ATTEST — human-in-the-loop attestation ceremonies (the seamless plugin)
**Status: BUILT + TESTED (5/5) + LIVE (real ceremonies ran against councilof.ai evidence endpoints on 2026-11-02).**
Fuses: the SOVEREIGN crosswalk's 12 solved framework mind-sets → the GSPC evidence corpus → the meok H.I.M. pattern (AI does the work with evidence, keeps the human in the loop when it can't know — never fakes).

## The one-line honesty engine
> Machines attach signed evidence (sha256/Ed25519/Merkle/witnesses). Humans sign only what only humans can. Everything else is declared UNMEASURED. **The engine refuses to finalize while any human task is pending — it cannot fake completion.** Certification language is rejected at the API level.

## What ran live today (proof)
```
run --subject acme-demo --framework eu-ai-act-art50
  → checkpoints: 2 MACHINE-EVIDENCED · 3 HUMAN-REQUIRED · ceremony_sha256 8d8571bc…
run --subject bank-demo --framework dora-art28-30
  → checkpoints: 2 MACHINE-EVIDENCED · 4 HUMAN-REQUIRED · ceremony_sha256 9b3c13ea…
```
Machine checkpoints cite real signed cards from the live corpus (e.g. "Anthropic art50_marking: bytes changed 2026-10-25"); the census/drift evidence came from the free evidence-bundle previews.

## Frameworks at launch (crosswalk = the SOVEREIGN 12, counsel-gated where noted)
`eu-ai-act-art50` · `eu-ai-act-art53` · `dora-art28-30` · `cra` · `iso-42001-lite` · `nist-ai-rmf-lite` — plus GDPR/NIS2/UK-AI-Bill maps staged next from the same crosswalk. The full declared inventory (the "417") is the scale target; launch set is what counsel can stand behind. **"lite" means evidence posture, not accredited audit — CABs own certification; we own measurement + human attestation of evidence.**

## Who it's for — segment matrix
| Segment | What they get | Free vs paid |
|---|---|---|
| **AI platforms (labs)** | Art 53 + board axes ceremonies; drift watch on their own surfaces | Ceremony engine OSS free; continuous signed witness feed = paid |
| **Governments** | NIST-lite / EU AI Act maps; per-vendor daily reports for oversight teams | Reports free (public censuses); custom scopes = quote |
| **SME** | One-click ceremony on their AI vendors; plain-language human tasks | Free tier; $20/mo Pro |
| **Enterprise / Fortune 500** | Multi-framework ceremonies feeding GRC; decision records for auditors | Bundles at audit band; recert annuity |
| **Banks (DORA)** | Register-of-Information-shaped packs from 529 signed cards (post-counsel) | Bundle per vendor |
| **LFX orgs + steering committees** | Daily one-page trust report: censuses, diffs, corrections, ceremony status | Free — it's our distribution |

## Business model (your framing, made precise)
- **Humans: free.** Ceremony engine, review flow, verification, public reports — Apache-2.0 OSS, free forever.
- **Agents: small x402 fee.** Any agent-initiated ceremony/evidence call meters at cents (`trust.query` $0.005, `server.evidence` $0.01, commissions $0.01→$0.20) via the `@csoai/x402` rail.
- **Enterprises: bundles + witness feeds.** Audit-band packs, vendor witness subscriptions ($500–2k/mo), buyer-side intel feeds.
- **Insurance: a partner channel, not our product.** We produce the evidence underwriters price on (insurer AI-audit expectations are already live in the US) — partner, never underwrite.

## The training loop (MEOK/H.I.M. — live compliance updates, never certification)
Daily provider-diff → capsule → drift detected → **two queues**: (1) MEOK drafts the fix/update with evidence attached (measure/sign/protect); (2) anything it can't know → **human task** in this ceremony engine (fix/approve/train/anchor). Every MEOK action carries its evidence shas; every human action carries a **human key signature — a separate identity from the machine keys**. When MEOK doesn't know, it says so, routes to the human, and waits. That's the anti-fake guarantee, in code (`finalize()` refuses while pending).

## Files
```
him-attest/
├── frameworks/*.json          ← 6 launch framework maps (machine vs human checkpoints, segments)
├── src/ceremony.js            ← the honesty engine (classify → queue → sign → finalize)
├── src/human-key.js           ← the HUMAN key (Ed25519, separate from machine keys; keystone in prod)
├── src/index.mjs              ← CLI: run / decide / finalize
├── mcp/him-attest.mjs         ← MCP tools: him_attest_run / _queue / _decide (plugin for any host)
└── test/ceremony.test.mjs     ← 5/5: honest classification · never-fake · human sign/tamper · no-cert-language
```

## Next
1. Counsel: Art 53/DORA wording sign-off (memo already drafted) → those frameworks go live for external subjects.
2. Wire `him_attest_*` into the Layer-0 plugin family + Claude/Codex configs (same install pattern as `gspc-pay`).
3. Governance segment pilot: one LFX-adjacent org gets the daily report format for 30 days, free.
4. Scale the crosswalk from the CANONICAL_INVENTORY toward the full declared set, framework by framework, counsel in the loop.
