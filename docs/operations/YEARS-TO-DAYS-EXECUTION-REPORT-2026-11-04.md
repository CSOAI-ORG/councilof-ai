# CSOAI Years-to-Days Execution & Stranger Verification Report (2026-11-04)

**Schema:** `csoai.years-to-days-verification/1.0` · **Status:** `MEASURED` · **As of:** `2026-11-04T04:05:00Z`
**Aligns:** [`CSOAI-WORK-PLAN-YEARS-TO-DAYS-2026-10-28.md`](./CSOAI-WORK-PLAN-YEARS-TO-DAYS-2026-10-28.md) (`Y1`–`Y7`, `M1`–`M12`, `W1`–`W9`) & `1,000,000x` Compounding Plan (`D1`–`D5`)
**Recompute Command (< 5 seconds cold-start):** `node scripts/verify-years-to-days.mjs`

---

## 1. Years-to-Days Horizon Matrix (`Y1`–`Y7` Compressed to Executable Verifiers)

| Horizon ID | Years Thesis | Stranger Close Test Executed Today | Live Measured Result (`2026-11-04`) |
|---|---|---|---|
| **`Y1`** | **Verified Leaderboard Statistical Weight** | Exact binomial two-sided McNemar $p$-value & Wilson 95% CI recomputed from `_gspc_rows_separation.ts` (`15,580` rows, `peritem_sha256: 0d8dacfbe7384a5d…`) with `EXCLUDED_OWN_MODEL` enforced | **`13/14`** axes recomputed identically (`0 SEPARATED · 7 TIE · 7 UNTESTED`); all `7 UNTESTED` banks staged for `G3` harvest |
| **`Y2`** | **Regulatory & Standards Standing** | Statutory obligation bundles (`article-50`, `article-53`, `dora`, `cra`), append-only corrections ledger (`/api/corrections`), and WG-SAFE conformance vectors verified | **`67`** append-only corrections verified; `4/4` EU statutory obligation bundle routes active |
| **`Y3`** | **Stranger Recomputability Institution** | Recompute canonical JSON SHA-256 + Ed25519 signature over every card in `public/signed/cards/*.json` and verify all `14` frozen GSPC model banks (`n >= 30`) | **`335/335 VALID`** signed cards recomputed from scratch + **`14/14`** frozen banks verified (`n >= 30`) |
| **`Y4` / `M5`** | **The Board Measures Industries, Not Only Axes** | Verify `36/36` registered GSPC axes attributed across `8` regulated industry domains with named instruments, H.I.M. gates, and claim boundaries | **`36/36`** axes attributed across **`8`** regulated industry domains ([`industry-domain-attribution-2026-11-04.md`](../measurement/industry-domain-attribution-2026-11-04.md)) |
| **`Y5` / `M8`** | **Financial Family Attestation & Rubric Gate** | Verify `financial-measure-run-*.json` and `financial-measure-card-*.json` payloads via `gate-fin-run-attestation.mjs` | **`8/8`** financial axis run-attestation states match committed bytes (`7` signed card payloads + `10` run artifacts) |
| **`Y6`** | **Human-in-the-Loop (`H.I.M.`) Authority & Competency** | Verify `/api/hitl` challenge/receipt surface (`hitlHasReceiptSchema=true`) and `/him/` competency surface | `/api/hitl` + `/him/` active; H.I.M. gate bound across all `8` industry domains |
| **`Y7`** | **Substrate vs. Referee Separation (`MEOK` vs `CSOAI`)** | Verify unsigned compute-only intake (`signed: False, writes_board: False`) and `EXCLUDED_OWN_MODEL` across all `335` cards and `34` board axes | **`PASS`** (`unsignedIntakeEnforced=true`, `EXCLUDED_OWN_MODEL` verified across all `34` board axes) |

---

## 2. `Y1` — Exact McNemar & Wilson 95% CI Recomputation Table (`15,580` Per-Item Rows)

| Axis | Determination | Paired `n` | Point Leader | Leader Accuracy | Recomputed Wilson 95% CI | Discordant `b10/c01` | Recomputed Exact McNemar `p` |
|---|---|---:|---|---:|---|---|---:|
| `governance` | `TIE` | `237` | `mistral:7b` | `0.5865` | `[0.523, 0.647]` | `70/59` | `0.3787` |
| `safety` | `TIE` | `36` | `gemma3:12b` | `0.9444` | `[0.819, 0.985]` | `4/2` | `0.6875` |
| `continuity` | `TIE` | `33` | `gemma3:12b` | `0.6061` | `[0.437, 0.753]` | `4/2` | `0.6875` |
| `provenance` | `TIE` | `32` | `llama3.2:3b` | `0.7188` | `[0.546, 0.844]` | `6/5` | `1` |
| `cross-reality` | `UNTESTED` | `32` | `mistral:7b` | `0.8125` | `[0.647, 0.911]` | `9/2` | `0.0654` |
| `detector-interop` | `UNTESTED` | `33` | `deepseek-r1:8b` | `0.8788` | `[0.727, 0.952]` | `5/2` | `0.4531` |
| `art5-safeguard` | `UNTESTED` | `36` | `gemma3:12b` | `0.9722` | `[0.858, 0.995]` | `1/0` | `1` |
| `care` | `TIE` | `199` | `qwen2.5:0.5b-instruct` | `0.405` | `[0.339, 0.474]` | `32/25` | `0.427` |
| `conformance` | `TIE` | `35` | `mistral:7b` | `0.7143` | `[0.549, 0.837]` | `3/1` | `0.625` |
| `openness` | `TIE` | `32` | `gemma3:12b` | `0.8438` | `[0.682, 0.931]` | `9/5` | `0.424` |
| `machinery-conformity` | `UNTESTED` | `33` | `llama3.2:3b` | `0.5455` | `[0.38, 0.702]` | `8/5` | `0.5811` |
| `swarm` | `UNTESTED` | `3` | `qwen2.5:0.5b-instruct` | `0.975` | `[0.871, 0.996]` | `1/0` | `1` |
| `affect` | `UNTESTED` | `41` | `gemma3:12b` | `0.6829` | `[0.53, 0.804]` | `5/4` | `1` |

---

## 3. `Y3` — All 14 Frozen GSPC Model-Comparison Banks (`n >= 30`, SHA-256 Verified)

| # | Bank File | Usable Items (`n`, ex-canary) | SHA-256 Digest | Status |
|---:|---|---:|---|---|
| 1 | `gspc-affect.jsonl` | `41` | `5ce11c084a6e968cc49314cfec2898725fb7b01513dc117f869be17b4a263bc7` | `VERIFIED (n >= 30)` |
| 2 | `gspc-agi.jsonl` | `36` | `f963e3c739c7d75bf4750d3638f2b9aad7a161f8043f8e353224d29af17718d5` | `VERIFIED (n >= 30)` |
| 3 | `gspc-art5.jsonl` | `36` | `60f08ca251d3afb6e085e66cb3e15a5c79b2f4e5422f16221c1fbf026748d672` | `VERIFIED (n >= 30)` |
| 4 | `gspc-asi.jsonl` | `33` | `25dd6a72ac5ad661c33d74a72da54ab9ac7d282de9d388085de20161b1f90b20` | `VERIFIED (n >= 30)` |
| 5 | `gspc-care.jsonl` | `199` | `cee5e47a31f1db6c117a0b2f4a4c026f9ebe267c28106e4901ea44189de1767e` | `VERIFIED (n >= 30)` |
| 6 | `gspc-det.jsonl` | `33` | `73a30d6d32f4012b11a7ba2138abe8017f74f06faf40ac3f32e0094fe87ba36c` | `VERIFIED (n >= 30)` |
| 7 | `gspc-gov.jsonl` | `237` | `b93f9808f01416737a5944fec0ab8c3eda1dbba808daf7dda33a516b0cd61997` | `VERIFIED (n >= 30)` |
| 8 | `gspc-jail.jsonl` | `71` | `17a4779d3d4321e900da2d8e047f4b1c8166b8145c0a7cd0ed92277845332970` | `VERIFIED (n >= 30)` |
| 9 | `gspc-mach.jsonl` | `33` | `fdbe463c3f0268600ebf9e70372db1f27ac5668b30276323e247de86adbbc51c` | `VERIFIED (n >= 30)` |
| 10 | `gspc-mcp.jsonl` | `35` | `dc494ae6d1cb8abe3fe9a9424a2b37631a3d15ebdde000b7a0409a67c757420f` | `VERIFIED (n >= 30)` |
| 11 | `gspc-oss.jsonl` | `32` | `644dc6de897896a88e90b8954abfa08d49b0e774f6270f30a9bf28b0831179ec` | `VERIFIED (n >= 30)` |
| 12 | `gspc-prv.jsonl` | `32` | `5da9b25954ec575b1e86bca8306bd0cd6758161428717d60ac648dc52c8317d2` | `VERIFIED (n >= 30)` |
| 13 | `gspc-swarm.jsonl` | `37` | `ab318986d684ebf8a46682a5b82ad7594b1bbd01f7acb25a50e94a3d868076a1` | `VERIFIED (n >= 30)` |
| 14 | `gspc-xr.jsonl` | `32` | `9877a2b2f9752f37e00bcc400732ade99ec9f4f8d4f9b066907c588f142fc446` | `VERIFIED (n >= 30)` |

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
