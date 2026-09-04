# Simulated BFT output — quarantined 2026-09-04

These 21 files are preserved as incident evidence. They are not Council votes,
signatures, quorum evidence, or a demonstration of Byzantine fault tolerance.

The retired producer hard-coded every vote to `YES` and labelled
`sha256(private_material + digest)` as though it were an Ed25519 signature. The
33 entries were role definitions produced by one process, not independently
operated voters. Consequently every `33/33`, `quorum reached`, `pubkey`, and
`sig` field in these files is invalid as an evidence claim.

Do not publish, count, sign, anchor, replay, or use these files as training or
measurement input. The current measured independence record is
`public/interop/council-independence.json`: three nominal legs across two
providers measured `rho=1` and `n_eff=1`, which establishes neither independent
review nor fault tolerance.

The replacement generator emits only a `DESIGN_ONLY` role registry and an
`UNCHECKABLE` quorum observation until independently produced, authenticated
votes and an independence gate exist.
