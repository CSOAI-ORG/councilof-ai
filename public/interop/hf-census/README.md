# Hugging Face Hub census (counts + cards, never model grades)

This directory is the **counts-only** Hub coverage register. It is a directory of
discovered listings and of signed measurement cards that already exist. It is
not a grade of a model, not a grade of a lab, and never a certificate.

Living board (recompute, do not copy a screenshot):
https://councilof.ai/api/gspc

x402 trust surface:
https://councilof.ai/interop/x402-trust/latest.json

How to verify a signed card:
https://councilof.ai/signed/HOW-TO-VERIFY.md

## Register format

| File | What `n` is | What it is not |
| --- | --- | --- |
| `SUMMARY.json` | unique Hub listing ids actually fetched | not MEASURED, not a score |
| `axis-sources.json` | listings whose Hub metadata could source each of the 22 axes | not a GSPC cell |
| `org-register.json` | who runs what: org `n` + Hub card links | not a lab grade, not an XRPL issuer |

`n_measured` on these files is **0**. MEASURED is minted only when the signer
signs a card. "issued" on a badge means the card exists. "certified" is never
a claim this register makes.

The living loop is `.github/workflows/census-delta.yml`: Hub API pagination
(`scripts/census/hub_census.py collect --mode delta --publish-dir public/interop/hf-census`),
never a probe, never `listings.jsonl` in git. A complete Hub walk is unbounded;
`n` is always the fetch that wrote the file.

## Badge

Embed a subject-bound card, not a certificate:

```markdown
[![GSPC card](https://councilof.ai/api/badge?card=<64-hex>&subject=<owner/model@immutable-revision>&claim=issued)](https://councilof.ai/signed/HOW-TO-VERIFY.md)
```

- `claim=issued` — the card exists (grey if it does not)
- `claim=verified` — a real subject-bound card (grey if missing)
- `claim=measured` — only after the signer signs
- `claim=certified` — refused; this board does not certify
