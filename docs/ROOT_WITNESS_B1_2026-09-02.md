# Root witness B1 — 2026-09-02 (measurement, not certification)

Live artefact: `https://councilof.ai/root.json` (byte-identical to `/api/root`).

| Field | Value |
|---|---|
| sha256 | `61a6d86db8d5dec9c63eaffb529438aa7631c0a12f5bfbb19ac75517c1c94bd6` |
| card_count | 50 |
| merkle_root | `8025ee10a54ca05d352d5a89f436d7666c1cefba0a8cbb9b76a3ac5562286909` |
| signed | yes (`sig_ed25519` present; DID `#board-attestation-1`) |
| board | `GET /api/gspc` → **22 axis · 22 measured · 0 unmeasured** |

## Public witnesses

1. **OpenTimestamps** — proof: [`public/interop/root-2026-09-02.json.ots`](../public/interop/root-2026-09-02.json.ots) (PendingAttestation; Bitcoin upgrade later).
2. **Sigstore Rekor** — UUID [`108e9186e8c5677aebb3ebde460b76fde571d1c0fdab0bbfd5524abcfa8fecacbc336690962e10fa`](https://rekor.sigstore.dev/api/v1/log/entries/108e9186e8c5677aebb3ebde460b76fde571d1c0fdab0bbfd5524abcfa8fecacbc336690962e10fa) · logIndex `2683310457` · type `rekord` + SSH Ed25519 witness key (not the board key).
3. **XRPL memo** — **UNCHECKABLE** this run (no pre-existing XRPL account/secret in estate). No new keys, no ask to buy XRP, no token mint.

Machine-readable index: [`public/interop/root-witness-2026-09-02.json`](../public/interop/root-witness-2026-09-02.json).

Verify UI should point at these URLs as *existence/time witnesses*, never as certification.
