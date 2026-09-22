# Correction: domain-separation prefixes alone do not remove the padding collision

**CSOAI — Council for Secure and Open AI. Correction dated 18 September 2026; published
22 September 2026.** Register id C-2026-0922-01.

**Supersedes** one paragraph of *The leaf count is load-bearing: odd-node duplication in the CSOAI
public root* (17 September 2026), published at
`corrections/merkle-count-binding-2026-09-17.md` in the `csoai/councilof-ai-mirror` dataset.
That file is not edited. This note stands beside it and names what it corrects; everything
else in the 17 September note stands.

---

## What the 17 September note said

Under *Who this affects*:

> RFC 6962 (Certificate Transparency) is not affected, and the reason is worth naming because
> it is the general fix. CT prefixes every leaf hash with `0x00` and every interior node hash
> with `0x01` before hashing (RFC 6962 §2.1). A leaf digest can therefore never equal an
> interior digest, the padding substitution above has no interior node to imitate, and CT
> additionally signs `tree_size` in every Signed Tree Head.

and under *What we are not proposing to change today*:

> Moving the public root to RFC 6962 domain separation would close this by construction.

## What is wrong with it

The prefixes are presented as the general fix. They are not the fix for this collision. The
padding forgery in the 17 September note duplicates a **leaf** and pairs it with a **leaf** —
`sha256(L304 || L304)` inside the honest tree against `sha256(L304 || L305)` with `L305 = L304`
in the forged one. Both operands are leaf digests at the same level. A `0x00` leaf prefix and a
`0x01` node prefix keep a leaf from impersonating an interior node; they do nothing to keep a
duplicated leaf from impersonating the duplicate the tree makes for itself. Prefix both sides
and the two parents are still `sha256(0x01 || L304' || L304')` in both trees.

What actually makes CT unaffected is that **RFC 6962 never duplicates an odd node**. Its tree
splits at the largest power of two below `n` and carries the remainder up, so a 305-leaf and a
306-leaf tree have different shapes and different roots, before any prefix is applied. The
signed `tree_size` in the STH binds the size on top of that. The prefixes close a *different*
second-preimage class (presenting an interior node as a leaf), which is worth having and is
not what the 17 September note demonstrated.

Stated as the rule: **the defence against the padding collision is the tree shape (no
odd-node duplication) plus a signed size; domain separation is a separate, additional
guarantee.** The note's practical guidance — bind `card_count`, reject `index >= card_count` —
was and remains correct, because for our duplicating tree the signed count *is* the size bind.

## Reproduction

Against public bytes, Python 3 standard library only. Same construction as the 17 September
note, run three ways over the same leaves.

```bash
curl -sS https://councilof.ai/api/root -o root.json
python3 - <<'PY'
import json, hashlib
d = json.load(open('root.json')); leaves = [bytes.fromhex(h) for h in d['card_sha256']]
H = lambda b: hashlib.sha256(b).digest()

def dup(lv, leafp=b'', nodep=b''):                      # odd node paired WITH ITSELF
    lv = [H(leafp + x) for x in lv] if leafp else list(lv)
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        lv = [H(nodep + lv[i] + lv[i+1]) for i in range(0, len(lv), 2)]
    return lv[0].hex()

def rfc6962(lv):                                        # split at the largest power of two < n
    lv = [H(b'\x00' + x) for x in lv]
    def mth(a):
        if len(a) == 1: return a[0]
        k = 1
        while k * 2 < len(a): k *= 2
        return H(b'\x01' + mth(a[:k]) + mth(a[k:]))
    return mth(lv).hex()

forged = leaves + [leaves[-1]]
print("card_count", d['card_count'], "as_of", d['as_of'], "root", d['merkle_root'][:16])
print("unprefixed, duplicating : honest == forged", dup(leaves) == dup(forged))
print("PREFIXED,   duplicating : honest == forged", dup(leaves, b'\x00', b'\x01') == dup(forged, b'\x00', b'\x01'))
print("RFC 6962 shape          : honest == forged", rfc6962(leaves) == rfc6962(forged))
PY
```

Output on 22 September 2026:

```
card_count 305 as_of 2026-09-22T08:54:02Z root 40ce3833118fab76
unprefixed, duplicating : honest == forged True
PREFIXED,   duplicating : honest == forged True
RFC 6962 shape          : honest == forged False
```

The second line is the correction. Prefixes on, duplication kept: the 305-leaf honest set and
the 306-leaf padded set still hash to one root. The third line is the fix: the RFC 6962 shape
separates them.

## What this changes, and what it does not

- **Changes:** the sentence "domain separation would close this by construction". A
  `csoai.public-root/v2` that adds prefixes but keeps odd-node duplication would still be
  collidable by padding. v2 must change the tree shape (RFC 6962 split, or promotion of the
  odd node — the 17 September note already showed promotion resists this particular
  padding), and should keep the signed count regardless.
- **Does not change:** the reproduction of the collision, the finding that `card_count`
  inside the signed preimage is what disambiguates, the two corollaries for verifiers, the
  second finding that the estate runs two tree shapes, and `scripts/verify_public_root.py`.
- **Does not change:** any measurement card, any signature, or any published root.

## How this was caught

Re-reading the note for the W3C Agent Conformance CG text (18 September 2026), where our
count-binding line was being quoted, and asking what a prefix does to two equal leaves. The
answer is nothing, and the script above is the proof.

## Pointers

- Corrected document: `corrections/merkle-count-binding-2026-09-17.md` in
  <https://huggingface.co/datasets/csoai/councilof-ai-mirror> — unchanged.
- This correction: `corrections/merkle-count-binding-2026-09-18-SUPERSEDES.md` in the same
  dataset, and `public/corrections/` in the `councilof-ai` repository.
- Register: <https://councilof.ai/api/corrections>, id C-2026-0922-01.
- Index of supersessions: `corrections/SUPERSESSIONS.md` beside both files.

CSOAI measures. This corrects one of our own sentences. It is not a certification, and it
grades nothing.
