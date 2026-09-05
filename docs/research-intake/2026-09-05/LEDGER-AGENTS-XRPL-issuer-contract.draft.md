# LEDGER_AGENTS — XRPL issuers with domain + toml: outward evidence-card path

**DRAFT ONLY.** Nothing here is signed, published or sent. Goal doc §4 says draft.
**Mined:** 2026-09-05, TUI-5 (research-intake lane).

## What is measured today

`GET https://councilof.ai/api/xrpl` returns 200 and reads the public root (`n=16`,
`writes_board false`). The 31 Aug alignment records **16 xrpl.fi instruments attempted**
(`xrpl.asset.state`), and `root.json` carries `xrpl_fi_assetCount: 16` with
`xrpl_asset_count_attempted: 16` and a distinct `xrpl_basket_merkle`.

Of those 16, the lane doc states **4 are two-way** — that is, the issuing account publishes a
`Domain` field AND the domain serves a `.well-known/xrp-ledger.toml` whose `[[ACCOUNTS]]`
block names the same address back. Two-way is the only direction that proves *both* halves:
the ledger points at the domain, and the domain points at the ledger.

**This draft does not name the 4.** The specific issuer set was not re-probed in this pass,
and naming issuers from a stale note is exactly the failure the corrections ledger exists for.
Before any card is written, re-run the probe below and let it name them.

```bash
# 1. issuer accounts + Domain field (hex-encoded on ledger)
curl -s https://councilof.ai/api/xrpl | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d)[:2000])"
# 2. for each account with a Domain, decode and fetch the toml
#    https://<domain>/.well-known/xrp-ledger.toml
# 3. two-way iff [[ACCOUNTS]] contains the same classic address
```

## The outward evidence-card path

One card per issuer. Path shape follows the existing card convention
(`https://councilof.ai/cards/{sha16}.json`, indexed from `public/signed/card_index.json`).

```
subject      : xrpl:issuer:<classic-address>
source_url   : https://<issuer-domain>/.well-known/xrp-ledger.toml
axis         : provenance  (the two-way binding is a provenance fact, not a safety grade)
verdict      : MEASURED            when both halves resolve and agree
               UNMEASURED          when either half is absent  <-- first-class, not a failure
               INVALID             when both resolve and DISAGREE (domain names a different address)
checks       : ledger_domain_present      bool
               toml_reachable             bool
               toml_accounts_contains_addr bool
               strict_two_way_toml        bool   (AND of the three)
retrieved_at : RFC3339, the moment each half was fetched
leaf         : sha256(canonical(card minus sha256 and sig_ed25519))
```

**Doctrine constraints that bind this card:**

- No score, no grade, no ranking of issuers. The card records whether a binding resolves.
- `UNMEASURED` is first-class. 12 of 16 not being two-way is **not** a finding against them —
  publishing it as one would be the "absent is not zero" error the ledger already tracks.
- No issuer is described as a client, and no bank name is used as a client name — `root.json`
  already carries that constraint verbatim in its `language` field.
- Price never appears in the card bytes. If an issuer card is ever sold, the amount lives in
  the live 402 challenge; `scripts/price-gate.mjs` blocks a numeric `price*` key under
  `public/**.json` and has already failed a production deploy for exactly that.

## What a SIGNED issuer contract would need

A card is an observation. A *contract* is a two-party artefact, and none of this exists yet:

1. **A counterparty who signs.** Today every signature in the estate is CSOAI's own
   `did:web:csoai.org#board-attestation-1`. A contract needs the issuer's key over the same
   canonical bytes — either an XRPL account signature or a `did:web` on the issuer domain.
2. **An agreed subject hash.** Both parties sign `sha256(canonical(card))`, so neither can
   later claim a different payload. The leaf definition already in `root.json` works unchanged.
3. **A revocation path.** An issuer whose domain changes must be able to withdraw the binding.
   The estate's answer to mutable claims is supersede-or-ledger, never edit signed bytes —
   `functions/api/corrections.ts`, next id `C-2026-0905-05+`.
4. **A stated non-endorsement.** The contract must say on its face that CSOAI measures and does
   not certify, does not act as a notified body, and issues no conformity mark.
5. **A BMR firewall.** If a signed issuer contract is referenced inside a financial instrument,
   the Benchmarks Regulation may attach. The contract should state the board is a measurement
   record and **not a benchmark for financial instruments**. See DELTA row 35.
6. **Owner authority.** Signing anything on behalf of CSOAI with a counterparty is owner-gated
   under the COMMON block: keys, wallets and outward sends are all owner-only.

## Status

| Item | State |
|---|---|
| Card schema above | DRAFTED |
| The 4 two-way issuers named | **NOT DONE — must be re-probed, not carried from a note** |
| Cards written | NOT DONE (signing is owner-gated) |
| Contract | NOT DONE (needs a counterparty key; nothing to sign against) |
