# Council of AI — Ceremony Proof Bundle

**Generated:** 2026-09-15T03:37:58Z
**Label:** SIMULATED — proves toolchain, not a real ceremony
**Schema:** csoai.ceremony-proof-bundle/0.1

---

## Root of Trust

| Field | Value |
|-------|-------|
| root.json SHA-256 | `74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b` |
| ROOT-alpha pubkey | `965cf4968ed65359eb5e4879bd692840b445473a854b82482aa37df40554fd79` |
| ROOT-beta pubkey | `f8097a833ae6c030b786b338cdcd60d646f62e67396493302178b3520ccf485d` |
| ROOT-alpha JWK thumbprint | `ci5kl7kteo4N9zy4AMGTBAVsqBrAzIflUTKuOjv5S6I` |
| ROOT-beta JWK thumbprint | `tP6U7o9VH0SUltk-JZVdsfuoX84VezlLqbUGTdpX1zY` |
| Shamir scheme | shamir-gf256-0x11b/v1 |
| Shamir crosscheck | PASS |
| Share count | 3 (2-of-3 threshold) |

---

## Verification Results

| Check | Result |
|-------|--------|
| Card #0 Ed25519 signature | VALID — Ed25519 self-attestation from ROOT-alpha |
| Shamir crosscheck | PASS — independent reconstruction matched secret_sha256 |
| Shamir reconstruction | PASS — shares 1+2 reconstruct to matching secret |
| Rekor inclusion proof | VALID — 6/6 checks (log_identity, SET, inclusion, checkpoint, STH, root_hash) |
| Rekor root hash match | MATCH — 74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b |
| XRPL memo data match | MATCH — 74797E30D6D98267E5AB4C8E275B135235FDF1AFC6EEE6B5C1F00537C41B751B |
| EVM Base data match | MATCH — CSOA + 74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b |
| Share consistency | PASS — all 3 shares + crosscheck bind same secret_sha256 |

---

## Rekor Transparency Log

| Field | Value |
|-------|-------|
| Status | **VALID** |
| UUID | `108e9186e8c5677a57a5de6983bda9a134a8dbbf1f8decdcd4e3fbbd9176dac1d54293a32f6ffe58` |
| Log index | 2838908623 |
| Integrated at | 1789443401 (Unix) |
| Log ID | `c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d` |

**Verify independently:**
```
python3 scripts/rekor_inclusion_verify.py 108e9186e8c5677a57a5de6983bda9a134a8dbbf1f8decdcd4e3fbbd9176dac1d54293a32f6ffe58 --sth --verify-root public/root.json
```

**Rekor sub-checks:** log_identity=VALID, set=VALID, inclusion=VALID, checkpoint=VALID, sth=VALID, root_hash=VALID

---

## Anchor Rails

### Rekor (Sigstore)
- **Status:** WITNESSED
- Commits the full root.json bytes into Rekor's append-only transparency log
- Independently verifiable via logIndex above

### OTS (OpenTimestamps / Bitcoin)
- **Status:** ACTIVE — hourly upgrade loop running via GHA `card-root-ots-upgrade.yml`
- Pending Bitcoin calendar commitment

### XRPL Memo
- **Status:** SIGNED
- MemoType: `csoai/public-root-sha256`
- MemoData: `74797E30D6D98267E5AB4C8E275B135235FDF1AFC6EEE6B5C1F00537C41B751B`
- Proves only: this 32-byte digest was included in a validated XRPL ledger

### EVM Base
- **Status:** SIGNED
- Chain: Base (8453)
- Data field: `CSOA` prefix + root SHA-256
- Proves only: this 36-byte digest was included in a Base block

---

## Files in Bundle

| File | SHA-256 | Size |
|------|---------|------|
| `anchors/evm-base-signed-tx.json` | `1ea5fec9756f3182...` | 495B |
| `anchors/xrpl-signed-tx.json` | `55e88cdd1c4da90d...` | 633B |
| `ceremony/card0-genesis.json` | `0ae7ffd479fba680...` | 1494B |
| `ceremony/shamir-crosscheck.json` | `75ebd6e0f689067b...` | 556B |
| `ceremony/share-1.json` | `2cbd6a82728d6914...` | 238B |
| `ceremony/share-2.json` | `8ccba6dbff70367b...` | 238B |
| `ceremony/share-3.json` | `660a4664c7a4075a...` | 238B |
| `proof/rekor-verification.json` | `15edc44c870d26bc...` | 2077B |
| `proof/root.json` | `74797e30d6d98267...` | 24310B |
| `rekor/rekor-entry.json` | `a9952617e4a0ea04...` | 32882B |
| `rekor/rekor-response.json` | `7c5c3ef81c2dd5ea...` | 3071B |
| `rolls-alpha.txt` | `7346c126de2bb7f3...` | 125B |
| `rolls-beta.txt` | `9b87a940c69754e6...` | 126B |

---

## Honest Limits

This bundle proves toolchain integrity on SIMULATED dice rolls and throwaway keys. It demonstrates that the ceremony scripts, Shamir splitting, Rekor witnessing, XRPL memo generation, and EVM anchor generation all work correctly end-to-end. It does NOT prove custody of any real key material. The Rekor entry commits to the real root.json bytes (SHA-256 direct match). Measurement, never certification.

---

## How to Verify

1. **Card #0 signature:** `python3 scripts/ceremony/genesis_card.py verify --card ceremony/card0-genesis.json`
2. **Shamir crosscheck:** inspect `ceremony/shamir-crosscheck.json` — status must be PASS
3. **Rekor inclusion:** `python3 scripts/rekor_inclusion_verify.py 108e9186e8c5677a57a5de6983bda9a134a8dbbf1f8decdcd4e3fbbd9176dac1d54293a32f6ffe58 --sth --verify-root public/root.json`
4. **Root hash:** `sha256sum public/root.json` must equal `74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b`
5. **XRPL memo:** MemoData must equal root.json SHA-256 (uppercase hex)
6. **EVM data:** bytes 4–36 must equal root.json SHA-256; first 4 bytes = `CSOA`

---

*Council of AI — measurement, never certification.*
