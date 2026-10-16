# gspc-records Worker
Read-only record API + MCP (`search_records`, `get_record`, `get_report`) over the D1 `gspc-layer0`
`measurement_queue` (188,627 Layer 0 subjects, all UNMEASURED at creation), plus crons:
- `*/15 * * * *` advance: hands up to 200 UNMEASURED rows to the mill as `QUEUED_FOR_MILL`. Off unless `MILL_HANDOFF=on`
  (stays off until Measure rules on the probe method).
- `5 6 * * *` daily summary row; `30 3 * * 1` weekly Layer 0 source-count refresh.
Deployed through the Cloudflare API (no wrangler). Measurement only; nothing here is signed or published as a result.
