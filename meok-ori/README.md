# meok-ori — a local-first agent harness

Modelled on `ori` (OpenRouter's harness). Zero dependencies, stdlib only, works offline today.
Nothing here has been measured against `ori`; the table below compares features, not results.

> **0.2.0 (7 Oct 2026) corrections to 0.1.0.** The "SIGIL-signed" receipts were an HMAC whose
> default key was committed in the source, so anyone with the source could forge them: treat
> every 0.1.0 receipt as unsigned. The key now comes from `MEOK_SIGIL_SECRET` or a key file
> outside the repo (default `~/.config/meok-ori/receipt.key`, created with mode 0600). The run
> audit's chain check used to be hardcoded to pass; it now uses `verify_chain()`. The
> "13-Queen BFT 9/13 council" was always a keyword screen and is now named one (`--screen`,
> `meok screen`). The Parallax default port is 3001, the port Parallax documents.

```bash
pip install -e .
meok run "hello sovereign" --screen --json
meok status
meok constitution          # the 22 articles
meok screen                # the keyword screen's 13 rules
meok eval "compare tiers"  # T1 vs T4 with keyword-screen results
meok harness claude        # wrap any agent CLI, ori-style
meok receipts --verify     # re-check the HMAC chain
```

## meok-ori vs ori

| | `ori` (OpenRouter) | `meok-ori` |
|---|---|---|
| Any model | ✅ OpenRouter catalog | ✅ OpenRouter + Ollama + Parallax (if you run it) + offline stub |
| Local-first | ❌ | ✅ 4-tier cascade: T1 Edge → T4 Strategic, cheapest first |
| Guardrails | org allowlists | ✅ **22-article constitutional gate** enforced per run (default-deny, budget, receipts, no self-approval, public claim state) |
| Output review | none | optional **keyword screen**: harm/risk word lists, a PII regex, a length check. Not a model vote |
| Audit trail | billing page | append-only **HMAC receipt chain** under a local key: detects edits by anyone without the key; not a signature, not third-party verifiable |
| Agent wrap | `ori claude/codex/hermes` | ✅ `meok harness claude/codex/hermes` + sovereign env passthrough |
| Offline | ❌ needs login | ✅ deterministic stub — hermetic tests, no network |
| Eval | `ori eval` (needs key) | `meok eval` — tier comparison + keyword-screen result, offline (not a quality measurement) |
| Dependencies | binary install | ✅ pure Python stdlib |

## The constitutional gate (enforced, not decorative)

Every `meok run` audits these articles and exits non-zero on failure:

- **Art. 2** default deny — unknown models/backends refused
- **Art. 6** budget and payment separate — `--max-cost` checked (default $0.10)
- **Art. 7** research and execution separate — backend classified per run
- **Art. 10** effects bound to receipts — every run appends a receipt
- **Art. 11** verification separate from invocation — the receipt chain's HMACs are re-checked after the run, and a chain that does not verify fails the run
- **Art. 12** not automatic — `--sign` (an HMAC tag over the reply digest, not a signature) is explicit opt-in
- **Art. 19** no self-approval — the keyword screen is deterministic code, separate from the generator
- **Art. 21** public claim state — reported status matches the backend actually used

## Backends (auto-resolve precedence)

1. `openrouter` — if `OPENROUTER_API_KEY` is set (OpenAI-compatible)
2. `ollama` — if `http://localhost:11434` answers
3. `parallax` — if `MEOK_PARALLAX_URL` (default `localhost:3001`, Parallax's documented port) answers
4. `stub` — always: deterministic offline fallback, marked `offline-stub`

## Keyword screen

13 fixed rules over the output text: a harm-word list and a risk-word list (both blocking), a PII
regex (email or 13-19 digits), four "at least 5 characters" rules, one "at least 10 characters"
rule, and five rules with no check that always pass. The text passes if no blocking rule fails
and at least 9 of 13 rules pass, which in effect means: no listed harm or risk word and at least
5 characters. Matching is by substring, so "harmless" trips "harm"; a PII hit alone does not fail
the screen. It is not a council, not Byzantine fault tolerant, and no model votes.

## Receipt key

The receipt chain is an HMAC-SHA256 chain. The key is read from `MEOK_SIGIL_SECRET`, else from
`MEOK_SIGIL_KEY_FILE` (default `~/.config/meok-ori/receipt.key`); if neither exists, 32 random
bytes are written to the key file with mode 0600. Never commit the key: `.meok_ori_key`,
`receipt.key` and `.meok_ori_receipts.jsonl` are git-ignored. Rotating the key makes older
receipts fail verification, which is the intended result.

## Law

Apache-2.0. © 2026 Nicholas Templeman / CSOAI Ltd (UK 16939677).
