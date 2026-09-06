# Pass to TUI 1

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

```
KEY=2-of-3. Implement. No SIGNED until ceremony.
```

Click 1 is **locked: 2-of-3** (split keys; e.g. FROST / cb-mpc across nodes, later `did.json` `#board-attestation-2` only after ceremony).

Until those split keys **exist and verify**:

- Print **`STAMP=UNCHECKABLE`** for that path.
- **Do not print SIGNED.**

This does **not** un-sign the living board under `did:web:csoai.org#board-attestation-1` (already on `GET /api/gspc`). Do not mix the two keys. Do not laptop-sign. Do not mainnet-mint a GSPC grade.

No SIGNED on 2-of-3 until TUI 1 completes the ceremony and a stranger can verify.
