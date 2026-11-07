# GitHub Exit & Super-Hybrid Plan — evidence audit execution (2026-09-20)

Execution of the audit's "today's safe work" list. Everything here is local,
read-only against production, unsigned, and unpublished. No DNS change, no
account action, no migration, no scheduler. Measurement, never certification.

## Item results

### 1. GSPC attestation defect (RECON-2026-0920-01) — repair verified staged; live still defective

- Live readback `https://councilof.ai/api/gspc` (2026-09-20 ~03:35 UTC): `site_attestation`
  signature **INVALID** under its own published preimage rule (canonical JSON of the payload
  minus `site_attestation`, keys sorted, no whitespace; Ed25519, embedded `public_key_x`;
  checked under both `ensure_ascii` encodings). Direct reproduction of the defect on served bytes.
- Repair: both `leader: undefined` → key-omission hunks in `functions/api/gspc.ts` are present in
  the **staged** index (`git diff --cached`), exactly per `evidence/reconciliation-2026-09-20/README.md`.
- `npx vitest run functions/api/gspc` → **16/16 PASS** on the staged tree.
- Remaining gate: PR to master → GHA deploy → re-verify served bytes → `/api/corrections` entry.
  GitHub Actions availability is external to this audit; nothing merged or deployed here.

### 2. OS/Verify three-state copy — already satisfied; no change made

- `client/src/lib/verify.ts`, `GSPCVerify.tsx`, `BoardAttestation.tsx`, `InspectionPacketVerifier.tsx`
  already render VALID / INVALID / UNCHECKABLE from real verification results; the historical
  green-on-failure defect is correction C-2026-0826-07 with regression coverage.
- Tests: `client/src/lib/verify.test.ts` + `staleCopy.test.ts` **13/13 PASS**;
  `cardVerifyTwin.test.ts` **35/35 PASS** (published verifier cannot drift from client verifier).

### 3. Repository recovery inventory — `repo-recovery-inventory.json`

Read-only receipt (no fetch/push/fsck). Monorepo: origin `github.com/CSOAI-ORG/councilof-ai.git`,
HEAD `3dfb20e3…`, 1,036 commits, 133 refs, 1,023 dirty files, `LICENSE` present, `dist/client` present.
Nested third-party clones: `condor` (hummingbot/condor, shallow, 1 commit), `hummingbot-api`
(hummingbot/hummingbot-api, shallow, 1 commit). **State: INVENTORY_PARTIAL** — no object-reachability
(fsck) run, no mirror byte-comparison; canonical-history completeness is UNPROVEN. Branch changed
mid-session (`live-roster-cycle` → `fix/deploy-trigger-coupling`): multi-lane working tree.

### 4. Signed-release manifest schema — `signed-release-manifest.schema.json`

`csoai.signed-release-manifest/0.1` (JSON Schema 2020-12): binds source commit + dirty-tree count,
complete file-hash denominator, signer authority + rotation reference, per-layer proof STATE enums
(`VALID_EXACT_BYTES` vs `VALID_PREIMAGE_ONLY` distinct — the current root's Rekor binding is
preimage-scoped), mirror states, anonymous readback hashes (empty readbacks = public release
UNPROVEN), and correction state. Supersession by append only.

### 5. MCP Registry DNS namespace — official primary documentation obtained

Frozen: `mcp-registry-authentication.mdx` (sha256 `f4f1da47…`, from
`modelcontextprotocol/registry@main docs/modelcontextprotocol-io/authentication.mdx`) plus
`internal/api/handlers/v0/auth/dns.go` read at source. Verified against primary docs:

- Domain-based auth namespace **MUST** be reverse-DNS of the domain: for `councilof.ai` that is
  `ai.councilof/*` — the plan's syntax is consistent with the official rule. **VERIFIED (syntax).**
- TXT record at the **apex** (`v=MCPv1; k=ed25519; p=<base64-DER-tail-32>`), SPF-style, not a
  selector subdomain (registry probes `_mcp-auth`/`_mcp-registry` only to emit a corrective error).
- Stale apex TXT records must be removed on rotation (first-found failure).
- GitHub org namespaces require org **Owner** role; PATs need `read:org`.
- **No migration/rename semantics exist in the official docs** — publishing under `ai.councilof/*`
  is a NEW listing; the existing `io.github.CSOAI-ORG/gspc` entry stays unless separately acted on.
  The plan's "migration route" framing is unsupported; "add, never delete" is the documented-safe path.
- The registry is in **preview**; the docs warn breaking changes/data resets may occur.
- No TXT record staged or applied; a value cannot even be drafted without generating a keypair,
  which is owner-gated.

### 6. Ceremony rehearsal — `tools/release-ceremony-rehearsal.mjs` + `.test.mjs`

Fixture-only (throwaway Ed25519 key, tmp dirs as mirrors, injected timestamp stub; no secrets, no
network, no production keys, no scheduler). `node --test` → **5/5 PASS**:

- happy path: signed manifest, both readbacks VALID, timestamp PENDING stays pending;
- signer unavailable → aborts, mirrors untouched, no manifest;
- all-mirror failure → aborts, no release claimed;
- transparency down → `UNCHECKABLE` recorded, no proof claimed, ceremony otherwise completes;
- signature verifies against the throwaway key and fails on tampered bytes.

A real signing defect was caught during rehearsal (early-skeleton preimage) and fixed: the
signature now binds the final manifest including readback and proof states.

### 7. Incident/correction draft — NOT STARTED (gated)

Preceding evidence (deploy + re-verify of item 1) does not exist; the draft must not say
"deleted", "uninterrupted", "anchored" or "migrated". Nothing written.

## Rejected claims re-confirmed against evidence

- Anonymous GitHub 404 ≠ deletion (GitHub documents intentional 404 ambiguity).
- Current root: Ed25519 + Merkle recompute verify; **OTS exact-byte binding CONFIRMED** (Bitcoin
  blocks 967093/967098/967150 per `public/interop/root-witness-latest.json`); **Rekor binding is
  preimage-scoped, not exact-byte** — "anchors in Bitcoin" is true only for OTS, "Rekor anchors
  root.json" remains false.
- Workers Cron limits and MCP "migration" remain plan-level claims, not architecture inputs.
