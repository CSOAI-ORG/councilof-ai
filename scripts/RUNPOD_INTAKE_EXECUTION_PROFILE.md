# Closed execution-policy compatibility

The active compute worker can include an `execution_policy` field in run.json.
The strict intake previously rejected that entire run as UNEXPECTED_FIELDS.
This change recognises only this exact optional object:

```json
{"profile":"bounded-transport-v1","max_consecutive_transport_errors":3}
```

The threshold must be an integer, not a boolean or float. Unknown profiles,
additional fields, altered thresholds and unknown run fields remain rejected.
Legacy runs without execution_policy remain supported. Original run bytes are
preserved and bound by the intake bundle digest; no historical file is rewritten.

This is execution metadata, not a grader or transport-profile migration.
Unknown transport profiles still fail the existing instrument checks. A run
with only unparsed responses or an incomplete candidate is not made landable.
Every existing bank/model/instrument, item hash, score/count and candidate
check still applies. VERIFIED_QUARANTINE is private review, not signing,
publication, independent validation of the benchmark construct or legal approval.

Run the offline tests with:
`PYTHONPATH=scripts python3 -m unittest test_verify_runpod_gspc_intake test_runpod_intake_execution_policy -v`

Do not restart a live worker or rerun a model to repair this metadata mismatch.
Use a separate quarantine when comparing old and candidate intake results.
