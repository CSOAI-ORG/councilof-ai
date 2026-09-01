# Nostr → Buzz — signed root-delta events (design) — 1 Sep 2026

**Status:** DESIGN DRAFT. **Do NOT join Buzz** this land. No bot spray. No laptop keys.  
**Locks:** Board **22 · 15 · 7**. Social relays **announce** root deltas; they do **not** write the root. Never certify. No second scoreboard.

---

## Thesis

When public root advances N → N+1, a **signed Nostr event** can carry the delta notice into a Buzz workspace (attention surface). The event points at living URLs + digests. It is **not** a board, not a grade, not a MEASURED stamp.

Publish path remains:

```
adapters → make_card → merkle → public/root.json → (optional) Nostr root-delta note
```

---

## Event shape (design — not a mint)

Suggested fields (illustrative; final kind/tags Nick-named later):

| Field | Intent |
|---|---|
| `prev_root_sha256` | Prior merkle root digest |
| `root_sha256` | New merkle root digest |
| `as_of` | ISO-8601 of publish |
| `root_url` | `https://councilof.ai/root.json` (and/or twin) |
| `card_count` / leaf count | Labelled count only — not a grade |
| `sig` | Nostr event signature (relay identity) — **≠** CSOAI board Ed25519 keystone |
| `note` | Honesty: announcement only; re-GET `/api/gspc` for board |

Hard: Nostr/Buzz keys are **not** `BOARD_SIGN_KEY`. Laptop never signs estate keystone. Relays do not advance merkle.

---

## Sit / HOLD

| Item | Sit |
|---|---|
| Join Buzz | **Do NOT join** this leftover |
| Bot spray | Forbidden |
| Live kind registration | HOLD until Nick names |
| Drift content | Only when signed path exists; do not invent drift from UNSIGNED leftovers |

## Hard stops

- No second board via Nostr/Buzz.  
- No MEASURED fill from social engagement.  
- No endorsement claims.  
- One root writer only (`publish_public_root.py` / GHA).

Companion: fire-playbook `10-…` §D · denser-roots wedge.

*End. Design only. Europe/London. 1 Sep 2026.*
