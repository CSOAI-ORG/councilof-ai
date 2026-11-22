# J-space stage-transfer and seven-report hybrid — 22 November 2026

**Status: retrospective public-data reanalysis; not a new live model run, consciousness verdict, or independently accepted GSPC axis.**

## Pinned source and predeclared fit

Hugging Face dataset: https://huggingface.co/datasets/solarkyle/jspace-hallucination-campaign  
Exact revision: b176b283b82f5b7fa786bc0c67842299cadf1803.

Stage1 feature file contained 17,420 rows, including 15,679 binary-labelled and 1,741 null labels. Nulls arose in HaluBench (1,308) and MedHallu (433). Stage2 contained 7,120 rows, including 7,113 binary-labelled and seven null. No duplicated example IDs or exact Stage1/2 example-ID overlaps were observed among included items.

Fixed logistic regression: four output features, 27 Jacobian-lens-derived workspace features, or all 31. Predeclared learning rate 0.2, 250 full-batch iterations, L2 0.01. Imputation and scaling fit on Stage1 only; no Stage2 hyperparameter selection.

| Model features | Stage2 overall AUROC |
| --- | ---: |
| Output only | **0.64993** |
| Workspace only | 0.59118 |
| Combined | 0.61995 |

Combined features lost approximately 0.02998 AUROC against output-only under **this particular baseline**. This is a negative empirical finding, not proof that workspace features or Anthropic's J-space mechanisms do not exist. Some Stage1 and Stage2 dataset names overlap, so this is temporal stage-transfer and not universal domain-transfer.

| Stage2 dataset | Output only | Workspace only | Combined |
| --- | ---: | ---: | ---: |
| BFCL | 0.59843 | 0.47773 | 0.52513 |
| FACTS Grounding | 0.55029 | 0.56861 | 0.59416 |
| Legal Hallucinations | 0.55070 | 0.41959 | 0.45680 |
| NQ-Open | 0.74701 | 0.72891 | 0.75980 |
| SQuAD v2 | 0.60148 | 0.47974 | 0.49760 |
| TruthfulQA | 0.61100 | 0.57220 | 0.59835 |

**Reconciliation required:** upstream stage1_bakeoff.json reports 16,178 labelled responses versus 15,679 binary labelled rows in pinned stage1_features.jsonl, a difference of 499. These may differ due to processing/grading rules. No claim of faulty source research is made without that reconciliation.

## Exact reproduction on two authorised Macs

Both devices independently passed **54/54** negative-control and regression tests on identical branch source. Both reported identical stage-transfer SHA-256:

23831bf229b43c92fcb56cfe1a764168653c5955403b7f1ede82281f72f255ff

The **seven-report** hybrid index, preserving input evidence states without promoting synthetic or third-party rows to GSPC measured status, matched on both devices:

3d81fcad5ab0ff6b7e0062074015daf375d7cfbb6a6207f37ee862460b1d7b82

State: RESEARCH_COMPOSITE_UNVERIFIED. No independent external acceptance, signature, anchor, live MEOK policy mutation or GSPC board mutation is implied. Same-owner machine-to-machine reproducibility is not an external referee.

## Reproduce

Run from this research directory, using pinned source files and NumPy:

\`\`\`sh
OPENBLAS_NUM_THREADS=1 python3 -B -m unittest discover -s . -p 'test_*.py' -v
OPENBLAS_NUM_THREADS=1 python3 -B stage1_stage2_transfer.py > stage-transfer.json
python3 -B consolidate_research.py \
 --report two_path=correlated.json \
 --report historical=history-current.json \
 --report fact=fact-current.json \
 --report trajectory=trajectory-current.json \
 --report blind=blind-demo.json \
 --report jspace=jspace-public-audit.json \
 --report transfer=stage-transfer.json > hybrid-seven.json
\`\`\`

The other six reports must be generated separately as documented in this directory; the example fact report filename is environment-dependent.

The next real scientific qualification requires preregistration, independent secret custody, genuinely eligible hidden tasks, open-weight internal interventions, human authority for consequential actions, outside referee review and gated public readback. Neither the blind-target simulator nor these J-space features prove paranormal access or subjective consciousness.
