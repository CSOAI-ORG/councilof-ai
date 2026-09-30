# A2A Extension: `signed-receipts/v1` (draft 0.2, 2026-08-20)

**URI:** `https://councilof.ai/a2a/extensions/signed-receipts/v1`
**Status:** draft — for the A2A two-tier extension path (experimental → official)
**Author:** CSOAI Ltd (Council of AI) — independent measurement body, UK 16939677
**License:** Apache-2.0

## 0. Changes in draft 0.2 (2026-08-20)

- **Full RFC 8785 (JCS) canonicalisation** in `interceptor.py`: UTF-16 key sort,
  ES6 number serialisation (`1e+30`, `1e-27`, no `-0`, `2^53` safe-integer domain),
  short-form escapes (`\b \t \n \f \r`), `\uXXXX` for other control chars, and
  **surrogate pairs for astral chars** (ECMAScript `JSON.stringify` semantics,
  matching the IETF JCS interop suite). Verified byte-identical to the reference
  implementation on 300+ fuzz cases.
- **Exact public-key matching** in DID verification (v0.1 did a substring match,
  which a crafted DID doc could false-positive); supports `publicKeyHex`,
  `publicKeyMultibase` (base58btc/base16/base64url), and `publicKeyJwk`.
- **Revocation support** per §5 append-only rotation: `"revoked": true` on a
  verification method rejects otherwise-valid signatures.
- Reference implementation + regression suite: `python3 test_interceptor.py`
  (12 checks: roundtrip, tamper x2, identity, substring-guard, wrong-key,
  revoked, multibase x2, RFC 8785 vector, domain guard, determinism).

## 1. Problem

A2A v1.0 §8.4 standardises the *envelope* for AgentCard signing (JWS/RFC 7515 over
RFC 8785 canonical JSON) but **deliberately leaves the trust root unspecified**, and
message-level attestation of *what an agent actually did* is wholly unstandardised.
Two agents can interoperate, but neither can hand a third party durable evidence of
the interaction's outcome.

## 2. What this extension adds

1. **A key-trust convention for §8.4:** the JWS `kid` is a DID URL under `did:web:`
   (e.g. `did:web:example.org#keys-1`). Verifiers resolve the DID document at
   `https://<host>/.well-known/did.json` and match the verification method. No new
   registry, no new PKI — HTTPS + a JSON file the host already controls.
2. **A signed receipt object** an agent MAY attach to any Task completion
   (`Task.metadata["signed-receipts/v1"]`) or return from a dedicated skill:

```json
{
  "schema": "a2a.signed-receipt/0.1",
  "issuer": "did:web:example.org",
  "subject_card": "https://example.org/.well-known/agent-card.json",
  "task_id": "…",
  "claims": [{ "type": "measurement", "detail": "…", "evidence_sha256": "…" }],
  "issued_at": "2026-08-19T09:00:00Z",
  "content_id": "sha256 of canonical JSON minus signature",
  "signature": { "alg": "Ed25519", "kid": "did:web:councilof.ai#…", "sig": "hex" }
}
```

   Canonicalisation: RFC 8785 (same as §8.4). Verification is offline: recompute
   `content_id`, resolve `kid` → DID doc → public key, check Ed25519.

3. **Register (normative):** a receipt is evidence of *what was claimed and when* by
   the issuer — it is **not** a certification, endorsement, or conformity mark, and
   MUST NOT be presented as one.

## 3. AgentCard declaration

```json
{ "capabilities": { "extensions": [ {
  "uri": "https://councilof.ai/a2a/extensions/signed-receipts/v1",
  "required": false,
  "params": { "issuer": "did:web:councilof.ai" }
} ] } }
```

## 4. Reference implementation

`interceptor.py` — an ADK-style client/server interceptor (~180 lines) that attaches a
signed receipt to task completion and verifies inbound ones. Framework-agnostic core;
only `cryptography` required. Canonicalisation is a self-contained RFC 8785 (JCS)
implementation — no third-party dependency, deterministic across interpreters.

## 5. Security considerations

- did:web inherits HTTPS/DNS trust — rotation via DID doc updates; old kids stay
  resolvable with `"revoked": true` markers rather than deletion (append-only).
- Receipts embed the public key AND the kid: offline integrity always verifiable;
  identity verifiable whenever the DID doc is reachable (cache it).
- Never sign secrets or raw user content — claims carry hashes, not payloads.

## 6. Relationship to prior art

Sigstore signs artifacts, not evals; SPIFFE binds workloads, not measurements; §8.4
signs *cards*, not *outcomes*. This extension completes the third leg: signed
evidence of agent behaviour, portable across all three.
