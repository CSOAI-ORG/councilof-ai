# A2A Extension: `signed-receipts/v1` (draft 0.3, 2026-09-28)

**URI:** `https://councilof.ai/a2a/extensions/signed-receipts/v1`
**Status:** draft, for the A2A two-tier extension path (experimental, then official)
**Author:** CSOAI Ltd (Council of AI), independent measurement body, UK 16939677
**License:** Apache-2.0
**Supersedes:** draft 0.2 (2026-08-20), https://councilof.ai/spec/signed-receipts/v1/SPEC.md,
sha256 `f5a7400b1963473718156d14e70df6c640ee12881e6c56dc5ecbfac0e9e43efa`. Draft 0.2 stays at that URL
with those bytes. A published draft is superseded, never edited.
**Conformance kit:** https://councilof.ai/spec/signed-receipts/v1/conformance/ (normative for §5; see §7)

The key words MUST, MUST NOT, SHOULD and MAY are to be read as described in BCP 14 (RFC 2119, RFC 8174)
when, and only when, they appear in all capitals.

## 0. Changes in draft 0.3 (2026-09-28)

1. **Erratum to draft 0.2, §0 (canonicalisation of astral characters).** Draft 0.2's change notes say
   that characters outside the Basic Multilingual Plane are written as "surrogate pairs". That sentence
   is wrong and is withdrawn. RFC 8785 (JCS), like ECMAScript `JSON.stringify`, writes such a character
   as itself, UTF-8 encoded. `\uXXXX` escapes are used only for control characters that have no
   short-form escape, and for lone surrogates. §3 now states the rule in full, together with the
   ECMAScript number serialisation that RFC 8785 §3.2.2.3 requires. The reference implementation had the
   same fault and was corrected on 2026-09-28 (corrections ledger entry C-2026-0928-02).
2. **Three verification results, normative (§5).** A verifier MUST return exactly one of `VALID`,
   `INVALID` or `UNVERIFIABLE_KEY`. When the DID in `signature.kid` cannot be resolved, the result is
   `UNVERIFIABLE_KEY`, never `VALID`: a receipt carries its own public key, so integrity alone says nothing
   about who signed it. Integrity is checked first, so a tampered receipt is `INVALID` whether or not its
   key resolves. Until 2026-09-28 the reference verifier returned `VALID` when it had no resolver
   (corrections ledger entry C-2026-0928-01; IETF SCITT architecture issue #462 cites the pre-correction
   code as the failure case).
3. **The receipt object as implemented (§2).** `signature.signer_public_key` (hex Ed25519 public key) and
   `register` are listed as members. Draft 0.2's example omitted `signer_public_key` although its §5 said
   that receipts embed the public key; the vectors and both runners have always required it.
4. **Conformance vectors (§7).** 17 core Ed25519 cases and 4 optional ML-DSA-65 interop cases, with a
   Node runner and a Python runner. A verifier that returns the expected result for every core case
   matches this draft; nothing more is claimed for it.
5. **Stated as not covered (§8):** time validity and issuer binding. Draft 0.3 does not add either.

The receipt schema string is unchanged (`a2a.signed-receipt/0.1`). A receipt that carries no astral
character and none of the number forms listed in §3 canonicalises to the same bytes under draft 0.2's
reference code and under this draft.

## 1. Problem

A2A v1.0 §8.4 standardises the *envelope* for AgentCard signing (JWS, RFC 7515, over RFC 8785
canonical JSON) but deliberately leaves the trust root unspecified, and message-level attestation of
*what an agent actually did* is unstandardised. Two agents can interoperate, but neither can hand a
third party durable evidence of the interaction's outcome.

## 2. The receipt object

An agent MAY attach a receipt to any Task completion (`Task.metadata["signed-receipts/v1"]`) or return
one from a dedicated skill.

```json
{
  "schema": "a2a.signed-receipt/0.1",
  "issuer": "did:web:issuer.example",
  "subject_card": "https://issuer.example/.well-known/agent-card.json",
  "task_id": "task-001",
  "claims": [{ "type": "measurement", "detail": "free text", "evidence_sha256": "<64 hex>" }],
  "register": "Evidence of what was claimed and when by the issuer.",
  "issued_at": "2026-09-28T00:00:00Z",
  "content_id": "<64 hex>",
  "signature": {
    "alg": "Ed25519",
    "kid": "did:web:issuer.example#key-1",
    "signer_public_key": "<64 hex>",
    "sig": "<128 hex>"
  }
}
```

| Member | Requirement |
|---|---|
| `schema` | MUST be `a2a.signed-receipt/0.1`. |
| `issuer` | The issuer's DID. Draft 0.3 does not require it to equal the DID in `signature.kid` (§8). |
| `subject_card` | URL of the AgentCard the receipt concerns. |
| `task_id` | The A2A task identifier. |
| `claims` | Array. Each claim carries a `type`, a `detail` and SHOULD carry `evidence_sha256`, the SHA-256 of the evidence, never the evidence itself. |
| `register` | OPTIONAL. Plain-language statement of what the receipt is; covered by `content_id` and the signature like every other member. |
| `issued_at` | RFC 3339 UTC time of issue. |
| `content_id` | Lowercase hex SHA-256 of the canonical bytes (§3) of the receipt with `content_id` and `signature` removed. |
| `signature.alg` | `Ed25519` for the core profile. |
| `signature.kid` | A DID URL under `did:web:`; the part before `#` is the DID to resolve. |
| `signature.signer_public_key` | Lowercase hex, 32-byte Ed25519 public key that produced `sig`. |
| `signature.sig` | Lowercase hex, 64-byte Ed25519 signature over the canonical bytes of the receipt with `signature` removed (so `content_id` is covered). |

## 3. Canonicalisation

The canonical bytes of a JSON value are its RFC 8785 serialisation. Implementations MUST produce
byte-identical output to RFC 8785 for every value a receipt can carry. In particular:

- **Object members** are sorted by their names compared as arrays of UTF-16 code units; no whitespace
  is emitted.
- **Strings** are written with the short escapes `\b \t \n \f \r \" \\`, `\u00XX` (lowercase hex) for
  other control characters below U+0020, and `\uXXXX` for lone surrogates. Every other character,
  including characters outside the Basic Multilingual Plane such as U+1F600, is written as itself,
  UTF-8 encoded, and is **not** escaped as a surrogate pair. (This corrects draft 0.2, §0.)
- **Numbers** are written with the ECMAScript Number::toString algorithm (RFC 8785 §3.2.2.3): an
  integral value has no fractional part (`2`, not `2.0`); magnitudes from 1e-6 up to 1e21 are written
  without an exponent (`0.00001`, `10000000000000000`); outside that range the exponent form is
  `1e+30` / `1e-27`; `-0` is written `0`. Values outside the IEEE 754 double range, NaN and Infinity
  are not valid in a receipt. Integers SHOULD stay within the safe-integer range (2^53 - 1).

A serialiser that writes Python `repr()` floats, escapes astral characters, sorts keys by code point
or emits `", "` / `": "` separators produces different bytes, and receipts it issues will not verify
in a conforming verifier. The conformance kit has a case for each of these.

## 4. Key trust

The JWS `kid` convention for A2A §8.4 and the receipt `signature.kid` are DID URLs under `did:web:`.
A verifier resolves the DID document at `https://<host>/.well-known/did.json` and finds the
verification method whose `id` equals `kid`. The method's key MAY be expressed as `publicKeyHex`,
`publicKeyMultibase` (base58btc `z`, base16 `f` or base64url `u`) or `publicKeyJwk` (OKP, Ed25519);
the decoded bytes MUST equal `signature.signer_public_key` exactly. A substring or prefix match is not
a match. A method marked `"revoked": true` MUST NOT be accepted. No new registry and no new PKI: HTTPS
and a JSON file the host already controls.

## 5. Verification (normative)

A verifier MUST return exactly one of three results, and MUST apply the steps in this order:

1. **Well-formed.** If the receipt is not an object, lacks `content_id` or `signature`, or its
   signature members are missing or not of the stated hex lengths, the result is `INVALID`.
2. **Integrity.** Recompute `content_id` over the receipt minus `content_id` and `signature` (§3). If it
   differs, the result is `INVALID`. Verify `sig` over the receipt minus `signature` under
   `signature.signer_public_key`. If it does not verify, the result is `INVALID`.
3. **Key.** Resolve the DID in `signature.kid`.
   - If it cannot be resolved (no resolver configured, an unsupported DID method, a network or HTTP
     error, a document that cannot be parsed), the result is `UNVERIFIABLE_KEY`.
   - If it resolves and the document has no verification method with `id` equal to `kid`, or that
     method's key is not exactly `signature.signer_public_key`, or the method is marked
     `"revoked": true`, the result is `INVALID`.
   - Otherwise the result is `VALID`.

| Result | Meaning |
|---|---|
| `VALID` | Integrity holds and the DID the receipt names publishes exactly this key, not revoked. |
| `INVALID` | Malformed, content changed after signing, signature does not verify, or the resolved DID does not publish this key (or has revoked it). |
| `UNVERIFIABLE_KEY` | Integrity holds against the key the receipt carries, but whose key it is could not be established. |

A verifier MUST NOT report `UNVERIFIABLE_KEY` as `VALID`, and MUST NOT collapse the three results into
a boolean in a way that turns `UNVERIFIABLE_KEY` into acceptance. An API that returns a boolean MUST
return true only for `VALID`. Implementations MAY add informative reason codes (the kit uses
`KEY_RESOLVED`, `CONTENT_ID_MISMATCH`, `BAD_SIGNATURE`, `KEY_NOT_IN_DID_DOCUMENT`, `KEY_REVOKED`,
`DID_UNRESOLVABLE`, `MALFORMED`); the three results above are the only normative output.

## 6. AgentCard declaration

```json
{ "capabilities": { "extensions": [ {
  "uri": "https://councilof.ai/a2a/extensions/signed-receipts/v1",
  "required": false,
  "params": { "issuer": "did:web:councilof.ai" }
} ] } }
```

## 7. Conformance

The vectors at https://councilof.ai/spec/signed-receipts/v1/conformance/vectors.json are normative for
§3 and §5. Each case gives a receipt, a `did_documents` map that stands in for DID resolution (a DID
absent from the map cannot be resolved; implementations resolve only through the map, never the
network) and the expected result. A candidate writes
`{"results": {"<case id>": "VALID | INVALID | UNVERIFIABLE_KEY"}}` and checks it with either runner:

```
node run.mjs my-results.json          # Node 20 or later, no dependencies
python3 run.py my-results.json        # Python with the cryptography package
```

Each prints PASS or FAIL per case and exits 0 only when every core case matches.

- **Core (17 cases, Ed25519):** valid with the key as `publicKeyHex`, `publicKeyMultibase` and
  `publicKeyJwk`; an RFC 8785 edge case (UTF-16 key order, an astral character, `0.5`, `1e+30`);
  tampered payload, with and without a recomputed `content_id`; tampered signature; different-key
  forgery; three unresolvable-key cases; tampered and unresolvable; a key that matches only as a
  substring; a revoked key; two wrong canonicalisations (insertion key order; `", "` / `": "`
  separators); a missing signature.
- **Interop (4 cases, optional):** the `a2a-receipt-ml-dsa-65` profile, ML-DSA-65 (FIPS 204) over the
  same receipt object, copied unmodified from `@fractalai/pqc-agent-receipts-conformance` 0.3.1
  (Apache-2.0). A candidate that leaves them out gets SKIP, not FAIL.

Files of the kit at the time this draft was written (sha256):

| File | sha256 |
|---|---|
| `conformance/vectors.json` | `dce6927119a84c297516bc21870895b97d1421c44d964cc54f7b9eb758c45f12` |
| `conformance/run.mjs` | `099ac2e4819e7f9b203fdab88a18191e682c79538da26dd5851d7d1456b596f9` |
| `conformance/run.py` | `9ceeba741f9645b8138356f9a18c18b85653a3a5b0fd86082c65cebac83a6351` |
| `conformance/reference-results.json` | `658e2a1665e593df94cbcce14eee442626844f153bcc20351ef649ff47a6498c` |
| `conformance/example-fail-results.json` | `0040a69f8f0bdab93c4616fca4998de3cb2f8860d014e582dbaca5a68d7b1087` |
| `conformance/gen_vectors.py` | `5ae81c6c29c965afdaceccae53235837d6689ac3eb9577ca7a50b5b95954e484` |
| `interceptor.py` | `b79ed7fe59229587eecf6b9f31df033374059492d7c1119cd3fad475411d6216` |
| `test_interceptor.py` | `1d204e03399a3b2989d30de537acc943fa7296c4b7a2e71230b0f2e31b10d5aa` |

`reference-results.json` holds the reference verifier's results: all 21 cases match (17 core, 4 interop).
`example-fail-results.json` holds the results of the verifier as it was before 2026-09-28, and both
runners report FAIL on it (three unresolvable keys and the RFC 8785 edge case).

A PASS means that an implementation's result for each case equals the expected result. It is not a
mark of conformity, approval or quality, and nobody issues one.

## 8. Not covered by this draft

- **Time validity.** Only `issued_at` is defined. There is no validity window, so no receipt expires
  and the kit has no expired or not-yet-valid cases.
- **Issuer binding.** `issuer` is not required to equal the DID in `signature.kid`, and no case tests
  it. A later draft should require it, with vectors, before a verifier relies on `issuer`.

## 9. Reference implementation

`interceptor.py`, an ADK-style client/server interceptor that attaches a signed receipt to task
completion and verifies inbound ones. Framework-agnostic core; only `cryptography` required. Its
canonicaliser is a self-contained RFC 8785 implementation (§3). `verify_receipt_result()` returns one
of the three results of §5; `verify_receipt()` keeps its `(bool, reason)` shape and its bool is true
only for `VALID`. `python3 test_interceptor.py` runs its checks, including the published vectors.

## 10. Security considerations

- did:web inherits HTTPS and DNS trust. Keys rotate through DID document updates; old `kid`s stay
  resolvable with `"revoked": true` markers rather than being deleted (append-only).
- A receipt embeds its public key and its `kid`, so integrity can always be checked offline, and
  authorship only when the DID document can be read (cache it). `UNVERIFIABLE_KEY` exists so that the
  first is never mistaken for the second.
- Whoever controls the DID's domain controls its keys. `VALID` means that the named domain published
  the key at the time it was read; it does not mean that the claims in the receipt are true.
- Never sign secrets or raw user content: claims carry hashes, not payloads.

## 11. Register (normative)

A receipt is evidence of *what was claimed and when* by its issuer. It is not a mark of conformity,
approval or quality, and MUST NOT be presented as one.

## 12. Relationship to prior art

Sigstore signs artifacts, not evaluations; SPIFFE binds workloads, not measurements; A2A §8.4 signs
*cards*, not *outcomes*. This extension adds signed evidence of what an agent did, portable across all
three.

## 13. Corrections behind this draft

Both entries are in the public corrections ledger, https://councilof.ai/api/corrections:

- **C-2026-0928-01:** the reference verifier returned `VALID` for a receipt whose key could not be
  resolved. Now `UNVERIFIABLE_KEY` (§5).
- **C-2026-0928-02:** the reference canonicaliser escaped astral characters and wrote some numbers
  with Python rules, not RFC 8785; draft 0.2's change note on surrogate pairs is the erratum withdrawn
  in §0 item 1.
