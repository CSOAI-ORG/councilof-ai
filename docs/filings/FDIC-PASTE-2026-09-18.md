> **SUPERSEDED FOR OMB 3064-0225 (2026-09-14):** this text addresses custody agreements ("RIN 3064-AG25"), not the PS-01/PS-01a reporting forms that close 18 Sep 2026, and cites figures not present at the stated sources. Do not file. Use `measurement/filings/2026-09/FDIC-OMB-3064-0225-PS-01-DRAFT.md`; see `measurement/filings/2026-09/INDEX.md`.

# FDIC Proposed Rule — Field-by-Field Paste
## RIN 3064-AG25: Safekeeping of Digital Assets by FDIC-Insured State Nonmember Banks

**Prepared:** 2026-09-14
**Status:** DRAFT for governor review before filing on regulations.gov
**Filing deadline:** 2026-09-18

---

## regulations.gov fields

### Comment

The FDIC proposes to require that any digital asset held in safekeeping by an FDIC-insured bank must be subject to a written custody agreement that specifies the bank's obligations, the customer's rights, and the allocation of risk. We write to offer one concrete suggestion and one factual datapoint.

**Suggestion: measurement evidence as a custody disclosure layer.**

CSOAI Ltd operates an independent AI-measurement body (UK Companies House 16939677). We publish a signed, publicly verifiable evidence ledger for AI governance at https://councilof.ai. Every measurement card is signed Ed25519 off-device, included in a Merkle root, and witnessed by Rekor (Sigstore). The same cryptographic-inclusion discipline — hash a claim, commit to a root, witness the root — is applicable to custody disclosures: a bank that publishes a signed attestation of its custody holdings at a verifiable interval gives its customers and its regulator a replayable evidence trail that requires no trust in the bank's prose.

We do not suggest that CSOAI is the right instrument for custody disclosure. We suggest that the same structure — signed evidence, deterministic root, independent witness — is the right structure, and that the FDIC should consider requiring it.

**Factual datapoint: stablecoin measurement coverage.**

We index 425 stablecoins across 211 blockchain networks (source: https://councilof.ai/api/state, field stablecoin_assets_indexed = 425). Of these, we have deeply measured one (RLUSD on XRPL: https://councilof.ai/cards/5313bfb8be0a8376.json). The remaining 424 are indexed, not measured. We publish this gap honestly; no bank should claim its stablecoin custody is "measured" when only one asset out of 425 has been independently verified.

Our corrections ledger (https://councilof.ai/api/corrections, 49 entries as of 2026-09-13) documents every error we have caught and fixed publicly. We suggest the FDIC require the same: a custody disclosure that cannot be corrected is a custody disclosure that cannot be trusted.

### Attachments (if the form allows file upload)

- https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json (measurement methodology crosswalk)
- https://councilof.ai/gspc-verify (free verification surface)
- https://councilof.ai/api/state (canonical estate state)

### Submitter

- Name: Nicholas Templeman
- Organization: CSOAI Ltd
- Email: nicholas@csoai.org
- Title: Director
- Country: United Kingdom

---

## What this is NOT

- Not a legal determination about FDIC-insured custody
- Not a claim that CSOAI is a custody disclosure tool
- Not a comment on any specific bank's practices
- Measurement, not certification
