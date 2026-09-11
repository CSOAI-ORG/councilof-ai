# A2A agent-card registry submission checklist — 2026-09-11

**Status:** CHECKLIST for Nick/owner. The lane generated the cards and this list;
**nothing was submitted externally** by the lane. Register: measurement, never
certification. One honest listing each — no gaming (per
`mcp/gspc-server/REGISTRY-SUBMISSIONS.md`, whose reconcile law applies here too:
never write a skill/axis count in a listing you cannot re-check live).

## What was produced (this lane, UNSIGNED by law)

- `public/.well-known/agent-cards/{oracle,sage,quant,cipher,navigator,scout,companion,builder,creator,guardian,negotiator,sovereign}.json` — 12 analyst cards.
- `public/.well-known/agent-cards/council.json` — the 33-seat council design card (quorum 23/33, DESIGN_ONLY, BFT NOT_DEMONSTRATED).
- `public/.well-known/agent-cards/index.json` — `csoai.agent-cards-index/0.1`, derived counts.
- Generator: `scripts/agent_cards_build.py` (`--check` must stay green; re-run after any roster/org-card/axis change).
- Authored source: `scripts/agent_cards/roster.json`.

Every card fronts the SAME interface (`https://councilof.ai/api/a2a`), carries
`sig_ed25519: null`, and states DESIGN_ONLY on its face. No card may be listed
anywhere as a separate service — there is one substrate with 13 discovery cards.

## Pre-flight gates (all must be ✅ before any submission)

- [ ] `python3 scripts/agent_cards_build.py --check` exits 0.
- [ ] Cards deployed and fetchable: `curl -s https://councilof.ai/.well-known/agent-cards/index.json` returns the index; spot-fetch 2 analyst cards + `council.json` (HTTP 200, valid JSON).
- [ ] `scripts/agent-card-extensions.mjs` untouched in behaviour — it rewrites only `agent-card.json`/`agent.json`; the `agent-cards/` subdirectory is out of its scope by design.
- [ ] Org card (`agent-card.json` v1.1.0+) still live and unchanged in shape; the analyst cards mirror it, they do not replace it.
- [ ] GHA publisher has NOT signed these files; if a future signed variant is wanted it is a publisher-lane decision, verified against `did:web:csoai.org#board-attestation-1`.

## Where the cards get submitted (owner runs each step)

### 1. A2A discovery conventions (no submission, just correctness)

- [ ] Confirm the well-known path convention: cards resolve under
      `https://councilof.ai/.well-known/agent-cards/<id>.json` after deploy.
- [ ] Decide (owner call) whether `index.json` should be linked from
      `llms.txt` / the surface catalog (`/interop/surface-catalog.json`) so
      crawlers find the 13 cards from the org card's surfaces. If yes, that
      edit is a separate small lane — not done here.

### 2. a2aregistry.org (permissionless, one POST per card — precedent STAGED in `mcp/gspc-server/REGISTRY-SUBMISSIONS.md` #2)

- [ ] Register the org card first if still STAGED:
      `curl -X POST https://a2aregistry.org/api/agents/register -H "Content-Type: application/json" -d '{"wellKnownURI":"https://councilof.ai/.well-known/agent-card.json"}'`
- [ ] Then one POST per analyst card (`.../agent-cards/<id>.json`) — 13 total.
      Health-check liveness is re-polled (~30 min); a card whose URL 404s gets
      dropped, so deploy must precede submission.
- [ ] Record the registration responses in this file or a follow-up ops note.

### 3. a2a-registry.org (review-gated — PR a JSON agent file; CI validates)

- [ ] PR one agent JSON per card, or one PR referencing the index — check the
      repo's current contribution format before opening. Liveness + card
      completeness are the ranking levers.

### 4. MCP Registry precedent (already LISTED: `io.github.CSOAI-ORG/gspc`)

- [ ] No action for A2A cards — the MCP registry entry describes the MCP
      server, not the A2A personas. Its reconcile law (re-derive tool count
      from `tools/list`, never type it) applies to any A2A listing copy that
      mentions skills: quote from the live card, never from memory.

### 5. Glama (UNSTABLE / STAGED per the submissions log)

- [ ] Keep staged. Do not call the flagship LIVE until directory search and the
      direct page resolve consistently (see the 2026-09-04 note in
      `REGISTRY-SUBMISSIONS.md`). The `glama.json` maintainer claim is
      owner-gated; TDQS rewards rich skill descriptions, which these cards
      already carry.

## What we never say in any listing

- That any analyst is an independently operated service (it is not; DESIGN_ONLY).
- Any typed board number (quote `totals.lid` / `totals.public_count` from GET
  `/api/gspc` at listing time, or link the board — never hard-code).
- Certification, accreditation, conformity assessment, legal determination,
  enforcement — the cards' `explicitly_not` list is the listing copy's too.
- That a card is signed (all are UNSIGNED until/unless the GHA publisher signs).
