---
name: pack
description: Assemble a Council of AI attested measurement pack via the CSOAI 402 rail. Use when the user says pack assemble, agent invoice, x402 pack, or first-buyer pack. The board stays free; the pack is a paid assembly of existing evidence, never a grade.
---

# Pack assemble (CSOAI 402)

Agents pay to assemble the pack; the board stays free. This is **not** a score, a certificate, or a
way to paint the empty cells.

## Call

The paid rails are served by Council of AI. Read the actual 402 challenge first — it carries the
asset, the amount and the pay-to address, and the terms differ per request:

- `https://councilof.ai/api/evidence-bundle` — one obligation (`article-50`, `article-53`, `dora`,
  `cra`), optionally narrowed to a subject.
- `https://councilof.ai/api/receipts/batch` — a historical window of signed measurement receipts.

`preview=true` (or the free `evidence_bundle_preview` MCP tool) returns the count, span and digest
**without charging anything**. Use it first so the user knows what they are buying.

## How to present

1. If 402: say **invoice for assembly**, and quote the scheme, network and amount from the challenge
   itself. Never say "pay to pass". There is no price on any Council of AI surface.
2. If 200: print the bundle contents — the selected cards, their verification links, and the manifest
   signing status. A returned unsigned manifest declares `sig_ed25519: null` and an unsigned reason;
   report it as unsigned.
3. Quote the verify URL. The board at `/api/gspc` and verification at `/gspc-verify` stay free.

## Forbidden

- Filling empty cells
- Treating the pack as a grade, a rank, or a conformance determination
- Hosting a 402 on `/api/gspc` or on the verify page
- Listing a 402 anywhere as pay-to-pass
- Settling a payment from a plugin session without the owner's explicit instruction
