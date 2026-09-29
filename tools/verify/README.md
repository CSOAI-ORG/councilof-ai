# tools/verify — check a Council of AI card yourself

Two small Python tools, CC0-1.0 (public domain dedication — copy them anywhere), for checking
a signed card, where it is anchored, and how it is shaped. They sit next to the estate's
existing verifiers rather than replacing them:

| Tool | What it checks | Network |
|---|---|---|
| `packages/gspc-card-verifier` (`gspc-verify`, Node) | signature + set/chain completeness under a pinned profile, three states | never |
| `actions/verify-card` (composite Action) | one local card, signature, via the package above | never |
| `tools/verify_any_card.py` | every signed shape in the estate (A–D), optional `--expect-key` | never |
| `harness/gspc-top100/verify_card.py` | the library: `verify_signed_card_with_did_doc` | none itself |
| **`tools/verify/card_v01_validate.py`** | card-v0.1 schema + id recomputed by the card's own `preimage_rule` | optional |
| **`tools/verify/csoai_verify.py`** | DID signature (the library above) + root inclusion + OTS proof presence | yes |
| **`actions/csoai-verify`** (composite Action) | `csoai_verify.py` in CI | yes |
| **`tools/verify/completion_record_verify.py`** | a `csoai.completion-record/0.1` (Open Badges 3.0 / VC 2.0): profile schema, eddsa-jcs-2022 proof, reproduced == published, pseudonymous subject, Bitstring Status List. `csoai_verify.py` hands any `OpenBadgeCredential` to it | only for a did:web issuer or a status list URL |

Nothing here is published to npm or PyPI. Run from a checkout.

## Requirements

Python 3.9+ and `cryptography` (`pip install cryptography`). `jsonschema` is used when
installed; without it the validator checks the load-bearing subset of the schema.

## One command

```sh
python3 tools/verify/csoai_verify.py https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json --tamper-control
```

Measured output on 2026-09-14:

```
signature  VALID  (did:web:csoai.org#card-attestation-1)
shape/id   PASS  schema=PASS id=MATCH
tamper     DETECTED  (mutated body → INVALID)
inclusion  NOT_IN_SUPPLIED_ROOTS
  - NOT_INCLUDED   https://councilof.ai/interop/card-root-2026-09-14.json
  ...
  - NOT_INCLUDED   https://councilof.ai/root.json  root_signature=VALID
ots        NOT_APPLICABLE
exit       0
```

That `NOT_IN_SUPPLIED_ROOTS` is correct, not a fault. The estate publishes **three card
corpora with zero overlap** (`council-os/CARD-CORPORA.md`): the 335 signed-index cards under
`/signed/cards` are not leaves of the card root or the public root. A card from the card root
shows the whole path:

```sh
python3 tools/verify/csoai_verify.py https://councilof.ai/interop/mill-cards-signed/signed-machiner-4a89215de8d7.json \
  --tamper-control --require-inclusion --require-ots
# signature VALID · inclusion INCLUDED (index 0 of 1387) · ots PRESENT · exit 0
```

### Steps, in order

1. **Signature.** Fetch `https://csoai.org/.well-known/did.json` (or `--did file.json`), take
   the key for the card's `did` (default `#card-attestation-1`), recompute
   `sha256(preimage) == id`, verify Ed25519. Delegated to
   `harness/gspc-top100/verify_card.py:verify_signed_card_with_did_doc`.
2. **Shape and id.** `card_v01_validate.validate` — reported, never overrides step 1.
3. **Tamper control** (`--tamper-control`). One body value is changed; step 1 must return
   `INVALID`, or the run exits 1. A verifier that cannot fail proves nothing.
4. **Root inclusion.** Card roots (`csoai.card-root/1`) are discovered from the repository
   listing of `public/interop/` (keyless; uses `GITHUB_TOKEN` if set) and fetched from
   councilof.ai, or given with `--card-root`. For each: `n_leaves == len(leaves)`, the tree is
   recomputed, the whole-card leaf is looked up and its proof folded by index parity. The
   public `root.json` (`csoai.public-root/v1`) is checked too, including its own Ed25519
   signature under `did_intended` and `len(card_sha256) == card_count`.
   Public-root card wrappers (`/cards/<first16>.json`, `{card: {sha256, sig_ed25519, did, …}}`)
   are recognised: `sha256` must equal the digest of the card minus `sha256`/`sig_ed25519`, and
   `sig_ed25519` must verify over the compact envelope `{did, schema, surface, as_of, sha256}`.
   Anything that is neither shape is `UNCHECKABLE` (exit 2) — not checked, not accused.
5. **OTS presence.** For the including root, `<root>.ots` must exist and begin with the
   OpenTimestamps magic header. **Presence only** — no Bitcoin block validation happens here.

### Exit codes

| code | meaning |
|---|---|
| 0 | signature VALID, and every `--require-*` held |
| 1 | signature INVALID, a tamper control not detected, or a root whose leaves do not recompute |
| 2 | UNCHECKABLE (unreadable card or DID document, unknown shape) or usage error |
| 3 | signature VALID but `--require-inclusion` / `--require-ots` not shown |

## card-v0.1 validator

```sh
python3 tools/verify/card_v01_validate.py --index https://councilof.ai/signed/card_index.json --tamper-control
# PASS 335 · FAIL 0 · UNCHECKABLE 0 of 335 · tamper controls undetected 0
```

It validates each card against `gspc-measurement-card-0.1`
(`packages/gspc-card-verifier/schema/`, served at `/verifier/gspc-measurement-card.schema.json`)
and recomputes `id` using the rule the card declares:

| `preimage_rule` | preimage |
|---|---|
| `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')` (or absent) | Python compact, ASCII-escaped |
| `sha256(canonical body)` | sorted compact JSON, UTF-8 literal strings, integral floats as integers, exponent forms refused |
| anything else | `UNCHECKABLE` — it stops rather than guess |

`PASS` is shape and id consistency. It is **not** a signature check.

## Tests

```sh
python3 tools/verify/test_verify_tools.py     # offline: throwaway key, synthetic DID and roots
python3 -m pytest tools/verify/test_completion_record.py   # offline: an independent Python signer
```

Each positive case has a control that must fail: tampered body, wrong key, a root whose
declared leaf count lies, a root whose leaves do not recompute, a bad root signature, a card no
root carries. `.github/workflows/csoai-verify-selftest.yml` (dispatch only) runs these plus both
Actions against live cards on a GitHub-hosted runner.

## What a green result does not establish

That the measurement is correct, complete, or current; that a card outside the roots checked
does not exist; that an OTS proof is confirmed on Bitcoin. Measurement, not certification.
