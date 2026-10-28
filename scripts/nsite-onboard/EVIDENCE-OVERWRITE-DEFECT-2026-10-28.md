# Correction: the lane overwrote evidence in place, and 15 rows pinned bytes that no longer exist

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026.**

**Supersedes** nothing; it records a defect in the lane's own evidence store, the fix, and the
rows whose pins can no longer resolve. `done.jsonl` is **not** rewritten: it is append-only, and
a row is the record of what was published at the time.

---

## What was wrong

`onboard_one.py` wrote each run's evidence bundle to `evidence/<id>.json` — a path that is a
function of the DOMAIN, not of the content. A domain can legitimately be onboarded more than
once, because it appears in more than one of the owner's source records. The second run
overwrote the first run's bytes.

The row in `done.jsonl` pins `bundle_sha256` — a digest of the bundle body at the time that row
was written. When the next run overwrote the file, **the pinned bytes stopped existing**. The row
still carried a digest that resolved to nothing.

Measured on 28 Oct 2026: **1,486 rows over 1,471 distinct domains; 9 domains had been onboarded
more than once** (one four times), and **15 rows pinned bytes that were gone**. A reader checking
those rows would find a digest and no file — the same failure class as a card that pins bytes
nobody can reproduce.

## What is fixed

Evidence is now **content-addressed**, the rule the card signer already follows
(`sign_mill_cards_podtoken.py`): *"a changed body lands on a different path, so an existing signed
card can never be overwritten."* A run writes `evidence/<id>.<bundle_sha256>.json` as the copy of
record, and `evidence/<id>.json` remains the "current run for this domain" pointer. A re-read now
lands on a new path; the earlier bytes survive; the earlier row's pin keeps resolving.

`build_presence_ledger.py` now resolves a row by its **content hash** rather than by the
domain's current file, because a row pins bytes, and bytes are what resolve.

## What does not stand

- The **15 historical rows** whose bytes were destroyed cannot be repaired: the first run's
  bundle body is not recoverable from anything the lane kept. They stay **UNVERIFIABLE** in the
  ledger, with the row's digest and the recomputed digest published side by side. A ledger that
  hid them would be a scoreboard.
- The lane's `done.jsonl` is unchanged and remains append-only.
