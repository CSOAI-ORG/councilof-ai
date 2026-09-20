# Goal 6 — Public Discovery, Anchor & Index Evidence Audit (2026-09-20)

Machine-readable matrix: `status-matrix.json` (same directory). Doctrine: measurement, never certification. Unknown is a first-class value. All readbacks below were anonymous, unauthenticated HTTP from this machine, 2026-09-20 ~01:49–02:15 UTC.

## Headline discrepancies (all retained, none fixed)

1. **GitHub org mirror is publicly invisible.** `github.com/CSOAI-ORG`, `github.com/CSOAI-ORG/councilof-ai`, and the REST API all return **404 anonymously**. Root `AGENTS.md` claims GitHub org is a generated public mirror. Either private, renamed, or removed — a discovery failure until explained.
2. **MCP manifest self-contradiction.** `public/.well-known/mcp/server.json` declares `io.github.CSOAI-ORG/councilof-ai` v1.4.0; `server-card.json` declares `io.github.CSOAI-ORG/gspc`. The official registry carries **gspc only** (latest **1.4.2**, published 2026-09-14); `councilof-ai` → 404. Name AND version skew.
3. **Dead follow-on workflows — CORRECTED 2026-09-20 (same session).** First draft said the five followers "never fire". That was true **only of the dirty local tree**: an uncommitted rename lane had changed deploy.yml's `name:` without updating the followers. `origin/master` is self-consistent (old name in deploy.yml AND all five followers — verified via `git show origin/master:…`), so **production triggers fire; nothing was dead live**. The defect was latent: the rename lane would have silently killed all five on merge. Now fixed: followers updated to the new name, coupling pinned in the pin test (extended to all five), a guard step added inside deploy.yml's own guard chain, and a one-second check added to `scripts/pre-push-gates.sh` — both guards proven with a failing control (red on all 5 when the name is broken). All uncommitted; nothing pushed or deployed.
4. **Registry skews**: PyPI live `csoai-gspc` 0.2.20260915 vs in-repo pyproject 0.2.20260912; `@csoai/*` npm scope 404 despite 16 in-repo packages; `kaggle.com/csoai` 404.
5. **OTS root proof is PENDING** (`STAMPED_PENDING_BITCOIN`) — proof bytes serve and the embedded digest matches the served root.json, but a pending timestamp is not Bitcoin-confirmed existence evidence. Stays pending.

## Verified-consistent surfaces (byte-exact or independently confirmed)

- `root.json`: served bytes == repo `public/root.json` bytes (sha256 `dedb49d0…`), count 305, merkle `07dd5eb3…`. MCP `get_root` invocation agrees.
- Inclusion: leaf `056a1efd…` → VALID against live merkle (MCP `verify_inclusion` invocation).
- Rekor: entry at logIndex 2841551210 fetched independently; its `data.hash` == the witness `preimage_sha256` (`b6220613…`).
- `/api/gspc`: 200; MCP `board_totals` invocation: 23 slots / 22 measured (1 declared-unmeasured slot retained).
- ONDO-adjacent: `/api/xrpl` 200 (16 assets incl. OUSG); `/archive/evm-ousg-ethereum/2026-09.jsonl` served bytes == local bytes (byte-exact). Directory index 404s (SPA fallback).
- Chainlink-adjacent: wrapped-asset parity ledger 200 (77,263b); CCIP parity card serves a correct **x402 402 challenge** (challenge ≠ delivery).
- npm `csoai-gspc-mcp` 0.2.2 listed; HF author `csoai` has 38 public spaces.
- `csoai.org` → 308 → councilof.ai (redirect, not independent bytes).

## ONDO / Chainlink candidate evidence

Both are correctly at `CANDIDATE_UNMEASURED`: the only intake artifacts are `measurement/registers/2026-09-19/*` — LOCAL_DRAFT_ONLY, ONDO `BLOCKED_IDENTITY_PIN`, LINK `PENDING_COLLECTION`, signing BLOCKED, Rekor/OTS NOT_ATTEMPTED. Nothing public exists to audit for either subject beyond the adjacent surfaces above. No integration, partnership, or canonical-oracle claim is publicly evidenced.

## CUSTOMER_USED

`UNKNOWN` for every surface — no telemetry in this repo could establish it, and none was invented.
