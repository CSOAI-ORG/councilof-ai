# MEOK Labs — Deliverables Index

Single navigation point for everything produced in this consolidation + POC session (2026-07-07).
North star: **emergence at the water–silica interface** (iontronics / fluidic memristor), tested
honestly. All version IDs are the latest as of this index.

## 1. Master documents (start here)

| Doc | What it is |
|---|---|
| [MEOK_LABS_MASTER_CONSOLIDATION.md]({{artifact:0e9621cc-4a8e-4bfd-bc2c-8ffe2b02b5d9}}) | **The single source of truth** — 4 hives, north star, LIVE/SIM/STALE ledger, naming+vision collisions, 3-POC reconciliation, memory digest (§8), businesses (§9), POC build arc (§10) |
| [MEOK_POC_Capillary_Emergence_Cell.md]({{artifact:5950c48d-8a3c-4715-b88b-639f8655c1f8}}) | The capillary-emergence POC spec (Stage 0/1/2, iontronic reframe) |
| [MEOK_POC2_Iontronic_Build_Guide.md]({{artifact:7b7d5f66-236a-4180-ab46-af40aa5717d3}}) | Iontronic build guide — τ physics, potentiostat options, 3 experiments, ESN result |
| [MEOK_Terranova_Feasibility_Bridge.md]({{artifact:a3f41052-d8b6-4b9c-8bfa-5b84711a04d3}}) | Bleeding-edge feasibility ledger (🟢/🟡/🔴), W19-vs-Terranova resolution |

## 2. Build-day pack (the turnkey bench path)

| File | Use |
|---|---|
| [MEOK_BUILD_DAY_CHECKLIST.md]({{artifact:c2cdc67c-0145-4b22-872a-5679dda41424}}) | **Do-this-in-order** checklist: Stage 0 → 1 → 2, with gates |
| [MEOK_Stage1_BOM.csv]({{artifact:6d7d27ca-3ef6-4983-9d3f-ea68506b9526}}) | Itemized order sheet (£65–223 essentials; HAVE/BUY/OPTIONAL) |
| [MEOK_Print_Manifest.md]({{artifact:d35ab966-670b-425f-9708-8216f4103ca9}}) | QIDI X-Max 4 slicer settings per part |
| [MEOK_roadmap.png]({{artifact:bee86c41-6ec2-49ec-a910-15132178ec89}}) | Sim→bench→science roadmap figure |

## 3. Printable STLs (all verified watertight)

| Part | Material | File |
|---|---|---|
| Stage-0 wick coupon | PA12-CF | [MEOK_capillary_coupon_stage0.stl]({{artifact:98e92186-e119-4d2f-9472-1b323b312849}}) |
| Stage-1 cell body | PA12-CF | [MEOK_stage1_cell_body.stl]({{artifact:45d737d8-7bc7-41fd-bd81-33677ead2714}}) |
| Stage-1 lid | PA12-CF | [MEOK_stage1_cell_lid.stl]({{artifact:6f8759d4-07dd-46c8-a0e9-ade34e3fc1cf}}) |
| Stage-1 gasket | TPU | [MEOK_stage1_gasket_TPU.stl]({{artifact:0d256179-5d92-443b-a7bc-867dc10d642b}}) |

## 4. Runnable code

| Script | Does |
|---|---|
| [care_pattern_stimulus.py]({{artifact:e3599474-e0bd-4195-ab18-c0b10f9fc116}}) | Emits the HARVI Phase-3 care sequence + energy-matched random control |
| [iontronic_reservoir_demo.py]({{artifact:9d5c8071-2bd7-4c15-8d87-9da8d12fb439}}) | τ=L²/12D channel bank + linear readout (care vs random) |
| [esn_readout.py]({{artifact:17066590-f5b5-441c-aa0b-2ea003590f44}}) | Echo-state readout, trial-level split, 3 nulls (75/90/79%) |
| [sim_fly1_mujoco.py]({{artifact:dfdcd15a-02b0-447a-8e5d-8bb9bb1ebcdf}}) | Reservoir drives a 3-joint MuJoCo limb (closed loop) |
| [sim_fly2_reach.py]({{artifact:d5f843ad-9b56-48b3-9bdd-f3a9b8bdb633}}) | Care-tuned vs random-tuned reservoir reach (14/15 seeds, p=0.001) |
| [sim_fly3_hexapod.py]({{artifact:4adefc70-5501-4b89-9e7a-f7cfe130451a}}) | Scales the controller to a 12-DOF hexapod |
| [sim_fly4_walk.py]({{artifact:e1362e0d-1e80-4a8d-8812-0e660a116eda}}) | Evolved CPG gait — the body walks (crouch, 1.38 m) |
| [sim_fly5_brainwalks.py]({{artifact:a28081eb-b87d-46fd-a69b-822811da9156}}) | Reservoir generates the gait from a phase clock (1.42 m) |
| [sovtown_sim.py]({{artifact:91d14a2e-61cc-456c-b135-c5e107c761c3}}) | Governed vs ungoverned agent town (37→5 crimes, 5→0 deaths) |

## 5. Figures

| Figure | Shows |
|---|---|
| [poc_capillary_sizing.png]({{artifact:8bbda227-8039-4b41-a749-5f74422bc5e7}}) | Per-material capillary rise at r=0.5 mm bore |
| [poc_memory_timescale.png]({{artifact:d82473da-b50f-4afb-951c-98608b218ee2}}) | τ=L²/12D vs channel length |
| [poc_esn_readout.png]({{artifact:7b92a080-4224-4823-831b-6808e58a322f}}) | ESN care-vs-null classification (10 seeds) |
| [MEOK_stage1_wiring_schematic.png]({{artifact:e31bef30-0d21-4c41-95c9-0836ae9d8e9d}}) | Cell↔potentiostat↔Arduino↔M4↔SOV3 wiring |
| [MEOK_stage1_printability.png]({{artifact:97100881-bf2d-405d-a20f-c8bdc7101af2}}) | Body overhang/printability heatmap |
| [MEOK_sim_fly3_hexapod.png]({{artifact:11da6c63-f94e-42eb-a9d0-2501e41b86cf}}) | 12-DOF joint commands from one reservoir |
| [MEOK_sim_fly4_walk.png]({{artifact:d8d21e34-3b8c-4db9-9f92-58f4e6c1df61}}) | Trained gait walk trajectory |
| [MEOK_sim_fly5_brainwalks.png]({{artifact:2809ae1a-da53-4320-9b08-fd9b63a11a4b}}) | Reservoir-generated gait, body walks |
| [MEOK_sovtown_sim.png]({{artifact:d25b229e-a1c8-48fe-bb8a-b897e846b660}}) | Governed vs ungoverned town outcomes |
| [MEOK_fly_water_synthesis.png]({{artifact:ca8ecbee-c121-4dc0-8975-6850542ad74e}}) | Fly-sim + water-science honest synthesis |

## 6. Pre-registrations + experiments

| Doc | For |
|---|---|
| [MEOK_EXP_ICE1_preregistration.md]({{artifact:2b1997d1-1ec9-4bcb-82cb-362b50889cc6}}) | Double-blind freeze-and-image test (separates real effect from Emoto claim) |
| [MEOK_SOVTOWN_Embodiment_Experiment.md]({{artifact:04393e3b-509f-4d95-890a-da2ca038b039}}) | Governed-town embodiment experiment (emergence.ai benchmark) |

## 7. DEFONEOS Assurance-Radar (design + software + IP)

| Deliverable | What it is |
|---|---|
| [MEOK_radar_sensor_matrix.csv]({{artifact:2603bb6c-e909-4fb3-ac27-1dc52e136400}}) | Feasibility scores across the sensor ladder (top 2: LD2450, LD2410C) |
| [MEOK_radar_feasibility.png]({{artifact:eb581998-cd70-4f77-915d-44f329259d5c}}) | Coverage + feasibility + value-frontier figure |
| [MEOK_radar_value_tiers.csv]({{artifact:d9a59b10-930a-4f59-ac3f-9c2943d3a966}}) | LOW/MED/HIGH tiers (£99/£299/£999, 82–94% margin) |
| [MEOK_radar_form_factors.csv]({{artifact:36972a45-20e8-404f-9b1f-ec51f40828be}}) | Two form factors (as-built STL dims) |
| radar case body / radome / tamper cap STLs | Single-unit enclosure (PA12-CF body, PLA radome, TPU cap) |
| humanoid module + ground/vehicle box STLs | Two form-factor enclosures, watertight, print-ready |
| [MEOK_AssuranceRadar_Firmware_Spec.md]({{artifact:4a106cf8-2882-4cc3-b62f-1a013695e295}}) | Firmware specification |
| [ld2450_signed_node.ino]({{artifact:9559f595-2995-4b82-9b1a-5e613d713a78}}) | **Working ESP32 firmware** — LD2450 parser + Ed25519 signing loop |
| [verify_test.py]({{artifact:1fdb2d4d-c774-4c80-9e81-4371b41be815}}) | Host verifier stub — self-test PASSes (valid verifies, tamper rejected) |
| [MEOK_AssuranceRadar_LD2450_SystemCard.yaml]({{artifact:ae705a9b-f485-4c53-8213-6d411fba0293}}) | AI System Card for the node |
| [MEOK_AssuranceRadar_OSCAL.json]({{artifact:ec2839f3-4632-4b64-a508-49b7dcd95d69}}) | OSCAL 1.1.2 component-definition, 9 controls |
| [MEOK_Radar_Print_Manifest.md]({{artifact:9091dc57-51b2-4025-bd04-3c9b5d54625c}}) | QIDI Max4 settings per part (RF rule: radomes PLA only) |
| [MEOK_AssuranceRadar_OSCAL.json]({{artifact:f1e4e3e4-4673-4b12-a695-ed8b21f1290f}}) v2 | **Schema-valid** OSCAL 1.1.2 (NIST-validated, 0 errors) |
| [MEOK_AssuranceRadar_LD2451_Vehicle_SystemCard.yaml]({{artifact:0cf085a1-e0dd-4dca-8070-c119417c3a59}}) | Vehicle/ground-tier System Card (LD2451) |
| [MEOK_AssuranceRadar_LD2451_Vehicle_OSCAL.json]({{artifact:04d6615a-cfea-4830-b7b0-d070c3fdf586}}) | Vehicle-tier OSCAL (schema-valid) |
| [MEOK_AssuranceRadar_Deck.pptx]({{artifact:04e09dd8-8edc-4723-af7e-f2f484f87bc7}}) / [.pdf]({{artifact:f27db030-b8d8-47b0-a7e4-748489fc428e}}) | Tech-Innovation pitch deck (11 slides, editable + shareable) |
| [MEOK_radar_datasheet.pdf]({{artifact:d2f1536b-56e5-4691-bb6b-2755690a84f3}}) / [.png]({{artifact:6bf97309-212f-4c6a-89ca-ceca51fdf51b}}) | One-page product sell-sheet (A4) |
| [MEOK_Radar_Print_Manifest.md]({{artifact:a65023bb-cb10-4441-a468-00894b500ef4}}) v2 | QIDI Max4 settings incl. v2 rib-orientation guidance |
| v2 enclosure STLs (ground box / humanoid / radomes) | R&D-refined: chamfered, ribbed, gasketed — print-ready |
| [MEOK_OpenPatent_Signed_Sensing_Node.md]({{artifact:54caf948-0354-43dc-9011-e6048d019732}}) | Defensive publication (novelty = assurance layer) |
| [MEOK_TODAY_USER_ACTIONS.md]({{artifact:b460b233-97ba-4510-b638-de10e65dff9f}}) | Dated checklist of what only Nick can do |

### Radar product visuals
| Visual | Shows |
|---|---|
| [MEOK_radar_hero.png]({{artifact:f8ef2c06-324b-42d2-8e53-8991aa61c9ee}}) | 3D hero render of the v2 **Ground/Vehicle** enclosure (humanoid module also ships) |
| [MEOK_radar_exploded.png]({{artifact:e8d582e1-5190-48a7-bcc0-d5c407394dff}}) | Exploded product breakdown (all parts labelled) |
| [MEOK_radar_blueprint.png]({{artifact:275c9300-ea68-45d6-ab82-7753e2cfe1e6}}) | Dimensioned orthographic blueprint (142×70×36 mm) |
| [MEOK_radar_howitworks.png]({{artifact:ca81878a-3aae-426e-a4ab-d481762dea01}}) | Signal path: reflection → sign → verify → proof |
| [MEOK_radar_structural_RnD.png]({{artifact:9f90b9d5-2911-4437-98b2-05563212c63e}}) | Structural R&D (stiffness/vibration, ears SF≈21) |

## Honesty ledger (what's proven vs claimed)

- ✅ **Proven in sim:** geometry-tuned τ reservoir beats random (p=0.001); controller scales to 12 DOF;
  trained gait walks; reservoir generates a gait from a clock; governance prevents town collapse.
- 🔬 **Testable on bench next:** pinched hysteresis (memristor signature), τ=L²/12D on real channels,
  care-reservoir separability — all pre-registered.
- ❌ **NOT claimed:** consciousness; femtosecond 5D storage; any AURUM "N/N tests" as physical builds;
  "upright" walking (it crouch-walks); water "sees/remembers" (Emoto — rejected).


## Emergence bench + BFT (2026-07-10)

| Deliverable | Artifact | What |
|---|---|---|
| AI Consciousness Charter | MEOK_AI_Consciousness_Charter.md | the "bible for AI" — 7 articles, access-vs-phenomenal discipline |
| Sovereign Emergence Charter | MEOK_Sovereign_Emergence_Charter.md | Sovereign trained on the discipline, not the overclaim |
| Access Before Phenomenal | MEOK_Access_Before_Phenomenal.md | March-2026 intuition as dated prior art vs Anthropic J-space |
| CONC archive | CONC_catalogue.csv / conc_ocr.json | 117 dated screenshots (8–15 Mar 2026), OCR'd |
| EXP-PHI | MEOK_EXP_PHI.md | integrated info: shared-OOWM 0.448 vs siloed 0 |
| EXP-PCI | MEOK_EXP_PCI.md | perturbational complexity: inverted-U, peak g≈0.6 |
| EXP-BIND | MEOK_EXP_BIND.md | binding: synchrony 100% vs bag 42% (SIGIL = binding tag) |
| EXP-SELF | MEOK_EXP_SELF.md | self-model: own-action R²=0.95, forward-pred 0.000 |
| EXP-JSPACE | MEOK_EXP_JSPACE.md | **weights-access probe, RUN on real gpt2-124M**: logit lens → predictions resolve late (L9–L11); linear probe → sentiment decodable early (L0=0.93, lexical). Kills the "waits on Oracle" blocker. |
| OWEM L4 Bench | MEOK_OWEM_L4_Bench.md | 4/5 instruments running, filed into OWEM |
| BFT new applications | MEOK_BFT_New_Applications.md | radar fusion 6.5×, ensemble decode, robust metrics 12× |
| BFT universal-fusion spec | MEOK_BFT_Universal_Fusion_Spec.md | install points across the estate |

**Honesty note (this batch):** all bench metrics are access-level *capacity* measures — no claim of
felt/phenomenal consciousness. All sims are idealized in-silico (principle + design direction, not
production benchmarks). J-space validated the discipline; it did not prove sentience.
