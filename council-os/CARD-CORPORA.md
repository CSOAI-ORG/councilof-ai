# CARD CORPORA — the three card counts, and which one you mean

**There is no single "card count" in this estate. There are three, they are about
different bytes, and they do not overlap.** Quoting one of them as "the" card count is
how the same number arrived in twelve reports meaning three different things.

Read this with [`QUOTING-NUMBERS.md`](QUOTING-NUMBERS.md): quote by **field path**, carry
the `kind`, carry the `as_of`. The values below were read on **2026-09-05** and are shown
so you can recognise the shape — **re-read them before you publish one.**

---

## The three

| # | corpus | artifact | field | `/api/state` path | kind | read 2026-09-05 |
|---|---|---|---|---|---|---|
| 1 | **Card wrappers on disk** | `public/cards/*.json` | `public/cards-bundle.json` → `card_count` | *(not carried)* | build aggregate | 1072 |
| 2 | **Public-root Merkle leaves** | `public/root.json` | `card_count` | `public_root.card_count` | `catalogued` | 152 (deployed == committed == bundle) |
| 3 | **Signed card index** | `public/signed/card_index.json` | `n_cards` == `n_cells` == `cards[].length` | `signed_cards.count` | `catalogued` | 335 |
| 3v | **…of those, verified** | card bodies in `public/signed/cards/` | — | `card_chain.bodies_verified_valid` | **`measured`** | 335 |

### 1 — the wrapper count (1072). Not evidence of anything.
`scripts/generate-cards-bundle.mjs` says so itself: it "copies bytes that already exist
under /cards/ and /proofs/; **signs nothing, measures nothing**." It is a build-time
aggregate of files on disk. It is not an attestation, not a measurement, and not a board
figure. It has no `as_of` of its own and is not carried in `/api/state`.

### 2 — the public-root leaves (152). Signed, but scoped.
`public/root.json` is a `csoai.public-root/v0` envelope signed under
`did:web:csoai.org#board-attestation-1`. Its `merkle_root` is computed over `card_sha256[]`,
so "stranger inclusion" means membership in *that* list. Verified 2026-09-05: the deployed
copy, the committed copy and `cards-bundle.json` → `root_card_count` **all read 152**, same
`merkle_root cf9f5488…`, same `as_of`. An earlier 152/153 split was **build-timing drift,
not disagreement**, and it has since closed — if the two ever diverge again, read `as_of` on
the one you fetched and say which host it came from rather than reconciling them. A valid OTS proof here covers `root.json` **bytes
only**; it does not anchor the signed-card index and does not anchor GSPC.

### 3 — the signed card index (335). The only one where a check was run.
`public/signed/card_index.json` is internally consistent: `n_cards == n_cells ==
cards[].length == 335`, and `signed_cards.header_agrees` publishes that as a boolean —
**if it is ever false, neither number is quotable.** Separately,
`card_chain.bodies_verified_valid` is `335` with `kind: measured` and
`distinct_signing_keys: 1`: each id was recomputed from the canonical body and its Ed25519
signature checked against the pinned `card-attestation-1` key, by the same verifier we
publish at `/signed/verify-card.mjs`. That is the one figure here behind which a
verification actually happened.

---

## They are disjoint, and that is recorded

`/api/state` → `signed_cards.corpus_relation`:

```
relationship:                    SEPARATE_CORPORA
public_root_leaves:              152
separately_indexed_signed_cards: 335
identifier_overlap:              0
duplicate_public_root_ids:       0
duplicate_signed_card_ids:       0
ots_scope:                       PUBLIC_ROOT_BYTES_ONLY
```

**Zero overlap.** So:

- Never add them. 152 + 335 is not a card count; it is two subjects glued together.
- Never reconcile them. They are not two readings of one thing, so there is no
  disagreement to resolve and nothing to "pick the right one" from.
- Never let one stand in for another. The public root is not "the cards"; the wrapper
  count is not "the chain"; the index is not "the root".

## Saying it correctly

> The signed card index carries **335** cards and **335 of 335 verify** under
> `did:web:csoai.org#card-attestation-1` (`/api/state` → `card_chain.bodies_verified_valid`,
> kind `measured`). That is a different corpus from the **152** public-root Merkle leaves
> (`public_root.card_count`, kind `catalogued`) — `signed_cards.corpus_relation` records
> `SEPARATE_CORPORA` with `identifier_overlap: 0`.

Not:

> ~~The board has 335 cards.~~ · ~~Cards: 1072.~~ · ~~152 of 335 are signed.~~

The last one is the worst: it invents a ratio between two sets that share no members.

---

## History, so the correction is not re-corrected

`BOARD-RULING.md` (OWNER, 2026-08-28) settled corpus **3**: the chain is 335, and the
150-row board was a **subset** of it — not a second measurement, not a verifying-only
elite. No agent may clamp that index to 150, 313, or any other constant; it grows with
verified cards, and `scripts/signed-json-guard.mjs` is the sole structural gate.

A later note in `CLAUDE.md` set out corpora **1** and **2** correctly but concluded that
the standing "335" figure "matches neither" — true of those two artifacts, and the reason
the line needed labelling, but read as if 335 were itself unsound. It is not: it is
corpus 3, and it is the one carrying a `measured` verification. **All three numbers are
right about their own bytes.** The defect was never a wrong count. It was three counts
wearing one word.
