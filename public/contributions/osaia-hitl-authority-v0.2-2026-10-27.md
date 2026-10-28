# A claim that is not current is not authority to act — and an approval bound to a current authority record

**Prepared contribution to the Shared AI Findings Exchange (SAFE)**
Open Secure AI Alliance, under the Linux Foundation

CSOAI Ltd (Council of AI) · 3rd Floor, 86-90 Paul Street, London EC2A 4NE
27 October 2026 · nicholas@csoai.org · https://councilof.ai
Canonical location of this citable form: `https://councilof.ai/contributions/osaia-hitl-authority-v0.2-2026-10-27.md`

**Status: prepared, not submitted.** Nothing in this document has been submitted to the Open Secure AI
Alliance, and nothing here states or implies that the Alliance has adopted, endorsed, reviewed or
agreed with any of it. This is our own working position, published so that it can be read, cited and
disagreed with. We measure; we do not certify, and we do not speak for the Alliance.

---

## 1. The question this answers

On issue **#72** a counterpart asked for two things to be made checkable rather than asserted:

1. **Watch states must be explicitly non-authorizing.** A claim that is stale, due for retest or
   unmeasured must not be able to back a consequential execution.
2. **An action release must be bound to a current external authority record** — carrying the
   operational baseline, the scope, the authority epoch and validity window, the expiry and the
   revocation state.

Our own candidate record schema already had the vocabulary for all of it (`CURRENT`, `RETEST_DUE`,
`STALE`, `UNMEASURED`, `NOT_WATCHED`; `authority_epoch`; `scope_digest`; `expires_at`;
`revokes_decision_id`) and the two bindings were **not** enforced. The words were there; the
constraint was not. This document is the constraint, with an executable test attached.

## 2. What the gap was, precisely

`hitl-authority-effect-v0.1.schema.json` carried `claim_maintenance.watch_state` and an
`authority` block, and nothing connected them. The following record therefore validated under
v0.1:

```json
{
  "authority":   { "decision": "APPROVE", "...": "..." },
  "invocation":  { "state": "EXECUTED", "...": "..." },
  "claim_maintenance": { "watch_state": "STALE" }
}
```

A live approval, an executed action and a claim known to be stale, in one record, with nothing
objecting. That is the shape the counterpart was pointing at, and it was true of our schema.

## 3. The two bindings, now enforced

### 3.1 A claim that is not `CURRENT` does not authorize

`STALE`, `RETEST_DUE`, `UNMEASURED` and `NOT_WATCHED` are non-authorizing. Concretely:

| Rule | v0.2 |
|---|---|
| A live (`ACTIVE`) authority release may not rest on a claim that is not `CURRENT` | rejected |
| An `APPROVE` decision requires the claim to have been `CURRENT` **at the decision** | rejected |
| An `EXECUTED` invocation requires the claim to have been `CURRENT` **at the invocation** | rejected |

The decision-time and invocation-time states are separate fields from the live watch state
(`watch_state_at_decision`, `watch_state_at_invocation`). That is deliberate: **a claim that goes
stale after a historical execution must not force that history to be rewritten.** The release is
marked no longer live (`SUPERSEDED`, `SUSPENDED`, `EXPIRED`, `REVOKED`) and the record keeps the
watch states that were true at the time. Failing closed does not mean falsifying the past.

### 3.2 An `APPROVE` is bound to a current external authority record

The authority block must now carry, and the schema rejects an `APPROVE` without:

| Field | What it is |
|---|---|
| `operational_baseline` | the state of the subject and its dependencies the decision was taken against — a digest and the time it was observed |
| `scope_digest` | the scope the authority covers |
| `authority_epoch` | the version of that authority |
| `validity_window` | `not_before` / `not_after` — the window, and the expiry |
| `release_state` | whether this release is still live |
| `revocation_state` | `NOT_REVOKED` / `REVOKED` / `REVOCATION_UNKNOWN` |
| `external_record_ref` + `external_record_digest` | the external authority record this release is bound to |

`REVOKED` **and** `REVOCATION_UNKNOWN` both fail closed: an unknown revocation state cannot
support an approval.

## 4. The test, and its negative control

`docs/standards/osaia-safe-reverification/test_hitl_authority_effect_v0_2.py` — 39 checks:

```
PASS 3 must-pass; 29 must-fail; 4 negative controls (v0.1 accepted what v0.2 rejects); 3 temporal checks (39 total)
```

The negative control is the part worth reading twice. **Every record v0.2 rejects for the two
reasons above is also run against v0.1, and v0.1 accepts it** — including an `APPROVE` with an
`EXECUTED` invocation beside a `STALE` or `UNMEASURED` claim, and an `APPROVE` with no external
authority record binding at all. If v0.1 rejected them, the gap was never a gap and the new
controls would prove nothing. A control that can only pass proves nothing; this one was shown
failing, and it is shown failing here.

Timestamps are the one thing JSON Schema cannot compare, so the validity window, the decision
time, the invocation time and the observation times are enforced by a reference checker in the
same file. Those rules remain consumer requirements in the profile text; the test makes them
executable.

## 5. What this does not do

- It does not adopt anything, endorse anything or certify anything. The Alliance has adopted
  none of it.
- It does not authenticate the principal, resolve the external authority record, or prove that
  the reviewed scope actually executed. Those remain consumer requirements, and a consumer that
  does not implement them gets nothing from this schema.
- It does not make a claim into an authority. A current claim is a **precondition** on an
  authorization, never a substitute for one, and never an enlargement of one.
- The record is vendor-neutral: no GSPC, OpenShell, OpenBMC or LFX is required.

## 6. Where to read it

| Artefact | Path |
|---|---|
| Schema (new) | `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.schema.json` |
| Schema (superseded, bytes preserved) | `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json` |
| Conforming example | `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.example.json` |
| Executable test | `docs/standards/osaia-safe-reverification/test_hitl_authority_effect_v0_2.py` |
| Profile note | `docs/standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md` |
| Binding note | `docs/standards/osaia-safe-reverification/SAFE-HITL-CLAIM-MAINTENANCE-BINDING.md` |
| Plugin binding (new / preserved) | `csoai-alliance-control-plugin-v0.3.json` / `csoai-alliance-control-plugin-v0.2.json` |

Repository: `https://github.com/CSOAI-ORG/councilof-ai` (the `docs/standards/osaia-safe-reverification/`
directory). The v0.1 bytes are preserved unchanged and carry a dated supersession note; superseding
is a new record, never an edit of history.

Licence: Apache-2.0, as the rest of this module.
