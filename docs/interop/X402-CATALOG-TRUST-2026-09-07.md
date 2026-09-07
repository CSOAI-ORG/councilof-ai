# x402 catalog trust snapshot — 2026-09-07 (v0)

**Population:** PayAI facilitator catalog — 100 rows, one DRY probe per row (challenge terms only; nothing signed, nothing sent).

| Bucket | Count | Meaning |
|---|---|---|
| 402 challenge | 74 | rows that open a correct 402 challenge (the door is alive — NOT delivery) |
| HTTP 200 | 2 | served content, no challenge on the given URL |
| Alive, needs input | 7 | endpoint answered with a schema/param error (requires its required arg) |
| Template, no reply | 6 | URL-template rows (\`:param\`) — no reply even after substitution |
| **Dead / 404 / unreachable** | **11** | **rows the catalog sells that do not exist on the wire** |

**The finding:** 74 of 100 catalogue rows answer a correctly-formed 402 challenge; 11 do not exist on the wire at all. This is the buyer's-eye view the catalogs themselves cannot publish: self-reported listings verified by probe, not by claim. Host details are withheld by design (the census doctrine: count + derived properties + methodology; never name a non-conformant host publicly).

**Product shape:** the first leaf of the **x402 Trust Report** — sign → anchor → OTS → root, the same pipeline as the GSPC board. The report is free forever; per-resource certification cards are metered (paid doors: commission_card / receipts). We measure, never certify.

**Method:** one GET per row (\`:param\` substituted), UA \`csoai-trust-audit/0.1\`, 15s timeout, 12 workers, zero payment/sign/side-effect. Machine JSON: \`public/interop/x402-trust/2026-09-07.json\`.
