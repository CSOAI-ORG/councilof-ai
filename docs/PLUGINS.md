# Plugins and extensions — one verify surface, one lid, per platform

The estate has ONE board authority (`GET https://councilof.ai/api/gspc`) and ONE
card-verification rule (`/signed/HOW-TO-VERIFY.md`, implemented once in
`functions/_lib/cardVerify.ts`). Every plugin below is a *printer* of that GET and a
*caller* of that rule. None is a second engine; none certifies; none sells a rank.
Verify is free everywhere.

The two things every platform surface must be able to show:

1. **The lid** — `totals.lid` from `/api/gspc`, printed verbatim (live today:
   "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is
   TIE · not a certificate" — do not copy this line into code; fetch it).
2. **A three-state verify** — VALID / INVALID / UNCHECKABLE for a pasted card, with the
   signing key pinned to `did:web:csoai.org` and "could not check" never rendered as
   "forged".

## Inventory (bytes adjudicated 2026-09-02)

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

- Mill cards (`/interop/mill-cards-signed/*.json`) carry `did` and no `pubkey`, and are
  signed under **board-attestation-1**. `functions/_lib/cardVerify.ts` classifies them as
  `unrecognised_family`, so `/gspc-verify` and the `/mcp` `verify_card` tool return
  "nothing was checked" for a genuinely signed card, and the stdio MCP returns
  UNCHECKABLE. The extension resolves the DID from the pinned anchor table and verifies
  them (12/12 VALID in the committed set). Whether the site verifier should do the same,
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

`extensions/chrome-gspc-verify/` — load unpacked (README). Popup = lid + 22-row board +
verify box; badge on `huggingface.co/<org>/<model>`. Web Store publication is an owner
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
- Rule on the mill-card family in the shared verifier (finding 1 above).
- Decide whether `public/openapi.json` should be retired in favour of `/api/openapi.json`.
