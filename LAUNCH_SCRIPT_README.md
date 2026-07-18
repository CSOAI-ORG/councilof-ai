# 🐉 MEOK WORLD LAUNCH SCRIPT
**Owner:** Nick Templeman (CSOAI / MEOK) · **Author:** M4 · **Date:** 2026-06-29

A single, reliable script that does the **entire pre-launch to live** sequence:
build → test → deploy → verify. Run this before 9 PM BST to ensure all systems are green.

---

## 🚀 QUICK START

```bash
# From the repo root:
./launch.sh all           # Full sequence
./launch.sh test          # Just tests
./launch.sh deploy        # Just deploy
./launch.sh verify        # Just verify
./launch.sh status        # Quick status
```

The script:
1. ✅ Pulls the latest M4 lane changes
2. ✅ Builds the 128 HTML pages + rebuilds the bundle
3. ✅ Runs all 175+ active tests
4. ✅ Starts the MEOK backend on :8000 (production bind)
5. ✅ Verifies live SOV3 substrate on :3101
6. ✅ Runs the 5-flow live smoke test
7. ✅ Pings the deployment status
8. ✅ Reports the final state

---

## 📋 SEQUENCE (the 9 steps)

### Step 1: Pre-flight
- Check git status
- Pull the latest M4 lane changes
- Verify Python 3.11 / Node 20

### Step 2: Build
- Run `csoai-os/meok-home/build_everything2.py` to rebuild 128 pages
- Run `meok-deploy/` Next.js build (optional)

### Step 3: Test
- `pytest csoai-os/test_meok_full_site.py` (25 tests)
- `pytest csoai-os/test_meok_pwa.py` (17 tests)
- `pytest csoai-os/test_meok_home.py` (20 tests)
- `pytest csoai-os/test_v2_temple_os.py` (22 tests)
- `pytest csoai-os/test_v2_signup_wizard.py` (15 tests)
- `pytest csoai-os/test_ichar.py` (21 tests)
- `pytest meok-backend/test_app.py` (27 tests)
- `pytest ue5_integration/test_meok_factory_ue5.py` (9 tests)
- `pytest ue5_integration/test_meok_world_ue5.py` (19 tests)
- `pytest meok-e2e -m api` (9 tests)
- Total: **175+ active tests**

### Step 4: Start backend
- Kill any existing backend on :8000
- Start `meok-backend/app.py` on `0.0.0.0:8000`
- Wait for `/api/backend/status` → 200 OK

### Step 5: Verify SOV3 substrate
- POST `http://127.0.0.1:3101/mcp` JSON-RPC `tools/list`
- Verify 330 tools advertised

### Step 6: Live smoke test
- Run `meok-e2e/live_smoke_test.py`
- Verify 5/5 flows pass (13/13 steps)

### Step 7: Verify 128 pages
- GET each of the 128 pages
- Verify 200 OK + correct content

### Step 8: PWA verification
- Verify `manifest.webmanifest` + `sw.js` + icons
- Verify PWA install capability

### Step 9: Final report
- Print the full state
- Save to `LAUNCH_REPORT_<date>.md`

---

## 🎯 SUCCESS CRITERIA

All 9 steps must pass:
- ✅ 175+ active tests pass
- ✅ Backend live on `0.0.0.0:8000` (PID logged)
- ✅ SOV3 substrate 330 tools live on `:3101`
- ✅ 5/5 live smoke flows (13/13 steps) GREEN
- ✅ 128/128 pages serve 200 OK
- ✅ PWA + manifest + SW + icons all live
- ✅ Final report generated

If any step fails, the script **stops immediately** and reports the failure.

---

## 🛠 USAGE

```bash
chmod +x launch.sh
./launch.sh all
```

Output goes to stdout + `LAUNCH_REPORT_<date>.md`.

---

*Generated 2026-06-29. The dragon flies sovereign. 🐉🔥*
