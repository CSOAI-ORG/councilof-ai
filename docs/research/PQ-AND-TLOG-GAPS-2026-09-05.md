# Post-quantum, transparency logs, and what we should not build

Research note, 5 September 2026. Written because two plausible-sounding plans are dead on
arithmetic and one genuine gap is ours to own.

## 1. A post-quantum signature cannot go in a 3KB card. The arithmetic settles it.

The standards path is OPEN — this is not blocked on IANA. **RFC 9964** (Standards Track,
May 2026) registers ML-DSA for JOSE and COSE, and the COSE algorithm values are **assigned,
not TBD**: ML-DSA-44 = **-48**, ML-DSA-65 = **-49**, ML-DSA-87 = **-50**, all Recommended:
Yes. It supersedes draft-ietf-cose-dilithium. FIPS 204 and 205 have been final since
13 Aug 2024.

What blocks it is size, against our 3072-byte card budget:

| encoding | ML-DSA-44 | ML-DSA-65 | Ed25519 |
|---|---|---|---|
| raw signature | 2420 B | 3309 B | 64 B |
| base64url | 3228 B (105%) | 4412 B (144%) | 88 B |
| hex (our current convention) | 4840 B (158%) | 6618 B (**215%**) | 128 B |
| + inline public key (b64) | — | 7016 B (**228%**) | ~132 B |

**An ML-DSA-65 signature alone is 108% of the entire card budget before any content.** Even
the smallest parameter set overruns. So "add PQC to the cards" is not a small change; it is a
different artifact.

Three designs that actually work, none of which is "put it in the card":
1. **Detached** — the PQ signature lives at a sibling URL, the card carries only its SHA-256.
   Card size is unchanged; verifiers that want PQ fetch one more object.
2. **Dual-sign** — Ed25519 stays inline, ML-DSA is produced alongside and fetched on demand.
3. Raise the budget, which changes every consumer. Least attractive.

SLH-DSA is **not yet assigned**: draft-ietf-cose-sphincs-plus-10 (28 Jul 2026) carries
placeholders -51/-52. Do not hard-code those.

Library: **@noble/post-quantum** (MIT, v0.7.1, 27 Aug 2026) is the only pure-JS ML-DSA we
could find with no Node built-ins — it uses `crypto.getRandomValues` only, so it runs in a
Workers isolate. Caveats worth respecting: it is **self-audited, not independently audited**,
and neither its ML-DSA bundle size nor its verify cost against the Workers CPU budget has
been measured. Benchmark before committing.

## 2. Hex → base64url is a real 33% saving on signatures, and it is NOT worth taking

Measured over 400 published cards: 50,048 hex signature chars would be 33,365 as base64url —
a 33% saving on signature bytes, but only **1.1% of the card corpus** (16,683 of 1,458,001
bytes). Signed bytes are never re-encoded; doing so would break every existing signature to
save one percent. Record it as a v2 default for NEW cards if the format ever moves for another
reason. Do not open the format for this alone.

## 3. The gap that is ours to own

There is **no RFC 9162 / RFC 6962 Merkle inclusion-proof library in TypeScript without Node
built-ins.** Everything on npm is either Ethereum-flavoured (`@openzeppelin/merkle-tree`,
`merkle-lib`) and uses the wrong hashing rules — no 0x00/0x01 leaf/node domain separation — or
Node-only (`@sigstore/verify` declares `engines.node >=22`).

That is ~40 lines over `@noble/hashes` (MIT, v2.4.0, zero deps, pure JS). We already have the
tree code and the three-state discipline. Publishing it as a small MIT package is a genuine
contribution and costs an afternoon.

Note this bites us directly: our own public root uses Bitcoin-style odd-node duplication with
NO domain separation, which is why a 140-leaf and a 144-leaf set share a root
(see `public/root.json` tree_caveat). A v2 root should adopt RFC 6962 domain separation, and
the library and the root change are the same piece of work.

## 4. Adopt rather than build

- **fast-check** (MIT, v4.9.0, deps `pure-rand` + `lorem-ipsum`, no Node built-ins) —
  property-based differential oracle. Run our verifier and a reference implementation over
  generated cards and assert verdict equality. This is the technique a peer uses that we lack.
- **transparency-dev/tessera** (Apache-2.0, pushed 4 Sep 2026) — its **POSIX driver writes
  tlog-tiles layout, checkpoint and entry bundles straight to a filesystem**, and the README
  says that tree can be served read-only by nginx. Upload it to R2/Pages and you have a
  serving transparency log with no daemon. Full tiles are exactly 256 hashes (8192 B);
  everything is immutable except `/checkpoint`.
- **in-toto/attestation** `ResourceDescriptor` is the right shape for a corpus manifest, but
  the repo licence reports as NOASSERTION on the API — read the LICENSE file before depending.

**Witnessing caveat:** `tlog-witness` defines the protocol but we could find **no free public
witness network**. Assume we run our own — a second Worker in a different account is a
legitimate "two machines" answer.

## 5. Independent convergence worth citing

**arXiv 2609.03153, VeriPhy (2 Sep 2026)** — provenance-tracked evidence mapped to *auditable
three-valued verdicts*. Independent arrival at the VALID/INVALID/UNCHECKABLE trichotomy, in a
paper, by people who have never heard of us. That is a stronger citation for the design than
anything we can say about ourselves.

Also: **arXiv 2607.02577** audits tool-calling benchmarks and finds high evaluator
misalignment — the best available argument for why evaluations need attestation at all.
**arXiv 2608.22510 (ClawProBench)** uses frozen holdouts and finds final-answer rankings hide
runtime failures, which is our frozen-bank design arrived at independently.

## 6. Corrections to our own earlier survey

The Tyche Institute `eatf-verifier` repository and its `mldsa.py` **could not be located** on
a direct search. Our 4 September survey described it in detail from a subagent report. Treat
every claim about that peer's implementation as second-hand until someone fetches the repo.
This note exists partly because that is exactly the kind of thing we criticise others for.
