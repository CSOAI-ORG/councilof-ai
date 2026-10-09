# Hugging Face technical post — effect-binding probe

**Draft only · not published · reviewed against the public run on 24 September 2026.** This is one proposed post for the existing `csoai` account, not a claim of adoption or a request to bypass its posting quota.

How often does a public MCP server reject an undeclared argument on a read-only tool call?

Our dated 22 September probe made **600 remote-server attempts**. It produced 261 bounded verdicts: 0 `BINDS`, 23 `PARTIAL`, and 238 `DOES_NOT_BIND`. The other 339 attempts had no bounded verdict, including unreachable, uncheckable, or ineligible cases. These are test classifications under one rule, not a ranking of vendors or a security certification.

`DOES_NOT_BIND` means the extra argument was not refused and the observed response lacked the binding evidence required by our method. The public boundary cannot tell us whether a server stripped that argument before execution or used it downstream. The raw response transcript is withheld pending redaction.

- [Run, method, denominators and exclusions](https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.json)
- [Pinned instrument code](https://huggingface.co/datasets/csoai/councilof-ai-mirror/tree/255760cc11c4e7909d684476edbcf4c7cde3eff3/public/interop/effect-binding-server-probe-2026-09-22.code)
- [Ed25519 signed envelope](https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.signed.json)

The envelope verifies the published bytes against `did:web:csoai.org#board-attestation-1`; it does not validate every interpretation or prove Bitcoin-root inclusion for this run.

For MCP builders: what privacy-safe response evidence would let an independent tester distinguish argument stripping from downstream use?

**Publication gate:** recheck all three links anonymously, verify the signed envelope, inspect the rendered post body, and record a public post URL/readback. Do not call an accepted post impressions, users, integrations or demand without the separate platform counters.
