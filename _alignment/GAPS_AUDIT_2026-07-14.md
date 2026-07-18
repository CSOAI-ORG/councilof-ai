# 🔍 Honest gaps audit — where we're at, what's missing (2026-07-14)
_Real verification, not a rubber-stamp. Ran/tested everything._

## ✅ WORKING (verified live)
- All 13 sovereign scripts compile/import. `sovereign.py chat` (identity-guarded) + `ask` (grounded+signed) live.
- **Groq free 70B** is the live brain (router → groq). Grounded, cited, care-gated, Ed25519-signed.
- NLI care-gate cached + real (catches contradictions). Layer-0 sandbox nodes + oracle-micro node deployed.
- **FIXED this audit:** acronym false-abstain (DORA/GDPR/NIS2 queries) — retriever now embeds source-tag+text.

## ✗ BROKEN / needs OWNER action (the real to-do list)
| Gap | Status | Fix (owner) |
|---|---|---|
| **NVIDIA key** | 403 rejected — key value refused | Regenerate at build.nvidia.com, re-`export` |
| **Kimi (Moonshot)** | account SUSPENDED — insufficient balance | It's PAID + unfunded → top up, or drop it |
| **DeepSeek** | untested, same class (paid API) | needs a funded DeepSeek account |
| **Modal** | not installed/authed | `pip install modal && modal token new` |
| **Disk** | 2.8 GB free — low | reclaim OrbStack ~34 GB via the app (owner-only) |
| **NO free GPU via SSH** | settled — none exists | GPU = Groq(live)/NVIDIA(fix)/Colab(browser)/Modal(token) |

## Honest reality on the "trillion models" (DeepSeek 1.6T / Kimi 1T)
The sibling wired them into the router, but they are **paid APIs with unfunded accounts** — they do NOT work
right now. The only live big model is **Groq's free 70B**. NVIDIA's free 405B works the moment the key is valid.
Don't count DeepSeek/Kimi as capability until the accounts are funded.

## Still pending from earlier (owner-gated, non-urgent)
Stripe (revenue) · PyPI token (distribution) · gist re-push (corrected eval recipe) · GCP billing (king hive down).

## The one-line truth
Everything I can build/fix is done and green. What remains is **owner credentials/funding/disk** — none of which
I can (or should) touch. Fix the NVIDIA key = biggest single win (free 405B). Everything else already works on Groq.
