# Inspect AI ↔ CSOAI evidence: what maps, what does not, and the one hard limit

**Date:** 2026-09-17 · **Code:** `scripts/inspect_adapter/` · **Status of this document:** a
record of one bounded offline experiment. Nothing here is deployed, signed, witnessed, or
submitted anywhere.

---

## 1. The target, stated precisely

[UKGovernmentBEIS/inspect_ai issue #5444](https://github.com/UKGovernmentBEIS/inspect_ai/issues/5444),
opened **16 September 2026 by StevenMih**. Observed 17 September 2026: **OPEN · no maintainer
response · no labels · no assignee.**

It proposes, for Inspect eval logs:

1. per-sample content-derived IDs
2. daily Merkle root checkpoints of roughly 200 bytes
3. IETF SCITT receipts
4. selective disclosure in which withheld samples retain their digests

That is, independently arrived at, the architecture this estate already runs. That convergence
is interesting and worth pursuing. It is also the entire extent of the claim.

> **This is ONE person's issue, days old, with no maintainer response, no labels and no
> assignee. It is NOT an AISI-adopted design. It is not an Inspect roadmap item. It is not a
> decision by AISI, by the Inspect maintainers, or by anyone else.**

It gives us a **credible interoperability target and nothing more**. Any description of this
work as "aligned with AISI's evidence design", "implementing the AISI proposal", or anything in
that family is false, and would be false even if the issue were later adopted, because it is not
adopted today. If the status changes, this document must be updated with the new evidence — not
quietly reinterpreted.

Inspect AI is **MIT licensed**. We read its output; we did not modify the `.eval` format and we
have opened no PR and pushed nothing to that repository.

---

## 2. What was actually run

A genuine `.eval` log, written by the real `inspect_ai` **0.3.259** writer, generated **fully
offline** against the `mockllm/model` provider (canned strings, no network). The file format is
therefore real, not reconstructed by us. Fixture: `scripts/inspect_adapter/fixtures/demo-mockllm.eval`,
5 samples, reproducible from `fixtures/demo_task.py`.

**The model responses are mock placeholders and carry no evaluative meaning.** Every completion
is the literal string `Default output from mockllm/model`; the reported accuracy is `0.000` and
means nothing at all. This is a format-interoperability fixture. It is not a measurement, not a
card, not MEASURED, and must never be presented as an eval result.

Scope of the compatibility claim: **one file, one Inspect version, hash recorded in the bundle.**
No general, forward, or backward Inspect compatibility is claimed. Logs using sandboxes,
attachments, or multi-epoch reductions were not exercised.

---

## 3. What maps

| #5444 concept | CSOAI equivalent | Status |
|---|---|---|
| Per-sample content-derived ID | `sha256(canonical(sample))` using the estate's own declared preimage rule (`public/signed/card_index.json` → `verification.preimage_rule`) | **Maps cleanly.** Function of content alone, no assigned identifier. |
| Merkle checkpoint (~200 bytes) | `public/root.json`'s `node_definition`, applied verbatim | **Maps, with a caveat.** Root + leaf count. The count is load-bearing — see §5. |
| Selective disclosure keeping digests | Withheld sample retains `digest` + `inclusion_proof`, drops `preimage_b64` | **Maps cleanly.** Demonstrated and tamper-tested. |
| Per-sample inclusion proof | Sibling path with explicit `side`, so the verifier never guesses concatenation order | **Maps cleanly.** |
| SCITT receipt | — | **Does not map.** See §6. |

The shared shape underneath is real: an eval log is already a set of independently-hashable
records, and Inspect's `.eval` zip stores each sample as its own member
(`samples/<id>_epoch_<n>.json`). That is exactly the granularity a per-sample digest needs. No
format change was required to hash it.

---

## 4. What does NOT map

**Signing.** Nothing here is signed. No Ed25519 signature, no witness, no timestamp anchor, no
SCITT submission, no network call at build or verify time. The board signer is unreachable —
GitHub Actions is disabled account-wide and the board key lives in OIDC on Pages, not on a
laptop. Signing with any other key we hold would assert that the board attested this when it did
not, which is forgery rather than a workaround.

The consequence must be stated plainly and not softened: **an unsigned Merkle root is a
commitment, not an attestation. Inclusion proves WHICH BYTES were in the set. It says nothing
about WHO produced them.**

**Our tree is not RFC 6962 / CT.** RFC 6962 prefixes `0x00` before a leaf and `0x01` before an
internal node, placing them in disjoint domains; and it promotes odd nodes. We prefix nothing
and duplicate odd nodes. Any genuine SCITT or CT interoperability would have to confront this.
We record the divergence in the bundle's own `rfc6962_divergence` field rather than silently
converting, because converting would change every root the estate has ever published — that is
not a silent upgrade, and `root.json` already says so.

**Scoring semantics.** Inspect scorers, reducers and metrics have no CSOAI counterpart here. We
commit to the scorer's recorded verdict; we do not check it, re-run it, or map it onto an axis.
Nothing in this adapter produces a grade.

**Timestamps.** `as_of` is a claim by whoever built the bundle. There is no anchor and no
witness, so the bundle cannot prove the root is old.

---

## 5. A finding: "the CSOAI Merkle root" is not one thing

Two tree shapes exist in this repository today, each declaring its own rule honestly:

| Artifact | Leaf order | Odd node |
|---|---|---|
| `public/root.json` | as given | **duplicated** (Bitcoin-style) |
| `scripts/measurement_root.py` | **sorted by digest** | **carried up unchanged**, never duplicated |

Verified 17 Sep 2026 against the deployed `public/root.json` (305 leaves): the duplication rule
reproduces its published `merkle_root` `07dd5eb3…0122e2` and all 305 inclusion proofs verify;
the carry-up rule yields `e9f86358…` and does not.

These are two different artifacts with two different declared rules — each is right about its own
bytes, and neither is a defect. But **"the CSOAI Merkle root" is not a single well-defined
thing**, and no outward document should imply it is. This adapter follows `public/root.json` and
records which rule it followed in the bundle's `node_definition_source`.

**The leaf count is not decoration.** Odd-node duplication is CVE-2012-2459: `[A,B,C]` and
`[A,B,C,C]` share an *identical root* with a *different leaf set*. Control C3 reproduces this on
the real bundle — the root matches, every digest checks out, every inclusion proof verifies, and
the bundle is still a forgery. Only the declared-count guard catches it. `public/root.json`
closes the ambiguity by placing `card_count` inside the signed preimage; our verifier enforces
the same rule and additionally rejects any proof index at or beyond the declared count.

Anyone verifying a CSOAI root by checking `merkle_root` alone is not verifying it.

---

## 6. The one hard limit: JSON signatures and COSE can only supersede, never convert

This is the limit that will not yield to engineering effort, and it should be understood before
anyone promises SCITT compatibility.

**What we sign.** The 335 signed cards (`public/signed/card_index.json`, `n_cards == n_cells ==
len(cards) == 335`) sign **JSON**. The declared rule is:

```
preimage = json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
id       = sha256(preimage).hexdigest()
sig      = Ed25519(...)
```

Each entry carries `alg`, `kid`, `pubkey` and `sig` as **sibling fields alongside** the
signature. The signature covers the card body. **It does not cover `alg`, `kid`, or `pubkey`.**

**What SCITT signs.** SCITT signed statements are COSE_Sign1. In COSE, the signature is computed
over a `Sig_structure` that **includes the serialised protected header bucket**. The algorithm
and key identifier are *inside* the signed bytes, by construction.

**Why conversion is impossible.** Re-wrapping our existing card bytes in a COSE envelope would
produce a structure whose protected headers are *not* covered by the existing signature, because
that signature was never computed over them. Producing a signature that *does* cover them means
computing a new signature over a new `Sig_structure` — which requires **the private key**. There
is no transformation of the signed bytes that gets you from one to the other. This is not a
serialisation difference that a converter can paper over; it is a difference in *what the
signature is a signature of*.

Therefore:

> **A CSOAI signed card can never be converted into a SCITT signed statement. It can only ever
> be SUPERSEDED — re-signed from the original body, under a key we control, as a new artifact
> with a new identity, with the JSON card retained and the supersession recorded.**

Two consequences follow, and both are binding:

1. **Never edit signed bytes to make them COSE-shaped.** That breaks the signature, silently and
   permanently. (This estate has already lost a signature for five days to exactly that mistake.)
   Supersede or ledger; never edit.
2. **Any SCITT work is a re-signing programme, not an export feature**, and it cannot begin while
   the board signer is unreachable. Nothing in this adapter takes a step toward it, and nothing
   here should be cited as having done so.

The same argument applies in reverse: a SCITT receipt cannot be converted into a CSOAI card.

---

## 7. What this does NOT establish

Carried in the bundle's own `what_this_does_not_establish` field, not only in prose:

- It does **not** make an eval honest. A dishonest harness hashes and commits perfectly.
- It does **not** establish the eval was uncontaminated. Contamination is invisible to a hash.
- It does **not** establish any score is correct. The verdict is committed to, not checked.
- It does **not** establish that every action was captured. It commits to samples *written to the
  log*; a sample never logged leaves no trace, and the root cannot tell you what is missing.
- It does **not** establish **who** produced the log — the bundle is unsigned.
- It does **not** prove the root is old — no anchor, no witness.

**The first four are the issue author's own caveats about his own proposal.** They apply in
exactly the same way to ours. Repeating them here is not modesty; it is the accurate description.

---

## 8. What was demonstrated

Per-sample content digests and a selective-disclosure Merkle bundle were built from a genuine
Inspect `.eval` log using the estate's published tree rule, and verified offline from the bundle
alone — with one sample withheld, its digest and inclusion proof still verifying, and three
tampered bundles rejected including a CVE-2012-2459 forgery that the root check alone accepts.

That is a hashing-and-disclosure interoperability result. It is not an attestation result, and
the gap between the two is the signature — which is precisely what §6 says cannot be bridged by
conversion.

---

## 9. Related, and not to be conflated

`inspect-receipts` 0.1.0 (Apache-2.0, in this estate) answers a **different** Inspect issue,
**#4413**, with Ed25519-signed receipts emitted through Inspect's hook system. **That one signs;
this one deliberately does not.** They are separate experiments against separate issues and
should not be described as one effort. The `inspect-receipts` hook was loaded in the environment
when the fixture was generated; it emitted no receipt (no key present) and did not alter the log.
