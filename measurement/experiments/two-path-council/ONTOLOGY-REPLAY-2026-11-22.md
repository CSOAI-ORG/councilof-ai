# Frozen GSPC ontology projection — replay 22 November 2026

**State:** `RESEARCH_PROJECTION_NOT_SIGNED`. No canonical ontology amendment, assertion of NIST acceptance, live board change, private bank exposure or signed card is made.

Public source: `csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac` (frozen 28 October 2026), plus existing ontology namespace `https://councilof.ai/ns/gspc/0.1/`.

Command:

```sh
python3 -B project_frozen_ontology.py > ontology-current.json
python3 -B -m unittest -v test_two_path_council.py test_historical_twelve.py test_trajectory_lab.py test_project_frozen_ontology.py
```

**Both authorised online Macs:** 30 / 30 tests PASS using exact research-branch sources. Identical reproducibility receipt SHA-256:

`afba2dd4c6c2b4025cabef0ff76e0dc715639d1d0ab6d9b04775e7042ca1f304`

Read-only JSON-LD graph has **692 entities**:
- one entity identifying the exact public source-bytes digest and pinned source revision;
- **14** unique non-null bank digest entities (identified by source data, not claimed as all possible banks);
- **677** digest-identified cell entities.

**Newly quantified limitation:** **43 / 677 cells have no usable bank SHA-256** in the public fact-table cell index. The projection links these cells back to their observable source-file entity, **not to an invented bank identifier**. This is not a claim that all 43 are corrupt; missing identity can arise from incomplete source records. The existing fact-table audit's 1,290 unattributed measurement rows and 2,428 ungraded rows are retained.

The source notes `n_graded=18,089` across all 677 indexed cells (20,517 - 2,428). A cell with `n_graded=0` has no `accuracy` value; it is **not** recorded as 0%. No `MEASURED` or `VALID` status is inferred solely from a count.

Mappings reuse existing GSPC `Bank` and `Cell` concepts, `gspc:n`, `gspc:accuracy`, W3C PROV-O `prov:Entity` and `prov:wasDerivedFrom`, and Dublin Core identifiers. JSON-LD output remains a **derived research view**, not a replacement for the authoritative `csoai/gspc-ontology` namespace, original signed card archive, original bank hashes or original GSPC admission rules.

Suggested next scoped improvement: investigate the 43 missing bank-digest cells against original historical `public/interop/mill-evidence` bytes and source chronology, publishing any corrections additively through existing `Correction`/`Supersession` controls rather than backfilling facts without evidence. Also measure how the 1,290 model-unknown rows distribute across those cells before any new comparison claim.
