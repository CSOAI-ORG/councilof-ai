# csoai-gspc

Read the live **GSPC** AI-governance board and verify its Ed25519-signed measurement cards.

[![board](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcouncilof.ai%2Fapi%2Fgspc&query=%24.totals.public_count&label=GSPC%20board&color=0B1F33)](https://councilof.ai/api/gspc)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21991104-0B1F33)](https://doi.org/10.5281/zenodo.21991104)

`GET https://councilof.ai/api/gspc` is the authority. This package is a **reader**: it never caches a
verdict, never prints a number the board did not return, and reports three states and only three.

```bash
pip install "csoai-gspc[verify]"
```

The `verify` extra pulls in `cryptography` for the Ed25519 check. Without it the library still reads the
board; card verification then returns `UNCHECKABLE`, which is the honest answer and not a silent pass.

## Three states, never two

| state | means |
|---|---|
| `VALID` | the body reproduces its id **and** the signature verifies under the pinned key |
| `INVALID` | the card fails the rule — altered body, wrong key, bad signature |
| `UNCHECKABLE` | the check could not complete — no Ed25519 backend, unfetchable card, malformed file |

`UNCHECKABLE` is a different claim from `INVALID`. "I could not check" is not "it is forged", and this
library never collapses the two. `bool(verdict)` is true only for `VALID`.

## Command line

```console
$ csoai-gspc check
{"agree": true, "printed_slots": …, "printed_measured": …,
 "derived_slots": …, "derived_measured": …, ...}   # the numbers are whatever the live array holds
OK — the printed totals are derived from the axis array, not typed.

$ csoai-gspc board          # every slot, its bench, its n, its frozen bank
$ csoai-gspc axis governance
$ csoai-gspc verify acf6bf0356123632758bf6c98c83d81c7a8392c3b111b311317c516cc65133a4
VALID — acf6bf0356123632 · id and signature check under the pinned key
$ csoai-gspc root           # the Merkle root over the published cards
$ csoai-gspc snapshot       # the dated snapshot bundled with this release — not the live GET
```

`check` exists because a headline count is worth nothing if it was typed. It fetches the board, recomputes
the slot and measured counts **from the axis array**, and exits non-zero if the printed totals disagree —
so you can refute us with our own payload.

## Library

```python
from csoai_gspc import fetch_board, check_totals, get_axis, fetch_card, verify_card, pinned_key

board = fetch_board()
assert check_totals(board)["agree"]

gov = get_axis("governance", board)
print(gov["bench"], gov["n"], gov["status"])     # bench, n and status exactly as the board carries them

key = pinned_key()                                # from https://councilof.ai/.well-known/did.json
v = verify_card(fetch_card("acf6bf03…65133a4"), key)
print(v.state, v.reason)
```

## Pin the key. This step is not optional

A card carries its own `pubkey`. Verifying a card against the key it ships with proves only that the file is
*self-consistent* — anyone can alter a body, sign it with a key made a second ago, and have it "verify".
`pinned_key()` reads `did:web:csoai.org#card-attestation-1` from the published DID document, and
`verify_card` returns `INVALID` when a card's key is not that one.

## Why this library is written in Python

The published preimage rule is CPython's own serialiser:

```python
json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
```

CPython renders a float of integral value as `0.0`. ECMAScript `JSON.stringify`, Go's `encoding/json` and
RFC 8785 (JCS) all render the same value as `0`. A naive verifier in those languages computes a different
preimage and reports a **false failure** on roughly a third of the published set. In Python the rule
reproduces exactly, so this package needs no canonicalisation shim — and you should not re-canonicalise a
published card with JCS.

## Tests run against the published bytes

There are no fixtures and no mocks. The suite fetches the real DID document and a real card, asserts the
documented key, asserts the preimage rule reproduces the published id, and asserts that altering one
character or substituting the key is **loud**.

## What this is not

Not a certification, not a rating, not an endorsement, and not legal advice. A card is evidence of what
specific bytes scored on a frozen bank at a specific time. No slot is for sale.

**Lid:** printed live by `csoai-gspc board` — `totals.lid` verbatim, never typed here.

- Live board: <https://councilof.ai/api/gspc>
- Verify in a browser, free and with no account: <https://councilof.ai/gspc-verify>
- How to verify by hand: <https://councilof.ai/signed/HOW-TO-VERIFY.md>
- Every frozen bank as its own repository: <https://huggingface.co/csoai>
- Board mirror and `check-board.sh`: <https://github.com/CSOAI-ORG/gspc-board>
- Methodology DOI: <https://doi.org/10.5281/zenodo.21991104>

Issued by CSOAI Ltd (England & Wales, Companies House 16939677), 3rd Floor, 86–90 Paul Street,
London EC2A 4NE. Apache-2.0.
