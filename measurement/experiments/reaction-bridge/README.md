# Reaction bridge: measured vs simulated × with vs without
**Status:** research adapter only. Existing owner-controlled systems remain authoritative. No runtime consumer is wired by this branch.

This small dependency-free module does NOT create evidence, grant human authority, verify signatures, retry a job, call an agent, emit a claim, run a model, update GSPC or introduce a schedule. It validates a proposed *read-only* cross-product handoff and identifies absent stages. The output is never a public qualification.

## Fit with existing architecture
- **GSPC / Layer-0:** supplies independently authenticated method and evidence references; this adapter holds only hashes and *reported* statuses, not new scores.
- **MEOK / Harness X:** executor eligibility and returned artifacts must be checked by their existing authority owners. A reported digest cannot grant permission.
- **SovSpace / ProofOf:** world A vs world B use a frozen input and bank; simulation MUST stay SIMULATED and cannot enter the Council public measurement stream.
- **H.I.M. / CouncilOS:** display the missing stages and human review requirements; an avatar, model vote or stored shared token cannot count as real approval.
- **Claim Maintenance:** changed/corrected evidence can prompt an *advisory* review reaction through the already existing claim-reactions and bounded recheck-schedule pathway.
- **x402 / public verifier / distribution:** retrieval, payment, acceptance and repeat use are independent stages, not substitutes for effect verification.
- **Browser / plugin / MCP:** they could render only this read-only report after owner qualification and privacy review; there is no new endpoint here.

## Two test surfaces
1. `evaluateEpisode(episode)` accepts a bounded source-pinned request with explicit simulation vs observation realm and optional stage receipt digests. Returns missing stages and a classification that never confers human authority.
2. `compareSyntheticPaired(rows,control,treatment)` compares *identical* synthetic tasks with and without human information, rejects input/bank drift or unpaired task variants, and makes no causal or real-world claim. It does not replace the existing richer `human_information_factorial.py` study.

Run without dependencies: `node --test measurement/experiments/reaction-bridge/reaction-bridge.test.mjs`.

## Qualifying a real workflow requires more
Qualified independently retained source/bank provenance, valid actor credentials, actual authorized approval, executor eligibility, real output, observed effect, independent receiving-party verification and privacy/rights checks. There is no automated acceptance transition. Report the original task, method, executor response, signed/unsigned artifact, recipient delivery, payment and actual return use separately.

### Proposed next experimental work (not executed)
1. Reserve rights-cleared holdouts, preregister paired seeds, negative controls and expected failure thresholds.
2. Use the **existing** GSPC/HIM/SovSpace instruments for no-human vs irrelevant-human vs relevant-human intervention, not another simulator.
3. Add STPA/FMEA hazard graph mapping on existing failure cases; compare detection delay, false alarms and intervention error.
4. Independently validate observable outcomes before asking an owner to wire the read-only panel/browser/plugin views.

External method references: NIST TEVV-Athlon https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems ; W3C PROV-O https://www.w3.org/TR/prov-o/ ; OpenLineage https://openlineage.io/docs/spec/facets/ ; OTel GenAI https://opentelemetry.io/docs/specs/semconv/ ; STPA https://www.mit.stamp-institute.com/tools .
