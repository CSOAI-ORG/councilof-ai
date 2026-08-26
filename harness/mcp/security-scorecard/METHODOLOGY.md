# MCP SECURITY SCORECARD v0.1 — disclosure-integrity layer (2026-08-26)

**Permissionless-premise (SSL Labs precedent):** grading on a factual signal set,
externally observable, methodology published, signed — never permission needed.

## Instrument (v0.1 — disclosure integrity, NOT live endpoint probing)
Rubric = 8 factual signals each entry declares (or not), from the CAnon registry
(auto-generated 2026-08-01 from 3 public registries; 312 unique entries:
14 sites / 293 servers / 5 packs):

| # | Signal | Meaning |
|---|--------|---------|
| 1 | id | globally unique entry id |
| 2 | name | resolvable name |
| 3 | type | site / server / pack declared |
| 4 | description | what it does, stated |
| 5 | category | functional category assigned |
| 6 | url | public URL published |
| 7 | geo | jurisdiction/hosting disclosed |
| 8 | provenance | source registries declared (auto-gen header) |

Score = k/8. Band: A ≥7/8 · B 6/8 · C 5/8 · D 4/8 · F <4/8 — a pure function of the
declared facts. Every row signed (Ed25519, estate key); corrections appended.

## Honesty
- v0.1 grades **what a server's registry entry discloses**, not its live posture.
  The SSL-Labs-style live-probe layer (transport, auth, scope, versions) = **v0.2**.
- Scores are facts-about-facts, never a statement the server is "safe". No rating
  of security posture, no certification, no endorsement. Registry snapshot dated.
- Recompute: run `score.py` against the canon registry — byte-identical or signed-new.
