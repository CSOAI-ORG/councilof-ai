#!/bin/bash
cd /home/nicholas/meok-compliance-gateway
exec /home/nicholas/sov3/.venv/bin/python -c "
import uvicorn
from http_server import mcp
uvicorn.run(mcp.streamable_http_app(), host='0.0.0.0', port=8888, log_level='warning')
"
