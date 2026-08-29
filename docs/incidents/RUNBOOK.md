# CRA Art. 14 incident / exploited-vuln runbook

CSOAI Ltd (UK 16939677). Products with digital elements that we place on the
EU market. Regulation (EU) 2024/2847, Article 14.

**This is an internal operating procedure. It is not legal advice, not a
conformity assessment, not a certificate, and not a GSPC measurement.**

Reporting clocks apply from **11 September 2026**. Internal target for this
file: **1 September 2026**. Full CRA product obligations: **11 December 2027**.

The ENISA Single Reporting Platform is scheduled to be operational by
11 September 2026. Until it is live, follow this runbook internally and do
not invent a filing channel.

## Clocks (from awareness)

| Clock | Window | What |
|---|---|---|
| Early warning | 24 hours of becoming aware | Actively exploited vulnerability **or** severe incident affecting product security. For incidents: whether suspected unlawful/malicious. Member States where the product is known to have been made available, if known. |
| Notification | 72 hours of becoming aware | Nature of vuln/exploit or incident; initial assessment; corrective/mitigating measures taken and those users can take. |
| Final — vulnerability | 14 days after a corrective or mitigating measure is available | Full description, severity, impact, remediation. |
| Final — severe incident | 1 month after the 72-hour notification | Full description, severity, impact, remediation. |

Awareness is a recorded UTC timestamp on the register entry. It is **not**
reconstructed after the fact.

## Four named roles

| Role | Does | Does not |
|---|---|---|
| **Incident Lead** (duty: K3 lane) | Owns the register row, the awareness stamp, triage verdict, and the filing decision | Certify CRA compliance |
| **Engineering On-Call** | Confirms component, version, SBOM hit, exploitability, mitigations | File to ENISA without Incident Lead |
| **Counsel / Compliance** | Confirms whether Art. 14 is triggered; which CSIRT (establishment vs authorised representative vs Member State of making-available) | Invent a CSIRT |
| **Comms / Customer** | User-facing mitigations after Counsel clears | Announce “we are CRA compliant” |

Until a named rota exists, **Incident Lead = Nicholas Templeman**
(`nicholas@csoai.org`). Other seats: unassigned — say so, do not invent names.

CSOAI Ltd is a **UK** company. The Art. 14 CSIRT is the CSIRT of the Member
State of **main establishment in the Union**, or the path Counsel names for a
manufacturer without Union establishment. **CERT-UK is not automatically the
Art. 14 CSIRT.** Counsel fills that cell before any live filing.

## In-scope products (estate, 2026-08-29)

From `docs/CRA_COMPLIANCE_2026-08-25.md` — do not expand without a new note:

1. Public web app (`client/` + `functions/`) — EU users; SBOM
   `public/interop/sbom-councilof-ai.json`.
2. Verify / MCP surfaces — same tree.
3. Attestation engine (`harness/rwa-attest/`) **if/when** white-labelled into
   the EU. Today: Python stdlib only.

A measurement card, an empty GSPC cell, and a Layer-0 seal are **not** CRA
filings.

## Triage (must answer in the register)

1. Is this a **product with digital elements** we placed on the Union market?
2. Is it an **actively exploited vulnerability** in that product, **or** a
   **severe incident** affecting its security, **or** neither?
3. UTC **awareness** timestamp (ISO-8601). Who became aware, how.
4. If neither: **no Art. 14 filing**. Log `verdict: not-art14` and stop the
   CRA clocks. Other duties (key rotation, customers) may still apply.

UNMEASURED GSPC axes stay UNMEASURED. An incident does not fill a board cell.

## Sequence

### T+0 — stamp

Copy `docs/incidents/candidates/TEMPLATE.json` to
`docs/incidents/candidates/<id>.json`. Set `aware_at` immediately. That stamp
starts 24h / 72h.

### T+0–4h — Engineering

- Affected artifact, version, commit.
- SBOM: `python3 scripts/gen_sbom.py` if the tree moved.
- Known CVE / GHSA / OSV id, or `none`.
- Mitigations users can take (even “none yet”).

### T+0–24h — early warning (if Art. 14)

Incident Lead + Counsel. File via ENISA Single Reporting Platform when live;
notify the CSIRT Counsel named. Record `filings.early_warning` (time, channel,
reference). If the platform is not live: record `channel: srp-not-live` and
keep the internal row; do not fake a receipt.

### T+0–72h — notification (if Art. 14)

Update the same row. Severity, impact, IoCs if any, measures taken/advised.
Record `filings.notification`.

### Final report

- Vuln: ≤ 14 days after a corrective/mitigating measure is **available**.
- Incident: ≤ 1 month after the 72h notification.
Record `filings.final` and `closed_at`.

## Register

Canonical pattern: `docs/incidents/REGISTER.json`. One object per candidate.
`n` of UNMEASURED board axes is never written here as a score.

## Honesty

- No “passed CRA”, “certified”, “compliant”, or CE mark from this file.
- No filing to a CSIRT Counsel has not named.
- No silent edit of a closed row — append a correction object.
- Measurement, never certification.
