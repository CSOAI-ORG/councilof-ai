# Verifying a card: three short answers

A published record isn't certification. These answers point to the documents that
already explain each point in full.

## What does the verifier actually verify?

Two things about the bytes you hold: that the card's `id` is the sha256 of its
canonical body, and that the Ed25519 signature over that body checks out under the
key you pinned from our DID document. In other words, the card is intact and it was
signed by the key we publish.

It does not show that the measurement is correct, and it does not turn an
unmeasured field into a result. Full detail:
`packages/gspc-card-verifier/README.md` ("Three states, never two") and
`actions/verify-card/README.md`.

## How do I keep a card so I can check it again later?

Verification is designed to run on files you hold, with the network unplugged.
To keep evidence you can re-check in a year:

1. **Download the card JSON** and keep the exact bytes. Do not reformat,
   pretty-print or re-save it through a JSON tool. The id is a hash of those bytes.
2. **Download the DID document once** (`https://csoai.org/.well-known/did.json`)
   and store it next to the card. That copy is the public key you pinned on that
   day. Note the key id the card names: the published cards use
   `did:web:csoai.org#card-attestation-1` (see HOW-TO-VERIFY.md); the board root
   (/root.json) uses `#board-attestation-1`.
3. **Keep the verifier file** you used (`/verifier/gspc-verify.mjs` or
   `/signed/verify-card.mjs`), so a later check uses the same rules.
4. **Record a sha256 of each file** and the date you fetched it.
5. **Re-verify later from the local copies**, pinning the stored DID document:

   ```sh
   node gspc-verify.mjs cards/ --did-document did.json
   ```

If the live DID document later differs from your stored copy, that is a finding
to report, not something to paper over. Corrections and questions go to
https://github.com/CSOAI-ORG/councilof-ai/issues. Method notes:
https://councilof.ai/methodology/.

## What does UNCHECKABLE mean?

The check did not complete. It is neither a pass nor an accusation. The verifier
returns one of three states:

- `VALID`: the check completed and the signature verifies under the pinned key.
- `INVALID`: the check completed and the card fails (a positive claim of failure).
- `UNCHECKABLE`: the check could not complete, for example the file is not JSON,
  no key was pinned, the runtime cannot do Ed25519, or the card is outside what the
  profile can canonicalise.

`UNCHECKABLE` exits with code 2. The full list of codes is in
`packages/gspc-card-verifier/README.md`.
