# Join points — files, not promises

> **Measured facts, each naming the endpoint or file that returns it.** Re-fetch before sending.
>
> - **Buyer's-eye x402 census (measured artefact).** 316 conformant hosts paid for real: **100 DELIVERED**,
>   **213 REFUSED**, 2 NO_CHALLENGE, 1 MISMATCH. **13 hosts recorded an on-chain settlement and still
>   delivered nothing** (0.193 USDC), each row carrying its tx hash so a reader can check the chain.
>   Dataset: <https://huggingface.co/datasets/csoai/x402-settlement-census> — `summary-2026-09-06.json`.
>   *One purchase per host, one moment: a single refusal is not a pattern. 1.3398 USDC spent, all of it ours.*
> - **Revenue.** `/api/revenue` → `one_number.all_time` = **0** distinct non-self payers, status **MEASURED**.
>   Separately `settled_usdc.count` is **`null`, status UNMEASURED** — null is not zero, and neither is
>   revenue. Self-settlements (5) and zero-value settlements (4) are recorded and are never payers.
> - **Hub cells.** `/api/hub-cards` → `counts`. These are **third-party models on the Hub, never our own
>   coverage** — the endpoint says so in its own `population` field.

Public work of named people ≠ signed partnership.

| Party | Public work | File / surface in **our** stack | Must not claim |
|---|---|---|---|
| **Tiago / OTS** | Book anchored OTS → Bitcoin (block 945970, Apr 2026, his work) | `harness/mine/cards/kernel-anchor.json` `tsa.status: "err"`. `harness/arena/ots_anchor.py`. Spine package name `ots-anchor`. Bindings row `ots` **GATED**. | That `/xrpl-attest` is his rail. XRPL is a **different** ledger. |
| **Emek / Conarium** | MIT `dogrucanemek-alt/conarium` `22055ea1…` Ed25519 receipts v0.1 | `council-os/registry/bindings.json` row `conarium`, `preimage_rule: conarium-v0.1`. **No adapter that verifies a receipt yet.** | Silent merge into `public/signed/cards/`. |
| **Joel / Certisyn** | VRO draft, 8 control areas, Art 14/50 | **No VRO schema.** Map not filed. Bindings: none for VRO (would be `kind: vro-map` later). | “We implement VRO.” Filling financial cells from a VRO row. |
| **Fraunhofer SIT / Birkholz** | RFC 9943 SCITT; SCRAPI | Spine `lanes.trust.packages` includes `"scitt"`. Bindings `scitt-client` **GATED** (`pyscitt==0.14.2`). **No TS, no `POST /entries`.** | That we run a Transparency Service. |
| **CSOAI** | Board 22·15·7, cards, `/mcp` | `https://councilof.ai/api/gspc`, `public/signed/cards/`, `public/signed/HOW-TO-VERIFY.md`, `mcp/gspc-server/index.mjs`, `/gspc-verify`, `/embed` | Certification. Mainnet XLS-70 grade. |

## XRPL (keep off the grant time-anchor)

`public/interop/xrpl-attest-run.json` + `/xrpl-attest`:

- `memo_attach_tx` `BC767FEF…` = **Payment** on **devnet**
- `credential_attach_tx` `958BA258…` = **CredentialCreate** on **devnet**, URI → card index

Not OTS. Not SCITT. Not a grade. Do not put under “Tiago’s Bitcoin proofs.”

## Bindings lockfile

`council-os/registry/bindings.json` (lane `bindings-lockfile`, 12 rows). Join = **call their verifier**, not swallow their git tree.
