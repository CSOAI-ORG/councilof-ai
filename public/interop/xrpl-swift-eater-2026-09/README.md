# XRPL / SWIFT eater — staged UNSIGNED cards (2026-09)

**Lane:** `lane/xrpl-swift-eater` · **surface:** `public.notice` (card-v0) · **`sig_ed25519: null` on every card** · `writes_board: false` · never MEASURED here.

Every card here is a deterministic-fact atom: raw public bytes were fetched on the
dated `fetched_at`, hashed (`sha256`), and a fact was computed that a stranger can
recompute from the same URL. Nothing is a grade, a rating, or advice. Anything not
independently recomputed sits in `unmeasured[]`. Cards are stored in **canonical
form** (sorted keys, compact separators, UTF-8) so the file bytes *are* the ≤3072-byte
canonical card; `sha256` is the id of the canonical `payload`.

Produced by `harness/rwa-attest/xrpl_swift_eater.py`. Gate: `scripts/adapters/xrpl-swift-eater-cards.test.ts`
(vitest) fails on any card over 3072 bytes, any verdict word, any MEASURED claim,
any sha256/id mismatch, or any signature that does not verify under
`did:web:csoai.org#board-attestation-1`.

## States on a card (`payload.state`)

| state | meaning |
| --- | --- |
| `PROBED` | raw bytes fetched this run; fact computed from them |
| `DISCOVERED` | subject named by a source whose body could not be fetched |
| `UNMEASURED` | nothing fetchable this run; the card says exactly what was tried |

`MEASURED` is not a state this lane can write. It exists only after a VALID Ed25519
signature minted in GitHub Actions and checked by a verifier.

Per-fact three-state inside a card: `PASS / FAIL / UNCHECKABLE` (unreachable is
UNCHECKABLE, never FAIL).

## How these become signed (the ONE root)

1. `scripts/adapters/staged_leaves.py` reads `card-*-unsigned.json` from this directory
   (file reader, no network, never raises; invalid atoms are skipped with a reason).
2. `scripts/publish_public_root.py` — the one writer, run by GHA **`public-root.yml`**
   (cron `7 * * * *`, or `gh workflow run public-root.yml -f dry_run=false`) — signs
   each new leaf with `BOARD_SIGN_KEY_PKCS8_B64` under
   `did:web:csoai.org#board-attestation-1`, writes `public/cards/<sha16>.json`,
   `public/proofs/<sha16>.json`, and folds the leaf into `public/root.json` (merkle).
3. `scripts/witness_public_root.py` anchors that ONE `root.json` envelope (Rekor + OTS).
   No per-leaf anchors are ever made.

If the key is absent the writer halts closed (exit 3) and nothing unsigned is published.

## Cards (52)

| group | n | file pattern | axes |
| --- | ---: | --- | --- |
| XRPL reader-16 issuers | 16 | `card-xrpl-<symbol>-unsigned.json` | `xrpl-issuers`, `distribution-integrity` |
| SWIFT census-26 banks | 26 | `card-swift-<id>-unsigned.json` | `swift-rails` |
| issuer disclosure pages | 10 | `card-disclosure-<issuer>-unsigned.json` | `reserve-attestation`, `stablecoin-attestation-cadence`, `custody-disclosure`, `regulatory-framework` |

### XRPL issuer cards — what is checked

- `account_info` on a validated ledger: `Flags` (decoded lsf bits), `Domain` (hex + decoded), `Sequence`, `ledger_index`, RPC used.
- Two-way domain check: on-ledger `Domain` → `https://<domain>/.well-known/xrp-ledger.toml` → the issuer address appears as an `address`/`issuer` value.
  `PASS` = both legs; `FAIL` = no `Domain` field, or a TOML that does not list the address, or HTML where a TOML should be; `UNCHECKABLE` = `Domain` present but the TOML did not fetch (HTTP 404 etc.).
  `checked[]` and `absent[]` state exactly what was looked at and what was missing.
- XRPScan well-known directory (`api.xrpscan.com/api/v1/names/well-known`, body hashed): whether the address is listed and under which domain. Where the ledger has no `Domain`, the directory domain's TOML is probed **one-way** — it is recorded but never converts a FAIL into a PASS.
- `gateway_balances.obligations` for the symbol's currency: the on-chain issued amount (string), beside the reader's `supply` and `holders` (cited, not recomputed → `holders` is in `unmeasured[]`).
- USDB and BBRL are Braza Bank's. `XAU.gh` (`rcoef…`) is listed by the directory as "BPG Kovine" / `bpgbullion.com`; recorded as-is. `EURØP`'s on-ledger currency code decodes to `EUROP`.

Tally this run: **PASS 4** (RLUSD, OUSG, USDB, BBRL) · **FAIL 9** (EURCV, USD.gh, EUR.gh, EURQ, USDQ, EURØP, XAU.gh, GBP.gh, PSC — no `Domain` on the AccountRoot) · **UNCHECKABLE 3** (USD.bs, EUR.bs, USDC — `Domain` present, TOML HTTP 404). Raw TOMLs that did fetch are mirrored under `mirrors/`.

### SWIFT cards — what is checked

For each of the 26 named banks on `GET /api/swift`, every cited press URL was fetched
(keyless GET), the body hashed, and a case-insensitive whole-word match of the census
bank name run on the tag-stripped HTML: `named_in_body` = `PASS / FAIL / UNCHECKABLE`.
The Swift primary press page timed out from this vantage and stays UNCHECKABLE; every
bank is still named in at least one fetched secondary body. Banks are census subjects,
never clients. Settlement stays off-chain. No ISO 20022 / on-ledger claim.

### Issuer disclosure cards — what is checked

One primary disclosure page per issuer (the declared/directory domain only, robots.txt
honoured, bot gates not bypassed): page bytes hashed; count of PDF links; count of
attestation-named PDF links (filter recorded); **cadence** = year+month parsed from
those filenames (`dated_reports_n`, `first`, `last`, `max_gap_months`,
`consecutive_monthly`); term-hit counts against a recorded lexicon for reserve
attestation, named accounting firms, custody and regulatory terms. PDF bodies are not
opened; presence of a term is not a confirmation — both are in `unmeasured[]`.

## Skip log

`SKIPLOG.txt` — one line per source that could not become a fact: `state<TAB>url<TAB>reason`.
`artefact-manifest.json` lists every fetch (URL, HTTP, bytes, sha256, fetched_at) and every skip.

## Hard stops

- Never sign here. Never a laptop key. Never stamp MEASURED. Never a verdict word.
- Never fetch behind a login, past robots.txt, or through a bot gate.
- Never a bank as a client. Never an issuer as a grade.
