# TUI 5 — Owner Actions STAGED (stage, never fire)

**Compiled:** 2026-10-07 · **Branch:** `trust/anchor-completion-20260911`
**Status: staged, not fired.** Everything below is prepared and waiting; the
three transactions are the only owner-gated steps left. All addresses are
PUBLIC (safe to display). No private key appears anywhere in this repo.

---

## The three funding sends (one bounded action each)

| # | What | Network | Amount | To | Enables | Cap |
|---|------|---------|--------|----|---------|-----|
| 1 | Gas dust for the auto-attester | **Base** | **0.00002 ETH** (~$0.05) | `0x65910f9827e2a87c4acb961b35f33c09ee0c94f2` | Every `public-root` publish then **auto-attests the root on Base EAS** (`eas_attest_root.mjs`, key already in GH secrets) and refreshes the witness sidecar | ≤ $0.05 per publish, expected ~$0.001 |
| 2 | Gas dust for the L1 witness *(P2 — optional)* | **Ethereum mainnet** | **0.0004 ETH** (~$1.00) | same address `0x6591…94f2` | Enables workflow `eas-eth-attest` (dispatch with `confirm=attest-l1`); script fails closed `NOT_FUNDED` until this lands | ≤ $2.00 total |
| 3 | Account activation for the memo anchor | **XRP Ledger** | **≥10 XRP** (current account reserve — re-check at execution; fee itself is 10 drops) | `rJJYvRPDPyGCa3jfCGCEGRccrk7S1bPLCk` | I then submit the prepared memo tx (`anchoring/xrpl-memo-spec.json`, fee 10 drops) and record tx hash in the witness sidecar | fee ≤ 1000 drops authorised |

**Spend so far: $0.** Caps above are ceilings, not estimates; at observed gas
Base attest ≈ $0.001 and L1 ≈ $0.001.

## What is already done (no action needed)

| Item | State |
|---|---|
| `EAS_ATTESTER_PRIVATE_KEY` in GH secrets | ✅ set 2026-10-07 (dedicated hot wallet; key generated locally, piped to `gh secret set`, shredded — never in chat/logs/repo) |
| Base EAS machinery | ✅ exists in `public-root.yml` (schema `bytes32 sha256,string as_of,string did`) |
| L1 EAS workflow + script | ✅ PR staged (`eas-eth-attest.yml` + `eas_attest_root_eth.mjs`) |
| Grandfathered-card signing fix | ✅ PR staged (`will_sign = have_key` — closes USDQ/EURQ/PSC NO_LAPTOP_SIGN) |
| XRPL anchor account | ✅ created, standard seed in `~/.sovereign/keystore/xrpl_anchor_account_seed.txt` (0600), address above |
| Ceremony receipt | ✅ `ceremony/board-attestation-ceremony-receipt.md` |
| Anchor specs (Base/XRPL/ETH) | ✅ regenerated against live root `f1913eca…` with contracts verified on-chain |

## After funding — what I do automatically (no further asks)

1. **Base:** confirm `eth_getBalance(attester) ≥ 0.00002`, promote the pending
   root candidate if its OTS proof is Bitcoin-confirmed (`public-root-candidate-upgrade`),
   let `public-root` publish → witness + **Base EAS attestation fire** → verify the
   attestation on-chain → sidecar `eas_base` flips `NOT_YET → ATTESTED`.
2. **XRPL:** submit the exact prepared memo tx from the staged seed → `tesSUCCESS`
   → record tx hash + ledger in `interop/root-witness-latest.json` (`xrpl_memo`
   flips `NOT_YET → ATTESTED`) → replay-verify the memo hex against
   `sha256(root.json)`.
3. **L1:** dispatch `eas-eth-attest` with `confirm=attest-l1` → PR with the log
   → verify on easscan.

## Honesty register

- **Sources:** live RPC (Base `mainnet.base.org`, L1 `ethereum-rpc.publicnode.com`),
  `xrpl.ws` fee query, `docs.attest.org` contracts page, workflow bytes on master,
  GH secret inventory, all observed 2026-10-07.
- **Real vs staged:** addresses/keys/workflows are REAL and live; the three sends
  and the two dispatches are STAGED and not executed.
- **Owner must verify before firing:** the receiving addresses above against this
  file (they are public keys/addresses — no seed is ever shown here).
- **We are not:** not a certification; the EAS attestation proves existence/time
  of root bytes, nothing more.
