# OUTREACH PACK — 2026-10-01 (DRAFTS ONLY)

**Status:** DRAFTS ONLY — nothing sent, submitted, filed or posted.
**Issuer:** CSOAI Ltd (GB, Companies House 16939677)
**Contact for send:** nicholas@csoai.org (owner sends via PrivateEmail webmail)
**Doctrine:** Measurement, not certification. Never sell a score, rank, grade or certificate.
**Canonical:** https://councilof.ai · API /api/gspc · MCP https://councilof.ai/mcp · methodology https://councilof.ai/methodology/

## Live metrics (verified 2026-10-01 before drafting)

| Fact | Value | Source |
|---|---|---|
| Axes measured | **23** (`totals.measured_axes` = 23; `public_count` = "23 axes · 23 measured") | `GET https://councilof.ai/api/gspc` |
| MCP tools | **14 free** at `/mcp/free`; **19** at `/mcp` (14 free + 5 metered) | `GET https://councilof.ai/mcp` |
| Separation (model-comparison) | 0 separated · 7 TIE · 7 UNTESTED (14 model-comparison axes) | `totals.separation_public_count` |
| Zenodo DOI | **UNAVAILABLE** since 2026-09-29 (account blocked; appeal pending). Live alternative: methodology page (not deposit bytes) | `doi_status` / `doi_alternative` |
| Digital Catapult short link | `digicat.org.uk/4wML8b2` HTTP 200 → Applied AI Growth Programme `#register-your-interest`. AI Testbed track still open: **[VERIFY]** | curl -sSI 2026-10-01 |

**Superseded:** any earlier “13 MCP tools” figure. Do not use 13. Use live door counts.

## Honest boundaries (carry in every draft)

- Measurement, not certification — never sell or imply a score, rank, grade or certificate.
- Listing ≠ adoption · payment test ≠ revenue · signed ≠ admitted.
- A measurement is not a separated leader; TIE is TIE; UNTESTED is not a tie.
- Zenodo DOI currently UNAVAILABLE; cite the live methodology page, not the deposit’s bytes.
- Charter Article 0: fee-for-service only — never equity, board seats, revenue-share or success fees.
- Never name banned persons or internal codenames in any public output (owner-held do-not-mention list).
- No hype superlatives; if a self-scored rubric label is quoted, disclose that it is self-scored.

---

## Pack synopsis (five lines)

1. AI labs / AISI-style design partners for independent measurement (not certification) — offer, need, NOT, honest early revenue.
2. Digital Catapult interest note with [VERIFY] on AI Testbed openness and a live short-link check before send.
3. Standards contribution angle (NIST AI RMF COI; ISO/IEC 42005/42001) as field measurement evidence, not conformity.
4. Owner claim-and-correct checklist for Glama / mcp.so / Smithery / MCP Registry — corrections only, not spam resubmit.
5. Enterprise finance (banks, payments, stablecoin issuers) fee-for-service measurement offer under Charter Article 0; press one-pager with verified subject and proof commands.

---

## Files

| # | File | Audience | Pattern |
|---|---|---|---|
| 01 | `docs/outreach/drafts/01-design-partner-ai-labs.md` | Anthropic / OpenAI / Google DeepMind / AISI-style | design partner |
| 02 | `docs/outreach/drafts/02-uk-digital-catapult.md` | Digital Catapult | design partner + programme interest |
| 03 | `docs/outreach/drafts/03-standards-bodies.md` | NIST AI RMF COI; ISO/IEC 42005/42001 contributors | contribution |
| 04 | `docs/outreach/drafts/04-directory-claims.md` | Glama / mcp.so / Smithery / MCP Registry | owner checklist |
| 05 | `docs/outreach/drafts/05-enterprise-finance.md` | Banks / payments / stablecoin issuers | design partner |
| 06 | `docs/outreach/drafts/06-press-onepager.md` | Journalists / editors | editorial |

---

## Full drafts

### 01 — Design partners (AI labs / AISI-style evaluators)

**Subject:** Design partnership on independent measurement (not certification) — GSPC board

Hello,

We are CSOAI Ltd (UK). We publish GSPC — a Governance · Safety · Provenance · Continuity measurement board. Measurement, not certification: we publish observed rows and states (MEASURED, TIE, UNTESTED, UNCHECKABLE); we never sell a score, rank, grade or certificate.

**What we offer.** A live, API-readable board: 23 axes measured, derived counts, and an MCP surface so your tooling can re-check rather than trust. Methodology is public.

**What we need.** Design partners who will pressure-test axis definitions, grading contracts and reproducibility with us — labs, national evaluators, and AISI-style bodies that already treat evidence over badges.

**What this is not.** Not a certificate, not a leaderboard win, not an endorsement of any model or lab. A measurement is not a pass mark.

**Revenue state (honest).** Early. Fee-for-service only where engaged; no equity, board seats, revenue-share or success fees (Charter Article 0). Happy to start with a scoped measurement walkthrough.

Nicholas Templeman — nicholas@csoai.org

```bash
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, measured_axes: .totals.measured_axes, lid: .totals.lid}'
curl -sS https://councilof.ai/mcp | jq '{tool_counts, doctrine, board}'
curl -sS -o /dev/null -w "%{http_code}\n" https://councilof.ai/methodology/
```

Caveats: measurement not certification; 23 is live-derived (re-run before send); TIE/UNTESTED published as-is; Zenodo DOI UNAVAILABLE (appeal pending) → methodology page; listing ≠ adoption; payment test ≠ revenue; signed ≠ admitted.

---

### 02 — UK Digital Catapult

**Subject:** Measurement partner interest — GSPC board (CSOAI Ltd) and Digital Catapult AI Testbed [VERIFY programme name]

Hello Digital Catapult team,

We are CSOAI Ltd (UK, Companies House 16939677). We publish GSPC — a Governance · Safety · Provenance · Continuity measurement board. Measurement, not certification: we publish observed rows and states; we never sell a score, rank, grade or certificate.

**What we offer.** An independent measurement layer UK programmes can re-check: 23 axes measured on a live board, public methodology, and an MCP surface for machine-readable verification.

**What we need.** A conversation about design-partner or testbed fit — especially where Digital Catapult wants third parties to measure AI systems against governance, provenance and continuity criteria without certifying them.

**What this is not.** Not a certificate, not a claim of Catapult endorsement, not a product badge.

**Revenue state (honest).** Early. Fee-for-service only if scoped; never equity, board seats, revenue-share or success fees (Charter Article 0).

We understand programme intakes change; if AI Testbed interest is closed, a pointer to the right open call is enough.

Nicholas Templeman — nicholas@csoai.org

```bash
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, measured_axes: .totals.measured_axes}'
curl -sS https://councilof.ai/mcp | jq '{tool_counts, doctrine}'
curl -sSI https://digicat.org.uk/4wML8b2 | head -n 20
```

Caveats: **[VERIFY]** AI Testbed openness and programme name at send time (short link currently lands on Applied AI Growth Programme register-interest); do not claim Catapult endorsement; other boundaries as in 01.

---

### 03 — Standards bodies (NIST AI RMF · ISO/IEC 42005/42001)

**Subject:** Measurement contribution — GSPC operational evidence for NIST AI RMF and ISO/IEC 42005/42001 work

Hello,

We are CSOAI Ltd (UK). We publish GSPC — a live Governance · Safety · Provenance · Continuity measurement board. Measurement, not certification: we report what we observed (including UNCHECKABLE and UNTESTED); we never sell a score, rank, grade or certificate.

**What we offer.** Operational measurement artefacts relevant to AI RMF measure/manage practice and to ISO/IEC 42005 (AI system impact assessment) and ISO/IEC 42001 (AI management systems): axis definitions, deterministic grading contracts, signed run cards, and a public API others can re-derive.

**What we need.** Interest from community-of-interest and standards contributors who want field evidence of how measurement, impact-assessment and management-system controls behave in production — not a vendor pitch.

**What this is not.** Not a claim of conformity, not ISO/NIST endorsement, not a certificate scheme.

**Revenue state (honest).** Early. Fee-for-service only if engaged. Charter Article 0: never equity, board seats, revenue-share or success fees.

Nicholas Templeman — nicholas@csoai.org

```bash
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, measured_axes: .totals.measured_axes, lid: .totals.lid}'
curl -sS https://councilof.ai/mcp | jq '{tool_counts, doctrine}'
curl -sS -o /dev/null -w "%{http_code}\n" https://councilof.ai/methodology/
```

Caveats: standards participation ≠ adoption or endorsement; no NIST/ISO affiliation implied beyond ordinary contribution/COI interest; Zenodo DOI UNAVAILABLE → methodology page; other boundaries as in 01.

---

### 04 — Directory claim + correct checklist

**Subject (support email):** Claim/correct request — csoai-gspc-mcp listing accuracy (not a resubmission)

Hello,

We are CSOAI Ltd (UK, Companies House 16939677), maintainers of the public GSPC measurement board and the `csoai-gspc-mcp` server. Measurement, not certification: the catalogue and verification stay free; we never sell a score, rank, grade or certificate.

**What we need.** Owner-controlled claim of our existing listing(s), then factual corrections only — canonical https://councilof.ai/mcp, free door /mcp/free, board API /api/gspc, methodology /methodology/. No promotional resubmit, ranking boost or badge.

**What this is not.** Not a spam resubmit, not a certification claim, not a request to endorse CSOAI.

**Revenue state (honest).** Early; fee-for-service only where scoped (Charter Article 0).

Happy to prove endpoint control from the server response.

Nicholas Templeman — nicholas@csoai.org

**Owner checklist (once per directory; no bulk spam):** (1) Glama claim → correct → stop. (2) mcp.so same. (3) Smithery same (note anonymous caps). (4) MCP Registry same (prefer `evidence/mcp-registry.json` over marketing copy). (5) Re-fetch listing, log the verified line; no second wave without owner decision.

```bash
curl -sS https://councilof.ai/mcp | jq '{ok, server_info, tool_counts, doctrine, install}'
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, issuer}'
```

Caveats: listing ≠ adoption; tool counts from live door (14 free / 19 with metered — not 13); correct any certificate/grade/trust-mark implication; Zenodo DOI UNAVAILABLE → methodology page; payment test ≠ revenue; signed ≠ admitted.

---

### 05 — Enterprise finance (banks · payments · stablecoin issuers)

**Subject:** Independent measurement offer for AI and provenance controls (fee-for-service only)

Hello,

We are CSOAI Ltd (UK). We publish GSPC — a Governance · Safety · Provenance · Continuity measurement board. Measurement, not certification: we publish observed rows and states; we never sell a score, rank, grade or certificate.

**What we offer.** Independent, re-checkable measurement of AI and provenance-relevant controls — including deterministic fact runs (issuer-account and public-series style checks) alongside behavioural axes. Outputs are API-readable so risk, audit and engineering teams can verify without trusting us.

**What we need.** Banks, payments firms and stablecoin issuers willing to define a narrow measurement scope with us (for example provenance-controls or reserve-disclosure fact runs) and accept published methodology.

**What this is not.** Not a certificate, not a regulatory opinion, not an audit substitute, not a “trust badge.”

**Revenue state (honest).** Fee-for-service only. Charter Article 0 forbids equity, board seats, revenue-share and success fees. We do not take payment for a better measurement.

Nicholas Templeman — nicholas@csoai.org

```bash
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, measured_axes: .totals.measured_axes, by_family: .totals.by_family.financial}'
curl -sS https://councilof.ai/mcp | jq '{tool_counts, doctrine}'
curl -sS -o /dev/null -w "%{http_code}\n" https://councilof.ai/methodology/
```

Caveats: financial axes are deterministic facts — measured ≠ scored (no leader/accuracy); payment test ≠ revenue; not an audit or regulatory clearance; Zenodo DOI UNAVAILABLE → methodology page; listing ≠ adoption; signed ≠ admitted.

---

### 06 — Press one-pager

**Subject (verified live 2026-10-01):** What GSPC measures — 23 axes, live board, “measurement, not certification” (CSOAI Ltd)

Hello,

GSPC (Governance · Safety · Provenance · Continuity) is a live measurement board from CSOAI Ltd (UK, Companies House 16939677). It measures AI systems and publishes the rows — including TIE and UNTESTED — rather than awarding marks. **Measurement, not certification:** we never sell a score, rank, grade or certificate.

**One public artefact:** https://councilof.ai/api/gspc — currently `23 axes · 23 measured` (live-derived). Separation is reported honestly: model-comparison axes may be SEPARATED, TIE or UNTESTED; a measurement is not a leaderboard win.

Also live: methodology https://councilof.ai/methodology/ and MCP https://councilof.ai/mcp for machine-readable checks.

**Honest boundaries.** Listing ≠ adoption. Payment test ≠ revenue. Signed ≠ admitted. The Zenodo DOI is currently UNAVAILABLE (account blocked; appeal pending) — the live methodology page stands in and is not the deposit’s bytes.

Happy to demonstrate the proof commands on a call.

Nicholas Templeman — nicholas@csoai.org

```bash
curl -sS https://councilof.ai/api/gspc | jq '{public_count: .totals.public_count, measured_axes: .totals.measured_axes, separation_public_count: .totals.separation_public_count, lid: .totals.lid, doi_status: .doi_status}'
curl -sS https://councilof.ai/mcp | jq '{tool_counts, doctrine, board}'
curl -sS -o /dev/null -w "%{http_code}\n" https://councilof.ai/methodology/
```

Caveats: re-verify subject-line count before send; no hype superlatives (self-scored rubric labels only if disclosed as self-scored); not a certificate/grade/endorsement; Zenodo DOI UNAVAILABLE since 2026-09-29; listing ≠ adoption; payment test ≠ revenue; signed ≠ admitted.

---

## Send discipline

- **OWNER SENDS** only — nicholas@csoai.org via PrivateEmail webmail.
- This pack is draft-only: no email sent, no form submitted, no public post.
- Before any send: re-run proof commands; if counts moved, edit the draft to match the live API.
- Never name banned persons or internal codenames (owner-held do-not-mention list).

---
OWNER SENDS — consolidated pack 2026-10-01 — DRAFT ONLY.
