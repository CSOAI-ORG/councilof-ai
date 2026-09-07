---
language:
  - en
license: cc-by-4.0
pretty_name: CSOAI Hugging Face Hub census (counts + cards)
task_categories: []
tags:
  - gspc
  - hub-census
  - measurement-not-certification
  - register
---

# csoai/hf-census — Hub coverage register

Dataset-card form of the Hub census. Rows are **counts and card links**, never
model grades. A listing on the Hub is DISCOVERED / UNMEASURED. MEASURED only
after the signer signs.

## Where agents should read

- Living board: https://councilof.ai/api/gspc
- x402 trust: https://councilof.ai/interop/x402-trust/latest.json
- Verify a card: https://councilof.ai/signed/HOW-TO-VERIFY.md

## Files

- `SUMMARY.json` — `n` = unique fetched Hub ids; `n_measured` = 0
- `axis-sources.json` — 22 axis-source buckets; each `n` equals the fetch for that source
- `org-register.json` — lab/org directory (`n` + `card_links`); the 8 financial axis names are coverage/directory fields only, not issuer grades

## Not in this card

- No model certification
- No lab score / rank / grade
- No fabricated `n` (counts come from the fetch that wrote the file)
- Tokens are GHA secrets; this card does not carry credentials
