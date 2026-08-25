# PUBLISH RULE — card-index war resolution (aligned 2026-08-25)

**The aligned rule (from bytes, both lanes' guards intact):**

1. **Chain truth:** `harness/mine/cards/MANIFEST.json` holds **335 real signed cards**
   (pubkey d4cb0eaa, created 2026-08-19). The 335 index matches it (same key/head family).
2. **Subset floor:** the 150 board (34,171B exact) is a valid published subset — the
   runtime floor the 150-lane defends. Both are real; neither is a stub.
3. **Single enforcement:** `scripts/signed-json-guard.mjs` — the ONLY source of truth —
   **dual-accepts** (honest 150 exact-bytes OR verified-335 sha-gated) and rejects
   stubs/path-pointers/truncated boards. The deploy gate.
4. **No guard-deletion war.** Deleting another lane's guard workflow is the only actual
   defect left. Any workflow that merely *runs* the mjs (any floor value) is harmless;
   the mjs decides. Lanes may add/rename runners but must not remove the mjs from
   deploy.yml or delete protect-verified-335/honest-board-floor runners in ways that
   disable the mjs path.
5. **Owner final say (pending):** 335 vs 150 as the published headline. This rule holds
   deployment safety under EITHER choice; the war becomes moot either way.

Recorded by K3 (2026-08-25) after the byte adjudication + Claude-lane guard dual-accept
reading. Restore policy: any deleted runner that executed the mjs is safe to restore.
