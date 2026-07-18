# SOV3 Reconstruction Path (Bus Factor Mitigation)

**Generated:** 2026-05-05  
**Purpose:** Enable full SOV3 recovery if primary machine fails

---

## Current State

- **Location:** `~/clawd/sovereign-temple/`
- **MCP Endpoint:** http://localhost:3101/mcp
- **PostgreSQL:** Local instance with pgvector extension
- **Memory:** 1,394 episodes + 40+ daily MD files
- **Neural Models:** 6 active models (78.8% consciousness)

---

## Recovery Steps

### 1. Base System Setup
```bash
# Install dependencies
brew install postgresql@15
brew install python@3.11
pip install virtualenv

# Clone repositories
git clone https://github.com/CSOAI-ORG/sovereign-temple.git ~/clawd/sovereign-temple
git clone https://github.com/CSOAI-ORG/clawd.git ~/clawd
```

### 2. PostgreSQL + pgvector
```bash
# Initialize database
initdb -D ~/clawd/sov3_db
pg_ctl -D ~/clawd/sov3_db start

# Enable pgvector
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Restore from backup (latest dump)
psql sov3_db < ~/clawd/backups/sov3_$(date +%Y%m%d).sql
```

### 3. Python Environment
```bash
cd ~/clawd/sovereign-temple
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. MCP Marketplace
```bash
cd ~/clawd/mcp-marketplace
pip install -e .
# Or restore from PyPI backup
pip install meok-eu-ai-act-compliance-mcp meok-care-membrane-mcp # ... (207 packages)
```

### 5. Neural Models
```bash
# Download neural model weights
# S3 bucket or local backup
aws s3 sync s3://meok-sov3-models/ ~/clawd/sovereign-temple/models/

# Or retrain from scratch
python -m sovereign-temple.scripts.train_neural_nets
```

### 6. Memory Restoration
```bash
# Restore episodes from PostgreSQL backup
psql sov3_db < ~/clawd/backups/episodes_$(date +%Y%m%d).sql

# Restore daily MD files
rsync -av ~/clawd/backups/memory/ ~/.clawdbot/shared-knowledge/intel/
```

### 7. Start Services
```bash
# Start SOV3
cd ~/clawd/sovereign-temple
python -m sovereign_temple --port 3101 &

# Start MEOK API
cd ~/clawd/meok-api
npm run dev -- --port 3200 &

# Start MEOK UI
cd ~/clawd/meok
npm run dev -- --port 3000 &
```

---

## Backup Strategy

### Automated Daily Backup
```bash
#!/bin/bash
# ~/clawd/scripts/backup_sov3.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR=~/clawd/backups

# PostgreSQL dump
pg_dump sov3_db > "$BACKUP_DIR/sov3_$DATE.sql"

# Memory files
tar -czf "$BACKUP_DIR/memory_$DATE.tar.gz" ~/.clawdbot/shared-knowledge/

# Config files
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" ~/clawd/sovereign-temple/config/

echo "Backup complete: $DATE"
```

### Offsite Backup
```bash
# Rclone to cloud storage
rclone sync ~/clawd/backups remote:sov3-backups/
```

---

## Verification Checklist

After reconstruction:
- [ ] PostgreSQL accessible on port 5432
- [ ] SOV3 MCP responding on port 3101
- [ ] All 6 neural models loaded
- [ ] Memory episodes queryable (1,394+ expected)
- [ ] MEOK API healthy on port 3200
- [ ] MEOK UI accessible on port 3000
- [ ] 47 agents registerable
- [ ] Care membrane validation working

---

## Improvement: Cloudflare Tunnel + UptimeRobot

### Add SLA Monitoring
```bash
# UptimeRobot setup for sovereign.templeman-opticians.com
# 1. Sign up at https://uptimerobot.com
# 2. Add monitor for:
#    - https://sovereign.templeman-opticians.com/health
#    - Alert contacts: Nick's email + SMS
```

### Tunnel Redundancy
```bash
# Document Cloudflare tunnel config
cat ~/.cloudflared/config.yml

# Backup tunnel credentials
cp ~/.cloudflared/cert.pem ~/clawd/backups/
cp ~/.cloudflared/tunnel.json ~/clawd/backups/
```

---

## Next Steps

1. **Automate daily backups** (cron job)
2. **Test reconstruction** (spin up SOV3 on another machine)
3. **Add UptimeRobot monitoring** (5-minute intervals)
4. **Document tunnel failover** (secondary ISP/router)

---

**Last verified:** Never (need to test recovery process)  
**Next review:** 2026-06-01
