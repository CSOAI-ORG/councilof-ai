# Normalised NeMo trace import: strict decisions and truthful controls

9 November 2026. Review candidate only. No production deployment, model execution,
new measurement, signing or training is claimed. This changes the existing importer,
not the upstream NVIDIA runtime or the canonical evidence schema.

## Scope and source

Base: `fc016f531b913f0f04a18430825f46e67e2c4ce0`.
Original importer blob: `3ad507b0e990052c2a6e65d1457e4faee1c0f466`.
Unchanged canonical event module: `7fa0d64ea0a02e322ac72dab446c2b2345d0844f`.
Both local preimages were checked against those Git blob identities before testing.

This importer consumes Council-normalised `turns`, `expected_action` and
`activated_rails` records. That contract is NOT arbitrary native NeMo Guardrails
SDK output. Native logging needs an explicitly qualified mapping before using it.
No provider, SDK, GPU, real human, secret or payment is needed for these tests.

## Reproduced defects

The original importer converted every decision outside its blocking labels into
`allow`. Synthetic `ERROR` and boolean false decisions could consequently produce
CONSISTENT/allow events. Missing or unrecognised expected actions also defaulted
to allow. A conflicting decision/status pair silently preferred one side, while
non-object rail members were skipped and could make results depend on their order.

Its negative-control record always reported DIVERGENT. When the original trace
was divergent and the mutated trace actually matched the declared action, that
was the wrong control result. The helper called `flip_one_rail` could change all
blocking rails, not one. Missing upstream versions were invented as 0.11.0, and
the local recount method was attributed to the upstream software version/holder.

## Correction

- Explicit allow or the existing block/refuse/stop/reject aliases only. Unknown,
  conflicting or non-string decisions never become implicit permission.
- Absent/null/empty runtime traces remain UNMEASURED. Malformed supplied traces
  or an unavailable expectation become UNCHECKABLE, with null value and no
  invented control result. A supported observation may remain visible without
  pretending its comparison expectation was established.
- The aggregate-outcome control operates on a copy and reports its actual
  relation to the expectation. The legacy helper name is retained only as a
  documented compatibility alias. Disabling the control yields
  NOT_DISCRIMINATING, not a successful comparison.
- The local recount has method version 0.2.0 and holder csoai. Source-reported
  NeMo version is separate; absence remains absence.
- Bounded input, strict JSON, duplicate-key and non-finite JSON rejection,
  explicit normalised envelope, unique turn IDs and offset-aware read times.
  CLI validation finishes before any event line is emitted.

These events remain unsigned `csoai.evidence-event/0.1` categorical observations.
They do not authorise execution. Existing signed events are not edited or
regenerated, and no board score or charter mapping changes.

## Actual offline qualification

At 2026-11-09T08:49:23Z-08:49:28Z, Python 3.13.5 ran **41 unittest methods**, all
successful. Three of those methods mutate temporary implementation copies:
unknown labels becoming allow, missing expectation defaulting to allow, and
fabricated negative-control reporting. Each weakened copy fails the intended
assertions, not an import or syntax error.

Test log SHA-256:
`966268f4cb9c8d83303a1e7098120f4663fe94ab6504eefeeeb0d89cdb52d5cb`.

Reproduce from the repository root:

```sh
python3 -B -m unittest discover -s packages/evidence-fabric/tests -p 'test_nemo_guardrails*.py' -v
python3 -B -m unittest discover -s packages/evidence-fabric/tests -p test_global_and_nvidia_ingest.py -v
```

The first command was run in this scoped local candidate. The second inherited
renderer/global-ingest suite was not available in the sparse local test tree;
its current-head hosted execution remains required. The new ordinary Vitest
bridge invokes both through the existing scripts test discovery and refuses a
zero-test success. No workflow, scheduler or dependency is added.

## Existing-owner acceptance

The evidence-import owner should review changed unknown/malformed semantics and
the method-version change; downstream renderers must accept UNCHECKABLE/null.
The existing NeMo provider and Cosmos work remain separate and untouched. An
imported rail record is not evidence of native execution, numeric logits health,
model improvement, human approval or an observed business effect.

The release owner retains protected review, merge and deployment. This document
is a handoff, not another owner's acknowledgement. No upstream reply is sent,
and no production repair, independent acceptance or financial value is inferred.
