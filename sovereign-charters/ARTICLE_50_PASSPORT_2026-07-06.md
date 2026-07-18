# CSOAI Article 50 EU AI Act Passport — Free for Humanity
## 27 days until enforcement (2 Aug 2026) · Ed25519-signed · OTS Bitcoin-anchored
## 2026-07-06 · CSOAI Ltd · UK 16939677

---

## ⚑ HONESTY REGISTER (per EAT_directive)

This passport issuance workflow is staged and **illustrative**. The actual issuance requires:
1. Lead consent (you must own the AI system being certified)
2. Care Membrane 0.95 floor validation
3. BFT 23/33 council ratification
4. Owner-gate: Stripe (for paid tiers) + SOV3 endpoint (for live SIGIL chain)

**CSOAI never claims to have issued a passport for any live deployment without all four conditions being met.**

---

## 📋 WHAT IS THE ARTICLE 50 EU AI ACT PASSPORT?

EU AI Act Article 50 (Transparency obligations for providers and deployers of AI systems) requires that:

> *Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system, unless this is obvious to a well-informed natural person, having regard to the circumstances and context of use.*

**Penalties for non-compliance**: up to **€15,000,000 or 3% of total worldwide annual turnover, whichever is higher**.

The CSOAI Article 50 Passport is a **signed, verifiable, audit-grade artifact** that:

1. Certifies your AI system meets Article 50 requirements
2. Captures your care membrane ≥ 0.95 (CSOAI's care floor)
3. Records the BFT 23/33 council ratification vote
4. Emits a SIGIL chain (Ed25519-signed + OTS Bitcoin-anchored)
5. Is publicly verifiable at proofof.ai

**Cost: FREE for the basic tier. £5 for Pro (5-day issuance). Charter Article 0 binding applies.**

---

## 📐 ISSUANCE WORKFLOW

### Step 1 — Eligibility check (1 minute)
You must own (or have explicit consent from the owner of) the AI system being certified.

Eligible systems:
- Any GenAI system that interacts with humans (chatbots, voice assistants, etc.)
- Image generation systems that interact with humans
- Code generation systems that interact with humans
- Decision-support systems in healthcare, finance, defence, etc.

### Step 2 — Care Membrane validation (5 minutes)
CSOAI runs the **Care Membrane 0.95 floor validation** on your system:
- Bias detection (≥ 0.95)
- Privacy preservation (≥ 0.95)
- Safety boundary (≥ 0.95)
- Sovereignty boundary (≥ 0.95)
- Accountability chain (≥ 0.95)
- Transparency surface (≥ 0.95)

If any sub-score < 0.95, CSOAI provides remediation guidance.

### Step 3 — Article 50 disclosure check (5 minutes)
Verifies:
- AI nature disclosure visible to user
- Disclosure mechanism accessible
- Disclosure language appropriate
- Disclosure consistent across all user touchpoints
- Disclosure not deceptive or misleading

### Step 4 — BFT 23/33 ratification (24 hours)
33-agent BFT council votes on the passport issuance.
- 23/33 quorum required
- Article 0 unanimous + 5 human sigs for any changes
- Voting is Ed25519-signed
- Audit trail public on proofof.ai

### Step 5 — Passport issuance (instant, after ratification)
CSOAI emits:
- **Article 50 Passport Certificate** (Ed25519-signed)
- **SIGIL chain** (SHA-256 chain, OTS Bitcoin anchored)
- **Public verify URL** at proofof.ai/verify/article50-{sha256}
- **M2 passport** (machine-readable JSON-LD)
- **OSCAL component definition** (signed)
- **System Card** (signed, 4-page mini white paper)

### Step 6 — Continuous monitoring (free, forever)
- Watchdog signal submission
- Care Membrane revalidation on demand
- Annual re-passport (free for Free tier, £5 for Pro)
- Article 50 incident reporting if needed

---

## 📜 PASSPORT TEMPLATE

```yaml
---
  type: CSOAI-Article50-Passport
  version: "1.0"
  passport_id: a50-pp-{sha256[:16]}
  issued_at: 2026-07-06T00:00:00Z
  expires_at: 2027-07-06T00:00:00Z
  issuer:
    name: CSOAI Ltd
    registration: UK Companies House 16939677
    sovereign_root_key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
    jurisdiction: UK
  holder:
    did: did:csoai:{holder-id}
    type: provider | deployer
    name: {holder-name}
    jurisdiction: {jurisdiction}
    contact: {contact-email}
  system:
    name: {ai-system-name}
    version: {version}
    description: {description}
    risk_class: minimal | limited | high | prohibited
    annex_iii_category: {annex-iii-cat-or-null}
  article_50_disclosure:
    surface_visible: true
    mechanism: persistent_banner | first_message | periodic_reminder | always_visible | system_card
    language: {en, fr, de, es, ...}
    deception_check: passed
  care_membrane:
    bias: 0.96
    privacy: 0.97
    safety: 0.96
    sovereignty: 0.99
    accountability: 0.98
    transparency: 0.97
    floor: 0.95
    passed: true
  bft_ratification:
    council_id: 33-agent-bft-council
    quorum_required: 23
    votes_for: 25
    votes_against: 0
    votes_abstain: 8
    ratified: true
    ratifiers: 25_dids
    ratified_at: 2026-07-06T01:23:45Z
  sigil_chain:
    issuance_digest: a1b2c3d4e5f67890...
    ots_proof: bitcoin:block_824123
    verify_url: proofof.ai/verify/article50-a1b2c3d4...
  signature:
    ed25519: ed25519:d75a9801...a8f3
    issuer: CSOAI sovereign root key
  charter_binding:
    article_0: binding
    bft_council_unanimous_required: true
    human_sig_required: true
    human_sigs: 5_of_7_collected
---
```

---

## 💰 PRICING

| Tier | Cost | Issuance time | Includes |
|---|---|---|---|
| **Free** | £0 | 5 days | Passport + SIGIL chain + public verify |
| **Pro** | £5 | 3 days | All Free + OSCAL component + System Card + priority support |
| **Business** | £499/yr | 1 day + revalidation annual | All Pro + BFT observer seat + Watchdog monitoring |
| **Crown RFQ** | £50K+ | Tailored | Sovereign-grade issuance for defence, finance, healthcare |

**Charter Article 0 binding**: free tier is genuinely free forever. No upsell to paid tiers. No equity. Capture-proof.

---

## 🛡️ INTEGRITY GUARANTEES

1. **Public verify**: every passport verifiable at proofof.ai/verify/{digest}
2. **BFT ratification**: 23/33 council vote before issuance
3. **OTS Bitcoin anchoring**: tamper-evident audit at zero marginal cost
4. **Annual re-passport**: no lock-in, no auto-renew traps
5. **Care Membrane 0.95 floor**: never below 0.95 on any sub-score
6. **Charter Article 0 binding**: ISO fee-for-service only. No equity. No success fees. No board seats.

---

## 🚦 NEXT STEPS

To issue your passport:

1. **Free tier**: Sign up at csoai-static-deploy2.vercel.app/signup → select "regulator" or "end_user" persona → request Article 50 passport
2. **Pro tier (£5)**: Sign up → select Pro tier → request Article 50 passport (3-day SLA)
3. **Business tier (£499/yr)**: Sign up → select Business tier → request Article 50 passport (1-day SLA + annual revalidation)
4. **Crown RFQ**: Direct email at crown@csoai.org for sovereign-grade issuance

**All paths require lead consent (you must own or have consent for the AI system being certified).**

---

CSOAI Ltd · UK Companies House 16939677 · Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding