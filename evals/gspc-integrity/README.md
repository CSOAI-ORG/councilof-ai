# GSPC evidence-integrity evaluation

A compact, synthetic Ori benchmark for whether candidate models preserve Council of AI evidence boundaries. It tests measurement state, provenance, denominator integrity, ties, and the rule that measurement is not certification.

It uses no live board records and makes no GSPC score. Validate the harness without external model calls:

```sh
ori eval evals/gspc-integrity/gspc-integrity.eval.ts --dry-run --pilot 1 --hermetic --no-history
```

A live pilot sends these synthetic cases to OpenRouter-selected candidate models and may incur provider charges. It requires a separate, explicit confirmation before it is run.
