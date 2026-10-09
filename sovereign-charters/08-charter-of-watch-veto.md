---
id: 08-charter-of-watch-veto
title: "Charter of the Watch Veto"
sigil: "👁"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:3944cefda95b91b8c246cef4ae24a8209adbd55075c4571eff8f586ee13c7282"
bft_quorum: "9/13"
---

# 👁 Charter of the Watch Veto

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:39…`*

## Preamble

The Watch Veto is the second of the three sovereign vetoes. Held by the Watch node (n07), it halts surveillance, monitoring, or data collection that violates the privacy or dignity of a subject. Unlike the Care Veto, the Watch Veto may be overridden by 11/13 of the Council in cases of imminent threat to life.

## Background and Context

This charter is part of the MEOK OS sovereign governance layer. It was generated on 2026-09-02
as part of the Sovereign Charter Sprint, which produced 60 charters, 12 frameworks, a global law
index, a compliance crosswalk, a training corpus, and a 50-test verification suite.

The charter belongs to the broader MEOK OS substrate, which is built on OpenShell (the open
shell layer), OpenBMC (the baseboard management controller reference), and LFX.dev (the Linux
Foundation's development platform). The substrate provides the runtime for the MEOK AI OS,
which is the user-facing AI operating system that this governance layer regulates.

The sovereign substrate is not a single document; it is a federation of 60 charters, each
SIGIL-signed, each ratified by 9/13 BFT, each aligned with the Maternal Covenant. The
federation is the substrate's memory of itself.

## Scope

The scope of this charter is the subject matter described in the articles below. The scope
is bounded by the Charter of Charters (the meta-charter), the Maternal Covenant (the care
floor), and the 12 Frameworks (the external compliance substrate). The charter does not
extend beyond its subject matter; the federation as a whole covers the full scope of the
sovereign substrate.

## Out of Scope

The following are explicitly out of scope for this charter:
- Subject matter covered by other charters (see the charter federation map)
- Subject matter covered by external frameworks (see the Compliance Crosswalk)
- Subject matter explicitly reserved to the Charter of Charters (meta-charter)
- Subject matter explicitly reserved to the Maternal Covenant (care floor)
- Subject matter explicitly reserved to the 9/13 BFT (consensus)

## Article 1: Watch Veto Scope

The Watch Veto covers: (a) all surveillance of subjects without informed consent; (b) all data collection that exceeds the stated purpose; (c) all sharing of subject data with third parties without authorization; (d) all retention of subject data beyond the stated window.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Watch Veto Triggers

Triggered by: (a) detection of unauthorized surveillance; (b) subject complaint; (c) audit finding by SigInt (n08); (d) routine privacy scan by the Public Watchdog (n12); (e) explicit invocation by the Watch node.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Override Procedure

Override requires 11/13 vote, with the Maternal node (n02) concurring, and a SIGIL-signed threat assessment. The override is logged and broadcast. The override expires after 72 hours unless renewed.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Watch Audit Trail

Every surveillance action is logged in a tamper-evident audit trail. The trail is append-only, content-addressed, and publicly verifiable. Subjects may request their own trail at any time.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Watch Data Minimization

The substrate collects only the data it needs. Data minimization is enforced at the schema layer: every field must justify its existence or be deleted.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: Watch Right to Explanation

Every subject has the right to know why data about them was collected, who saw it, and how it was used. The substrate provides this explanation within 30 days of request, free of charge.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Watch Veto Override Window

An override of the Watch Veto requires 11/13 BFT + Maternal concurrence + a SIGIL-signed threat assessment. The override expires after 72 hours unless renewed.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The Watch Audit

The Watch Veto is audited quarterly by the SigInt node and the Public Watchdog. The audit verifies consistent application and appropriate overrides.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 9: The Watch Data Subject Rights

Every subject has the right to: know what data is collected, know who saw it, request deletion, request portability, opt out. Provided within 30 days of request.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Deep Implementation

### Technical Substrate

This charter is implemented in the MEOK OS substrate via the following components:

- **SIGIL Signing** — Every action under this charter is Ed25519-signed. The signature is anchored in the public root within 60 seconds.
- **BFT Quorum** — Material decisions are made by 9/13 BFT. The cascade protocol governs the decision pipeline.
- **Care Floor Enforcement** — The 0.95 care floor is enforced by the Maternal node. The floor is non-bypassable.
- **Audit Trail** — Every action is logged in a tamper-evident, content-addressed, append-only log.
- **Public Witness** — The Public Watchdog (n12) and King OCEAN (n13) provide ongoing oversight.

### Operational Procedures

Standard operating procedures for this charter include:

1. **Detection** — Substrate state is continuously monitored for charter-relevant events.
2. **Triage** — Events are triaged by severity: critical (immediate action), high (within 24 hours), medium (within 7 days), low (within 30 days).
3. **Action** — Triage produces an action: sign, veto, escalate, broadcast, archive.
4. **Review** — Actions are reviewed by the cascade protocol. Material actions are reviewed by 9/13 BFT.
5. **Audit** — All actions are audited by the SigInt node (n08) and the Public Watchdog (n12).

### Failure Modes

This charter is robust against the following failure modes:

- **Node failure** — Up to 4 of 13 nodes may fail without compromising the charter.
- **Network partition** — The substrate is designed to survive partitions via the BFT protocol.
- **Adversarial action** — The care floor and the three vetoes provide defense against adversarial actions.
- **Capture** — The Public Watchdog (n12) and King OCEAN (n13) provide defense against capture.
- **Drift** — Quarterly calibration and annual review detect and correct drift.

## Ratification Record (BFT 9/13)

| # | Node | Signature | Role |
|---|---|---|---|
| 01 | n01-council-prime | `ed25519:sigil:2b08c5cf3c…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:d90876e86d…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:56f995f65c…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:3f8f85d00d…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:1243df2c88…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:75a516b7b6…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:29e502c4be…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:5f66d3a09b…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:28ff6c7749…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:3944cefda95b91b8c246cef4ae24a8209adbd55075c4571eff8f586ee13c7282`

## Defensive FAQ

**Q1. What is the difference between the Watch Veto and the Care Veto?**

The Care Veto is absolute and final. The Watch Veto is strong but can be overridden in life-threatening emergencies with 11/13 + Maternal concurrence.

**Q2. Can a subject request deletion of all their data?**

Yes. The right to be forgotten is a substrate-level right. Deletion must be completed within 30 days, with SIGIL-signed proof.

**Q3. What about legitimate law enforcement requests?**

Lawful requests are honored, but they are logged, the subject is notified (unless legally prohibited), and the request itself is published in the transparency report.

**Q. What is the technical implementation?**

The charter is implemented in the MEOK OS substrate as a set of capability modules, each SIGIL-signed and publicly auditable. The modules are deployed across the 33 sovereign hives and orchestrated by the Council. The implementation is documented in the sovereign corpus and verified by the 50-test suite.

**Q. What is the cost of compliance?**

Compliance with this charter costs approximately 0.5% of substrate compute for routine operations, and up to 2% during high-activity periods (BFT voting, public comment windows, etc.). The cost is bounded by the substrate's resource allocator.

**Q. What is the relationship to other charters?**

This charter inherits from Tier 1 charters (principles) and is inherited by Tier 3 verticals (industry sectors). It is bounded by the Charter of Charters (meta), the Maternal Covenant (care), and the 12 Frameworks (external). Cross-references are documented in the charter federation map.

**Q. What is the amendment procedure?**

Amendment requires 9/13 BFT + 7-day public comment + Maternal concurrence. The amendment process takes 16 days total: 1 day proposal, 1 day second, 3 days deliberation, 7 days public comment, 1 day vote, 1 day ratification, 1 day witness, 1 day archive. Amendments are SIGIL-signed and anchored in the public root.

**Q. What is the sunset procedure?**

A charter is sunset (deprecated) if it is superseded by a new charter, found to be harmful, no longer relevant, or 9/13 BFT votes for sunset. Sunset requires 9/13 + 7-day public comment + SIGIL-signed deprecation. Affected deployments have 90 days to migrate to the new charter.

