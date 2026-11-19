# Company gateway bounded discovery

This candidate adds read-only MCP definition selection. Gateway-origin activation remains held. The tracked Cloudflare configuration keeps its existing origin state; the `MEOK_LIBRARY_GATEWAY_ORIGIN=https://api.meok.ai` addition has been removed from this candidate. A qualified receiver, ingress route, account role and original Base binding are required before that origin is installed through the existing release lane.

The existing gateway sends this request to `POST /mcp/free`, with `Accept: application/json, text/event-stream`:
```json
{"jsonrpc":"2.0","id":"meok-library-abi","method":"tools/list","params":{"_meta":{"csoai.org/tools-list":{"version":1,"name":"board_totals"}}}}
```

A unique match returns the original descriptor from that door's canonical definitions and `result._meta["csoai.org/tools-list"]={"version":1,"name":"board_totals","complete":false,"matches":1}`. This is a named partial selection. Invalid selectors, unsupported cursor combinations, unknown names and ambiguous names return no descriptors and an explicit error marker. The free door cannot return a paid-only definition.

Ordinary discovery preserves the complete definitions, order and free/full separation. The selector hook and `cacheHints["tools/list"]={ttlMs:0,cacheScope:"public"}` retain HTTP no-store behavior and prevent selected/full catalogue cache mixing. The gateway's existing 65,536-byte response limit remains unchanged. Existing stored full-catalogue proofs remain readable.

The unchanged helper and HTTP-test blobs also exist in PR4018. Either reviewed carrier can deliver the selector; a second selector merge is not a prerequisite. PR3972 is the existing small selector carrier. Its previous origin addition is not an ingress or binding receipt.

## Existing release and full integration

The existing owner qualifies the amended source against its actual base and four required checks, preserves current owner updates, and uses the normal GitHub Actions deployment. Preserve Nick's review/outward gate and the currently authorized protected merger's custody under the applicable owner rulings and direct human instructions. Four required checks, no admin bypass, autoMerge:false and normal GitHub Actions deployment remain in force. This source amendment grants no merge, close or production authority.

After a new deployment's source/deploy/apex witness, the existing Company owner makes one bounded repeat of the exact request above. The complete response must fit the unchanged limit, parse under the gateway's existing JSON/SSE rules, and bind the partial-selection marker to the exact original board descriptor/schema. The actual HTTP controls use JSON Accept negotiation; they do not substitute for the deployed gateway's exact Accept-pair witness. Do not repeat this probe before a new deployment or retry a case POST to test discovery.

Origin installation, qualified ingress, authenticated owner/role and original Base binding, the one authorized case save with exact result/receipt and native readback, and reopening the same case after refresh in MEOK and CouncilOS remain unfinished parts of the same integration and intake. Preserve the observed PENDING or COMMITTED storage state explicitly. Selector success alone does not complete the integration. The whole gateway `/api/meok-library/library` GET also calls `_board`; only the underlying authorized auth/native/read-plane diagnostic is independent of this selector ABI.

## Evidence scope

The original [6 November source validation](company-gateway-bounded-discovery-validation-20261106.json) is preserved unchanged as historical evidence. Its 17-control receipt and source pins describe that snapshot. The [7 November selector-only amendment record](company-gateway-selector-only-validation-20261107.json) distinguishes unchanged product blobs, historical executed controls, the observed deployed ABI blocker and the amended head's required fresh CI. No predecessor pass is transferred to the amendment, and no live case, origin activation or acceptance is claimed.
