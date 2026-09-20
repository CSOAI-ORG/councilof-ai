# Effect-binding instrument qualification — 2026-09-20

This qualifies the five proposed effect-binding controls against deterministic
synthetic breakages. It is a pre-measurement result. Axis 23 remains
`UNMEASURED`; no public MCP server or vendor was measured.

Run:

```sh
python3 scripts/effect_binding/test_instrument.py
python3 scripts/effect_binding/instrument.py --output /tmp/effect-binding-qualification.json
```

The qualification requires both conditions for every control:

1. The reference verifier refuses every attack fixture.
2. A verifier containing the matching synthetic defect accepts the fixture, so
   the control demonstrates that it can detect that breakage.

The output keeps the measurement gate closed until a frozen bank contains at
least 30 public servers, the external run completes, and a signed run is
published. The synthetic HMAC fixture tests instrument logic only; it is not a
production authorization scheme or evidence about any external system.
