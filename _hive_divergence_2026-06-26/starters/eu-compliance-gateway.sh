#!/bin/bash
cd /home/nicholas/meok-compliance-gateway
exec /home/nicholas/sov3/.venv/bin/python -c "
import uvicorn
import eu_compliance_gateway as g
uvicorn.run(g.app, host='0.0.0.0', port=8889, log_level='warning')
"
