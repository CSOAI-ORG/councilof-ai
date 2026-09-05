# Transparency anchor retry (unsigned)

Attempts / records Rekor v1·v2 and OpenTimestamps status for the **live**
`https://councilof.ai/root.json` byte hash.

| Rail | Outcome (this run) |
| --- | --- |
| Rekor v1 `index/retrieve` by `sha256(root.json)` | **fail** — empty entry list (typical) |
| Rekor v1 `/api/v1/log` | **success** — log reachable (infra only) |
| Rekor v2 `/api/v2/log` | **UNCHECKABLE** — HTTP 404 on public host |
| OpenTimestamps | **UNCHECKABLE** — client/package missing on runner |

**Hard stops:** never fake a Rekor seal; never invent an `.ots` proof; witness ≠
certification; root-hash anchors only; `sig_ed25519` stays `null` here.

Re-run: `python3 scripts/transparency_anchor_retry.py` (writes `card-unsigned.json`).
