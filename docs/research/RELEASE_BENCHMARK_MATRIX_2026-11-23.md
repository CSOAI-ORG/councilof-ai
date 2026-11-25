# Council of AI — external + internal release evaluation matrix
Date: 2026-11-23. Status: **implementation plan plus one executable post-deploy public behaviour diagnostic**, not an independent certification.

## Ground rule

A test is evidence only of the property it actually challenged, for the exact
source revision, fixture, execution environment and run timestamp. A successful
unit test does **not** prove a deployed route; a 200 does **not** prove content
correctness; a published proof does **not** demonstrate human approval, payment,
external acceptance or Byzantine consensus.

The release proof chain must distinguish:
source revision -> protected CI -> deployed commit -> live capability declarations
-> live handler output -> independently checked source/evidence -> recipient acceptance.
A missing link is `UNCHECKABLE`, not `PASS`.

## Benchmark families (third-party guidance is not third-party endorsement)

| Source | What to apply | Council-specific acceptance | Current status |
| --- | --- | --- | --- |
| [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) | Broken object/property authorisation, security misconfiguration, unbounded consumption | Deny confidential data in reversible A2A/x402 task IDs; fail-closed private data routes; no implicit tool authority | Proposed in [PR #4738](https://github.com/CSOAI-ORG/councilof-ai/pull/4738), not independently certified |
| [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/) and [2026 LLM Top 10](https://genai.owasp.org/llm-top-10/) | Excessive agency, tool misuse, prompt injection and inter-agent trust abuse | Simulated forged authority, hostile tool arguments, unrestricted host execution; prove **zero dispatch** for refused calls | MEOK hardening in [PR #4706](https://github.com/CSOAI-ORG/councilof-ai/pull/4706), not yet released |
| [MITRE ATLAS](https://atlas.mitre.org/) | Threat/technique taxonomy for adversarial AI scenarios (not an off-the-shelf pass/fail benchmark) | Version and map selected techniques to reproducible attack fixtures, mitigations and negative controls | Mapping proposed; no ATLAS evaluation run claimed |
| [UK AISI Inspect AI](https://inspect.aisi.org.uk/) and [Inspect Evals](https://ukgovernmentbeis.github.io/inspect_evals/) | Reproducible model/agent evaluations with datasets, scorers and runs | Frozen datasets, held-out prompts, provenance of model version and tool traces; independent evaluator repeat | Candidate external harness; not run in this PR |
| [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) | Govern / Map / Measure / Manage risk disciplines | Separation of evidence, recommendations, authenticated human decision and observed effect | Control mapping only; not NIST approval or conformity |

## Council-owned executable release tests

`scripts/live-behaviour-guard.mjs --selftest` has **1 positive fixture +
9 deliberate negative controls**: unavailable endpoint, malformed response,
wrong schema, false row count, mismatched published source, inconsistent GSPC
totals, nondeterministic repeat, nonexistent endpoint incorrectly returning 200,
and a broken HEAD path. No live mutation occurs.

`scripts/live-behaviour-guard.mjs` makes safe, bounded read-only calls to:
- `GET /api/institutions` (and `HEAD`), checking published status/schema;
- `GET /interop/institutions-register.json`, comparing source rows, as-of and row count;
- a second institutions GET, checking deterministic exact body bytes;
- `GET /api/gspc`, checking the schema and derived axis totals;
- `GET /api/__csoai_release_probe_unimplemented__`, requiring a genuine 404.

This is a **regression sentinel**, not blanket coverage of the 331-item
capability catalogue or a replacement for signed-root verification.
The post-deployment source guard is added to the protected
`.github/workflows/deploy.yml` in [PR #4704](https://github.com/CSOAI-ORG/councilof-ai/pull/4704).
Following gateway review on 24 November, the behaviour observation runs in a
separate diagnostic job after a successful build-deploy. A mismatch or unavailable
source must remain visible as NOT PASSED, not a false green evidence result;
it must not interrupt fleet-lock, mirror or outward-claims checks. The blocking
capability parity gate and offline fixture gate remain unchanged. Prevention
before production still requires protected PR tests, a preview environment
and safe rollback policy.

## Required layered campaign

1. **Unit + property/metamorphic:** same inputs -> same outputs; one changed
   record -> relevant digest changes; invalid identities/seats/epochs -> refusal.
2. **Adversarial security:** inject synthetic secret strings and forged task
   IDs; prove no log/ID disclosure, no upstream call and no authorisation grants.
3. **Integration:** HTTP/MCP/A2A contracts and exact registry parity, plus real
   HTTP handler behaviour. Do not equate discovery and execution.
4. **Reproducibility:** freeze code commit, external dataset commit/hash,
   model version, harness version, random seed, setup and output checksums.
5. **Independent scoring:** blinded hold-out, contamination checks, independent
   operator replay; display sample size and uncertainty, not just pass ratio.
6. **Operational verification:** verify source root, timestamp, provenance,
   independent witness and recipient acceptance separately. No bypass for
   an unavailable signer or human reviewer.
7. **Publication:** show exact tests, failed controls, coverage gaps and
   distinctions between PASSED, FAILED, UNCHECKABLE and NOT RUN.

## Acceptance boundary

A green live behaviour sentinel means **the sampled public read-only paths
worked when queried**. It does not establish continuous uptime, all tool
permissions, robustness across every adversarial benchmark, independent
GSPC grading, authenticated H.I.M. quorum, payment settlement, or customer
acceptance. Keep all those measures separate in the Living Signal Plane.
