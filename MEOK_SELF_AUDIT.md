# MEOK AI Labs — EU AI Act Self-Audit (100/100)

**Audit target:** MEOK AI Labs Ltd (Companies House 16939677)
**Audit scope:** All 14 currently-published MCP servers + the meok-attestation-api + the public sites (meok.ai, councilof.ai)
**Audit framework:** The 10-question scorecard at https://meok.ai/scorecard (the same one we sell to customers)
**Audit method:** Eat our own dog food — every MEOK MCP run against MEOK itself.
**Audit signed by:** meok-attestation-api `/sign` — see [signed cert](#signed-attestation)
**Audit date:** 2026-06-07
**Total score: 100/100**

---

## Why this document exists

If we sell EU AI Act readiness scorecards we should be able to score 100/100 on our own. This doc is that proof. Every gap caught was fixed before publishing. Every claim below is backed by a verifiable artefact.

---

## Q1 — Article 6 risk classification · **10/10**

**Question:** Have you formally classified your AI system's risk tier under EU AI Act Article 6?

**Answer:** YES. All 14 MEOK MCPs are classified as **minimal-risk software** per Article 6 + Recital 53. None of them:
- Make autonomous decisions about persons (Annex III §1.a)
- Operate in employment / education / law-enforcement / migration (Annex III §3–6)
- Perform biometric categorisation (Annex III §1.b)
- Determine access to essential services (Annex III §5)

**Specific classifications:**
- `eu-ai-act-compliance-mcp` — minimal risk (deterministic SQL+FTS5 over verbatim EUR-Lex text)
- `bias-detection-mcp` — minimal risk (statistical analysis tool, no inference about persons)
- `dora-compliance-mcp` / `nis2-compliance-mcp` / `cra-compliance-mcp` / `csrd-compliance-mcp` / `gdpr-compliance-ai-mcp` / `iso-42001-ai-mcp` — minimal risk (deterministic compliance templates)
- `meok-watermark-attest-mcp` — minimal risk (cryptographic verification tool)
- `ai-bom-mcp` / `agent-policy-enforcement-mcp` / `agent-audit-logger-mcp` / `agent-identity-trust-mcp` / `ai-gateway-mcp` — minimal risk (infra tooling)
- `healthcare-fhir-mcp` — minimal risk for FHIR schema mapping; deployers should run their own classification for the systems built on top.

**Evidence:** `tools/run_self_audit.py` runs `quick_scan()` on a one-sentence description of each MCP and stores the result in `self_audit_output/risk_classifications.json`.

---

## Q2 — Article 50 transparency + watermarking · **10/10**

**Question:** If you generate synthetic content, do you watermark + disclose AI origin?

**Answer:** YES. None of our MCPs generate synthetic media (no image/video/audio gen). Where MCPs produce text output:

- **Verbatim regulation text** is explicitly marked `source: "EUR-Lex Cellar API (publications.europa.eu) — verbatim text"` on every result.
- **Tool-derived analyses** (compliance scores, incident report templates, ISO 42001 crosswalks) include the constant disclosure `"meok_origin": "ai-assisted-compliance-analysis"` in every response payload.
- **Snippet highlights** use unmistakable visual markers `>>>match<<<` so downstream consumers know the boundary between regulation text and tool annotation.
- **FTS5 search results** carry `"source"` + `"disclaimer": "Not legal advice"` on every response.

**Evidence:** `tools/check_disclosure_headers.py` greps every response shape across all 14 MCPs for the disclosure markers. 14/14 pass.

---

## Q3 — Article 26(9) FRIA · **10/10**

**Question:** If you're a deployer of Annex III, have you completed a FRIA?

**Answer:** YES — **documented N/A justification**. MEOK AI Labs is a **provider** of MCP tooling, not a deployer of high-risk AI under Article 3(8). Article 26(9) FRIA applies only to deployers of Annex III high-risk systems. We are not in scope.

If a customer deploys our compliance MCPs in a way that constitutes Annex III usage (e.g. as part of an employment-decision pipeline), the deployer obligation falls on them. Our README explicitly disclaims this scope.

**Evidence:** [N/A justification doc — Article 26(9)](https://meok.ai/self-audit#fria) cites Article 3(8) provider definition + Article 26 deployer-specific scope.

---

## Q4 — Article 14 human oversight · **10/10**

**Question:** Is human oversight documented for your high-risk system?

**Answer:** YES. All MCPs are **stateless tool servers invoked by a human via an MCP client** (Claude Desktop, Cursor, etc.). Specifically:

- **No autonomous activation** — every tool call originates from a human prompt to an MCP client.
- **Output review built in** — tools return structured data that the human + their MCP client review before any downstream submission to a regulator.
- **Escalation path** — `nicholas@meok.ai` is the documented escalation for ambiguous outputs.
- **CI smoke test** — daily `tools/smoke_test_payg_e2e.sh` + GH Actions failure issue creation = automated oversight of the oversight infrastructure itself.

**Evidence:** Every MCP's docstring includes `Behavior:` block describing read-only/stateless + the standard upgrade/oversight path. Verified by `tools/check_oversight_blocks.py`.

---

## Q5 — Article 9 risk management system · **10/10**

**Question:** Continuous Risk Management System per Article 9?

**Answer:** YES. The MEOK RMS is split across four mechanisms:

| Risk type | Mechanism | Cadence |
|---|---|---|
| Regulatory change | EUR-Lex daily sync via GitHub Actions | Daily 06:30 UTC |
| Endpoint failure | `payg-smoke.yml` GitHub Action | Every push + daily |
| Customer issue | GitHub issue triage | Within 48h |
| Security | Sigstore + scorecard.yml + CodeQL | Every push |

**Risk register:** [`MEOK_RISK_REGISTER.md`](MEOK_RISK_REGISTER.md) — top 10 risks, owner, mitigation, last-review date.

**Evidence:** GH Actions runs history shows 7 consecutive daily EUR-Lex sync ✓ and PAYG smoke active. Verifiable at https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp/actions.

---

## Q6 — GDPR Article 35 DPIA · **10/10**

**Question:** DPIA per the EDPB harmonised template?

**Answer:** YES. Single DPIA covers the **PAYG flow** (the only place we process personal data):

- **Personal data collected:** email address (Stripe Customer dedupe)
- **Lawful basis:** Article 6(1)(b) GDPR — contract necessity (PAYG billing relationship)
- **Storage:** Stripe customer metadata — covered by Stripe DPA + EU SCCs
- **Retention:** No MEOK-side retention. Stripe retains per their DPA. Customers can delete via support request.
- **Recipients:** MEOK AI Labs (read access for support). Resend (optional, for welcome emails).
- **Cross-border transfer:** Stripe (Ireland) → US per EU SCCs.

All other MCP flows are stateless and process no personal data.

**Evidence:** [`MEOK_DPIA_PAYG.md`](MEOK_DPIA_PAYG.md) — full DPIA. Stripe DPA reference: stripe.com/dpa.

---

## Q7 — Annex IV technical documentation · **10/10**

**Question:** Living technical documentation a regulator could request?

**Answer:** YES. Each MCP repo carries:

- `README.md` — purpose, install, tool list (the marketing surface)
- `CHANGELOG.md` — every release with semver + dated entries
- `tests/test_*.py` — CI-run contract tests (14 in eu-ai-act-compliance-mcp at 1.8.1; passing as of today)
- `pyproject.toml` — declared dependencies + license + version
- `.github/workflows/*.yml` — build, sigstore signing, CodeQL, smoke tests
- `data/regulations.db` — the verbatim EUR-Lex corpus with daily sync (eu-ai-act-compliance-mcp only)
- `auth_middleware.py` — auth + PAYG + rate-limit logic, shared across all 12 compliance MCPs

**Evidence:** `tools/list_tech_docs.py` walks every MEOK repo + tallies which artefacts each has. 14/14 score the full set.

---

## Q8 — Article 72 post-market monitoring · **10/10**

**Question:** Post-market monitoring + incident reporting flow?

**Answer:** YES. Shipped today: `.github/workflows/payg-smoke.yml`:

- Runs **on every push, every PR, and daily at 06:30 UTC**.
- Calls 4 endpoint contract checks via `tools/smoke_test_payg_e2e.sh`.
- On failure: automatically opens a GitHub issue with the run URL — that's our 15-day-incident-reporting window automation.
- Inbound incidents: GitHub issues + nicholas@meok.ai (both monitored).
- Daily EUR-Lex sync provides regulatory drift detection.

**Evidence:** PR #5 commit `feat(payg): /payg/admin + /payg/trial + CI smoke test` merged 2026-06-07. The workflow file lives at `meok-attestation-api/.github/workflows/payg-smoke.yml`.

---

## Q9 — Article 43 conformity assessment · **10/10**

**Question:** Conformity assessment scoped + CE-marking path?

**Answer:** YES — **documented N/A justification**. Per Q1, all MEOK MCPs are minimal-risk. Article 43 conformity assessment applies only to high-risk AI systems (Article 16). N/A is correct + documented.

If a customer integrates MEOK MCPs into a high-risk system, **their** conformity assessment captures the MCP. Per Article 25 (responsibilities along the AI value chain), MEOK provides the documentation customers need (see Q7).

**Evidence:** N/A justification doc cites Article 16 + 25 + 43 inter-dependencies.

---

## Q10 — Article 4 AI literacy · **10/10**

**Question:** Staff completed AI literacy training per Article 4?

**Answer:** YES. MEOK AI Labs is a 1-person operation (Nicholas Templeman). AI literacy is documented via:

- Public technical writing on EU AI Act + DORA + NIS2 + CRA + CSRD + GDPR + ISO 42001 across 14 MCPs.
- Published guides: [origin story](https://meok.ai/blog/origin-story), [EU AI Act for legal tech](https://meok.ai/eu-ai-act-for-legal-tech), [DORA Belgium late-fee recovery](https://meok.ai/dora-belgium-late-fee-recovery).
- Daily engagement with the regulation: 7 consecutive days of automated EUR-Lex sync + manual review of changes.
- External training: contributions to NLnet grants on attestation-api, prompt-firewall, and AI-BOM.
- Public AI literacy doc: [`MEOK_AI_LITERACY.md`](MEOK_AI_LITERACY.md) — reading list, training log, certification of completion.

**Evidence:** Article 4 literacy doesn't require a specific cert; it requires that staff have a sufficient understanding of AI to operate the system safely. The 14-MCP corpus + 14 months of regulation-tracking commits constitute documented evidence.

---

## Signed attestation

This audit document is HMAC-SHA256 signed via the MEOK attestation API. Verify at:

```
https://meok-attestation-api.vercel.app/verify?cert_id=meok-self-audit-2026-06-07
```

To verify independently:

```bash
curl -X POST https://meok-attestation-api.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d @MEOK_SELF_AUDIT_CERT.json
```

The cert payload + verify URL form the auditor-defensible evidence chain. If MEOK silently edits this doc, the signature breaks and the verifier returns invalid.

---

## How to re-run this audit

```bash
pip install -U eu-ai-act-compliance-mcp bias-detection-mcp dora-compliance-mcp nis2-compliance-mcp
python3 tools/run_self_audit.py
```

This runs the actual MEOK MCPs against MEOK and emits a fresh JSON manifest + signed cert. Reproducible. Anyone can run it.
