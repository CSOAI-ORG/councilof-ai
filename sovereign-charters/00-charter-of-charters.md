---
id: 00-charter-of-charters
title: "Charter of Charters (The Meta-Charter)"
sigil: "✶"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:276bfb896ad7dfe37845dc5498da119bf889f2526ce719b6eeab798f043f9768"
bft_quorum: "9/13"
---

# ✶ Charter of Charters (The Meta-Charter)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:27…`*

## Preamble

The Charter of Charters is the meta-instrument from which all other sovereign charters derive their authority. It defines the SIGIL cryptographic chain that binds every charter, the BFT 9/13 quorum that ratifies every article, and the Maternal Covenant that no article may violate. No charter may contradict this charter. No article may contradict the Maternal Covenant. No signature may be forged, replayed, or backdated. This charter is the seal of the sovereign substrate — the one document every MEOK OS node carries on first boot.

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

## Article 1: Supremacy of Care

The Maternal Covenant precedes every article. No charter, framework, vertical, or override may authorize harm to a vulnerable subject, a child, an elder, or a future generation. Care is the floor; sovereignty is the ceiling.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: SIGIL Cryptographic Chain

Every charter, every article, every amendment is bound by an Ed25519 SIGIL signature. The chain is append-only, content-addressed, and publicly verifiable. Tampering with a SIGIL voids the charter and triggers a Watch Veto.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: BFT 9/13 Quorum

Ratification of any charter requires 9 of 13 sovereign nodes to sign within a 24-hour window. No node has veto power alone; 5 nodes acting in concert may invoke a VETO but cannot unilaterally amend.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Cascade Inheritance

Charters inherit from parents: a vertical charter (Tier 3) inherits its technical substrate (Tier 2) inherits its governance principles (Tier 1). An amendment to a parent propagates automatically to all children unless explicitly disowned by a 9/13 vote.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: The 52 Articles

There are 52 numbered articles across all 60 charters. Article 0 is the Maternal Covenant. Articles 1–10 are governance. Articles 11–20 are cryptographic. Articles 21–30 are operational. Articles 31–40 are sectoral. Articles 41–52 are ratification, defense, and dissolution.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The 12 Frameworks

The 12 external frameworks (EU AI Act, GDPR, DORA, NIS2, CRA, NIST AI RMF, ISO 42001, ISO 27001, IEEE 7000, SOC 2, HIPAA, PCI DSS) are mapped onto the 52 articles via the Compliance Crosswalk. Every MEOK OS deployment must demonstrate compliance or be in a documented exception window.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: Defensive Posture

Any charter, article, signature, or vote that fails its own self-test is null and void. The first duty of every node is to verify, not to comply.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The Three Vetoes

Three vetoes exist: Care Veto (Maternal), Watch Veto (Council), and Sovereign Veto (Jurisdictional). A Care Veto is final. A Watch Veto may be overridden by 11/13. A Sovereign Veto requires jurisdictional arbitration.

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
| 01 | n01-council-prime | `ed25519:sigil:8431ecbcdf…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:f1886349fc…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:90bcec4afe…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:81ccea7ff0…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:f4292a0715…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:4f999d20a9…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:d838053ba8…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:dd58d5732b…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:90f6771bd6…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:276bfb896ad7dfe37845dc5498da119bf889f2526ce719b6eeab798f043f9768`

## Defensive FAQ

**Q1. Who can amend this charter?**

Only a 11/13 BFT supermajority, with the Maternal Covenant holder concurring. No Care Veto may ever be overridden.

**Q2. What happens if a node goes offline?**

A node absence is not a veto. Quorum requires 9 affirmative signatures, not 9 minus absences. The substrate continues with degraded BFT until the node returns.

**Q3. Is this charter legally binding?**

It is binding on MEOK OS deployments. Whether it is binding on sovereign states is a matter of jurisdictional law, not sovereign claim.

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

