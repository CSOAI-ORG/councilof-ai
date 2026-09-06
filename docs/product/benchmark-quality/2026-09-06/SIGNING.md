# Signing path — STAGED → MEASURED → into the root

Today every row is `STAGED`. STAGED means: produced by the committed producer from committed
bytes, self-consistent, and unsigned. Nothing in `register.py` can write MEASURED, and the
test suite asserts that it did not.

## The gate

A publisher row may be signed to MEASURED only when

    resolved = PASS + FAIL  >=  30      (of 35 predicates)

and the signer re-checks the count rather than trusting the card. On the 6 Sep 2026 run:

| publisher | resolved | eligible at the gate |
|---|---|---|
| epoch-ai | 35 | yes |
| uk-aisi-inspect | 34 | yes |
| artificial-analysis | 33 | yes |
| council-of-ai | 33 | yes |
| lmarena | 33 | yes |
| vals-ai | 33 | yes |
| scale-seal | 30 | yes |
| **helm-crfm** | **4** | **no — stays UNMEASURED** |

HELM's results surface returned 45 characters of visible text: a client-rendered shell.
Thirty-one of its cells are UNMEASURED for that one reason. It must not be signed, it must
not be shown with a count that looks like a low score, and the page must say the sentence
"the results surface did not render server-side" wherever the row appears. This is the row
most likely to be misread as a poor showing, and it is the row that says the least.

## The steps

1. **Produce and prove.**
   `python3 scripts/benchmark_quality/register.py` then `--check`, then `test_register.py`.
   A red on any of the three stops the sign. Do not sign a card whose producer has drifted.

2. **Sign via OIDC, never a laptop key.**
   The signer is GitHub Actions OIDC → `POST /api/board-sign`, exactly as
   `scripts/sign_mill_cards.py` does it: no PKCS8 is loaded locally, the DID that actually
   signed (`did:web:csoai.org#board-attestation-1`) is recorded on the card, and the
   workflow filename must be in the OIDC allowlist. `BOARD_SIGN_KEY_PKCS8_B64` being absent
   from the repo is by design and is not the error to chase if a run fails.

3. **Sign the WHOLE card, not the payload.**
   The card-v0 leaf rule digests the payload only, which leaves `subject`, `source_urls` and
   `as_of` outside the signature. This register's rows are nothing but claims about source
   URLs, so a payload-only digest would leave the load-bearing part unsigned. Land these as
   **card-v1 leaves** — the digest covers the whole card — or the signature does not mean
   what the page says it means. `scripts/test_card_digest_covers.py` is the existing test
   for that rule.

4. **Content-address, never overwrite.**
   `signed-<publisher>-<digest12>.json`. A changed body lands on a different path, so a
   published row can never be silently edited. A corrected row SUPERSEDES its predecessor
   and both stay resolvable, with the superseding entry in the ledger.

5. **Into the public root.**
   Add the signed leaves to the next `public/root.json` build via the normal path
   (`scripts/publish_public_root.py`), so each row ships its Merkle inclusion proof, and the
   root gets its Rekor witness. The pointer check (MATCH / DRIFTED) applies unchanged.

6. **Only then flip the word.**
   `status: "MEASURED"` is written by the signer, on the signed card, after the gate passed.
   `helm-crfm` keeps `UNMEASURED` and gets the sentence, not the flip.

## What signing does and does not assert

Signing asserts: these bytes are the bytes we published, on that date, by that key. It asserts
nothing about whether a publisher is good, and it does not convert a measurement into a
certification. The card keeps `not_a_certificate: true` after signing, and the words
certified, accredited, approved and endorsed must never describe a subject of this register.
