# gspc-card-verifier

Check a Council of AI measurement card yourself, offline, without our permission.

Apache-2.0 · zero dependencies · one file if you want it that way · Node 19+ (or Deno/Bun with
WebCrypto Ed25519).

---

## What this proves, and what it does not

Read this before the code. Both halves are load-bearing.

**It proves:** the measurement bodies you have were signed by the holder of the published
`card-attestation-1` key, and have not been altered by so much as one character since. Change
a digit in an accuracy figure and the check fails loudly. Re-sign it with any other key and the
check fails loudly. That is an integrity claim about bytes, and it is a strong one.

**It does not prove the measurement is correct.** A signature says who wrote something down,
not whether what they wrote down is true. Whether an accuracy figure reflects reality rests on
the method, the gold labels and the graded rows — published separately, and the thing you should
actually argue with. A perfectly valid signature over a badly-run measurement is a perfectly
valid signature over a badly-run measurement.

**It does not prove the published set is complete — and the gap is smaller than it was, but
it is not zero.** The chain manifest at `/signed/chain.json` lists every position, head to
genesis, including the ones whose body is not published. That is a real improvement on
publishing a subset: a withheld card becomes a counted, ordered tombstone instead of an
absence indistinguishable from a card that never existed. As of this build:

| | |
|---|---|
| positions declared | 335 |
| bodies published, each verifying | 313 |
| bodies withheld | 22 |
| withheld positions **a signature commits to** | **1** |
| withheld positions asserted **only by the unsigned manifest** | **21** |

That last row is the part to read twice. A published card's `prev` sits *inside* the signed
body, so when a published card names a predecessor, that predecessor's id and place in the
order are committed to by a signature — whether or not its body is published. But the manifest
file itself carries no signature. In a run of consecutive withheld positions, only the one
adjoining a published successor is attested that way; the rest of the run exists because an
unsigned file says so. Nor can a withheld position's signature be checked at all: Ed25519 signs
the message, and the message is the body you were not given.

So: the walk from head to genesis resolves with no gaps, every published body verifies, and 21
of the 335 positions rest on trust rather than on cryptography. `gspc-verify --chain` reports
exactly that split and **exits 3**, not 0.

**The index is not signed either.** `card_index.json` carries no signature. Adding, altering or
omitting entries breaks nothing cryptographic. Treat it as a convenience listing for fetching
files, never as evidence of what exists. Completeness is therefore reported separately from
validity throughout this tool: they are different claims and they fail differently.

**This is not a certification and we do not issue one.** There is no badge, no seal, no pass
mark, nothing to buy. There is a signature over some bytes and a tool that checks it. What you
conclude is yours.

`unmeasured` is a published status, not a gap. A cell with no measurement is published as
`unmeasured` rather than omitted, imputed, or quietly rendered as zero.

---

## Quickstart, from an empty directory

Nothing but `curl` and a runtime. No package manager, no clone, no account.

```bash
# The origin serving the cards. Change it if you mirror them, or point it at your own.
BASE=https://councilof.ai

# 1. The verifier — one file, no dependencies.
curl -sSfO "$BASE/verifier/gspc-verify.mjs"

# 2. The key you are going to pin, from the DID document. Fetch it ONCE, keep the copy.
curl -sSf "$BASE/.well-known/did.json" -o did.json

# 3. Some cards, the index, and the chain manifest.
curl -sSf "$BASE/signed/card_index.json" -o card_index.json
curl -sSf "$BASE/signed/chain.json" -o chain.json
mkdir -p cards
curl -sSf "$BASE/signed/cards/$(python3 -c "import json;print(json.load(open('card_index.json'))['cards'][0]['card'])").json" \
  -o "cards/first.json"

# 4. Check it, pinning the key from your local copy of the DID document.
node gspc-verify.mjs cards/ --did-document did.json
```

To check the whole published set — note the `rm -rf`, because the single card fetched above
is one of these and counting it twice would inflate the tally:

```bash
rm -rf cards && mkdir cards
python3 -c "
import json
for e in json.load(open('card_index.json'))['cards']: print(e['card'])
" | xargs -P8 -I{} curl -sSf "$BASE/signed/cards/{}.json" -o "cards/{}.json"

node gspc-verify.mjs cards/ --index card_index.json --chain chain.json --did-document did.json
```

Expect `VALID 313 · INVALID 0 · UNCHECKABLE 0`, a manifest walk of 335 positions reaching
genesis, and **exit 3** — because 21 withheld positions are asserted rather than signed for.
That is the correct answer for the currently published set, for the reasons given above.

Everything after step 3 works with the network unplugged. That is the point: **evidence you hold
must be checkable by you, with the records and nothing else.** If verification needed our server
to answer, we could stop answering, and the proof would evaporate. It does not need us.

### Exit codes

| code | meaning |
|---|---|
| `0` | every card VALID, and the set is self-consistent and complete |
| `1` | at least one card **INVALID** |
| `2` | at least one card **UNCHECKABLE**, or the command could not run |
| `3` | every card valid, but the **set** is incomplete or disagrees with its index |

A positive result is never returned on a path that did not complete. Against the currently
published set the honest answer is **3**, and you should expect to see it.

---

## Three states, never two

```
VALID        the path completed and the signature checks out
INVALID      the path completed and the card fails — a positive claim of failure
UNCHECKABLE  the path did NOT complete — not a pass, and not an accusation
```

The third state is why this tool exists in the form it does. Collapsing "I could not check
this" into either "fine" or "forged" reports a result that was never earned. Every outcome
carries a distinct code:

| state | code | when |
|---|---|---|
| VALID | `OK` | signature verifies under the pinned key |
| INVALID | `PUBKEY_NOT_PINNED` | signed by some other key than the one you pinned |
| INVALID | `ID_MISMATCH` | the body does not hash to the id the card claims |
| INVALID | `SIGNATURE_MISMATCH` | the signature does not verify under the pinned key |
| UNCHECKABLE | `NOT_A_CARD` | no `body`; not a card at all |
| UNCHECKABLE | `MALFORMED_CARD` | structurally broken envelope |
| UNCHECKABLE | `OUT_OF_PROFILE_DOMAIN` | outside what the profile declares it can canonicalise |
| UNCHECKABLE | `NO_PINNED_KEY` | no key was pinned, so nothing could be authenticated |
| UNCHECKABLE | `NO_ED25519_RUNTIME` | this runtime cannot do Ed25519; the card was NOT checked |
| UNCHECKABLE | `UNREADABLE` | the file is not parseable JSON |

Set-level findings are reported separately, because a valid card in an incomplete set is still
a valid card.

About the cards you hold and the index: `CHAIN_INCOMPLETE`, `CHAIN_FORKED`, `CHAIN_NO_PREV`,
`INDEX_ENTRY_MISSING`, `CARD_NOT_INDEXED`, `INDEX_COUNT_MISMATCH`, `INDEX_HEAD_MISSING`,
`INDEX_UNSIGNED`.

About a chain manifest given with `--chain`: `CHAIN_WALK_BROKEN`, `CHAIN_ORPHAN_LINK`,
`CHAIN_DUPLICATE_POSITION`, `CHAIN_LENGTH_MISMATCH`, `CHAIN_SIG_DIFFERS`, `CARD_NOT_IN_CHAIN`,
`CHAIN_MANIFEST_MALFORMED`, `WITHHELD_BODY`, `WITHHELD_UNATTESTED`, `CHAIN_UNSIGNED`,
`BODY_NOT_HELD`.

Three of those describe your own copy rather than the evidence — `INDEX_UNSIGNED`,
`CHAIN_UNSIGNED` and `BODY_NOT_HELD` — and do not change the exit code. Holding a subset is
not a defect in what was published.

### Out of profile domain: it stops, it does not guess

A preimage outside the profile's declared domain gets `OUT_OF_PROFILE_DOMAIN` and **stops**. It
is never canonicalised on a best-effort basis, because a best-effort canonicalisation turns
"I do not know" into a verdict. Concretely, the verifier refuses to proceed when:

- the card declares a `preimage_rule` the profile does not implement (e.g. RFC 8785 JCS);
- `body.kind` is not a kind the profile covers;
- `alg` is not the profile's algorithm;
- an **integral number appears in a field the profile does not classify** as float or int
  (see below);
- a float would need exponent notation, where CPython and ECMAScript disagree on formatting;
- an integer exceeds the exactly-representable range, so the parsed value may already differ
  from the signed bytes.

---

## The canonicalisation caveat, stated rather than hidden

The cards declare their own preimage rule, and it is **not** RFC 8785:

```
id        == sha256(preimage).hexdigest()
preimage  == json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
signature == Ed25519(preimage) under the pinned key
```

CPython renders a float of integral value as `0.0`. ECMAScript `JSON.stringify`, Go's
`encoding/json` and JCS all render the same value as `0`. **116 of the 313 published cards
contain such a value**, so a naive JavaScript or Go verifier computes different bytes and
reports a *false failure* on roughly a third of the set. This package handles it, once, in
`src/canonical.mjs`, where you can read it.

We cannot fix this by re-canonicalising: every card id is the SHA-256 of these exact bytes, so
changing the rule would invalidate every id and break every citation to one. A future card
format should use JCS. These cannot migrate.

The honest limit that follows: **JavaScript cannot distinguish `0` from `0.0` at runtime** —
both are the same IEEE-754 double. A JS verifier cannot infer which fields were floats; it has
to be told. `profile/csoai-gspc-1.json` tells it:

```json
"numbers": {
  "floatFields": ["accuracy", "ci_low", "ci_high", "precision", "recall", "f1"],
  "floatSuffixes": ["_ci_low", "_ci_high", "_accuracy"],
  "intFields": ["n", "n_items", "n_cards", "n_cells", "count"],
  "intSuffixes": ["_count", "_n"]
}
```

An integral number in a field on neither list has no correct answer, only a guess — so it is
`OUT_OF_PROFILE_DOMAIN`. Python implementers are unaffected: `json.dumps` already does the
right thing, and `HOW-TO-VERIFY.md` gives a ten-line Python check.

---

## Verifying your own cards

The format is not ours to keep. Adopt it and this tool verifies your cards with no change to
the code:

```bash
node gspc-verify.mjs mycards/ --pubkey <your 64-hex Ed25519 key>
node gspc-verify.mjs mycards/ --profile my-profile.json      # your own float/int declarations
node gspc-verify.mjs mycards/ --did-document my-did.json --key-id '#my-key-1'
```

Copy `profile/csoai-gspc-1.json`, change `pinnedPubkeyHex`, `bodyKinds`, `genesisMarkers` and
the `numbers` lists. Nothing in `src/` is specific to us.

The JSON Schemas are in `schema/` and are also served at `/verifier/`:

- `gspc-measurement-card.schema.json` — the card envelope and body
- `gspc-card-index.schema.json` — the index, with its unsigned status stated in the schema itself

Schema validity is necessary but **not sufficient**: a schema-valid card can still be a forgery.
The schemas describe shape. Only the verifier speaks to authenticity.

---

## As a library

```js
import { verifyCard, analyseSet, defaultProfile } from "gspc-card-verifier";

const profile = defaultProfile();            // or your own object
const result = await verifyCard(card, profile);
// { state: "VALID" | "INVALID" | "UNCHECKABLE", code, reason?, id?, axis?, model? }

const set = analyseSet(validCards, index, profile, chain);
// { nCards, tips, danglingPrev, chainComplete, findings }

const chainReport = analyseChain(validCards, chain, profile);
// { ok, positions, walkLength, reachesGenesis, bodiesHeld, bodiesDeclaredPublished,
//   withheld: { total, attestedBySignedPrev, assertedOnly }, findings }
```

`verifyCard` never throws on bad input and never fetches anything.

---

## Tests: proof that it can fail

A verifier that has only ever been shown succeeding is indistinguishable from `return "VALID"`.

```bash
node --test test/*.test.mjs
```

The suite asserts the exact state **and** the exact code for a tampered body, a card signed
with a foreign key, a malformed card, a non-card, unparseable bytes, out-of-domain numbers, an
out-of-domain preimage rule, and a card whose id was recomputed to match its altered body. It
also rejects broken chain manifests: a walk that misses genesis, a cycle, an orphan link, a
declared length that disagrees with the listing, a manifest signature that differs from the
card file, and — the one that matters — a withheld position that no signed body names.

Two fixtures carry a companion assertion showing what a weaker verifier would have concluded:

- `04-foreign-key.json` is entirely self-consistent — its id hashes correctly and its signature
  verifies under the key it carries. **A verifier that skips key pinning calls it VALID.** The
  test proves that first, then proves this tool calls it `PUBKEY_NOT_PINNED`.
- `03-tampered-id-recomputed.json` satisfies `id == sha256(body)`. **A verifier that stops at
  the hash calls it VALID.** Only the signature catches it.

Regenerate the fixtures with `node test/make-fixtures.mjs <a-real-card.json>`; the foreign key
is generated and discarded at that moment. They are committed so the suite runs offline.

---

## Files

```
bin/gspc-verify.mjs      CLI — reads local files, opens no sockets
src/canonical.mjs        the CPython-compatible preimage, and where it refuses to guess
src/verify.mjs           three-state verification and set-level chain analysis
src/did.mjs              pull a pinned key out of a local DID document
src/index.mjs            library entry point
profile/                 the verification profile: pinned key, kinds, number declarations
schema/                  card and index JSON Schemas
test/                    the failing-case suite and its committed fixtures
scripts/bundle.mjs       emits the single-file build published at /verifier/gspc-verify.mjs
```

The measurement harness that produces these cards is **not** in this package and is not open
source. That split is deliberate: verification must not depend on the verifier having access
to, or the cooperation of, the party being verified. You can check every result we publish
without us. See `NOTICE`.

## Licence

Apache-2.0. See `LICENSE` and `NOTICE`.
