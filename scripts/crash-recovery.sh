#!/bin/bash
# CRASH RECOVERY SYSTEM
# Saves state every 5 minutes so crashes don't lose progress
# Install: Add to crontab or run as background service

set -e

# Configuration
STATE_DIR="/Users/nicholas/clawd/recovery"
STATE_FILE="$STATE_DIR/current-state.json"
SERVICES_FILE="$STATE_DIR/services.json"
LOG_FILE="$STATE_DIR/recovery.log"
INTERVAL=300  # 5 minutes

# Create state directory
mkdir -p "$STATE_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

save_service_state() {
    log "Saving service state..."
    
    # Check all critical services
    local services=()
    
    # MEOK API (port 3200)
    if lsof -i :3200 >/dev/null 2>&1; then
        services+=('{"name":"meok-api","port":3200,"status":"running","pid":'$(lsof -ti :3200 | head -1)'}')
    else
        services+=('{"name":"meok-api","port":3200,"status":"stopped","pid":null}')
    fi
    
    # SOV3 MCP (port 3101)
    if lsof -i :3101 >/dev/null 2>&1; then
        services+=('{"name":"sov3-mcp","port":3101,"status":"running","pid":'$(lsof -ti :3101 | head -1)'}')
    else
        services+=('{"name":"sov3-mcp","port":3101,"status":"stopped","pid":null}')
    fi
    
    # MEOK UI (port 3000 or 3001)
    local ui_port=3000
    lsof -i :3000 >/dev/null 2>&1 || ui_port=3001
    if lsof -i :$ui_port >/dev/null 2>&1; then
        services+=('{"name":"meok-ui","port":'$ui_port',"status":"running","pid":'$(lsof -ti :$ui_port | head -1)'}')
    else
        services+=('{"name":"meok-ui","port":3000,"status":"stopped","pid":null}')
    fi
    
    # PostgreSQL
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        services+=('{"name":"postgresql","port":5432,"status":"running","pid":null}')
    else
        services+=('{"name":"postgresql","port":5432,"status":"stopped","pid":null}')
    fi
    
    # Redis
    if redis-cli ping >/dev/null 2>&1; then
        services+=('{"name":"redis","port":6379,"status":"running","pid":null}')
    else
        services+=('{"name":"redis","port":6379,"status":"stopped","pid":null}')
    fi
    
    # Ollama (port 11434 or 11435)
    local ollama_port=11434
    lsof -i :11434 >/dev/null 2>&1 || ollama_port=11435
    if lsof -i :$ollama_port >/dev/null 2>&1; then
        services+=('{"name":"ollama","port":'$ollama_port',"status":"running","pid":'$(lsof -ti :$ollama_port | head -1)'}')
    else
        services+=('{"name":"ollama","port":11434,"status":"stopped","pid":null}')
    fi
    
    # Weaviate
    if curl -s http://localhost:8080/v1/.well-known/ready >/dev/null 2>&1; then
        services+=('{"name":"weaviate","port":8080,"status":"running","pid":null}')
    else
        services+=('{"name":"weaviate","port":8080,"status":"stopped","pid":null}')
    fi
    
    # Neo4j
    if curl -s http://localhost:7474 >/dev/null 2>&1; then
        services+=('{"name":"neo4j","port":7474,"status":"running","pid":null}')
    else
        services+=('{"name":"neo4j","port":7474,"status":"stopped","pid":null}')
    fi
    
    # Farm Vision
    if lsof -i :8080 >/dev/null 2>&1; then
        services+=('{"name":"farm-vision","port":8080,"status":"running","pid":'$(lsof -ti :8080 | head -1)'}')
    else
        services+=('{"name":"farm-vision","port":8080,"status":"stopped","pid":null}')
    fi
    
    # Build JSON
    local json='{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","services":['
    local first=true
    for svc in "${services[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            json+=","
        fi
        json+="$svc"
    done
    json+=']}'
    
    echo "$json" > "$SERVICES_FILE"
    log "Service state saved to $SERVICES_FILE"
}

save_session_state() {
    log "Saving session state..."
    
    # Get active tmux/screen sessions
    local sessions=""
    if command -v tmux >/dev/null 2>&1; then
        sessions=$(tmux list-sessions 2>/dev/null || echo "")
    fi
    
    # Get active opencode sessions
    local opencode_pids=$(pgrep -f "opencode" 2>/dev/null || echo "")
    
    # Get running python processes (SOV3, MEOK, etc)
    local python_procs=$(ps aux | grep -E "(python.*server|python.*mcp|python.*sov)" | grep -v grep || echo "")
    
    # Get running node processes (Next.js, etc)
    local node_procs=$(ps aux | grep -E "(next|node.*3000|node.*3200)" | grep -v grep || echo "")
    
    # Save to state file
    cat > "$STATE_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "tmux_sessions": "$(echo "$sessions" | tr '\n' ' ')",
    "opencode_pids": "$(echo "$opencode_pids" | tr '\n' ' ')",
    "python_processes": "$(echo "$python_procs" | tr '\n' ' ')",
    "node_processes": "$(echo "$node_procs" | tr '\n' ' ')",
    "uptime": "$(uptime)",
    "load_average": "$(sysctl -n vm.loadavg 2>/dev/null || echo 'unknown')"
}
EOF
    
    log "Session state saved to $STATE_FILE"
}

check_and_restart() {
    log "Checking services for restart..."
    
    # Read services file
    if [ ! -f "$SERVICES_FILE" ]; then
        log "No services file found, skipping restart check"
        return
    fi
    
    # Check MEOK API
    if ! lsof -i :3200 >/dev/null 2>&1; then
        log "WARNING: MEOK API (port 3200) is down!"
        # Don't auto-restart - just log it
    fi
    
    # Check SOV3 MCP
    if ! lsof -i :3101 >/dev/null 2>&1; then
        log "WARNING: SOV3 MCP (port 3101) is down!"
    fi
    
    # Check PostgreSQL
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log "WARNING: PostgreSQL is down!"
    fi
}

# Main loop
log "=== Crash Recovery System Started ==="
log "Monitoring interval: ${INTERVAL}s"

while true; do
    save_service_state
    save_session_state
    check_and_restart
    sleep $INTERVAL
done
