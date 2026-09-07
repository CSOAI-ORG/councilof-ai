# CARDS NARRATIVE — consolidated (2026-09-05, append-only)
Two numbers, two different things — quote the one you mean, never clamp.

- `card_count` = every public/cards/*.json wrapper on disk. Build-time aggregate; signs
  NOTHING, measures NOTHING. It is a count of files, not an attestation.
- `root_card_count` = the card_sha256 hashes committed to the SIGNED Merkle root. This is
  the attested set (152 in the committed bundle; 153 in the deployed root.json — they
  drift by build timing, not disagreement).
- The index must never be clamped to a constant (150/313/335/1072 are lane attempts).
  Name both; the signed root governs the attested set; the disk count describes the store.
