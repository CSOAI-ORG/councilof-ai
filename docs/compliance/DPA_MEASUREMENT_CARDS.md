# DPA · measurement cards (NEXT_300 #236)

Signed measurement cards (~3KB, Ed25519) are **measurement artefacts**, not personal profiles and not sold grades (HO.2).

## Processing note

- Card bodies may include subject identifiers the customer supplied (e.g. system id) — treat as customer-controlled content under the DPA.
- Public verify surfaces (`/gspc-verify`, East-West verify) run **client-side**; pasted records are not uploaded by the verify UI.
- Surface-hits (`POST /api/surface-hits`) store **path-only** counters — no IP, UA, or card content (#235).
- Labour / AI-economy indices (`/api/indices`) publish `measured_score: null` — no invented MEASURED labour scores.

Crosswalk: `client/src/pages/legal/DataProcessingAgreement.tsx` · INDEX-METHOD · refuse-measured-labour skill.
