# AI Claims Index v0: method

Edition 2026-10-14. Measured, not certified. Public names only.
Model: the Stanford Foundation Model Transparency Index and Mozilla's privacy reviews. One scored public table, an open rubric, and every score traced to a public source.

## Scope
- Ten vendors: Alibaba (Qwen), DeepSeek, Google (Gemma), IBM (Granite), Meta (Llama), Microsoft (Phi), Mistral AI, NVIDIA (Nemotron), Xiaomi (MiMo), Z.ai (GLM). Every row links to at least one citable signed card.
- One named Hugging Face model card is scored per vendor. It is always a model we hold citable signed cards for:
  - google/gemma-3-4b-it
  - meta-llama/Llama-3.1-8B-Instruct
  - mistralai/Mistral-7B-Instruct-v0.2
  - Qwen/Qwen3-8B
  - deepseek-ai/DeepSeek-V3.2
  - XiaomiMiMo/MiMo-V2.5
  - nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16
  - microsoft/phi-4
  - ibm-granite/granite-4.2-3b (our cards: ollama granite4.2:3b)
  - zai-org/GLM-5.2 (GLM-4.7-Flash has no citable signed card; GLM-4.7's only citable card is at exactly 1.0, which rule 1 excludes)
- A score describes that card on the fetch date. It does not describe the vendor's whole catalogue.
- All sources were fetched on 2026-10-14. Gated cards (Gemma, Llama) were read from the public model page. Their commit logs need a sign-in, so correction record is **not assessed** for those two and is left out of their totals.

## Rubric (each axis 0, 1 or 2)
1. **Claim specificity.** 2 = named benchmarks with numeric scores in text on the card. 1 = numbers only as images or in a linked report or blog. 0 = none found.
2. **Reproducibility.** 2 = public weights plus the evaluation settings (shots, harness or metric) for the published numbers. 1 = public weights only, gated or open. 0 = neither.
3. **Disclosure.** 2 = training-data size or named composition, plus a limitations or risks section on the card. 1 = one of the two. 0 = neither.
4. **Claim vs evidence.** Scored only where a published vendor claim is comparable to one of our signed cells (same task, same item bank), with agreement judged inside the Wilson 95% interval of our cell. Otherwise the cell is **UNTESTED**, left out of the total and shown as untested, not as zero. In v0 no vendor publishes a figure on a GSPC bank, so all ten rows are UNTESTED.
5. **Correction record.** 2 = a dated public correction of a published figure or claim. 1 = a dated public fix to a released artifact (config, chat template, readme code). 0 = none found within the defined scope (the model card plus its public commit titles). A 0 means none was found in that scope. It does not mean the vendor never corrects. Commits titled only "Update README.md" are not read as corrections.

The total is the sum of the scored axes, shown out of the scored maximum (2 × the number of scored axes). Vendors are listed alphabetically. There is no rank, and equal totals are equal.

**Totals are not comparable across rows.** Totals have different maxima where axes are UNTESTED or not assessed, so totals aren't comparable across rows and the table isn't a ranking.

## Not included in v0: no signed evidence yet
- Liquid AI (LFM): no signed card for any Liquid AI model in `public/interop/mill-cards-signed/`. It will be considered for a later edition once a citable signed card exists.

## Evidence rules (signed cards)
- Cards come from `public/interop/mill-cards-signed/`. A card counts as citable only if all of these hold:
  - its id recomputes as sha256 over the canonical body;
  - its Ed25519 signature verifies against `did:web:csoai.org`;
  - it is not listed in SUPERSEDED.jsonl or WITHDRAWN.jsonl;
  - its status is MEASURED and n ≥ 30.
- Exclusion rules, applied the same way to every row (to both the linked examples and the citable counts):
  1. Cards with accuracy exactly 1.0 or exactly 0 are excluded. Ceiling and floor results are treated as weak evidence.
  2. Affect-axis cards are excluded, because the affect axis is provisional.
  3. Detector (Det) cells are never citable.
  4. Care cells are never used (see below).
- A row with 0 citable cards after these rules is not shipped.
- Care cells are not used for comparison (comparison_citable=false). v0 applies this to every care cell, which is stricter than required.
- ollama qwen3:8b Safety is **held**. The basis is the 6 Oct repeat-run spread (unparsed share 8.33% vs 11.11% against the 10% gate), ruled by Measure and carried through #3047 and #3049. See the claim history. The Qwen row scores Qwen/Qwen3-8B on the HF transport, which is a different subject, and cites no Safety cell.
- G2 cards (the 31 cards of 14 Oct) are counted separately (`g2_cards`) and are not merged into board v2 figures. No card is claimed to be inside a card root unless a root includes it.
- Unsigned cells (for example the DeepSeek V4.1 and MiMo HF-lane cells from the 14 Oct new-models push) are not cited.
- No score in this index comes from a signed card, and no signed file or card_index.json was changed.

## Correction context
The correction history for our own measurements follows the evidence-assets batch 1 claim history (qwen3:8b). Every past correction there is a corrected interpretation (supersede, hold or withheld card). None is altered evidence. Corrections to this index go to the same public ledger: https://councilof.ai/api/corrections.

## Reproduce
1. Download `claims-index-v0.json`. Each score carries `quote`, `source_url`, `fetch_date` and `source_sha256` (the hash of the snapshot it was read from).
2. Open the source URL and find the quote. Commit-log scores use `https://huggingface.co/api/models/<repo>/commits/main`.
3. Check any signed card: `node verify-card.mjs <card_url>` (recomputes the id and checks the Ed25519 signature against https://csoai.org/.well-known/did.json), or use https://councilof.ai/gspc-verify/.

## Challenge a score
Open an issue at https://github.com/CSOAI-ORG/councilof-ai/issues titled `claims-index: <vendor> <axis>`. Include the public URL and quote you think changes the score. Vendors are welcome to file too. Accepted changes are logged in the corrections ledger and produce a new dated edition. Earlier editions are kept and never edited.

## Limits
- v0 scores one card per vendor, from public pages only, on one date.
- Quotes from HTML pages were matched after whitespace normalisation.
- The vendor scores are not signed in v0. Signing needs Nick's approval.
