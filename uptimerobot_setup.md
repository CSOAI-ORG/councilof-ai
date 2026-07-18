# UptimeRobot Setup for SOV3 Tunnel SLA Monitoring

**Purpose:** Monitor sovereign.templeman-opticians.com availability  
**Research Source:** GAPS.md (SLA monitoring gap)  
**URL:** https://uptimerobot.com  

---

## Monitors to Create

### 1. SOV3 Main Endpoint
- **URL:** https://sovereign.templeman-opticians.com/health
- **Type:** HTTP(s) monitor
- **Interval:** 5 minutes
- **Alert:** Email + SMS to Nick

### 2. MEOK API
- **URL:** https://meok.ai/api/health
- **Type:** HTTP(s) monitor
- **Interval:** 5 minutes

### 3. MEOK UI
- **URL:** https://meok.ai
- **Type:** HTTP(s) monitor
- **Interval:** 5 minutes

---

## Setup Steps

### 1. Sign Up
1. Go to https://uptimerobot.com
2. Sign up (free tier: 50 monitors, 5-minute interval)

### 2. Create Monitors
```bash
# Using UptimeRobot API
API_KEY="your_api_key_here"

# Create SOV3 monitor
curl -X POST "https://api.uptimerobot.com/v2/addMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$API_KEY&format=json&type=2&url=https://sovereign.templeman-opticians.com/health&friendly_name=SOV3+Health"

# Create MEOK API monitor
curl -X POST "https://api.uptimerobot.com/v2/addMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$API_KEY&format=json&type=2&url=https://meok.ai/api/health&friendly_name=MEOK+API"

# Create MEOK UI monitor
curl -X POST "https://api.uptimerobot.com/v2/addMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$API_KEY&format=json&type=2&url=https://meok.ai&friendly_name=MEOK+UI"
```

### 3. Set Up Alerts
- **Email:** nick@templeman-opticians.com
- **SMS:** +44 (your number)
- **Push:** UptimeRobot mobile app

---

## Cloudflare Tunnel Redundancy

### Backup Strategy
```bash
# Document tunnel config
cat ~/.cloudflared/config.yml > ~/clawd/backups/cloudflared_config.yml

# Backup tunnel credentials
cp ~/.cloudflared/cert.pem ~/clawd/backups/
cp ~/.cloudflared/*.json ~/clawd/backups/

# Test failover (if secondary ISP available)
# Set up secondary tunnel on different network
```

---

## Integration with SOV3

### Add to SOV3 Health Check
```python
# In SOV3 health endpoint
@mcp.tool()
def get_sla_status() -> str:
    """Get SLA monitoring status from UptimeRobot"""
    import requests
    api_key = os.environ.get("UPTIMEROBOT_API_KEY")
    
    response = requests.post(
        "https://api.uptimerobot.com/v2/getMonitors",
        data=f"api_key={api_key}&format=json",
        timeout=10
    )
    
    return response.json()
```

---

## Status Dashboard

Access: https://uptimerobot.com/dashboard

**Metrics to Track:**
- Uptime % (target: 99.9%)
- Response time (target: <200ms)
- Incident count (target: <1/month)

---

**Next Action:** Sign up at https://uptimerobot.com and create 3 monitors
