# Infrastructure Optimization - Immediate Fixes

## PRIORITY INFRASTRUCTURE ISSUES

### 1. M2 Node Recovery
```bash
# ISSUE: SSH connection timeout to M2 node
# IMPACT: Reduced GPU cluster capabilities
# FIX PRIORITY: HIGH

DIAGNOSTIC STEPS:
1. Check M2 power/network status
2. Verify SSH keys and network configuration  
3. Test direct connection vs VPN
4. Restore Homebrew + Node.js if needed

COMMANDS TO RUN:
ssh -v nicholas@192.168.1.100  # Verbose connection test
tailscale status  # Check VPN connectivity
tailscale up --reset  # Reset VPN if needed
```

### 2. Tailscale GPU Cluster  
```bash
# ISSUE: 7 GPU nodes offline
# IMPACT: Limited distributed computing
# FIX PRIORITY: MEDIUM

RECOVERY STEPS:
1. Run: tailscale up --reset
2. Re-authenticate with admin account
3. Verify each GPU node connectivity
4. Test distributed model loading
```

### 3. Vercel Build Optimization
```bash
# ISSUE: Build memory OOM errors
# IMPACT: Deployment failures
# FIX PRIORITY: HIGH

OPTIMIZATION:
1. Increase Vercel build memory limit
2. Optimize bundle size and dependencies
3. Enable build caching
4. Split large components

vercel env add VERCEL_BUILD_MEMORY 8192  # 8GB memory limit
```

### 4. Production Auth Setup
```bash
# ISSUE: local_mode only (dev environment)
# IMPACT: No real user authentication
# FIX PRIORITY: MEDIUM

CLERK SETUP:
1. Get production Clerk keys from dashboard
2. Add to Vercel environment variables
3. Configure OAuth providers (Google, GitHub)
4. Test registration/login flow
```

## SYSTEM HEALTH MONITORING

### SOV3 Status Check
```bash
# Current status indicators
curl localhost:3100/health
curl localhost:3101/health  
ps aux | grep "sov3\|sovereign" | grep -v grep
```

### MEOK API Health  
```bash
# API endpoint verification
curl https://try.meok.ai/api/health
curl https://try.meok.ai/api/sov3/status
curl localhost:3000/api/health
```

**Expected Result:** 100% system availability, all nodes online