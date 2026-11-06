#!/bin/bash
# Persistent start-command wrapper for images whose normal entrypoint is /start.sh.
# Configure the pod start command to invoke this file through bash. Do not replace
# the image's entrypoint until /start.sh has been verified to be its current one.
set -euo pipefail
test -f /start.sh || { echo "Expected image entrypoint /start.sh is absent"; exit 1; }
bash /workspace/lanes/loops/start.sh
exec /start.sh "$@"
