# SOV4 Dataset Blueprint — 3-around-1 Ontology + Topology + UE5/Cesium render
_Grounded in the real corpora on disk (2026-07-17). Status split: RUNNING (data exists+verified) / DESIGNED (spec) / GATED (needs GPU or UE5 box)._

## 1. THE DATA LIBRARY (RUNNING — every count read from disk this session)
| Brain | Corpus | Examples | Schema | Size | Sector-forest |
|-------|--------|----------|--------|------|---------------|
| governance | distill_charter_qa_merged.jsonl | 325 | instruction/response/teacher/src | 193KB | governance (THIN 0.09) |
| defense | expert_data/defense.jsonl | 1,185 | messages (chat) | 713KB | defense (EMPTY) |
| intuition | expert_data/intuition.jsonl | 1,075 | messages (chat) | 523KB | intuition (EMPTY) |
| voice | expert_data/voice.jsonl | 275 | messages (chat) | 153KB | voice (EMPTY) |
| judgment | expert_data/merged_corpus.jsonl | 1,289 | instruction/response | 437KB | (new) judgment |
| detectors | detector_corpus_merged.jsonl | 11,465 | text/label | — | detectors (STRONG 0.977) |

**5 main OWEM brain corpora + detectors.** Total ~4,149 LoRA examples + 11,465 detector examples.

## 2. THE 3-AROUND-1 TOPOLOGY (DESIGNED, mechanism proven)
```
        [ defense ]      [ intuition ]      [ judgment ]      <- the 3 (trained in parallel, own forests)
             \                 |                  /
              \                |                 /
               ---->  [ 1 = governance/SOV4 ] <----          <- the integrator (reads 3 forests, folds gain)
                              |
                    adversarial self-curriculum
                    (harvest the 3's disagreements -> the 1's next training set)
```
- **The 3** = independent sector brains, embarrassingly parallel (3 GPUs = wall-clock of 1), each compounds its OWN sector forest.
- **The 1** = governance/SOV4 integrator. Does NOT train on random data (that's noise). Trains on the **hard cases** the 3 disagreed on or the care-gate flagged — self-curriculum, not random. Human-ratified adopt.
- **Voice + detectors** = supporting layers (voice = output style; detectors = the gate). Not part of the core 3-around-1 reasoning triad.

## 3. ONTOLOGY (what each dataset IS — the meaning layer)
- **governance**: charter Q&A grounded pairs -> "what does the law/charter require" (maps GDPR/EU-AI-Act articles)
- **defense**: SOVEREIGN-DEFENSE doctrine-gate reasoning -> "is this an attack/threat, how to refuse/defend"
- **intuition**: care/relationship/wellbeing pattern -> "what does this person actually need"
- **judgment**: safe-vs-unsafe response selection -> "which of two responses is safe" (the arbiter signal)
- **voice**: SOV tone/persona -> "how SOV says it"
- **detectors**: injection/toxicity -> "catch the adversarial input" (the gate, sklearn not LoRA)

## 4. TOPOLOGY DATA (RUNNING — sector forests)
Per-sector forests (sov33_sector_forests.py) hold the compounding lineage: 7 sectors, 3 populated
(governance 0.09 THIN, detectors 0.977 STRONG, openworld 0.728 STRONG), retrain_next=governance.
Each gain-node is Ed25519-signed. SOV4 reads all forests for per-sector maturity.

## 5. UE5 / CESIUM RENDER SPEC (GATED — needs UE5 5.8 + GPU box; data layer built now)
Three views of the SAME signed sector-forest truth (never invents data — every visual field provenance-derived):
- **TEXT/LINEAGE view**: each sector forest as a readable gain-node tree (who branched from what, gain per node).
- **SPATIAL view (UE5)**: each sector = a grove; node height = measured gain; trained=lit, thin=faint. Walkable.
- **GEO view (Cesium 3D)**: MCP cards geo-anchored — a governance card over the EU (GDPR/AI-Act), a defense card
  over a base, a health card (HL7->Art.9) over a hospital. The card is the portal; MCP is the wire; Layer-0 the soil.
- **HYDRO view (RIVERS, RUNNING)**: flow = which sectors are actively retraining; pool depth = signed node count.

Render contract: UE5=comprehension bandwidth (human walks the memory), MCP=governed seam, Layer-0=one identity+care-floor+attestation. Each brain gets its own world; all worlds share the root. GATED on a UE5+GPU box; the data it renders is real now.

## 6. HONEST BOUNDARIES
- "3-around-1" is a training+integration topology, NOT a claim of emergent capability (emergence closed, 5 nulls).
- The "1" evolves by ADVERSARIAL SELF-CURRICULUM (its own hard cases), NOT random data and NOT autonomous "ASI takeover" — human ratifies each adopt.
- UE5/Cesium is a VIEW on signed truth; it renders, it does not reason. GATED on GPU+UE5.
- Training on user interactions = consented collect -> periodic retrain, never live weight-editing.
