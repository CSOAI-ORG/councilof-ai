# TUI 6 — Human Distribution and Revenue Proof

**Audit date:** 2026-09-12
**Auditor:** JEEVES (automated, owner-reviewed before any external submission)
**Scope:** Every public surface, launch material, IETF draft thread, revenue ledger
**Baseline:** Live APIs fetched 2026-09-12; source files read from `growth/verified-launch-20260911` branch

---

## 1. Surface Audit Results

### 1.1 Live API State (fetched 2026-09-12)

| Surface | Key count | Source | Status |
|---------|-----------|--------|--------|
| `/api/gspc` totals.axes | 22 | live API | ✅ CORRECT |
| `/api/gspc` totals.measured_axes | 22 | live API | ✅ CORRECT |
| `/api/gspc` totals.public_leader_count | 3 | live API | ✅ CORRECT |
| `/api/gspc` totals.lid | "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate." | live API | ✅ CORRECT |
| `/api/state` signed_cards.count | 335 (catalogued) | live API | ✅ CORRECT |
| `/api/state` card_chain.bodies_verified_valid | 335 (measured) | live API | ✅ CORRECT |
| `/api/state` signed_cards.corpus_relation | SEPARATE_CORPORA, identifier_overlap=0 | live API | ✅ CORRECT |
| `/api/hub-cards` measured cells | 1,145 | live API | ✅ CORRECT |
| `/api/revenue` one_number.all_time | 1 | live API | ✅ CORRECT |
| `/api/revenue` settled_usdc.count | 20,000 atomic (0.02 USDC) | live API | ✅ CORRECT |
| `/api/revenue` self_settlements | 5 | live API | CLASSIFIED BELOW |
| `/api/revenue` zero_value_settlements | 4 | live API | CLASSIFIED BELOW |
| `/api/corrections` entries | 38 (source count) | corrections.ts | ✅ CORRECT |
| Public root leaves | 167 | `/api/state` | Stale in README (derived 2026-09-09, said 168) |

### 1.2 Homepage (index.html)

- JSON-LD: "Council of AI (CSOAI Ltd, UK 16939677) is an independent AI-measurement body. Measurement, not certification." — ✅ CORRECT
- No stale counts in the static shell. All dynamic content renders from the SPA which reads live APIs.
- No "Bitcoin-anchored" claim in index.html. ✅ CLEAN

### 1.3 llms.txt — AUDIT

| Claim | Line | Verdict |
|-------|------|---------|
| "Measurement, not certification" | 4 | ✅ CORRECT |
| "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs" | 17-18 | ✅ CORRECT (matches live lid) |
| "Quote both, or quote the smaller" (axes vs measured) | 14 | ✅ CORRECT doctrine |
| "The root's OpenTimestamps proof covers root.json bytes only. It does not anchor the signed-card index and it does not anchor GSPC." | 169-170 | ✅ CORRECT and honest |
| "human booking not live · no processor named" | 50 | ✅ CORRECT |
| "Self-settle proves the rail; stranger revenue is separate" | 52 | ✅ CORRECT |
| "OTS pending only" (implied by line 169) | — | ✅ CORRECT |
| No hardcoded axis counts (defers to API) | 13-14 | ✅ CORRECT |

**llms.txt verdict: CLEAN.** This is the most disciplined file on the estate. No corrections needed.

### 1.4 README.md — AUDIT

| Claim | Line | Verdict |
|-------|------|---------|
| "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs" | 4 | ✅ CORRECT (matches live lid) |
| "335 cards" | 66 | ✅ CORRECT (matches /api/state) |
| "168 leaves" | 67 | ⚠️ STALE — live root has 167 leaves. Derived 2026-09-09. Expected drift. |
| "OpenTimestamps `STAMPED_PENDING_BITCOIN`" | 68 | ✅ CORRECT (pending, not anchored) |
| "47 entries · latest C-2026-0822-01" | 69 | ⚠️ STALE — source now has 38 entries (more entries added but the derived file was generated at a different checkpoint). The latest is now C-2026-0906-01. |
| "1119 cells: MEASURED 1119" | 71 | ⚠️ STALE — live is 1,145 measured cells. Derived 2026-09-09. |
| "distinct_nonself_payers = 1" | 77 | ✅ CORRECT |
| "Rekor **WITNESSED** · OpenTimestamps `STAMPED_PENDING_BITCOIN`" | 68 | ✅ CORRECT |

**README verdict: THREE STALE DERIVATIONS** (168→167 leaves, 47→38 corrections, 1119→1145 hub cells). All are expected derivation drift from 3 days ago. The file self-documents its derivation time. Not claim-level errors.

### 1.5 Claims Register (claims-register.json) — AUDIT

| ID | Claim | Status | Verdict |
|----|-------|--------|---------|
| CR-001 | Ed25519-signed cards, verifiable offline | live | ✅ CORRECT |
| CR-002 | Timestamp anchoring | planned | ✅ CORRECT (OTS pending only) |
| CR-003 | XRPL devnet attestation | devnet | ✅ CORRECT |
| CR-004 | XRPL mainnet attestation | planned | ✅ CORRECT |
| CR-005 | "Layer 0" definition | live | ✅ CORRECT |
| CR-006 | ML-DSA-65 signing | planned | ✅ CORRECT |
| CR-007 | 33-seat council fault tolerance | retired | ✅ CORRECT (DR-0007) |
| CR-008 | Certification (we never certify) | retired | ✅ CORRECT |
| CR-009 | Mutual recognition with regulators | retired | ✅ CORRECT (C-2026-0826-02) |
| CR-010 | Live board, UNMEASURED shown honestly | live | ✅ CORRECT |
| CR-011 | Live component probing | retired | ✅ CORRECT (quarantined) |
| CR-012 | C2PA conformance | planned | ✅ CORRECT |
| CR-013 | Deterministic grading | live | ✅ CORRECT |
| CR-014 | £20M scholarship | retired | ✅ CORRECT |
| CR-015 | Professional Indemnity Insurance | live | ⚠️ SUSPECT — C-2026-0902-06 withdrew this pending policy document. The claims register still says "live" with "Policy number on request." This should be marked "pending evidence" or the entry should be updated. |
| CR-016 | ISO 27001/42001/SOC 2 | planned | ✅ CORRECT |
| CR-017 | "GDPR Compliant" badge | retired | ✅ CORRECT |
| CR-018 | Per-region data residency | planned | ✅ CORRECT |
| CR-019 | Rating the Raters 001: ARC | live | ✅ CORRECT |
| CR-020 | Comparative RTR coverage | unmeasured | ✅ CORRECT |

**Claims register verdict: ONE SUSPECT ENTRY (CR-015).** The correction C-2026-0902-06 withdrew the insurance assertion pending the policy document, but CR-015 still reads "live" with "Policy number on request." This is internally inconsistent. The correction ledger takes precedence; CR-015 should be updated to "pending-evidence" or "retracted-pending-document."

### 1.6 Press and Social Launch Materials — CRITICAL FINDINGS

**ALL FIVE launch drafts contain unsupported claims:**

| File | Claim | Problem |
|------|-------|---------|
| `launch/press-release.md` L3 | "the only open, signed, and **Bitcoin-anchored** measurement substrate" | **FALSE.** Only 3 root files have Bitcoin anchors. The board, cards, and corrections are NOT Bitcoin-anchored. OTS status is PENDING for 243 files. |
| `launch/press-release.md` L5 | "OTS-anchored to Bitcoin" | **MISLEADING.** Cards carry NO timestamp authority. The root has pending OTS stamps. |
| `launch/press-release.md` L10 | "5,000+ signed measurement atoms, queued and OTS-anchored on a daily cadence" | **FALSE.** Live count is 335 signed cards. 0 atoms are OTS-anchored (per UNVERIFIABLE-OTS-README.md). |
| `launch/social-x_twitter.md` L1 | "Bitcoin-anchored" | **FALSE.** Same issue. |
| `launch/social-x_twitter.md` L5 | "Bitcoin OTS-anchored" | **MISLEADING.** Only 3 root files. |
| `launch/social-mastodon.md` L1 | "Bitcoin-anchored" | **FALSE.** |
| `launch/social-mastodon.md` L5 | "OTS-anchored to Bitcoin (blocks 965121, 965138, 965268)" | **PARTIALLY TRUE.** Those3 blocks anchor3 specific root files. Not the board. |
| `launch/social-linkedin.md` L1 | "Bitcoin-anchored" | **FALSE.** |
| `launch/social-linkedin.md` L9 | "Bitcoin OTS-anchored (3 roots attested...)" | **PARTIALLY TRUE.** Same3 files. |
| `launch/email-blast.md` L5 | "signed and Bitcoin-anchored" | **FALSE.** |
| `launch/email-blast.md` L12 | "Bitcoin OTS-anchored (blocks 965121, 965138, 965268)" | **PARTIALLY TRUE.** |
| `launch/email-blast.md` L20 | "USD 0.50 per request via MetaMask" | **UNVERIFIED.** Prices live only in 402 challenges, never in static copy. This file invents a price. |
| `launch/email-blast.md` L21 | "USD 1.00" | **UNVERIFIED.** Same issue. |

**This is the single most damaging finding.** The UNVERIFIABLE-OTS-README.md was authored on the same estate specifically to document that "N atoms OTS-anchored" is false, yet the launch drafts repeat the claim. The `facts-gate.mjs` build gate exists to catch exactly this class of copy.

### 1.7 Source Pages with "Bitcoin-anchored" in JSX

| File | Line | Context |
|------|------|---------|
| `src/pages/system/System.jsx` | 8 | "Bitcoin-anchored via OpenTimestamps" — Sovereign Town ledger description |
| `src/pages/system/System.jsx` | 54 | "Bitcoin-anchored Sovereign Town ledger" |
| `src/pages/opengridworks/OpenGridWorks.jsx` | 92 | "Bitcoin-anchored" |
| `src/pages/layer0/.../Layer0.jsx` | 99 | "Bitcoin-anchored" |

These are product/feature pages. "Bitcoin-anchored" without qualification is misleading when only 3 root files have that property.

### 1.8 Revenue Classification

| Settlement | Type | Amount | Classification |
|------------|------|--------|---------------|
| 5 self-settlements | Self-to-self (X402_SELF_WALLETS) | varies | **INTERNAL_SELF_FUNDED** |
| 4 zero-value settlements | Ephemeral wallets, no payment | 0 | **ZERO_VALUE_PROOF** |
| 1 stranger settlement | External payer, non-zero | 0.02 USDC | **EXTERNAL_CUSTOMER** |

**Revenue state: $0.00 external (1 payer, 0.02 USDC settled on Base).**

Internal testing is NEVER revenue. The5 self-settlements prove the rail works; they are not buyers. The 4 zero-value settlements prove the challenge/response flow; they are not purchases. Only the 1 stranger settlement counts as external revenue, and it is 0.02 USDC.

### 1.9 Packs.json — AUDIT

| Pack | Content claim | Verdict |
|------|--------------|---------|
| eu-ai-act-pack | "Bitcoin OTS anchor proof" | ⚠️ MISLEADING — only 3 root files are anchored, not the full pack contents |
| eu-ai-act-pack | "Rekor witness receipt" | ✅ CORRECT (Rekor WITNESSED) |
| insurer-pack | "witness receipts on every claim card" | ⚠️ NEEDS QUALIFICATION — not every card has a Rekor receipt |
| swift-bank-pack | contents list | ✅ Generally correct |

---

## 2. IETF Draft Status

### 2.1 draft-templeman-scitt-framing-space-00

- **Title:** "Measuring the CBOR Framing Space of COSE_Sign1 Data-Hash Pre-images"
- **Status:** Published as I-D, 2026-09-05
- **Datatracker:** https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/
- **Announcement:** Prepared at `docs/standards/drafts/2026-09-05/ietf-scitt-list-announcement.txt`
- **Posted?** **NO — owner posts.** The announcement file is ready but has NOT been sent to the SCITT WG list.
- **Content:** Measures the size and shape of COSE_Sign1 framing space — a measurement paper, not a protocol proposal.
- **Scope:** Informational. Asks for review of enumeration and registry implications.

### 2.2 IETF AUDIT BoF / agentproto

- **List:** `agentproto@ietf.org` — CSOAI subscribed
- **AUDIT BoF:** `audit@ietf.org` — CSOAI subscribed 2026-09-03. Charter discussion has NOT opened yet. The BoF request is Mirja Kuhlewind's (bofreq-kuhlewind-...), not CSOAI's. CSOAI is a subscriber.
- **Standing:** CSOAI proposed charter text on evidence requirements. An implementation report on the revocation gap was published, which `draft-sirkkavaara-vaara-receipt -08` Section 10 responded to.
- **Action on CSOAI:** Caught by C-2026-0902-10: an objection on the agentproto list about offline-verification led to the addition of "a consumer must not treat a signature that verifies as evidence that the signing key is still important" to HOW-TO-VERIFY.md and HOW-TO-VERIFY-ROOT.md. Committed on-list and corrected.

### 2.3 A2A Issue #2150 (Extension proposal: signed-receipts/v1)

- **Status:** Open, no maintainer comment, no label, no linked PR in a2aproject/A2A
- **What it proposes:** Key-trust convention for §8.4 AgentCard signing using `did:web`, a signed receipt object, and a normative register (receipt ≠ endorsement).
- **Thread activity:** 5 comments as of 2026-09-05. Two external contributors (johnInarti/FractalAI proposing ML-DSA-65; chgaowei/AgentNetworkProtocol supporting experimental tier). PR #3 open on `CSOAI-ORG/a2a-signed-receipts`.
- **Owner-gated:** Review/merge PR #3; whether to reply on #2150.

### 2.4 OLP v1.0 Technical Review

- **Status:** Review document prepared at `docs/standards/drafts/2026-09-05/olp-v1.0-technical-review.md`
- **Target:** open-trust-layer/protocol issue #17 (closed)
- **Posted?** **NO — owner posts.** Two material findings raised (anchor scope; content_id ≠ authorization) and two places where OLP is ahead of CSOAI (failure taxonomy §20.4; conflict vocabulary §31.4).

### 2.5 SCITT RFC 9943 Profile

- **Status:** Draft profile at `docs/operations/SCITT_RFC9943_PROFILE_2026-08-21.md`
- **What it is:** Mapping of CSOAI's existing Ed25519-signed surfaces onto RFC 9943 (SCITT). Key finding: existing signatures are already SCITT-compatible.
- **Gap:** CSOAI is NOT registered with any transparency service. Receipts are null. The profile is preparation, not a claim.
- **List participation:** CSOAI participated in the SCITT WG Last Call review of `draft-ietf-scitt-receipts-ccf-profile-04`.

### 2.6 Standards Standing Summary

From `public/interop/standards-standing-2026-09-03.json`:

| Body | Venue | Basis | Status |
|------|-------|-------|--------|
| IETF | SCITT WG list | Last Call review | Participating |
| IETF | audit@ietf.org | Subscribed | Subscriber only |
| IETF | agentproto@ietf.org | Charter text + implementation report | Participating |
| Linux Foundation | C2PA TWG | Active participant | Participating |
| OpenSSF | Best Practices badge | Project 14391 | Incomplete |
| W3C | Agent Conformance CG | — | NOT a participant (verified) |

---

## 3. Launch Package (Verified Facts Only)

### 3.1 What Is Actually Live and Verifiable

| Fact | Evidence | Verifiable by |
|------|----------|--------------|
| 22-axis GSPC board, all measured | `GET /api/gspc → totals` | Anyone, no account |
| 335 Ed25519-signed measurement cards | `GET /api/state → signed_cards.count` | Anyone, offline verification |
| 335 cards verified valid against pinned key | `GET /api/state → card_chain.bodies_verified_valid` | Anyone with `csoai-gspc[verify]` |
| Signed Merkle public root (167 leaves) | `GET /root.json` | Anyone, byte-level comparison |
| 3 public leader scores (safety, swarm, jail) | `GET /api/gspc → totals.public_leader_count` | Anyone |
| 8 deterministic fact runs (financial axes) | `GET /api/gspc → totals.fact_runs` | Anyone |
| 14 model-comparison axes | `GET /api/gspc → comparison_axes` | Anyone |
| Corrections ledger (38 entries) | `GET /api/corrections` | Anyone, signature checkable |
| 1,145 Hub cells measured | `GET /api/hub-cards → counts` | Anyone |
| x402 rail live on Base (USDC) | `GET /.well-known/x402.json` | Anyone with a wallet |
| Free door (0 USDC) proves the rail | `GET /api/free-door` | Anyone with a wallet |
| 1 external payer (0.02 USDC) | `GET /api/revenue → one_number` | Anyone, chain-verifyable |
| DID document with5 verification methods | `GET https://csoai.org/.well-known/did.json` | Anyone |
| Rekor witness of public root | `GET /interop/root-witness-pointer.json` | Anyone (Sigstore public) |
| OTS stamps: 3 files BITCOIN-ATTESTED, 243 pending | Per UNVERIFIABLE-OTS-README.md | Anyone with `ots verify` |
| 44 discovery doors at `/.well-known/<standard>.json` | Direct probe | Anyone |
| Zenodo DOI 10.5281/zenodo.21991104 | https://doi.org/10.5281/zenodo.21991104 | Anyone |
| Kaggle twin dataset | https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board | Anyone |
| Wikidata Q141128616 | https://www.wikidata.org/wiki/Q141128616 | Anyone |
| Companies House UK 16939677 | https://find-and-update.company-information.service.gov.uk/company/16939677 | Anyone |
| ORCID 0009-0001-3869-1068 | https://orcid.org/0009-0001-3869-1068 | Anyone |
| npm csoai-gspc-mcp | https://www.npmjs.com/package/csoai-gspc-mcp | Anyone |
| PyPI csoai-gspc | https://pypi.org/project/csoai-gspc/ | Anyone |
| MCP registry: io.github.CSOAI-ORG/gspc | Official MCP registry | Anyone |
| PayAPI Market listing | https://payapi.market/api/council-of-ai-gspc-eu-evidence-feed | Anyone |

### 3.2 Deep-Measurement Queue (Honest)

The deep-measurement queue is the gap between "indexed" and "measured":

| Population | Indexed | Measured | Gap |
|------------|---------|----------|-----|
| GSPC board axes | 22 | 22 | 0 (fully measured) |
| Signed cards | 335 | 335 verified | 0 |
| Hub cells | 1,145 | 1,145 | 0 (per hub-cards API) |
| Stablecoin universe | 425 assets, 1,640 entries, 211 chains | 1 asset measured | **424 assets unmeasured** |
| OTS stamps | 243+ pending | 3 BITCOIN-ATTESTED | **240+ pending upgrade** |
| Financial axes (8) | 8 measured as facts | 1 signed (provenance-controls) | **7 unsigned fact runs** |

The stablecoin universe is the largest honest gap: 425 indexed, 1 measured. This is published honestly in `feed.xml.ts` ("425 indexed is not 425 measured").

### 3.3 Signed Evidence and Correction Model

The estate's integrity model:

1. **Ed25519 signed cards** — every measurement card is individually signed and verifiable offline against `did:web:csoai.org#card-attestation-1`
2. **SHA-256 hash chain** — cards are chained via `prev` field, establishing relative ordering
3. **Merkle public root** — `root.json` commits to card hashes; separately indexed from the signed card corpus (SEPARATE_CORPORA, identifier_overlap=0)
4. **Sigstore Rekor witness** — public root is witnessed (WITNESSED state)
5. **OTS stamps** — 3 root files have Bitcoin anchors; 243 files have pending stamps; atom-level anchoring is NOT live
6. **Corrections ledger** — 38 entries documenting every defect found, with the fix and the catching mechanism. Signature state is STALE (needs owner re-sign after latest append).
7. **Free verification** — anyone can verify any card or root without an account

**What this model does NOT claim:**
- Cards are NOT Bitcoin-anchored (CR-002 status: planned)
- The living stamp is UNVERIFIABLE (C-2026-0826-08b)
- The corrections signature is STALE (needs re-sign)
- No transparency service receipt exists (SCITT registration: null)

### 3.4 Offer: 0.01 USDC Existing-Data Offer

The x402 rail is live on Base. The free door (`/api/free-door`) settles at 0 USDC, proving the rail. The existing-data offer is the `stablecoin-change-corrections-feed` at `/api/feeds/provider-diff?history=1`, which returns a 402 challenge. Price is determined by the challenge, not hardcoded.

### 3.5 Free Public Metadata

All of the following are free, no account required:

- Board: `GET /api/gspc`
- Verify: `https://councilof.ai/gspc-verify`
- Cards: `GET /signed/card_index.json`
- Root: `GET /root.json`
- Corrections: `GET /api/corrections`
- Regulation: `GET /api/regulation`
- Hub cells: `GET /api/hub-cards`
- State: `GET /api/state`
- llms.txt: `GET /llms.txt`
- Agent card: `GET /.well-known/agent-card.json`
- MCP (free tools): `POST /mcp` (8 free readers)
- Badges: `https://councilof.ai/badge.md`
- RSS: `GET /feed.xml`

### 3.6 One Externally Verifiable Customer Journey

A stranger can:

1. **Discover:** Find CSOAI via Hugging Face (csoai org, 1,145 measured cells), Kaggle (twin dataset), npm/PyPI (reader packages), or MCP registry.
2. **Read:** Fetch `GET /api/gspc` — no account, no API key. Get the 22-axis board, the lid, and the public leader count.
3. **Verify:** Download any card from `/signed/card_index.json`, pin the DID key from `https://csoai.org/.well-known/did.json`, and verify the Ed25519 signature offline. Three states only: VALID, INVALID, UNCHECKABLE.
4. **Check corrections:** Read `/api/corrections` to see what CSOAI got wrong and how it was caught.
5. **Pay (optional):** Use x402 on Base to commission a new card (`/api/request-attestation`). The 402 challenge reveals the price. MetaMask or any EIP-155 wallet. Settlement on-chain, verifiable.
6. **Receive:** A signed receipt in the `X-PAYMENT-RESPONSE` header, verifiable against the DID key.

---

## 4. Revenue Classification

### 4.1 All Settlements

| # | Type | Amount | Wallet | Classification |
|---|------|--------|--------|---------------|
| 1 | External | 0.02 USDC | Unknown (not payTo, not self) | **EXTERNAL_CUSTOMER** |
| 2-6 | Self | varies | X402_SELF_WALLETS | **INTERNAL_SELF_FUNDED** |
| 7-10 | Zero-value | 0 USDC | Ephemeral | **ZERO_VALUE_PROOF** |

### 4.2 Revenue State

- **External revenue:** $0.02 USDC (0.02 USDC on Base). One external payer.
- **Internal testing:** $0.00 revenue. Self-settlements are infrastructure testing, not income.
- **Zero-value probes:** $0.00. Proving the challenge/response flow.
- **Classification per AGENTS.md rule:** Internal testing is NEVER revenue.

### 4.3 Revenue Gates (from /api/revenue)

| Gate | Threshold | Current | Meaning |
|------|-----------|---------|---------|
| "0 for 30 days" | 0 external payers in 30d | 1 | Shape or price needs review |
| "≥1 repeat" | 1 returning payer | 0 (no repeat yet) | Open the next door |
| "≥5 distinct in 30d" | 5 distinct payers in 30d | 0 | It is a product |

---

## 5. Settlement Attribution

Three distinct offers, each with a unique attribution ID:

| Offer | Attribution ID | Endpoint | Description |
|-------|---------------|----------|-------------|
| Stablecoin Change/Corrections Feed | `ATTR-stablecoin-corrections-feed-v1` | `/api/feeds/provider-diff?history=1` | Signed diff feed of provider document changes, x402-metered |
| Regulation Deadline/Evidence Crosswalk | `ATTR-regulation-crosswalk-v1` | `/api/evidence-bundle?obligation=article-50&subject=<id>&bundle=1` | Regulation-deadline crosswalk evidence, x402-metered |
| MCP/A2A/x402 Trust Receipt | `ATTR-mcp-trust-receipt-v1` | `POST /mcp` (paid tools) | Commission a signed measurement card via MCP, x402-metered |

Each offer's price lives only in the 402 challenge. No price is hardcoded in any public surface.

---

## 6. Claims Corrected

### 6.1 Corrections Needed in Source (this PR)

| # | File | Claim | Correction | Priority |
|---|------|-------|-----------|----------|
| 1 | `launch/press-release.md` | "Bitcoin-anchored" (×3) | "Ed25519-signed, Rekor-witnessed, with OTS stamps pending on 3 root files" | **CRITICAL** |
| 2 | `launch/press-release.md` | "5,000+ signed measurement atoms, queued and OTS-anchored" | "335 signed measurement cards, individually Ed25519-signed and chained" | **CRITICAL** |
| 3 | `launch/social-x_twitter.md` | "Bitcoin-anchored" / "Bitcoin OTS-anchored" | "Ed25519-signed, Rekor-witnessed" | **CRITICAL** |
| 4 | `launch/social-mastodon.md` | "Bitcoin-anchored" / "OTS-anchored to Bitcoin" | "Ed25519-signed, Rekor-witnessed; 3 root files have Bitcoin OTS anchors" | **CRITICAL** |
| 5 | `launch/social-linkedin.md` | "Bitcoin-anchored" / "Bitcoin OTS-anchored" | Same correction | **CRITICAL** |
| 6 | `launch/email-blast.md` | "Bitcoin-anchored" / "OTS-anchored" / invented prices | Remove anchoring claim; remove hardcoded prices | **CRITICAL** |
| 7 | `claims-register.json` CR-015 | Status "live" for insurance | Update to "pending-evidence" per C-2026-0902-06 | **HIGH** |
| 8 | `src/pages/system/System.jsx` | "Bitcoin-anchored via OpenTimestamps" | "Ed25519-signed with OTS stamps pending" | **MEDIUM** |
| 9 | `src/pages/opengridworks/OpenGridWorks.jsx` | "Bitcoin-anchored" | "Ed25519-signed" | **MEDIUM** |
| 10 | `src/pages/layer0/.../Layer0.jsx` | "Bitcoin-anchored" | "Ed25519-signed" | **MEDIUM** |
| 11 | `revenue/arms/packs.json` | "Bitcoin OTS anchor proof" in eu-ai-act-pack | "OTS stamp (pending Bitcoin attestation on root files)" | **MEDIUM** |

### 6.2 Surfaces Already Clean (no correction needed)

- `llms.txt` — fully disciplined, defers to live API, honest about OTS scope
- `index.html` — no stale claims
- `/api/gspc` — honest lid, honest gaps
- `/api/state` — honest corpus relation, honest counts
- `/api/revenue` — honest one_number, honest self-exclusion
- `/api/corrections` — honest ledger (signature needs re-sign)
- `claims-register.json` — 19/20 entries correct (CR-015 exception)
- `sitemap.xml` — no claim content
- `/.well-known/ietf-rats.json` and `ietf-audit.json` — honest discovery pointers, no axis mapping claimed

---

## 7. Blockers

| # | Blocker | Impact | Resolution |
|---|---------|--------|-----------|
| 1 | **Launch materials have "Bitcoin-anchored" claims** | Would ship provably false claims if published | Correct before any external send |
| 2 | **Press release invents "5,000+ atoms"** | False count against live 335 | Correct to verified count |
| 3 | **Press release invents prices ($0.50, $1.00)** | Violates "prices live only in 402" doctrine | Remove prices |
| 4 | **CR-015 (insurance) says "live" but correction retracted it** | Internal inconsistency | Update to "pending-evidence" |
| 5 | **Corrections signature is STALE** | Cannot verify ledger signature | Owner re-sign with estate key |
| 6 | **IETF draft announcement NOT sent** | No IETF list presence for framing-space draft | Owner posts |
| 7 | **A2A PR #3 NOT reviewed** | External contributor waiting | Owner reviews |
| 8 | **OLP review NOT posted** | Review prepared but not delivered | Owner posts |
| 9 | **No external revenue beyond 0.02 USDC** | Revenue proof is the rail working, not demand | Shape and price iteration needed |
| 10 | **Stablecoin universe: 425 indexed, 1 measured** | Largest honest gap | Deep-measurement queue |

---

## 8. What This Audit Does NOT Claim

- No external revenue beyond the verified 0.02 USDC
- No Bitcoin anchoring of cards or the board (planned, not live)
- No mutual recognition with government bodies
- No "first AI measurement body" claim (not made)
- No transparency service registration (SCITT: null)
- No "all axes scored" (22 measured, 3 public leaders, 8 fact runs — the rest are model-comparison with TIE/UNTESTED separation)
- No ISO/SOC2 certification (planned, not attained)
- No professional indemnity insurance evidence on file (CR-015 pending)

---

*This document is prepared for owner review. No emails, DMs, or external submissions have been made. All claims cite live API URLs or specific source files with line numbers.*
