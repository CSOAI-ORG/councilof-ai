# Plugins and extensions — one verify surface, one lid, per platform

The estate has ONE board authority (`GET https://councilof.ai/api/gspc`) and ONE
card-verification rule (`/signed/HOW-TO-VERIFY.md`, implemented once in
`functions/_lib/cardVerify.ts`). Every plugin below is a *printer* of that GET and a
*caller* of that rule. None is a second engine; none certifies; none sells a rank.
Verify is free everywhere.

The two things every platform surface must be able to show:

1. **The lid** — `totals.lid` from `/api/gspc`, printed verbatim. No example is quoted
   here: the one this file used to carry went stale within days. Fetch it.
2. **A three-state verify** — VALID / INVALID / UNCHECKABLE for a pasted card, with the
   signing key pinned to `did:web:csoai.org` and "could not check" never rendered as
   "forged".

## End to end, 2026-09-28 (clean environment on the lanes pod, against live endpoints)

Each row was installed or run from scratch and called for real; the proof files are under
`/workspace/lanes/plugin-ext-20260928/` on the pod volume. The tool list of a server is
whatever its `tools/list` answers — counts below are what was READ, with the time.

| Surface | Result | What was run |
|---|---|---|
| HTTP MCP `https://councilof.ai/mcp` | WORKS | initialize → serverInfo 1.4.2 (== `mcp/gspc-server/server.json`); tools/list 16 (12 read-only annotated, 4 x402); one real call per tool, 21:31Z: board_totals LIVE 23 axis · 23 measured, verify_card VALID, get_root VALID (merkle c2ab6d59…), verify_inclusion VALID; x402 tools answer the challenge, nothing settled |
| HTTP MCP `https://councilof.ai/mcp/free` | WORKS | same 12 read-only tools; the 4 x402 names are absent (not found), as the directory submission requires |
| Claude Code plugin `gspc@council-of-ai` (`distribution/plugin`, this repo) | WORKS | Claude Code 2.1.283, clean HOME: `plugin validate` passes; marketplace add + install; `claude mcp list` → `plugin:gspc:gspc … (HTTP) ✔ Connected` |
| Claude Code plugin `council-of-ai@council-of-ai` (repo `CSOAI-ORG/council-of-ai-grok`) | BROKEN | (a) repo 404 anonymously while the org is dark — not installable by anyone else; (b) HEAD's `.mcp.json` entry has `url` but no `"type": "http"` → Claude Code registers **no** server ("No MCP servers configured"; adding the type → Connected); (c) five commits since 29 Aug kept version 0.1.1, so installed copies stay on cb01690, which still wires `csoai-governance` + unpinned `npx csoai-gspc-mcp`; (d) `/sign` calls `csoai-governance`. Proposal patch 0.1.2 (all four) staged in the lane dir, HELD for the owner |
| npm `csoai-governance-mcp` 0.1.0 (in the installed plugin above) | BROKEN | every tool errors: csoai_catalog 404, csoai_sign 405, csoai_verify 405, csoai_govern "unavailable". Its default gateway is not a CSOAI surface. npm marks it deprecated. Not wired into any surface in this repo |
| npm `csoai-gspc-mcp` 0.2.2 (stdio) | WORKS, narrower | 12 tools: the 8 free + 4 x402 all answer; `mcp_trust`, `measurement_index`, `verify_capsule`, `server_evidence` are "unknown tool" — the repo source declares the same version with 16 tools (same version, different bytes: owned by the harness-x parity lane). npm marks 0.2.2 deprecated, and the server card pins exactly that version |
| Chrome extension `extensions/chrome-gspc-verify/` 0.1.1 | WORKS (after this change) | loaded unpacked in Chromium 1228 (Playwright, headless): popup board prints `totals.public_count` verbatim and one row per live axis (23 rows == live); verify: signed card VALID, mill card VALID, tampered INVALID, bad JSON UNCHECKABLE, public-root leaf UNCHECKABLE + inclusion VALID via live `/api/proof`; Hub badge on a model page with signed cards → MEASURED, on one without → UNMEASURED. vitest 55/55 |
| Grok pointer (`.grok-plugin/marketplace.json` → `plugins/gspc/`) | FIXED TEXT | said "Four tools" / "Seven tools" / "No 23rd axis" against a 16-tool server and a 23-axis board; now types no count. `.mcp.json` gains `"type": "http"`. Not install-tested: no Grok CLI on the pod, and the GitHub install path is dark |

Found and fixed in the extension: `lib/cardVerify.mjs` had drifted from
`functions/_lib/cardVerify.ts` (the twin test failed): it lacked the rotated
`#card-attestation-2` key, so a card naming that key came back UNCHECKABLE "not pinned".
Regenerating alone turned all 2,825 mill cards INVALID, because the extension injected a
`pubkey` beside the card's `did` and the shared rule now calls that `key_ambiguous`; the
extension now passes the card through and lets the shared verifier resolve the DID. The
mill-card test takes 20–30 s on the pod and timed out at vitest's 5 s default; it has an
explicit bound. A public-root leaf was told "not a shape CSOAI publishes", which is false; it
now gets its own UNCHECKABLE reason.

## Inventory (bytes adjudicated 2026-09-02; superseded where the table above disagrees)

| Surface | State | Where | Notes |
|---|---|---|---|
| MCP server, stdio (`npm csoai-gspc-mcp`) | REAL | `mcp/gspc-server/` (7 tools: board_totals, get_axis, verify_card, list_cards, get_root, get_card, verify_inclusion) | zero deps; `verify-card.mjs` pins card-attestation-1; 404 leaf = INVALID |
| MCP server, HTTP (`POST https://councilof.ai/mcp`) | REAL | `functions/mcp/[[path]].ts`, tool catalogue `functions/mcp/gspc-tools.json` (same 7 names) | shares `functions/_lib/cardVerify.ts` |
| Claude Code / Grok plugin | REAL (separate repo) | marketplace `CSOAI-ORG/council-of-ai-grok`: `plugin.json`, `.claude-plugin/marketplace.json`, skills `council` `gspc` `pack` `sign-artifact` `verify-card`, commands, agent `measurement-auditor`, `verifier/gspc-verify.mjs` | in this repo only the pointer: `plugins/gspc/{plugin.json,.mcp.json,README.md}` (→ `https://councilof.ai/mcp`) and `.grok-plugin/marketplace.json` |
| Offline verifier package | REAL | `packages/gspc-card-verifier/` (37/37 under `node --test`), bundled to `public/verifier/gspc-verify.mjs` | profile-driven; refuses out-of-domain numbers |
| Browser verify page | REAL | `/gspc-verify` → `client/src/lib/recordVerify.ts` → `functions/_lib/cardVerify.ts` | `client/src/lib/cardVerify.ts` is an older twin kept in step by `cardVerifyTwin.test.ts` |
| Chrome extension (MV3) | REAL (this PR) | `extensions/chrome-gspc-verify/` | popup board + verify; Hub badge; see its README |
| ChatGPT / Custom-GPT Actions | REAL (this PR) | `GET /api/openapi.json` (`functions/api/openapi.json.ts`) | describes existing endpoints only; import the URL as an Action schema |
| `public/openapi.json` | REAL, partial | lists `/api/gspc`, `/mcp`, `/verify`, feeds; does **not** list `/api/proof` | superseded for Actions by `/api/openapi.json` |
| Hub cards index | REAL, public | HF dataset `csoai/gspc-hub-cards`: `cards.jsonl` (417 rows, runner-tag model ids), `mill-cards/INDEX.jsonl` (12 rows, Hub model ids) | unsigned listing; the card is the evidence |

Findings the inventory surfaced (not fixed here; owner to rule):

- RESOLVED by 2026-09-28: the shared verifier now resolves a mill card's `did` itself and
  returns VALID (see the table above). Original finding, kept for the record:
  Mill cards (`/interop/mill-cards-signed/*.json`) carry `did` and no `pubkey`, and are
  signed under **board-attestation-1**. `functions/_lib/cardVerify.ts` classifies them as
  `unrecognised_family`, so `/gspc-verify` and the `/mcp` `verify_card` tool return
  "nothing was checked" for a genuinely signed card, and the stdio MCP returns
  UNCHECKABLE. The extension resolves the DID from the pinned anchor table and verifies
  them (83/83 signed files in the committed set VALID, per test/verify.test.mjs). Whether the site verifier should do the same,
  or whether mill cards should carry `pubkey`, is a policy call.
- The hub index row for a mill card says `status: MEASURED` while the signed body says
  `status: "UNMEASURED", unmeasured: ["signed-pending-verify"]`. The extension prints the
  index label and, after "verify", the body's own status beside it — bytes decide.
- `/api/proof` binds the 50-leaf public-root set (XRPL coverage cards), not the 335
  signed measurement cards; inclusion for a measurement card is therefore INVALID
  "not a leaf" by the MCP convention. The extension says so in words rather than
  letting INVALID read as forgery.

## Per platform

### MCP (Claude Desktop, Claude Code, Cursor, Kimi, Grok, any MCP client)

```bash
claude mcp add gspc -- npx -y csoai-gspc-mcp        # stdio
# or HTTP: POST https://councilof.ai/mcp
```
Lid: `board_totals` returns `totals` — print `lid`. Verify: `verify_card` (three states),
`verify_inclusion` (three states). Source: `mcp/gspc-server/README.md`.

### Claude Code plugin

Marketplace repo `CSOAI-ORG/council-of-ai-grok` (`/plugin marketplace add CSOAI-ORG/council-of-ai-grok`,
then install `council-of-ai`). Skills `/council-of-ai:gspc` (board) and
`/council-of-ai:verify-card` (offline verify via `verifier/gspc-verify.mjs`); the
`measurement-auditor` agent is read-only. This repo carries only the pointer folder
`plugins/gspc/` — the plugin's own files live in the marketplace repo.

### Chrome extension

`extensions/chrome-gspc-verify/` — load unpacked (README). Popup = lid + one row per live
board axis + verify box; badge on `huggingface.co/<org>/<model>`. Web Store publication is an owner
action; the exact steps are in that README.

### ChatGPT / Custom GPT Actions

Create a GPT → Configure → Actions → **Import from URL** →
`https://councilof.ai/api/openapi.json`. Authentication: none. The spec exposes only
what exists: `getBoard` (`/api/gspc`), `getProof` (`/api/proof?sha=`), `getRoot`
(`/root.json`), `getDid` (`/.well-known/did.json`), `getCardIndex`
(`/signed/card_index.json`), `getCard` (`/signed/cards/{id}.json`). Instruct the GPT to
quote `totals.lid` and `totals.public_count` verbatim and never to compose a count.
Signature verification is NOT an Action — Actions cannot run Ed25519; the GPT should
hand the user the card URL and the recipe at `/signed/HOW-TO-VERIFY.md`, or the
extension.

### Everything else (Gemini extensions, Copilot plugins, Poe, …)

Same two primitives, same authority: fetch `/api/gspc` and print the lid; point verify
at `/gspc-verify`, the MCP tools, or the offline package. Do not add a platform surface
that freezes a count or introduces a second verifier.

## Owner actions

- Chrome Web Store: developer account + upload (steps in the extension README).
- council-of-ai-grok 0.1.2: push the staged proposal patch once the org is reachable (HELD).
- npm: `csoai-gspc-mcp@0.2.2` and `csoai-governance-mcp` are marked deprecated on npm while the
  server card pins the former; publishing a new version is an owner action (HELD).
- Decide whether `public/openapi.json` should be retired in favour of `/api/openapi.json`.
