#!/usr/bin/env python3
"""Daily Executive Dashboard for Sir Nicholas Templeman."""

import os
from datetime import datetime
from pathlib import Path

STATUS_DIR = Path("/Users/nicholas/.clawdbot/shared-knowledge/status")
MEMORY_DIR = Path("/Users/nicholas/clawd/memory")
GUARDIAN_STATUS = STATUS_DIR / "meok-guardian-latest.md"
DASHBOARD = STATUS_DIR / "daily-dashboard.md"

def main():
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S %Z")

    guardian_table = ""
    if GUARDIAN_STATUS.exists():
        lines = GUARDIAN_STATUS.read_text().splitlines()
        in_table = False
        for line in lines:
            if line.startswith("| Service"):
                in_table = True
            if in_table:
                guardian_table += line + "\n"
                if line.strip() == "":
                    break

    recent_events = ""
    guardian_files = sorted(
        MEMORY_DIR.glob("*-guardian.md"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )[:3]
    for f in guardian_files:
        recent_events += f"**{f.name}**:\n"
        recent_events += f.read_text().strip()[-500:] + "\n\n"

    content = f"""# 🌅 Daily Executive Dashboard — {date_str}
**Generated:** {time_str} | **Agent:** JEEVES

---

## 🖥️ System Health

{guardian_table}
### Quick Actions
- Guardian log: `tail -20 /tmp/meok_guardian.log`
- SOV3 health: `curl -s http://localhost:3101/health | head -c 200`
- MEOK API: `curl -s http://localhost:3200/api/health`

---

## 🎯 Physical Priorities Tracker

| Priority | Status | Last Action | Next Step |
|----------|--------|-------------|-----------|
| **Stripe Activation** | 🔴 PENDING | Keys exist in .env | Complete Stripe onboarding / verify account |
| **HARVI Parts Order** | 🔴 PENDING | Council approved ($247 AUD) | Place order with supplier |
| **Planning Permission** | 🔴 PENDING | Class R research | Submit application to local authority |
| **R&D Tax Credits** | 🔴 PENDING | Q1 documentation ready | File claim with HMRC/accountant |

### Blockers
- Stripe: Account may need verification documents.
- HARVI: Needs supplier selection and payment method.
- Planning: Bureaucratic delays possible; consider agent assistance.
- R&D: Needs formal submission; coordinate with accountant.

---

## 📝 Recent System Events

{recent_events or "_No guardian events recorded yet._"}

---

## ⏭️ Today’s Recommendations

1. **Check Stripe dashboard** for any verification requests.
2. **Review HARVI supplier quotes** and place the $247 AUD order.
3. **Run consciousness integrity check** on SOV3 (post-recovery validation).
4. **Authorize R&D tax credit submission** if accountant is ready.

---

*This dashboard is auto-generated. Ask JEEVES to update priorities or add new trackers.*
"""

    DASHBOARD.write_text(content)
    print(f"Dashboard written to {DASHBOARD}")

if __name__ == "__main__":
    main()
