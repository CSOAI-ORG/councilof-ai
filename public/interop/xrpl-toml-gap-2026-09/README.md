# XRPL toml gap notice pack — 2026-09

**Surface:** `public.notice` (unsigned card-v0)
**Status:** DISCOVERED only — **never MEASURED** · **never bidirectional domain match** · `writes_board: false`

Honest line on every card: name the exact failed check **`strict_two_way_toml`**. Do **not** claim a bidirectional domain match when that check failed.

## Why this pack exists

Live GET `https://councilof.ai/api/xrpl` (`as_of` 2026-09-01T23:15:51Z) still lists **`strict_two_way_toml` in `unmeasured[]`** for **12 of 16** assets. The four PASS issuers (RLUSD / OUSG / USDB / BBRL) are out of scope here.

Cited two-way tally (re-cited, not re-invented): `https://councilof.ai/interop/xrpl-two-way-check.json` — honest **4/16**.

## Cards (grouped by issuer)

| Issuer | Symbols | two_way_state | File |
| --- | --- | --- | --- |
| Circle | USDC | UNCHECKABLE (toml 404) | [`card-circle-usdc-public-notice-unsigned.json`](./card-circle-usdc-public-notice-unsigned.json) |
| GateHub | USD.gh EUR.gh XAU.gh GBP.gh | FAIL (no Domain; HTML toml) | [`card-gatehub-public-notice-unsigned.json`](./card-gatehub-public-notice-unsigned.json) |
| Bitstamp | USD.bs EUR.bs | UNCHECKABLE (toml 404) | [`card-bitstamp-public-notice-unsigned.json`](./card-bitstamp-public-notice-unsigned.json) |
| Société Générale-FORGE | EURCV | FAIL (no Domain) | [`card-socgen-forge-eurcv-public-notice-unsigned.json`](./card-socgen-forge-eurcv-public-notice-unsigned.json) |
| Schuman Financial | EURØP | FAIL (no Domain) | [`card-schuman-europ-public-notice-unsigned.json`](./card-schuman-europ-public-notice-unsigned.json) |
| Republic of Palau | PSC | FAIL (no Domain) | [`card-palau-psc-public-notice-unsigned.json`](./card-palau-psc-public-notice-unsigned.json) |
| Quantoz | EURQ USDQ | FAIL (no Domain) + reader UNSIGNED | [`card-quantoz-public-notice-unsigned.json`](./card-quantoz-public-notice-unsigned.json) |

`sig_ed25519` is `null` on every card. **SIGNED needs keystone.** Axes cite `provenance-controls` only as notice — **gspc_axis_projection_forbidden**.

## Hashed evidence

Fetched at **2026-09-02T04:36:44Z** UTC. Index: [`artefact-manifest.json`](./artefact-manifest.json). Mirrors under [`mirrors/`](./mirrors/) are `*.meta.json` sidecars (`source_url` + `fetched_at` + `http` + `sha256` + `bytes`) — stranger re-downloads and checks the hash. We do not pretend HTML SPA bodies or 404 pages are valid `xrp-ledger.toml`.

## UNCHECKABLE (named honestly)

- Circle / Bitstamp / Quantoz `.well-known/xrp-ledger.toml` → HTTP **404** (two-way UNCHECKABLE, never FAIL).
- `forge.societegenerale.com` toml → **TLS handshake failure**.
- `psc.gov.pw` → **DNS NXDOMAIN**.
- EAS on Base attestation of root/card sha — estate signer owner-gated.
- Keystone / Quantoz `NO_LAPTOP_SIGN`.

## Hard stops

- Never invent scores. Never claim MEASURED.
- Never claim bidirectional domain match when `strict_two_way_toml` failed.
- Never shrink `card_index`. Never wrangler. Never board write.
- Measurement, not certification. Zero gatekeeper.
