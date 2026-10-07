# meok-ori — the sovereign harness

**Better than `ori` (OpenRouter's harness), by construction.** Zero dependencies, stdlib only, works offline today.

```bash
pip install -e .
meok run "hello sovereign" --council --json
meok status
meok constitution          # the 22 articles
meok council               # 13-Queen BFT 9/13
meok eval "compare tiers"  # T1 vs T4 with council verdicts
meok harness claude        # wrap any agent CLI, ori-style
meok receipts --verify     # SIGIL chain
```

## meok-ori vs ori

| | `ori` (OpenRouter) | `meok-ori` |
|---|---|---|
| Any model | ✅ OpenRouter catalog | ✅ OpenRouter + Ollama + **Parallax P2P** + offline stub |
| Local-first | ❌ | ✅ 4-tier cascade: T1 Edge → T4 Strategic, cheapest first |
| Guardrails | org allowlists | ✅ **22-article constitutional gate** enforced per run (default-deny, budget, receipts, no self-approval, public claim state) |
| Output review | none | ✅ **13-Queen BFT 9/13 council vote** — 2 veto queens (Sophia Care, Watch) |
| Audit trail | billing page | ✅ **SIGIL-signed append-only receipt chain**, tamper-verifiable |
| Agent wrap | `ori claude/codex/hermes` | ✅ `meok harness claude/codex/hermes` + sovereign env passthrough |
| Offline | ❌ needs login | ✅ deterministic stub — hermetic tests, no network |
| Eval | `ori eval` (needs key) | ✅ `meok eval` — tier comparison + council verdict, offline |
| Dependencies | binary install | ✅ pure Python stdlib |

## The constitutional gate (enforced, not decorative)

Every `meok run` audits these articles and exits non-zero on failure:

- **Art. 2** default deny — unknown models/backends refused
- **Art. 6** budget and payment separate — `--max-cost` checked (default $0.10)
- **Art. 7** research and execution separate — backend classified per run
- **Art. 10** effects bound to receipts — every run appends a receipt
- **Art. 11** verification separate from invocation — chain verified post-run
- **Art. 12** signing is not automatic — `--sign` is explicit opt-in
- **Art. 19** no self-approval — council voters are separate from the generator
- **Art. 21** public claim state — reported status matches the backend actually used

## Backends (auto-resolve precedence)

1. `openrouter` — if `OPENROUTER_API_KEY` is set (OpenAI-compatible)
2. `ollama` — if `http://localhost:11434` answers
3. `parallax` — if `MEOK_PARALLAX_URL` (default `localhost:1337`) answers
4. `stub` — always: deterministic offline fallback, marked `offline-stub`

## Council

13 queens, quorum 9/13, supermajority 2/3, `ayes > nays + vetos`, and **any veto-queen nay rejects outright**. Hermetic scoring (harm words → Care veto, risk words → Watch veto, PII → Compliance nay, too-short → Strategy/Distribution nay) so the vote runs offline and deterministically — same math as the UE5 BFT tally.

## Law

Apache-2.0. © 2026 Nicholas Templeman / CSOAI Ltd (UK 16939677).
