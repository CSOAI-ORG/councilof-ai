# What we publish, and what we don't

Council of AI is built on one promise: **check us, don't trust us.** Everything a
third party needs to independently *verify* a published measurement is public,
free, and reproducible. That is the whole point of the project, and it will never
change.

Being honest about verification also means being honest about the other half:
like any measurement body, we hold some trade secrets. Hiding *that* we hold them
would itself be a form of dishonesty. So here is the exact boundary.

## What we publish (everything needed to verify a result)

- **Frozen gold banks** — the exact instruments a system is run against.
- **Deterministic grader rules** — the scoring is rule-based on frozen banks.
  No LLM-as-judge, no invented scores. You can re-run the grader yourself.
- **Signed measurement cards** — every result is an Ed25519-signed, offline-
  verifiable credential (`n_cards == n_cells`).
- **The public verification key** (`did:web:csoai.org`, and
  `GET /api/assess/key`) so you can check every signature without us.
- **The live board** — `GET /api/gspc` and `GET /api/arena/scoreboard`
  (with `?verify=1` to recompute `sha256(canonical body)` and compare).
- **The methodology** — the white paper and DOI, canonical-JSON rules, and the
  step-by-step HOW-TO-VERIFY.
- **UNMEASURED is first-class** — gaps are published with their `n` and limits,
  never hidden or invented.

If this page and `GET /api/gspc` ever disagree, **the API is right.**

## What we don't publish (the edge — never needed to verify a result)

- **Model-tuning methods** — fine-tune weights, adapters, training data, and
  training recipes (including our self-improving fix_loop / QLoRA specifics).
- **Gold-bank construction method** — *how* we build and curate the banks. The
  frozen banks themselves are public (you need them to verify); the curation
  recipe is not.
- **Internal architecture research** — early-stage synthesis and system
  internals that are not part of any published, verifiable measurement.
- **Production infrastructure** — private pod/host addresses, ports, endpoints,
  and internal keys. None of this is needed to verify a card: verification uses
  only the public key and the published bytes.

## The test we apply

For any artifact, we ask one question: *does a stranger need this to reproduce or
verify a published card?*

- **Yes → it stays public, forever.** We will never remove a gold bank, grader
  rule, key, or signed card that verification depends on.
- **No, and it reveals the edge → it may be a trade secret.**
- **Unsure → we keep it public.** We err toward verifiability.

Verification is free and loginless. We measure, we sign, we re-attest — and
anyone can check.
