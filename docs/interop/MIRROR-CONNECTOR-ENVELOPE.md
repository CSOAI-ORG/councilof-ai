# Mirror connector envelope 1.0

This envelope is the single typed intake for Hugging Face, Kaggle, and GitHub
mirrors. Mirrors copy reviewed public evidence; they do not become measurement,
signing, or review authorities.

The canonical stream is `/mirrors/reviewed-stream.jsonl`. Each line has:

- `source`: platform, stable URI, and content-addressed revision;
- `subject`: typed identifier for the artifact's subject;
- `measurement_kind`: the measurement or manifest vocabulary;
- `artifact`: URI, SHA-256, byte length, and media type;
- `timestamp`: source-supplied UTC time, never ingestion wall-clock time;
- `license_provenance`: licence and exact provenance URI;
- `lifecycle`: `reviewed`, `published`, `withdrawn`, or `error`;
- `error`: typed failure detail only when lifecycle is `error`;
- `authority`: fixed to `https://councilof.ai` as review authority;
- `mirror_role`: fixed to `consumer`; and
- `envelope_id`: SHA-256 of the canonical envelope without `envelope_id`.

Consumers fail closed on an unknown schema, invalid lifecycle/error pairing,
changed artifact hash, changed envelope ID, or any attempt to replace the
canonical authority. A mirror may display or redistribute an envelope. It may
not turn the envelope into a new measurement or claim that publication proves
certification, compliance, or safety.

`scripts/connectors/mirror_envelope.py` is the reference implementation.
The published JSON Schema is `/schemas/mirror-connector-envelope-1.0.schema.json`.
`scripts/connectors/build_reviewed_stream.py` materializes the public stream
from the reviewed `root.json` and signed-card index. The Kaggle kernel validates
and records that stream before it runs its bounded, unsigned measurement lane.
