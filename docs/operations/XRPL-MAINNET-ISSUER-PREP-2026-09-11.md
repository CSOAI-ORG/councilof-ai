# XRPL mainnet issuer prep pack — 2026-09-11

**Status:** PREP PACK for EP5. Devnet dry-run complete (evidence below). Mainnet
is **Nick-only** — the lane executed nothing mainnet and submits nothing
externally. Register: an XLS-70 credential is a **signed pointer to a
measurement card** — never a grade, never certification, never a rating.

## What EP5 needs

1. **Issuer account** on XRPL mainnet, created and held under the published
   custody policy: key ceremony in **GHA/HSM-class custody, never a laptop**.
   Funded for base reserve + owner reserve of the credential object.
2. **The payload templates below**, with the CredentialType bytes **derived in
   code**, not copied from prose (see the mismatch flag).
3. **The brakes read and accepted** (next section) before the ceremony starts.
4. **Nick's 30-minute ceremony** (final section) as the ONLY manual gate.

## The brakes that bind (read before any ceremony)

| Brake | What it forbids |
|---|---|
| `docs/operations/TUI4_REJECT_2026-08-29.md` | XLS-70-as-grade: a CredentialCreate is a pointer; the type string is not a score. No mainnet mint without owner ruling. DepositPreauth is not CSOAI KYC. |
| `docs/operations/BRAKE-LOG.md` (lane `xrpl-hash-labels`) | Devnet Payment vs CredentialCreate labels stay distinct; no mainnet claim from devnet hashes. |
| `client/src/lib/emptySlots.ts` (never-list) | "Mainnet CredentialCreate this week. On-chain MEASURED. Invented issuer account." are banned claims. This pack preps the ceremony; it does not schedule it, and nothing on-chain becomes a MEASURED cell. |
| `harness/rwa-attest/README.md` | Counsel / DSS sandbox sign-off before anything beyond synthetic. Regulated-instrument adjacency keeps the CRA/NRSRO counsel gate live. |

## Payload templates (exact)

CredentialType **mismatch flag**: the earlier plan doc carried `0x4753504301`
as the CredentialType. That is a **5-byte shorthand** — ASCII `GSPC` plus a
version byte `0x01` — and it does NOT spell `GSPC-MEASURED`. The dry-run tool
computes the full ASCII hex in code (`475350432D4D45415355524544`), and that
derived value is what this pack carries. Any ceremony must derive the bytes in
code the same way, never copy either string from a doc.

```
CredentialCreate
  Account        = <mainnet issuer — custodied key, never laptop>
  Subject        = <subject account; subject != issuer>
  CredentialType = 475350432D4D45415355524544   # ASCII "GSPC-MEASURED" (derived)
  URI            = hex("https://councilof.ai/signed/card_index.json")
  Expiration     = none

CredentialAccept      # the SUBJECT's own act, from the subject's key
  Account        = <subject>
  Issuer         = <mainnet issuer>
  CredentialType = 475350432D4D45415355524544
  # Until this exists, the credential is UNACCEPTED and authorizes nothing.

CredentialDelete      # the unwind path; by issuer or subject
  Account        = <issuer or subject>
  Subject        = <counterparty>
  CredentialType = 475350432D4D45415355524544
```

## Devnet dry-run evidence (2026-09-11)

Run: `uv run --with xrpl-py python3 scripts/xrpl_issuer_prep.py --dry-run-devnet`
Full record: `docs/operations/xrpl-issuer-prep/DEVNET-DRYRUN-2026-09-11.json`.

| Field | Value |
|---|---|
| tx hash | `4E8C5ECB27F67BE6BBD519541661FCFEC38702656C415BFE11FFC05FCB3106E3` |
| ledger | 5220212 |
| TransactionResult | **tesSUCCESS** |
| CredentialType (ASCII, decoded from chain) | `GSPC-MEASURED` |
| URI (decoded from chain) | `https://councilof.ai/signed/card_index.json` |
| issuer / subject | `rpx51M1i3mx6XVDivK4HjVVrrTNFvqjyGV` / `rK6m2YaiT2DFCcCCN7zPVyoVj15SfFv2D2` (both THROWAWAY-DEVNET faucet wallets, seeds in the record, no value) |
| explorer | https://devnet.xrpl.org/transactions/4E8C5ECB27F67BE6BBD519541661FCFEC38702656C415BFE11FFC05FCB3106E3 |
| acceptance | UNACCEPTED — authorizes nothing |
| endpoint note | `wss://s.devnet.rippletest.net:51234` rejected the WebSocket handshake (HTTP 401) at run time; the run used the JSON-RPC endpoint on the same devnet host, the same transport the 2026-08-25 PoC used. Both attempts are recorded. |

Independently re-verified after the run via public devnet JSON-RPC `tx`:
CredentialCreate / tesSUCCESS / ledger 5220212 / type and URI decode as above.

Also on the record, hidden from no one: a first same-day attempt
(`FF2B02B4855D0377242FF361ACD9F28BDC82D97DBD856A65422E171528D4C63B`, ledger
5220186) **landed tesSUCCESS** but was initially written FAILED because the
tool's success criterion wrongly demanded a submit-style `engine_result` field
that tx-style responses do not carry. Criterion fixed to judge on
validated-ledger `meta.TransactionResult`; both attempts are in the run record.

Prior PoC (2026-08-25, different type string `CSOAI.GSPC.CARD/0.1`):
`958BA25801A068AEA1507FC1649A862C33D59A1D715924794D98D2C66254DC4B`.

**Standing label for all of the above:** DEVNET pointer. An unaccepted
credential authorizes nothing. Not a mainnet claim, not a grade, not
certification.

## Nick's 30-minute ceremony checklist (the ONLY manual gate)

Preconditions: counsel/DSS gate cleared; owner go on mainnet; nothing in this
pack has scheduled or implied either.

- [ ] **0-5 min** — Re-read the four brakes above. Confirm the copy register:
      "signed pointer to a measurement card", never "on-chain MEASURED".
- [ ] **5-10 min** — Create the mainnet issuer account inside the custodied
      signer (GHA/HSM-class). No laptop key at any step. Record the r-address
      only; the seed never leaves custody and never enters a repo.
- [ ] **10-15 min** — Fund reserve (base + owner reserve for the credential
      object) from the estate's mainnet wallet. Record the funding tx hash.
- [ ] **15-20 min** — Build CredentialCreate from the template above with the
      CredentialType derived in code (`binascii.hexlify(b"GSPC-MEASURED")`),
      subject chosen and != issuer, URI as templated, no expiration. Review
      the signed blob BEFORE submit: type bytes, URI, subject.
- [ ] **20-25 min** — Submit from the custodied signer. Confirm
      `meta.TransactionResult == tesSUCCESS`. Anything else: stop, record,
      fail closed.
- [ ] **25-30 min** — Write the run record next to the devnet one
      (`docs/operations/xrpl-issuer-prep/MAINNET-<date>.json`) with hash,
      ledger, issuer address (never seed), engine result, and the standing
      label: "mainnet pointer to a measurement card; unaccepted until the
      subject acts; not a grade, not certification." Update BRAKE-LOG with the
      mainnet label.
