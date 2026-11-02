# W2 staleness observation — 2026-11-02 (claude lane, daily Track A)

- `GET /measurement-capsules/latest.json` → `as_of 2026-10-28T08:30:40Z`
- `GET /root.json` → `as_of 2026-11-01T15:09:42Z`
- **Gap: 4 days** (threshold: >3 days ⇒ this observation).

**Why this lane does not rebuild:** the capsule day-index publisher
(`scripts/pod-loops/capsule-publish-daily.sh`) runs on the Oracle micro's
cron (`~/lanes/capsule-publish-20260928/trigger.sh`, 08:40 after capsule-daily
08:05Z) and consumes the pod-side signed index. The Oracle micro is the box
work-plan row D22 measured thrashing (load 2.48/63.69/93.06 on 2 CPUs, swap
in use), and the pod network volume it depends on is row D21 (loses writes).
Rebuilding here would consume a signed source this lane does not hold and
would collide with the Oracle lane's own writer.

**Escalation already filed:** D21 (owner console act) and D22 (Oracle
capacity) are the named owner rows in the work plan. When either closes,
the daily publisher resumes and this observation's successor should read
"current" instead of this file.

— claude lane, Track A, 2026-11-02
