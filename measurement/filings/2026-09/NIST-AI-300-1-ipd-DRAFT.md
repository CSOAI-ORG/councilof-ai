# DRAFT — not submitted

| Field | Value |
|---|---|
| Regulator | U.S. National Institute of Standards and Technology (NIST), AI Standards "Zero Drafts" pilot |
| Ref | **NIST AI 300-1 ipd** — *Guidance and Templates for Public-Facing AI Documentation: An AI Standards "Zero Draft" (Initial Public Draft)*, July 2026, Amironesei & Dunietz, doi:10.6028/NIST.AI.300-1.ipd |
| Official URL | https://www.nist.gov/publications/guidance-and-templates-public-facing-ai-documentation-ai-standards-zero-draft-initial · PDF https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.300-1.ipd.pdf · project page https://www.nist.gov/artificial-intelligence/ai-research/nists-ai-standards-zero-drafts-pilot-project-accelerate |
| Closing date (verified) | **16 September 2026.** PDF, Note to Reviewers: "NIST will consider input received by September 16, 2026. Input received later may still be considered for NIST inputs to subsequent standardization processes…". The project page says the same. Retrieved 2026-09-14T10:35:42Z (publication page, HTTP 200) and 2026-09-14T10:35:43Z (PDF, HTTP 200). |
| Submission route | Email **ai-standards+doczd@nist.gov**. NIST "strongly encourages" its optional commenting template, but also accepts letters and bulleted lists. Submissions become public record. |
| Owner step | Nick: (1) proofread; (2) optionally move §3 into NIST's commenting template, linked from the publication page; (3) send from nicholas@csoai.org **before end of 16 Sep 2026 (US Eastern)**; (4) run the proof command in §5 once more on send day. |
| Work order | #041 |

**Premise check for the dispatch.** The docket is real, the title matches, and the 16 Sep date is correct. The existing `docs/tui3/NIST-COMMENT-2026-09-16.md` is **a different docket**: it is addressed to the *Concept Note: AI RMF Profile on Trustworthy AI in Critical Infrastructure* (https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure). That is a Community of Interest with no comment deadline on its page (page updated 17 Jul 2026; retrieved 2026-09-14). The 09-16 in its filename coincides with this deadline, but it is not addressed to ai-standards+doczd@nist.gov. Its figures ("298 leaves", "1,301 cards") come from other corpora and are **not** reused here.

---

## Comment body (paste from here)

**To:** ai-standards+doczd@nist.gov
**Subject:** Comment on NIST AI 300-1 ipd — third-party evaluation fields, assertion basis, and correction history (CSOAI Ltd)

### 1. Who we are and how this was written

CSOAI Ltd is a company registered in England and Wales (Companies House 16939677; 3rd Floor, 86-90 Paul Street, London EC2A 4NE; contact nicholas@csoai.org). It operates an independent AI measurement body at https://councilof.ai. We measure models on frozen test banks with deterministic grading and publish signed result records. **This is measurement, not certification.** We issue no conformity marks, and nothing below is a claim of conformity with anything.

**AI-assistance disclosure (per the Note to Reviewers):** an AI assistant helped draft this comment. Every field value quoted below was read from a public URL at the time stated. A person at CSOAI reviewed the text before sending.

We have no partnership with NIST or any other body named here. We offer evidence, not a product.

### 2. What we tested the template against

We took one of our own published, signed evaluation records and filled the Clause 5 / Annex A model-profile evaluation fields from its bytes alone. Then we asked, field by field, which values an outside reader can **check** and which they must **take on trust**. The record falls short of what the template's Field 6 implies. We think that shortfall is common, and useful to NIST.

**The record.** It is one card from our signed card index, https://councilof.ai/signed/card_index.json (335 entries; `n_cards == n_cells == 335`; index `created` 2026-08-19T09:24:39Z; retrieved 2026-09-14T10:32Z).

- Card URL: https://councilof.ai/signed/cards/0dc8b7ef05fd1c2b4584079ce99a12d24b157d2f2683cffce763377dd88c7213.json
- Signed body, verbatim:

```json
{
  "accuracy": 0.5714,
  "axis": "gspc-safety",
  "created": "2026-08-19T09:24:39.157090+00:00",
  "issuer": "CSOAI Ltd (UK 16939677)",
  "kind": "gspc.measurement-card",
  "model": "falcon3:7b",
  "prev": "c3be7b095029076863133572c8eb71077ff3e157f74a47da6149b6f28e7c4196",
  "public_framing": "13 measured of 14 quotable",
  "verify": "https://councilof.ai/verify"
}
```

- Signature: Ed25519 over `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)`. The key `d4cb0eaa…9c37e38` matches verification method `did:web:csoai.org#card-attestation-1` in https://csoai.org/.well-known/did.json. We checked it on 2026-09-14: signature **VALID**; the same check on a one-digit-tampered body is **INVALID**; sha256(preimage) equals the card `id`.

**Field-by-field reading.**

| Information a reader needs | Annex A model-profile field | In this record? | Basis |
|---|---|---|---|
| Model identity | 1.1 / 1.6.1 Version Identifier | `"model": "falcon3:7b"`: a runtime tag, with no weights digest | **Publisher-asserted.** A tag can be re-pointed; nothing in the record binds it to specific weights. |
| Test-bank revision | 6.1.1-(\*) Evaluation Dataset Reference | **Absent.** `"axis": "gspc-safety"` names a construct, not a dataset version. | Not checkable from the record |
| Measurement time | 6.4 ("timing and frequency of evaluations") | `created` is the **signing** time (2026-08-19). The run date is not in the record; our board states the behavioural axes were measured 2026-08-12 (https://councilof.ai/api/gspc → `measured_on.date`). | Signing time is checkable. Run time is publisher-asserted, elsewhere. |
| Sample count | 6.5-(\*) Evaluation Metrics and Results | **Absent.** `accuracy: 0.5714` carries no n, no count of unscorable responses, no interval. | Not checkable. The current board row for this axis reports n=36 (https://councilof.ai/api/gspc, axis `safety`). This card cannot be tied to that row from its own bytes. |
| Applicability / intended use evaluated | 6.5-(\*).1 Intended Use Evaluated | **Absent** | — |
| Limitations | 6.4 Performance Limitations | **Absent** from the record. Our limitations are published separately (https://councilof.ai/api/gspc → `limitations`, 13 entries). | Publisher-asserted, not linked |
| Correction history | 1.12 Documentation Version Identifier ("correct errata") | **Absent.** The signed `public_framing` value ("13 measured of 14 quotable") has since been superseded: the live board reads 22 axes, 22 measured. We never edit signed bytes, so the correction has to live outside the record, and nothing in the record points to it. | The correction exists (https://councilof.ai/api/corrections, 49 entries, itself signed) but cannot be discovered from the card. |
| Evidence pointers | 6.3 Quantitative and Qualitative Analyses | Only `verify` (a verification page). No link to per-item rows or grader code. | — |
| Evaluator identity | 6.2 Third-Party Evaluation | `issuer` string, plus a key that resolves through a DID document | **Independently checkable** (signature + DID key binding) |
| Ordering / tamper-evidence across records | none | `prev` hash chain | **Independently checkable** |

**What this shows.** A signature makes a record *tamper-evident*, not *informative*. The checkable fields in this record (who signed, when it was signed, that it is unaltered, where it sits in a chain) are exactly the ones a reader needs least for suitability assessment. The fields Clause 4.2.2 ("informativeness") and 4.2.5 ("freshness") care most about (dataset version, n, uncertainty, limitations, corrections) are absent. We expect other publishers' records, signed or not, to show the same asymmetry. A template that does not name these subfields will not surface it.

### 3. Proposed changes

Clause and field numbers follow the ipd.

**P1 — Field 6.2 Third-Party Evaluation: add named subfields to the default profile.** Proposed text:

> 6.2.1 *Evaluator Identifier* — a resolvable identifier for the evaluating party and, where results are signed, the verification method (key) used. 6.2.2 *Evaluated Artifact Identifier* — an identifier of the exact model artifact evaluated that is sufficient to determine identity (e.g., a digest of the serialized model or of the served endpoint's declared version), not only a name or tag. 6.2.3 *Evaluation Instrument Version* — version identifier and content digest of each evaluation dataset or split used. 6.2.4 *Run Time* — date/time the evaluation was performed, distinct from the date the result was published or signed. 6.2.5 *Verification Method* — where a reader can obtain the means to check the result record (e.g., signature verification instructions, grader code).

Rationale: in our record, 6.2.1 and 6.2.5 were present and 6.2.2–6.2.4 were not. Without those three, a reader cannot tell whether two results describe the same model on the same test.

**P2 — Field 6.5-(\*): require sample size and unscorable rate whenever a quantitative result is reported.** Proposed text: "If a quantitative metric is reported, the entry should state the number of items evaluated, the number of responses that could not be scored and how they were treated, and an uncertainty statement (e.g., an interval) or an explicit statement that none was computed." Rationale: `accuracy: 0.5714` with no n cannot be interpreted.

**P3 — Clause 6 profile conventions: an "assertion basis" marker.** Let a profile tag any field value as *publisher-asserted*, *third-party-asserted*, or *independently checkable (method: …)*. Rationale: our table in §2 needed this column to be honest, and the template has nowhere to put it. The marker costs nothing for fields that are plainly asserted, and it stops a signature on the record being read as verification of every value in it.

**P4 — Field 1.12 Documentation Version Identifier: add a Correction Record subfield.** Proposed text:

> 1.12.1 *Correction Record* — a pointer to a record of errata affecting this artifact or prior versions of it, stating what was wrong and what replaced it. Where a documentation artifact is signed or otherwise integrity-protected, corrections should be issued as a new version or a separate correction entry rather than by altering the published artifact, and the superseded version should remain retrievable.

Rationale: our superseded `public_framing` value is correct practice (the signed record was not silently edited), but a reader of the card alone cannot learn it was superseded.

**P5 — "Not evaluated" must be distinguishable from "not documented".** Under Clause 6, a field lacking a designation is treated as optional, so an absent 6.5 entry could mean "we did not evaluate this" or "we evaluated it and chose not to say". Proposed text for Clause 4.2.3 (correctness) or the Field 6 guidance: "Where an organization has not evaluated a characteristic that interested parties would likely assume was evaluated, the artifact should state this explicitly rather than omit the field."

**P6 — Field 1.6.2 Cryptographic Signature: widen the scope.** The ipd's 1.6.2 covers signatures "of the serialized model". Add an optional sibling, *Documentation Artifact Signature*: a signature over the documentation artifact or evaluation record, with the verification method named per P1 (6.2.1). Rationale: a model-weights signature does not protect an evaluation record, and vice versa.

### 4. Response to the Note to Reviewers on examples

NIST asks whether to provide filled-in examples. We suggest yes, including at least one example whose values are **deliberately incomplete** and marked as such, like the table in §2. An all-green example teaches readers what a complete artifact looks like. An honest partial example teaches them how to *read* one. NIST is welcome to reuse the record and table above, all of which is public. We ask for no attribution.

### 5. Proof (for the reader)

Anyone can re-check the record in §2:

```bash
curl -s https://councilof.ai/signed/cards/0dc8b7ef05fd1c2b4584079ce99a12d24b157d2f2683cffce763377dd88c7213.json -o card.json
python3 -c "
import json,hashlib
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
c=json.load(open('card.json')); b=json.dumps(c['body'],sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
assert hashlib.sha256(b).hexdigest()==c['id']
Ed25519PublicKey.from_public_bytes(bytes.fromhex(c['pubkey'])).verify(bytes.fromhex(c['signature']),b); print('VALID')"
# key binding: base64url-decode x of did:web:csoai.org#card-attestation-1 in https://csoai.org/.well-known/did.json == c['pubkey']
```

What a VALID result does **not** establish: that `falcon3:7b` names particular weights, that the accuracy is correct, or that the card index is complete. The index itself says: "Each row can be verified in full; the boundary of the set cannot."

— CSOAI Ltd, nicholas@csoai.org

---

## Internal notes (do not paste)

- No named-official quotes are used.
- Signed bytes are quoted, not edited. The stale `public_framing` string is shown **as evidence of the correction gap**; it is not a current claim.
- Corpus discipline: 335 is the signed card index (corpus 3) only. No public-root or bundle counts appear.
