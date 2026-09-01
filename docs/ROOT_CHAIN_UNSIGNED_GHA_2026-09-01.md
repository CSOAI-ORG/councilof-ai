# Root + chain — unsigned card → GHA signs → root

**Status:** leftover honesty note. Board **22 · 15 · 7**. Never certify. No second root writer. No laptop / 3090 / MetaMask `BOARD_SIGN_KEY`. No paywall `/root.json`. No 23/22. No Cloud Agents. No wrangler.

## Path (one)

```
unsigned card-v0 leaf
        │
        ▼
   GHA signs leaf (Ed25519) when SIGNED path named (n≥30 + 4way + keystone)
        │
        ▼
   ONE writer (`publish_public_root.py` / GHA) advances public root
   = merkle over leaf sha256s → public/root.json
        │
        ▼
   Chain witnesses ROOT HASH ONLY
   (Rekor v2 · OTS→Bitcoin · SCITT · XRPL DID/memo · ERC-8325 cite)
```

## Rules

| Rule | Detail |
|---|---|
| Unsigned | `sig_ed25519: null` + gaps in `unmeasured[]` — valid intermediate; not MEASURED board fill |
| Sign | GHA only — never laptop / 3090 / MetaMask / Workers |
| Root | Index of cards; envelope may stay unsigned until keystone |
| Chain | Anchors **root hash only** — not a second board, not a grade |
| Halts | `halt-on-split` · `halt-on-missing-key` · `halt-on-unsigned-leaf` stay armed |
| Public | `/root.json` stays free — no paywall |

Online verify: living GET. Offline: recompute canonical payload hash + verify sig when present.

*1 Sep 2026 · Europe/London.*
