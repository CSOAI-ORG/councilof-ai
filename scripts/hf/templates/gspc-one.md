# GSPC One — measurements and evidence by subject and axis

A public export from Council of AI, operated by CSOAI Ltd. Each table row describes one subject and axis, with its evidence link, observation date, comparison group and signed or unsigned lane. Use it to inspect a dated record and follow its evidence.

## Load the table

```python
from datasets import load_dataset
rows = load_dataset("csoai/gspc-one", split="train")
print(rows.column_names)
print(rows[0])
```

The dataset configuration selects the `rows` array inside `gspc-one.json`. The surrounding JSON object contains the schema, rules, planned classes and axis manifest; it is not another observation. For a reproducible analysis, supply the repository commit as `revision=` and retain the downloaded file's SHA-256.

To inspect the complete document without an additional data library:

```python
import json
from pathlib import Path
document = json.loads(Path("gspc-one.json").read_text(encoding="utf-8"))
rows = document["rows"]
print(document["rules"])
print(rows[0]["subject"], rows[0]["axis"], rows[0]["evidence_url"])
```

## Read the fields

| Field | Meaning |
| --- | --- |
| `subject_class`, `subject`, `axis` | What the record describes and the dimension it concerns. |
| `result` | The source's result or state, retained as text. |
| `lane` | Signed or unsigned status as recorded in the export. Follow the evidence to verify a signed record. |
| `group` | Comparison boundary. Rows must not be ranked or pooled across groups. |
| `evidence_url`, `as_of` | Source evidence and the observation date carried by the row. A current URL may now serve a newer record. |
| `n`, `distinct_items`, `wilson95`, `kind` | Optional measurement context where present. A missing value is not zero. |

The lab and measurer census rows are unsigned state grids, with no population totals or ordering. The humanoid-lab and interpretability-group classes are not yet measurable or measured; they are not scored as zero. Keep model comparisons, deterministic facts and census states distinct. A table's row count is not a population count or benchmark score.

## Provenance and limits

The original `gspc-one.json` file is retained unchanged. The viewer configuration repairs how its existing rows are loaded; it does not update observations, create signatures or admit results to the board. Read `rules`, `planned_classes`, `axes_manifest` and `no_aggregate` in the complete document before analysis.

[Current board](https://councilof.ai/api/gspc) · [Leaderboards and scope](https://councilof.ai/leaderboards/) · [Methodology](https://councilof.ai/methodology/) · [Verify supported signed records](https://councilof.ai/gspc-verify/) · [Corrections](https://councilof.ai/claim-maintenance)

Council of AI — Council for the Safety of Artificial Intelligence. Measurement, not certification. The repository's existing licence applies.
