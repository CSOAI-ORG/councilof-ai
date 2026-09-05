# compliance-pact.v1 — STAGED (not live)

> Status: **STAGED**. No EAS key exists yet; nothing is minted. The template + test
> vector are the contract design. Do not describe it as available.

## What it is
A machine-readable compliance attestation — `compliance-pact.v1` — shaped as:
- **W3C Verifiable Credential** (JSON-LD `https://councilof.ai/schema/compliance-pact.v1`),
- **EAS attestation** (Ethereum Attestation Service on Base, network `eip155:8453`),
- referencing the evidence-bundle OSCAL observations (never a judgement: observations + relevant-to).

## Fields (template)
```
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "urn:uuid:<uuid>",
  "type": ["VerifiableCredential", "CompliancePact"],
  "issuer": "did:web:csoai.org#board-attestation-1",
  "issuedAt": "<iso8601>",
  "credentialSubject": {
    "obligation": "article-50|article-53|dora|cra",
    "subject": "<entity>",
    "evidence_bundle_sha256": "<64-hex>",
    "observation_count": 0,
    "state": "UNMEASURED"   // never "compliant"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:web:csoai.org#board-attestation-1"
  }
}
```

## Test vector (deterministic fixture, EAS key NOT required)
- Input fixture: `{"obligation":"article-50","subject":"test-entity","bundle_sha":"".zfill(64)}`
- Expected credential statement: every state value is one of
  `MEASURED | UNMEASURED | UNCHECKABLE | TIE | SEPARATED`; `observation_count` ≥ 0;
  NEVER the word "compliant" or "certified".
- The vector is the gate for the future EAS minter: if the minter would emit
  "compliant", the fixture test fails.

## Files (this PR)
- `docs/product/compliance-pact.v1.md` — this design (STAGED)
- Test vector inline above. A machine-readable fixture will accompany the EAS
  integration PR (owner-gated: EAS key + schema deployment).

## Why STAGED
The EAS key does not exist and the schema is not deployed (owner-gated). Saying
"live" before that would be the same lie the estate's own gates catch. STAGED.
