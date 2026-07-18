#!/bin/bash
cd /home/nicholas/meok-compliance-gateway
exec /home/nicholas/sov3/.venv/bin/python -c "
import uvicorn
import sovereign_dashboard
uvicorn.run(sovereign_dashboard.app, host='0.0.0.0', port=8891, log_level='warning')
"
