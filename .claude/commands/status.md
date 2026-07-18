---
name: status
description: Quick infrastructure status check — all services
---

Run the topology daemons status check:
```bash
bash ~/clawd/sovereign-temple/topology_daemons.sh status
```

Then check key sites:
```bash
for d in meok.ai councilof.ai cobolbridge.ai proofof.ai; do
  echo "$d → $(curl -s -o /dev/null -w '%{http_code}' -m 5 https://$d)"
done
```

Report in a compact table format.
