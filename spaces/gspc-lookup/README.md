---
title: GSPC lookup
emoji: 🔎
colorFrom: green
colorTo: gray
sdk: static
pinned: false
license: cc-by-4.0
short_description: "One Hub model, every axis, verbatim. Printer, not a mill."
---

# GSPC lookup — one Hub model, every axis, verbatim

Type a Hugging Face model id. The page reads the public files and prints the model's state per axis, verbatim:

- **MEASURED** — a signed card row exists in `csoai/gspc-hub-cards/mill-cards/INDEX.jsonl`; card link, n and an in-browser Ed25519 check are printed. Only **VALID** under `did:web:csoai.org#board-attestation-1` counts.
- **STAGED-UNSIGNED** — a mill job staged a card with `signature: null` under `staged-unsigned/<date>/<axis>/`. hits/n are card bytes, **not a score**. UNSIGNED — becomes MEASURED only after a VALID signature; nothing here is a rank.
- **QUEUED** — on the `csoai/hub-queue` census with no card for that axis. A listing is not a grade.
- **DEAD** — the Hub reports no live inference provider for the id; the mill cannot grade it.
- **UNMEASURED** — not on the census, or no row for the axis. Empty is not zero.
- **UNCHECKABLE** — a public file failed to load. Nothing is guessed.

[![GSPC](https://councilof.ai/api/badge)](https://councilof.ai/gspc-verify)

**Live board (authority):** [`GET https://councilof.ai/api/gspc`](https://councilof.ai/api/gspc) — the lid line on the page is `totals.lid` quoted verbatim from that GET at load time. Fetch fail → **UNCHECKABLE**.

**Lid:** 22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.

This Space is a **printer**, not a mill, not an inference engine. It never writes MEASURED. n<30 unquotable. TIE is never a win. Never print "2410 measured".

- Board: https://huggingface.co/spaces/csoai/gspc-board
- Cards: https://huggingface.co/datasets/csoai/gspc-hub-cards
- Queue: https://huggingface.co/datasets/csoai/hub-queue
- Verify (free): https://councilof.ai/gspc-verify
- Source: councilof-ai under `spaces/gspc-lookup/`

measurement, not certification · verify is free · a rank is never sold
