# COUNT GRAMMAR — three surfaces, three precise counting rules (2026-08-26)

Per the owner-locked record (5477ef62 "lock public board at 14 (no 16/22 invent)",
ebec824e "warn not to invent 22 axes", BOARD-RULING.md "frozen at verifiable floor 150"),
the "14 vs 17 vs 15" disagreement is NOT a stale-copy bug: three counts, three sets, by design.

| Surface | Count | Source (live) | Counts what |
|---|---|---|---|
| Public quotable board | 14 | GET /api/gspc → totals.public_count | 14 GSPC slots with signed measurement rows (jail TIE included). NEVER a typed integer — cite the live sentence. |
| Arena scoreboard | 15 | GET /api/arena/scoreboard | Arena's measured set (incl. in-lane slot-15 items the board NEVER counts in totals). |
| Elo reference | 17 | public/arena/elo_reference.json | Per-axis Elo set (drives 27/29 surfaces); includes names not on the public board. |
| Card index | 150 | public/signed/card_index.json | Frozen at the verifiable floor (BOARD-RULING); 185 candidates UNMEASURED until their hashes verify against the real card store. |

Rules:
1. Each surface states precisely what it counts, from its own endpoint (or its own frozen
   record). No forcing one number onto another.
2. The only count typed in COPY = the live public_count sentence (14 of 14); every other
   surface reads its endpoint (facts.json counts.axis_count = pointer).
3. "22" = internal axis-universe map only (WARNING header). Never a public board count.
4. Alignment audit 2026-08-26: "22 ruled at 2bdbac34" NOT corroborated (commit nonexistent).
   Operative rulings = 5477ef62 + ebec824e (board 14; 22 internal) + BOARD-RULING.md
   (card index 150 floor; auto-restore workflows removed; signed-json-guard = sole gate).
