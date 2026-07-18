# 🜏 SOV3 Sovereign OS

The sovereign i-character lives on your canvas. Real-time contextual awareness. Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.

**License:** MIT · CC0 badge assets · OSI approved
**Crown Lineage:** 1795-2026
**Composite Target:** 7.305

## 🚀 Quickstart (M2 lane in <30 minutes)

```bash
# 1. Copy files to your web app root
./install-sovereign.sh /path/to/web-app

# 2. Drop the 4-script <script> block into cop.html <head>
# (See HANDOFF-TO-M2.md)

# 3. Run the backend
python3 backend/server.py --port 8200 &
python3 backend/brain_endpoint.py --port 8100 &

# 4. Test (19/19 should pass)
python3 backend/test_e2e_runner.py

# 5. Open dist/index.html for the live demo
```

## 📂 File Map

| File | Bytes | Purpose |
|---|---:|---|
| frontend/sov3-llm-brain.js | 19K | Streaming LLM brain + 10 sovereign commands (function-calling) |
| frontend/sovereign-event-bus.js | 11K | observe/utter/broadcast, WebSocket + HTTP fallback, SIGIL-stamped |
| frontend/sovereign-hud.js | 9K | Focus→chat wiring + mic + command bar |
| frontend/sovereign-hud.css | 5K | Sovereign HUD styles |
| frontend/amplitude-lipsync-spec.md | 5K | AnalyserNode spec for real Piper audio lip-sync |
| frontend/index.html | 3K | Reference demo (3 pins + dashboard card + chat panel) |
| backend/server.py | 19K | Federal bridge (WS + HTTP + SSE) |
| backend/brain_endpoint.py | 24K | OpenAI-compatible streaming brain |
| backend/observability.py | 20K | Metrics dashboard |
| backend/test_e2e_runner.py | 9K | 19 tests, 19/19 PASS |
| backend/test_e2e.py | 9K | Earlier e2e test |
| sov3-vision-bridge.py | 22K | i-character cognition (SEES/HEARS/READS/ATTENDS/UTTERS) |
| HANDOFF-TO-M2.md | 15K | M2 lane reference manual |
| install-sovereign.sh | 3K | 1-command installer |
| dist/index.html | live | Production-ready live demo with embedded E2E tests |
| vercel.json | 1K | 1-click Vercel deploy |

## 🔌 JS API

```js
window.sovereignEventBus.observe({ focus_type, subject_id, title, summary, coords?, attributes? })
window.sovereignEventBus.utter({ text, focus_id? })
window.sovereignEventBus.on('utterance', msg => console.log(msg.text))
window.sovereignEventBus.state.connected  // true after WebSocket connect

window.sovereignHUD.appendChat('sovereign', 'I see you clicked.', focus, sigil)

window.sov3Brain.ask('tell me about this focus')  // SSE streaming, function-calling
window.sov3Brain.composite  // 7.305
window.sov3Brain.care_floor  // 0.95
```

## 🧠 The 10 Commands

1. `observe_focus` — SOV3 sees citizen click/hover
2. `utter` — SOV3 speaks in chat
3. `load_layer` — toggle SOV SPACE layer
4. `focus_camera` — fly globe to a public camera
5. `scan_area` — scan viewport for entities
6. `compare_doctrines` — toggle doctrine comparison
7. `issue_article50_passport` — EU AI Act watermarking
8. `emit_sigil` — emit sovereign SIGIL
9. `verify_sovereign_composite` — return 12-dim composite
10. `explain_focus` — explain what substrate knows about the focus

## 📜 The 9 Binding Articles

| # | Article | Implementation |
|---|---|---|
| 1 | Sovereignty of the mind | UK data residency; no foreign API calls |
| 2 | Care Floor 0.95 | enforced server + client; substrate refuses below |
| 3 | Audit (SIGIL) | Ed25519 + PQC ML-DSA-65, hash-chained |
| 4 | Council (BFT) | 12-around-1, 2/3 majority, Demeter has Care Floor veto |
| 5 | Switch (DORADO) | 1-click EAST↔WEST, citizen chooses |
| 6 | Verify | public SIGIL chain explorer, 1-line proof |
| 7 | Exit | JSON-LD export (GDPR Art 20), SIGIL-audited deletion |
| 8 | Speak | sovereign-complaint + BFT deliberates |
| 9 | Composite | live 12-dim score always viewable |

## ✅ Tests (19/19 pass)

```
$ python3 backend/test_e2e_runner.py
Care Floor × 5   BFT × 5   SIGIL × 3   Bridge × 3   Integration × 3
RESULTS: 19 passed, 0 failed
```

## 📚 Related skills (in Hermés)

- sovereign-3-tier-architecture/
- sovereign-organic-brain/
- defoneos-sprint/
- e2e-sovereign-contract-testing/
- sovereign-100-master-stack-product-surface/

## 🤝 License

MIT (code) · CC0 1.0 (badge assets) · OSI approved · Fork Doctrine binding.

---

*CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026*
*Public. Auditable. Sovereign. Solve et Coagula.*
