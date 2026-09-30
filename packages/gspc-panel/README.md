# @csoai/gspc-panel — the GSPC evidence panel

A framework-free web component (`<gspc-evidence-panel>`) plus a React wrapper that shows what Council
of AI has measured about one subject: an MCP server URL, an agent card URL, a model id, a signed card
id or a claim-maintenance registry id. Apache-2.0. **Evidence by GSPC · Council of AI.** Measurement,
not certification. Live demo: https://councilof.ai/panel/

```html
<script type="module" src="https://councilof.ai/panel/gspc-panel.js"></script>
<gspc-evidence-panel subject="https://example.com/mcp"></gspc-evidence-panel>
```

**White-label the frame, never the evidence.** Host config (`el.config = {assistantName, logoUrl,
theme, locale, hostContext, connectors}`) renames the assistant and restyles the frame; any attempt to
hide, rename, restyle or relink the attribution rejects the whole config. See `integrations/README.md`.

## What it shows

State (MEASURED / UNMEASURED / UNCHECKABLE / TIE), last measured, next re-check, declared vs observed,
signature state and where it was checked, corrections naming the subject, a copyable citation, the
attribution with a verify link, and an Ask box. UNMEASURED and UNCHECKABLE never show a figure.

| Subject | Reads | Signature |
|---|---|---|
| MCP server / agent card URL | `server_evidence`, `verify_capsule` (`/mcp/free`), `/api/corrections` | capsule id + batch inclusion + index signature, by councilof.ai's verifier |
| 64-hex card id | `/signed/cards/<id>.json`, `/api/gspc`, `verify_card`, `/api/corrections` | **in the browser**: the vendored `public/signed/verify-card.mjs` (pinned key), cross-checked by `verify_card` |
| model id | `/interop/models-measured.json` | the list is unsigned and says so; verify one of its cards |
| `claimreg-…` | `/api/claims/register`, `/api/state` (claim_maintenance) | the register's sidecar-pin result |

## Transports

- **Direct** (default): the reads above, from `https://councilof.ai` only (a `*.councilof-ai.pages.dev`
  preview origin is accepted for testing; any other origin is refused).
- **AG-UI in**: `transport="agui"` renders from `POST /api/agui/run`; `el.renderAgui(sseText)` from any
  recorded stream.
- **A2UI v0.9.1** (a2ui.org lists v0.9.1 as the current release and v1.0 as a release candidate, read
  30 Sep 2026): `el.a2ui` emits the panel as `createSurface` / `updateComponents` / `updateDataModel` on
  the basic catalog; `el.renderA2ui(jsonl)` accepts our own surfaces and councilof.ai's
  `/api/a2ui/verify` surface, and refuses surfaces that carry no GSPC evidence and any v1.0 message.
  **No-JS option**: a host with its own A2UI renderer can use `GET https://councilof.ai/api/a2ui/verify?card=<id>`
  and `/api/a2ui/board` directly (`functions/_lib/a2uiSurfaces.ts`), without this bundle.

## Ask GSPC

Questions go to `POST /api/agui/run` (the shared talkRouter) through Council OS's client
`client/src/lib/aguiTalk.ts`, imported, not re-written. Grounded answers only (with citations and their
own attribution line); no safety verdicts; paid tools never run; "watch it monthly" pauses at Confirm
before `POST /api/claims/watch-request`; in-panel frontend tools (`open_subject`, `highlight_evidence`,
`fill_watch_form`, `pause_at_confirm`) play visibly with Stop / Undo / Take over and never act outside
the panel. Opt-in voice (`voice="on"`) reads answers aloud with Council OS's `client/src/lib/councilVoice.ts`.
Speech input waits for the Council OS lane's `councilListen.ts`, which does not exist yet.
`components/talk/TalkPanel.tsx` is not bundled: it needs React, lucide-react and Tailwind, which would
more than double the bundle and render unstyled in a host console; the React wrapper hosts can use it.

## Build and test

```sh
node scripts/build.mjs          # vendors verify-card.mjs, bundles, refuses > 60 KB gzip, writes public/panel/
node scripts/build.mjs --check  # drift guard (also run by test/bundle.test.js)
npx vitest run --config vitest.config.mjs
npx playwright test --config test/e2e/playwright.config.mjs   # AXE_PATH=<axe.min.js> for the a11y test
```

Every councilof.ai response in the tests is a byte-for-byte recording made on 2026-09-30
(`test/fixtures/live-2026-09-30/MANIFEST.json`); a request the recording does not cover throws.
Fail-first proofs: `test/FAIL-FIRST.md`.
