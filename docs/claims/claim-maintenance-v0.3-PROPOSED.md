# Claim Maintenance v0.3: proposed changes (draft, not published)

**Status.** A proposal. It is not a version of the specification and nothing in it is normative. Version 0.2
(2026-09-25, https://councilof.ai/spec/claim-maintenance/v0.2/, document sha256
`d649ba0fdefb63abc205102bc8863db2e7852b207fd4e9e23e05e286e13e3b2e`) is current and is not edited: a
published version is superseded, never edited (v0.2 §12). The v0.2 Zenodo deposit is prepared separately
and does not wait for this.

**Where the changes come from.**
- The first maintained claim prepared for publication with the subject's agreement: a publisher's signed
  market-data feed, drafted 26–28 September 2026. That record is not yet published, so this note does not name
  the subject or quote private correspondence.
- The two signed-receipts corrections of 28 September 2026 (C-2026-0928-01 and C-2026-0928-02 in
  https://councilof.ai/api/corrections), which changed how a verifier reports a key it cannot resolve.

Each item names the v0.2 section it would amend, the proposed text, and whether it changes what a
conforming maintainer must do.

## P1. Signature coverage of the subject's own signed data (§5, §9)

**Seen.** The subject signed each record, but its first signature covered four of the record's fields.
Other fields could be changed without the signature noticing. The maintainer's own early message described
the uncovered fields as signed, which was wrong, and the draft record carries that error in its history.

**Proposed.** When a claim concerns data the subject itself signs, the claim artifact MUST record the
signature's coverage: the list of fields bound by the signature, read from the signed bytes or the
subject's published canonical form, and the fields present in the record but outside that list. An
artifact MUST NOT describe a field outside the coverage as signed. Where the subject publishes more than
one signature scheme over the same record, each is recorded with its own coverage.

**Conformance.** Changes it (a new MUST).

## P2. Where a verification key was read, and who controls it (§9.3)

**Seen.** The subject's key was first published only on the endpoint that signs the data. After the
finding it also published the key on a second host, with a rotation note. Both hosts sat under one domain
and one DNS operator: hosting was separated, control was not.

**Proposed.** For every key used to verify a subject's signature, the artifact MUST record the URL it was
read from, whether that host also serves the signed data, and the control boundary observed (domain and
DNS operator). It MUST NOT state that two copies of a key are independent when one party controls both.

**Conformance.** Changes it (a new MUST).

## P3. Three verification results (§9.3)

**Seen.** v0.2 §9.3 says how to verify against a DID document but not what to report when the document
cannot be read. The signed-receipts reference verifier reported such a case as valid until 28 September
2026 (C-2026-0928-01).

**Proposed.** A verifier MUST return exactly one of `VALID`, `INVALID` and `UNVERIFIABLE_KEY`, checking
integrity first. A key that cannot be resolved gives `UNVERIFIABLE_KEY`, never `VALID`. This is the rule of
signed-receipts/v1 draft 0.3 §5, so the two specifications report the same case the same way.

**Conformance.** Changes it for verifiers.

## P4. The source of every dated event (§4, history)

**Seen.** Several dates in the draft record come from the subject's own messages. One was corrected at the
subject's request after drafting. One observation was recorded from the maintainer's own message because
the working files of that run were not kept.

**Proposed.** Each dated entry in a claim's history MUST carry its source class: `public` (a URL anyone can
read), `private` (correspondence, never used as a claim, v0.2 §1.3), or `reported` (the maintainer does not
hold the evidence). A time given only by the subject is labelled as the subject's account until
established independently. A later correction of a date is published as a dated revision of the record,
never as a silent edit (v0.2 §9.4 already requires this for signed bytes).

**Conformance.** Changes it (a new MUST).

## P5. Claims about an event that has not happened (§4)

**Seen.** One claim promised behaviour on key rotation. No rotation had happened, so there was nothing to
observe.

**Proposed.** A claim whose truth depends on a future event stays `UNMEASURED` until the event occurs. The
artifact MUST carry the re-read plan (cadence, what will be compared, what would count as observed) and
MAY record the current state without comment.

**Conformance.** Clarifies v0.2 (UNMEASURED already applies); the re-read plan is new.

## P6. Record of the subject's agreement to publish (§10)

**Proposed.** Where a maintained claim is published with the subject's agreement, the artifact MUST record
the date and scope of that agreement and state that no private statement is used as a claim. Agreement to
publish is not agreement with the measurement, and the artifact MUST NOT present it as such.

**Conformance.** Changes it for consented publications only.

## P7. Re-check on fresh data before publication (§8)

**Proposed.** A record drafted from earlier reads MUST be re-checked on fresh data on the day of
publication. The published artifact names both observation windows, and any difference between them is
recorded, not smoothed over.

**Conformance.** Changes it (a new MUST).

## Next step

Owner decision: whether v0.3 is cut from these items, and when. The subject's record should be published
first (planned for 1 October 2026, after the subject's written agreement), so that v0.3 can cite it by URL
instead of describing it without a name.
