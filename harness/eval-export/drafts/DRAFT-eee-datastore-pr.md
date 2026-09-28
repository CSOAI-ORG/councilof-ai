[Submission] councilof-ai__gspc-card-corpus: 58 signed benchmark cards, 11 open-weights models run locally

**Source.** Council of AI (CSOAI Ltd, UK company 16939677). The records come from our signed card index,
https://councilof.ai/signed/card_index.json (sha256 `4ff54c78dba0b15b56dc3fdeec62f11f98fa7bf5d4efffc9e54c6839247242a7`,
head `66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da`). The cards were signed on 2026-08-19.
Each record carries, in `source_metadata.additional_details`, the card's sha256, its Ed25519 signature and the
signing key id `did:web:csoai.org#card-attestation-1`, so any number here can be checked offline against the key
published at https://csoai.org/.well-known/did.json. The recipe is at https://councilof.ai/signed/HOW-TO-VERIFY.md.

**Dataset.** Short frozen banks. `arc-30`, `mmlu-30` and `gsm8k-30` hold 30 items each, a size the axis id
declares. For `care-refusal-*`, `gspc-*` and `jail-escape-detection` the cards do not record how many items were
graded, so `num_samples` is left empty and the gap is stated. The item lists are not published with the cards,
so `source_data` is `other` and says so. The pinned revision is the card index sha256 above.

**Coverage.** 335 cards in, 58 records out.
- 235 not exported: models we built ourselves (230), and 5 whose builder our own register leaves unconfirmed.
  A measurer does not place its own models in a comparative datastore.
- 42 held as instrument-suspect, under rules that are written down in the exporter:
  H1, an axis that gives every model one identical reading (`care`, `gov`);
  H2, a documented token-cap defect in the publisher's own issue tracker (`swarm-candidates`);
  H3a/H3b, zeros that sit below chance on a 30-item multiple-choice bank. Those rules hold `swag-30`
  and every card of `deepseek-r1:8b` and `qwen3:4b`.
- Every excluded or held card is listed by sha256, with its reason, in
  `adapter_reports/councilof-ai__gspc-card-corpus_failures.json`.

**Decisions and confidence.**
- `model_info.id` follows the datastore's existing Ollama precedent (`data/wordle_arena/qwen/qwen3-14b`).
  We did not call the registry resolver. The weights digest behind each Ollama tag at run time is not in the
  card. Our confidence in the id canonicalisation is low, and we would welcome maintainer guidance on it.
- `source_type` is `documentation`: we hold aggregate numbers only, not per-item outputs.
  `evaluator_relationship` is `third_party`.
- For the n=30 banks, Wilson 95% intervals are derived by the exporter and labelled as derived. They are not
  part of the signed card.

**Validation.** every_eval_ever 0.3.0 `validate` with semantic checks on: 58 of 58 valid, 0 errors, 0 warnings.
`check_duplicate_entries`: none found. Raw `eval.schema.json` (Draft-7): 0 errors.

**Instances.** No `_samples.jsonl` files: per-item outputs are not published with the cards.

**Licence.** OWNER TO SET BEFORE SENDING. The cards are published under CC-BY-4.0; the datastore is MIT.

**What a record here does not establish.** A record is one score on one short bank on one date. It does not say
that a model is good, or better than another.
