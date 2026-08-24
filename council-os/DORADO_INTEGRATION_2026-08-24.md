# Council OS ↔ DORADO shared-signing-identity integration (2026-08-24)

**One signing spine, two measurement lanes.** The Council OS SIGIL bridge
(`sigil_inspect.py` / `inspect_sigil_bridge.py`) and the DORADO measurement body
(`cibola` repo) both produce signed measurement cards. They should resolve to the **same**
Ed25519 identity so a stranger verifies either lane against one published key.

## Verified identity (derived live, 2026-08-24)

| Key path | public key (b64, raw) | == DORADO `card-attestation-1`? |
|---|---|---|
| `~/.sovereign/sigil_ed25519.key` (council-os default) | `1edPszs+EGlH…` | **NO** |
| `clawd/sovereign-temple/data/sigil_ed25519.key` | `1MsOqhbV9Qv3Yzo2qjT+CaVeEkuTFt7Sq9sSK7nDfjg=` | **YES** |

The DORADO production identity is `did:web:csoai.org#card-attestation-1`, public key
`x=1MsOqhbV9Qv3Yzo2qjT-CaVeEkuTFt7Sq9sSK7nDfjg`, RFC 9679 thumbprint
`Lb1uFDySKuWC1gE69NISK4BVV-fantDeisG1Mh8DjQc`. This is the estate's production signing
spine — the key is staged on the 3090 pod (`/workspace/.dorado_key/card-attestation-1.pem`)
and on oracle-micro (`mac-sync/clawd/sovereign-temple/data/sigil_ed25519.key`).

## The one-line alignment

Point the Council OS SIGIL bridge at the **sovereign-temple** key (the estate production
spine) instead of the default `~/.sovereign/sigil_ed25519.key`:

```bash
# align the signing identity (sovereign-temple == card-attestation-1)
export SOV_DIR="$HOME/clawd/sovereign-temple"   # sigil_ed25519.key is the prod spine
```

`SOV_DIR` is honoured by `sigil_inspect.load_sigil_key` (see `SOV_DIR`/`SIGIL_KEY_PATH` in
`sigil_inspect.py`). Do **not** commit the key; it stays on the pod / oracle-micro.

## Result

- Both lanes sign with `did:web:csoai.org#card-attestation-1`.
- A stranger verifies a Council OS measurement card and a DORADO measurement card with the
  **same** published key — one estate, one spine, no split identity.
- Doctrine (unchanged): publish measurement, license data, never sell a score
  (neutrality); measurement-never-certification; join on weights not names.

## Honest note

The existing `inspect-sigil-ledger.jsonl` rows are historical and were signed with the
`~/.sovereign` key (`pubkey_hex d5e74f…`). They are honest pre-alignment history, like the
DORADO board's 36 legacy `test-identity` entries. The 6 canonical DORADO production cards
(all `#card-attestation-1`) are the production board; the aligned Council OS measurements
will join them on the same spine going forward.

---
CSOAI Ltd (Council of AI) · did:web:csoai.org · Measurement, never certification.
