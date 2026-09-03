# CSOAI Operator Runbook

Generated: 2026-09-03T07:51:54Z

Total steps: **16**
Total cost: **£660 trademarks** + **~$0.001 EAS** + everything else **free**

## Order of execution

1. **EAS schema** (MetaMask + Base) — 5 min
2. **x402 facilitator URL** on Pages — 1 min
3. **Confirm signing key** on Pages — 1 min
4. **Bind REVENUE_KV** — 5 min
5. **npm publish gspc-card-verifier** — 5 min
6. **npm provenance** — 5 min
7. **NLnet grant** (deadline TODAY) — 30 min
8. **Re-mint HF DOIs** — 30 min per dataset
9. **SWH archive** — 5 min (waits for archive to complete)
10. **Other 3 grants** (NGI, Sloan, Ford) — 30 min each
11. **10 vendor + 5 regulator outreach emails** — 2 hours
12. **UK IPO trademarks** — 1 hour
13. **7 subdomain DNS records** — 15 min

**Total time: ~6-8 hours of operator clicks**

## Each step

### eas-01: EAS Schema Registration on Base (via MetaMask)

**URL**: [https://base.easscan.org/](https://base.easscan.org/)

**Sequence**:

  1. Open MetaMask → switch to Base Mainnet
  2. Open https://base.easscan.org/ → click 'Schema' tab
  3. Click 'Register Schema'
  4. Schema name: 'CSOAI Measurement Attestation'
  5. Schema fields (raw):
     string subject
     string axis
     string measurement
     string sha256
     uint256 timestamp
     string source_url
  6. Resolver: (none — schema is irrevocable)
  7. Click 'Sign with MetaMask' → approve transaction
  8. Wait ~15 sec for the transaction to settle
  9. Copy the new schema UID from the explorer
  10. Paste it into docs/EAS_SCHEMA_UID.md

**Lane-doable after**: csoai-eas-mirror.py — re-emits every CSOAI card as an off-chain EAS attestation

**Expected cost**: ~$0.001 (Base gas for schema registration)

**Outcome**: Schema UID registered; off-chain EAS attestations can now reference this UID

---

### x402-01: Set X402_FACILITATOR_URL on Cloudflare Pages

**URL**: [https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables](https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables)

**Sequence**:

  1. Open Cloudflare dashboard
  2. Workers & Pages → councilof-ai → Settings → Environment variables → Production
  3. Click 'Add variable'
  4. Variable name: X402_FACILITATOR_URL
  5. Value: https://facilitator.payai.network
  6. (Optional) Add X402_PAY_TO if wallet ever rotates
  7. Click 'Save'
  8. Redeploy (push to master, or run GHA)

**Lane-doable after**: /api/x402 rail.mode flips from 'challenge-only' to 'live'; /api/revenue settled_usdc starts counting

**Expected cost**: free

**Outcome**: x402 facilitator is live; every priced request settles on Base

---

### x402-02: Confirm BOARD_SIGN_KEY_PKCS8_B64 on Pages

**URL**: [https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables](https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables)

**Sequence**:

  1. Same env variables screen
  2. Confirm BOARD_SIGN_KEY_PKCS8_B64 is present
  3. If absent: export from local keychain → paste

**Lane-doable after**: Paid cards ship signed under did:web:csoai.org#board-attestation-1

**Expected cost**: free

**Outcome**: Signed paid cards (no more 'sig_ed25519: null')

---

### x402-03: Bind REVENUE_KV (Cloudflare KV namespace)

**URL**: [https://dash.cloudflare.com/?to=/:account/workers/kv](https://dash.cloudflare.com/?to=/:account/workers/kv)

**Sequence**:

  1. Cloudflare → Storage & Databases → KV → Create namespace
  2. Name: revenue
  3. Edit wrangler.jsonc → add kv_namespaces:
     { 'binding': 'REVENUE_KV', 'id': '<new-id>' }
  4. Commit + push to master
  5. Redeploy

**Lane-doable after**: /api/revenue settled_usdc count moves from null to real

**Expected cost**: free

**Outcome**: Revenue counts work

---

### npm-01: npm publish gspc-card-verifier

**URL**: [file:///Users/nicholas/clawd/councilof-ai/packages/gspc-card-verifier](file:///Users/nicholas/clawd/councilof-ai/packages/gspc-card-verifier)

**Sequence**:

  1. cd packages/gspc-card-verifier
  2. npm login (use csoai npm account)
  3. npm publish --access public
  4. Verify: https://www.npmjs.com/package/gspc-card-verifier

**Lane-doable after**: Third parties can `npm install gspc-card-verifier` to verify cards offline

**Expected cost**: free

**Outcome**: Verifier is on npm

---

### npm-02: npm provenance for csoai-gspc-mcp

**URL**: [https://www.npmjs.com/package/csoai-gspc-mcp](https://www.npmjs.com/package/csoai-gspc-mcp)

**Sequence**:

  1. GH Actions workflow already exists
  2. Add to publish step: NPM_CONFIG_PROVENANCE=true
  3. Push to trigger Trusted Publishing
  4. Verify: npm audit signatures shows green check on npmjs.com

**Lane-doable after**: npmjs.com shows a green check on csoai-gspc-mcp linking to source commit + workflow

**Expected cost**: free

**Outcome**: Provenance attestation shipped

---

### hf-01: Re-mint stale HF DOI on current commit

**URL**: [https://huggingface.co/csoai](https://huggingface.co/csoai)

**Sequence**:

  1. For each csoai/* dataset: Settings → Generate DOI
  2. Click 'Generate new DOI' (the old DOI stays as a pointer)
  3. Record the pinned commit SHA
  4. Add to public/interop/hf-dois.json

**Lane-doable after**: Every csoai/* dataset has a current DOI

**Expected cost**: free (DOI is free on HF)

**Outcome**: Citation-friendly DOIs that pin the current revision

---

### swh-01: SWH archive eval harness

**URL**: [https://archive.softwareheritage.org/save/](https://archive.softwareheritage.org/save/)

**Sequence**:

  1. Open https://archive.softwareheritage.org/save/
  2. URL: https://github.com/CSOAI-ORG/councilof-ai.git
  3. Branch: master
  4. Click 'Save'
  5. Wait ~1-2 hours for the archive to complete
  6. Record the swh:1:rev: SWHID

**Lane-doable after**: Every measurement card can cite the SWHID as intrinsic code identifier

**Expected cost**: free

**Outcome**: Harness has a permanent content ID independent of GitHub

---

### grants-01: Send NLnet Privacy & Trust application (€50K, deadline 2026-09-03)

**URL**: [file:///Users/nicholas/Downloads/CSOAI_OWNER_CHECKLIST_02Sep2026.md](file:///Users/nicholas/Downloads/CSOAI_OWNER_CHECKLIST_02Sep2026.md)

**Sequence**:

  1. Open drafts/nlnet-privacy-and-trust.txt
  2. Open https://nlnet.nl/privacy/
  3. Find 'How to apply' / 'Submit a proposal'
  4. Paste + personalise the draft
  5. Submit

**Lane-doable after**: NLnet receives CSOAI's application

**Expected cost**: free

**Outcome**: €50K grant application submitted

---

### grants-02: Send NGI Zero Discovery application (€50K, rolling)

**URL**: [https://nlnet.nl/NGI0/](https://nlnet.nl/NGI0/)

**Sequence**:

  1. Open drafts/ngi-zero-discovery.txt
  2. Open https://nlnet.nl/NGI0/
  3. Submit via the NGI0 form
  4. Paste + personalise the draft

**Lane-doable after**: NGI Zero receives CSOAI's application

**Expected cost**: free

**Outcome**: €50K grant application submitted

---

### grants-03: Send Sloan Foundation application ($75K, rolling)

**URL**: [https://sloan.org/programs/digital-technology](https://sloan.org/programs/digital-technology)

**Sequence**:

  1. Open drafts/sloan-foundation-digital-technology.txt
  2. Open https://sloan.org/programs/digital-technology
  3. Submit via the Sloan portal
  4. Paste + personalise the draft

**Lane-doable after**: Sloan receives CSOAI's application

**Expected cost**: free

**Outcome**: $75K grant application submitted

---

### grants-04: Send Ford Foundation application ($100K, rolling)

**URL**: [https://www.fordfoundation.org/work/our-grants/building-public-interest-tech/](https://www.fordfoundation.org/work/our-grants/building-public-interest-tech/)

**Sequence**:

  1. Open drafts/ford-foundation-public-interest-tech.txt
  2. Open the Ford Foundation application form
  3. Paste + personalise the draft

**Lane-doable after**: Ford receives CSOAI's application

**Expected cost**: free

**Outcome**: $100K grant application submitted

---

### outreach-01: Send 10 vendor CTO outreach emails

**URL**: [file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md](file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md)

**Sequence**:

  1. Read §2 of REVENUE-RESEARCH (10 demand-side targets)
  2. For each target: research the CTO / VP name, find their email
  3. Personalise the cold email template
  4. Send via email

**Lane-doable after**: 10 vendor conversations opened

**Expected cost**: free

**Outcome**: Pipeline of vendor leads

---

### outreach-02: Send 5 regulator outreach emails

**URL**: [file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md](file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md)

**Sequence**:

  1. Read §2 (regulators: EU AI Office, CNIL, ICO, etc.)
  2. For each: personalise + send

**Lane-doable after**: 5 regulator conversations opened

**Expected cost**: free

**Outcome**: Regulator visibility

---

### tm-01: UK IPO trademark filing for Council of AI, CSOAI, GSPC

**URL**: [https://www.gov.uk/apply-register-trademark](https://www.gov.uk/apply-register-trademark)

**Sequence**:

  1. Open https://www.gov.uk/apply-register-trademark
  2. For each mark (Council of AI, CSOAI, GSPC):
     - Class 9 (software)
     - Class 42 (SaaS / tech services)
  3. Pay £170 first class + £50 per additional class
  4. Total budget: 3 × (1 × 170 + 1 × 50) = £660

**Lane-doable after**: Trademarks filed, publication in TM Journal

**Expected cost**: £660 (rising to £795 from 1 April 2026)

**Outcome**: Brand protection

---

### dns-01: Add 7 subdomain DNS records (proofs, issuance, verifier, marketplace, blog, press, dashboards)

**URL**: [https://dash.cloudflare.com/?to=/:account/csoai.org/dns](https://dash.cloudflare.com/?to=/:account/csoai.org/dns)

**Sequence**:

  1. Cloudflare → csoai.org → DNS → Records
  2. For each subdomain:
     - Type: CNAME
     - Name: <slug>
     - Target: csoai-site.pages.dev
  3. Save
  4. Workers & Pages → csoai-site → Custom domains → Add the 7 subdomains

**Lane-doable after**: 7 subdomains resolve + serve their CF Pages project

**Expected cost**: free

**Outcome**: 7 subdomain landing pages live on public URLs

---
