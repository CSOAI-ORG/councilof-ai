# Council of AI — Watchdog metadata → pre-human SovSpace counterfactuals

**Research-only public source health + synthetic consequence graph, 24 November 2026. NOT a live incident feed, verified causal forecast, real-world event map, accepted human referral or production execution.**

## Purpose and experimentally falsifiable boundaries

The existing Council Watchdog workflow periodically probes a **bounded inventory of public source endpoints** (advisories, government, MITRE, model registries). A source answering HTTP 200 is not an incident, and its catalogue size is not the number of AI disasters. The canonical public snapshot carries 18 availability states and pinned response digests, but none of that establishes legal permission to copy individual incident reports.

SovSpace used to expose /sov-space, but the production source explicitly returns **HTTP 410 Gone**, retired August 2026. This research therefore builds an **unpublished renderer input** for a future approved CouncilOS plugin or world-view component. It does **not** resurrect a retired endpoint or falsely geolocate synthetic scenarios.

## Actual observed input

Master's public latest + index observed about 01:50 UTC on 24 November:

- `public/interop/watchdog-intake/latest.json`: run_id `20261121T165732Z`, `as_of=2026-11-21T16:57:32Z`.
- `public/interop/watchdog-intake/_index.json`: same run ID/as-of, 18 entries; all 18 reported REACHABLE. This means source status, **not 18 real incidents**.
- The Nov 23 daily Watchdog GitHub workflow **succeeded** and opened protected review PR [#4781](https://github.com/CSOAI-ORG/councilof-ai/pull/4781). The committed public pointer had not advanced at readback. Other agents also have a batching proposal [#4811](https://github.com/CSOAI-ORG/councilof-ai/pull/4811). Do not race these producers or bypass their review gates.
- Using the current reported observation time, `build_graph.py` verified the source index was about **57.09h old** (48h proposed max), emitted a graph and exited **3 = SOURCE_SNAPSHOT_STALE**, not green.

## Direct reuse, not another authority protocol

`build_graph.py` imports the existing canonical `measurement/experiments/assurance-fault-twin/fault_twin.py`. It **does not fork or duplicate** the actual production `csoai.evidence-event/0.1` or the existing HITL authority-effect profile.

The output has:
- One source status node per pinned input source, with only ID, status, digest, no raw report, reporter, user ID or copy of provider content.
- Ten separate **synthetic** counterfactual scenario nodes branching off a generic simulation root: no action; nominal permission; scope mismatch with and without enforcement; revoked authority with and without enforcement; idempotency replay blocked/unblocked; non-independent receipt; stale instrument.
- A not-staffed/unverified human authority gate, **no actual approval** and **no execution path**. Source signals do not connect causally to simulated outcomes: no invented "this incident was caused by X" narrative.
- Output is **31 nodes and 38 edges** for the observed 18-source input, 10 synthetic alternatives, 0 incident reports copied, 0 actual effects. No geographic pins, due to absent source coordinates. Any eventual globe front end must display simulation layers distinctly and refuse invented locations.
- Explicit source observation time, input SHA-256 and fail-closed mismatch alarms. These are integrity identifiers, not a signature or receiving-party attestation.

## Reproduce from canonical source

```bash
python3 measurement/experiments/watchdog-consequence-graph/test_build_graph.py

python3 measurement/experiments/watchdog-consequence-graph/build_graph.py \
  --latest public/interop/watchdog-intake/latest.json \
  --index public/interop/watchdog-intake/_index.json \
  --as-of 2026-11-24T01:50:00Z \
  --output /tmp/watchdog-source-only-synthetic-graph.json
```

Use a fresh explicit UTC observation time if running later; old `as-of` is a reproducibility example, not permission to re-date source evidence.

Exit codes:
- 0: matching source/index, within declared 48h *source observation* age; simulation remains synthetic.
- 3: source snapshot **STALE**; artifact retained for operator inspection, not publishable as a fresh-source world view.
- 4: source/index hashes/shapes/timestamps or canonical fault twin **UNCHECKABLE**, no evidence claim.

The workflow `.github/workflows/watchdog-counterfactual-graph.yml` is proposed for bounded daily read-only runs **after merge**. If stale, the run fails and retains a diagnostic artifact. This is not a daily physical-world incident simulator until reviewed incident records exist with rights and causal mapping methods.

## Scientific extension: from hypothesis to an authorised response

1. Review source-specific **record** use rights, not only page access. Existing Watchdog registry keeps AIID, OECD AIM, AVID and AIAAIC adapters restricted pending individual rights review. Commercial use of AIAAIC content is explicitly limited: no unlicensed ingestion.
2. Create a separate privacy reviewed public incident corpus, source version, corroboration/disagreement, classification error and reference annotation process. Never silently equate a vulnerability catalog with an AI harm record.
3. Map source-qualified, *reported* incidents to a bounded causal fault tree **after human scientific/technical review**. Provide alternative hypotheses; run no-action / mitigated / failed-response branches with sensitivity and uncertainty.
4. Show observational world data, simulated worlds, and unknown places as three distinct layers in the new CouncilOS/SovSpace adapter. Preserve identities and geolocations only if explicitly authorized and externally sourced.
5. For action beyond simulation, obtain an accepted human reviewer with actual delegated scope, a qualified tool executor and recipient-owned before/after state. Use the existing Council event schema; sign only valid exact-byte evidence; no artificial x402 micropayments.
6. Measure actual false-alarm and reviewer workload costs, rights/custody, build and storage costs, source freshness, and effects **separately**. Passing 20 unit tests is not an independent scientific evaluation.

## Wider reference materials

- Existing [Council Watchdog source registry](../../../data/watchdog/source-registry.json) and [source-rights boundary](../../../docs/watchdog/incident-signal-layer.md).
- [NASA ASRS](https://asrs.arc.nasa.gov/search/database.html): human near-miss reports **not independently verified**; historical feedback loops can inform classification and dissent.
- [NTSB data](https://www.ntsb.gov/safety/data/pages/Data_Stats.aspx) and [NASA PCoE](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/): source and simulation distinctions.
- [MITRE ATLAS](https://github.com/mitre-atlas/atlas-data), [OECD AIM](https://oecd.ai/en/incidents-methodology), [NIST AI RMF](https://airc.nist.gov/airmf-resources/playbook/measure/), and [OpenTelemetry Events](https://opentelemetry.io/docs/specs/semconv/general/events/).

The next acceptance state is **source-pinned and falsifiable**—not "all scenarios in the world modelled." 
