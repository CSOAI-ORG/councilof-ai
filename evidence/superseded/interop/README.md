# Superseded timestamped bytes (not served)

`gspc-board-freeze-pointer.2026-09-04.json` is the exact pre-correction byte string of
`public/interop/gspc-board-freeze-pointer.json` (sha256 c90da369...8f75bdf), kept with the OpenTimestamps
proof that covered it. Correction C-2026-0925-01 (custody wording) rewrote the served pointer; the old
bytes carry the withdrawn custody claim, so they are preserved here rather than served. The served
pointer was re-stamped over its new bytes on 2026-09-26 (staging/integration-20260926).

`agent-card-jws-input.2026-09-22.json` (sha256 5fd59f22...0fa0941f, from commit e6c78c083) is the signing input the
committed proof covered before agent-card-canon (c0feb3111) and venturi-arms (9d449ae76) changed the card.
The served input was regenerated UNSIGNED by scripts/adapters/agent_card_jws.py and re-stamped on 2026-09-26.

`agent-card-jws-input.2026-09-27.json` (sha256 e9858882...3ea95f) with its OpenTimestamps proof
`agent-card-jws-input.2026-09-27.json.ots`, and `agent-card.2026-09-27.signed.json` (sha256 fd9d2e84...3abfe7),
are the signing input, proof and signed agent card (v1.1.0, JWS under did:web:csoai.org#card-attestation-2) served
until 30 Sep 2026. The card was re-signed under the same key on 30 Sep (v1.2.0) after its skill `measured-badge`
was renamed `card-status-link` (the doctrine has no mark, badge or grade; the former id still routes). The served
input was re-stamped (calendar-pending) over its new bytes; the OTS manifest entry for it updates on the next run of
the manifest producer.

`agent-card-jws-input.2026-09-30-v1.2.0.json` (sha256 5923cccf...) with its OpenTimestamps proof
`agent-card-jws-input.2026-09-30-v1.2.0.json.ots`, and `agent-card.2026-09-30-v1.2.0.signed.json` (sha256 200a8e6d...),
are the signing input, proof and signed agent card (v1.2.0, JWS under did:web:csoai.org#card-attestation-2) served
until the master-plugin land of 30 Sep 2026. The card was re-signed under the same key (v1.3.0) after the skill
`evidence-bundle` joined (the free A2A twin of the MCP tool `evidence_bundle_preview`). The served input was
re-stamped (calendar-pending) over its new bytes and the OTS manifest was rebuilt in the same commit.
