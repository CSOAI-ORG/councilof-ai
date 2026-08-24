# FLEET TOPOLOGY (2026-08-24 04:20 UTC) — every backend its own Linux VM
| VM | host:port | role | status |
|---|---|---|---|
| sovos-agent-vm | 194.26.196.156:23243 (RTX 3090) | DSH-agent workspace + GPU compute; monorepo /workspace/sovos-agent | PROVISIONED (node22 + clone) |
| csoai-backend-vm | 38.128.232.57:16207 (A100 PCIe) | CSOAI backend: gateway/serve/domain; monorepo /workspace/csoai-backend | PROVISIONED (node22 + clone) |
| sovos-volume-sink | 213.173.105.83:33982 (CPU, /workspace 2.3PB) | storage 35G archive + EAT + harness | LIVE (cron restored) |
| kimi-k2-lora-train | A100 SXM (7vup4jco2e8dt0) | GPU training backend | EXITED — GPU quota full at 04:00 (retry window) |
| Mac | control surface | DSH GUI + launchd services (portal/gateway/ollama/RAS) | LIVE |
Cost: $5.32/hr current (3 live VMs). Balance $90.22 (≈17h). New-pod creation = console/API scope + quota (flagged).
