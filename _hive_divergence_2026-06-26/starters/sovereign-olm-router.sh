#!/bin/bash
cd /home/nicholas/meok-compliance-gateway
exec /home/nicholas/sov3/.venv/bin/python -c "
import uvicorn
import sovereign_olm_router as r
uvicorn.run(r.app, host='0.0.0.0', port=8890, log_level='warning')
"
