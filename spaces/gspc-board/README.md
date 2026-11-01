---
title: GSPC | Council of AI
emoji: 📐
colorFrom: green
colorTo: gray
sdk: static
app_file: index.html
pinned: false
license: cc-by-4.0
short_description: Explore published measurements, evidence and coverage gaps.
tags:
- council-of-ai
- measurement
- transparency
- ai-governance
- responsible-ai
- evaluation
---

# GSPC · Explore the evidence

Search a model, open an axis and inspect the published record. This viewer displays two separate populations: the **Council GSPC board** and **published third-party Hugging Face measured cells**. Their counts have different meanings and must not be combined.

[Download the board dataset](https://huggingface.co/datasets/csoai/gspc-board) · [Work in Kaggle](https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board) · [Verify a record](https://councilof.ai/gspc-verify) · [Methodology](https://councilof.ai/methodology/)

## How to use this Space

1. Select the board or Hub population and use its search and filters.
2. Open an axis or model record to inspect the scope, date, evidence and result state.
3. Follow the source links and check admission, withdrawals and signatures where provided before quoting a result.

The Space reads the [live board API](https://councilof.ai/api/gspc) and the separate [published Hub cells API](https://councilof.ai/api/hub-cards). It displays existing results; it does not run inference or new evaluations. A failed fetch is **UNCHECKABLE**, never a zero. Current counts come from those responses, not a number frozen in this card.

## Read the result states

| State | Meaning |
| --- | --- |
| MEASURED | Evidence exists for an axis; this does not establish a winner |
| TIE | A separated lead was not established |
| UNTESTED | Separation was not established by a test |
| UNMEASURED | An explicit coverage gap |
| UNSIGNED / UNADMITTED | Staging material; not an admitted measurement to quote |

A public leader field is not a separated win. Missing values are not zero. Model comparisons and deterministic source facts answer different questions and must not be pooled into one accuracy figure.

## Evidence and admission

A valid signature alone does not admit a card. Check its bound intake receipt (`admitted=true`) and the current withdrawal ledger. [Correction C-2026-0924-03](https://councilof.ai/corrections/mill16-unadmitted-2026-09-24.json) records why signed but unadmitted cards were withdrawn from quotable use. Staged files do not change published measured counts. Listing a model in a census is discovery, not measurement.

Use search in this Space for recorded axis states, the [verification guide](https://councilof.ai/signed/HOW-TO-VERIFY.md) to inspect a signed record, and the [corrections register](https://councilof.ai/corrections/) for later changes.

## Source and terms

Maintained in [Council of AI source](https://github.com/CSOAI-ORG/councilof-ai/tree/master/spaces/gspc-board). Operated by CSOAI Ltd. CC-BY-4.0 applies to this Space's declared content; linked datasets retain their own terms.

Measurement is not certification, accreditation or permission to execute. Verification is free. Payment cannot buy a favourable result or rank.

<details>
<summary>Earlier card and release notes</summary>

[Previous Space card](https://huggingface.co/spaces/csoai/gspc-board/blob/bfe288e8252dd7ab394796ae8d95b65881c3223a/README.md) preserves the dated historical notes.

</details>
