# GSPC Verify — Chrome extension (Manifest V3)

Shows the live GSPC measurement board from the ONE authority,
`GET https://councilof.ai/api/gspc`, puts a signed-card badge on Hugging Face
model pages, and verifies a pasted card **offline** with the repo's single shared
verifier. Measurement, not certification. Verify is free. A rank is never sold.

What it does, and only that:

| Surface | What it prints | Where the bytes come from |
|---|---|---|
| Popup — board | `totals.lid` and `totals.public_count` **verbatim**; one row per axis with its `status` and its public-leader cell (`EXCLUDED_OWN_MODEL` / `NO_SIGNED_CARD` shown as *withheld* states; `TIE` shown as TIE) | live `GET /api/gspc`, never a typed count |
| Popup — verify | `VALID` / `INVALID` / `UNCHECKABLE`, one reason, every check in order | `functions/_lib/cardVerify.ts` transpiled into `lib/cardVerify.mjs`; keys pinned in source; no network |
| Popup — root inclusion | the same three states for "is this id a leaf of the last published root", with the merkle path recomputed locally | `GET /api/proof?sha=` + `scripts/publish_public_root.py`'s pairing rule |
| Hub badge | `MEASURED — n signed cards · axes` or `UNMEASURED — no signed card` or `UNCHECKABLE` (index unreadable); links to the card; "verify" runs the offline check | public dataset `csoai/gspc-hub-cards` (`mill-cards/INDEX.jsonl` + `cards.jsonl`), exact model-id match only |

Three outcomes, never two. "Could not check" is never rendered as "forged".
Absence is UNMEASURED, never zero. No telemetry, no identity, nothing written
anywhere but a one-hour local cache of the public index.

## Load unpacked (developer mode)

1. `git clone https://github.com/CSOAI-ORG/councilof-ai` (or use an existing checkout).
2. Open `chrome://extensions`, switch on **Developer mode** (top right).
3. **Load unpacked** → choose the folder `extensions/chrome-gspc-verify/`.
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
   (none is shipped in this folder — add `icons/` and the `icons` key before upload).
6. Privacy tab: single purpose = "display and verify Council of AI measurement cards";
   permission justifications — `storage`: caches the public hub-cards index for one hour;
   host `councilof.ai`: reads the public board, proof and card endpoints; host
   `huggingface.co`: reads the public index and shows a badge on model pages.
   Data usage: no user data collected, nothing transmitted off-device except those GETs.
7. Distribution: public; all regions. Submit for review (typically 1–3 days).
8. After approval, record the store URL and the item id in `docs/PLUGINS.md`.

Nothing in these steps requires a key, a token, or a card to be entered anywhere.
