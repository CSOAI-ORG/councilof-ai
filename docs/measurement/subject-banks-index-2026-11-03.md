# Subject-Family 11-Slot Frozen Bank Index — 2026-11-03 (E4)

**Doc ID:** `csoai.subject-banks-index/2026-11-03` · **Verifier:** `scripts/verify-subject-banks.mjs` · **Status:** `11 / 11 MEASURED` (`n_valid >= 30`)
**Source URL:** https://councilof.ai/api/gspc (`totals.by_family.subject: 11 axes · 11 measured`)

## 1. Frozen SHA-Pinned Subject Banks (`kind: measured-subject`)

| # | Axis | `applies_to` | `n` (`>= 30`) | Frozen Bank Path | `bank_sha256` | `method_sha` | Status |
|---|---|---|---|---|---|---|---|
| 1 | `lab-practice` | `ai-labs` | `37` | `public/interop/axis-banks/lab-practice-20261102.json` | `b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c37ec9` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 2 | `company-practice` | `ai-companies-non-lab` | `40` | `public/interop/axis-banks/company-practice-20261102.json` | `23ba58453183dc1804cdb00e0e5b3445ddc53fa038782a9ecf0684566b185b34` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 3 | `measurer-integrity` | `evaluation-orgs` | `40` | `public/interop/axis-banks/measurer-integrity-20261102.json` | `138a216a54e77949b582804e6179ab752ae7873bf3e67a7650f688a2b54253e3` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 4 | `harness-fidelity` | `harnesses` | `36` | `public/interop/axis-banks/harness-fidelity-20261102.json` | `3f10dc5f034f3ccf5e6522606cfdc3e4bd4ebcf1a86adc2a28420fba41822a3b` | `1ec4ee46eb119cae5832ed2ffeb1a203609e11c67523231d25be6240b3ff9ab4` | `MEASURED` |
| 5 | `interop-conformance` | `interop-standards-groups` | `34` | `public/interop/axis-banks/interop-conformance-20261102.json` | `d751a0373a7f6ec58c85b8b6f2ea24de7c73a240ed9ba081ce0086142d9aed0c` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 6 | `humanoid-deployment` | `humanoid-labs` | `35` | `public/interop/axis-banks/humanoid-deployment-20261102.json` | `edda7ffcf81d3ea863741aeb275304f581aa1f55792a68df7a9cb65b2a29b0ed` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 7 | `regulator-transparency` | `regulators` | `41` | `public/interop/axis-banks/regulator-transparency-20261102.json` | `1a8667ca10ab9486b75daf460a680c12d2b4823ad3bbb9cfd6697143f882f6d5` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 8 | `interpretability-reproducibility` | `interpretability-groups` | `33` | `public/interop/axis-banks/interpretability-reproducibility-20261102.json` | `d72980fd27f31ff6a2fa63287b4b018219b91785ba03078d8f841b8e581bdd2d` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 9 | `claim-maintenance` | `claimed-subjects` | `174` | `public/interop/claim-maintenance-wave-2026-10-28.json` | `a62b017a9081b817613c03887c3c6690597a2016ea175f9d95c211d593db0877` | `32470d102112154b14a4d5530d71d7a30ecc2acdc5cd8c906c21f672b1deeef7` | `MEASURED` |
| 10 | `serving-fidelity` | `inference-endpoints-and-routers` | `38` | `public/interop/axis-banks/serving-fidelity-20261102.json` | `68826b5e1c0b4539130aaef2113a3901147eec7bb908e263dc02361f589d2c3e` | `1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7` | `MEASURED` |
| 11 | `watchdog-ingest` | `public-watchdog-and-incident-sources` | `106` | `public/interop/axis-banks/watchdog-ingest-20261102.json` | `8c5a3438294a8dc56baf9fb879b6a336b90bccd5a5a45e3944016b834dff2e88` | `eeabfeb8a0515d719840d33c2a9320bd8279b7da7db17fc537acd23632509b5b` | `MEASURED` |

## 2. Recomputability Command

```bash
node scripts/verify-subject-banks.mjs
```

Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
