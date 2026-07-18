# PROVISIONAL PATENT APPLICATION
## Sovereign Provenance Passport for AI-Generated Content

**Applicant:** CSOAI Ltd (UK company 16939677)
**Inventor:** Nicholas Templeman
**Priority Date Target:** July 2026

---

## FIELD OF THE INVENTION

The present invention relates to cryptographic provenance systems, and more specifically to portable, offline-verifiable provenance passports for AI-generated content using Ed25519 signatures, hash-chained ledgers, and W3C Decentralized Identifiers (DIDs).

## BACKGROUND

The EU AI Act Article 50 (effective August 2, 2026) requires AI-generated content to be watermarked and machine-readably traceable to its source. Existing approaches to AI content provenance (C2PA, Truepic, SynthID) are limited:

1. They rely on centralized authorities for verification
2. They require internet connectivity to validate
3. They are tied to specific platforms (Instagram's watermarking, TikTok's labels)
4. They do not provide cryptographic non-repudiation
5. They cannot be verified offline by third parties

There is a need for a provenance system that is portable (works across platforms), offline-verifiable (no internet needed), cryptographically signed (non-repudiable), and issuer-sovereign (the content creator controls their own identity, not a platform).

## SUMMARY OF THE INVENTION

### Claim 1: The Provenance Passport Format
A portable data structure for AI content provenance, comprising:
- A content hash (SHA-256) of the AI-generated artifact
- An issuer identity (W3C DID) with an Ed25519 public key
- A timestamp of issuance
- A content type classification (text, image, video, audio)
- An interaction type (chatbot, generative, deepfake, emotion, biometric)
- An Ed25519 signature over the preceding fields
- Wherein said data structure is self-contained and requires no external authority to verify

### Claim 2: The Issuance Method
A method for issuing a provenance passport, comprising:
- Computing a SHA-256 hash of the AI-generated artifact
- Retrieving the issuer's Ed25519 private key from a sovereign key store
- Constructing a passport payload including the hash, issuer DID, timestamp, and metadata
- Signing the payload with the Ed25519 private key
- Recording the passport on a hash-chained ledger (SIGIL)
- Wherein the ledger entry links to the previous entry via cryptographic hash, creating a tamper-evident sequence

### Claim 3: The Offline Verification Method
A method for verifying an AI content provenance passport without internet connectivity, comprising:
- Extracting the Ed25519 public key from the passport's issuer DID
- Recomputing the SHA-256 hash of the artifact
- Verifying the Ed25519 signature against the public key
- Checking the timestamp for temporal validity
- Returning a verification result (valid/invalid) without any network request
- Wherein verification requires only the passport, the artifact, and the public key — no platform, no API, no internet

### Claim 4: Hash-Chain Integrity Verification
A method for detecting tampering in a provenance ledger, comprising:
- Reading the ledger entries sequentially
- For each entry, recomputing the hash from the previous entry's hash and the current payload
- Comparing the recomputed hash to the stored hash
- If any mismatch is detected, identifying the exact entry where tampering occurred
- Wherein the hash chain provides cryptographic proof of ledger integrity

### Claim 5: W3C DID Integration for Issuer Sovereignty
A system integrating W3C Decentralized Identifiers with the provenance passport, comprising:
- A DID creation method generating Ed25519 keypairs and DID documents
- A DID resolution method retrieving public keys from DID documents
- A binding between the passport issuer field and the DID controller
- Wherein the issuer controls their own cryptographic identity, not a platform or authority

## REDUCTION TO PRACTICE

The invention is implemented in `article_50_passport.py` (8.9KB, 10/10 tests pass):
- `issue_passport()`: issues an Ed25519-signed provenance passport
- `verify_passport()`: offline verification without internet
- `verify_chain()`: hash-chain integrity check
- The system is live at os.meok.ai and handles EU AI Act Article 50 compliance

## ABSTRACT

A portable, offline-verifiable provenance passport for AI-generated content using Ed25519 signatures and hash-chained ledgers. The passport is self-contained, requires no platform or internet to verify, and binds AI content to sovereign issuer identities via W3C DIDs.

---

*Reduction to practice: article_50_passport.py (10/10 tests pass). Implemented for EU AI Act Article 50 compliance. Live at os.meok.ai.*
