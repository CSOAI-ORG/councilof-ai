# Correction: two comment counts and one honesty-register sentence in the SAFE v1.0 port contribution

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026.**
Supersedes two rows of the section 2 table and one paragraph of the honesty register in
*Porting three open items onto the approved SAFE v1.0 — with one worked example of a claim that
was maintained* (26 October 2026), published at
`https://councilof.ai/contributions/osaia-safe-v1.0-port-2026-10-26.md` and kept in the repository
at `public/contributions/osaia-safe-v1.0-port-2026-10-26.md`.

That file is edited in place, visibly: each corrected row carries the value that was published
beside the value that is current, and the corrected paragraph carries the original sentence
verbatim. This note stands beside it and names what it corrects; everything else in the
26 October document stands.

---

## What the 26 October document said

In *What we verified at source, and how*:

> | Issue **#32** (discriminating power) is open, filed by us on 2026-09-17, 2 comments | issue API |
> | Issue **#72** (continuous claim maintenance) is open, filed by us on 2026-10-07, 2 comments | issue API |

And in the *Honesty register*:

> **UNVERIFIED** — whether the Alliance will accept, or even read, this. We do not know and do not
> predict. The submission route in section 7 has not been taken.

## What is wrong with it

**The two comment counts are stale, and that is the small part.** A comment count is a fact about a
moving thing, and ours moved: between 26 and 28 October 2026 issue **#32** went from 2 comments to
3 and issue **#72** went from 2 comments to 6. Published as a verified-at-source fact, a stale
count is a stale fact, and a reader who checked it would find the document wrong in a way that
costs the document its credibility.

**The honesty-register sentence is the part that matters.** It said we did not know and did not
predict whether the Alliance would "accept, or even read" this. On the reading half, that is now
answerable from the public record, and answering it wrongly in our own favour would be exactly the
failure this estate exists to prevent. `@QSAFP-Core` has responded substantively on issue **#72**
three times — 13 October 2026, 26 October 2026 and 28 October 2026 — raising two specific
precisions: that a non-current claim state (`WATCH`, `STALE`, `RETEST_DUE`, `UNMEASURED`) must be
explicitly non-authorizing, and that action release must be bound to a current external authority
record carrying the applicable baseline, scope, epoch, validity window and revocation state. Both
were implemented and made conformance-testable on 28 October 2026, and the Alliance replied the
same day that the separation "is preserved correctly in both directions".

So: the Alliance has read this work. The document said we could not say that, and said so in a
register whose purpose is to say exactly what is not known. The correction states the engagement
and refuses the inference — engagement is not acceptance, and no adoption, endorsement or
agreement by the Alliance is claimed or implied. The acceptance half of the original sentence
stands unchanged.

## What is correct, and was re-verified

The substantive claim of the contribution is that the patch binds to the **approved** `SAFE.md`, and
that claim was re-verified at source on 28 October 2026 and still holds. All 21 checks were re-run;
19 passed and 2 failed — the 2 failures being the stale comment counts above, and nothing else.

| Claim | Published 26 Oct | Re-verified 28 Oct | Verdict |
|---|---|---|---|
| `SAFE.md` size | 20,094 bytes | 20,094 bytes | holds |
| `rfc-safe-proposal.md` size | 7,773 bytes | 7,773 bytes | holds |
| Approved `SAFE.md` contains none of `discriminat`, `negative control`, `insufficient_evidence`, `not_applicable`, `claim maintenance` | absent | absent | holds |
| Issue #32 open | open | open | holds |
| Issue #32 comments | 2 | **3** | **stale — corrected** |
| Issue #72 open | open | open | holds |
| Issue #72 comments | 2 | **6** | **stale — corrected** |
| PR #64 open, not draft, base `main`, 3 commits, +24/−0, one file `rfc-safe-proposal.md` | as stated | as stated | holds |
| Patch applies to the approved `SAFE.md`, all four hunks land | as stated | applies cleanly, 4 hunks | holds |
| Resulting `SAFE.md` size | 22,852 bytes | 22,852 bytes | holds |

## How to reproduce this

```bash
# the approved file and its size
curl -sL -o /tmp/safe.md https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/main/SAFE.md
wc -c < /tmp/safe.md                                  # 20094

# the superseded sibling
curl -sL -o /tmp/rfc.md https://raw.githubusercontent.com/OpenSecureAIAlliance/RFCs/main/rfc-safe-proposal.md
wc -c < /tmp/rfc.md                                  # 7773

# the five terms are absent from the approved specification
for t in discriminat "negative control" insufficient_evidence not_applicable "claim maintenance"; do
  grep -qi "$t" /tmp/safe.md && echo "PRESENT: $t" || echo "absent: $t"
done

# the comment counts, live
gh api repos/OpenSecureAIAlliance/RFCs/issues/32 --jq .comments   # 3
gh api repos/OpenSecureAIAlliance/RFCs/issues/72 --jq .comments   # 6

# the patch still binds: apply it to a fresh copy of the approved file
cp /tmp/safe.md /tmp/safe-apply/SAFE.md 2>/dev/null || { mkdir -p /tmp/safe-apply; cp /tmp/safe.md /tmp/safe-apply/SAFE.md; }
cd /tmp/safe-apply && git apply --check --verbose SAFE-v1.0-port.patch   # all four hunks land
```

The patch itself is `docs/standards/osaia-safe-reverification/SAFE-v1.0-port.patch` in
`github.com/CSOAI-ORG/councilof-ai`. The re-verification was run by
`scripts/verify-safe-port.py` in the same repository, which recomputes all 21 checks and refuses to
report a pass it did not observe. Its output for this correction is published at
`https://councilof.ai/interop/osaia-safe-port-verification-2026-10-28.json`, and it can be re-run
from a checkout:

```bash
python3 scripts/verify-safe-port.py
```

## What this correction does not do

It does not claim the Alliance has accepted, endorsed, adopted or agreed with anything. It does not
open the pull request: the submission route in section 7 of the contribution is still untaken,
because opening it needs a co-author with a normal GitHub account. It does not change the
contribution's argument, its evidence, or its status line.
