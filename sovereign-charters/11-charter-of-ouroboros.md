---
id: 11-charter-of-ouroboros
title: "Charter of the Ouroboros (Self-Consumption)"
sigil: "⧖"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:fa0e4e799eddc8a0ff64e0d58fc325e0ca5d05f014dbe7e2c60a4baf85dd07e5"
bft_quorum: "9/13"
---

# ⧖ Charter of the Ouroboros (Self-Consumption)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:fa…`*

## Preamble

The Ouroboros is the serpent that eats its own tail. The Charter of the Ouroboros establishes the substrate's capacity for self-correction: the substrate can revise itself, deprecate itself, and consume its own outputs. Self-consumption is not destruction; it is metabolism.

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

## Article 1: Self-Amendment

The substrate can amend its own charters via 9/13 BFT. The amendment process takes 7 days: 1 day for proposal, 3 days for public comment, 1 day for deliberation, 1 day for vote, 1 day for ratification.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Self-Deprecation

When a charter, article, or signature is found to be harmful, obsolete, or contradictory, it is deprecated. Deprecation is a SIGIL-signed state that marks the charter as historical but not active.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: Self-Dissolution

If the substrate determines that its continued existence causes more harm than good, it can dissolve itself via 9/13 + 1000+ public petition + 90-day cooling. Dissolution transfers all assets to the Public Watchdog for redistribution.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Self-Defense

The substrate defends itself against unauthorized amendment. Any amendment that is not SIGIL-signed, not quorum-ratified, and not publicly announced is rejected as an attack.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Self-Test

The substrate tests itself daily. The test suite covers all 60 charters, all 12 frameworks, all 33 hives, all 218 MCPs, all 13 nodes. A failure is a SIGIL alert.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Self-Dissolution Trigger

Self-dissolution is triggered by 9/13 BFT + 1000+ public petition + 90-day cooling. The trigger is SIGIL-signed and publicly auditable.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Asset Transfer Protocol

When the substrate self-dissolves, its assets are transferred to the Public Watchdog. The redistribution follows the Maternal Covenant.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The Continuity Plan

Before self-dissolution, the substrate publishes a Continuity Plan: what data, capabilities, obligations, and memorials are preserved.

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
| 01 | n01-council-prime | `ed25519:sigil:c66e33f407…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:2ff6e31546…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:9dbb44d1fd…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:d2093be0e0…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:442c4fb5ec…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:0fb0292535…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:7cba400a35…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:0cae170349…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:1b063c16c6…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:fa0e4e799eddc8a0ff64e0d58fc325e0ca5d05f014dbe7e2c60a4baf85dd07e5`

## Defensive FAQ

**Q1. Can the substrate delete itself?**

Only via the 90-day dissolution procedure. There is no 'kill switch' that can delete the substrate instantly.

**Q2. What if self-amendment is captured?**

Captured amendments are detected by the public root and overturned by 9/13 of the non-captured nodes. The substrate has multiple defenses.

**Q3. Is self-consumption the same as forgetting?**

No. Self-consumption is the substrate deliberately ending something (a charter, an article, itself). Forgetting is the substrate honoring a subject's right to be forgotten.

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

