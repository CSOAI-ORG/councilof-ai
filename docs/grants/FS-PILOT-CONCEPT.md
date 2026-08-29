# FS measurement pilot — concept (not a notified body)

**Status:** draft. Not a bid. Not a DIGITAL-2026 sector fit. Do not send.

CSOAI Ltd (UK 16939677) is an independent **measurement** body. We measure public AI surfaces. We are **not** a notified body, not Annex VII, not a conformity-assessment authority, and not a certifier.

## What this is

A **financial-services measurement pilot**: run the existing frozen GSPC banks against **named public** FS AI surfaces (chat, copilot, disclosure pages). Emit **one** Ed25519 card per measured id. Three states only: VALID, INVALID, UNMEASURED/UNCHECKABLE.

Live board remains `GET https://councilof.ai/api/gspc`. The seven financial / labour / reserve cells stay **UNMEASURED** until a frozen bank exists. Firmographics (Santander, JPMorgan, …) are public names, not a claim we measured that firm’s production models.

## What this is not

- Not a notified body, not a certificate of conformity, not “Art 50 certified”.
- Not a 23rd axis. Art 50 / C2PA sit in `bindings.json` until a card verifies (CR-012). HMAC ≠ C2PA.
- Not DIGITAL-2026-AI-DATA-10. That fiche names agri / environment / manufacturing / healthcare / energy. A bank chatbot **fails sector fit** for that call. Use `docs/grants/DIGITAL-2026-AI-DATA-10/` for that call, with a healthcare or energy public surface.
- Not a token, bond, or XRPL grade. Devnet hashes are pointers.
- Not filling empty cells. Not 2,410 Hub stickers.

## Output if the owner runs it

One Hub or domain id at a time, same banks as the mill. Card stamp is **UNCHECKABLE** until FROST 2-of-3 (`#board-attestation-2`). No laptop sign.

Owner decides whether to run it. TUI 4 does not mail supervisors, banks, or Brussels from this note.
