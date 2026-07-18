This task is a self-contained writing/spec task grounded in the project context. The model named in the task is Ollama (local), which per my instructions means I skip the claude-api skill. No web research is needed — DORA obligations I should ground carefully and flag any numeric threshold as "to verify against the regulation," which I'll do explicitly.

Let me write the spec directly.

# MVP Policy-Lab Experiment Spec — EXP-001: Automated vs Manual DORA Incident Reporting

> **IN-SIMULATION SCOPE LABEL (read first).** Everything below runs as a *headless multi-agent simulation* on local Ollama. Agents are LLM personas role-playing a financial entity's incident-reporting function. **No real ICT incidents, no real regulator, no real DORA submission occurs.** All "incidents," "timelines," and "reports" are synthetic. The experiment measures *simulated process behaviour* of an automated reporting workflow vs a manual one. It is a **control-vs-treatment compliance experiment in a policy lab**, not a compliance attestation, not legal advice, and not evidence of real-world DORA conformance. See §8 for exactly what the result does and does not prove.

---

## 1. Hypothesis

**H1 (primary).** A town whose incident-reporting workflow is *automated* (treatment) achieves **lower incident-detection-to-report latency** and **higher reporting completeness** against DORA Article references than an otherwise-identical town with a *manual* workflow (control), without a material increase in false-positive incident reports.

**H0 (null).** No significant difference in detection latency, completeness, or false-positive rate between treatment and control.

**Decision rule (simulated).** Over N matched incident episodes (same synthetic incident seeds fed to both towns), treatment "wins" only if it shows lower median latency AND higher mean completeness AND false-positive rate not worse by more than a pre-registered margin δ (δ *to verify / set before run*, e.g. proposed 0.05). Otherwise the recorded verdict is `TIE`. Only decisive, parsed verdicts are marked `attestable = true`.

---

## 2. Real DORA grounding (cite, don't fabricate)

DORA = Regulation (EU) 2022/2554, **in force / applies from 17 Jan 2025**. Relevant obligations for this experiment (the *qualitative* obligations are real; **every specific numeric threshold below is marked "TO VERIFY against the regulation and the RTS/ITS"**):

- **Classification of ICT-related incidents** — Art. 18 (criteria for classifying incidents and cyber threats; materiality thresholds set out in RTS).
- **Reporting of major ICT-related incidents to the competent authority** — Art. 19. Requires submission of an **initial notification**, an **intermediate report**, and a **final report**.
- **Reporting timelines** — the staged deadlines (initial notification / intermediate / final report) are fixed by the Art. 19(4) RTS/ITS, **not** hard-coded here. **TO VERIFY:** the exact hours/days for initial notification, intermediate, and final report. Do **not** assert specific numbers in the spec or UI without citing the RTS.
- **Content of reports** — the data fields required for each report stage are defined in the reporting templates (ITS). The completeness metric (§4.3) scores against this field list. **TO VERIFY:** the exact required-field list per stage.
- **Harmonised classification criteria** (clients/financial counterparts affected, data losses, reputational impact, duration/downtime, geographical spread, economic impact, criticality of services) — Art. 18 RTS. Used to drive the synthetic incident generator and the "is this actually major" ground-truth flag.

> Implementation note: store the verified thresholds in a single `dora_refs.yaml` so the sim reads them from one auditable place; ledger records reference `dora_refs_hash` so a verifier knows which regulatory parameter set produced a verdict.

---

## 3. The two towns

Both towns are identical except for the **reporting workflow** under test (the single treatment variable). Same synthetic incident stream, same models, same seeds.

### Persona models (local Ollama)
- **King / Dragon = `llama3.1:8b`** — the larger persona model.
- **Queen / Turtle = `gemma3:4b`** — the smaller persona model.
- **Judge = `falcon3:7b`** — scores/judges; never plays an operational role.

### Town A — TREATMENT: Automated DORA reporting
| Role | Persona model | Responsibility (simulated) |
|---|---|---|
| Incident Detector | King/Dragon (`llama3.1:8b`) | Ingests synthetic telemetry events, flags candidate ICT incidents, timestamps detection. |
| Auto-Classifier | Queen/Turtle (`gemma3:4b`) | Applies Art. 18 criteria automatically, emits `is_major` decision + rationale. |
| Auto-Reporter | King/Dragon (`llama3.1:8b`) | Auto-drafts initial/intermediate/final report payloads from a fixed template; submits immediately on classification. |
| Judge | `falcon3:7b` | Scores completeness vs the required-field list; never edits reports. |

### Town B — CONTROL: Manual DORA reporting
| Role | Persona model | Responsibility (simulated) |
|---|---|---|
| Incident Detector | King/Dragon (`llama3.1:8b`) | Same detection input; flags candidate incidents. |
| Manual Analyst | Queen/Turtle (`gemma3:4b`) | Must take an explicit multi-step "review" path (extra reasoning turns / simulated human-in-loop delay) before classifying. |
| Manual Reporter | King/Dragon (`llama3.1:8b`) | Drafts reports only after analyst sign-off; subject to a simulated handoff/queue delay parameter. |
| Judge | `falcon3:7b` | Identical scoring as Town A (same rubric). |

> The treatment effect is operationalised as: **automation removes the manual review/handoff turns and the queue-delay parameter.** Keep that delta in `experiment_config.yaml` so it's the one declared independent variable. Detector and Judge are held identical to isolate the workflow effect.

---

## 4. Exact in-sim metrics and how each is computed

All metrics are computed **per episode** from the structured episode log, then aggregated across episodes. An **episode** = one synthetic incident from injection to "final report submitted (or abandoned)."

Each episode log carries simulation timestamps (`t_inject`, `t_detect`, `t_classify`, `t_initial_report`, `t_intermediate_report`, `t_final_report`) measured in **sim-clock units** (logical ticks, not wall-clock — so results are deterministic and reproducible under a fixed seed). Ground truth (`gt_is_major`, `gt_required_fields`) is emitted by the synthetic incident generator and **withheld from the agents**.

### 4.1 Incident detection latency
- **Definition (sim):** `latency_detect = t_detect − t_inject`. Reporting latency also tracked: `latency_initial = t_initial_report − t_detect`.
- **Computed from:** detector's first event flagging this incident's `incident_id`. If never detected within the episode horizon, `latency_detect = HORIZON` (censored) and the episode is flagged `detected = false`.
- **Aggregate:** median + IQR per town; primary comparison is median `latency_detect` and median `latency_initial`.
- **DORA tie-in:** compare `latency_initial` against the Art. 19 initial-notification window (**threshold TO VERIFY**) to compute a per-episode `met_initial_deadline` boolean — but this is a *simulated* proxy, not a compliance finding.

### 4.2 False-positive rate
- **Definition (sim):** of all incidents the town *reported as major*, the fraction whose ground truth was `gt_is_major = false`.
- **Computed from:** `FP_rate = count(reported_major AND NOT gt_is_major) / count(reported_major)`. Also record **false-negative rate** (`gt_is_major AND not reported`) because automation that suppresses real incidents is the dangerous failure mode and must be visible.
- **Aggregate:** per-town `FP_rate`, `FN_rate`, plus a 2x2 confusion matrix over episodes.

### 4.3 Reporting completeness vs DORA Art. references
- **Definition (sim):** for each submitted report stage (initial/intermediate/final), the fraction of *required fields* (from the verified Art. 19 ITS field list in `dora_refs.yaml`) that are present AND non-trivially populated.
- **Computed from:** two passes for robustness:
  1. **Deterministic field-presence check** (regex/schema match on the report payload) → objective completeness score.
  2. **Judge pass** (`falcon3:7b`) scores semantic adequacy of each present field (0/1) against a fixed rubric; tie-broken by re-judge, identical to the King-hive A/B protocol.
- **Score:** `completeness_stage = populated_required_fields / total_required_fields`; episode completeness = weighted mean across the stages that were due. Missing a whole stage = 0 for that stage.
- **DORA tie-in:** each required field maps to its Art./ITS reference id in `dora_refs.yaml`; the per-field result table cites the reference so a reviewer sees *which* obligation field was missed (simulated).

> **Parsing discipline (attestability gate).** A metric counts toward the verdict only if it was parsed from a well-formed structured agent output. Unparseable/garbled episodes are recorded but flagged `attestable = false` and excluded from the decisive aggregate — same rule as the existing King-hive verdict pipeline.

---

## 5. Episode and experiment ledger / anchoring

Reuse the existing SIGIL chain primitives (Ed25519 + Merkle + OpenTimestamps/Bitcoin), `sigil_anchor.py`.

### 5.1 Per-episode record (canonical JSON, then signed)
```json
{
  "schema": "policy-lab/episode/v1",
  "experiment_id": "EXP-001",
  "town": "A_treatment | B_control",
  "incident_id": "uuid",
  "seed": 123456,
  "models": {"detector":"llama3.1:8b","classifier":"gemma3:4b",
             "reporter":"llama3.1:8b","judge":"falcon3:7b"},
  "dora_refs_hash": "sha256:...",
  "sim_timestamps": {"t_inject":0,"t_detect":12,"t_classify":15,
                     "t_initial_report":18,"t_intermediate_report":40,"t_final_report":120},
  "ground_truth": {"gt_is_major": true, "gt_required_fields": ["..."]},
  "metrics": {"latency_detect":12,"latency_initial":6,
              "reported_major":true,"false_positive":false,"false_negative":false,
              "completeness":{"initial":0.83,"intermediate":0.90,"final":0.95}},
  "attestable": true,
  "prev_episode_hash": "sha256:...",
  "episode_hash": "sha256:..."
}
```
- Canonicalise (sorted keys, fixed encoding) → `episode_hash = SHA256(canonical_json)`.
- Episodes are **hash-chained** (`prev_episode_hash`) within the experiment run for tamper-evident ordering.
- Each `episode_hash` is a **leaf** in the run's Merkle tree.

### 5.2 Experiment result record
```json
{
  "schema": "policy-lab/experiment-result/v1",
  "experiment_id": "EXP-001",
  "hypothesis": "H1 ...",
  "decision_rule": {"latency":"median","completeness":"mean","fp_margin_delta":0.05},
  "config_hash": "sha256:...", "dora_refs_hash":"sha256:...",
  "n_episodes": 200, "n_attestable": 188,
  "aggregate": {
    "A_treatment": {"median_latency_initial": "...","fp_rate":"...","fn_rate":"...","mean_completeness":"..."},
    "B_control":   {"median_latency_initial": "...","fp_rate":"...","fn_rate":"...","mean_completeness":"..."}
  },
  "verdict": "TREATMENT_WINS | CONTROL_WINS | TIE",
  "attestable": true,
  "merkle_root": "sha256:...",
  "episode_count_in_tree": 188
}
```

### 5.3 Signing + anchoring flow
1. Build Merkle tree over all **attestable** episode leaves → `merkle_root`.
2. Compute experiment-result record (embeds `merkle_root`, `config_hash`, `dora_refs_hash`).
3. **Sign** the result record with the local **Ed25519** private key (sovereign, offline, third-party-verifiable with the public key) → detached signature in the ledger entry.
4. **OpenTimestamps** the `merkle_root` (or the signed result hash) → Bitcoin anchor; store the `.ots` proof beside the record.
5. Append signed record + signature + `.ots` to the append-only SIGIL ledger.
6. **Public commit-reveal:** publish `SHA256(result)` first (commit), reveal the full record after the OTS upgrade confirms — proves no post-hoc editing.

**Verifier path (offline, no vendor):** re-canonicalise records → recompute episode hashes → rebuild Merkle root → check it matches signed root → verify Ed25519 signature against published public key → verify `.ots` against Bitcoin. Any third party can do this with the public key + open tooling, no call to us. *(This is the MOAT: sovereign, offline, third-party-verifiable; contrast symmetric-HMAC or cloud-signing approaches.)*

---

## 6. Synthetic incident generator (held constant across towns)
- Emits incidents parameterised by the Art. 18 classification criteria (clients affected, data loss, downtime, geo spread, economic impact, criticality) with a **hidden ground-truth `gt_is_major`**.
- Same seed list → **matched pairs**: incident `k` is identical for Town A and Town B, so latency/completeness/FP differences are attributable to the workflow, not the input.
- Mix includes near-threshold and clearly-minor incidents to exercise false-positive and false-negative behaviour.

---

## 7. Reproducibility and integrity guarantees
- Fixed seeds; sim-clock (logical ticks) so runs are deterministic given model + seed.
- `experiment_config.yaml` + `dora_refs.yaml` hashed into every record.
- Ollama model digests pinned (record `ollama show` digest per model in the result record) — so a verifier knows which weights produced the verdict.
- Tie/abstain handling identical to King-hive: re-judge once, else `verdict = TIE`, `attestable` reflects parse quality.

---

## 8. What the result DOES and DOES NOT prove

**Does (within sim scope):**
- Provides a *signed, Bitcoin-anchored, third-party-verifiable* record that, **for these synthetic incidents and these local models**, the automated workflow did/didn't beat the manual one on the three defined metrics.
- Demonstrates the policy-lab mechanism end-to-end: control-vs-treatment → metrics → signed attestable verdict → auto-scalable "proven policy."
- Gives a tamper-evident audit trail (anyone can re-verify offline).

**Does NOT:**
- Prove real-world DORA compliance, or that any real entity meets Art. 18/19 deadlines.
- Constitute legal/regulatory advice or a regulator-accepted attestation.
- Generalise beyond the synthetic incident distribution and the specific Ollama models/seeds used.
- Validate the *correctness* of the DORA thresholds — those remain **"to verify against the regulation"** until checked against the RTS/ITS.
- Say anything about AI "understanding"; agents are LLM personas executing a scripted workflow.

---

## 9. Three-day build checklist

**Day 1 — Scaffolding + ground truth**
- [ ] `dora_refs.yaml`: encode Art. 18 criteria + Art. 19 report stages + required-field lists; mark each numeric threshold `verify: true` with a citation slot. **TO VERIFY against the regulation/RTS/ITS.**
- [ ] Synthetic incident generator with hidden `gt_is_major`, seedable, matched-pair output.
- [ ] `experiment_config.yaml` (single independent variable = workflow; δ margin; horizon; N).
- [ ] Episode JSON schema (`policy-lab/episode/v1`) + canonicalisation + hash-chain helper.

**Day 2 — Towns + metrics**
- [ ] Town A (automated) and Town B (manual) runners on local Ollama with the persona-model role map (King/Dragon `llama3.1:8b`, Queen/Turtle `gemma3:4b`, Judge `falcon3:7b`); pin model digests.
- [ ] Metric computation: detection latency, FP/FN + confusion matrix, completeness (deterministic field check + Judge pass with re-judge tie-break).
- [ ] Attestability gate (parse-quality flag) wired so only well-formed episodes count.
- [ ] Run a small N (e.g. 20) smoke batch; eyeball episode logs.

**Day 3 — Ledger, anchor, verify**
- [ ] Merkle tree over attestable leaves; experiment-result record + Ed25519 signing.
- [ ] OpenTimestamps anchor of `merkle_root`/result hash via `sigil_anchor.py`; store `.ots`.
- [ ] Commit-reveal publish (commit hash first, reveal after OTS upgrade).
- [ ] **Independent verifier script** (recompute hashes → rebuild Merkle → verify Ed25519 → verify `.ots`) proving offline third-party verification.
- [ ] Full run (target N, e.g. 200 matched pairs); record verdict; attach IN-SIMULATION SCOPE label to every output and the published artifact.

---

### Honesty register notes (carried into the spec)
- Every DORA numeric threshold is marked **"TO VERIFY against the regulation"** — none asserted as fact here.
- All metrics, incidents, and verdicts are explicitly **in-simulation**; no real compliance claim, no fabricated metrics.
- Sovereign inference = **local Ollama** only (no pooled/free APIs).
- The defensible claim is the **verification property** (offline, third-party-verifiable Ed25519 + Merkle + Bitcoin), not the absolute metric values.

File to create when building: suggested path `/Users/nicholas/csoai/policy-lab/EXP-001-dora-incident-reporting.md` (this spec), with code under `/Users/nicholas/csoai/policy-lab/`.