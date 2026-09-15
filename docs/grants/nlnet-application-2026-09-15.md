# NLnet NGI0 Application — Draft (15 September 2026)

> **Status: DRAFT — NOT SUBMITTED.**
>
> All figures cited below are live-retrievable from public endpoints or pinned to a specific file
> in the repository. Re-fetch before submitting. This pack was drafted by an AI assistant from
> live estate facts; NLnet's form requires you to disclose that and to rewrite the prose in your
> own voice. Do not paste verbatim.

---

## 1. Project Identification

| Field | Value |
|---|---|
| **Proposal title** | Council of AI — Independent Measurement Infrastructure for AI Systems |
| **Project website** | https://councilof.ai |
| **Repository** | https://github.com/CSOAI-ORG/councilof-ai |
| **DOI** | 10.5281/zenodo.21991104 |
| **Applicant** | CSOAI Ltd, company number 16939677 (UK, incorporated 2 January 2026) |
| **Fund** | NGI0 / Restack / CodeSupply (check UK eligibility before submitting) |
| **Amount requested** | EUR 75,000 |
| **Duration** | 12 months |
| **Licences** | AGPL-3.0 (repo), Apache-2.0 (published packages), CC-BY-4.0 (measurement data) |

---

## 2. Problem Statement

There is no transparent, independently verifiable infrastructure for measuring how AI systems
behave. Existing approaches fall into three categories, each with a structural gap:

1. **Commercial evaluation firms** (Vals AI, LMArena, Patronus) publish leaderboards behind
   paywalls. A researcher who cannot pay cannot verify.
2. **Academic benchmarks** (MMLU, HELM, BigBench) publish scores but not signed, independently
   recomputable evidence chains. Scores are asserted, not proven.
3. **Regulatory frameworks** (EU AI Act Article 50 transparency, NIST AI 600-1) require
   measurement evidence but provide no infrastructure for independent verification of that
   evidence.

The consequence: a regulator, researcher, or AI developer who wants to verify a measurement
claim must either trust the publisher or re-run the entire measurement — an expensive,
non-deterministic process that most stakeholders cannot afford.

Council of AI addresses this by building an open measurement infrastructure where:

- Every measurement result is a signed card (Ed25519) that anyone can verify offline.
- All cards are hashed into a Merkle tree whose root is signed and anchored to an independent
  timechain (Bitcoin via OpenTimestamps) and mirrored to Sigstore Rekor.
- Verification is free forever — no account, no payment, no CSOAI service dependency.

---

## 3. Current State (Honest Inventory)

This is not a proposal to start building. The infrastructure exists. This grant funds closing
the remaining cryptographic gaps and building the independent verifier.

### 3.1 What Is Live Today

| Artifact | Count / State | Source |
|---|---|---|
| Measurement axes | 22 axes, 22 measured, 0 unmeasured | `GET /api/gspc` → `totals.public_count` |
| Signed Ed25519 cards in the chain | 335 (313 published bodies, 22 withheld) | `public/signed/chain.json` → `length: 335` |
| Cards under the signed public Merkle root | 303 | `public/root.json` → `card_count: 303` |
| Public Merkle root | `e4cc26d16e9b6827dacdc88c0a527676831ad106151b5acff33659636c6cc03d` | `public/root.json` → `merkle_root` |
| Root.json SHA256 | `74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b` | `shasum -a 256 public/root.json` |
| Signed card index entries | 335 | `public/signed/card_index.json` |
| Public cards (sha256-named) | 1,680 | `public/cards/` directory |
| Rekor log index | 2,791,822,965 | Trust chain state: `rekor_witness.log_index` |
| OTS submission | Stamped, pending Bitcoin confirmation | Trust chain state: `ots_submission.state = STAMPED_PENDING_BITCOIN` |
| Ed25519 signing key | `d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38` | `public/signed/chain.json` → `links[0].pubkey` |
| DID | `did:web:csoai.org#board-attestation-1` | `public/root.json` → `did_intended` |
| MCP servers in official registry | 354 (353 PyPI, 1 npm) | `registry.modelcontextprotocol.io` |
| x402 payment rail | Live on Base (`eip155:8453`), USDC | `/.well-known/x402.json` |
| Revenue | $0.00 (zero external customer settlements) | `TUI-1-CANONICAL-STATE.json` → `revenue.classification = "ZERO"` |
| Corrections ledger | Active (46+ entries) | `GET /api/corrections` |
| Live feed | `https://councilof.ai/feed.xml` | Returns 200 |

### 3.2 What Is NOT Yet True (Disclosed Blockers)

| Claim state | Honest status |
|---|---|
| Bitcoin-anchored | OTS **stamped** but **not yet confirmed** in a Bitcoin block. The `.ots` proof covers a prior version of `root.json`, not the current one. |
| x402 revenue | $0.00 external. The settlement rail is live (USDC on Base) but no external customer has completed a paid settlement. Self-settlements are excluded by doctrine. |
| Recomputation harness | Does not exist. A published measurement can be verified as signed but cannot be re-executed from the card alone. |
| Multi-key independence | Every signature is one Ed25519 key under one DID. This proves custody, not independence. |

---

## 4. Proposed Work (EUR 75,000 / 12 Months)

### WP1 — OTS Root Anchoring (EUR 12,000, months 1-3)

**Goal:** Bind the current Merkle root to Bitcoin via OpenTimestamps so that a third party can
prove the root existed at or before a specific Bitcoin block.

**Deliverables:**
- CI pipeline that stamps `root.json` → `root.json.ots` on every root change
- Upgrade mechanism: PendingAttestation → confirmed Bitcoin proof (distinguish states in output)
- Published `.ots` file alongside every root version at a stable URL
- Honest status endpoint: `/api/anchor` returning `PENDING`, `CONFIRMED`, or `STALE` with block reference

**Current gap:** Our own `TUI-1-CANONICAL-STATE.json` records `ots_submission.state = "STAMPED_PENDING_BITCOIN"` and `bitcoin_confirmation.state = "NOT_YET"`. The `.ots` file at `/interop/root-2026-09-02.json.ots` covers a prior root version, not the current one. This WP makes the claim true.

### WP2 — Rekor Transparency Mirror (EUR 8,000, months 2-4)

**Goal:** Mirror each root commitment to the public Sigstore Rekor transparency log as a second
independent witness.

**Deliverables:**
- CI job posting root hash to Rekor on each root change
- Published inclusion proof (log entry UUID, logIndex, integratedTime) alongside the root
- Status merge: Rekor logIndex reported in `/api/anchor` alongside OTS state

**Current state:** One Rekor entry exists (logIndex 2,791,822,965) from an earlier submission.
This WP automates the process and makes it continuous.

### WP3 — Independent Verifier (EUR 18,000, months 3-7)

**Goal:** A CLI and library that verifies a measurement card with zero CSOAI dependency.

**Verification steps the verifier performs:**
1. Recompute the canonical leaf hash from the card's body (sha256 of canonical JSON minus `sha256` and `sig_ed25519` fields)
2. Walk the Merkle path from leaf to root (handling odd-node duplication per `tree_caveat`)
3. Check that `card_count` matches `len(card_sha256)` — rejects the CVE-2012-2459 ambiguity
4. Check Ed25519 signature against the DID document at `did:web:csoai.org`
5. Check the OTS proof against Bitcoin block headers (via public Electrum or Blockstream API)
6. Check the Rekor inclusion proof via Rekor's public API

**Output:** Three states — `VALID`, `INVALID` (with reason), `UNCHECKABLE` (when a dependency is unreachable). Never two states.

**Deliverables:**
- `csoai-verify` CLI (Node.js, zero dependencies beyond built-in crypto)
- `csoai-verify` library (importable)
- Test vector set: 10 VALID cards, 3 deliberately INVALID, 2 UNCHECKABLE
- Published on npm as `@csoai/verify`

### WP4 — Recomputation Harness (EUR 18,000, months 6-10)

**Goal:** A container that re-runs a published measurement from its card and reports whether
the recomputed result matches the signed card.

**Key design decision:** This WP separates what is **reproducible** (the card's canonical form,
the chain arithmetic, the Merkle proof) from what is only **re-observable** (a live model's
output, which is non-deterministic). The harness reports these as distinct states:

- `RECOMPUTABLE`: card bytes, signature, Merkle path, chain link — fully deterministic
- `RE-OBSERVABLE`: re-querying the same model with the same prompt — may diverge, reported honestly
- `DIVERGENT`: recomputed result does not match — triggers a correction entry

**Deliverables:**
- Docker container with published `Dockerfile`
- CLI: `csoai-recompute <card-sha256>` → RECOMPUTABLE / RE-OBSERVABLE / DIVERGENT
- Published recomputation results for a sample of 50 cards
- Integration with the corrections ledger

### WP5 — Documentation, Threat Model, and Upstreaming (EUR 12,000, months 9-12)

**Goal:** Written verification guide, an honest threat model, and upstream contributions.

**Deliverables:**
- Verification guide (how any stranger verifies a card, root, and proof chain)
- Threat model document naming what the scheme does NOT prove:
  - Single signing key (proves custody, not independence)
  - Odd-node Merkle duplication (CVE-2012-2459 class, already disclosed in `tree_caveat`)
  - Stamped ≠ anchored (PendingAttestation vs Bitcoin-confirmed)
  - Model non-determinism (re-observation may diverge)
- Upstream contributions to OTS client and Sigstore ecosystem
- Published threat model at `docs/THREAT-MODEL.md`

### WP6 — Project Management and Reporting (EUR 7,000, months 1-12)

- Quarterly progress reports to NLnet
- Community engagement (GitHub issues, public standups)
- Final report with all deliverables verified

---

## 5. Budget Summary

| WP | Description | Months | EUR |
|---|---|---|---|
| WP1 | OTS Root Anchoring | 1-3 | 12,000 |
| WP2 | Rekor Transparency Mirror | 2-4 | 8,000 |
| WP3 | Independent Verifier | 3-7 | 18,000 |
| WP4 | Recomputation Harness | 6-10 | 18,000 |
| WP5 | Documentation & Threat Model | 9-12 | 12,000 |
| WP6 | Project Management | 1-12 | 7,000 |
| **Total** | | | **75,000** |

**Rate:** Sole developer, UK, at EUR 500/day = 150 developer-days over 12 months.
**No hardware, no travel, no subcontractors.** OTS calendars, Sigstore Rekor, and Bitcoin
block headers are public infrastructure — no API keys or paid services required.

---

## 6. Comparison with Existing Efforts

| Project | Signs outputs? | Anchors to independent timeline? | Ships verifier with no issuer dependency? | Publishes corrections ledger? |
|---|---|---|---|---|
| Sigstore / Rekor | Yes (keyless) | No (single consortium log) | Partially | No |
| OpenTimestamps | No | Yes (Bitcoin) | N/A (proves bytes existed) | N/A |
| C2PA | Yes | No | No | No |
| COMPL-AI (ETH/LatticeFlow) | No | No | No | No |
| Commercial eval firms | Varies | No | No | No |
| **Council of AI** | **Yes (Ed25519)** | **In progress (OTS + Rekor)** | **This grant** | **Yes (46+ entries)** |

What is new: the combination of (a) a signed measurement card whose leaf definition binds
subject and source URL, (b) a Merkle root anchored to an independent timechain, (c) a verifier
with no dependency on the issuer, and (d) a public corrections ledger where being wrong is
recorded rather than quietly edited.

---

## 7. Technical Challenges

1. **Stamped ≠ anchored.** A fresh OTS stamp carries a PendingAttestation and becomes a proof
   only when a calendar commits it to a Bitcoin block, hours or days later. The two states must
   be published distinctly and never conflated. Our own build gates already fail on copy of the
   form "N atoms OTS-anchored" while the rail is pending.

2. **Merkle tree shape.** Our published `tree_caveat` discloses that odd-node duplication makes
   the shape collidable in the CVE-2012-2459 sense. WP3 must verify `card_count == len(card_sha256)`
   and reject any inclusion proof with `index >= card_count`. We have disclosed this openly.

3. **Single signing key.** Every signature in our estate is one Ed25519 key under one DID. The
   verifier must check that key, but the threat model must say plainly that this proves custody,
   not independence. Key rotation must not orphan historical proofs.

4. **Recomputation determinism.** Re-running a measurement over a remote model endpoint is not
   deterministic. WP4 must separate reproducible from re-observable and report them differently.
   Overclaiming here would be worse than shipping nothing.

5. **Verification without the issuer.** The verifier must work when `councilof.ai` is offline,
   which means the DID document, root, proofs, and chain must all be mirrorable.

---

## 8. Ecosystem Engagement

**Dependencies:** OpenTimestamps (client and public calendars), Sigstore Rekor, Ed25519/did:web
stack, Model Context Protocol registry.

**Users today:**
- 303 measurement doors published (each a `/.well-known/` endpoint)
- MCP server listed in the official Model Context Protocol registry (354 servers)
- x402 payment rail live on Base (USDC) — free doors and metered doors both functional
- Published live feed at `feed.xml`

**Honest statement of traction:** $0.00 in external revenue. One independent payer settled
USD 0.02 on-chain (2026-09-08) — our first and only non-self settlement. Self-settlements
are excluded by doctrine. What we can evidence is published surface and a corrections record,
not revenue or user counts.

**Stakeholders:** OpenTimestamps and Sigstore communities (WP1/WP2 upstreaming), EU AI Act
Article 50 implementation community (transparency obligations are the clearest regulatory use
for independently verifiable measurement records).

---

## 9. Timeline

| Month | Milestone |
|---|---|
| 1 | OTS stamping pipeline operational; first confirmed Bitcoin proof |
| 2 | Rekor automation operational; `/api/anchor` live |
| 3-4 | Independent verifier prototype; test vector set published |
| 5-6 | Verifier v1.0 published (`@csoai/verify` on npm) |
| 7-8 | Recomputation harness prototype; 10 cards recomputed |
| 9-10 | Harness v1.0 published; 50 cards recomputed |
| 11 | Threat model and verification guide published |
| 12 | Final report; upstream contributions merged |

---

## 10. Applicant Background

Sole director of CSOAI Ltd (UK company 16939677, incorporated 2 January 2026), operating as
an independent AI-measurement body.

Built and operate the current estate: a 22-axis measurement board (22 of 22 measured), 335
signed cards in the published index, 303 cards under a signed Merkle root, 354 MCP servers
published to the official registry, and a public corrections ledger with 46+ entries. Concept
DOI 10.5281/zenodo.21991104.

The signing, canonicalisation, and chain code already exist and runs in CI. What is missing
is exactly the anchoring and independent-verification half this grant would fund. This is
not a proposal to start — it is a proposal to close a gap that has been publicly disclosed.

---

## 11. Other Funding Sources

No grant funding received to date. No investment raised. One independent payer settled
USD 0.02 on-chain (2026-09-08). No concurrent grant applications pending at the time of
writing (see `docs/grants/grants.csv` for full disclosure of all applications filed).

---

## 12. AI Disclosure

Yes. An AI coding assistant (Claude, via Claude Code) was used to prepare this application.
Its role was to read the project's live endpoints and published files and extract the factual
figures quoted above. Every factual claim is independently checkable against a public URL.
The technical work being proposed predates this application.

---

## 13. Artefact Appendix — Every Figure with Its Source

| Figure | Value | Source |
|---|---|---|
| Board coverage | 22 axes / 22 measured / 0 unmeasured | `GET /api/gspc` → `totals` |
| Signed chain length | 335 (313 published, 22 withheld) | `public/signed/chain.json` → `length`, `bodies_published` |
| Cards under root | 303 | `public/root.json` → `card_count` |
| Merkle root | `e4cc26d1...c6cc03d` | `public/root.json` → `merkle_root` |
| Root.json SHA256 | `74797e30...41b751b` | `shasum -a 256 public/root.json` |
| Card index entries | 335 | `public/signed/card_index.json` |
| Rekor logIndex | 2,791,822,965 | Trust chain state in `TUI-1-CANONICAL-STATE.json` |
| OTS state | STAMPED_PENDING_BITCOIN | `TUI-1-CANONICAL-STATE.json` → `trust_chain.ots_submission.state` |
| Ed25519 pubkey | `d4cb0eaa...9c37e38` | `public/signed/chain.json` → `links[0].pubkey` |
| DID | `did:web:csoai.org#board-attestation-1` | `public/root.json` → `did_intended` |
| MCP registry servers | 354 | `registry.modelcontextprotocol.io` |
| Revenue | $0.00 external, ZERO classification | `TUI-1-CANONICAL-STATE.json` → `revenue` |
| Corrections | 46+ | `GET /api/corrections` |
| x402 network | Base (`eip155:8453`), USDC | `/.well-known/x402.json` |
| Company | CSOAI Ltd, UK 16939677 | Companies House |
| Merkle tree caveat | Odd-node duplication, CVE-2012-2459 class | `public/root.json` → `tree_caveat` |

---

_Drafted 2026-09-15. Owner submits; this lane does not._
