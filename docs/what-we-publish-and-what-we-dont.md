# What we publish, and what we don't

Council of AI is built on one promise: **check us, don't trust us.** For cleared
public verification artifacts, everything a third party needs to independently
*verify* the published bytes and signatures is public and free.

Being honest about verification also means being honest about boundaries: rights,
confidentiality, and trade secrets govern what can be published, and different
artifacts carry distinct verification profiles:

- **Publicly reproducible measurements** — frozen gold banks and deterministic
  grader rules where third parties can re-run the grader on public inputs.
  No LLM-as-judge scoring is introduced by this policy.
- **Byte-verifiable artifacts** — Ed25519-signed cards and content-addressed
  snapshots (`did:web:csoai.org`, `GET /api/assess/key`, `GET /api/gspc`) whose
  published bytes and signatures can be checked offline.
- **Controlled verification** — evaluations involving third-party, licensed, or
  confidential material where verification happens under controlled access rather
  than unconditional public redistribution.
- **Unsigned supporting evidence** — local research observations, intermediate
  diagnostics, and unsigned supporting evidence that are explicitly labelled as
  such and never represented as signed credentials.

## Explicit boundaries

- Existing licences and upstream notices remain unchanged.
- A hash or signature establishes neither ownership nor permission to publish.
- The API is evidence to inspect, not an automatic adjudicator.
- Do not use customer material to train or improve a shared system without the required permission.
- This document is not an implemented access-control or release-enforcement gate.

## What we withhold or control

- **Model-tuning methods** — fine-tune weights, adapters, training data, and
  training recipes (including internal fix_loop / QLoRA specifics).
- **Gold-bank construction method** — *how* we build and curate the banks.
- **Internal architecture research** — early-stage synthesis and system
  internals that are not part of a cleared public measurement.
- **Production infrastructure** — private pod/host addresses, ports, endpoints,
  and internal keys.

## Decision rule (`HOLD FOR REVIEW` by default when uncertain)

| Case | Action |
| --- | --- |
| Cleared public verification material | Existing release review |
| Unknown rights or confidentiality | Hold for review (`HOLD FOR REVIEW`) |
| API/document contradiction | Record and reconcile the versioned conflict |
| Protected input required for reproduction | Qualify or withhold the public-reproducibility claim |

Verification of public artifacts remains free and loginless. We measure, we sign
where applicable, we state our claim boundaries — and anyone can check the
published evidence.
