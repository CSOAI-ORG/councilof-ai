# CORRECTION RECEIPT RUNBOOK (append, never edit)

When a published signed artifact changes (supersede / correction / re-sign):
1. **Never edit** the prior artifact in place — leave it as history; add `supersedes` /
   `v2` suffix in the new artifact's honesty block (financial-measure-run v1→v2 pattern).
2. New artifact: `_supersedes: "<old content_id>", "correction_note": "<what changed and why>"`.
3. Log the correction in `public/interop/corrections.jsonl` (append-only): `{old_cid, new_cid,
   reason, who, when}` (to be created on first correction).
4. Re-run CI gates (signed-json-guard + claimguard) before merge.
5. Strangers can verify: old signature still validates on the old file; new signature on the new.

**Existing instance:** financial-measure-run v1 (stale NoFreeze decode) → v2 (fresh mainnet,
Wilson, signed 29369542cb537f38) — corrections-appended, v1 kept.
