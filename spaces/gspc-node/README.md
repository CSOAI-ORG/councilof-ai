---
title: GSPC Node
emoji: 🟩
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: GSPC instrument printer. writes_board false. Not a mill.
---

# GSPC Hugging Face Space — printer, not a mill

This Space is an instrument printer. It does not mill. It does not write the board.

- `GET /health` — node up. `writes_board: false`.
- `POST /v1/measure` — **404 by design.** Do not mill. Do not ship a mill recipe as a product.
- Never writes [GET /api/gspc](https://councilof.ai/api/gspc). A listing is not MEASURED. Payment does not mint MEASURED.

Do not mill.
