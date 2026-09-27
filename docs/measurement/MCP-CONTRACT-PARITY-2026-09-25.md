# MCP contract parity + HOLD watcher — 2026-09-25

Lane `contract-parity-20260925`. Record `csoai.mcp-contract-parity/0.1`, published as
https://huggingface.co/datasets/csoai/mcp-contract-parity (CC-BY-4.0). Figures below are copied by script from
`record.json` (sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`); the record is the authority.

**Question.** Does one remote MCP service tell a relying agent one current contract across its public surfaces
(registry entry, `/.well-known/mcp.json`, server card, agent card, x402 manifest, live discovery answers)?
Measured, not certified; an INCONSISTENT row quotes two public statements that disagree, never which is right.

## Correction 0.1.2 (2026-09-26) — this section supersedes the 0.1.1 and 0.1 figures below where they differ

Record `csoai.mcp-contract-parity/0.1.2` (`record.v0.1.2.json`, sha256 `5a9bedff1b6facbd9e19a1db1282b37fb6cedd9bf6c7dd14aeeeff387eae77ed`) supersedes 0.1.1 (`record.v0.1.1.json`, sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`); 0.1.1 and 0.1 stay published byte for byte. Signed: `record.v0.1.2.signed.json` (sha256 `e3cf8123c13ac9a6ddc494f93f8fbfcb2901c00f5fee5897e400e3cbbc46d096`, did:web:csoai.org#board-attestation-1). OTS: `record.v0.1.2.json.ots` (sha256 `8425658e4921988f61841f4b6408d7533670fc311cfd8322e2d61bfd4bc55162`, pending). HF dataset commit `0bfa689638c76f3d8a1124f74ba25a37c0902928`. Read state relabelled **PARTIAL** (0.1 and 0.1.1 said EXHAUSTED).

Same HF commit: `probe/` (the first-party census probe that 5,296 of the 5,828 rows cite, public fields only, rights gate MEASURE_PUBLIC, signed record `probe/record.firstparty-2026-09-25.json` sha256 `f338012c259fe9790fc5cbb338447fae15078970b35b80cd037aa25fe3f7c212`), `record.v0.1.1.json.bitcoin.ots` (0.1.1 Bitcoin-attested at blocks 968624, 968626, 968635, merkle roots checked against blockstream.info and mempool.space), and a typed viewer copy `rows.v0.1.2.viewer.parquet` (the viewer's `configs:` default; a JSON reader typed "2025-11-25" as a timestamp). README wording fix: HF commit `57426e497d28cd6b6a4dfc5a1c0fbc064e009639`. README-only hygiene (contact / objections / re-checks, named User-Agent, offline OTS check, citation) on the sibling datasets: mcp-remote-census `678f0ac9`, a2a-card-census `cae15028` (viewer now on the 0.1.1 rows), hf-mcp-spaces-census `b9001678`, cross-ledger-supply `542878e5`, evidence-index `1fc2771a`.

**What was wrong.**

- **D1-AUTH-SUBSET** (TOOLS): 0.1.1 a declared tool list was compared as a superset of the live credential-free tools/list only when a surface also named a public (no-credential) list; otherwise exactly. Why wrong: when auth is declared required, the credential-free listing may be the public subset whether or not the service also publishes a public_tools field (zensched: card n=74, live n=11, every live tool in the card) 0.1.2: with auth declared required on any surface, a list holding every live tool and more (or a bare count above live) is UNCHECKABLE (SUBSET_UNDER_AUTH); still INCONSISTENT when the live list holds a tool the declaration lacks, when a count is below live, or when no auth is declared.
- **D3-SYM** (AUTH): 0.1.1 registry header isRequired false vs card authentication.required true was UNCHECKABLE (DECLARED_SCOPES_DIFFER); the mirror pair, registry header isRequired true vs card authentication.required false, stayed INCONSISTENT. Why wrong: both pairs join a claim about sending one transport header to connect with a card flag of unstated scope. 'Header required, card: not required' with discovery answering without credentials is exactly 'discovery open, tools/call needs auth' -- the same reading 0.1.1 accepted for the other direction. A rule that excuses one direction and not the other is not a rule. 0.1.2: symmetric: a registry-header claim and a card / publisher-provided claim are adjudicated only through the observed discovery boundary. The side saying NOT required (either kind) is INCONSISTENT with a refused discovery; otherwise UNCHECKABLE (DECLARED_SCOPES_DIFFER). Claims of the same kind on two surfaces are still compared directly..
- **D6-SURFACE-UNREAD** (all): 0.1.1 a surface that was tried and did not answer (ERROR, TIMEOUT, RATE_LIMITED, UNREACHABLE, NOT_FETCHED after the origin failed) was treated as silent, so the dimension could be SINGLE_SURFACE; the run was labelled EXHAUSTED because every endpoint was attempted. Why wrong: an unread surface may state exactly the claim that would make a second voice. 251 rows had such a surface (41 of them behind an HTTP 429 stop, 104 surface reads never sent after the stop); 244 carried SINGLE_SURFACE. A rate-limited read is not an exhausted one. 0.1.2: a dimension that would be SINGLE_SURFACE while a surface able to speak to it (mcp.json, server-card; x402 for PAYMENT) was unread is UNCHECKABLE (SURFACE_UNREAD); read_state is EXHAUSTED only if every tried surface answered, else PARTIAL.

**Fix.** Producer `scripts/census/contract-parity.py` commit `e087664dd86c3b153ee81819cee260477e531511` (instrument 0.1.2); tests: scripts/census/test_contract_parity.py class Correction012: one fixture per rule with counter-cases that must stay INCONSISTENT; four must-fail controls each restore one 0.1.1 rule and fail the suite; the Correction012 fixtures also fail when run against the 0.1.1 producer.

**Reproduction.** the 0.1 and 0.1.1 producers re-run over the same inputs reproduce their published rows byte for byte, so every difference below is the 0.1.2 producer change and nothing else: 0.1 (commit d9e0f80) 5828 rows sha256 92b0fae322d9… matches; 0.1.1 (commit 4037f6b) 5828 rows sha256 eeeb2a0d9ae4… matches.

**VERSION findings re-checked (unchanged):** https://agentberg.ai/mcp INCONSISTENT; https://app.html2img.com/mcp INCONSISTENT; https://mcp.zensched.com/mcp INCONSISTENT.

**Effect.** Endpoints with any INCONSISTENT dimension: 2778 → 2768 → 2764. 176 rows, 430 dimension changes (D1-AUTH-SUBSET 7, D3-SYM 5, D6-SURFACE-UNREAD 418). Not changed: VERSION and PROTOCOL comparators; the plan; the population; every row not listed in rows_changed keeps its 0.1.1 states.

| dimension | state | 0.1.1 | 0.1.2 |
|---|---|---|---|
| AUTH | INCONSISTENT | 10 | 5 |
| AUTH | SINGLE_SURFACE | 4468 | 4332 |
| AUTH | UNCHECKABLE | 422 | 563 |
| PAYMENT | SINGLE_SURFACE | 572 | 558 |
| PAYMENT | UNCHECKABLE | 5140 | 5154 |
| PROTOCOL | SINGLE_SURFACE | 5065 | 4909 |
| PROTOCOL | UNCHECKABLE | 271 | 427 |
| TOOLS | INCONSISTENT | 226 | 219 |
| TOOLS | SINGLE_SURFACE | 4535 | 4424 |
| TOOLS | UNCHECKABLE | 159 | 277 |
| VERSION | SINGLE_SURFACE | 21 | 20 |
| VERSION | UNCHECKABLE | 0 | 1 |

Rows changed, by name:

| endpoint | dimension | 0.1.1 → 0.1.2 | cause |
|---|---|---|---|
| https://mcp.citybook.ai/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://mcp.datamerge.ai/ | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| https://duskly.ai/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://duskly.ai/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://duskly.ai/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.limitguard.ai/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| https://signalharness.ai/api/agent/services/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://animica.dev/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uk-due-diligence-mcp.fly.dev/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uk-due-diligence-mcp.fly.dev/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uk-due-diligence-mcp.fly.dev/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vaaya.ai/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://api.velarion.ai/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://dreamhall.app/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dreamhall.app/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dreamhall.app/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://finn-tannlege.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://finn-tannlege.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://finn-tannlege.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mizan-bazar.higgsfield.app/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mizan-bazar.higgsfield.app/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mizan-bazar.higgsfield.app/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.opendealer.app/rpc | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| https://ownyourai.app/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://ownyourai.app/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://wikijuridica.com.br/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://wikijuridica.com.br/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://wikijuridica.com.br/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://ai-belarus.by/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://ai-belarus.by/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://ai-belarus.by/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://myoutfitters.ca/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://myoutfitters.ca/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://myoutfitters.ca/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.idescat.cat/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.idescat.cat/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-compliance | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-compliance | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-compliance | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-geo | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-geo | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp-geo | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.acuris-geo.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.acuris-geo.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adbutler.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adbutler.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adbutler.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://adcreator-ai.com/mcp-ads | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://adcreator-ai.com/mcp-ads | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://adcreator-ai.com/mcp-ads | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adcritter.com/mcp/dev | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adcritter.com/mcp/dev | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.adcritter.com/mcp/dev | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.adminlanding.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.adminlanding.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.adminlanding.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://agentdomainsearch.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://agentdomainsearch.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://agentdomainsearch.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.aiactradar.com/mcp/v1 | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| https://www.aiwatercolorgenerator.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.aiwatercolorgenerator.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.alleskralle.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.alleskralle.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.alleskralle.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://arc-relay.com/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://awardsecrets.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://awardsecrets.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.cadencz.com/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://crosswirepay.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.danielsdesignstudio.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.danielsdesignstudio.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.danielsdesignstudio.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dayze.com/api/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dayze.com/api/mcp/key | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dayze.com/api/mcp/key | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dayze.com/api/mcp/key | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dayze.com/api/mcp/key | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.metroquadrado.workers.dev/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.metroquadrado.workers.dev/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.metroquadrado.workers.dev/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.debitura.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dechonet.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dechonet.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dechonet.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.decision-anchor.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.decision-anchor.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.decision-anchor.com/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.decision-anchor.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defaultverifier.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defaultverifier.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defaultverifier.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defici.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defici.com/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defici.com/api/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://defici.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.delilahusa.com/ | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.delilahusa.com/ | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dentalsoftwarecompare.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dentalsoftwarecompare.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://dentalsoftwarecompare.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.desafiocomunicacion.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.desafiocomunicacion.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.desafiocomunicacion.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://desaira.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://desaira.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://desaira.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://savantcat.cn/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://au.hortosapp.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://au.hortosapp.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://au.hortosapp.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.html2img.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3-SYM |
| https://imergea.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://imergea.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://imergea.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.kernelcad.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.kernelcad.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.kernelcad.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.legendsoflearning.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.legendsoflearning.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.legendsoflearning.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lillytechsystems.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lillytechsystems.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lillytechsystems.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mailcheer.com/api/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://makespdf.com/api/v1/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://makespdf.com/api/v1/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mamanida.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mamanida.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mamanida.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://medianfi.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://medianfi.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://medianfi.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://overlap-ai.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://overlap-ai.com/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://overlap-ai.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://playbluffo.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://playbluffo.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://playbluffo.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.precision-concretecoating.com/api/public/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.precision-concretecoating.com/api/public/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://app.precision-concretecoating.com/api/public/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://prismfact.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://prismfact.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://prismfact.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://risetive.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://risetive.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://risetive.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shipshapedata.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shipshapedata.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shipshapedata.com/mcp/docs | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shipshapedata.com/mcp/docs | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shipstatic.com/ | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shipstatic.com/ | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shipstatic.com/ | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shonanfarm.com/wp-json/zama/v1/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shonanfarm.com/wp-json/zama/v1/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shonanfarm.com/wp-json/zama/v1/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.shotanvil.com/mcp | VERSION | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.shotanvil.com/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shotpulled.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shotpulled.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.shotpulled.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shpbl.com/api/public/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://shpbl.com/api/public/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siftvo.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siftvo.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siftvo.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.sigaoli.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.sigaoli.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.sigaoli.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigistry.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigistry.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigistry.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.siglume.com/ | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.siglume.com/ | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigmadiario.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigmadiario.com/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sigmadiario.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://signatureforever.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.signed.com/investors | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.signed.com/investors | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.signed.com/investors | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siliconfriendly.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siliconfriendly.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://siliconfriendly.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bible.simplecohortllc.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bible.simplecohortllc.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bible.simplecohortllc.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uml.singsk.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uml.singsk.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uml.singsk.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.sinhvu.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sittingly.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sittingly.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sittingly.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://render.skillforge99.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://render.skillforge99.com/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://render.skillforge99.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skillmd.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skillmd.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skillmd.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skipseek.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skipseek.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.skipshit.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.skipshit.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.skipshit.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skitransferquotes.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skitransferquotes.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skitransferquotes.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skyaccess.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skyaccess.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.skyaccess.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skyalo.com/chatgpt/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skyalo.com/chatgpt/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://skyalo.com/chatgpt/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://smartmoney77.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://smartmoney77.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://smartmoney77.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://squallstudio.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://squallstudio.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sumhound.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sumhound.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.texasratedpros.com/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.texasratedpros.com/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.texasratedpros.com/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.therevenueaireport.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.therevenueaireport.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.therevenueaireport.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.uplika.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.uplika.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.uplika.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.us-bike-travel.com/mcp-public.php | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.us-bike-travel.com/mcp-public.php | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.us-bike-travel.com/mcp-public.php | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vamosalicante.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vamosalicante.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.zensched.com/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (SUBSET_UNDER_AUTH) | D1-AUTH-SUBSET |
| https://agent-commons.alexlabs.dev/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://agent-commons.alexlabs.dev/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://agent-commons.alexlabs.dev/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://nichedb.dev/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://nichedb.dev/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://nichedb.dev/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://belong.events/functions/v1/mcp-server/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://belong.events/functions/v1/mcp-server/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://belong.events/functions/v1/mcp-server/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://belong.events/functions/v1/mcp-server/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://long.events/functions/v1/mcp-server/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://long.events/functions/v1/mcp-server/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://long.events/functions/v1/mcp-server/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://batru.gg/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://batru.gg/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://batru.gg/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://origin.rootz.global/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://origin.rootz.global/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://tango.applayer.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://tango.applayer.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://acuity-scheduling.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://acuity-scheduling.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://aircall.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://aircall.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://amberflo.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://amberflo.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anvil.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anvil.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api2pdf.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api2pdf.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://apivideo.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://apivideo.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://autumn.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://autumn.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bannerbear.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bannerbear.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bettermode.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bettermode.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://betterstack.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://betterstack.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bird.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://bird.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://braintree.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://braintree.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://cronitor.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://cronitor.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://fireworks.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://fireworks.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://foxyio.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://foxyio.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://knowledgeowl.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://knowledgeowl.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lago.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lago.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lambda-labs.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lambda-labs.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://laravel-forge.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://laravel-forge.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lemonsqueezy.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lemonsqueezy.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://linear.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://linear.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lob.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://lob.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://loops.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://loops.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://magicbell.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://magicbell.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mailchimp.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mailchimp.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mailerlite.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mailerlite.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://maptiler.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://maptiler.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://maxmind-minfraud.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://maxmind-minfraud.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://memberful.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://memberful.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://stream.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://stream.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://swell.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://swell.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://tailscale.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://tailscale.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://twenty.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://twenty.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uploadcare.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://uploadcare.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vital.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vital.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://youcanbookme.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://youcanbookme.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://zendesk.usefulapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://zendesk.usefulapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.uxjobs.io/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.uxjobs.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.uxjobs.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.xdataapi.io/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.xdataapi.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.xdataapi.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://zerogex.io/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://zerogex.io/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://zerogex.io/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.bijack.ir/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.bijack.ir/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.bijack.ir/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.cbest.ir/lighting/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.cbest.ir/lighting/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.cbest.ir/lighting/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mink.is/wp-json/mink-mcp/v1/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mink.is/wp-json/mink-mcp/v1/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mink.is/wp-json/mink-mcp/v1/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcpserver.cup24.it/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcpserver.cup24.it/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcpserver.cup24.it/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://heera.it/wp-json/agentimus/v1/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://heera.it/wp-json/agentimus/v1/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://inviaggioallecanarie.it/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://inviaggioallecanarie.it/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://inviaggioallecanarie.it/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.physicalai.jobs/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.physicalai.jobs/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://www.physicalai.jobs/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://addresstozip.jp/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://addresstozip.jp/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://addresstozip.jp/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.afdb.jp/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.afdb.jp/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.afdb.jp/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.agentfeeds.jp/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.agentfeeds.jp/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.agentfeeds.jp/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.agentfeeds.jp/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.avacast.jp/api/v1/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.avacast.jp/api/v1/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.contencial.co.jp/ | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.contencial.co.jp/ | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://glyt.net/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.lawyerd.net/takedown | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.lawyerd.net/takedown | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.lawyerd.net/takedown | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api-studio.reogrid.net/studio/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api-studio.reogrid.net/studio/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api-studio.reogrid.net/studio/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://swaptitan.net/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://swaptitan.net/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://swaptitan.net/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://filetourl.org/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://filetourl.org/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://filetourl.org/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://urltopdf.org/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://urltopdf.org/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://urltopdf.org/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.anyskills.ru/ | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.ru/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.ru/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.ru/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vedarai.ru/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vedarai.ru/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://vedarai.ru/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://buynearby.store/api/v1/mcp-server.php | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://buynearby.store/api/v1/mcp-server.php | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sleeperhit.studio/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://sleeperhit.studio/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://phion.systems/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://phion.systems/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://systra.tools/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://systra.tools/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.ourway.travel/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.ourway.travel/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.ourway.travel/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.com.ua/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.com.ua/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://quintadb.com.ua/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://latido.wedding/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://latido.wedding/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://latido.wedding/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anamized.grok.me/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anamized.grok.me/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anamized.grok.me/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://anamized.grok.me/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://humanlineage.org/api/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://humanlineage.org/api/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://humanlineage.org/api/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.helpmyagent.com/mcp | TOOLS | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.helpmyagent.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.helpmyagent.com/mcp | PAYMENT | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://api.helpmyagent.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.outdoorithm.com/mcp | AUTH | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |
| https://mcp.outdoorithm.com/mcp | PROTOCOL | SINGLE_SURFACE → UNCHECKABLE (SURFACE_UNREAD) | D6-SURFACE-UNREAD |

## Correction 0.1.1 (2026-09-26) — this section supersedes the 0.1 figures below where they differ

Record `csoai.mcp-contract-parity/0.1.1` (`record.v0.1.1.json`, sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`) supersedes 0.1 (`record.json`, sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`), which stays published byte for byte. Signed: `record.v0.1.1.signed.json` (sha256 `87e624558cd5b45df9357c6893e2f5dccdff1ea95b859375f03ae98465564e71`, did:web:csoai.org#board-attestation-1). OTS: `record.v0.1.1.json.ots` (sha256 `8b8190b7fa2cb07a777a6d77f631d6b2ad47bbc27f1e0279bfa16bf0cd747a51`). HF dataset commit `0f4c4bae9e5f243bb37b4dc58075882a87737eb3`.

**What was wrong.**

- **D1** (TOOLS): 0.1 every declared tool list was compared exactly with the live tools/list. Why wrong: the live tools/list is read WITHOUT credentials. A service that names the tools usable without credentials (public_tools, anonymousTools, ...) declares that its unscoped list is its full, partly authenticated surface; an unauthenticated listing may show the public subset or everything. The full list is not a claim about what unauthenticated discovery lists.. 0.1.1: with a public-scoped list present, unscoped lists / counts are compared as supersets (every live tool must be in them); the public list is recorded, not compared (it scopes use, not listing).
- **D2a** (attribution (all)): 0.1 an origin's documents were credited to an endpoint whenever the census frame knew one server on that origin. Why wrong: the document itself can say it describes another endpoint mount on the same origin; the origin then serves more than one MCP endpoint and the instrument's own shared-origin rule applies. 0.1.1: an MCP document naming another endpoint mount on this origin (and not this endpoint) is not credited; another host (www/apex, a custom domain) or another transport/version path of the same mount is not read as a second endpoint.
- **D2b** (attribution (all)): 0.1 facts were read from every nested block of a credited document. Why wrong: a nested block with its own url and its own tools/transport describes another endpoint (a docs MCP, an apps MCP, a hosted demo). 0.1.1: such a block is removed before facts are read: always when its endpoint is on this origin; on another host only when the document also describes an endpoint of its own outside the block.
- **D3** (AUTH): 0.1 a registry remote header with isRequired false and a card's authentication.required true were paired as a contradiction. Why wrong: isRequired false (the registry omits false; the schema default is false) says the client may CONNECT without the header; the card's 'required' does not say whether it applies to discovery or to tools/call. Two claims of different scope; tools/call is never sent, so which scope the card means is not observed.. 0.1.1: UNCHECKABLE (DECLARED_SCOPES_DIFFER); still INCONSISTENT when discovery itself was refused without credentials.
- **D4** (TOOLS): 0.1 a bare declared tool count was compared with the live tool count. Why wrong: when the live list holds a dispatcher (run_tool, call_tool, ...), a count above the live count may count tools reached through it; the count does not say which it counts. 0.1.1: not compared; UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) when it is the only declared figure; a count BELOW the live count is still INCONSISTENT.

**Fix.** Producer `scripts/census/contract-parity.py` commit `4037f6bb2b7162b1679301846287b95934a85ad6` (instrument 0.1.1); tests: scripts/census/test_contract_parity.py class Correction011: one fixture per reported case, shapes copied from the stored bytes; five must-fail controls, each restoring one 0.1 rule, fail the suite.

**Reproduction.** the 0.1 producer (commit d9e0f80) re-run over the same inputs reproduces all 5828 published 0.1 rows byte-identically, so every difference below is the producer change and nothing else.

**Effect.** Endpoints with any INCONSISTENT dimension: 2778 → 2768. 22 rows, 26 dimension changes. Not changed: VERSION and PAYMENT rules; the plan; the population; every row not listed in rows_changed keeps its 0.1 states.

| dimension | state | 0.1 | 0.1.1 |
|---|---|---|---|
| AUTH | CONSISTENT | 931 | 928 |
| AUTH | INCONSISTENT | 23 | 10 |
| AUTH | SINGLE_SURFACE | 4465 | 4468 |
| AUTH | UNCHECKABLE | 409 | 422 |
| PROTOCOL | SINGLE_SURFACE | 5064 | 5065 |
| PROTOCOL | UNCHECKABLE | 272 | 271 |
| TOOLS | CONSISTENT | 905 | 908 |
| TOOLS | INCONSISTENT | 233 | 226 |
| TOOLS | SINGLE_SURFACE | 4532 | 4535 |
| TOOLS | UNCHECKABLE | 158 | 159 |

Dimension changes, by endpoint name:

| endpoint | dimension | 0.1 → 0.1.1 | cause |
|---|---|---|---|
| https://app.augenix.ai/api/mcp/public | TOOLS | INCONSISTENT → SINGLE_SURFACE | D2a |
| https://www.decisionlog.ai/api/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.myotp.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://toolforte.com/api/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) | D4 |
| https://scholar-sidekick.com/api/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://scholar-sidekick.com/api/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2b |
| https://mcp.klarix.ai/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://ai-visibility.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://auth-posture.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://stampcard.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://veilpoint.ca/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://dchub.cloud/mcp/registry | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | TOOLS | CONSISTENT → SINGLE_SURFACE | D2a |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2a |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | PROTOCOL | UNCHECKABLE (DECLARED_VERSION_NOT_REQUESTED) → SINGLE_SURFACE | D2a |
| https://hotels.flightpowers.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://flights.flightpowers.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://www.immersivecommons.com/api/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b,D1 |
| https://itsnum.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.unifically.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.usecarscout.com/mcp | TOOLS | INCONSISTENT → CONSISTENT | D1 |
| https://standoutmcp.io/api/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.btcdecoded.org/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp | TOOLS | CONSISTENT → SINGLE_SURFACE | D2a |
| https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2a |
| https://api2.transloadit.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |

## Own endpoint first (https://councilof.ai/mcp)

- AUTH: **CONSISTENT**
- PAYMENT: **CONSISTENT**
- PROTOCOL: **SINGLE_SURFACE**
- TOOLS: **CONSISTENT**
- VERSION: **CONSISTENT**

## Read

EXHAUSTED over the plan: 5828 of 5828 planned endpoints attempted
(auth_required+advertises_x402_or_a2a 20, responded 5807, watch_list 1). The plan is built on PARTIAL probe reads; its counts
are not frame or population totals. Surface fetch: 2026-09-25T11:20:34Z - 2026-09-25T12:11:29Z, GET-only, robots.txt honoured,
1 req/s/host, one connection/host, 26499 requests.

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| AUTH | 931 | 23 | 4465 | 409 |
| PAYMENT | 112 | 4 | 572 | 5140 |
| PROTOCOL | 459 | 33 | 5064 | 272 |
| TOOLS | 905 | 233 | 4532 | 158 |
| VERSION | 3163 | 2644 | 21 | 0 |

Endpoints with at least one INCONSISTENT dimension: 2778.

Timing caveat: live answers and surface documents were read up to ~5.5 h apart. Where the registry version changed in between (HOLD window W2), the row uses the hold re-probe read inside the surface window. A service that changed without a registry version change in that interval can still show a live-vs-document INCONSISTENT; registry changes after the W2 read (11:25:23Z) are not observed.

## HOLD watcher

`scripts/census/version-hold.py`: registry server.version changed between two reads -> HOLD_UNTIL_REMEASURED;
remote endpoints re-probed read-only with prober 0.2 (bound 300). Held 173 (91 with a remote);
outcomes: HOLD_UNTIL_REMEASURED 85, REMEASURED_CHANGED 6, REMEASURED_NO_BASELINE 14, REMEASURED_SAME 60, REMEASURE_INCONCLUSIVE 8.
Auth boundary is compared only like-for-like (0.2 legacy-era initialize vs 0.1 initialize); protocol only when 0.2 fell
back to legacy requesting 2025-11-25; SAME requires at least one dimension actually compared.

### Cron line for the flywheel lane to adopt (this lane installs no crontab)

```
40 */6 * * *  cd ~/lanes/flywheel/scripts/census && S=~/lanes/flywheel/state/hold && R=$S/$(date -u +\%Y\%m\%dT\%H) && python3 version-hold.py fetch --since-file $S/last-read --out $R && python3 version-hold.py diff --window "cron|$S/snapshot.jsonl.gz|$(cat $S/last-read)|$S/snapshot.jsonl.gz|$(date -u +\%FT\%TZ)|$R/fetched.jsonl.gz" --out $R --write-snapshot $S/snapshot.jsonl.gz && python3 version-hold.py remeasure --hold $R --baseline $S/last-probe --bound 300 && date -u +\%FT\%TZ > $S/last-read
```

Seed `state/hold/snapshot.jsonl.gz` once with `version-hold.py diff --write-snapshot` from a full frame read, and
`state/hold/last-read` with that read's start time; `--baseline` points at the last census probe output dir.

## Signature and timestamp

`record.signed.json`: signed 2026-09-25T12:25:41.808Z under did:web:csoai.org#board-attestation-1, verified locally;
altered-preimage controls: {'trailing byte appended': 'rejected (control holds)', 'record sha256 altered': 'rejected (control holds)'}.
`record.json.ots`: PENDING_CALENDAR_COMMITMENT (3 calendars), not a Bitcoin attestation until upgraded and verified.

## Reproduce (Oracle)

```
python3 scripts/census/contract-parity.py --self-test
python3 scripts/census/version-hold.py --self-test
D=/evac-bulk/contract-parity-2026-09-25
python3 scripts/census/contract-parity.py plan --probe /evac-bulk/census-probe-2026-09-25 --probe /evac-bulk/census-firstparty-2026-09-25 \
  --registry-raw /evac-bulk/census-frame-2026-09-25/raw/mcp-registry --frame /evac-bulk/census-frame-2026-09-25 --out $D
python3 scripts/census/contract-parity.py collect --plan-dir $D --out $D --workers 64 --budget-s 4200
python3 scripts/census/version-hold.py fetch --since 2026-09-25T05:45:50Z --out $D/hold
python3 scripts/census/version-hold.py diff --window "W1|<RAS read jsonl>|..|<frame raw>|.." --window "W2|<frame raw>|..|<frame raw>|..|$D/hold/fetched.jsonl.gz" --out $D/hold
python3 scripts/census/version-hold.py remeasure --hold $D/hold --baseline /evac-bulk/census-probe-2026-09-25 --baseline /evac-bulk/census-firstparty-2026-09-25 --bound 300
python3 scripts/census/contract-parity.py compare --plan-dir $D --collect-dir $D --out $D/compare --hold $D/hold
python3 scripts/census/contract-parity.py build --compare-dir $D/compare --plan-dir $D --collect-dir $D --hold $D/hold --out $D/record --stage $D/stage
```
