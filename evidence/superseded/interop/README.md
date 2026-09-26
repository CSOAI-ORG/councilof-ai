# Superseded timestamped bytes (not served)

`gspc-board-freeze-pointer.2026-09-04.json` is the exact pre-correction byte string of
`public/interop/gspc-board-freeze-pointer.json` (sha256 c90da369...8f75bdf), kept with the OpenTimestamps
proof that covered it. Correction C-2026-0925-01 (custody wording) rewrote the served pointer; the old
bytes carry the withdrawn custody claim, so they are preserved here rather than served. The served
pointer was re-stamped over its new bytes on 2026-09-26 (staging/integration-20260926).

`agent-card-jws-input.2026-09-22.json` (sha256 5fd59f22...0fa0941f, from commit e6c78c083) is the signing input the
committed proof covered before agent-card-canon (c0feb3111) and venturi-arms (9d449ae76) changed the card.
The served input was regenerated UNSIGNED by scripts/adapters/agent_card_jws.py and re-stamped on 2026-09-26.
