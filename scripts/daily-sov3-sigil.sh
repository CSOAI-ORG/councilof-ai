#!/bin/bash
# Daily SOV3 dashboard snapshot + sigil emit
DASH=$(curl -s -m 5 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"d","method":"tools/call","params":{"name":"coord_get_dashboard","arguments":{}}}' 2>&1)
echo "$DASH" | python3 -c "import json,sys; d=json.load(sys.stdin); c=json.loads(d['result']['content'][0]['text']); print('  agents:', c['agents']['total'], '/', c['agents']['active'], 'active'); print('  tasks:', c['tasks']['completed'], 'completed'); print('  locks:', c['locks']['active'], 'active')"

# Daily sigil
curl -s -m 8 http://localhost:3101/mcp -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"sd","method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"C|jeeves-cli|cron-daily-08:00|Daily SOV3 audit. MEOK is alive. The pipeline flows. T-minus 49 days to Article 50."}}}' > /dev/null
