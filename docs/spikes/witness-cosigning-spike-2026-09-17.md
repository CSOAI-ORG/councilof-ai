# Witness cosigning against split-view — written spike

**17 September 2026 · M4 lane · SPIKE ONLY, nothing deployed.** Actions is disabled and
DEPLOY-LOCK stands. Nothing here changes a served byte.

## The hole

A log kept by one operator cannot detect its own equivocation. If `root.json` showed tree A to
one reader and tree B to another, every signature in both would verify, every inclusion proof
in both would check out, and no reader could tell. Our OTS proofs would not catch it either: a
timestamp says a hash existed before a Bitcoin block, not that it was the only hash we served.
Neither would Rekor, which is a log with the same problem one layer up. (Our OTS path itself is
intact and lives in `scripts/badger/ots_stamp.py`; this is about what a timestamp can and cannot
say, not about whether we hold one.)

Nobody has accused us of this. The point is that **we could not prove we had not done it**, and
neither could anyone else. That is the gap witness cosigning closes, and it is the cheapest
credibility we can buy: the field's answer (C2SP `tlog-witness`) is mature, and a witness costs
approximately nothing to run.

## What a witness would actually be signing

This has to be stated precisely, because "witnessed" will be read as "verified" and it is not.

A witness signs **one sentence**: *at this moment, this log's tree of size N had root hash R,
and R is consistent with the tree I last saw from this log.*

It does **not** say:

- that any measurement in the log is correct — a witness never reads a card body;
- that the issuer is who it claims to be;
- that the cards mean what their `subject` says;
- anything at all about MEASURED / UNMEASURED.

A witness cosignature is evidence about **history**, not about **content**. If a future page says
"witnessed by N independent parties" next to a measurement claim, that is the same defect as
`SIGNED ✓` over an artifact whose own field said NOT_ESTABLISHED. The banner must say what the
field says: *history cosigned, content unexamined.*

## What does NOT fit — read this before anything else

The honest finding of this spike is that **our current root cannot be witnessed at all**, and the
reasons are structural, not cosmetic. One of them (item 2) I got wrong on the first pass and only
found by reading the published bytes — it is corrected in place below rather than quietly removed.

### 1. Our tree is not RFC 6962 (blocking)

`root.json` declares its own node rule: *parent = sha256(left || right) over raw digests, odd node
paired WITH ITSELF, no domain-separation prefix.* Every one of those three differs from RFC 6962,
which prefixes leaves with `0x00`, interior nodes with `0x01`, and promotes an odd node rather than
duplicating it. A witness implementing `tlog-witness` verifies consistency proofs under RFC 6962
hashing. Handed our tree, it does not fail politely — it cannot parse the structure as a log.

Our own envelope already documents the consequence (`tree_caveat`): odd-node duplication makes the
shape collidable in the CVE-2012-2459 sense, closed only because `card_count` is inside the signed
preimage. That is a real mitigation for *our* verifier and worth nothing to a *standard* one.

The integrity patch under review (`csoai-rfc6962-sha256-batch-v2`) implements exactly the right
thing: `0x00`/`0x01` domain separation, odd-node promotion, and `tree_size` + `leaf_index` carried
in every proof. **C depends on B.** Without that hashing change, witnessing is not a roadmap item,
it is impossible.

### 2. Successive roots are RE-DERIVED, not appended (blocking, and the worst one)

I first wrote this section claiming the leaves were sorted by digest. **That was wrong** — I had
carried it over from a different file's merkle code without checking the published bytes. The
leaves are not sorted. What the bytes actually show is worse.

Every revision of `public/root.json` in git history — **28 revisions, 2026-09-07 → 2026-09-15**:

| measure | value |
|---|---|
| append-only transitions | **0 of 27** |
| transitions that lose leaves | **27 of 27** |
| declared `card_count` decreases | **8** |
| distinct leaves across the window | **2,557** |
| leaves present in **every** revision | **0** |
| leaves appearing in exactly one revision | **2,022 (79%)** |
| leaves that left and later returned | 16 |

Declared counts, in publication order: 168, 167, 169, 167, 168, 197, 197, 228, 257, 257, 264, 269,
294, 291, 297, 298, 299, 299, 304, 300, 305, 304, 305, 303, 303, 312, 311, 305.

No transition extends its predecessor. The declared count goes **down** as often as up. Two-thirds
of everything the root has ever anchored appears in a single publish and is gone from the next. One
transition (2026-09-15T05:30Z) shares **zero** leaves with the revision before it — 312 in, 311 out,
nothing in common.

So `public/root.json` is not a log and not a growing catalogue. It is a **fresh snapshot of whatever
the producer harvested that run**. The shape is consistent with a producer that re-derives its input
set each time rather than appending to a history — not with anything deleted by hand.

The consequence for witnessing is terminal: a witness signs *"tree N+1 is consistent with tree N"*
and here there is no such relation to sign. Witness cosigning is not merely unimplemented, it is
**not yet meaningful**.

The consequence for a reader is more immediate and does not wait for witnesses: an inclusion proof
is issued against one root. If that leaf is not in the next root — a two-in-three chance, on this
evidence — the proof still verifies against the root it was cut from, while the leaf is absent from
the published set. Nothing on the surface tells the reader which state is current.

Reproduce: `python3 scripts/audit_root_leaf_churn.py 28` → machine artifact
`docs/reconciliation/public-root-churn-2026-09-17.json`, write-up
`docs/reconciliation/PUBLIC-ROOT-IS-NOT-A-LOG-2026-09-17.md` (including what it does NOT show).

Options, none free:

- **(a) Make the producer append.** Entries accumulate in arrival order; the root grows monotonically.
  This is a change to `scripts/publish_public_root.py`, not to any signed byte, and it is the
  prerequisite for everything else in this document.
- **(b) Keep re-deriving, and say so on the surface.** `root.json` would state plainly that it is a
  point-in-time snapshot, that successive roots have no consistency relation, and that an inclusion
  proof is valid only against the root it names. Free, true today, and the current silence is the
  actual defect.
- **(c) Both**, in that order.

Recommendation: **(b) now, (a) next.** (b) needs no signer and no deploy of substance; (a) needs the
producer changed and a fresh root published, which needs the signer, which is dead.

### 3. No checkpoint, and our envelope is not a note (blocking, but small)

`tlog-witness` speaks in signed notes: an origin line, a tree size, a base64 root hash, then
signature lines each carrying a 4-byte key hint. We sign a compact JSON preimage
`{did, schema, surface, as_of, sha256}` and publish `sig_ed25519` as **hex**. The primitive matches
(Ed25519); the framing does not. Nothing in the note format can carry `as_of`, `did`, or
`card_count`, and nothing in our envelope can carry a witness signature line.

So the envelope does not extend — a checkpoint has to be emitted **alongside** it, with the
root.json note-hash bound into the checkpoint body so the two cannot drift.

### 4. Origin identity does not exist yet (small)

A checkpoint's first line is a stable origin string, e.g. `councilof.ai/public-root`. We have
`did:web:csoai.org#board-attestation-1`, which is a **key identifier**, not a log origin. One
string to choose, then never change — changing it forks the log's identity.

### 5. The signer is dead, so none of this can be signed today (operational)

Checkpoints must be signed by the log key. Board signing runs inside GitHub Actions via OIDC and
Actions is disabled account-wide. A spike can be written; a checkpoint cannot be issued. Do not let
"witness support" ship as a claim before a single signed checkpoint exists.

### 6. k-of-n policy has no home (small)

Clients need the witness key set and the threshold **out of band** — never from the artifact being
verified, exactly as the integrity patch takes `trusted_key_ids` from the caller rather than from
the bundle. That means a published, versioned witness policy (`which keys`, `what k`, `since when`)
and a rule that a policy change is itself an event with a date. Absent that, "k-of-n" is decoration.

## tlog-tiles / Tessera on R2 — does it fit?

**Fits well:** the tile layout is static files under fixed paths. It needs no dynamic server, which
is precisely what our estate already does best — Cloudflare Pages / R2, no origin to keep alive,
and public to anonymous readers (unlike our GitHub, which 404s to everyone but us). Serving tiles
is the easiest part of this whole document.

**Does not fit:**

- Tessera is a **Go** library and assumes it owns the append path (sequencing, deduplication,
  integration). Our root is produced by `scripts/publish_public_root.py` in Python and rebuilt
  wholesale each run. Adopting Tessera means the log's write path stops being that script.
- Tile layout assumes the append-only ordering we do not have (see 2). Tiles of a re-sorted set
  would have to be rewritten on every publish, which defeats the format.
- Our leaves are *whole cards minus signature*; tlog-tiles entries are opaque byte strings. That
  part is compatible — but only once the leaf hash is RFC 6962.

## What `root.json` would need, concretely

To accept k-of-n cosignatures, the published surface needs **four** things it does not have:

1. an **append-only** entry sequence with RFC 6962 hashing (items 1 and 2 above);
2. a **checkpoint** artifact: origin, tree size, root hash, log signature — published as a note,
   not as our JSON envelope;
3. **witness signature lines** appended to that checkpoint, each from an independent key, with a
   published policy naming the keys and the threshold;
4. a **verifier** that refuses a checkpoint carrying fewer than k valid witness signatures, and
   says so in a field — never a banner.

And one rule that is not an artifact: a witness we operate is not independent. k-of-n with n keys
we hold is theatre. The first real witness has to be someone else's.

## Smallest honest step available today

Publish the limitation (option **c**). One paragraph on the root's own surface saying: this is a
signed snapshot, not an append-only transparency log; consistency proofs between successive roots
do not exist; split-view detection is therefore unavailable, and no witness cosigns it. That is
true right now, costs nothing, needs no signer, and it is the difference between a gap and an
undisclosed gap.

## Proving command

```bash
python3 - <<'PY'
import json, urllib.request as u
# A User-Agent is required: the zone 403s urllib's default. That is blocker #2 in the
# harness header and it bites every naive reader, so it is part of the command.
req = u.Request("https://councilof.ai/root.json", headers={"User-Agent": "csoai-spike"})
r = json.load(u.urlopen(req, timeout=30))
print("append-only?   :", r["card_sha256"] != sorted(r["card_sha256"]), "(False = sorted set = no consistency proofs)")
print("node rule      :", r["node_definition"][:72])
print("checkpoint     :", "checkpoint" in r or "tree_size" in r)
PY
```

Expected today: a node rule that is not RFC 6962 and no checkpoint field. For the append-only
question the single-snapshot endpoint cannot answer it — run `scripts/audit_root_leaf_churn.py`,
which reads successive published revisions out of git and reports 0 of 11 append-only transitions.
