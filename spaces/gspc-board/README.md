---
title: CSOAI-GSPC
emoji: 📐
colorFrom: green
colorTo: gray
sdk: static
pinned: false
license: cc-by-4.0
short_description: "Printer of GET https://councilof.ai/api/gspc. Not a mill."
---

# CSOAI-GSPC

Search a model. Open an axis. Read the published record. The Space prints two live, separate populations: the canonical Council board and third-party Hugging Face measured cells.

[![GSPC](https://councilof.ai/api/badge)](https://councilof.ai/gspc-verify)

Printer of live [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) and [`GET https://councilof.ai/api/hub-cards`](https://councilof.ai/api/hub-cards). The first is the canonical 22-axis board. The second is the published third-party Hub population; it never changes the board. Do not freeze their counts in this README. Fetch failure → **UNCHECKABLE**. This Space is a printer, not a mill or inference endpoint. Measurement, not certification.

CENSUS_3M leftover: census + digest + queue + lock. It is a census, not a grade. Remainder UNMEASURED. Hub listings 3,032,028 are DISCOVERED, not MEASURED. Never mill 3,032,028 listings. Digest is `sha256_jsonl` on https://councilof.ai/signed/hub-census-baseline.json (`0a510a890fa336f099a516a503df86340a529c90b935f026d291e5dcd8e8f1e9`) — coverage leftover, measured:false, not a signed GSPC cell. Queue: https://huggingface.co/datasets/csoai/hub-queue (a listing; MEASURED/UNMEASURED counts live only in its SUMMARY.json and are never typed here). Lock: https://councilof.ai/fleet/FLEET-B.lock.json n_locked=40 UNMEASURED. mill.sh stays dead.

**UNSIGNED staging (HF Jobs mill):** cards the mill stages under `csoai/gspc-hub-cards/staged-unsigned/<date>/<axis>/` carry `"signature": null`. UNSIGNED — becomes MEASURED only after a VALID signature; nothing here is a rank. A staged card's hits/n are card bytes, not a score; n<30 unquotable; TIE is never a win. Staging never changes `n_measured`, any cell, `mill-cards/`, `INDEX.jsonl` or `cards.jsonl`. Per-model state, every axis verbatim: https://huggingface.co/spaces/csoai/gspc-lookup

- Live board: https://councilof.ai/api/gspc
- Published Hugging Face measured cells: https://councilof.ai/api/hub-cards
- x402 trust: https://councilof.ai/interop/x402-trust/latest.json
- Hub census register (counts + card links, never a grade): https://councilof.ai/interop/hf-census/SUMMARY.json
- Per-model lookup (every axis, verbatim): https://huggingface.co/spaces/csoai/gspc-lookup
- Verify (free): https://councilof.ai/gspc-verify
- How to verify: https://councilof.ai/signed/HOW-TO-VERIFY.md
- Leftover honesty: https://councilof.ai/census-digest-leftover.json

Source lives in councilof-ai under `spaces/gspc-board/`.

Verify is free. A rank is never sold. Measurement, not certification.
