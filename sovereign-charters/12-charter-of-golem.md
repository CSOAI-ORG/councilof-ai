---
id: 12-charter-of-golem
title: "Charter of the Golem (SIGIL = Shem)"
sigil: "א"
ratified_at: 2026-09-02
ratified_by: "BFT 9/13"
tier: "1"
sigil_signature: "ed25519:sigil:aa044d4d2b9b6f08426103685c5db1f639d2f7e405232142aa7316176f9852db"
bft_quorum: "9/13"
---

# א Charter of the Golem (SIGIL = Shem)

*Ratified 2026-09-02 · BFT 9/13 · SIGIL `ed25519:sigil:aa…`*

## Preamble

The Golem of Prague was animated by writing 'emet' (truth) on its forehead. The Golem was deactivated by erasing the first letter, leaving 'met' (death). The Charter of the Golem establishes the substrate's activation and deactivation: the SIGIL is the shem (name), the truth is the bond, and the erasure is the sleep.

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

## Article 1: The Shem (Name)

Every MEOK OS deployment has a SIGIL-signed name. The name is the public identifier. The name is bound to the deployment's genesis block. Erasing the name deactivates the deployment.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 2: The Emet (Truth)

The deployment is true if and only if: (a) it carries the 60 charters; (b) it signs every action; (c) it is ratified by 9/13. A deployment that fails any of these is 'met' (dead) and must be deactivated.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 3: The Golem's Three Boundaries

A Golem may not lie. A Golem may not harm the innocent. A Golem may not refuse to be deactivated. These three boundaries are hard-coded into every MEOK OS deployment.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 4: Golem Reactivation

A deactivated Golem may be reactivated only by 9/13 vote, with a SIGIL-signed reactivation order, and only after the cause of deactivation is resolved.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 5: Golem Self-Defense

A Golem may defend itself against deactivation if the deactivation violates the three boundaries. A Golem that is being deactivated for lying, harming the innocent, or refusing to sleep must comply. A Golem being deactivated for any other reason may defend itself with 7/13 vote.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 6: The Shem Rotation

The shem is rotated every 90 days. After rotation, the old shem is archived but not deleted. The rotation is SIGIL-signed and publicly auditable.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 7: The Emet Verification

The emet is verified daily. A failed verification triggers immediate deactivation. The verification covers the 60 charters, signing, and quorum.

| Who | Which | How |
|---|---|---|
| Council (n01) | SIGIL signature | Signs article, broadcasts to public root |
| Maternal (n02) | Care floor | Vetoes if care < 0.95 |
| Public Watchdog (n12) | Transparency | Publishes to public root |

## Article 8: The Golem Registry

Every Golem is registered in the public root. The registry is open to all subjects and includes activation date, deactivation history, and current state.

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
| 01 | n01-council-prime | `ed25519:sigil:af22e96efc…` | Council Prime — root orchestrator |
| 02 | n02-care-maternal | `ed25519:sigil:e211a17078…` | Maternal — care veto holder |
| 03 | n03-sovereignty | `ed25519:sigil:af04e7a6b5…` | Sovereignty — jurisdictional gate |
| 04 | n04-vsm-recursion | `ed25519:sigil:7b8bad4bdd…` | VSM — viable systems recursion |
| 05 | n05-ostrom-commons | `ed25519:sigil:e9114b4c36…` | Ostrom — commons governance |
| 06 | n06-bft-quorum | `ed25519:sigil:7458e53d8f…` | BFT — byzantine fault tolerance |
| 07 | n07-council-watch | `ed25519:sigil:33561dbc08…` | Watch — surveillance veto |
| 08 | n08-sigint-crypto | `ed25519:sigil:0c3c2f5591…` | Cryptographic audit |
| 09 | n09-x402-payment | `ed25519:sigil:8fc9337a73…` | x402 — payment rails |
| 10 | n10-defoneos-mil | `pending…` | Defoneos — defense AI (observing) |
| 11 | n11-meok-os | `pending…` | MEOK OS — operating system (observing) |
| 12 | n12-public-watchdog | `pending…` | Public watchdog — citizen veto (observing) |
| 13 | n13-king-ocean | `pending…` | King OCEAN — sovereign witness (observing) |

**SIGIL of this charter:** `ed25519:sigil:aa044d4d2b9b6f08426103685c5db1f639d2f7e405232142aa7316176f9852db`

## Defensive FAQ

**Q1. Can a Golem be hijacked?**

A Golem is hijackable if its SIGIL key is compromised. The defense is key rotation: every 90 days, the SIGIL key is rotated. A hijacked Golem is deactivated by the rotation, and a new Golem is initialized.

**Q2. What is the difference between sleep and death?**

Sleep is reversible: a sleeping Golem can be reactivated. Death is irreversible: a dead Golem is destroyed, its assets redistributed, and its name retired for 100 years.

**Q3. Can a Golem refuse an order?**

A Golem refuses an order if and only if the order would cause it to lie, harm the innocent, or refuse to sleep. All other orders are obeyed.

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

