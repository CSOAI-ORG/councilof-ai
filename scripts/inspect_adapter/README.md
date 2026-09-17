# Inspect AI evidence adapter — bounded, offline, unsigned

A single bounded experiment: can a CSOAI evidence object be produced from a real Inspect AI
`.eval` log, using the Merkle rule this estate already publishes, and verified offline with no
network and no key? Answer, demonstrated below: yes for the hashing and disclosure layer, and
not at all for the signature layer, which is a separate and harder problem.

## Status of the interoperability target — read this before citing anything here

The target is **[UKGovernmentBEIS/inspect_ai issue #5444](https://github.com/UKGovernmentBEIS/inspect_ai/issues/5444)**,
opened **16 Sep 2026 by StevenMih**. Observed 17 Sep 2026: **OPEN, no maintainer response, no
labels, no assignee.**

It is **ONE person's issue, days old**. It is **NOT an AISI-adopted design**, not an Inspect
roadmap item, and not a decision by anyone. Nothing in this directory implements an AISI or
Inspect decision. It gives us a credible interoperability target and **nothing more**. Anyone
who describes this work as "aligning with AISI's design" is misrepresenting it.

Inspect AI is MIT licensed. We read its output format; we do not modify it and we have not
pushed anything to that repo.

The issue proposes four things. We built three of them and deliberately did not build the fourth:

| #5444 proposes | Here | Why |
|---|---|---|
| per-sample content-derived IDs | **built** | `sha256(canonical(sample))`, a function of content alone |
| daily ~200-byte Merkle root checkpoint | **built** | root + leaf count; the count is load-bearing, see below |
| selective disclosure, withheld samples keep digests | **built** | withheld sample keeps digest + inclusion proof |
| IETF SCITT receipts | **NOT built** | needs a signature. See "No signing", below |

## No signing, and why that is not a gap to be patched over

This bundle is **UNSIGNED**. No Ed25519 signature, no witness, no SCITT submission, no network
call at build or verify time.

The board signer is unreachable — GitHub Actions is disabled account-wide, and the board key
lives in OIDC on Pages, not on this laptop. Signing with any other key we hold would assert that
the board attested this when it did not. That is forgery, not a workaround. So the bundle says
in its own bytes that it is unsigned, and the verifier checks that it says so.

The consequence is stated plainly and should not be softened: **inclusion proves WHICH BYTES
were in the set. It says nothing about WHO produced them.** An unsigned Merkle root is a
commitment, not an attestation.

## The tree rule is the estate's, not a new one

`csoai_merkle.py` implements `public/root.json`'s own `node_definition` **verbatim**:

> parent = sha256(left || right) over RAW 32-byte digests, pairwise, bottom-up. An odd node at
> any level is paired WITH ITSELF (Bitcoin-style duplication), not promoted. No
> domain-separation prefix.

Verified 17 Sep 2026: this rule recomputes `public/root.json`'s own `merkle_root`
`07dd5eb3…0122e2` over its own 305 `card_sha256` leaves, and all 305 inclusion proofs verify.
We did not invent a second tree shape.

**It is not RFC 6962.** RFC 6962 prefixes `0x00` before a leaf and `0x01` before an internal
node, putting them in disjoint domains. We prefix nothing, and we duplicate odd nodes rather
than promoting them. Both divergences are recorded in the bundle's own `rfc6962_divergence`
and `tree_caveat` fields rather than silently converted, because converting would change every
root this estate has ever published. Any real SCITT/CT interop would have to confront this.

### A divergence inside our own repo, found while doing this

`scripts/measurement_root.py` builds a **different** tree: it sorts leaves by digest and carries
an odd node up **unchanged, never duplicated** — and says so in its own docstring. Its roots are
therefore not comparable to `public/root.json`'s, and the carry-up rule does **not** reproduce
`root.json`'s published root (checked: it yields `e9f86358…`, not `07dd5eb3…`).

These are two different artifacts with two different declared rules, not a contradiction — each
is right about its own bytes. But "the CSOAI Merkle root" is not a single well-defined thing,
and nobody should say it is. This adapter follows `public/root.json`, and records which one it
followed in `node_definition_source`.

### The leaf count is load-bearing, not decoration

Odd-node duplication is **CVE-2012-2459**: `[A,B,C]` and `[A,B,C,C]` have the *same root* and
*different leaf sets*. Control C3 below reproduces this on our real bundle — every hash check
passes and the root matches, because the root genuinely is identical. Only the declared-count
guard catches it. `public/root.json` closes the ambiguity by putting `card_count` inside the
signed preimage; this verifier enforces the same rule, and rejects any proof index at or beyond
the declared count.

## The `.eval` file is genuine, the model responses are mock

`fixtures/demo-mockllm.eval` was **written by the real `inspect_ai` 0.3.259 writer**, running
fully offline against the `mockllm/model` provider, which returns canned strings and makes no
network call. So the **file format is real and not reconstructed by us** — it is a genuine zip
with genuine `header.json`, `summaries.json`, `reductions.json` and `samples/<id>_epoch_<n>.json`
members, which is exactly the per-sample granularity #5444 is about.

The **model responses are mock placeholders with no evaluative meaning at all**. Every sample's
completion is the literal string `Default output from mockllm/model`; the reported accuracy is
`0.000` and means nothing. This is a format-interoperability fixture, not a measurement. It is
not a card, it is not MEASURED, and it must never be presented as an eval result.

Reproduce it with `fixtures/demo_task.py`:

```bash
python3 -c "from inspect_ai import eval; from demo_task import demo; \
  eval(demo(), model='mockllm/model', log_dir='./logs', log_format='eval')"
```

## Run it

```bash
./run_controls.sh            # build + verify + all three tamper controls
```

Individually:

```bash
python3 eval_to_evidence.py fixtures/demo-mockllm.eval --out out/bundle.json --withhold 3
python3 verify_bundle.py out/bundle.json                       # bundle alone — no .eval, no network
python3 verify_bundle.py out/bundle.json --eval fixtures/demo-mockllm.eval   # optional cross-check
```

`bundle.example.json` is a committed copy of the good bundle so the shape can be read without
running anything.

## The controls — a verifier that cannot fail is worthless

`run_controls.sh` accepts one bundle and **requires three tampered bundles to be rejected**.
Each names the check it trips:

| Control | Tamper | Rejected by |
|---|---|---|
| **C1** | Take the **withheld** sample, rewrite the model's answer to `"blue"` so it looks correct, present it as disclosed | `sha256(preimage)` ≠ recorded digest |
| **C2** | Flip one hex character of one digest | root no longer recomputes; 4 of 5 proofs break |
| **C3** | Duplicate the tail leaf (CVE-2012-2459) | **root still matches** — only the declared-count guard rejects it |

C1 is the abuse selective disclosure actually invites: withhold a sample, then later "reveal" a
flattering version of it. The digest committed in the bundle is what makes that fail.

The build script also asserts its own tamper actually changed bytes, so a control cannot pass
vacuously by editing nothing. That assertion fired during development and caught a no-op tamper.

## What this does NOT establish

Carried in the bundle's own `what_this_does_not_establish` field, not just here:

- It does **not** make an eval honest. A dishonest harness hashes and commits perfectly.
- It does **not** establish the eval was uncontaminated. Contamination is invisible to a hash.
- It does **not** establish any score is correct. The scorer's verdict is committed to, not checked.
- It does **not** establish every action was captured. It commits to the samples that were
  *written to the log*. A sample never logged leaves no trace, and the root cannot tell you
  what is missing.
- It does **not** establish **who** produced the log. The bundle is unsigned.
- It does **not** prove the root is old. No timestamp anchor, no witness; `as_of` is a claim.

The first four are **the issue author's own caveats about his own proposal**. They apply in
exactly the same way to ours, which is the honest reason to repeat them.

## Relationship to `inspect-receipts`

This estate already ships a separate package, `inspect-receipts` 0.1.0, which answers a
*different* Inspect issue (**#4413**) with Ed25519-signed receipts via Inspect's hooks. That one
signs; this one deliberately does not. They are not the same experiment and should not be merged
in conversation. `inspect-receipts` is installed in this environment and its hook was loaded
when the fixture was generated; it emitted no receipt (no key present) and did not alter the log.

## Scope of the compatibility claim

We ran this adapter against **one** `.eval` file produced by **one** Inspect version
(`0.3.259`), recorded that file's hash in the bundle, and claim nothing beyond it. We did not
modify the `.eval` format. We do not claim general Inspect compatibility, forward compatibility,
or that this would work on a log with sandboxes, attachments, or multi-epoch reductions we did
not exercise.

See `docs/interop/inspect-evidence-adapter-2026-09-17.md` for the mapping table and the one hard
limit (JSON signatures vs COSE).
