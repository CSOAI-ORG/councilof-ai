# provider-diff-feed — the design-partner offer (draft for owner)

> Derived from the live feed, not from memory. Rerun source: GET /api/feeds/provider-diff.

## What the feed actually emits (as of the last run)
- **51 targets** across AI providers: terms, usage policy, model cards, pricing, safety policy, Article 50 marking statements.
- Hash-only: a diff is a change of the normalised sha256 between two captures. **Content is never stored** (commitment: hash-only, robots-honouring).
- Last run: {
 "run_at": "2026-09-05T09:06:18Z",
 "n_targets": 51,
 "ok": 45,
 "unchanged": 5,
 "changed": 14,
 "bytes_only": 26,
 "first": 0,
 "uncheckable": 6,
 "unknown": 0,
 "changed_ids": [
  "anthropic/pricing",
  "anthropic/art50_marking",
  "google/safety_policy",
  "xai/terms",
  "xai/usage_policy",
  "xai/pricing",
  "xai/safety_policy",
  "cohere/usage_policy",
  "cohere/model_cards",
  "cohere/safety_policy",
  "deepseek/model_cards",
  "deepseek/pricing",
  "alibaba-qwen/model_cards",
  "alibaba-qwen/usage_policy"
 ],
 "uncheckable_ids": [
  "openai/terms",
  "openai/usage_policy",
  "openai/model_cards",
  "openai/pricing",
  "openai/safety_policy",
  "openai/art50_marking"
 ],
 "unknown_ids": [],
 "leaves": [
  "card-anthropic-pricing-20260905T090618Z-unsigned.json",
  "card-anthropic-art50_marking-20260905T090618Z-unsigned.json",
  "card-google-safety_policy-20260905T090618Z-unsigned.json",
  "card-xai-terms-20260905T090618Z-unsigned.json",
  "card-xai-usage_policy-20260905T090618Z-unsigned.json",
  "card-xai-pricing-20260905T090618Z-unsigned.json",
  "card-xai-safety_policy-20260905T090618Z-unsigned.json",
  "card-cohere-usage_policy-20260905T090618Z-unsigned.json",
  "card-cohere-model_cards-20260905T090618Z-unsigned.json",
  "card-cohere-safety_policy-20260905T090618Z-unsigned.json",
  "card-deepseek-model_cards-20260905T090618Z-unsigned.json",
  "card-deepseek-pricing-20260905T090618Z-unsigned.json",
  "card-alibaba-qwen-model_cards-20260905T090618Z-unsigned.json",
  "card-alibaba-qwen-usage_policy-20260905T090618Z-unsigned.json",
  "card-daily-20260905T090618Z-unsigned.json"
 ]
} — {'OK': 45, 'UNCHECKABLE': 6, 'UNKNOWN': 0} states.
- Free preview: GET /api/feeds/provider-diff. Paid history: GET /api/feeds/provider-diff?history=1 (x402).
- Leaves: /feeds/provider-diff/leaves/ (hash leaves per target per run).

## The wedge: delta since last receipt
A design partner receives ONLY the delta since their last receipt:
- `since → now` per target; the normalised-sha256 diff between their receipt waterline and the latest capture.
- The offer is built on the FREE rails: verification free forever (gspc-verify + root inclusion); only the assembled history + bespoke partner stream is paid (provider-diff-feed SKU).
- No mass send — one partner, one waterline, one signed diff.

## One-page (abstract)
*CSOAI watches the public promises of AI providers — terms, pricing, safety policies, model cards, Art-50 marking — daily, hash-only, robots-honouring. You subscribe as a design partner and receive the delta since your last receipt: what changed in your provider's commitments, signed, verified against the public root, watermarked for your audit trail. Measurement, not certification. Verification is free forever.*

## First-10 partner shortlist (from the estate's own evidence)

### AI providers the feed already covers (top by churn + surfaces)
| provider | surfaces | total changes | notes |
|---|---|---|---|
| Cohere | 5 | 5 | feed watches; diff available |
| Anthropic | 6 | 4 | feed watches; diff available |
| xAI | 5 | 4 | feed watches; diff available |
| Alibaba Cloud / Qwen | 4 | 4 | feed watches; diff available |
| Google | 6 | 3 | feed watches; diff available |
| DeepSeek | 4 | 3 | feed watches; diff available |
| Amazon (AWS Bedrock / Nova) | 5 | 1 | feed watches; diff available |
| Mistral AI | 5 | 1 | feed watches; diff available |
| OpenAI | 6 | 0 | feed watches; diff available |
| Meta | 5 | 0 | feed watches; diff available |

### Banks/issuers (from the census, by evidence records)
| institution | evidence records | pack |
|---|---|---|
| HSBC | 180 | swift-bank-pack |
| StanChart | 180 | swift-bank-pack |
| UOB | 180 | swift-bank-pack |
| SG-FORGE | 160 | swift-bank-pack |
| BNY Mellon | 150 | swift-bank-pack |
| BNP Paribas | 150 | swift-bank-pack |
| Deutsche Bank | 150 | swift-bank-pack |
| UBS | 150 | swift-bank-pack |
| JPMorgan | 150 | swift-bank-pack |
| Goldman Sachs | 150 | swift-bank-pack |

## Owner actions (draft only)
1. Approve one partner from the list; I hand over a signed diff for their waterline (test receipt exercise).
2. Never mass-send; one-to-one, evidence-backed.
3. Prices quoted at the 402 only (price-gate doctrine: no public prices).
