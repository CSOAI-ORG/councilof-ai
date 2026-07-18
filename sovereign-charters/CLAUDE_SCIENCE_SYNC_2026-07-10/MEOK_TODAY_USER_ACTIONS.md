# MEOK — USER ACTIONS (Nick only) · 2026-07-08

Everything the agent can do from its seat is **done** (firmware code, OSCAL, System Card, print
manifests, enclosure STLs, deck, OpenPatent disclosure). What remains needs you physically or needs
a decision the agent can't make. Ordered cheapest-first.

## A. Free / today — printing (QIDI Max4 is LAN-only; Hermes/you drive it)
- [ ] **Print the Stage-0 wick coupon** (£0, PA12-CF). Settings in `MEOK_Print_Manifest.md`.
      **Gate:** does PA12-CF wick water up the grooves (~11 mm expected, finer groove = higher rise)?
      → If yes, the capillary POC is real and you order the Stage-1 BOM (step C).
- [ ] **Print one radar case body** (PA12-CF) + one radome (PLA) + tamper cap (TPU).
      Settings per part in `MEOK_Radar_Print_Manifest.md`. **Radome PLA only — never CF.**
      **Gate:** does the LD2450 board seat on the standoffs? (see step B first.)

## B. Cheap / this week — measure & confirm (unblocks the final print + firmware)
- [ ] **Measure the LD2450 PCB mount-hole coordinates** (calipers) or pull them from the board
      drawing. The standoffs are designed to the 44×15 mm outline but not exact hole centres —
      this is the last gap before batching 5 cases.
- [ ] **Confirm the LD2450 UART baud** on your actual units: default is **256000**, but some clones
      ship **115200**. One line in the firmware (`LD2450_BAUD`) — but you must know which.
- [ ] **Flash `ld2450_signed_node.ino`** to an ESP32-S3 once a board + sensor are in hand
      (deps: ArduinoJson, rweather/Crypto). Run `verify_test.py` host-side to confirm signatures
      verify. The demo moment: signed live tracking → `/api/verify` returns `{valid:true}`.

## C. Money — order only after the Stage-0 gate passes
- [ ] **Order the Stage-1 capillary BOM** (£65–223, itemized in `MEOK_Stage1_BOM.csv`) — ONLY if
      the Stage-0 coupon wicks. Don't buy ahead of the gate.
- [ ] **Order radar parts** for a first unit: HLK-LD2450 (£4–7) + ESP32-S3 (£5–8) + optional
      MR60BHA1 (£15–25) for the vitals tier. ~£15–40 for one full node.

## D. Decision / legal — only you can authorize
- [ ] **Confirm openpatent.ai domain ownership.** The agent found the openpatent assets in
      `clawd/openpatent-hive/` etc. but **no `openpatent` repo in your CSOAI-ORG GitHub** and cannot
      verify the domain registration. Confirm you hold openpatent.ai before publishing.
- [ ] **Trademark check on "OpenPatent"** before public branding — lawyer question (Kevin Hanson /
      CIPA per your notes), not one the agent can settle.
- [ ] **Publish the OpenPatent defensive publication** once the above are confirmed: compute the
      file SHA-256, sign via `/api/sign`, record the signature + BFT receipt into §7 of
      `MEOK_OpenPatent_Signed_Sensing_Node.md`. That act fixes your prior-art date.

## What the agent will do next (no action needed from you)
- Draft the LD2451 vehicle-tier System Card / OSCAL if you want the ground/vehicle unit fully papered.
- Turn the deck into a PDF export, or re-theme it, on request.
- Anything above marked "agent can do" — just say which.

---
*Legend: A = free+physical, B = cheap+confirm, C = spend (gated), D = decision/legal. The agent is
blocked on all of these for a real-world reason (LAN printer, physical parts, domain/legal), not a
capability gap.*
