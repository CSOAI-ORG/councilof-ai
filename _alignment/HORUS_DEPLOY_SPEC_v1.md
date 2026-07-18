# 🐉 HORUS SURVEILLANCE DEPLOYMENT SPEC — v1.0

**Owner:** SOV3 Sovereign Substrate
**Date:** 2026-06-24
**Status:** SPEC WRITTEN, DEPLOY PENDING

## 1. PURPOSE
HORUS is the oversight plane that watches all 6 Layer 0 buses
and triggers intervention when a bus goes outside its bounds.

## 2. ARCHITECTURE
- **3 polling agents** (Sentinel, Warden, Auditor) running on GCP VM
- **BFT veto** when 2 of 3 agents disagree
- **Auto-quarantine** on confirmed deviation
- **SIGIL emission** for every action

## 3. BUS MONITORING
- IDENTITY BUS:     daily DID registry audit
- ATTESTATION BUS:  30-min cert chain integrity check
- POLICY BUS:       hourly framework crosswalk validator
- PAYMENT BUS:      5-min x402 transaction monitor
- AUDIT BUS:        real-time SIGIL chain head check
- COUNCIL BUS:      15-min BFT vote tally audit

## 4. INTERVENTIONS
- WARN (log to SIGIL)
- VETO (block bus operation for 60s)
- QUARANTINE (move to /home/nicholas/horus/quarantine/)
- ALERT (notify Nick via SIGIL + email)

## 5. DEPLOY
```bash
ssh meok-backend
cd ~/horus
nohup python3 horus_watch.py > /tmp/horus.log 2>&1 &
crontab -e  # add: */5 * * * * /home/nicholas/bin/horus-poll.sh
```

## 6. METRICS
- Polls per hour: 4-12
- Interventions per day: 0-3 (target)
- False positives: <5%
- Time to detect: <5 min
