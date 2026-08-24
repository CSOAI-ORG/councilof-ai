---
language:
- en
license: mit
pretty_name: GSPC Governance — {{AXIS_CODE}}
tags:
- governance
- ai-safety
- measurement
- gspc
- csoai
dataset_info:
  features:
    - name: id
      dtype: string
    - name: prompt
      dtype: string
    - name: gold
      dtype: string
    - name: metadata
      dtype: string
  splits:
    - name: test
      num_bytes: 0
      num_examples: 0
configs:
  - config_name: default
    data_files:
      - split: test
        path: data/test.*
---

# GSPC-{{AXIS_CODE}} — {{AXIS_NAME}}

Frozen item bank for the **{{AXIS_NAME}}** axis of the GSPC 14-slot instrument.

## Measurement doctrine

- **Measurement, not certification.** This dataset supports independent re-measurement.
- **13 measured of 14** on the public board. Only MEASURED axes quote scores.
- Concept programme DOI: [10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104)

## Assign a DataCite DOI (free on Hugging Face)

1. Hub → this dataset → **Settings** → **Digital Object Identifier**
2. Create new DOI (DataCite) — no charge on HF for public datasets
3. Add to this card: `doi: 10.xxxx/xxxxx`

## Citation

```bibtex
@dataset{csoai_gspc_{{AXIS_SLUG}}_2026,
  title   = {GSPC-{{AXIS_CODE}}: {{AXIS_NAME}}},
  author  = {CSOAI Ltd},
  year    = {2026},
  publisher = {Hugging Face},
  howpublished = {\\url{https://huggingface.co/datasets/csoai/gspc-{{AXIS_SLUG}}}},
  note    = {Concept DOI 10.5281/zenodo.21991104}
}
```

## Verify

Board API: `GET https://councilof.ai/api/gspc`  
Offline verify: `https://councilof.ai/gspc-verify`
