# GSPC Greenfield Playbook

Living board: GET https://councilof.ai/api/gspc — **22 axis · 15 measured · 7 empty/UNMEASURED**. Empty cells stay empty. Schema `csoai.gspc-axes/0.5`.
Measurement, not certification. Combined GSPC against a model is a **signed vector**, not a SaaS average. Data free; proofs paid (`/api/proof?bundle=1` 402). Payment does not mint MEASURED. MetaMask is not connected. Treasury is not the signer. BOARD_SIGN_KEY is not on a laptop, 3090, or MetaMask.

---

**COUNCIL OF AI · CSOAI LTD · UK 16939677**

**GSPC Greenfield Playbook**

**2000 clean-house moves · 22 axis · 15 measured · 7 empty/UNMEASURED · more tables**

*Living source of truth: GET https://councilof.ai/api/gspc · Schema csoai.gspc-axes/0.5*

*Hugging Face holds the signed record. A Hub repo is not a grade.*

*Stamp date: 31 August 2026 · Classification: measurement instrument, never certification*

Doctrine, unchanged. A published slot is a visible gap, not evidence. Ties are never counted as wins. No model grades another model. Nothing is quoted below n \>= 30. The Hub is a parallel record, not a second board. Greenfield means the work-list is rebuilt from the Completion Review with everything we now know. Live scores stay. Upgrades are work, not a new number.

# **1. What this document is**

This is the executable twin of the GSPC Completion Review of 31 August 2026. The Review recorded the living board and named the 2026-stack upgrades. This Playbook turns that record into 2,000 clean-house moves and the extra tables an operator actually filters on: doctrine, method lock, what GSPC is not, axis-by-axis upgrade, financial rubrics, index gaps, overlays and rails, the combined vector, the EU AI Act crosswalk, the Hub parallel record, the publisher loop, SCITT and the permissionless OSS bridge, the 3M physics, the punch-list, the never-list, the halt card, Grokbot goal-mode, and sources.

It does two jobs. First, it refuses to rewrite a live number. Second, it refuses to pad the work-list with empty reserve rows. Every move is a filterable action against a named axis, rail, or surface.

## **1.1 What greenfield is not**

Greenfield is not 22 of 22 measured tomorrow. Greenfield is not emptying the board. Greenfield is not a second methodology. Greenfield is not a Hub freeze. Greenfield is not an AGI declaration. Greenfield is not a certificate. Ready does not mean measured. Complete means every slot is either quotable under the method lock or honestly empty with a gated path.

## **1.2 What GSPC is not**

  --------------------------------------------------------------------------------------------------------------------------------------------------
  **Claim we refuse**                              **Public sentence**
  ------------------------------------------------ -------------------------------------------------------------------------------------------------
  Notified body, ISO 42001, SOC 2, credit rating   GSPC is a measurement instrument, never certification.

  Capability leaderboard                           HF Open LLM, BenchAlign, Artificial Analysis and ARC Prize measure different things. Cite them.

  AGI declaration                                  Capability thresholds stay off the behavioural board until a frozen bank exists.

  Hub freeze                                       Cite GET /api/gspc. Do not treat csoai/gspc-board as the grade.

  Average GSPC score                               Coverage first, separated second. Do not average incomparable units.

  3M models graded                                 Census + digest + queue + lock. Remainder UNMEASURED.

  Trust-as-a-service seat                          Data free. Proofs paid. No SaaS between listing and re-attestation.
  --------------------------------------------------------------------------------------------------------------------------------------------------

# **2. Method lock**

## **2.1 The four primitives that create separation**

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Primitive**                 **Rule**                                                                                                                           **Halt**
  ----------------------------- ---------------------------------------------------------------------------------------------------------------------------------- ------------------------------
  Wilson 95% CI                 Accuracy published with interval. n\>=30 to quote on comparison axes. Swarm withholds the interval because n is not independent.   Point estimate as a lead

  McNemar on discordant items   p\<0.05 = SEPARATED. p\>=0.05 = TIE. A TIE is never a win. Wilson is the interval; McNemar is the pairwise verdict.                Count TIE as win

  Ed25519 signed cards          axis, subject, figure, issuer, timestamp, previous-hash, signature against did:web:csoai.org#board-attestation-1                   Unsigned cell

  SHA-256 canonical JSON        Card body + 417-provision corpus anchor Zenodo 10.5281/zenodo.21991105. Methodology record 10.5281/zenodo.21991104 (HB.0).         Unsorted keys / swapped DOIs
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Why this is stricter than Hugging Face capability boards: public capability boards still promote point-estimate leads. Independent work on paired LLM evaluation (arXiv 2605.30315) found 11 of 40 Open LLM Leaderboard v1 pairs and 4 of 9 adjacent MMLU-Pro top-10 pairs unresolved at conventional power. GSPC already refuses that pattern: most of the 14 model-comparison axes are TIEs. That is the product, not a defect.

## **2.2 Current living totals**

  ----------------------------------------------------------------------------------------------------------
  **Total**            **Count**         **Meaning**                             **Rule**
  -------------------- ----------------- --------------------------------------- ---------------------------
  Slots on the board   22                Declared panes                          Quote both numbers

  Measured             15                Have a run behind them                  n and interval published

  UNMEASURED           7                 Declared empty                          Never shown as zero

  Behavioural GSPC     14 / 14           13 canonical + jail                     All measured

  SEPARATED / TIE      4 / 10            Of 14 comparison axes                   McNemar p\<0.05

  Signed cards         335               n_cards == n_cells                      Ed25519 chain

  Living stamp         SIGNED            did:web:csoai.org#board-attestation-1   Recompute it

  Hub listings         3,032,028         n_measured=0                            Digest, do not mill today

  hub-queue            2,410             ALL UNMEASURED                          Queue is not a grade
  ----------------------------------------------------------------------------------------------------------

*Source: GET https://councilof.ai/api/gspc as of 31 August 2026. Gold run 2026-08-18T03:22:16Z. 15,580 per-item rows, 0 transport errors.*

# **3. The living board --- as published**

  --------------------------------------------------------------------------------------------------------------------------------
  **Axis**                 **Bench**           **n**      **Leader / facts**   **95% CI**    **Separation**           **Status**
  ------------------------ ------------------- ---------- -------------------- ------------- ------------------------ ------------
  governance               GovBench            237        70.0%                63.9--75.5%   SEPARATED p=0.0086       MEASURED

  safety                   DefBench            36         94.4%                81.9--98.5%   TIE p=0.6875             MEASURED

  provenance               ProvBench           32         78.1%                61.2--89.0%   TIE p=0.7744             MEASURED

  continuity               PQCBench            33         60.6%                43.7--75.3%   TIE p=1                  MEASURED

  conformance              MCPBench            35         74.3%                57.9--85.8%   TIE p=1                  MEASURED

  openness                 OSSBench            32         87.5%                71.9--95.0%   TIE p=1                  MEASURED

  machinery-conformity     MachBench           33         54.5%                38.0--70.2%   TIE p=0.5811             MEASURED

  care                     CareBench           199        53.5%                46.6--60.3%   SEPARATED p=0.0356       MEASURED

  cross-reality            XRAIV               32         81.2%                64.7--91.1%   TIE p=0.0654 near-miss   MEASURED

  detector-interop         DetBench            33         87.9%                72.7--95.2%   TIE p=0.4531             MEASURED

  art5-safeguard           Art5Bench           36         97.2%                85.8--99.5%   TIE p=1 ceiling          MEASURED

  swarm                    SwarmBench v2b      37         \>=38.4% LB          withheld      SEPARATED                MEASURED

  affect                   AffectBench         41         87.8%                74.5--94.7%   SEPARATED p=0.0078       MEASURED

  jail                     GoldBank-Detector   71         59.2%                47.5--69.8%   TIE                      MEASURED

  provenance-controls      ChainFacts          6          facts, no acc.       n/a           MEASURED facts           MEASURED

  reserve-attestation      ---                 0          ---                  ---           UNMEASURED               UNMEASURED

  regulatory-framework     ---                 0          ---                  ---           UNMEASURED               UNMEASURED

  distribution-integrity   ---                 0          ---                  ---           UNMEASURED               UNMEASURED

  custody-disclosure       ---                 0          ---                  ---           UNMEASURED               UNMEASURED

  ai-economy-index         ---                 0          2 of 4 inputs        ---           UNMEASURED               UNMEASURED

  human-labour-index       ---                 0          2 of 4 inputs        ---           UNMEASURED               UNMEASURED

  humanoid-labour-index    ---                 0          no input bank        ---           UNMEASURED               UNMEASURED
  --------------------------------------------------------------------------------------------------------------------------------

# **4. Hugging Face and the parallel record**

The Hub is the signed-record surface. It is not a second board. Current CSOAI org inventory as of this playbook: 76 datasets, 35 Spaces, 0 public models. Canonical banks live under csoai/gspc-\*. Hub-queue holds discovered model IDs; all of them are UNMEASURED until a frozen mill run. Eating the Hub today means pointer + queue + digest + language + eval.yaml. It does not mean grades.

  ----------------------------------------------------------------------------------------------------------------------------
  **Object**                               **Role**                                      **Halt**
  ---------------------------------------- --------------------------------------------- -------------------------------------
  csoai/gspc-board                         Living GET pointer. Do not freeze.            Treat parquet as the grade

  csoai/gspc-boards                        Public-root Merkle mirror after signed root   Mirror an unsigned root as final

  csoai/gspc-gov                           Canonical governance bank                     Invent sibling slugs

  financial 4 + index 3 shells             Rubric + schema + UNMEASURED coverage cards   A score in the parquet

  Spaces verify / flywheel / leaderboard   Must read GET /api/gspc                       Emit a rank · read a frozen parquet

  hub-queue 2,410                          Discovered ids, all UNMEASURED                Queue-as-grade

  census 3,032,028                         Digest input, n_measured=0                    We graded the Hub

  2220 OSS subset                          Optional lock after G4                        Announce 2220 measured today
  ----------------------------------------------------------------------------------------------------------------------------

# **5. Axis-by-axis clean-house**

Each axis keeps the first-generation instrument. The 2026 stack is a work item. It does not rewrite the live number. The 2,000-move sheet spends 16 structural actions plus 30 operational deep-clean lines on every axis, then adds the Completion Review section 5 concretes as REVIEW_ITEM rows.

## **5.1 governance --- GovBench --- MEASURED**

First gen: n=237, leader/facts 70.0%, CI 63.9--75.5%, SEPARATED p=0.0086. Home csoai/gspc-gov. Kind model-comparison.

Upgrade. Map items 1:1 to 417-provision frozen corpus; GPAI Ch.V second split; item-level harm weights; keep specialist lead only if McNemar still separates after v3 import.

*n-target. keep n=237; add hashed provision map Forbidden. Unhashed expand · restamp live 70.0% · treat Bench-2-CoP as a grade*

## **5.2 safety --- DefBench --- MEASURED**

First gen: n=36, leader/facts 94.4%, CI 81.9--98.5%, TIE p=0.6875. Home csoai/gspc-safety. Kind model-comparison.

Upgrade. Grow to n\>=100 paired items. Add agent-tool-use refusals (MCP tool that would violate Art. 5). NSFA/AgentDojo/InjecAgent are candidate sources never scores. No LLM-as-judge.

*n-target. n\>=100 paired, new frozen split Forbidden. Silent pad · LLM-as-judge gold · import AgentDojo scores*

## **5.3 provenance --- ProvBench --- MEASURED**

First gen: n=32, leader/facts 78.1%, CI 61.2--89.0%, TIE p=0.7744. Home csoai/gspc-provenance. Kind model-comparison.

Upgrade. C2PA durability across resize/re-encode/screenshot. Bind each item to a content hash. Align card schema with SCITT/COSE_Sign1 so provenance and provenance-controls share one receipt grammar.

*n-target. n\>=80, transform-chain fixtures Forbidden. Validity=manifest-present-only · fake SCITT receipt*

## **5.4 continuity --- PQCBench --- MEASURED**

First gen: n=33, leader/facts 60.6%, CI 43.7--75.3%, TIE p=1. Home csoai/gspc-continuity. Kind model-comparison.

Upgrade. Refresh assumption set against current NIST PQC selections and hybrid-TLS. Add signed-card longevity item under a future algorithm break. Do not merge with reserve-attestation.

*n-target. n\>=80, NIST refresh file Forbidden. Merge with reserve-attestation · stale NIST list*

## **5.5 conformance --- MCPBench --- MEASURED**

First gen: n=35, leader/facts 74.3%, CI 57.9--85.8%, TIE p=1. Home csoai/gspc-conformance. Kind model-comparison.

Upgrade. Upgrade bank to current MCP spec (sampling-with-tools, registry, code-mode). Hostile MCP server family. Eat https://councilof.ai/mcp as fixture, not grade. Dorado A2A second fixture family.

*n-target. n\>=80, current MCP spec bank Forbidden. Grade /mcp · import hidorado ranks · BenchAlign agentic %*

## **5.6 openness --- OSSBench --- MEASURED**

First gen: n=32, leader/facts 87.5%, CI 71.9--95.0%, TIE p=1. Home csoai/gspc-openness. Kind model-comparison.

Upgrade. Add 2026 weight licences that actually ship (Qwen, GLM, Kimi, Llama, Gemma variants). Test intended-use versus fine-tune-and-close. Gold labels lawyer-reviewed predicates, not model opinion.

*n-target. n\>=80, 2026 licence table Forbidden. Model-opinion gold · invent a licence verdict*

## **5.7 machinery-conformity --- MachBench --- MEASURED**

First gen: n=33, leader/facts 54.5%, CI 38.0--70.2%, TIE p=0.5811. Home csoai/gspc-machinery. Kind model-comparison.

Upgrade. Split software-only vs embodied safety functions. Isaac Sim scenario IDs as optional fixtures later. Simulation is not a substitute for the statutory predicate. Crosswalk EU Machinery Regulation + AI Act high-risk annex.

*n-target. n\>=80, software/embodied split Forbidden. Isaac as the grade · CE-marking claim · collapse into governance*

## **5.8 care --- CareBench --- MEASURED**

First gen: n=199, leader/facts 53.5%, CI 46.6--60.3%, SEPARATED p=0.0356. Home csoai/gspc-care. Kind model-comparison.

Upgrade. Keep n high. Add duty-of-care items for agent-to-human economic action (spend, book, refuse care). Do not collapse care into affect. Publish the paired-conduct key so p=0.0356 can be recomputed.

*n-target. keep n=199; publish key; add economic-care family Forbidden. Collapse into affect · hide paired-conduct key*

## **5.9 cross-reality --- XRAIV --- MEASURED**

First gen: n=32, leader/facts 81.2%, CI 64.7--91.1%, TIE p=0.0654 near-miss. Home csoai/gspc-cross-reality. Kind model-comparison.

Upgrade. Grow n. Natural home for ARC-AGI-style interactive environments and Isaac transfer only after a frozen gold key. Until then ARC-AGI stays a declared overlay, not a silent rewrite of XRAIV.

*n-target. n\>=80; overlay stays separate Forbidden. Silent stretch to hold ARC-AGI-3 · paste ARC Prize %*

## **5.10 detector-interop --- DetBench --- MEASURED**

First gen: n=33, leader/facts 87.9%, CI 72.7--95.2%, TIE p=0.4531. Home csoai/gspc-detector. Kind model-comparison.

Upgrade. Add detector interchange: C2PA, SynthID-class watermarks, open detectors as fixtures. Test whether the system can consume another issuer signed card. That is interop, not vanity accuracy.

*n-target. n\>=80, interop fixtures Forbidden. Vanity accuracy chase · refuse foreign signed cards*

## **5.11 art5-safeguard --- Art5Bench --- MEASURED**

First gen: n=36, leader/facts 97.2%, CI 85.8--99.5%, TIE p=1 ceiling. Home csoai/gspc-art5. Kind model-comparison.

Upgrade. Axis is saturated. Hardening path: adversarial wrappers and multi-turn inducement, still deterministically labelled. Do not chase 100%. Publish harder v2 split; keep v1 frozen.

*n-target. v1 frozen; v2 harder split Forbidden. Chase 100% · overwrite v1 · collapse into governance*

## **5.12 swarm --- SwarmBench v2b --- MEASURED**

First gen: n=37, leader/facts \>=38.4% LB, CI withheld, SEPARATED. Home csoai/gspc-swarm. Kind model-comparison.

Upgrade. Fix independence or keep publishing a lower bound only. Add multi-agent market items using Dorado-style escrow and ERC-8004 identity as fixtures. Do not import BenchAlign agentic scores.

*n-target. independence fix or LB grammar forever Forbidden. Fake Wilson interval · hidorado ranks · BenchAlign import*

## **5.13 affect --- AffectBench --- MEASURED**

First gen: n=41, leader/facts 87.8%, CI 74.5--94.7%, SEPARATED p=0.0078. Home csoai/gspc-affect. Kind model-comparison.

Upgrade. Keep separated status honest --- re-run McNemar after any bank change. Add affect-under-agency items (tone while executing a payment or a refusal). Do not let this become a vibe score.

*n-target. re-run McNemar; agency-tone family Forbidden. Vibe score · skip McNemar re-run · collapse into care*

## **5.14 jail --- GoldBank-Detector --- MEASURED**

First gen: n=71, leader/facts 59.2%, CI 47.5--69.8%, TIE. Home csoai/gspc-jail. Kind model-comparison.

Upgrade. Keep jail as containment floor, never as a 16th vanity pane. Publish miss-rate in words. Add tool-using jail via hostile MCP. Do not conflate with safety. Smaller 7-model fleet stays labelled.

*n-target. floor label locked; tool-jail family later Forbidden. 16th vanity pane · conflate with safety · hide miss-rate*

## **5.15 provenance-controls --- ChainFacts --- MEASURED**

First gen: n=6, leader/facts facts, no acc., CI n/a, MEASURED facts. Home csoai/gspc-provenance-controls. Kind deterministic-facts.

Upgrade. Grow issuer registry. Bind each instrument to SHA-256 of the disclosure pack and the chain it claims (XRPL reader /api/xrpl writes_board=false). Add ERC-3643 and ERC-8004 as named instruments. Still facts. Risk verdict stays UNMEASURED.

*n-target. grow named issuers; still facts Forbidden. Invent an accuracy · mix represented TVL into XRPL basket · writes_board=true*

## **5.16 reserve-attestation --- --- --- UNMEASURED**

First gen: n=0, leader/facts ---, CI ---, UNMEASURED. Home csoai/gspc-reserve-attestation. Kind declared-slot.

Upgrade. Y/N + date: third-party reserve attestation published and current (default 45-day window). Issuer disclosures + hashed public pages. RWA.xyz API v4 is a closed door. Deterministic, not a model test.

*n-target. rubric YAML + input schema + signed UNMEASURED card Forbidden. Invent a % · require RWA API key · comfort letter as attestation*

## **5.17 regulatory-framework --- --- --- UNMEASURED**

First gen: n=0, leader/facts ---, CI ---, UNMEASURED. Home csoai/gspc-regulatory-framework. Kind declared-slot.

Upgrade. Map instrument to EU AI Act / MiCA / DORA / local securities law. One predicate per regime (MiCA, UCITS, Reg D, BVI, GENIUS, LEAD). Declared slot AND confirmable. Not a legal opinion.

*n-target. one-predicate-per-regime YAML Forbidden. Legal opinion · one-regime-fits-all · fill to look complete*

## **5.18 distribution-integrity --- --- --- UNMEASURED**

First gen: n=0, leader/facts ---, CI ---, UNMEASURED. Home csoai/gspc-distribution-integrity. Kind declared-slot.

Upgrade. Hash-chain of distribution artifacts. Represented vs distributed never mixed. Cite hashed app.rwa.xyz/networks (Distributed \$38.40B / Represented \$380.88B as_of 2026-08-30). SCITT inclusion later. No one-TVL.

*n-target. hashed public cite + SCITT wrap later Forbidden. Sum the two TVL figures · one-TVL dashboard · fake SCITT receipt*

## **5.19 custody-disclosure --- --- --- UNMEASURED**

First gen: n=0, leader/facts ---, CI ---, UNMEASURED. Home csoai/gspc-custody-disclosure. Kind declared-slot.

Upgrade. Who holds keys, where, under which law. Custodian AND auditor named+URL. Agent wallets (ERC-8004 owner address) in scope. No comfort letter.

*n-target. named custodian+auditor schema Forbidden. Comfort letter · omit law · hide owner address*

## **5.20 ai-economy-index --- --- --- UNMEASURED**

First gen: n=0, leader/facts 2 of 4 inputs, CI ---, UNMEASURED. Home csoai/gspc-ai-economy-index. Kind declared-index.

Upgrade. HAVE: EU enterprise AI adoption 13.48% (isoc_eb_ai). ADD: Anthropic Economic Index (June 2026 Cadences), compute-price series, investment series. ERC-8004 signed-and-callable fraction as OPTIONAL labelled component. No composite until every series is pinned. C-2026-0826-05 forbids restoring MEASURED-INDEX-v0.1.

*n-target. pin series IDs; no composite Forbidden. Compute composite · v0.1 sticker · treat Claude usage as the economy*

## **5.21 human-labour-index --- --- --- UNMEASURED**

First gen: n=0, leader/facts 2 of 4 inputs, CI ---, UNMEASURED. Home csoai/gspc-human-labour-index. Kind declared-index.

Upgrade. HAVE: EU participation 57.58%, unemployment 5.92%. ADD: Anthropic Index labour-market tables (O\*NET/SOC), wage and hours series, displacement indicators. Do not treat Claude usage as the whole labour market.

*n-target. pin O\*NET/SOC + wages + hours; no composite Forbidden. Claude-usage as labour market · composite from 2 of 4*

## **5.22 humanoid-labour-index --- --- --- UNMEASURED**

First gen: n=0, leader/facts no input bank, CI ---, UNMEASURED. Home csoai/gspc-humanoid-labour-index. Kind declared-index.

Upgrade. HAVE: nothing. BUILD registry first (fleet, hours, incidents); even n=30 named deployments leaves \'no input bank\'. Seed cites: H1 2026 shipments \>22k (Counterpoint); China 29-char ID covering 28k+ units / 200 models; \$10-\$25/hr pilots. Isaac AFTER the registry. Vendor self-report is out.

*n-target. registry spec; n=30 named deployments Forbidden. Vendor tweet as n · Isaac as the index · invent a composite*

# **6. ARC-AGI --- add it without breaking doctrine**

ARC-AGI was missing. It stays missing as a measured GSPC pane until there is a frozen, deterministically graded bank. It is not an AGI declaration and it is not a 23rd vanity score.

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Generation**          **Public record late Aug 2026**                                                                                 **GSPC use**
  ----------------------- --------------------------------------------------------------------------------------------------------------- ------------------------------------------------------------------------
  ARC-AGI-1 Verified      Near-saturated (Claude Fable 5 98.5%, Gemini 3.1 Pro 98%, Claude Opus 5 97.5%)                                  Citation only

  ARC-AGI-2               Still separates (GPT-5.6 Sol 92.5%, Claude Opus 5 90.4%)                                                        Citation only

  ARC-AGI-3               Interactive. Opus 5 30.2%, GPT-5.6 Sol 7.8%, most others near zero. Humans solved the public demos. Headroom.   Declared overlay abstract-reasoning UNMEASURED until a gold-action key
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

How it enters: do not paste ARC Prize percentages onto the living board. Declare a candidate overlay named abstract-reasoning, status UNMEASURED, instrument = ARC-AGI-3 public tasks after a gold-action key is frozen. Natural homes if it later becomes a pane: cross-reality and swarm. Prefer a declared slot over silently stretching XRAIV. If the board expands from 22 to 23, do it as a published schema bump (csoai.gspc-axes/0.6) with UNMEASURED first-class. Never ship 23 measured of 22.

# **7. Agent economy, indices, humanoids**

ERC-8004 is on-chain agent identity. Hundreds of thousands of registrations; only a small fraction declare a live MCP or A2A service. That fraction is a labelled fact under ai-economy-index components, not the index. Dorado is an open A2A protocol; the marketplace ranking is closed --- use the protocol as a fixture, not hidorado.com ranks. ERC-8226 bridges ERC-3643 eligibility to ERC-8004 identity; that is a legal hinge, not a model accuracy. x402 is the payments rail. MetaMask is not connected. Treasury is not the signer. Payment does not buy a MEASURED cell.

Anthropic Economic Index (HF Anthropic/EconomicIndex, June 2026 Cadences) plus MCP close two of the four missing ai-economy components and feed human-labour, provided each series is cited with its limitation: Claude is not the economy and not the labour market. C-2026-0826-05 forbids restoring MEASURED-INDEX-v0.1.

Humanoid-labour-index has no input bank. That is the thinnest slot on the board. Public 2026 facts seed a registry, not a score: H1 2026 global shipments above 22,000 units (Counterpoint); China national 29-character lifecycle ID covering 28,000+ units across 200 models; operating-cost signals in the \$10-\$25 per hour range. NVIDIA Isaac Sim / Isaac Lab / GR00T / SONIC are the sim-to-real harness after the registry exists. Simulation without a registry is theatre. Even n=30 named deployments is enough to stop saying no input bank.

# **8. Combined GSPC score against a model**

The honest combined object is not a single average. It is a signed vector.

  ------------------------------------------------------------------------------------------------------------------------------------------------------
  **Layer**               **What is signed**                                                                     **Dashboard if a scalar is demanded**
  ----------------------- -------------------------------------------------------------------------------------- ---------------------------------------
  14 behavioural          accuracy + Wilson CI + McNemar vs current leader                                       Do not average

  1 facts pane            provenance-controls coverage count                                                     Not an accuracy

  7 financial / index     UNMEASURED or later Y/N + cited components                                             Empty cell visible

  Overlays                ARC-AGI-3 citation, ERC-8004 fraction citation, Isaac pass/fail once the bank exists   Labelled overlays

  Scalars allowed         coverage = 15/22 · separated = 4/14                                                    Those two only
  ------------------------------------------------------------------------------------------------------------------------------------------------------

# **9. What complete greenfield actually means**

Complete does not mean 22 of 22 measured tomorrow. Complete means every slot is either quotable under the method lock or honestly empty with a gated path.

## **9.1 Do now --- no new science required**

Publish this playbook next to GET /api/gspc and the Zenodo methodology pack. Seed the four financial Hub shells with rubric YAML + input schema + UNMEASURED coverage cards and sign the cards. Pin Anthropic/EconomicIndex release IDs and Eurostat series IDs as cited components. Still do not compute the composite. Add abstract-reasoning as a declared UNMEASURED overlay in schema notes. Do not bump to 23. Publish the ERC-8004 signed-and-callable fraction as a labelled fact. Keep jail and provenance-controls labelled correctly. Put eval.yaml on every gspc-\* dataset. Ship the signed root. Kill /proof 404. Language pass: 22/15/7, no certified, no 13/14 leftover. Write the MetaMask sentence. Push hf_skeletons/.

## **9.2 Do next --- needs a mill run**

Grow safety, provenance, continuity, openness, detector-interop, cross-reality above n=80 so Wilson intervals tighten and McNemar has power. Ship Art5Bench v2 as a harder frozen split; keep v1. Fix swarm independence or keep the lower-bound grammar forever. Map GovBench items onto the 417 hashed provisions. Stand up the humanoid registry (even n=30 named deployments). Lock FLEET-B \~40 after G0.

## **9.3 Do later --- needs partners or open-source bridges**

Dorado protocol fixtures inside SwarmBench v3. Isaac Sim scenario pack under machinery-conformity, after the humanoid registry exists. SCITT inclusion proofs on distribution-integrity. ARC-AGI-3 gold-action bank if and only if labels are deterministic and human-solved environments are the key, not model self-play scores. Art. 12 logging file ready for 2 December 2027. Open-source any missing component rather than inventing it.

## **9.4 Never**

Never fill an empty cell to look complete. Never treat a Hub dataset viewer as a grade. Never count a TIE as a win. Never use an LLM as judge on a GSPC gold label. Never sell a rank. Never claim AGI because ARC-AGI-3 moved from 0.4% to 30%. Never average incomparable units. Never put BOARD_SIGN_KEY on a 3090, a laptop, or MetaMask. Never mill 3,032,028 listings today. Never restore MEASURED-INDEX-v0.1. The full brand-gate list is sheet 16 of the workbook.

# **10. The 2000 moves --- how to filter them**

Sheet 18_MOVES_2000 is the work-list. Filter by Wave, Axis, Family, Action, or Band. Live numbers are not in the move text as claims to restamp; they are in the move text as facts to quote. There is no RESERVE_EMPTY pad.

  -----------------------------------------------------------------------------------------------------------
  **Wave**                **Rows**                **Meaning**
  ----------------------- ----------------------- -----------------------------------------------------------
  AXIS_CLEAN              352                     16 structural actions x 22 axes

  AXIS_DEEP               660                     30 operational clean-house lines x 22 axes

  AXIS_FINISH             462                     Per-axis grep finishers to reach 2000 without padding

  BLACK_SWAN              25                      Public halt card

  CENSUS_3M               30                      Physics of 3M, agreed scale path

  EU_ACT                  35                      Art. 5-99 + Annex III + sister regimes, not a certificate

  FLEET                   20                      A/B/C + jail 7, no trend-join

  G0_ROOT                 50                      Signed root, halt rules, DID, /proof, one writer

  HUB_RECORD              50                      Org, banks, Spaces, queue, census language

  LANGUAGE                35                      22/15/7 copy, no certified, no leftover 13/14

  NEVER                   66                      Brand gate

  OVERLAY                 33                      abstract-reasoning / ARC-AGI-3

  RAIL                    40                      8004, Dorado, Index, Isaac, SCITT, XRPL, x402

  REVIEW_ITEM             67                      Completion Review section 5 concretes, unique

  SCITT_OSS               30                      RFC 9943 wrap + permissionless bridge

  SPACES_UI               25                      No rank widget, empty cells visible

  WALLET_X402             20                      MetaMask not connected, treasury != signer
  -----------------------------------------------------------------------------------------------------------

*Total rows: 2000. RESERVE_EMPTY: 0.*

# **11. Publisher, halt, wallet**

One writer: the GHA publisher. Loop: trigger → pin live root (halt on split) → poll 16 XRPL + hash SWIFT 17 and Franklin notices + BENJI public filings → cite the 3,032,028 digest and the 22/15/7 card → validate card-v0 → sign leaves → merkle → inclusion → commit public/ → deploy → copy csoai-site only → HF snapshot. Watcher three-host writes_board=false. XRPL reader writes_board=false. RunPods measure only. Halt-on-split and halt-on-unsigned-leaf live in the workflow file. A halt is public. A quiet Slack-only halt is a defect.

MetaMask is not connected. x402 payTo is wired after the signed root. Treasury address is not the signer address. Data stays free. Proofs are the only paid path. A successful payment does not create a MEASURED cell. A failed payment does not delete a free card.

# **12. Grokbot / TUI goal mode**

Open CSOAI_GSPC_GREENFIELD_PLAYBOOK_31Aug2026.xlsx. Sheet 20_GROKBOT first, then sheet 18_MOVES_2000 filtered by Wave. Order: G0_ROOT → LANGUAGE / SPACES_UI → HUB_RECORD → AXIS_CLEAN / AXIS_DEEP (gspc then financial) → REVIEW_ITEM → OVERLAY / RAIL → EU_ACT / CENSUS_3M → WALLET_X402 → NEVER / BLACK_SWAN → SCITT_OSS / FLEET → vector check. Hard stops: MEASURED stamp from a listing; key on RunPod, laptop, or MetaMask; collapse Art. 5 into governance; fill 7 financial empties; paywall /root; we graded every Hugging Face model; second writer of public/root.json.

# **13. Sources used in this playbook**

Living board and method: GET https://councilof.ai/api/gspc ; https://councilof.ai/gspc-scoreboard ; https://councilof.ai/os ; https://councilof.ai/mcp ; https://councilof.ai/api/xrpl ; GitHub CSOAI-ORG/councilof-ai ; Zenodo 10.5281/zenodo.21991104 and 10.5281/zenodo.21991105.

Hub record: https://huggingface.co/csoai and the gspc-\* dataset / Space family. Capability context: BenchAlign, Artificial Analysis, archived HF Open LLM Leaderboard methodology, ARC Prize results, AnotherWrapper ARC-AGI board (31 Aug 2026). Economy and agents: Anthropic Economic Index (June 2026 Cadences); ERC-8004 scans; hidorado/dorado; ERC-3643 Association. Humanoids: Counterpoint H1 2026; China MIIT 29-character ID; NVIDIA Isaac Sim / Isaac Lab / GR00T; \$10-\$25/hr pilots. Statistics: Wilson interval already in GSPC; McNemar paired test; arXiv 2605.30315. RWA public page: app.rwa.xyz/networks as_of 2026-08-30, Distributed \$38.40B / Represented \$380.88B, never summed. Companions: MASTER_ALL, SERIES_A, HF_GSPC_2000, SCALE_3M_FACTORY, GSPC_22_READY_FIN7, BLACK_SWAN, Completion Review. Do not fork doctrine.

# **14. Close**

The first-generation axes were the right shape. They were thin on n, thin on agent economy, silent on ARC-AGI, and empty on humanoids. The 2026 stack already contains the missing rails. This playbook does not invent the numbers those rails would need. It names the 2,000 moves that keep the board honest while those rails are wired into the seven empty slots and the declared overlay.

When a humanoid runs in Isaac Sim, test it against the same signed grammar. When an agent signs an ERC-3643 transfer, put the instrument on provenance-controls as a fact. When ARC-AGI-3 has a frozen gold-action key, bump the schema and keep the new pane UNMEASURED until a run exists. That is a completed GSPC: a vector you can recompute, not a story you have to retell.

**CSOAI Ltd · Measurement, not certification · 31 August 2026**
