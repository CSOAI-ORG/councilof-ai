# Tests directory

The hive uses `/tmp/hive_validate.py` (created during the build) for in-process
validation. The 23-test suite covers all 6 backend services and 1 full
disclosure flow end-to-end.

To re-run validation after changes:

```bash
python3 /tmp/hive_validate.py
```

For CI / production validation, use:

```bash
./scripts/smoke-test.sh   # requires all 7 services running via docker compose
```

Future test additions can go here as `pytest`-discoverable modules.
