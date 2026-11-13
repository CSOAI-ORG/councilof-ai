# External operator replay report — 14 October 2026

[Roel Schuurkes reported a replay to the W3C Agent Conformance list](https://lists.w3.org/Archives/Public/public-agent-conformance/2026Oct/0085.html) at 12:17:16 UTC on 14 October. This note attributes his written report; it does not replace the retained operator results or establish an independently inspected external run packet.

The reported input was revision `d0cbe773e8f2fe130feaf4dc0c11c1e4ccb84c15`, using a fresh writable copy of `packet/replay/`, Python 3.12.14, cryptography 50.0.2, disabled networking and this command:

```sh
PYTHONHASHSEED=0 python3 -B run_control2.py
```

He reported:

- Exit status 0 and empty stderr; all 21 native state/reason pairs matched: 7 pass, 13 fail and 1 inconclusive.
- All 15 derived fixture files matched their published hashes; the eight copied replay inputs remained unchanged.
- Across the 15 baseline/relaxation pairs, unchanged-state counts were 4/5 per rule. Unchanged complete-result counts were 3/5, 4/5 and 4/5 for payload-digest, artifact-digest and ed25519-signature.
- The multi-guard case remained fail while its reason changed from payload-digest to artifact-digest; missing-key retained inconclusive / key-not-in-did-document.

This is an external operator's reproduction of the same published helper and checker, with expected answers visible, in one environment at seed 0. He did not repeat the 18-test suite or establish equivalence to the original private helper. The report does not establish independent semantic correctness, corpus adequacy, acceptance by the group, customer acceptance or payment.

The earlier packet, fixtures, helper, test and delivery manifest remain unchanged. This supplemental note sits outside those frozen records. It records a public report of external replay, not a new implementation or a broader compatibility claim.

Source readback on 14 October at 13:27:00 UTC: HTTP 200; 14,139 HTML bytes; SHA-256 `735029ee4ebfd96a154559882caae4ee6dc9b5f66d0ae396ba408b3b7d0785c2`. The hash binds the retrieved archive page, not an external execution artifact.
