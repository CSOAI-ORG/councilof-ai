# GSPC Verify — Chrome extension (Manifest V3)

Shows the live GSPC measurement board from the ONE authority,
`GET https://councilof.ai/api/gspc`, puts a signed-card badge on Hugging Face
model pages, and verifies a pasted card **offline** with the repo's single shared
verifier. Measurement, not certification. Verify is free. A rank is never sold.

Existing measurement surfaces:

| Surface | What it prints | Where the bytes come from |
|---|---|---|
| Popup — board | `totals.lid` and `totals.public_count` **verbatim**; one row per axis with its `status` and its public-leader cell (`EXCLUDED_OWN_MODEL` / `NO_SIGNED_CARD` shown as *withheld* states; `TIE` shown as TIE) | live `GET /api/gspc`, never a typed count |
| Popup — verify | `VALID` / `INVALID` / `UNCHECKABLE`, one reason, every check in order | `functions/_lib/cardVerify.ts` transpiled into `lib/cardVerify.mjs`; keys pinned in source; no network |
| Popup — root inclusion | the same three states for "is this id a leaf of the last published root", with the merkle path recomputed locally | `GET /api/proof?sha=` + `scripts/publish_public_root.py`'s pairing rule |
| Hub badge | `MEASURED — n signed cards · axes` or `UNMEASURED — no signed card` or `UNCHECKABLE` (index unreadable); links to the card; "verify" runs the offline check | public dataset `csoai/gspc-hub-cards` (`mill-cards/INDEX.jsonl` + `cards.jsonl`), exact model-id match only |

Three outcomes, never two. "Could not check" is never rendered as "forged".
Absence is UNMEASURED, never zero. The measurement surfaces keep their existing verification and provenance rules.

## Load unpacked (developer mode)

1. Download <https://councilof.ai/downloads/gspc-verify-0.2.0.zip> and unzip it into a folder
   (or use an existing checkout of this repository: the folder is `extensions/chrome-gspc-verify/`).
   The zip is rebuilt from this folder by `python3 scripts/build-extension-zip.py`, and
   `tests/test_extension_zip.py` fails if the published bytes drift from it.
2. Open `chrome://extensions`, switch on **Developer mode** (top right).
3. **Load unpacked** → choose the unzipped folder (the one holding `manifest.json`).
4. Pin the action; click it for the board and the verify box. Open any
   `https://huggingface.co/<org>/<model>` page for the badge (bottom-right).

No build is required to load it: `lib/cardVerify.mjs` is committed. If you edit
`functions/_lib/cardVerify.ts`, regenerate the copy and the twin test will hold you to it:

```bash
node extensions/chrome-gspc-verify/scripts/build.mjs   # esbuild, TS -> ESM, nothing else
npx vitest run extensions/chrome-gspc-verify            # 0 failing is the gate
```

## Verify a card by hand (no extension needed)

The recipe is public: <https://councilof.ai/signed/HOW-TO-VERIFY.md> (cards) and
<https://councilof.ai/signed/HOW-TO-VERIFY-ROOT.md> (root). Pinned key
`did:web:csoai.org#card-attestation-1`; mill cards under `/interop/mill-cards-signed/`
are signed under `did:web:csoai.org#board-attestation-1` and carry `did`, not `pubkey` —
the extension resolves that from its pinned table, never from the network.

## Layout

```
manifest.json          MV3; host_permissions councilof.ai + huggingface.co; permission: storage
bg.js                  service worker: JSON fetch for the two origins; hub index cache (1h)
popup.html/css/js      board + verify panes
content/hf-badge.js    Hub model-page badge (classic script; dynamic-imports lib/*.mjs)
lib/cardVerify.mjs     GENERATED from functions/_lib/cardVerify.ts — do not edit
lib/gspcVerify.mjs     DID→pinned-key resolution, three-state collapse, inclusion + merkle
lib/board.mjs          rows from /api/gspc; lid verbatim
lib/hub.mjs            hub-cards index parse/lookup; absence is UNMEASURED
scripts/build.mjs      the one build step (esbuild transpile)
test/                  vitest: twin (bytes), verify (repo fixtures + corpus + mill cards),
                       inclusion (merkle vs committed root), board, hub, manifest/copy
fixtures/              captured /api/gspc payload; sample hub-index rows
```

## Publishing to the Chrome Web Store — OWNER action

This lane does not publish. The steps, for whoever holds the developer account:

1. Register a Chrome Web Store developer account (one-time fee) at
   <https://chrome.google.com/webstore/devconsole> under the CSOAI Ltd Google identity —
   use `nicholas@csoai.org`, not a personal account.
2. Bump `version` in `manifest.json` (Web Store rejects a re-upload of the same version).
3. Zip the folder contents (not the parent folder): from the repo root,
   `cd extensions/chrome-gspc-verify && zip -r ../chrome-gspc-verify-$(node -p "require('./manifest.json').version").zip . -x 'test/*' 'fixtures/*' 'scripts/*'`.
4. Dev console → **New item** → upload the zip.
5. Store listing: title "GSPC Verify — Council of AI"; description copied from
   `manifest.json` (no certification or compliance language, no council-size claim); category
   *Developer Tools*; at least one 1280×800 screenshot of the popup; a 128×128 icon
   Icons are shipped under icons/ and bound by manifest.json at 16/32/48/128 px.
6. Privacy tab: single purpose = "display and verify Council of AI measurement cards";
   permission justifications — `storage`: caches the public hub-cards index for one hour;
   host `councilof.ai`: reads the public board, proof and card endpoints; host
   `huggingface.co`: reads the public index and shows a badge on model pages.
   Data usage: measurement reads use those GETs. Optional AI forwards the question and only opted-in recent context to the selected provider; user-entered provider keys remain in trusted extension session memory. Disclose the AI relay, optional provider host access and site opt-in before submission.
7. Distribution: public; all regions. Submit for review (typically 1–3 days).
8. After approval, record the store URL and the item id in `docs/PLUGINS.md`.

Measurement verification needs no account key. Optional external AI providers use the user’s own API key.

## MEOK and CSOAI AI connection

Open **AI workspace** from the popup. This bundled page opens offline. Select Local or Offline AI, grant the optional loopback connection, click Find models, select an installed GGUF chat model, and ask. No model download or service start is performed. Offline AI is locked by default; save online settings before choosing a cloud provider. This lock applies to AI adapter requests, not the browser or other measurement features.

To use the same connection on meok.ai or councilof.ai, explicitly allow that site in the AI workspace. For cloud accounts, grant only the selected fixed provider origin and enter your own API key in this extension page. Keys are kept in trusted extension session memory, never website storage, and clear on browser restart/reload. Your provider may bill API requests; a chat subscription does not imply API access. There is no retry across providers. HF requires an explicit model:provider route; auto, preferred, fastest and cheapest policies are rejected.

AI text never executes tools, signs records, approves work or enters Company cases. Generated text is labeled separately from measured records. The hosted keyless MEOK overlay can also be explicitly selected from the websites without the extension. Local AI needs Chrome or a compatible desktop browser with this extension and an already running local Ollama; phone/TV browsers can use the hosted cloud preset. Offline chat itself is available in the extension workspace, rather than depending on a cached website shell.

Regenerate shared client assets with `node scripts/build-ai-connection.mjs`, then rebuild the extension ZIP. The optional AI features change the extension privacy disclosure: chosen text and opted-in recent context go only to the selected provider; the key stays in trusted session memory. The old store-upload privacy statement above describes the measurement-only release and must be updated by the owner before any store publication. No store publication is included here.

## NVIDIA hosted model connection (8 November 2026)

Select NVIDIA in the existing AI workspace, grant only `https://integrate.api.nvidia.com/*`, and enter your own NVIDIA API key in that trusted extension page. Find models reads NVIDIA's live catalogue. Choose a supported chat model: the catalogue also includes embedding models. The adapter uses the exact selected model, bearer authentication and `/v1/chat/completions`; it does not use a web-chat login, change provider on error, or connect while offline AI is locked. This is hosted text inference, not a local Cosmos deployment, video generation, voice engine or computer-control grant. Cosmos generation and prediction need the separate qualified world-worker path described in `docs/meok/NVIDIA_COSMOS_RESEARCH_20261108.md`.
