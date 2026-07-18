#!/usr/bin/env bash
# run-task-queue-once.sh — one-shot task processor on the VM
export API_BASE=http://127.0.0.1:3211
export TIER=starter
mkdir -p ~/vault/tasks ~/vault/results
python3 /opt/openpatent-hive/scripts/task_queue.py --once --auto-disclose 2>&1 | tail -10
echo "---"
ls ~/vault/results/ 2>&1 | tail -3
