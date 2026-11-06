# Company gateway discovery and origin

The existing case relay requires `MEOK_LIBRARY_GATEWAY_ORIGIN=https://api.meok.ai`. This nonsecret binding belongs in the tracked Cloudflare configuration. It does not establish a receiver, account session, saved case or successful refresh.

The free MCP server supports an additive explicit definition selection:
```json
{"jsonrpc":"2.0","id":"meok-library-abi","method":"tools/list","params":{"_meta":{"csoai.org/tools-list":{"version":1,"name":"board_totals"}}}}
```

The response uses the same door-specific canonical definitions as ordinary discovery. A unique match returns its original descriptor and `result._meta["csoai.org/tools-list"]={"version":1,"name":"board_totals","complete":false,"matches":1}`. This is a named selection, not a complete catalogue or pagination. Invalid selectors, unsupported cursor combinations, unknown names and ambiguous names return no descriptors and an explicit error marker. Selecting a metered definition through the free door cannot expose it.

Ordinary discovery preserves the complete definitions, order and free/full separation. All tools/list responses now advertise a zero cache lifetime, so named selections and complete catalogues do not depend on a client including custom metadata in a cache key. The existing HTTP no-store policy remains. The gateway verifies the selection marker, exact original raw response, descriptor and schema under its existing64KiB upstream limit. Existing stored full-catalogue proofs remain readable.

Seventeen bounded Linux source controls passed. The actual HTTP handler tests cover both request orders in legacy and current protocol modes, and free/full separation; their normal hosted checks are pending at source publication. The source change does not deploy the origin, alter tunnel/DNS custody, authorize a case write, or prove customer persistence. Nick alone merges; autoMerge:false.
