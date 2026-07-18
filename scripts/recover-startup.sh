#!/bin/bash
# RECOVERY STARTUP SCRIPT
# Run this after a crash to restore services

set -e

RECOVERY_DIR="/Users/nicholas/clawd/recovery"
SERVICES_FILE="$RECOVERY_DIR/services.json"

echo "=== MEOK Recovery Startup ==="
echo "Time: $(date)"

# Check if we have saved state
if [ ! -f "$SERVICES_FILE" ]; then
    echo "No saved state found - starting fresh"
    exit 0
fi

echo "Found saved state from $(jq -r '.timestamp' "$SERVICES_FILE" 2>/dev/null || echo 'unknown')"

# Check which services were running before
echo ""
echo "Services that were running:"
jq -r '.services[] | select(.status == "running") | "  - \(.name): port \(.port)"' "$SERVICES_FILE" 2>/dev/null || true

echo ""
echo "Services that were stopped:"
jq -r '.services[] | select(.status == "stopped") | "  - \(.name): port \(.port)"' "$SERVICES_FILE" 2>/dev/null || true

echo ""
echo "=== Starting services ==="

# Start PostgreSQL if needed
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    # Adjust based on your setup
    pg_ctlcluster 16 main start 2>/dev/null || true
    # Or docker:
    # docker start meok-postgres 2>/dev/null || true
fi

# Start Redis if needed
if ! redis-cli ping >/dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes 2>/dev/null || true
fi

# Start services that were running
echo ""
echo "Checking each service..."

# PostgreSQL
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "  ✅ PostgreSQL is up"
else
    echo "  ❌ PostgreSQL failed to start"
fi

# Redis
if redis-cli ping >/dev/null 2>&1; then
    echo "  ✅ Redis is up"
else
    echo "  ❌ Redis failed to start"
fi

echo ""
echo "=== Recovery complete ==="
echo "Run 'python3 scripts/crash-recovery.py status' to check current state"
