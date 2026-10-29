# Lane-3 coordination + independent verification note — 2026-09-20

This lane (Kimi K3, transparency-augmentation operator) picked up the same audit
work order AFTER a parallel execution lane and an independent QA lane (NQA1) had
already executed items 1–7 in this directory and in `exit-plan-gates-2026-09-20/`.
Rather than duplicate, this lane re-verified. No commits, no deploys, no external
account/DNS/secret actions.

## Independent re-verification results (all rerun by this operator, not copied)

| Item | Check rerun | Result |
|---|---|---|
| 2. OS/Verify three-state | `npx vitest run client/src/lib/verify.test.ts staleCopy.test.ts cardVerifyTwin.test.ts` | **48/48 PASS** (3+10+35), exit 0 — matches NQA1's 13/13 + 35/35. Independent codebase read: `/gspc-verify` renders computed VALID/INVALID/UNCHECKABLE via `recordVerify.ts` → `functions/_lib/cardVerify.ts` with source-pinned anchors; QA's 3-file copy fix addresses separate copy locations that implied `site_attestation` verifies while it is live-INVALID. |
| 4. Release manifest schema | `jsonschema.Draft202012Validator.check_schema` | **PASS** — well-formed Draft 2020-12. |
| 5. MCP Registry DNS | Re-fetched primary source `raw.githubusercontent.com/modelcontextprotocol/registry/main/docs/modelcontextprotocol-io/authentication.mdx` (13,429 B, 2026-09-20T02:53Z) | **CONFIRMED**: namespace determined by auth method; org namespace requires org OWNER role; `mcp-publisher login dns` flows incl. `ecdsap384`, Google KMS, Azure Key Vault; **no migration language anywhere in the doc** — the audit's "MCP DNS namespace/migration route UNVERIFIED" resolves to: DNS namespace EXISTS (TXT-record flow), namespace MIGRATION route NOT DOCUMENTED. No DNS change proposed or made by this lane. |
| 6. Ceremony rehearsal | `python3 ceremony_rehearsal.py` (exit-plan-gates lane's artifact) | **9/9 PASS, exit 0**, fail-closed summary as NQA1 reported. |
| 1. Served bytes | `GET https://councilof.ai/root.json` (02:45:58Z) | sha256 `dedb49d0…`, 24,454 B — **byte-identical** to committed sidecar artifact; OTS CONFIRMED (967093/967098/967150) binds these exact served bytes; Rekor binds their signed preimage (VALID offline). See `item1-attestation-served-bytes-receipt.md`. |

## Discrepancies introduced or found by THIS lane (owned, not smoothed over)

- **L3-1 (my error, recorded):** this lane overwrote the parallel lane's
  `repo-recovery-inventory.json` at 03:50:05Z with its own freshly computed
  inventory (same schema class). NQA1's QA notes reference the earlier file's
  `state: INVENTORY_PARTIAL` label, which the current file does not carry.
  Numbers remain consistent (1036 commits, remotes identical; refs 133→135 —
  branches created by active lanes between reads). The current file also fixes a
  classification issue: dangling objects (46 in the monorepo) are normal in an
  active multi-lane repo and are now reported separately from connectivity
  failures (fsck CLEAN for all three repositories).
- **L3-2 (unresolved, for owner):** GitHub Actions state. This lane's authenticated
  read `GET /repos/CSOAI-ORG/councilof-ai/actions/permissions` (02:46:53Z, token
  scopes gist/read:org/repo/workflow) returned `{"enabled":true,"allowed_actions":"all"}`,
  and `pr-gates` runs executed as recently as 2026-09-15. NQA1 and the
  witness-cosign spike record "GHA disabled account-wide (ticket #4720908)".
  Repo-level permission flags and an account-wide restriction are different
  layers — both observations are recorded; neither is asserted as the whole truth.
  The org endpoint 404s for this token (needs `admin:org`) — still NOT evidence
  of org deletion, now also under authenticated read. The repo itself is alive
  (`pushed_at` 2026-09-20T02:45:32Z, one minute before readback).
- **L3-3 (multi-lane hazard):** the checked-out branch changed under this lane
  (`live-roster-cycle` → `fix/deploy-trigger-coupling`, between 02:13Z and 03:50Z,
  by another lane). This lane's uncommitted edits (3 upstream fix files + evidence
  bundles) survived the switch; nothing was committed by this lane.

## Not done by this lane (gates respected)

- Item 1's repair action: the defect is staged by another lane
  (`functions/api/gspc.ts`, 16/16 vitest per their README); the merge→deploy→readback
  gate is owner/GHA territory. This lane contributed the served-bytes + binding
  receipt only.
- Item 7 incident draft: exists as `incident-draft-NOT-PUBLISHED.md` (parallel
  lane), language-clean per NQA1. This lane did not touch it; publication is
  owner-gated.
- No DNS, no registry login, no mirror push, no scheduler, no signing ceremony
  with real keys.
