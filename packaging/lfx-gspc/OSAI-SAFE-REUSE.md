# SAFE reuse boundary

Canonical existing source:
`measurement/crosswalk/sources/osaia-safe.json`

The existing GSPC harness already maps SAFE to assurance, provenance and change
objects and records the prior contribution/citable form. OpenShell, OpenBMC and LFX
packaging must reuse the same evidence vocabulary:

- source and source_version;
- observation and measurement;
- evidence and provenance;
- uncertainty;
- observation/validity time;
- supersession/correction;
- hash/signature/root when they actually exist.

No packaging target gets its own competing "SAFE" schema. Adapter-specific envelopes
may add transport fields, but the assurance semantics stay aligned with the existing
crosswalk.
