# SAFE evidence pack (csoai.safe-evidence-pack/0.1)

This pack holds ten SAFE re-verification records. Each record is also given as a `csoai.evidence-event/0.1` event and rendered in five carrier formats. Everything in the pack can be re-derived offline.

- Code: Apache-2.0.
- Text: CC-BY-4.0.
- Schema and field mappings: CC0-1.0.

This is not an Alliance format, and nothing in it has been sent or posted.

## Reproduce

```sh
python3 verify.py --offline      # needs Python 3.9+, jsonschema; cryptography for the signature check
```

The command exits 0 only if all four checks hold:

1. **Integrity.** Every file matches `SHA256SUMS`, and `SHA256SUMS` matches `FREEZE.json`.
2. **Validation.** `validate.py` accepts all ten records and rejects all nine records built to break the rules.
3. **Re-derivation.**
   - `events/` is rebuilt from `records/` by the code in `lib/`, and the result is byte-identical.
   - `render/` is rebuilt the same way: OCSF 1.9.0 Detection Finding, OTel `gen_ai.evaluation.result`, SARIF 2.1.0, in-toto Statement v1, and ECS.
4. **Signature.** When `FREEZE.signed.json` and `did.json` are present, the Ed25519 board signature over `FREEZE.json` must verify.

If any single byte in any listed file changes, the command exits non-zero.

## What is here

| Path | What |
|---|---|
| `records/` | The ten records, `index.json` and the RFC field map. They were written by `producer/safe_export.py` from public bytes it read, and it checked each signature itself. |
| `events/events.jsonl`, `events/event-ids.json` | One event per record. `event_id` is sha256 over the RFC 8785 bytes of the event (issue #41). The SAFE profile schema is closed, so the id sits beside each record rather than inside it. |
| `render/` | The same ten events in each carrier. UNMEASURED carries no score in any of them. |
| `rfc34/results.json` | The issue #34 straw-man schema run against our records and events, with the field gap in both directions. |
| `schema/`, `validate.py`, `lib/`, `verify.py` | The validators and the code that re-derives the pack. |

## What it does not show

- A valid signature shows who signed these bytes. It does not show that their content is true.
- A pending OpenTimestamps proof is a request, not a time.
- Records that re-verify our own published findings are not a third-party audit of us.
