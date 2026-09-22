# Claim Maintenance

**A specification for the continuous, independent observation of public claims.**

| | |
|---|---|
| **Specification** | Claim Maintenance |
| **Version** | 0.1 |
| **Status** | Published draft. Stable URL. Superseded only by a higher version, never edited in place. |
| **Date** | 2026-09-22 |
| **Editor** | Council of AI — CSOAI Ltd, UK Companies House 16939677 |
| **Canonical URL** | https://councilof.ai/spec/claim-maintenance/v0.1/ |
| **Version index** | https://councilof.ai/spec/claim-maintenance/ |
| **Register of maintained subjects** | https://councilof.ai/api/claims/register |
| **Reference implementation** | https://github.com/CSOAI-ORG/councilof-ai — `scripts/claim-capture.mjs` |
| **Licence** | CC0 1.0 Universal (public domain dedication). You may adopt, fork, translate, embed or re-publish this document without asking us and without attribution. |
| **Cite as** | Council of AI. *Claim Maintenance, version 0.1.* CSOAI Ltd, 2026-09-22. https://councilof.ai/spec/claim-maintenance/v0.1/ |

---

## 0. How to read this document

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**,
**SHOULD NOT**, **RECOMMENDED**, **MAY** and **OPTIONAL** in this document are to be interpreted
as described in RFC 2119 and RFC 8174, when and only when they appear in all capitals.

A **maintainer** is the party that performs claim maintenance. A **subject** is the organisation
whose claims are maintained. A **relying party** is anybody reading the maintainer's output.

This specification describes a discipline, a data shape and a set of prohibitions. It does not
describe a product, a service level, a fee, or a mark of approval. There is no mark of approval
in this specification and none may be derived from it.

---

## 1. Definition

**Claim maintenance is the continuous, independent observation of the public claims an
organisation makes about itself or its products: capturing each claim verbatim with its source
and date, hashing and timestamping it so the record cannot be quietly rewritten, re-reading it on
a schedule, recording every observed change without alleging anything, and measuring the claim
against public evidence where — and only where — public evidence can settle it.**

Each element of that sentence is normative and is expanded below.

**1.1 Continuous.** A claim maintained once is not maintained. A conforming maintainer MUST
publish, for every claim it maintains, a `next_read_utc`, and MUST either perform that read or
record why it did not. A schedule that is silently skipped is indistinguishable from a schedule
that does not exist; a conforming maintainer therefore records the absence of a read as an event,
not as nothing.

**1.2 Independent.** The maintainer MUST NOT be instructed by the subject as to what to capture,
what to measure, or what to publish. The maintainer MUST NOT accept payment contingent on the
content of any published observation or measurement. See §10.

**1.3 Public claims.** Only statements the subject has published on a surface a stranger can
reach without credentials are in scope: a web page, a public API response, a filed document, a
published artifact. Private statements, leaked material, and statements made to the maintainer in
confidence are out of scope. If it required a login, an NDA, or a relationship to read, it is not
a public claim.

**1.4 About itself or its products.** Claims a subject makes about third parties are out of
scope for a maintenance record about that subject. They MAY be maintained as claims of the
speaker, under the speaker's own registry entry, and MUST NOT be silently filed under the party
spoken about.

**1.5 Verbatim, with source and date.** The captured text MUST be the subject's own words, as
rendered to a reader, byte-for-byte within the bounds of §6. Paraphrase is not capture. Every
capture MUST carry the exact URL it came from and the UTC instant it was read.

**1.6 Hashed and timestamped.** The capture MUST be hashed by the rules in §6 so that a third
party can recompute the digest, and the digest SHOULD be committed to a timestamp whose integrity
does not depend on the maintainer (§8). This is what makes the maintainer's own record
tamper-evident. A maintenance record that only the maintainer can vouch for is a diary.

**1.7 Re-read on a schedule.** Each subsequent read produces a new `source_content_hash`. A hash
that differs from the previous read is an **observed change** and is appended to the artifact's
`observed_changes`. Nothing else happens automatically. See §4.4 — this is the load-bearing
discipline of the whole specification.

**1.8 Measured where public evidence can settle it.** Some claims can be checked against public
evidence; most cannot. A conforming maintainer measures the first kind and says `UNCHECKABLE` or
`UNMEASURED` about the second kind, plainly, in the same record and in the same vocabulary. The
honesty of a maintenance register is carried by its unmeasured entries, not by its measured ones.

---

## 2. What claim maintenance is not

A conforming maintainer MUST NOT describe its output as, and MUST NOT allow its output to be
reasonably read as, any of the following.

**2.1 It is not fact-checking.** A fact-check reaches a verdict about the truth of a statement.
Claim maintenance reaches no verdict. Where evidence exists, it publishes the claim and the
measured value side by side and lets the reader do the subtraction. Where evidence does not
exist, it publishes the claim and says so.

**2.2 It is not certification.** No conformity mark, badge, seal, licence or grade arises from
this specification. There is nothing here to pass or fail. A maintainer MUST NOT issue a mark
derived from a maintenance record, and MUST NOT permit a subject to display one.

**2.3 It is not auditing.** An audit is an engagement with a scope agreed with the audited party,
access to non-public records, and an opinion addressed to somebody. Claim maintenance is
unilateral, uses only public evidence, is addressed to nobody in particular, and offers no
opinion.

**2.4 It is not reputation scoring.** No composite score, ranking, index or league table may be
derived from maintenance states. The states are a description of the evidence available, not a
measure of the subject's quality. Counting a subject's `UNCHECKABLE` claims and calling the total
a score inverts the specification: `UNCHECKABLE` describes the *evidence*, not the *claimant*.

**2.5 It is not adversarial journalism.** The maintainer takes no position on whether a claim
ought to have been made, has no theory of the subject's intent, and is not building a case.
Subject selection MUST be disclosed (§10.3) precisely because a selection criterion is the one
place an editorial agenda can hide.

**2.6 It asserts no falsity about anyone.** This is absolute and is restated as a hard
constraint in §10.1.

---

## 3. Terminology

| Term | Meaning in this specification |
|---|---|
| **claim** | A single, separable public statement by a subject about itself or its products. |
| **capture** | The act of reading a claim from its public source and recording it per §5. |
| **artifact** | The record of one claim, conforming to §5. |
| **registry** | A set of artifacts about one or more subjects, published as one file, per §7. |
| **register** | The index of every registry a maintainer publishes, per §7.5. |
| **read** | One scheduled visit to the source URL that produces a `source_content_hash`. |
| **observed change** | A read whose `source_content_hash` differs from the previous read. |
| **finding** | A statement that a measurement produced a value. Findings arise only in `CLAIM_MEASURED`. |
| **window** | The bounded time interval a measurement covers. |
| **denominator** | The population a measured figure is a fraction or a rate of. |
| **method** | A procedure that a third party can run to obtain the same result. |

---

## 4. The state machine

Every artifact is in exactly one of four states. There are four, there are only four, and a
conforming maintainer MUST NOT invent a fifth.

```
                 ┌───────────────────┐
   first read    │                   │   evidence exists, measurement run (§4.5)
  ─────────────▶ │  CLAIM_CAPTURED   │ ────────────────────────────▶  CLAIM_MEASURED
                 │                   │                                     │
                 └─────────┬─────────┘                                     │
                           │                                               │ method or evidence
        in scope, settleable in principle,                                 │ withdrawn (§4.7)
        no measurement run yet                                             ▼
                           │                                        UNMEASURED
                           ▼                                               ▲
                     UNMEASURED  ──── measurement run (§4.5) ──────────────┘
                                          │
                                          ▼
                                    CLAIM_MEASURED

   at any time, with a recorded reason:  ──────────▶  UNCHECKABLE   (terminal until §4.8)
```

**4.1 `CLAIM_CAPTURED`.** The claim has been read from its public source, recorded verbatim,
hashed, dated and scheduled for re-reading. Nothing has been measured and nothing is asserted
about it. This is the entry state for every artifact and it is a complete, publishable state in
its own right.

**4.2 `CLAIM_MEASURED`.** A measurement against public evidence has been completed and its
`window`, `denominator`, `method` and `result` are recorded in the artifact. `CLAIM_MEASURED`
means *a measurement exists beside this claim*. It does **not** mean the claim is true, and it
does **not** mean the claim is false. A maintainer MUST NOT render this state to a reader as a
verdict, a pass, a fail, a tick or a cross.

**4.3 `UNMEASURED`.** The claim is in scope and could in principle be settled by public evidence,
but no measurement has been run. `UNMEASURED` is a first-class state and MUST be published as
prominently as any other. A maintainer MUST NOT omit unmeasured claims from a registry, MUST NOT
report a maintained population as though the unmeasured part of it did not exist, and MUST NOT
substitute a plan, an intention or a queue position for a measurement.

**4.4 `UNCHECKABLE`.** No public evidence can settle the claim. The artifact MUST record *why* in
`uncheckable_reason` — typically: the claim is non-quantitative ("institutional-grade"); it
depends on an internal counter no third party can recompute; the evidence is behind a credential;
or the claim is about intent or future action. `UNCHECKABLE` is a statement about the evidence
available to the public, never about the subject's honesty.

**4.5 What MAY move a claim to `CLAIM_MEASURED`.** All five of the following, together:

1. a named **public evidence source**, reachable by a stranger, recorded with its own access date
   and content hash;
2. a bounded **`window`**;
3. an explicit **`denominator`** where the result is a rate, share, fraction or "majority" claim;
4. a **`method`** stated in enough detail that a third party can re-run it and obtain the same
   value, including the exact selection rule and every exclusion;
5. a **`result`** carrying its own `n`, and a **`does_not_prove`** list (§5.4).

**4.6 What MUST NEVER move a claim to `CLAIM_MEASURED`.** The following are each, individually,
disqualifying:

- **The subject's own restatement.** A subject confirming its own claim is not evidence; it is
  the claim again.
- **The absence of contradicting evidence.** Not finding a counterexample is not a measurement.
- **A language model's opinion**, a model-as-judge score, or any automated grader whose output
  has not itself been measured against a labelled ground truth published with the result.
- **A partial read totalled as a population.** Where a fan-out over `N` sources returns only `k`
  of them, the result covers `k`; the remaining `N − k` are `UNMEASURED` and MUST be reported as
  such. Dividing by `k` and presenting the ratio as the population figure understates the
  unmeasured share and is a conformance failure.
- **Payment, sponsorship, membership or any commercial relationship** with the subject (§10.2).
- **A plan.** `measurement_plan` is prose about intent. Prose is not a measurement, and a
  maintainer MUST NOT allow a well-written plan to be read as one.
- **An observed change.** See §4.9.

**4.7 Withdrawal.** If a method is found defective or an evidence source is withdrawn, the
artifact returns to `UNMEASURED` and the defective measurement is preserved in
`superseded_measurements` with the reason. It MUST NOT be deleted, and a signed artifact MUST NOT
be edited in place (§9.4).

**4.8 Leaving `UNCHECKABLE`.** An `UNCHECKABLE` claim MAY move to `UNMEASURED` if new public
evidence appears that could settle it. The transition MUST record what appeared.

**4.9 The boundary between an observed change and a finding.** This is the discipline that makes
the whole specification honest, and it is stated here as a rule rather than a preference.

An **observed change** is: *the bytes at this URL differ from the bytes recorded at the previous
read*. That is the entire content of the statement. It is a fact about two digests held by the
maintainer.

A **finding** is: *a measurement was performed and produced this value, over this window, with
this denominator, by this method*.

A conforming maintainer:

- **MUST** record observed changes as observed changes, in neutral language, naming the two
  digests and the two access dates, and nothing more;
- **MUST NOT** characterise an observed change with any word implying motive, concealment or
  wrongdoing — including *quietly*, *scrubbed*, *walked back*, *buried*, *removed the evidence*,
  *backtracked*;
- **MUST NOT** report the removal or alteration of a claim as evidence about the claim's truth.
  A subject may change its website for any reason, including a better reason than the
  maintainer's;
- **MUST NOT** aggregate observed changes into a count presented as a measure of the subject;
- **MAY** record that a claim was present at one read and absent at the next, in exactly those
  words, because that is the observation.

The maintainer's record of an observed change is a record of what the maintainer saw. It is never
an allegation about why.

---

## 5. The claim artifact

**5.1 Shape.** An artifact is a JSON object. The machine-readable schema is published beside this
document at
[`schema/claim-artifact-v0.1.schema.json`](schema/claim-artifact-v0.1.schema.json).

```json
{
  "schema": "csoai.claim-maintenance.artifact/0.1",
  "claim_id": "CL-3",
  "subject": {
    "name": "Example Corp",
    "identifier": "https://example.com/",
    "identifier_kind": "url"
  },
  "claim_verbatim": "market leader powering the majority of the sector",
  "claim_type": "market-share",
  "source_url": "https://example.com/",
  "access_date": "2026-09-22T14:05:11Z",
  "source_content_hash": {
    "alg": "sha256",
    "value": "9f2c…",
    "covers": "visible-text"
  },
  "claim_hash": "3ab0…",
  "state": "UNMEASURED",
  "measurement_plan": "majority = >50%; sector share estimable from the public breakdown at <source>; capture weekly against the claim",
  "window": null,
  "denominator": null,
  "method": null,
  "result": null,
  "does_not_prove": [
    "that the claim is false",
    "that the public breakdown is a complete census of the sector"
  ],
  "observed_changes": [],
  "next_read_utc": "2026-09-29T00:00:00Z",
  "conflicts": []
}
```

**5.2 Required fields.** `schema`, `claim_id`, `subject`, `claim_verbatim`, `source_url`,
`access_date`, `source_content_hash`, `claim_hash`, `state`, `does_not_prove`,
`observed_changes`, `next_read_utc`.

**5.3 Conditionally required fields.**

| Field | Required when |
|---|---|
| `measurement_plan` | `state` is `CLAIM_CAPTURED` or `UNMEASURED` |
| `window`, `method`, `result` | `state` is `CLAIM_MEASURED` |
| `denominator` | `state` is `CLAIM_MEASURED` **and** `result` is a rate, share, fraction, proportion or a "majority"/"most"/"leading" claim |
| `uncheckable_reason` | `state` is `UNCHECKABLE` |
| `superseded_measurements` | a measurement has been withdrawn (§4.7) |

**5.4 `does_not_prove`.** Every artifact MUST carry a non-empty `does_not_prove` array naming
what a reader might wrongly conclude from it. This field is not decorative. It is the field that
stops a maintenance record from being read as an accusation, and a conforming maintainer treats
an empty `does_not_prove` as a malformed artifact. For an artifact in any state other than
`CLAIM_MEASURED`, `does_not_prove` MUST include a statement that the record does not indicate the
claim is false.

**5.5 `claim_verbatim`.** The subject's rendered words. A maintainer MAY normalise whitespace per
§6.3 and MUST NOT otherwise alter the text — no correction of spelling, no expansion of
abbreviations, no removal of marketing punctuation. Where a claim is longer than is practical to
carry, the artifact MUST record a contiguous excerpt with an explicit `excerpt: true` and the
`source_content_hash` of the full captured region, never an edited-together composite.

**5.6 `source_content_hash.covers`.** One of:

- `visible-text` — the text a reader sees, extracted per §6.3. RECOMMENDED for web pages, because
  a raw-HTML digest changes on every unrelated deployment and produces observed changes that
  carry no information about the claim.
- `raw-bytes` — the exact response body. REQUIRED for API responses and filed documents.
- `response-json-canonical` — the canonical form (§6.1) of a parsed JSON response, for APIs whose
  key order is not stable.

The choice MUST be recorded, because a digest whose coverage is unstated cannot be reproduced.

**5.7 Identity.** `subject.identifier` MUST be a stable public identifier — a domain, a company
register number, an LEI, a DID, a contract address with its chain — and `identifier_kind` MUST
name which. A subject named only by trading name is not identified: two organisations may share
a name, and a maintenance record attached to the wrong one is a defect of the most serious kind.

---

## 6. Canonicalisation and hashing

A third party MUST be able to recompute every digest this specification produces. These rules are
sufficient to do that.

**6.1 Canonical JSON bytes.** To canonicalise a JSON value:

1. Recursively sort every object's keys ascending by Unicode code point.
2. Serialise with no insignificant whitespace: `,` between members and `:` between key and value,
   with nothing either side.
3. Encode as UTF-8.
4. Reject `NaN`, `Infinity` and `-Infinity`.
5. Numbers MUST be integers, or decimal values carried as JSON **strings**. Floating-point
   numbers MUST NOT appear in a canonicalised structure: their shortest round-trip
   representation varies between runtimes, and a digest that varies between runtimes is not a
   digest. A measured ratio is carried as `"0.5126"`, not as `0.5126`.

This is the same canonicalisation the maintainer's other signed artifacts use, so one
implementation serves both.

**6.2 `claim_hash`.** `claim_hash = SHA-256( UTF-8( claim_verbatim ) )`, hex, lower case. It
covers the claim text alone and nothing else, so that the same sentence found on two surfaces
hashes identically and can be recognised as the same claim.

**6.3 Visible-text extraction.** When `covers` is `visible-text`, the maintainer MUST, in this
order:

1. remove `<script>`, `<style>`, `<template>`, `<noscript>` and comment nodes, including their
   contents;
2. take the concatenated text of the remaining nodes in document order;
3. replace every run of Unicode whitespace with a single space (U+0020);
4. normalise to Unicode NFC;
5. trim leading and trailing whitespace;
6. hash the UTF-8 bytes of the result with SHA-256.

The extraction rule MUST be published with the digest, because a digest computed by an
unspecified extractor is not reproducible. Implementations of steps 1–2 differ; a maintainer
SHOULD therefore publish the extracted text itself, or its length in characters, alongside the
digest so a third party can tell an extractor difference from a content change.

**6.4 Artifact digest.** `artifact_sha256 = SHA-256( canonical_json( artifact ) )` where the
artifact object is taken **without** its own `artifact_sha256` and `sig` fields. A field cannot
be inside its own digest.

**6.5 Everything a relying party reads MUST be inside the digest.** This is stated as a rule
because its violation is the most damaging failure available to a system like this. If the digest
covers only a payload sub-object, then `subject`, `source_url` and `claim_verbatim` sit outside
it, and a record whose subject and evidence URL have both been rewritten will still verify. An
artifact digest MUST cover every field except those of §6.4.

---

## 7. Registries, the register, and Merkle construction

**7.1 A registry** is a JSON document carrying a set of artifacts for one or more subjects, plus
`schema`, `registry_id`, `created_utc`, `maintainer`, and a `registry_digest`. `registry_digest`
is the §6.4 digest of the registry object without `registry_digest` itself.

**7.2 Merkle construction (RFC 9162).** Where a maintainer commits a set of artifacts to a single
root, the construction MUST be RFC 9162 §2.1:

```
MTH({})        = SHA-256()                                  # the empty string
MTH({d0})      = SHA-256( 0x00 || d0 )                      # leaf
MTH(D[n])      = SHA-256( 0x01 || MTH(D[0:k]) || MTH(D[k:n]) )
                 where k is the largest power of two strictly less than n
```

The domain-separation prefixes are REQUIRED: `0x00` before a leaf, `0x01` before an internal
node. Without them a leaf digest can be presented as an internal node and a second-preimage
attack on the tree becomes available. The split at the largest power of two below `n` is
REQUIRED. There is **no duplication of an odd final node** in RFC 9162.

**7.3 Disclosure: our separate public root does not use this shape.** The maintainer operates an
older, separate Merkle root — the public card root at `https://councilof.ai/root.json` — which
**duplicates the odd final node** at each level and uses **no domain-separation prefixes**. That
construction admits the CVE-2012-2459 collision: for some `n`, a tree of `n` leaves and a tree of
`n + 1` leaves (where the extra leaf is a duplicate of the last) share a root. It is disclosed
here rather than hidden, and the count of leaves is signed alongside that root precisely so the
ambiguity is closed by the signed count. New work under this specification uses §7.2. The two
roots are separate structures over separate corpora and MUST NOT be reconciled, added together,
or substituted for one another.

**7.4 Inclusion proofs.** A proof MUST record, for each step, the sibling digest **and the side**
it is on. A verifier MUST NOT be required to infer the side from the index, because the index is
not carried in the proof and an implementation that guesses will verify a proof that is wrong
half the time.

**7.5 The register.** The register is the index of every registry the maintainer publishes. It
MUST be **generated from the registry files that exist**, never hand-listed, and it MUST carry an
`as_of`. For each subject it records: the subject identity, the number of claims, the count in
each state, the first-captured date, the last-read date, the next scheduled read, and the URL of
the registry artifact. A register MUST report the population it actually holds. A maintainer MUST
NOT pad a register with subjects it intends to maintain; an intention is not a subject, and a
small register that grows is worth more than a large one that is partly fiction.

---

## 8. Timestamping discipline

**8.1 The vocabulary is fixed.** Three words, three meanings, never interchanged:

| Word | Means |
|---|---|
| **submitted** | The digest was sent to a timestamp calendar. Nothing has been confirmed. The receipt is a promise, not a proof. |
| **pending** | Submitted, and the calendar has not yet returned an attestation. |
| **anchored** | The receipt has been **upgraded** to carry a complete attestation path to a block, **and that path has been verified** by the maintainer. |

**8.2 `submitted` is not `anchored`.** A conforming maintainer MUST NOT describe a submitted or
pending receipt as anchored, timestamped-in-Bitcoin, or notarised. An OpenTimestamps `.ots` file
produced at submission time contains only a calendar commitment; it is a file with a `.ots`
extension and no attestation in it. **The extension is not the proof.** A maintainer MUST verify
the contents before using the word.

**8.3 Upgrade or it is invisible.** A receipt that is never upgraded stays a calendar fragment
forever even after the underlying commitment has been included in a block. A conforming
maintainer MUST run the upgrade step on a schedule and MUST publish the upgraded receipt, or the
anchoring it paid for is invisible to every relying party.

**8.4 What a timestamp proves.** That these exact bytes existed no later than the attested time.
It does not prove who created them, that they are correct, that the claim they describe is true,
or that the maintainer read the source honestly. Every artifact's `does_not_prove` SHOULD say so
where a timestamp is cited.

**8.5 Timestamping is OPTIONAL but RECOMMENDED.** A maintainer with no timestamps may conform to
this specification; it simply has a weaker answer to "how do we know you did not rewrite this
later". A maintainer that claims timestamps and cannot show verified attestations does not
conform.

---

## 9. Signature binding and verification

**9.1 Signatures are OPTIONAL.** Hashing needs no key. A registry may be published unsigned and
timestamped instead, and a conforming maintainer MUST state which of the two it has rather than
implying both. An unsigned registry says *these bytes existed by this time*; a signed registry
says *this key committed to these bytes*.

**9.2 Binding.** Where a registry or artifact is signed, the signature MUST be Ed25519 over the
canonical bytes of §6.4 — the object with `artifact_sha256`/`registry_digest` and `sig` removed.
The signature value is carried as lower-case hex or as base64url, and the encoding MUST be named
in the artifact. Do not leave a reader to guess: an implementation that assumed base64 for a hex
signature has, in practice, reported a valid signature as invalid.

**9.3 Verification against a DID document.** A verifier:

1. reads `sig.key_id`, a DID URL such as `did:web:example.org#key-1`;
2. resolves the DID document — for `did:web`, `https://<domain>/.well-known/did.json`;
3. selects the verification method whose `id` matches `key_id` and whose `type` is
   `Ed25519VerificationKey2020` or `JsonWebKey2020` with `crv: Ed25519`;
4. decodes the public key (`publicKeyMultibase` or `publicKeyJwk`);
5. recomputes the canonical bytes per §6.4 and checks the signature over them.

Verification MUST be possible offline given the artifact and a copy of the DID document, and MUST
NOT require any endpoint the maintainer controls.

**9.4 Signed bytes are never edited.** Once an artifact has been signed and published, its bytes
are frozen. A correction is published as a **new** artifact that names the one it supersedes, and
the superseded artifact stays retrievable. Editing signed bytes in place produces a record that
fails its own signature while looking exactly like a forgery; the maintainer's own tooling should
refuse it.

**9.5 A valid signature proves authorship, not correctness.** A signature over a measurement that
was performed wrongly is a sound signature over a wrong number. Verification answers *who
committed to these bytes*; it never answers *is this right*.

---

## 10. Conflict of interest and non-allegation

**10.1 Non-allegation (absolute).** A conforming maintainer **asserts no falsity about anyone.**
No artifact, registry, register, page, feed, headline or summary derived from this specification
may state or imply that a subject's claim is false, misleading, deceptive, exaggerated,
fraudulent or dishonest. Where a measurement differs from a claim, the artifact records the
claim, the measured value, the window, the denominator and the method — and stops. The reader
draws the conclusion; the maintainer does not draw it for them. Words of motive and words of
verdict are both out of bounds.

**10.2 No contingent payment.** The maintainer MUST NOT accept any payment, in any form, that is
contingent on what is published about a subject, and MUST NOT sell any state, position or
removal. A subject cannot pay to be measured sooner, to be measured differently, or to be
removed from a register.

**10.3 Disclosure.** Every artifact carries a `conflicts` array. Any commercial relationship,
membership, shared investor, employment, or standards-body co-participation between the
maintainer and the subject MUST be named there, at the artifact level, where a reader of that one
record will see it. A disclosure in a policy page that the artifact does not link is not a
disclosure. Subject-selection criteria MUST be published for the register as a whole.

**10.4 A listing is not an endorsement — and not an accusation.** Presence in a register means
only that the maintainer is watching a public page. It confers nothing and alleges nothing.
Registers MUST say so in the register document itself, not only on a web page about it.

**10.5 Right of reply.** The maintainer MUST publish a working contact for the subject to report
a defect in a maintenance record, MUST correct defects, and MUST publish its own corrections
where a relying party can find them. A maintainer that corrects only privately is asking to be
trusted rather than checked.

**10.6 Self-application.** A maintainer SHOULD maintain its own public claims under this
specification, in the same register, in the same states. A body that observes others' claims and
exempts its own is not applying a discipline; it is running a campaign.

---

## 11. Conformance

An implementation conforms to Claim Maintenance v0.1 if and only if:

1. every artifact it publishes validates against the schema at
   [`schema/claim-artifact-v0.1.schema.json`](schema/claim-artifact-v0.1.schema.json);
2. every artifact is in exactly one of the four states of §4, with the conditionally required
   fields of §5.3 present;
3. every digest it publishes is reproducible from the published bytes by the rules of §6;
4. no claim is in `CLAIM_MEASURED` without all five elements of §4.5, and none was moved there by
   anything in §4.6;
5. observed changes are recorded per §4.9 and are nowhere presented as findings;
6. `submitted`, `pending` and `anchored` are used per §8.1;
7. the register is generated from the registries on disk per §7.5 and carries an `as_of`;
8. nothing it publishes asserts falsity about any subject (§10.1);
9. no mark, badge, score, rank or index is derived from any state (§2.2, §2.4);
10. conflicts are disclosed at artifact level (§10.3).

A maintainer MAY publish a self-assessment against this list. This specification defines no
certifying body, issues no mark, and none may be created in its name.

---

## 12. Versioning

Versions are directories: `/spec/claim-maintenance/v0.1/`, `/spec/claim-maintenance/v0.2/`, and
so on. A published version is **never edited**. v0.2 supersedes v0.1 by existing and by naming
it; v0.1 stays at its URL, with its original bytes and its original date, so that anything that
cited it keeps resolving to what was actually cited. The version index at
`/spec/claim-maintenance/` lists every version, its date, its digest and its status.

Artifacts name the version they conform to in `schema`. An artifact written to v0.1 stays
conforming to v0.1 forever; a later version does not invalidate it.

---

## 13. Reference implementation

A runnable implementation is published with this specification under the repository's code
licence (MIT), separately from this document's CC0 dedication:

- `scripts/claim-capture.mjs` — captures a claim from a public page, extracts visible text per
  §6.3, computes both digests per §6, and writes a conforming artifact.
- `scripts/claim-capture.mjs --verify <file>` — recomputes the artifact digest and validates the
  state machine and the §5.3 conditional requirements.
- `scripts/claim-maintenance-register.mjs` — generates the register from the registries on disk
  per §7.5.
- `scripts/claim-capture.test.ts` — includes a test that proves the verifier **rejects** a
  tampered artifact.

A specification with no runnable implementation is a manifesto. Run it:

```
node scripts/claim-capture.mjs --url https://example.com/ --subject "Example Corp" \
     --claim "market leader powering the majority of the sector" --out artifact.json
node scripts/claim-capture.mjs --verify artifact.json
```

---

## 14. Normative and informative references

- **RFC 2119**, **RFC 8174** — requirement keywords.
- **RFC 9162** — Certificate Transparency v2.0, §2.1 Merkle tree definition (leaf `0x00`, node
  `0x01`, split at the largest power of two below `n`).
- **RFC 6234** — SHA-256.
- **RFC 8032** — Ed25519.
- **RFC 8785** — JSON Canonicalization Scheme. Informative: §6.1 is compatible in intent, and
  constrains numbers further (§6.1 step 5) rather than relying on shortest round-trip
  serialisation.
- **W3C Decentralized Identifiers (DIDs) v1.0** — DID document resolution, `did:web`.
- **CVE-2012-2459** — the odd-node-duplication collision disclosed in §7.3.
- **OpenTimestamps** — calendar submission and receipt upgrade, §8.

---

## 15. Licence and status

This document is dedicated to the public domain under **CC0 1.0 Universal**. To the extent
possible under law, Council of AI (CSOAI Ltd) has waived all copyright and related rights to this
specification. You may implement it, fork it, translate it, embed it in another standard, or
publish a competing version, without permission and without attribution.

The reference implementation is licensed separately under MIT, as the repository's code licence.

This is version 0.1. It will be wrong in places. Corrections are published at
https://councilof.ai/api/corrections and may be sent to nicholas@csoai.org.
