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
   `signed-json-guard` (no stubs / parse / floors), `protect-verified-335`
   (card-index hash gate), `conflict-guard`, Claims E2E, crawler-view-gate.
8. **Improve** — corrections **appended, never edited**; supersession chain;
   audit each round for overclaims.

## 2. Gates (fail-closed, structural — a stub can never deploy)
- `scripts/signed-json-guard.mjs` (deploy.yml) — parse/stub/floor for /signed/*.json
- `scripts/claimguard-publish-gate.py` — claim-support E2E before publish
- `protect-verified-335` workflow (card-chain hash) + `conflict-guard` + `crawler-view-gate`
- No LLM judge in measurement path (CI hook — queued)

## 3. Surfaces (where truth is served)
- **Site/API:** councilof.ai + /api/gspc (14 of 14 measured of 14 quotable), /api/cards, /signals/*
- **Living data:** `public/signed/` (board_living, gspc-measurement, card_index) · `public/interop/` (rwa corpus, measure runs, sbom) · `public/signals/` (signed signals)
- **HF mirrors:** csoai/gspc-* (boards/bench results) · **csoai/rwa-attest** (this week)
- **Machine faces:** .well-known/agent.json/mcp.json, os-production (Cursor feed)

## 4. Lanes (one spine, no overlapping edits)
- **K3/DSH (this lane):** measurement + signing + interop + docs + CI rules.
- **Claude lane:** council-os spine, content integration, jail/board wiring.
- **Cursor lane:** Council OS front-end (AG-UI pages/menus) — works off `os-production`;
  E2E runs failing ~20s = environment issue (flagged in notes, not content).
- **Bots:** card-index automations (335/150) — both hash-gated now; publish-rule = owner.

## 5. Cadence
- Every round: declare → measure → sign → publish → verify → improve.
- Quarterly: whitespace re-verification; AI-Act/CRA freshness check (dates: Art 101
  enforcement 2026-08-02; CRA reporting 2026-09-11).

## 6. Hard honesty rules (bind)
- Measurement, never certification · never issuer-paid/opt-in (unsolicited +
  permissionless) · represented ≠ distributed is a first-class field (JMWH rule) ·
  verdicts UNMEASURED until counsel + bank · no codenames in public strings ·
  signing key never travels · stranger-recomputable or it doesn't publish.
