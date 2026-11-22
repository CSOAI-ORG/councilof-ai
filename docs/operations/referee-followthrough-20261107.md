# Referee continuation: content continuity, export boundaries and adoption

**7 November 2026 — source published for review; not a production release.**

This continues #4021 and #4029. It does not create another engine, signed ledger, case store, reviewer roster, release path or scheduler. The exact source/test receipts are in `referee-followthrough-20261107.json` beside this document. Nick retains protected merge/closure; signing and release ownership are unchanged. Upstream replies and submissions remain held.

## Two reproduced gaps, corrected in the existing renderer

1. **Capture freshness was not separated from content continuity.** Changing only `claim.read_at` legitimately changed five canonical event IDs and yielded five new/five removed observation references, but the view had no separate unchanged-content signal. Revision 2 preserves those exact observation IDs and adds a derived content comparison that excludes only event ID, signature/anchor wrappers and capture time. The same fixture now yields five carried content references and zero new content. Source digests, methods, result state, effect/expiry times, limitations and correction lineage remain part of content identity. This is not a semantic-equivalence detector, and its key must never substitute for an approval scope, validity window or canonical event ID.
2. **Arbitrary charter metadata was copied into the output.** A synthetic sentinel in an additional charter field appeared in the old view. Revision 2 projects only version, digest and mapping kind and rejects nested/non-scalar version/snapshot values. This closes the reproduced export route; it is not a universal privacy or redaction claim.

The existing 36 projection tests are unchanged. Eighteen continuity/export regressions and two deliberately broken-copy controls bring the scoped suite to 56. Both mutations fail the intended assertion, rather than failing to import or parse. The 20-case dependence-instrument suite and three finite topology cases were rerun concurrently with the projection suite. Repeated runs do not count as independent evidence. No model, provider, human-identity or paid service was invoked.

## Hosted qualification is now connected

The prior head's 17 hosted checks were green, but the explicit test list in `.github/workflows/evidence-handoff-checks.yml` omitted the referee-projection suite. The existing `offline-contracts` job now runs:

```sh
python -B -m unittest discover -s packages/evidence-fabric/tests -p 'test_axis_referee*.py' -v
```

Permissions, schedules, other jobs and their tests remain unchanged. Read the final commit's actual CI result; neither the previous green head nor this document is a result for a later head.

## Exact retained-index exercise

The unchanged index from `01b10c7e551d9a217250f73c1b8c68c0ca444675` has SHA-256 `99b675260be323284e441a8782931c930ef1c0ae86b366a377b32365b84d5586`. Its underlying board snapshot is 2 November, not a fresh model run.

Five previous observations plus two new code-regression observations produce seven distinct event references across seven relevant axes, preserving all 34 rows, their charter references and HOLD. The other 27 axes have no linked observation in this scoped set; they are not passed. Replaying the exact seven events produces seven carried content references and zero new content. Signed historical bytes, charter text, canonical event implementation and board measurements were not edited. The timestamp-only renewal is a separately labelled synthetic control, not a fresh source read.

## Existing-owner joins; no competing lane

| Existing surface | Reuse and precise next acceptance |
|---|---|
| #4021 instrument | Review strict inputs, partial/null consumers and descriptive-statistic semantics; do not use statistical n_eff as an authenticated quorum. |
| #4029 axis review | Adopt the pure renderer under the existing producer with an owner-selected retained baseline. A caller-supplied baseline is bound, not authenticated. |
| #4027 report-grounded practice | Preserve the practice's exact report revision. Content continuity can inform a change notice but must not bypass its stale-source hold or rebind answers silently. This lane does not modify #4027. |
| Existing daily archive / Atlas | Keep source time, observation time, report time and content identity separate. Ingest only through the current owner after adoption; no schedule changed here. |
| Existing OpenShell-to-OTel exporter | Reuse canonical events and existing policy/source digests. Qualify a receiver preserving those fields; do not make another telemetry schema. |
| Existing `packages/trace` | It explicitly remains a software stub with hardware evidence uncheckable. Bind real workload/attestation evidence before changing that state. |
| Runtime / human authority | Enrol an actual authorised principal and independent receiver; verify scope, current epoch, expiry, revocation, one-use dispatch and observed effect. No automated test appoints or authenticates a human. |
| Release / signing | Normal protected CI and owner merge, then exact public-byte readback. PR publication is not deployment and a signature is not correctness. |

At the readback before this continuation, #4021 and #4029 had no review comments. This document is a handoff, not evidence another owner accepted it.

## Research connections and falsifiable product hypotheses

These are proposals grounded in the named sources, not implemented runtime features or adopted standards.

### Evidence-conditioned memory, not merely a larger memory store

Anthropic's 6 November article describes selective persistent memory and offline consolidation while distinguishing memory from weight updates: https://www.anthropic.com/research/components-of-agent-memory

MEOK's opportunity is to retain a rule with its evidence, configuration and invalidation conditions. Test no memory, ordinary memory and evidence-conditioned memory on the same held-out tasks with changed tools, contradictory sources and expired permissions. Predefine success/error rates, abstention, latency and reviewer effort; randomise order. Reject the commercial hypothesis if the control overhead does not improve useful outcomes. Today's renderer makes capture-only rereads distinguishable from changed content; it does not implement this full learning experiment.

### Portable evidence in existing observability tools

The official OpenTelemetry registry points GenAI conventions to their dedicated evolving repository: https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/

The estate already has an OpenShell-to-OTel example and optional policy-provenance export. Reuse it. The next qualification is exact receiver readback of policy/source/configuration references, including missing-data controls. The historical collector demonstration is not fresh receiver acceptance for later fields or another backend. A potential buyer is a team operating agents across several runtimes; paid demand remains untested.

### Workload identity plus actual consumption evidence

SPIRE attests nodes/workloads and issues identities under a trust domain: https://spiffe.io/docs/latest/spire-about/spire-concepts/

The 3 November 2026 preprint *Bilateral Protection for Private LoRA Inference with Intel TDX* connects attested application identity and TLS binding to actual adapter consumption: https://arxiv.org/abs/2611.04311

Inference: this is a useful future connection for the existing TRACE placeholders and authority-effect profile. Neither distinct SVIDs nor a hardware quote establishes organisational referee independence or semantic correctness. The paper's CPU/TDX results are its scoped reported experiment, not a performance forecast for our fleet. No hardware, protected inference or secret release was performed here.

## Commercial qualification, not a valuation

Prioritise one externally reproduced workflow over more catalogues: an outside team uses the existing integration, can reject defective evidence, verifies an authorised harmless effect, and accepts the retained result. Record measured integration effort, investigation time, failure/abstention rates and actual repeated use. A paid renewal is a separate business event. No report count, test count, package download or signature is converted into customers, exclusive IP or monetary value.

The hypotheses can be tested with the existing memory, practice, event and execution layers. No new token, second operating system or hardware programme is required to test the software case. Photonic/CPO experiments remain separately calibrated hardware research, not evidence of software-referee independence.
