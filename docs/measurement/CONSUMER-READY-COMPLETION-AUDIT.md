# CSOAI — CONSUMER-READY COMPLETION AUDIT (measured) — 2026-11-10T13:29:10Z

Every LIVE line below was **probed against the live surface** and carries the measured value and the receipt. An item is LIVE only if a probe saw it; an item whose probe could not run is OPEN with the reason, never LIVE. Owner-gated items are named as owner-gated rather than counted as done.

**27 items — 9 LIVE, 9 OPEN, 3 STAGED, 6 OWNER.**

This is a measurement of completion, not a claim of a market outcome. "Unicorn status" is a trajectory, not a claim, and this artefact does not make it one.

| # | Item | Lane | State | Measured | Receipt |
| --- | --- | --- | --- | --- | --- |
| U-1 | Product live end to end (discover -> identify -> pay -> verify) | agent | **OPEN** | availability=LIVE; 6/6 surfaces answered 200: board=200, root=200, corrections=200, x402=200, mcp=200, verify=200; completion not verified: this GET-only audit does not consume a qualified non-fixture discover/identify/pay/deliver/verify receipt | [https://councilof.ai/](https://councilof.ai/) |
| U-2 | Flagship public (claim maintenance) | agent | **OPEN** | availability=LIVE; GET / -> HTTP 200; completion not verified: this GET-only audit does not consume qualified claim-maintenance acceptance linking the claim, supporting evidence, correction history and independent readback | [https://councilof.ai/](https://councilof.ai/) |
| U-3 | Heartbeat board public | agent | **LIVE** | GET /board/ -> HTTP 200 | [https://councilof.ai/board/](https://councilof.ai/board/) |
| U-4 | Root advancing + axes + corrections counter | agent | **LIVE** | root as_of=2026-11-07T20:54:37Z, 442 leaves; board public_count=34 axes · 34 measured; corrections=93, signature_state=VALID | [https://councilof.ai/root.json](https://councilof.ai/root.json) |
| U-13a | Agent skills published | agent | **LIVE** | 15 skill(s) in the published index | [https://councilof.ai/.well-known/agent-skills/index.json](https://councilof.ai/.well-known/agent-skills/index.json) |
| U-21 | OpenTimestamps: every published proof Bitcoin-attested | agent | **OPEN** | 696/698 proofs Bitcoin-attested, 2 pending | [https://councilof.ai/interop/ots/manifest.json](https://councilof.ai/interop/ots/manifest.json) |
| U-9a | Corrections published and signed | agent | **LIVE** | 44 verified, 5 blockers, 8 not_claimed; no unamended 'Public root stale' blocker | [https://councilof.ai/completion.json](https://councilof.ai/completion.json) |
| U-10a | Namespace consolidation: the com.councilof/* DNS TXT claim | agent | **OPEN** | no namespace TXT is published (com.councilof.ai -> the name does not exist; _namespace.com.councilof.ai -> the name does not exist; _mcp.com.councilof.ai -> the name does not exist) - publishing it needs DNS authority for the domain, which is the owner's | dns:com.councilof.ai _namespace.com.councilof.ai _mcp.com.councilof.ai |
| U-10c | No published artefact still claims a com.councilof.* identifier | agent | **LIVE** | 0 published file(s) still claim an identifier in the com.councilof.* space | repo:public/ (measured at build time) |
| U-14a | OpenShell adapter built, with a witness capture | agent | **LIVE** | adapter present, witness capture present; capture receipt DIVERGENT {'DIVERGED': 1, 'HELD': 2}; issuer is still a placeholder (did:web:issuer.example) | repo:harness/openshell-adapter/capture-2026-09-28/out/run-receipt.json |
| U-14b | Cedar policy set governing the GSPC route | agent | **LIVE** | 5 Cedar policy file(s), 1 schema file(s) | repo:functions/_lib/route/policy/ |
| U-15a | Evaluation Cards schema published | agent | **LIVE** | 2 Evaluation Card artefact(s) | repo:docs/ public/ |
| U-9b | The corrections corpus, published and signed | agent | **LIVE** | 93 correction(s) published, signature_state=VALID; the corpus is numbered C-<date>-<n>, so there is no '#60-70' series to be present or absent | [https://councilof.ai/api/corrections](https://councilof.ai/api/corrections) |
| U-13b | Ecosystem Health Board + citation flywheel | agent | **OPEN** | no Ecosystem Health Board on the edge: /ecosystem-health/ -> HTTP 404, /health-board/ -> HTTP 404; the estate's own CJ-50 row calls it UNVERIFIED | [https://councilof.ai/reports/](https://councilof.ai/reports/) |
| U-18a | The chained loop v0.1 (fixed grader) | agent | **OPEN** | no chained-loop artefact in scripts/, docs/, public/, council-os/, functions/ or harness/ — the corpus calls the stack 'verified' and the 2-week held-out gate the closer; neither is in the tree | repo:scripts/ docs/ public/ council-os/ functions/ harness/ |
| U-19a | Small-world lab T-1 league | agent | **OPEN** | no small-world / T-1 league artefact in the tree; the corpus lists it as 'specced, pod spike' and names a pod spike as the closer | repo:scripts/ docs/ public/ council-os/ functions/ harness/ |
| U-22 | 402 health split + stale-directory repoints | agent | **OPEN** | no 402-health / health-split / repoint artefact in the tree; the corpus lists 'measured, repair queue' with the repair queue as the closer | repo:scripts/ docs/ public/ council-os/ functions/ harness/ |
| U-5 | Signer ceremony + V-9 rotation | owner | **OWNER** | not probeable: it needs a human and a key | — |
| U-6 | SCITT claim-card I-D on record | owner | **OWNER** | not probeable: filing is a human act | — |
| U-7 | NIST TEVV comment + BoE pack + GENIUS + CFTC + Gold | owner | **STAGED** | not probeable: the send is a human act | — |
| U-8 | Wave (33 targets) + whale dossiers sent | owner | **STAGED** | not probeable: the send is a human act | — |
| U-10b | www DNS + the numbers block | owner | **OWNER** | not probeable: DNS and decisions are the owner's | — |
| U-11 | First EXTERNAL verified delivery | owner | **OWNER** | not probeable: it needs a customer, not a script | — |
| U-12 | 5 repeat payers | owner | **OWNER** | not probeable: it needs customers | — |
| U-16 | Grant entries (DeepRAP / SME / KTP / Manifund) | owner | **STAGED** | not probeable: a human writes and submits them | — |
| U-17 | IP: marks filed, prior-art blockade | owner | **OWNER** | not probeable: filing is a human act | — |
| U-20 | 1,050-move harvest deck + 1,000-move decks + 31-gate board | agent | **OPEN** | not yet closed by a probe; the work is in the agent lane | — |

## Not claimed

- a customer
- a sale
- a valuation
- a partnership
- a certification
- any unicorn status
- a conformance grade for any MCP server
- an attestation for any third-party evaluation result
- an endorsement by any person or institution quoted in a checklist

Measured at 2026-11-10T13:29:10Z by `scripts/completion_audit.py`.
Measurement, not certification.
