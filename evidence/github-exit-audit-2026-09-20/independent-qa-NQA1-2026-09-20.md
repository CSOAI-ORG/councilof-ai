# Independent QA of exit-plan gate artifacts — NQA1, 2026-09-20

Lane: read-only verification of the parallel lane's `exit-plan-gates-2026-09-20/`
and `github-exit-audit-2026-09-20/` artifacts, plus the item-2 copy fix the
audit ordered and no lane had yet made. No git mutations; no deploys; no
external-account, DNS, secret, or identity changes. Every verdict below was
reproduced by the QA operator, not copied from the artifact under review.

## Item-by-item QA verdicts

| Audit item | Artifact | QA verdict | Evidence (all rerun independently) |
|---|---|---|---|
| 1. Attestation defect path | `item1-attestation-resolution-outcome.md` | **CONFIRMED with one discrepancy (D1)** | Live `GET /api/gspc` re-fetched 2026-09-20 ~02:40Z; Ed25519 verify of `site_attestation` over canonical(payload minus site_attestation), keys sorted, no whitespace, ensure_ascii=False → **INVALID** (58,419-byte message). Mechanism visible in served bytes: 19 MEASURED axes lack the `leader` key (JSON.stringify dropped `undefined`; the signer had serialised it literally). #2657 `1cf29374` and #2658 `05d3d263` confirmed present on `origin/master`. Deploy remains blocked (GHA disabled account-wide; per OWNER_ASKS.md ticket #4720908). |
| 2. OS/Verify copy three-state | client + functions copy | **DEFECT FOUND LIVE, FIXED LOCALLY by this QA lane (3 files)** | See "Item-2 fix" below. |
| 3. Repo recovery inventory | `repo-recovery-inventory.json` (state: INVENTORY_PARTIAL, honestly labelled) | **NUMBERS CONFIRMED; two annotations (A1, A2)** | monorepo HEAD `3dfb20e3…` ✓, 1036 commits ✓, 133 refs ✓, remotes ✓ (single origin `CSOAI-ORG/councilof-ai.git`); condor HEAD `d89e74f2…` ✓, 4 refs ✓; hummingbot-api HEAD `2494e847…` ✓. Dirty count drifted 1023→1027 during QA (active lanes; time-variant, expected). |
| 4. Release manifest schema | `signed-release-manifest.schema.json` | **WELL-FORMED, COVERS THE AUDIT REQUIREMENTS** | `jsonschema.Draft202012Validator.check_schema` passes. Covers: source commit + dirty_tree, exact per-file sha256/bytes, signer DID + authority_doc + preimage_rule, `UNSIGNED_DECLARED` honest state, timestamp proofs with PENDING/CONFIRMED/UNCHECKABLE bound to exact manifest sha256, mirror states incl. `PUBLISHED_READBACK_MISMATCH` and `SUBMITTED_UNCONFIRMED`, three-state self_check, `not_a_certification: true`. |
| 5. MCP DNS evidence | `mcp-registry-dns-evidence.md` | **QUOTES VERIFIED against primary source** | `raw.githubusercontent.com/modelcontextprotocol/registry/main/docs/modelcontextprotocol-io/authentication.mdx` (200, 13,429 B): apex-placement passage verbatim at line 68; ECDSA P-384 (`ecdsap384`), Google KMS, Azure Key Vault sections present; namespace-by-auth-method table and `mcp-publisher login dns` flow confirmed on the rendered docs page. Conclusion (no migration route; publish-new + status-deleted only) is consistent with the CLI command set (`init/login/logout/publish/status/validate`). |
| 6. Ceremony rehearsal | `ceremony-rehearsal/` | **REPRODUCED 9/9 PASS, exit 0** | Rerun: happy path VALID; tamper INVALID; signer outage → refuse + `UNSIGNED_DECLARED`; mirror outage → `UNREACHABLE`; wrong bytes → `PUBLISHED_READBACK_MISMATCH`; timestamp outage → `UNCHECKABLE`; unconfirmed stamp stays `PENDING`; confirmed stamp binds exact bytes. Their dev note is itself a finding: the rehearsal caught the same defect class as RECON-2026-0920-01 (signature field present in signed preimage). |
| 7. Incident draft | `incident-draft-NOT-PUBLISHED.md` | **LANGUAGE CLEAN; NOT PUBLISHED (correct)** | No "deleted", "uninterrupted", "anchored", "migrated". Each sentence mapped to evidence; window-start explicitly unknown. Remains a draft pending owner review and the post-deploy readback. |

## Discrepancies and annotations found by QA

- **D1 (minor):** `item1-attestation-resolution-outcome.md` records the live re-check as
  "2026-09-20T03:40Z" and the `gh` probe as "03:5xZ" — both times are later than the
  file's own mtime (02:34Z) and later than this QA run (~02:40Z). Either mislabelled
  timezone (BST written as Z) or typed-early timestamps. The underlying claim
  (live still INVALID) is TRUE — QA re-verified it — but an evidence document's own
  timestamps must be checkable. Recommend the owning lane correct to the actual check time.
- **A1:** `repo-recovery-inventory.json` records condor `head_commits: "1"` without noting
  condor is a **shallow clone** (`.git/shallow` present) — "1 commit" is a property of the
  clone depth, not of the upstream history. Same likely applies to hummingbot-api (untested for shallow).
- **A2:** The served living-stamp note (fixed in this QA lane, see below) said
  "the 150 measurement cards" — a stale typed count (live reconciliation: 335). The
  replacement copy drops the typed count entirely ("the measurement cards under
  #card-attestation-1"), per QUOTING-NUMBERS doctrine.
- **A3:** Full-project `tsc --noEmit` baseline carries 254 pre-existing error lines
  (router-type collisions across unrelated pages, e.g. Status.tsx, StudentProgress.tsx)
  plus `GspcScoreboard.tsx(270,19) TS18047` which exists identically at HEAD — none are
  introduced by this lane's edits; the three edited files add zero new diagnostics.

## Item-2 fix (this QA lane, local only, uncommitted)

The audit ordered: public OS/Verify copy must display VALID / INVALID / UNCHECKABLE
from a real verification result. QA found three public copy locations asserting or
implying `site_attestation` verifies — false until the #2657 fix deploys (QA-verified
INVALID live, above):

1. `functions/api/_gspc_types.ts` — served living-stamp `unverifiable_note` and
   `supersedes_note` now state: site_attestation does NOT verify from served bytes
   (C-2026-0920-01, fix merged, awaiting deploy); the cards verify independently.
2. `client/src/pages/GspcScoreboard.tsx` (footer note) — same correction, references
   C-2026-0920-01; no typed card count.
3. `client/src/components/board/BoardAttestation.tsx` (fallback string) — same
   correction.

Hunks are disjoint from other lanes' pending edits in the same files
(LivingObservatory / type-interface work). Not staged, not committed. Deploy path
remains GHA-on-master only. Historical snapshots/fixtures carrying the old note
(`public/signed/gspc-board.signed.json`, `receipts/*`, badge/extension fixtures)
were deliberately NOT touched — they are historical bytes and must stay as served.

## Not done (gates respected)

No git mutations, no deploy, no DNS/secret/identity/external-account changes, no
migration steps from the input plan, no incident publication, no registry
submission, no DNS record staged. The ceremony rehearsal was executed fixture-only
exactly as designed.
