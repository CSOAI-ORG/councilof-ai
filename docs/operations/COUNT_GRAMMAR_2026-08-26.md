# COUNT GRAMMAR — LIVE 2026-08-27 — three surfaces, three precise counting rules

**LIVE STATE (OWNER RULING 2026-08-27, supersedes all prior freezes):**
- GET /api/gspc → **22 axis · 15 measured · 893 items**. `totals.public_count` is the live sentence.
- Card index → **313 cards** (150 verify against `did:web:csoai.org#card-attestation-1`; index 313 ≠ 313 verified)

| Surface | Count | Source (live) | Counts what |
|---|---|---|---|
| Public quotable board | 22/15 | GET /api/gspc → totals.public_count | 22 axes, 15 measured, 7 unmeasured. NEVER a typed integer — cite the live sentence. |
| Arena scoreboard | 15 | GET /api/arena/scoreboard | Arena's measured set (incl. in-lane slot-15 items the board NEVER counts in totals). |
| Elo reference | 17 | public/arena/elo_reference.json | Per-axis Elo set (drives 27/29 surfaces); includes names not on the public board. |
| Card index | 313 | public/signed/card_index.json | Lists every verifying published GSPC card. 150 verify against attestation key. No constant clamp. |

Rules:
1. Each surface states precisely what it counts, from its own endpoint. No forcing one number onto another.
2. The only count typed in COPY = the live public_count sentence ("22 axis · 15 measured"); every other
   surface reads its endpoint (facts.json counts.axis_count = pointer).
3. "22" = public axis count. "15" = measured axes. Quote both, or quote the smaller.
4. Deploy is GHA on master only. No agent may clamp the index to any constant.

---

## Historical record (SUPERSEDED 2026-08-27)

The section below preserves the history of the 14-axis / 150-card era. These rulings are
superseded and should NOT be followed.

Per the owner-locked record (5477ef62 "lock public board at 14 (no 16/22 invent)",
ebec824e "warn not to invent 22 axes", BOARD-RULING.md "frozen at verifiable floor 150"),
the "14 vs 17 vs 15" disagreement was NOT a stale-copy bug: three counts, three sets, by design.

**These rulings were superseded by:**
- OWNER RULING 2026-08-27: card index lists every verifying card (today 313), no constant clamp
- ADR-001 + signed board `gspc-board-22axis-2026`: 22 axes · 15 measured · 7 unmeasured
- Live cross-check at `/api/state` (`signed_snapshot_agrees: true`) — THE authority
