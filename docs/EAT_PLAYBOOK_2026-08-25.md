# EAT PLAYBOOK — the loop, gates, surfaces (2026-08-25)

**EAT = Execute → Attest → Test.** One loop, every lane, every day. This is the
canonical runbook — where things live, what gates hold, who may touch what.

## 1. The loop (per work item)
1. **Declare** — file/axis UNMEASURED + rubric BEFORE measuring (financial-axes grammar).
2. **Measure** — deterministic, real data, fresh fetch (never stale-cache); document
   the decode/facts; unrecoverable = honest gap, never a substitute.
3. **Stats** — Wilson 95% intervals + conservative separation rule (`stat_suite`);
   small n stated not hidden; point-estimate lead = TIE, never a win.
4. **Sign** — estate city key (Ed25519 over canonical content_id; one signer).
   Key never travels outside the pod/keystone path.
5. **Verify** — self-verify (recompute cid + ed25519) + external verification where
   stranger-checkable (did:web / pubkey in payload).
6. **Publish** — repo `public/` (Pages deploy) + HF mirror (data assets) +
   machine surface (api/agent.json/interop).
7. **Attest** — CI gates: `claimguard-publish-gate` (claims support),
   `signed-json-guard` (no stubs / parse / leftover `n_cells` floors),
   `conflict-guard`, Claims E2E, crawler-view-gate. The old 150-restore
   bots (`honest-board-floor`, `reject-335-board`) now run the guard only —
   they do not revert the index. PR #876.
8. **Improve** — corrections **appended, never edited**; supersession chain;
   audit each round for overclaims.

## 2. Gates (fail-closed, structural — a stub can never deploy)
- `scripts/signed-json-guard.mjs` (deploy.yml) — parse/stub/floor for /signed/*.json
- `scripts/claimguard-publish-gate.py` — claim-support E2E before publish
- `protect-verified-335` workflow (card-chain hash) + `conflict-guard` + `crawler-view-gate`
- No LLM judge in measurement path (CI hook — queued)

## 3. Surfaces (where truth is served)
- **Site/API:** councilof.ai + /api/gspc (**22 axis · 15 measured · 7 UNMEASURED** —
  cite `totals.public_count`, never type it), /api/cards, /signals/*
- **Living data:** `public/signed/` (board_living, gspc-measurement, card_index) · `public/interop/` (rwa corpus, measure runs, sbom) · `public/signals/` (signed signals)
- **HF mirrors:** csoai/gspc-* (boards/bench results) · **csoai/rwa-attest** (this week)
- **Machine faces:** .well-known/agent.json/mcp.json, os-production (Cursor feed)

## 4. Lanes (one spine, no overlapping edits) — aligned 2026-08-28
- **Grok (harness-measurement):** `harness/`, signed cards, Inspect gate, scoreboard
  HEAD, living-door aliases. Card chain = **335 verifying** (PR #876). Do not
  clamp to 150.
- **K3/DSH:** measurement + signing + interop + docs + CI rules (EAT loop).
- **Claude:** products, MCP, lobby/play, **single dist builder**. Close stale
  150-floor PRs. Do not counter-push #876.
- **Cursor:** Council OS / AG-UI / doors / e2e. Quote live 22·15·7. Do not
  edit `public/signed/card_index.json`. Do not restore 14-of-14.
- **Bots:** floor/reject no longer restore 150. `signed-json-guard` is the gate.
- **Owner:** merge-to-master if required; insurance; grants; secrets; I-D.

## 5. Cadence
- Every round: declare → measure → sign → publish → verify → improve.
- Quarterly: whitespace re-verification; AI-Act/CRA freshness check (dates: Art 101
  enforcement 2026-08-02; CRA reporting 2026-09-11).

## 6. Hard honesty rules (bind)
- Measurement, never certification · never issuer-paid/opt-in (unsolicited +
  permissionless) · represented ≠ distributed is a first-class field (JMWH rule) ·
  verdicts UNMEASURED until counsel + bank · no codenames in public strings ·
  signing key never travels · stranger-recomputable or it doesn't publish.
