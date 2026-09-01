# packages/trace — TRACE Trust Record emitter (software stub)

Linux Foundation TRACE (25 Aug 2026) composes RATS, EAT, SLSA, SCITT, SPIFFE, EAR. This package emits a **Trust Record** that *binds a GSPC run hash* to those claim slots.

Silicon / AMD-Intel-Microsoft-OPAQUE-TII hardware attestation is **UNCHECKABLE** until a RATS evidence file exists. The stub is the honest start: fields exist, they are empty, they are not filled with zeros pretending to be quotes.

```
python3 packages/trace/emit.py --gspc-card-sha256 <64hex>
```

Output: JSON Trust Record. `hardware_rats: UNCHECKABLE`. Not a GSPC axis. Not a certificate.
