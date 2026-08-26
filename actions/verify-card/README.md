# Verify signed measurement card (GitHub Action)

A stranger-verifiable, fail-closed GitHub Action that recomputes an AI-measurement card's
`content_id` and verifies its Ed25519 signature — **offline, zero trust, no network to us**.
It proves a card is authentic and unmodified, so a pipeline can depend on it. Measurement,
not certification: the badge **verifies, never ranks**.

> The verify logic is the same code that guards the Council of AI public board (`docs/` +
> `scripts/verify_signed.py`). If any deployed card was tampered with, this Action fails closed.

## Usage (in any workflow)

```yaml
- uses: CSOAI-ORG/councilof-ai/actions/verify-card@main
  with:
    artifact: ./.cards/my-model-card.json   # or a https:// URL
```

## Inputs

| input | required | default | meaning |
|---|---|---|---|
| `artifact` | yes | — | path to the signed JSON card, or a URL |
| `fail_on_mismatch` | no | `true` | exit non-zero on tamper (fail-closed) |

## Output

`content_id` = `verified` or `unverified`.

```yaml
- uses: CSOAI-ORG/councilof-ai/actions/verify-card@main
  id: vcard
  with: { artifact: card.json }
- run: echo "card ${{ steps.vcard.outputs.content_id }}"
```

## What it proves

1. The card's canonical body (sorted keys, compact separators) hashes to the published `content_id`.
2. That `content_id` verifies as a valid Ed25519 signature under the card's embedded public key.

If either fails and `fail_on_mismatch: true`, the step exits non-zero — a pipeline cannot proceed
on a tampered card. It never asserts a score, grade, or ranking.

## The card

A Council of AI measurement card (`csoai.*/0.1`, `not_a_certification: true`) is a compact
JSON object whose `content_id` is the SHA-256 of its canonical body and whose `signature` is an
Ed25519 signature over that `content_id`. The public key is embedded in the card; the did:web
trust root proves the issuer. Verify against `.well-known/did.json` for the full stranger check.

## Badge

> Add a "Measured by Council of AI" trust signal to your model card/README:

```md
[![Measured by Council of AI](https://img.shields.io/endpoint?url=<verified-card-endpoint>)](https://councilof.ai)
```

*(Replace `<verified-card-endpoint>` with a URL that returns a JSON verdict; the badge shows
"verified" only when the signature is valid — never a score.)*
