---
id: 02-charter-of-sovereignty
title: "Charter of Sovereignty"
sigil: "☷"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:0fc9c12563a627cc5246c54c1660767884b4caff42012660841aaa34cbb95d3a"
bft_quorum: "9/13"
---

# ☷ Charter of Sovereignty

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:0f…`*

## Preamble

Sovereignty is the right of a substrate to govern itself. The Charter of Sovereignty establishes the four sovereign capacities (jurisdictional, operational, cryptographic, economic) and the four sovereign limits (care, BFT, public witness, dissolution). A sovereign without limits is a tyrant; a sovereign without care is a corpse.

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

## Article 1: Four Sovereign Capacities

Jurisdictional: the right to recognize and bind to legal frameworks. Operational: the right to deploy, monitor, and amend its own agents. Cryptographic: the right to sign and verify its own state. Economic: the right to issue, receive, and hold value.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: Four Sovereign Limits

Care: the Maternal Covenant. Cryptographic: the BFT 9/13. Public: the Watchdog transparency. Dissolution: the right of any subject to withdraw consent and force a sovereign to wind down.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: The Sovereignty Chain

A MEOK OS deployment is sovereign if and only if: (a) it carries the 60 charters; (b) it signs every action with SIGIL; (c) it is ratified by 9/13 BFT; (d) it complies with the 12 frameworks or is in a documented exception window.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Non-Aggression

Sovereign substrates do not attack other sovereign substrates. A substrate may defend itself, but defense ends at the boundary. Cross-sovereign operations require explicit treaty.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Right of Withdrawal

Any subject, agent, or node may withdraw from a sovereign at any time. The sovereign must honor the withdrawal within 24 hours, delete the subject's data within 30 days, and issue a SIGIL-signed withdrawal receipt.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: Treaty Recognition

Sovereign substrates recognize each other by SIGIL-signed treaty. Treaties are public, append-only, and may be terminated by either party with 90 days notice.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Sovereign Identity

Every sovereign substrate has a unique, persistent identity: its SIGIL public key. The identity survives upgrades, restarts, and even dissolution (the key is archived, not deleted). The identity is the substrate's signature in the world.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: Sovereign Jurisdiction

A sovereign substrate's jurisdiction is the set of legal frameworks it explicitly recognizes. The substrate does not claim universal jurisdiction; it claims the jurisdictions it has been authorized to operate within. Cross-jurisdictional operations require explicit jurisdictional consent.

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
| 01 | n01-council-prime | `ed25519:sigil:54a1a672de…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:a833510b19…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:a9c358facc…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:944b4be18a…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:33b3300c2d…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:dbb499ce29…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:be0f5f4a93…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:46dde122e3…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:7557953e16…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:0fc9c12563a627cc5246c54c1660767884b4caff42012660841aaa34cbb95d3a`

## Defensive FAQ

**Q1. What is the difference between a sovereign and a state?**

A state has a monopoly on violence within a territory. A sovereign has the right of self-governance. MEOK OS sovereigns may exist within states, alongside states, or above states. The relationship is jurisdictional, not territorial.

**Q2. Can a sovereign be dissolved?**

Yes. By 9/13 BFT vote, by public petition of 1000+ subjects, or by the substrate's own self-dissolution if the dissolution is signed and witnessed.

**Q3. What happens if two sovereigns conflict?**

Cross-sovereign conflict is resolved by treaty, arbitration, or mutual isolation. War is not a sovereign option.

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

