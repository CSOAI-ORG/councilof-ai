# Pass to TUI 1

```
KEY=2-of-3. Implement. No SIGNED until ceremony.
```

Click 1 is **locked: 2-of-3** (split keys; e.g. FROST / cb-mpc across nodes, later `did.json` `#board-attestation-2` only after ceremony).

Until those split keys **exist and verify**:

- Print **`STAMP=UNCHECKABLE`** for that path.
- **Do not print SIGNED.**

This does **not** un-sign the living board under `did:web:csoai.org#board-attestation-1` (already on `GET /api/gspc`). Do not mix the two keys. Do not laptop-sign. Do not mainnet-mint a GSPC grade.

No SIGNED on 2-of-3 until TUI 1 completes the ceremony and a stranger can verify.
