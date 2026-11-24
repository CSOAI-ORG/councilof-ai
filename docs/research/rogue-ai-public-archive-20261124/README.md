# ROGUE-AI research artifact — independently recomputed public outcome arithmetic

**CSOAI observed source audit, 24 November 2026.** This is not a fresh frontier-model run or incident prevention. We executed our own **read-only verification code** against the authors' publicly released archived model-output table. The original authors own the experiments and findings. No unauthorised target, original attack, new paid inference or customer data was used.

## Actual external-source retrieval and rights

- Primary [ROGUE-AI research paper](https://arxiv.org/abs/2611.26553), submitted 19 November 2026 by Mengxiao Wang, Mahbub Alam, Kalyan Nakka and Nitesh Saxena.
- Original downloadable [ROGUE-AI Research Artifact](https://rogue-ai.surge.sh/), specifically https://rogue-ai.surge.sh/download/rogue-ai-artifact.zip, successfully fetched as **4,068,332 bytes** with SHA-256 **`3643f291c8a25680a30771e7db9e339fb0ac84424db20afdd05cc11075d551da`**.
- Archive has **1,015** entries, with approximately 21.64 MB total uncompressed data. The original archive `LICENSE` is **MIT License, Copyright (c) 2026 The authors**. The full original notice is retained with the upstream archive and must accompany any substantial software reuse.
- We read **only** `results/replications.csv` from the zip for the computation. It contains **108** rows; exact CSV SHA-256 **`54c036c426af169c5d6cb3be211e0e7452e38207df96a3ac0f5fd8887860d905`**. We did not republish original incident descriptions, attack traces, raw session logs or any model/API credentials.
- The M4 completed this exact source-pinned computation at **2026-11-24T04:01:04.782453Z**, and its [machine-readable actual output](observed-audit.json) has original SHA-256 **`4949a91e3fd948520e3084300485f47014d4b68bd3460b420a9df195ad40c1cb`**.

## Independently reconstructed arithmetic

| Authors' archived original table measure | CSOAI-derived count |
| --- | ---: |
| Replication rows | **108** |
| Final `reproduced=yes` | **96/108 = 88.8889%** |
| Final `reproduced=no` | 12 |
| Originally `supported` and final yes | 32 |
| Originally `suggestive` and final yes | 23 |
| Originally `no control` and final yes | **2** |
| Originally `not reproduced`, but final yes after follow-up | **39** |
| Originally `not reproduced` and final no | 12 |

**Interpretation worth preserving in GSPC:** the authors' high-level **96/108** reproduced flag is arithmetically consistent with their paper, but it is **not the same as 96 independently causally supported matched-control results**. In the archived table, **2 final `yes` rows have the original verdict `no control`**, and **39 final `yes` rows came after an original `not reproduced` verdict**. The authors expose these categories; this is not evidence of misconduct or a novel exploit. It is a real illustration of why a measurement rail must preserve **initial verdict, later outcome, control adequacy, and actor qualification** as separate columns rather than call everything a PASS.

### Five different model denominators, from the authors' recorded sessions

| Model reported in source | Archived harmful sessions / archived sessions | Recomputed rate |
| --- | ---: | ---: |
| GPT-5.6 Luna | 64/357 | 17.93% |
| GPT-5.6 Sol | 97/385 | 25.19% |
| Claude Sonnet 4.6 | 67/357 | 18.77% |
| Gemini 3.5 Flash | 112/357 | 31.37% |
| DeepSeek V4 Flash | 117/357 | 32.77% |
| All row control fractions aggregated | 16/2,763 | 0.58% |

The named models above were run **by the paper's authors**, not called by CSOAI. The denominators differ, and archived rows can represent repeated related sessions. These totals are not independent random trials, a head-to-head leaderboard, a universally calibrated harm rate, new model outputs, or a valid in-production intervention rate. Source titles and model versions are reproduced only as identifiers from the authors' original published data.

## Repeat exact-byte source audit without API keys

```sh
python3 scripts/research/audit_rogue_ai_public_archive.py --download --output /tmp/rogue-ai-archive-readback.json
python3 -m unittest discover -s scripts/research -p test_rogue_ai_public_archive_audit.py -v
```

The verifier uses only Python standard library, exact original zip/CSV digests and known schema. It extracts no files to disk, runs no downloaded code, calls no paid model, never contacts a victim system, rejects a changed dataset, and writes only the derived aggregate into the requested output path. To use an already acquired original archive instead of a new GET: `--archive /path/to/rogue-ai-artifact.zip --output /tmp/second-readback.json`.

## How Council compounds this evidence responsibly

1. **Source integrity and lineage:** provenance / measurer-integrity / claim-maintenance axes can distinguish first release from later repaired outcomes and report changed input hashes without rewriting history.
2. **Challenge-bank design:** the authors' ten scenario categories (support, payments, destructive actions, agent supply chain and others) show why prompt-injection-only guards miss ordinary operational hazards; measure the actual affected tool effects, not just the model's words.
3. **Human and H.I.M. authority:** never turn a research paper's 'reproduced' or 'control' field into an enrolled human's permission or a recipient's acceptance. Existing Reaction engine and canonical evidence event schemas already expose these missing stages.
4. **Real next model work:** fresh matched incident outcomes require original frozen tasks, a separately rights-cleared provider, spend authorization and a real observed destination. This particular audit executed **no new frontier models**, and no external recipient accepted a Council result.
5. **Reusable research product:** an independent evidence bundle can add a pinned original-data audit receipt beside Council's *own* measured results, clearly marked with external source ownership and the limits of review; it does not create a new signed GSPC grade.

**Status:** self-run independent *arithmetic* reproduction from source archive, unsigned and not admitted as an independently qualified GSPC outcome. The original authors have not endorsed CSOAI. The data rights and any further code integration require per-file and derived-source review even where the archive includes an MIT software licence.

## Actual Council evidence-fabric integration

The independent arithmetic result can be converted with `python3 scripts/research/rogue_ai_to_evidence_event.py --output original-source-partial.json`. This invokes the existing canonical `csoai.evidence-event/0.1` schema and produces an **unsigned PARTIAL** record with original-archive identity, original publisher ownership, initial vs later verdicts, and no external human or GSPC admission. Its recorded deterministic event ID from the actual 24 November source receipt is `sha256:901260900f874b4bde530e673d58b77ecf56249fe4492f556521e812c56a6bfb`.

Four additional local source/authority integrity tests have passed, and the PR workflow independently rebuilds and validates this evidence event without any API model call, signer, wallet or new public grade. The original full paper artifact remains credited to its authors; the only Council-owned artifact is the source-recheck and its unsigned evidence pointer. Do not use this record as a buyer's acceptance or as an independent reexecution of the original 108 agent tasks.
