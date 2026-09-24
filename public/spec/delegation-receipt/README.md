# Delegation receipt — v0.1 DRAFT

A small open format for one signed record of **one job an agent did for someone**: who
authorised it, which agent did it, what was paid, what was delivered, who checked the outcome,
and when. Each of those carries its own evidence state. Nothing in the record adds them up.

| | |
|---|---|
| Version | 0.1 — **DRAFT**. Fields may change before 1.0. A published version is never edited in place; a later version supersedes it by existing and naming it. |
| Date | 2026-09-24 |
| Editor | Council of AI — CSOAI Ltd, UK Companies House 16939677 |
| Licence | **CC0 1.0 Universal** (public domain dedication) for this document, the schema, the test vectors and the example. Adopt, fork or re-publish without asking. The reference scripts under `scripts/receipts/` are under the repository licence (MIT). |
| Schema | [`schema-v0.1.json`](schema-v0.1.json) (JSON Schema 2020-12) |
| Test vectors | [`test-vectors/`](test-vectors/) — signed with published **TEST KEYS** only |
| Example | [`examples/commission-397f2843.unsigned.json`](examples/commission-397f2843.unsigned.json) — one of our own self-test commissions, **unsigned** |
| Crosswalk | [`CROSSWALK.md`](CROSSWALK.md) — where each field comes from in MCP elicitation, A2A task states, x402 (incl. offer-and-receipt), AP2 mandates, ERC-8004 and the AAIF trace model |
| Reference verifier | `scripts/receipts/verify_receipt.py` (Python 3, `cryptography`) |

The key words MUST, MUST NOT, SHOULD and MAY are to be read as in RFC 2119 / RFC 8174 when,
and only when, they appear in capitals.

## 1. The construct

A delegation receipt is a **measurement record**. A *recorder* (whoever writes and optionally
signs the receipt) states, for one job, what it could establish about six things, and for each
one, **who else stands behind it**:

| Section | Question | Typical references |
|---|---|---|
| `principal` | Who authorised the job? | an AP2 mandate id or hash; a proof-of-human reference of the nullifier kind (World AgentKit); a hash of a Skyfire KYA token; `SELF_TEST`; or `UNSTATED` |
| `agent` | Which agent did it? | A2A agent card URL + sha256 of the bytes read, and when they were read; optionally an ERC-8004 identity registry entry |
| `payment` | What was paid? | x402: CAIP-2 network, asset, amount in base units (a decimal string), `payTo`, tx hash or settlement reference; or `UNPAID` / `UNSTATED`; plus a `payer_class` |
| `delivery` | What was delivered? | artifact URL + sha256 of the bytes read, and how the artifact is tied to the job |
| `outcome_check` | Who checked the outcome, and how? | a pseudonymous human reviewer reference, or an automated check id + method URL; or **`UNCHECKED`** |
| `timestamps` | When? | for each of requested / paid / delivered / checked: the time someone *asserted* and the time someone *observed*, kept apart |

A receipt describes one job. It is not a profile of the agent and MUST NOT be aggregated into one.

## 2. What a receipt is NOT evidence of

A receipt — signed or not, fully evidenced or not — is not evidence of:

- the quality, correctness or fitness of the delivered work (unless `outcome_check` records a
  check, and then only of what that named method checked);
- the identity of any natural person;
- the agent being safe, reliable, or suitable for any other job;
- revenue, or a buyer independent of the recorder, unless `payer_class` is `OUTSIDE` **and**
  that class is itself evidenced;
- any signing key still being unrevoked at the time you read it (see §6.4).

It is not an endorsement, not a conformity mark and not a rating. No mark, badge or score may be
derived from it. Every body carries a `not_evidence_of` list so that this section travels with
the record.

## 3. Evidence states

### 3.1 The three states

Every section (and `payment.payer_class`, and each timestamp) carries exactly one of:

| State | Meaning |
|---|---|
| `EVIDENCED_BY_THIRD_PARTY` | At least one piece of evidence comes from a party that is neither the recorder, the agent nor the principal — a chain record, a registry entry, a document signed by an independent issuer, an independent checker's run record. |
| `SELF_ASSERTED` | Something is referenced, but only the recorder, the agent or the principal stands behind it. |
| `ABSENT` | Nothing is on record. `ABSENT` is a finding, not an error, and MUST NOT be filled with a guess. |

**The states are never collapsed.** A verifier or a consumer MUST NOT compute a single number,
grade or rank from them, and MUST report them side by side. A receipt with every section
`ABSENT` except `payment` is a correct receipt for a job about which only the payment is known.

`UNCHECKED` (in `outcome_check.result`) is first-class for the same reason. Most jobs are never
checked by anybody; a format that could not say so would push recorders into implying a check.

### 3.2 Coherence rules (enforced by the reference verifier)

A section's state MUST agree with its own fields:

1. `ABSENT` ⇔ no evidence entries and no references filled in.
2. `SELF_ASSERTED` and `EVIDENCED_BY_THIRD_PARTY` each need at least one evidence entry.
3. `EVIDENCED_BY_THIRD_PARTY` needs at least one evidence entry with `party: THIRD_PARTY`;
   `SELF_ASSERTED` MUST NOT list one (that would understate the state or mislabel the evidence).
4. `principal.kind == UNSTATED` ⇔ `principal.state == ABSENT`; likewise `payment.kind == UNSTATED`.
5. `payment.kind == UNPAID` is an assertion: payment fields empty, state `SELF_ASSERTED`, and an
   evidence entry naming who asserted it. `X402` needs network, asset, amount_units, pay_to and a
   tx hash or settlement reference.
6. `payer_class.value == UNKNOWN` ⇔ `payer_class.state == ABSENT`.
7. `outcome_check.result == UNCHECKED` ⇔ `state == ABSENT` ⇔ `checker_kind == NONE`. A human
   check needs a pseudonymous `checker_ref`.
8. `delivery.binding == NONE` ⇔ `delivery.state == ABSENT`.
9. Timestamps: `asserted_at`/`asserted_by` come together, `observed_at`/`observed_via` come
   together. `ABSENT` has neither. `SELF_ASSERTED` has an asserted time only. `EVIDENCED_BY_THIRD_PARTY`
   needs an observed time from a third party.
10. An agent card URL and its sha256 come together, and a hash needs `card_observed_at`: a card
    is redeployed over time, so a hash without its reading time says little.

### 3.3 How an artifact is tied to the job (`delivery.binding`)

| Value | Meaning |
|---|---|
| `REFERENCED_IN_JOB` | the job request or mandate named the artifact's hash (or the artifact names the job) |
| `JOINED_BY_SUBJECT` | the recorder matched the artifact to the job by subject/topic; nothing in either names the other |
| `ASSERTED_BY_AGENT` | the agent says this is what it delivered |
| `NONE` | nothing delivered is on record |

## 4. Fields

The schema is normative for shape; this table is a reading guide. All fields are REQUIRED; a
field with nothing to say is `null` (or `[]`), never omitted. The body contains **no JSON
numbers** — amounts are decimal strings of base units — which removes the float-spelling
differences between JSON serialisers from the preimage entirely (see §5).

| Field | Notes |
|---|---|
| `schema` | `csoai.delegation-receipt/0.1` |
| `record_kind` | always `MEASUREMENT_RECORD` |
| `recorded_at` | UTC, `Z` suffix |
| `recorder.did`, `recorder.name` | who wrote the record; `did` MAY be null for an unsigned record |
| `job.ref`, `job.summary` | a recorder-local job reference and one line of description. No personal data. |
| `principal` | `state`, `kind`, `ref`, `ref_sha256`, `evidence[]` |
| `agent` | `state`, `a2a_agent_card_url`, `a2a_agent_card_sha256`, `card_observed_at`, `erc8004` (`chain`, `identity_registry`, `agent_id`) or null, `evidence[]` |
| `payment` | `state`, `kind`, `network` (CAIP-2), `asset`, `amount_units`, `pay_to`, `tx_hash`, `settlement_ref`, `payer_class` {`value`, `state`}, `evidence[]`. **There is no payer field.** |
| `delivery` | `state`, `artifacts[]` {`url`, `sha256`, `content_id`, `observed_at`}, `binding`, `evidence[]` |
| `outcome_check` | `state`, `result`, `checker_kind`, `checker_ref`, `check_id`, `method_url`, `finding`, `evidence[]` |
| `timestamps.{requested,paid,delivered,checked}` | `state`, `asserted_at`, `asserted_by`, `observed_at`, `observed_via` |
| `not_evidence_of[]` | at least one entry; §2 in the record's own words |
| `notes[]` | free text, short, no personal data |
| evidence entry | `party` (THIRD_PARTY / RECORDER / AGENT / PRINCIPAL), `kind` (CHAIN_RECORD / HTTP_BYTES / SIGNED_DOCUMENT / PROTOCOL_MESSAGE / RECORDER_LOG), `locator`, `sha256` or null, `observed_at`, `what_it_shows` |

`payer_class` values follow the classification already published at `/api/commissions`:
`OUTSIDE` (a wallet not controlled by the recorder moved a non-zero amount), `SELF_TEST` (the
recorder paid itself), `ZERO_VALUE` (nothing moved), `UNKNOWN`.

## 5. Envelope, content id and signature

```json
{ "body": { … }, "id": "<sha256 hex>", "alg": "Ed25519",
  "preimage_rule": "json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')",
  "signed": true, "kid": "did:web:…#key", "pubkey": "<32-byte hex>", "signature": "<64-byte hex>" }
```

The rule is the one our published measurement cards already use (`/signed/HOW-TO-VERIFY.md`,
"Rule A"), stated here in full:

    preimage  = json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    id        = sha256(preimage).hexdigest()
    signature = Ed25519 over preimage (not over the id), hex-encoded

- Keys sorted, no whitespace, every non-ASCII character escaped as `\uXXXX` (`ensure_ascii=True`).
  An implementation outside Python MUST escape non-ASCII the same way; `JSON.stringify` does not.
- Because the body carries no numbers, Rule A and RFC 8785 differ only in that escaping. A body
  that is pure ASCII has the same preimage under both.
- An unsigned record has `signed: false` and `kid`, `pubkey`, `signature` all `null`. Its `id`
  is still computed, so the record can be cited and later signed without changing.
- The signing key MUST be a key of `body.recorder.did` (`kid` = `<recorder did>#<fragment>`).
- JSON with duplicate keys MUST be rejected before hashing.

## 6. Verification

`python3 scripts/receipts/verify_receipt.py RECEIPT.json --did-doc did.json` (or `--did-url`,
or `--pubkey HEX`). Each failure is reported under its own code; one never hides another.

| Code | Meaning |
|---|---|
| `PARSE_ERROR`, `DUPLICATE_KEY` | not one JSON object with unique keys |
| `SCHEMA_INVALID` | missing, mistyped or out-of-enum field; an extra field (e.g. a payer address, a score) |
| `ENVELOPE_INCONSISTENT` | `signed` disagrees with kid/pubkey/signature |
| `INCOHERENT_EVIDENCE_STATE` | a §3.2 rule is broken |
| `PERSONAL_DATA_SUSPECTED` | an e-mail-shaped value anywhere in the body |
| `ID_MISMATCH` | `id` ≠ sha256(preimage(body)) — the body is not the body that was sealed |
| `BAD_SIGNATURE` | the signature does not verify over the preimage under the envelope's own `pubkey` |
| `SIGNER_NOT_RECORDER` | `kid` is not a key of `body.recorder.did` |
| `UNTRUSTED_SIGNER` | the signature verifies, but the key is not the one the supplied DID document publishes for `kid` (or not the pinned `--pubkey`) |

**A bad signature and an untrusted signer are different findings.** The first says the bytes
and the signature disagree. The second says they agree and the key is not one you pinned —
anyone can generate a key and sign anything, so a self-consistent signature alone proves nothing
about who signed.

### 6.1 Verdicts

| Verdict | Exit | Meaning |
|---|---|---|
| `VALID` | 0 | coherent, id matches, signature verifies, key is the one the DID document publishes for `kid` |
| `INVALID` | 1 | at least one failure code above |
| `UNSIGNED` | 2 | well-formed, nobody has signed it yet. Not a failed record. |
| `SIGNER_UNPINNED` | 2 | signature verifies, but no DID document or key was supplied to pin it against |

The verifier also prints the per-section evidence states, unsummed.

### 6.2 What VALID means

That the named key signed these exact bytes, that the key is the one the DID document
publishes, and that the record is internally coherent. **Not** that any claim inside it is true.
How far each claim is supported is exactly what the per-section evidence states say.

### 6.3 Fetching a DID document

Our CDN has refused the default Python user-agent in the past (HOW-TO-VERIFY.md). The reference
verifier sends an explicit one, and a failed fetch is reported as `UNCHECKABLE`, never `INVALID`.

### 6.4 Revocation

Offline verification establishes signature validity against the parameters you hold on the
day you fetched them. It says nothing about whether the key is still valid now. State your
DID-document fetch date beside any verdict you republish.

## 7. Privacy rules

1. **No personal data.** References and hashes only. No names, e-mail addresses, phone numbers,
   postal addresses or account identifiers of natural persons, in any field including `notes`.
2. **Human reviewers are pseudonymous.** `checker_ref` is a pseudonymous reference (for example
   a salted hash the reviewer's organisation can resolve and nobody else can), never a name or
   an address.
3. **Principals are references.** For a proof-of-human principal, record only the pseudonymous
   proof reference the protocol exposes (nullifier-style), never the proof's inputs. For a KYA
   token or a mandate, record an id or a hash — never the token itself (it may be a bearer credential).
4. **No payer address.** The schema has no payer field and rejects one. Be aware that a tx hash
   resolves to a public chain record that does show the payer; a recorder that must not link a
   payer SHOULD use `settlement_ref` instead of `tx_hash`, or leave payment `ABSENT`.
5. **Human-in-the-loop content stays out.** If an outcome check was collected from a person
   through MCP elicitation or any other prompt, the receipt records the check's id and a
   pseudonymous checker reference, not what the person entered.

## 8. Relationship to other protocols

This format **references** these protocols; it does not implement their verification, and a
receipt citing one of them does not mean the protocol's own checks were run unless an evidence
entry says what was run.

| Protocol | Used for | Reference |
|---|---|---|
| A2A | agent card URL + hash; this body is a candidate shape for the task-outcome receipts of our `signed-receipts/v1` A2A extension, which remains **a draft we publish and do not yet emit** | https://a2a-protocol.org/latest/specification/ |
| AP2 | principal: a mandate id or hash | https://ap2-protocol.org/ |
| x402 | payment: network, asset, amount, payTo, settlement | https://docs.x402.org/ |
| ERC-8004 | agent: identity registry + agent id | https://eips.ethereum.org/EIPS/eip-8004 |
| World AgentKit | principal: pseudonymous proof-of-human reference | https://world.org/blog/announcements/now-available-agentkit-proof-of-human-for-the-agentic-web |
| Skyfire KYA | principal: hash of a KYA token | https://docs.skyfire.xyz/docs/kya |
| MCP elicitation | one way an outcome check by a person may be collected (§7.5) | https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation |

## 9. Test vectors

`test-vectors/manifest.json` lists each file with its expected verdict and failure codes.
Verify with `--did-doc test-vectors/test-did.json`.

| File | Expected |
|---|---|
| `01-valid-fully-evidenced.json` | `VALID` |
| `02-valid-absent-principal.json` | `VALID` — principal `ABSENT` |
| `03-valid-unchecked-outcome.json` | `VALID` — outcome `UNCHECKED` |
| `04-invalid-tampered-body.json` | `ID_MISMATCH` + `BAD_SIGNATURE` |
| `05-invalid-untrusted-signer.json` | `UNTRUSTED_SIGNER` only (signature itself verifies) |
| `06-invalid-bad-signature.json` | `BAD_SIGNATURE` only (id matches) |
| `07-invalid-incoherent-state.json` | `INCOHERENT_EVIDENCE_STATE` |
| `08-unsigned-record.json` | `UNSIGNED` |
| `09-invalid-personal-data.json` | `PERSONAL_DATA_SUSPECTED` |

**TEST KEYS.** `test-vectors/test-keys.json` publishes the private seeds on purpose. Anything
they sign proves nothing. They are not, and are never to be put in, any CSOAI DID document. Every
reference inside the vectors is fictional (`.example` domains, made-up hashes).
`scripts/receipts/make_test_vectors.py --check` regenerates them byte-for-byte.

## 10. Example built from one of our own records

`examples/commission-397f2843.unsigned.json` is built by
`scripts/receipts/build_commission_example.py` from public bytes only: one commission listed at
`https://councilof.ai/api/commissions` (`receipt_sha 397f2843…`), its settlement transaction on
Base mainnet, our agent card, and the three signed cards `/api/commissions` joins to it.

- It is **SELF_TEST**: the estate paid its own door. It is not revenue and not an outside buyer,
  and must never be counted as either.
- It is **unsigned** (`signed: false`). Signing a receipt under a CSOAI key is a separate,
  owner-reviewed step.
- Only the payment is evidenced by a third party (the chain). The principal, agent and delivery
  are self-asserted; the outcome is `UNCHECKED`; the request time is `ABSENT`.

## 11. Versioning

`0.1` is a draft. Breaking changes bump the minor version while < 1.0 and change the `schema`
constant, so a verifier can refuse a version it does not know. Comments and corrections:
open an issue on `github.com/CSOAI-ORG/councilof-ai`.
