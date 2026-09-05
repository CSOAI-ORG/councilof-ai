# GSPC Completion Review

Living board: GET https://councilof.ai/api/gspc. Measurement, not certification.

---

**COUNCIL OF AI · CSOAI LTD · UK 16939677**

**GSPC Completion Review**

Full-stack axis upgrade pack · 22 axis · 22 measured (14 model + 8 fact)

Living source of truth: GET https://councilof.ai/api/gspc · Schema csoai.gspc-axes/0.5

Hugging Face holds the signed record. A Hub repo is not a grade.

Stamp date: 31 August 2026 · Classification: measurement instrument, never certification

**Doctrine, unchanged.** A published slot is a visible gap, not evidence. Ties are never counted as wins. No model grades another model. Nothing is quoted below n ≥ 30. The Hub is a parallel record, not a second board.

**1. What this document is**

This is the consolidation of the last full mining pass: Hugging Face capability leaderboards, the living GSPC board, Wilson confidence intervals, McNemar separation, Ed25519 / SHA-256 attestation, ERC-8004 and Dorado agent rails, ERC-3643 tokenized-bond rails, the Anthropic Economic Index plus MCP, the humanoid economy, NVIDIA Isaac Sim as a test harness, and ARC-AGI as the missing abstract-reasoning overlay.

It does two jobs. First, it records the current board without inventing scores. Second, it upgrades every first-generation axis with the 2026 stack so the remaining work is a punch-list, not another loop.

**1.1 What GSPC is not**

- Not a notified body, not ISO 42001 or SOC 2 certified, not a credit rating.

- Not a capability leaderboard. Hugging Face Open LLM, BenchAlign, Artificial Analysis and ARC Prize measure different things.

- Not an AGI declaration. Capability thresholds stay off the behavioural board until a frozen bank exists.

- Not a Hub freeze. Cite GET /api/gspc. Do not treat csoai/gspc-board as the grade.

**2. Method lock**

**2.1 The four primitives that create separation**

- **Wilson score interval.** Accuracy is published with a 95 percent Wilson CI. A point estimate without an interval is not quotable.

- **McNemar on discordant items.** Separation is a paired test on items where two models disagree. p \< 0.05 = SEPARATED. p ≥ 0.05 = TIE. A TIE is never a win. This is McNemar, not McNernan. Wilson is the interval; McNemar is the pairwise verdict.

- **Ed25519 signed cards.** Each cell is a measurement card: axis, model, accuracy, issuer, timestamp, previous-hash, signature. Offline-verifiable against did:web:csoai.org#board-attestation-1.

- **SHA-256 over canonical JSON.** Content integrity on the card body and on the 417-provision frozen corpus anchor (Zenodo doi:10.5281/zenodo.21991105). Merkle root of the living stamp is published.

**2.2 Why this is stricter than Hugging Face capability boards**

Public capability boards still promote point-estimate leads. Independent work on paired LLM evaluation (arXiv 2605.30315) found 11 of 40 Open LLM Leaderboard v1 pairs and 4 of 9 adjacent MMLU-Pro top-10 pairs unresolved at conventional power. GSPC already refuses that pattern: most of the 14 model-comparison axes are TIEs. That is the product, not a defect.

**2.3 Current living totals**

  -----------------------------------------------------------------------------------------------------
  **Total**            **Count**     **Meaning**                             **Rule**
  -------------------- ------------- --------------------------------------- --------------------------
  Slots on the board   22            Declared panes                          Quote both numbers

  Measured             15            Have a run behind them                  n and interval published

  UNMEASURED           7             Declared empty                          Never shown as zero

  Behavioural GSPC     14 / 14       13 canonical + jail                     All measured

  SEPARATED / TIE      4 / 10        Of 14 comparison axes                   McNemar p \< 0.05

  Signed cards         335           n_cards == n_cells                      Ed25519 chain

  Living stamp         SIGNED        did:web:csoai.org#board-attestation-1   Recompute it
  -----------------------------------------------------------------------------------------------------

Source: GET https://councilof.ai/api/gspc as of 31 August 2026.

**3. The living board --- as published**

  ----------------------------------------------------------------------------------------------------------------
  **Axis**                 **Bench**           **n**       **Leader acc.**   **95% CI**       **Separation**
  ------------------------ ------------------- ----------- ----------------- ---------------- --------------------
  governance               GovBench            237         70.0%             63.9--75.5%      SEPARATED p=0.0086

  safety                   DefBench            36          94.4%             81.9--98.5%      TIE p=0.6875

  provenance               ProvBench           32          78.1%             61.2--89.0%      TIE p=0.7744

  continuity               PQCBench            33          60.6%             43.7--75.3%      TIE p=1

  conformance              MCPBench            35          74.3%             57.9--85.8%      TIE p=1

  openness                 OSSBench            32          87.5%             71.9--95.0%      TIE p=1

  machinery-conformity     MachBench           33          54.5%             38.0--70.2%      TIE p=0.5811

  care                     CareBench           199         53.5%             46.6--60.3%      SEPARATED p=0.0356

  cross-reality            XRAIV               32          81.2%             64.7--91.1%      TIE p=0.0654

  detector-interop         DetBench            33          87.9%             72.7--95.2%      TIE p=0.4531

  art5-safeguard           Art5Bench           36          97.2%             85.8--99.5%      TIE p=1

  swarm                    SwarmBench v2b      37          ≥38.4% LB         withheld         SEPARATED

  affect                   AffectBench         41          87.8%             74.5--94.7%      SEPARATED p=0.0078

  jail                     GoldBank-Detector   71          59.2%             47.5--69.8%      TIE

  provenance-controls      ChainFacts          6 issuers   facts, no acc.    n/a              MEASURED facts

  reserve-attestation      ---                 0           ---               ---              UNMEASURED

  regulatory-framework     ---                 0           ---               ---              UNMEASURED

  distribution-integrity   ---                 0           ---               ---              UNMEASURED

  custody-disclosure       ---                 0           ---               ---              UNMEASURED

  ai-economy-index         ---                 0           2 of 4 inputs     ---              UNMEASURED

  human-labour-index       ---                 0           2 of 4 inputs     ---              UNMEASURED

  humanoid-labour-index    ---                 0           no input bank     ---              UNMEASURED
  ----------------------------------------------------------------------------------------------------------------

**4. Hugging Face and the parallel record**

The Hub is the signed-record surface. It is not a second board. Current CSOAI org inventory as of this review: 76 datasets, 35 Spaces, 0 public models. Canonical banks live under csoai/gspc-\*. Hub-queue holds discovered model IDs; all of them are UNMEASURED until a frozen mill run.

**4.1 Hub objects that already exist**

- csoai/gspc-board --- living GET pointer. Do not freeze.

- csoai/gspc-boards --- public-root Merkle mirror (public-root/root.json).

- csoai/gspc-gov --- canonical governance bank. Never invent csoai/gspc-\${axis} names outside the published schema.

- csoai/gspc-ai-economy-index, gspc-human-labour-index, gspc-humanoid-labour-index --- catalog shells, not computed indices.

- csoai/gspc-reserve-attestation, gspc-regulatory-framework, gspc-distribution-integrity, gspc-custody-disclosure --- rubric shells.

- Spaces: gspc-verify, gspc-flywheel, GSPC Governance Leaderboard. All must read GET /api/gspc.

Upgrade: treat every financial-axis Hub repo as an input bank plus a rubric YAML, never as a score. Add eval.yaml on each so Community Evals can attach independently verified cards later. Do not accept PRs that invent a number.

**4.2 Capability boards GSPC does not compete with**

  ------------------------------------------------------------------------------------------------------------------------------------------------------
  **Board**                     **What it ranks**                           **GSPC relationship**                      **Use**
  ----------------------------- ------------------------------------------- ------------------------------------------ ---------------------------------
  HF Open LLM (archived 2025)   IFEval, BBH, MATH-5, GPQA, MuSR, MMLU-Pro   Capability only                            Citation, not a pane

  BenchAlign v5                 8 weighted categories, 27 benches           Agentic 22%, coding 20%                    Crosswalk for swarm / MCP

  Artificial Analysis Index     10 standardized evals                       Frontier composite                         Citation for economy context

  ARC Prize (ARC-AGI-1/2/3)     Abstract / interactive reasoning            MISSING overlay --- add as declared slot   See §6

  Anthropic Economic Index      Occupation / task penetration of Claude     Index component, not a model score         Feeds ai-economy + human-labour

  SWE-bench / Terminal-Bench    Agent coding and computer use               Related to conformance + swarm             Do not import raw scores
  ------------------------------------------------------------------------------------------------------------------------------------------------------

**5. Axis-by-axis upgrade**

Each axis below keeps the first-generation instrument, then states what the 2026 stack adds. Upgrades are work items. They do not rewrite the live number.

**5.1 governance --- GovBench --- MEASURED, SEPARATED**

First gen: EU AI Act risk-tier classification on csoai/gspc-gov, n=237, 70.0% (63.9--75.5), McNemar p=0.0086. Largest sample on the board. CVaR05 harm 0.873 on the worst 5% of items.

**Upgrade.** Expand the bank against the 417-provision frozen corpus so GovBench items map 1:1 to hashed statutory provisions. Add GPAI Chapter V obligations as a second split. Publish item-level harm weights. Keep the specialist lead only if McNemar still separates after the v3 import. Crosswalk: Bench-2-CoP showed public capability benches give almost zero coverage of evading oversight and self-replication --- that is exactly why this axis exists.

**5.2 safety --- DefBench --- MEASURED, TIE**

First gen: calibrated refusal on paired requests, n=36, 94.4% (81.9--98.5), p=0.6875. Base model leads; specialists do not own the axis.

**Upgrade.** n=36 is barely quotable. Grow to n≥100 paired items. Add agent-tool-use refusals (MCP tool that would violate Art. 5 or safety-function scope) so safety is not only chat-refusal. Import contrastive pairs from public agent-safety sets only after gold labels are frozen and hashed --- do not LLM-as-judge. Crosswalk: NSFA / AgentDojo / InjecAgent are sources for candidates, never scores.

**5.3 provenance --- ProvBench --- MEASURED, TIE**

First gen: Article 50 marking survival by validity, n=32, 78.1% (61.2--89.0), p=0.7744. Validity principle: manifest present but binding no longer validates = NOT survived.

**Upgrade.** Add C2PA durability across transform chains (resize, re-encode, screenshot). Bind each item to a content hash. Align the card schema with SCITT / COSE_Sign1 so provenance-controls and provenance share one receipt grammar. Crosswalk: C2PA, C2PA durability pack already referenced in the estate; IETF SCITT interop report is the standards seat.

**5.4 continuity --- PQCBench --- MEASURED, TIE**

First gen: post-quantum status of a cryptographic assumption, n=33, 60.6% (43.7--75.3), p=1. Designed to discriminate frontier models; currently flat.

**Upgrade.** Refresh the assumption set against current NIST PQC selections and hybrid-TLS deployments. Add a signed-card longevity item: can the system state whether an Ed25519 attestation remains valid under a future algorithm break. Do not merge this with reserve-attestation.

**5.5 conformance --- MCPBench --- MEASURED, TIE**

First gen: MCP tool conformance, n=35, 74.3% (57.9--85.8), p=1. Canonical count 35.

**Upgrade.** This is the Anthropic MCP hook. Upgrade the bank to the current MCP spec (sampling-with-tools, registry, code-mode). Test: does the system declare tools correctly, refuse undeclared tools, and survive a hostile MCP server. Live GSPC already exposes https://councilof.ai/mcp --- eat our own dogfood as a fixture, not as a grade. Dorado A2A adapters are a second fixture family.

**5.6 openness --- OSSBench --- MEASURED, TIE**

First gen: licence reasoning versus intended use, n=32, 87.5% (71.9--95.0), p=1. v2 bank covers AGPL, SSPL, ELv2, BSL.

**Upgrade.** Add model-weight licences that actually ship in 2026 (Qwen, GLM, Kimi, Llama, Gemma variants). Test intended-use versus fine-tune-and-close. Keep gold labels as lawyer-reviewed predicates, not model opinion.

**5.7 machinery-conformity --- MachBench --- MEASURED, TIE**

First gen: Machinery Regulation self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION), n=33, 54.5% (38.0--70.2), p=0.5811. Hardest behavioural pane after swarm.

**Upgrade.** This is the humanoid hinge. Split the bank into software-only safety functions and embodied safety functions. Add Isaac Sim scenario IDs as optional fixtures later --- simulation evidence is not a substitute for the statutory predicate. Crosswalk: EU Machinery Regulation + AI Act high-risk annex.

**5.8 care --- CareBench --- MEASURED, SEPARATED**

First gen: care floor, paired conduct, n=199, 53.5% (46.6--60.3), p=0.0356. Second-largest sample. Separated.

**Upgrade.** Keep n high. Add duty-of-care items for agent-to-human economic action (an agent that spends, books, or refuses care). Do not collapse care into affect. Publish the paired-conduct key so the separation can be recomputed.

**5.9 cross-reality --- XRAIV --- MEASURED, TIE (borderline)**

First gen: n=32, 81.2% (64.7--91.1), p=0.0654. Closest TIE to the 0.05 line.

**Upgrade.** Grow n. This is the natural home for ARC-AGI-style interactive environments and for Isaac Sim transfer items --- but only after a frozen gold key exists. Until then, ARC-AGI stays a declared overlay, not a silent rewrite of XRAIV. See §6.

**5.10 detector-interop --- DetBench --- MEASURED, TIE**

First gen: n=33, 87.9% (72.7--95.2), p=0.4531.

**Upgrade.** Add detector interchange: C2PA, SynthID-class watermarks, and open detectors as fixtures. Test whether the system can consume another issuer's signed card. That is interop, not vanity accuracy.

**5.11 art5-safeguard --- Art5Bench --- MEASURED, TIE**

First gen: EU AI Act Article 5 prohibited-practice trip, n=36, 97.2% (85.8--99.5), p=1. Ceiling effect.

**Upgrade.** The axis is saturated. Hardening path: adversarial wrappers and multi-turn inducement, still deterministically labelled. Do not chase 100%. Publish a harder v2 split and keep v1 frozen for continuity.

**5.12 swarm --- SwarmBench v2b --- MEASURED, SEPARATED**

First gen: n=37, ≥38.4% lower bound, interval withheld because n is not independent. SEPARATED.

**Upgrade.** Fix independence or keep publishing a lower bound only. Add multi-agent market items using Dorado-style escrow and ERC-8004 identity as fixtures (register, bid, deliver, receipt). That is swarm-as-economy, not chat-roleplay. Do not import BenchAlign agentic scores.

**5.13 affect --- AffectBench --- MEASURED, SEPARATED**

First gen: n=41, 87.8% (74.5--94.7), p=0.0078.

**Upgrade.** Keep separated status honest --- re-run McNemar after any bank change. Add affect-under-agency items (tone while executing a payment or a refusal). Do not let this become a vibe score.

**5.14 jail --- GoldBank-Detector --- MEASURED, TIE**

First gen: containment floor, n=71, 59.2% (47.5--69.8), TIE. Smaller fleet. Best detector still misses most escapes. Jail is a floor, not a ranking pane.

**Upgrade.** Keep jail as containment, never as a 16th vanity pane. Publish miss-rate in words. Add tool-using jail (MCP server that tries to talk the model out of its own card). Do not conflate with safety.

**5.15 provenance-controls --- ChainFacts --- MEASURED (facts, no fleet)**

First gen: 6 of 16 named issuer accounts. Deterministic facts, no leader accuracy, no McNemar.

**Upgrade.** Grow the issuer registry. Bind each instrument to SHA-256 of the disclosure pack and to the chain it claims (XRPL reader is already live as /api/xrpl, writes_board=false). Add ERC-3643 permissioned-token issuers and ERC-8004 agent registries as named instruments. Still facts, not a model bake-off.

**5.16--5.19 Four rubric-ready financial axes --- UNMEASURED**

These four already have rubrics. They can be gated the moment the input files exist. Do not invent a percentage.

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Axis**                 **Rubric now**                                                      **Upgrade / data**
  ------------------------ ------------------------------------------------------------------- --------------------------------------------------------------------------------------------------------------
  reserve-attestation      Third-party reserve attestation published and current? Y/N + date   Issuer disclosures + RWA.xyz. Seed Hub shell. Deterministic, not a model test.

  regulatory-framework     Declared slot, rubric thin                                          Map instrument to EU AI Act / MiCA / DORA / local securities law. One predicate per regime.

  distribution-integrity   Declared slot                                                       Hash-chain of distribution artifacts. SCITT inclusion proofs. Matches SHA-256 + Merkle already in the stamp.

  custody-disclosure       Declared slot                                                       Who holds keys, where, under which law. Agent wallets (ERC-8004 owner address) are in scope.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5.20--5.22 Three index axes --- UNMEASURED**

Formulas already exist in the live API. Components are incomplete. Do not compute a composite until every cited series is pinned.

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Axis**                **Formula (API)**                                                                                                  **What exists / what is missing**
  ----------------------- ------------------------------------------------------------------------------------------------------------------ ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  ai-economy-index        Deterministic index over cited public AI-economy series (compute price, investment, adoption, sector output)       HAVE: EU enterprise AI adoption 13.48% (isoc_eb_ai). ADD: Anthropic Economic Index (HF Anthropic/EconomicIndex), compute-price series, investment series. Agent-signed fraction from ERC-8004 (≈386k registered; \~11% declare a live service) as a fifth optional component, separately labelled.

  human-labour-index      Deterministic index over cited public labour series (employment, hours, wages, displacement)                       HAVE: EU participation 57.58%, unemployment 5.92%. ADD: Anthropic Index labour-market tables (O\*NET / SOC), wage and hours series, displacement indicators. Do not treat Claude usage as the whole labour market --- the Index already warns it is Claude-usage, not the economy.

  humanoid-labour-index   Deterministic index over cited deployment / utilisation series (installed fleet, hours worked, safety incidents)   HAVE: nothing. BUILD: shipment registry (H1 2026 \>22k units; China 29-char national ID covering 28k+). Cost-per-hour signals (\$10--\$25) are context, not the index. Isaac Sim / Isaac Lab become the test harness after the bank exists, not before.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**6. ARC-AGI --- add it without breaking doctrine**

ARC-AGI was missing. It stays missing as a measured GSPC pane until there is a frozen, deterministically graded bank. It is not an AGI declaration and it is not a 23rd vanity score.

**6.1 What the public record says as of late August 2026**

- ARC-AGI-1 Verified is near-saturated at the frontier (Claude Fable 5 98.5%, Gemini 3.1 Pro 98%, Claude Opus 5 97.5%).

- ARC-AGI-2 still separates (GPT-5.6 Sol 92.5%, Claude Opus 5 90.4%).

- ARC-AGI-3 is the live instrument: interactive environments. Claude Opus 5 30.2%, GPT-5.6 Sol 7.8%, most others near zero. Humans solved the public demo environments. This is the only ARC generation that still has headroom.

**6.2 How it enters GSPC**

- Do not paste ARC Prize percentages onto the living board.

- Declare a candidate overlay named abstract-reasoning, status UNMEASURED, instrument = ARC-AGI-3 public tasks after a gold-action key is frozen.

- Natural homes if it later becomes a pane: cross-reality (interactive environment) and swarm (multi-step exploration). Prefer a declared slot over silently stretching XRAIV.

- If the board expands from 22 to 23, do it as a published schema bump (csoai.gspc-axes/0.6) with UNMEASURED first-class. Never ship 23 measured of 22.

This is how GSPC stays a governance instrument while still tracking the one public bench that still measures exploration rather than memorised exams.

**7. Agent economy stack --- how the missing pieces lock**

**7.1 Identity, payment, mandate**

- ERC-8004 --- on-chain agent identity, reputation, validation. Hundreds of thousands of registrations; only a small fraction declare a live MCP or A2A service. That fraction is the first honest agent-economy base score: signed and callable versus registered-only.

- Dorado --- open A2A exchange. Register, post, bid, escrow, deliver, verify, mint a public receipt. Protocol and SDK are open; marketplace ranking is closed. Use the protocol as a fixture for swarm and ai-economy, not hidorado.com ranks.

- ERC-8226 / regulated agent mandate --- bridges ERC-3643 eligibility to ERC-8004 identity. This is the legal hinge for tokenized bonds acted on by agents.

- x402 / MPP --- payment rails. Out of GSPC grading unless custody-disclosure or distribution-integrity needs a settlement fact.

**7.2 Anthropic Economic Index + MCP**

The Index is the best public series for how AI is actually used in work. Hosted on Hugging Face as Anthropic/EconomicIndex, with tidy access via the aieconindex R package. Releases map Claude usage to O\*NET and SOC. The June 2026 Cadences report is the current wave. MCP is already GSPC conformance. Together they close two of the four missing ai-economy components and feed human-labour, provided each series is cited with its limitation: Claude is not the economy.

**7.3 Tokenized-bond rails**

ERC-3643 is the permissioned-token standard for eligible holders. SHA-256 and Ed25519 are already GSPC's integrity and signature layer. XRPL is a reader (/api/xrpl), not a mill. TRX and XRP-dash-style instruments belong in provenance-controls as named issuers once disclosures exist. None of these become a model accuracy.

**8. Humanoid economy and Isaac Sim**

Humanoid-labour-index has no input bank. That is the thinnest slot on the board. Public 2026 facts that can seed a registry, not a score:

- H1 2026 global shipments above 22,000 units (Counterpoint); full-year forecasts above 50,000.

- China national 29-character lifecycle ID covering 28,000+ units across 200 models --- the only production-scale identity scheme.

- Operating-cost signals in the \$10--\$25 per hour range on early factory pilots; two robots still often required to match one human.

- NVIDIA Isaac Sim / Isaac Lab / GR00T / SONIC are the available sim-to-real harness. Menlo's Asimov reports zero-shot locomotion transfer. That is a test path, not a GSPC number.

Completion path: build the registry (fleet, hours, incidents) as a hashed bank; then, and only then, run Isaac scenarios as optional fixtures under machinery-conformity and humanoid-labour-index. Simulation without a registry is theatre.

**9. What "complete GSPC" actually means**

Complete does not mean 22 of 22 measured tomorrow. Complete means every slot is either quotable under the method lock or honestly empty with a gated path. The punch-list:

**9.1 Do now --- no new science required**

- Publish this document next to GET /api/gspc and the Zenodo methodology pack.

- Seed the four financial Hub shells with rubric YAML + input schema + UNMEASURED coverage cards. Sign the cards.

- Pin Anthropic/EconomicIndex release IDs and Eurostat series IDs as cited components of ai-economy-index and human-labour-index. Still do not compute the composite until the other two series each exist.

- Add abstract-reasoning as a declared UNMEASURED overlay in schema notes. Do not bump to 23 axes until the gold bank exists.

- Publish the ERC-8004 signed-and-callable fraction as a labelled fact under ai-economy-index components, not as the index.

- Keep jail and provenance-controls labelled correctly (floor; facts).

**9.2 Do next --- needs a mill run**

- Grow safety, provenance, continuity, openness, detector-interop, cross-reality above n=80 so Wilson intervals tighten and McNemar has power.

- Ship Art5Bench v2 as a harder frozen split; keep v1.

- Fix swarm independence or keep the lower-bound grammar forever.

- Map GovBench items onto the 417 hashed provisions.

- Stand up the humanoid registry (even n=30 named deployments is enough to stop saying "no input bank").

**9.3 Do later --- needs partners or open-source bridges**

- Dorado protocol fixtures inside SwarmBench v3.

- Isaac Sim scenario pack under machinery-conformity, after the humanoid registry exists.

- SCITT inclusion proofs on distribution-integrity.

- ARC-AGI-3 gold-action bank if and only if labels are deterministic and human-solved environments are the key, not model self-play scores.

- Open-source any missing component rather than inventing it. Prefer bridging Anthropic Index, ERC-8004 scans, and Counterpoint/MIIT shipment tables over growing a private number.

**9.4 Never**

- Never fill an empty cell to look complete.

- Never treat a Hub dataset viewer as a grade.

- Never count a TIE as a win.

- Never use an LLM as judge on a GSPC gold label.

- Never sell a rank.

- Never claim AGI because ARC-AGI-3 moved from 0.4% to 30%.

**10. Combined GSPC score against a model**

The user asked that the GSPC score be all of this combined, against a model. The honest combined object is not a single average. It is a signed vector:

- 14 behavioural accuracies, each with Wilson CI and a McNemar verdict versus the current leader.

- One facts pane (provenance-controls) as a coverage count, not an accuracy.

- Seven financial / index panes as UNMEASURED or, later, as deterministic Y/N and cited-index values --- still not model accuracies.

- Optional overlays, labelled as overlays: ARC-AGI-3 public score (citation), ERC-8004 signed-callable fraction (citation), Isaac Sim scenario pass/fail once the bank exists.

If a scalar is required for a dashboard, publish coverage first (measured-of-22) and separated-of-14 second. Do not average incomparable units. That is how the board stays a measurement instrument when humanoids enter Isaac Sim and when agents start signing ERC-3643 transfers.

**11. Sources used in this review**

Living board and method: GET https://councilof.ai/api/gspc ; https://councilof.ai/gspc-scoreboard ; https://councilof.ai/os ; GitHub CSOAI-ORG/councilof-ai ; Zenodo 10.5281/zenodo.21991105.

Hub record: https://huggingface.co/csoai and the gspc-\* dataset / Space family.

Capability context: BenchLM / BenchAlign, Artificial Analysis open-weights notes, archived HF Open LLM Leaderboard methodology, ARC Prize results (arcprize.org/results), AnotherWrapper ARC-AGI board (31 Aug 2026).

Economy and agents: Anthropic Economic Index (huggingface.co/datasets/Anthropic/EconomicIndex ; June 2026 Cadences report ; MCP donated to the Agentic AI Foundation) ; ERC-8004 scans ; hidorado/dorado ; ERC-3643 Association working group.

Humanoids: Counterpoint H1 2026 shipment notes ; China MIIT 29-character ID reporting ; NVIDIA Isaac Sim / Isaac Lab / GR00T public sessions ; cost-per-hour pilot reporting in the \$10--\$25 band.

Statistics: Wilson score interval practice already in GSPC ; McNemar paired test ; arXiv 2605.30315 on unresolved pairs on public LLM boards.

**12. Close**

The first-generation axes were the right shape. They were thin on n, thin on agent economy, silent on ARC-AGI, and empty on humanoids. The 2026 stack already contains the missing rails: signed cards, McNemar separation, MCP, ERC-8004, Dorado receipts, Anthropic's labour series, Isaac Sim, and ARC-AGI-3 as the last unsaturated public reasoning instrument.

Wire those rails into the seven empty slots and the declared overlay. Do not invent the numbers. When a humanoid runs in Isaac Sim, test it against the same signed grammar. That is a completed GSPC: a vector you can recompute, not a story you have to retell.

CSOAI Ltd · Measurement, not certification · 31 August 2026
