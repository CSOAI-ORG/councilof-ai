# Standards reply decisions — SCITT / IETF

**Date:** 2026-09-04
**External communications:** none sent

## CCF Receipt profile Last Call

The useful issue is narrow and evidence-backed: the current verifier procedure
does not take candidate Signed Statement bytes and explicitly compare their
digest with the receipt leaf before root verification. The formal Datatracker
date is **7 September 2026**.

Send only after owner review:

> I support publication once the candidate binding is explicit. Please define
> `data-hash` as H over the complete encoded, tag-18 `Signed_Statement` data
> item actually committed to the Statement Sequence, after its unprotected
> header has been set to the empty map as required by RFC 9943 §6.3. These are
> the exact committed octets, not the result of decoding and re-encoding.
> `verify_inclusion_receipt` should take candidate Signed Statement octets and
> first require `proof.leaf.data-hash == H(candidate_signed_statement_octets)`
> before computing and verifying the root. The profile should also state how
> those original octets remain available after a Receipt is inserted;
> alternatively, it must name a deterministic reconstruction and publish
> matching vectors.

## Required corrections to the local thirteenth draft

- It is a local thirteenth email draft, not an IETF `-13` revision.
- Report **64 generic COSE encodings, 32 RFC-9943 SCITT-conforming tagged
  serializations**. All 32 tagged hashes differ; 31 non-baseline tagged forms
  silently re-serialise to the baseline.
- Call `as-transmitted` adjacent provisional prior art in an individual draft,
  not an IANA-registered algorithm.
- Do not claim canonicalization is impossible; exact-byte binding or a fully
  specified deterministic reconstruction are both defensible designs.
- Keep the ASR/Permit exchange separate from the CCF Last Call comment.

## ASR and Permit boundary

The local module is an **executable ASR coverage predicate**, not a wire-format
or conformance implementation. A future v0.2 needs typed approval and override
events, monitor identity/key authorization, exact action digest, authenticated
checkpoint/position, trusted time, nonce/sequence, Permit/policy epoch and
validity, replay-safe durable state, and atomic compare-and-set enforcement at
the effect boundary. A SCITT receipt records evidence; it does not run the queue
or extend an expired Permit.

## Owner action

Review the narrow Last Call paragraph, then send it alone if approved. Keep the
ASR response as a separate draft. No regulator, standards body or correspondent
was contacted by this release lane.
