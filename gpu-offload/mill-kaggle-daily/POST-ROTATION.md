# After the Kaggle token rotation: the steps, in order

**Why this exists:** the Kaggle token that `run.sh` uses leaked, and the owner is rotating it. The live cron line
(`40 10 * * *`) pushed kernel versions with that token on 2026-09-28, and it pushes again every day at 10:40Z until one
of these happens: the token is rotated, the cron line is paused, or the guarded `run.sh` from this branch is installed
with a `HOLD` file present. The live `run.sh` has no HOLD check. Nothing on this branch is installed yet.

0. **Before the rotation, if the next 10:40Z push must not happen (owner/coordinator):** comment out the
   `mill-kaggle-daily` line in the Oracle crontab. Alternatively, install this branch's `run.sh` (step 2) and
   `echo "kaggle token rotation pending" > ~/lanes/mill-kaggle-daily/HOLD`. The run then logs `state=HELD rc=75`, and a
   HELD run never counts toward a newest model's two-FAILED skip.
1. **Owner:** rotate the token at kaggle.com (Settings, API: expire the old token, then create a new one).
2. **Coordinator:** land this branch, then install onto Oracle from a checkout. Check each file against the branch
   before and after the copy:
   `run.sh`, `newest-models.json`, `rotate-kaggle-credential.sh`, `reports/newest_models_weekly.py`,
   `reports/inventory-2026-09-28T14.json` go into `~/lanes/mill-kaggle-daily/` and its `reports/`. `kernel_template.py`
   is unchanged. Then run `bash -n run.sh` and `bash test_run_guards.sh run.sh rotate-kaggle-credential.sh` (it expects
   `passed=20 failed=0`).
3. **Owner, on Oracle:** `bash ~/lanes/mill-kaggle-daily/rotate-kaggle-credential.sh`, then paste the NEW token. The
   script puts the old files' sha256 on `~/.secrets/kaggle-credential-denylist.sha256` and moves the old files aside
   (renamed, not deleted). It installs the new `~/.kaggle/access_token` with mode 0600 and makes ONE read-only status call.
   It pushes nothing and prints no token bytes.
4. `rm -f ~/lanes/mill-kaggle-daily/HOLD` (if you created it) and un-comment the cron line (if you paused it).
5. The next 10:40Z run picks the first unmeasured newest-class model in priority order. On this branch that is
   `qwen3.8:27b`, the first 2xT4-split model, whose kernel wall is UNMEASURED. The rotation file on this branch pins nine
   newest-class models: the two already measured (priorities 1-2) join the daily rotation, and priorities 3-9 are each
   picked once, in order, before any of them repeats (one per day, so the last first-measurement is about 7 days after
   install). The rotation then cycles 11 fleet + 9 newest = 20 models, so each model is picked about every 20 days. Check: `tail -1 ~/lanes/logs/mill-kaggle-daily.log` shows `pick=newest-first(...)`
   `pin=newest-models.json`, and `landed_to=build-pod-staging-mirror`. The last one depends on this branch's
   build-pod.env fix. On the live script it is `oracle-mirror-FALLBACK`.
