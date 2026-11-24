# MEOK × Council GSPC — source-only, independent-route health and freshness readback

**Observed 24 November 2026, around 00:56 UTC; research/operator diagnostic, not a claim of deployed authority or verified downstream effects.**

## Why this matters

A MEOK health status of `ok` is a **liveness claim**, not a current GSPC measurement, independent executor authorisation, valid human decision, or receiving-party verified effect. This distinction matters for the Council's source/evidence release process and its operational heartbeat.

Read-only M4 checks confirmed that:
- the local MEOK MCP spine replied HTTP 200 (`status=ok`, self-reported version `0.3.0-m4-spine`);
- the direct local MEOK API and H.I.M. Studio health endpoints **each separately replied HTTP 200**, instead of merely trusting their status recorded inside the MCP spine wrapper;
- the live public Council `https://councilof.ai/api/gspc` endpoint replied HTTP 200, declared schema `csoai.gspc-axes/0.5` with 34 visible axis objects;
- nevertheless the spine's `awareness.generated_at` and `awareness.gspc_spine.observed_at` were **2026-11-13T02:20:05.658118Z**, about **262.6 hours old** when observed, not a fresh Council measurement.

The M2 read-only check reached the public GSPC board but did **not** reach a local MEOK spine on its own loopback port. This is a per-machine availability observation, not proof of an M4 failure.

## Implemented repeatable instrument

`scripts/meok_gspc_health_readback.py` is a standalone standard-library, source-only observer.

- Performs only **GET** requests to the exact public GSPC endpoint, the local MEOK spine, and loopback sub-service URLs validated against strict allowlisted paths. No arbitrary remote URL, embedded credentials, query strings, admin paths or tool actions.
- Has explicit UTC cut-off and a configurable awareness-age policy (default **24h**). The reported source timestamp is never overwritten to conceal staleness.
- Separately records HTTP-observed availability, source-declared GSPC awareness age, locally returned SHA-256 source identifiers, and source-declared public axis count.
- A source digest identifies the bytes received, not who authored them, whether they are scientifically correct, or whether any independent person reviewed them.
- Reports `GSPC_AWARENESS_STALE`, `SPINE_UNCHECKABLE`, `COMPONENT_UNCHECKABLE`, `PUBLIC_GSPC_UNCHECKABLE`, `SOURCE_CLOCK_UNCHECKABLE` or bounded recent-source state, with **no automatic remediation**.
- Always states actual executor authority, accepted human authority, independent recipient effect and calibration **not verified**. An HTTP 200 is not a delegated decision.

### Reproduce locally, source-only

```bash
python3 scripts/test_meok_gspc_health_readback.py
python3 scripts/meok_gspc_health_readback.py \
  --as-of 2026-11-24T00:56:00Z \
  --output /tmp/meok-gspc-readback.json
```

Use the real observation time when running the command later; the printed date above is a reproducibility example, **not** a valid cut-off to reuse for a later measurement.

The reporter outputs only a qualified, privacy-minimised summary; raw health endpoint content is neither published nor copied into the repository. Use an approved private incident register for confidential service details.

## Tested results and release boundary

- **18/18 tests passed on each of M4 and M2** (same code on two machines is repeatability, not an independently calibrated laboratory).
- Live M4: **four direct source endpoints reachable**, `GSPC_AWARENESS_STALE`, awareness age ~262.6h, 0 external effects verified.
- Live M2: public GSPC reachable, no local MEOK spine; `SPINE_UNCHECKABLE`, 0 external effects verified.
- This is a diagnostic **source-only** report, not MEOK production authority acceptance, H.I.M. approval, consent, BFT quorum, GSPC official measurement, root ceremony, commercial sale, third-party audit or external recipient verification.

## Next owner actions (human approval or service ownership needed)

1. Identify the owner and source manifest used to construct the stale GSPC awareness snapshot on M4; check whether its measurements themselves remain valid, not just whether the cache can be refreshed.
2. Compare a freshly retrieved *source observation* against that manifest, retaining historical measurement times and exact hashes; only an authorised operator may update the running cache after reproducibility/privacy review.
3. Inspect the actual MEOK executor's authorisation, scope, revocation and replay checks with approved isolated positive/negative controls. The health endpoints do not establish these.
4. Confirm H.I.M. accepted-human review competence and delegated authority, not simply web-page availability.
5. Obtain a customer-controlled receiving system and approved bounded pilot to validate the entire authority → effect → independent receiver chain, with dissent/failures and no fake settlement.
6. Integrate the **qualified result only** into CouncilOS operator status once a reviewed source/permission contract exists. Do not publish M4 private service health payloads or grant a release from a stale source.

This item is aligned via an evidence comment on existing MEOK–Council handoff [PR #4703](https://github.com/CSOAI-ORG/councilof-ai/pull/4703). The daily organisation heartbeat [PR #4788](https://github.com/CSOAI-ORG/councilof-ai/pull/4788) is GitHub-source-only; it cannot by itself inspect the private M4 service. The synthetic effect fault tree [PR #4791](https://github.com/CSOAI-ORG/councilof-ai/pull/4791) remains separate from live evidence.
