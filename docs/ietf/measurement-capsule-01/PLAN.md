# draft-templeman-scitt-measurement-capsule: -00 to -01 revision plan (DRAFT, nothing posted)

Prepared 2026-09-28 by the standards lane. Nothing here has been sent, posted or uploaded.

- Branch: `lane/standards-20260928`, in the staging mirror, under `docs/ietf/measurement-capsule-01/`.
  - `PLAN.md` is this file.
  - `draft-templeman-scitt-measurement-capsule-01.xml` is the xml2rfc skeleton.
  - `make_skeleton.py` builds the skeleton from the posted -00 XML.
  - `test-vectors/` holds `vectors.json`, `gen_vectors.py` and `check_vectors.py`.
- Cutoff: the IETF 127 Internet-Draft submission cutoff is **2026-11-02 23:59 UTC**. Source: datatracker.ietf.org/meeting/127/important-dates, read 2026-09-28.
- Base: -00 was posted 2026-09-27. The Datatracker API reads rev 00, expiring 2027-03-31.

## 1. What -01 must add

### A. COSE_Sign1: from "not implemented" to specified and produced

| # | Change | Where | Status |
|---|---|---|---|
| A1 | Normative protected header. alg -19 (Ed25519, RFC 9864; -8 is deprecated there, so it is excluded). kid = UTF-8 DID URL. CWT Claims 15 carries iss, sub and iat. The header uses core deterministic CBOR (RFC 8949 §4.2.1). | §6.1 | Written in the skeleton |
| A2 | **Fix a -00 error.** -00 put content type (3) on the hash-envelope form. RFC 9995 says label 3 MUST NOT be present there; the media type goes in 259. | §6.1 | Written; control N5 covers it |
| A3 | Register per batch record and per index, never per capsule. Capsule to batch root is an RFC 9162 audit path; batch to log is the Receipt. | §6, §7 | Written |
| A4 | COSE is a new artefact over unchanged content. capsule_id values and roots do not change, and the existing JSON signatures stay valid. Publish both side by side, as new files: never edit a published record. | §6.2 | Written |
| A5 | Produce real COSE statements for each published batch record and the index, using the production key. | Implementation | **HELD**, see §3 ask 2 |

**Dependency for A5 (read at mirror master 982fe3f6d, `functions/api/board-sign.ts`):**

- The production signer signs only `canonical(payload object)`. The payload must be JSON and 3 KB or less.
- It cannot sign a CBOR Sig_structure.
- COSE therefore needs one of:
  - a new signer mode that accepts a Sig_structure, checks that the structure parses and that its protected header matches this profile, and signs it; or
  - a separate COSE key published in the DID document.
- Either one is signing-lane (K3) and owner work. This lane touched neither.

### B. One real Transparency Service receipt

| # | Change | Status |
|---|---|---|
| B1 | Register the index statement over SCRAPI (draft-ietf-scitt-scrapi-11, in the RFC Editor queue). POST /entries, follow the 303, then poll until the Receipt is returned. | Plan only |
| B2 | Verify the Receipt (RFC 9942 COSE Receipt; CCF profile draft-ietf-scitt-receipts-ccf-profile-05 if the service runs on CCF) with a verifier we did not write, such as microsoft/scitt-verifier, as well as our own. Publish the statement with the Receipt under label 394. | Plan only |
| B3 | §7 names the service, its operator, the entry id, the Receipt SHA-256 and the verifiers. If no Receipt exists on posting day, §7 says so and nothing more. | Placeholder in the skeleton |

**No open operator has been found yet.**

- Microsoft's Signing Transparency is "currently scoped to specific Microsoft services". Source: Microsoft Learn, page updated 2026-06-14, read 2026-09-28.
- `app.datatrails.ai` did not answer from the build pod on 2026-09-28 (curl 000).
- A self-hosted `scitt-ccf-ledger` would give a real Receipt. But the operator would be the Issuer, and experiment outcome 2 asks for "a Transparency Service operated by another party". The text must say so, and it cannot count toward outcome 2.
- This is **HELD** on owner ask 1.

### C. Test vectors (done on the branch)

What the vectors are:

- **All synthetic.** The key is RFC 8032 §7.1 TEST 1, whose secret is published there. Subjects are `.example` hosts. Source digests are SHA-256 hashes of labelled placeholder strings.
- **Positive vectors:**
  - V1: five capsules, as JCS bytes plus capsule_id.
  - V2: the batch record, the RFC 9162 root, and an audit path for leaf 2 of 5.
  - V3: COSE_Sign1 with an attached payload.
  - V4: COSE_Sign1 with a hash envelope.
- **Controls:** N1 to N6. Each is built to be rejected and names the single rule it breaks: forbidden member, source not a digest, stored line not JCS, flipped payload byte, label 3 inside a hash envelope, duplicated last leaf.

Proofs, run on the build pod on 2026-09-28:

- `gen_vectors.py --check` regenerates `vectors.json` byte for byte: 24,356 bytes, sha256 `33d15454…6c6a55`.
- `check_vectors.py` runs on a second code path: rfc8785 0.1.4, cbor2 6.1.4 and cryptography 50.0.1, with inclusion checked by RFC 9162 §2.1.3.2. Result: **32 checks, 32 pass, 0 miss.**
- `check_vectors.py --isolation` relaxes one rule at a time. For each of the 6 rules, only the control that names that rule flips; the other 31 checks are unchanged.
- pycose 1.1.0 cannot decode alg -19 ("Bytes cannot be decoded as COSE message"). The checker records that path as "not run", never as a pass. Implementers on that library will need -19 support. This is worth one line in -01 §13.
- Limit: the checker is ours too. It is a second code path, not the independent implementation that experiment outcome 1 asks for.
- Still to do (C4): one vector built from a real published batch, the a2a_card batch with 33 capsules: a leaf plus its audit path, checked against the published root.

### D. Corrections to -00 text

| # | -00 text | -01 |
|---|---|---|
| D1 | §6: content type (3) given for the hash envelope | Fixed (A2); listed in Appendix C |
| D2 | §7: the state vocabularies are hand-listed inline | Moved to Appendix B, generated from the implementation's vocabulary file so that text and code cannot drift |
| D3 | §12: every figure is dated 26 Sep (13,184 capsules, 8 batches, roots, Rekor indexes) | None carried over. Re-read live on posting day, with the time of reading |
| D4 | §12: the source URL and commit (HF `csoai/evidence-index`, commit `10094094`) | Re-check that they resolve on posting day |
| D5 | One phrase in §2 (the REJECTED ladder label) and one in §11 (what a signature does not show) use words on the outward gate's NOTICE_BANNED list | Reworded in the skeleton: "an identity check did not pass" and "that the subject agrees with the measurement" |
| D6 | The full RFC 7942 boilerplate has a sentence on what a listing does not imply for the IETF, and its wording is also on the NOTICE_BANNED list | Shortened to a one-sentence RFC 7942 pointer. RFC 7942 suggests that text but does not mandate it |
| D7 | The a2a_card_signature kind has a state token spelled F-A-I-L-E-D, which NOTICE_BANNED matches wherever Appendix B prints it. The title of normative reference RFC 9162 also begins with a word on that list, and a title cannot be changed | **Owner decision** (§3 ask 3). Until then the rendered -01 scores 5 of 6 on the gate, and its only hit is the RFC 9162 title |

### E. Open issues from -00 §13, and what -01 does with each

| # | Issue | In -01 |
|---|---|---|
| 1 | COSE_Sign1 | Closed by A1–A4 |
| 2 | Superseded capsule_id in correction_pointer | Open. Needs capsule schema 0.3 and new batches |
| 3 | Per-kind allowlist of member names | Open. Appendix B covers state vocabularies only |
| 4 | Neutral names for `csoai.`-prefixed identifiers and media types | Open. A rename changes every identifier, so it would ship as new batches |
| 5 | Blinded digests | Open |
| 6 | Observation-only kinds | Open |
| 7 | Explicit self-measurement member | Open. Schema 0.3 |
| 8 | (new) TS registration policies differ in the Issuer forms they accept (did:web vs did:x509) | Added |

### F. References (Datatracker API, read 2026-09-28)

- **Add, normative:**
  - RFC 8949 (CBOR).
  - RFC 9942 (COSE Receipts; formerly draft-ietf-cose-merkle-tree-proofs-18).
  - RFC 9995 moves from informative to normative, because §6.1 now states MUSTs from it.
- **Add, informative:**
  - draft-ietf-scitt-receipts-ccf-profile-05 (2026-09-23).
  - draft-farley-acta-signed-receipts-03 (2026-09-04). It is added to the §1 survey of action receipts, and it also settles the naming question (see SIGNED-RECEIPTS-NAMING-NOTE-2026-09-28.md).
- **Current revisions, to re-read on posting day:**
  - scrapi -11
  - mih-sokolov-scitt-payload-binding -05
  - schrock-ep -13
  - marques-asqav -09 (2026-09-21)
  - sahu -00
  - noa -01
  - hopley -02
  - dogru-cedulon -03
- The skeleton pulls the new ones from bib.ietf.org with xi:include. It rendered with **xml2rfc 3.34.1: 0 warnings, 0 errors, no line over 72 characters.**

## 2. Schedule to the cutoff

| By | What | Who |
|---|---|---|
| 2026-10-09 | Choose the TS route (ask 1) and the COSE signer route (ask 2) | Owner, K3 |
| 2026-10-16 | Signer mode live. COSE statements generated for every published batch record and the index, then checked by `check_vectors.py`-style verification and by a second verifier | K3, standards |
| 2026-10-23 | If a route exists: register the index and verify the Receipt with a verifier we did not write | Standards (owner consent where terms or accounts are involved) |
| 2026-10-28 | Fill every placeholder from live artefacts. Generate Appendix B. Add vector C4 | Standards |
| 2026-10-30 | idnits clean, render clean, outward gate at 100% on the rendered text. Owner reads the whole thing | Standards, owner |
| 2026-10-31 | Owner uploads the XML on the Datatracker, which is owner-only. That leaves a two-day margin before 2026-11-02 23:59 UTC | Owner |

If A5 or B slips, -01 still ships A1–A4, C and D, with §6.2 and §7 saying plainly what does not exist yet.

## 3. Owner asks (HELD items)

1. **Transparency Service route.** Choose one:
   - (a) One short scitt@ note asking whether any participant runs a service that accepts third-party registrations. This is a list post, so the owner sends it.
   - (b) A self-hosted service, labelled self-operated.
   - (c) No Receipt in -01.
2. **COSE signing.** Either approve a Sig_structure mode on the signer, or a separate COSE key in the DID document (K3).
3. **Two tokens against the outward gate.**
   - The state token F-A-I-L-E-D: either rename it in capsule schema 0.3 through a correction batch, or allow a documented exception.
   - The RFC 9162 reference title: this can only be handled by an exception.
   - An exception would cover vocabulary tokens and cited titles in the I-D only.
4. **Upload** -01 on the Datatracker by 2026-10-31.

## 4. Not in scope for -01

- Registering the vendor media types.
- Renaming `csoai.` identifiers.
- Blinded digests.
- Any claim that the experiment's outcomes have been met. None has been: there is no independent implementation, no Receipt from another party, and no effect_reference populated.
