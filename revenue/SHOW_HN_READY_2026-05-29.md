# Show HN — READY TO POST (consolidated, 2026-05-29)

**Supersedes:** `SHOW_HN_post.md` (compliance angle) + `SHOW_HN_POST_2026-06-03.md` (TUI angle).
**Precondition status:** ✅ `brew tap CSOAI-ORG/meokclaw && brew install meokclaw` is **LIVE and smoke-tested** (v1.0.0, auth endpoint responding). The one thing that was blocking the June-3 draft is now done.
**Optimal timing:** Tue–Thu, 8:00am ET (1:00pm UK). Respond to every comment in the first 2 hours.

Two angles below. **Angle A (TUI) is post-ready today** — it has no broken dependencies. **Angle B (compliance) is stronger for revenue but BLOCKED** until the public verify endpoint is live (see ⚠️). Recommend posting A now, holding B until the verifier is reachable.

---

## ANGLE A — TUI (POST-READY ✅)

**Title (78 chars):**
`Show HN: MEOKCLAW – a terminal AI companion with a fault-tolerant agent council`

**URL:** `https://github.com/CSOAI-ORG/homebrew-meokclaw`

**Body:**

Hi HN,

I built MEOKCLAW — a terminal UI for a local-first AI companion. Instead of routing your prompt to one model, it runs a small "council" of agent personas that vote on a candidate response before it's shown, using Byzantine fault-tolerant consensus (2/3 supermajority). If they can't agree, it tells you they disagree instead of confidently making something up.

**Why I built it:**
- I wanted an assistant that lives in the terminal where I work
- Single-model tools fail silently when the model is wrong; an ensemble that can *abstain* felt more honest for high-stakes questions
- I wanted memory that persists locally across sessions

**How it works:**
- Built with Bubble Tea (Go) — single ~11MB binary, no runtime deps
- Talks to local Ollama models, with optional cloud fallback (your own keys)
- Council = lightweight agent personas with different roles/prompts; they score candidate answers and a supermajority wins
- Memory persists locally (SQLite + a small vector store)

**Honest limitations (please don't skip this):**
- It's slower than a single model — more agents = more compute. Tradeoff is deliberate.
- Earlier versions of my docs used "consciousness" language. That was overblown. This is an **ensemble with a voting layer, not sentience** — I've been walking that back.
- Cloud features need your own API keys; the genuinely-free path is local Ollama.

**Try it:**
```
brew tap CSOAI-ORG/meokclaw
brew install meokclaw
meokclaw
```
Free tier works out of the box. Pro (cloud sync + voice council) is a paid add-on — totally optional.

**What I'd love feedback on:**
1. Is BFT-style consensus genuinely useful for a personal assistant, or is it overkill?
2. The "abstain when models disagree" behaviour — useful, or annoying?
3. Terminal-first — still viable, or is a GUI table-stakes now?

Solo founder, UK. Happy to answer anything.
— Nicholas

**First comment (post immediately after, adds depth):**

> Some technical detail I didn't want to bloat the post with:
>
> The council isn't 33 separate LLM calls per turn (that'd be unusable). It's a tiered scheme — a fast first-pass model proposes, and the council only spins up when confidence is low or the topic is flagged high-stakes. So most turns are single-model-fast; the expensive path is reserved for when disagreement actually matters.
>
> Stack: Go + Bubble Tea for the TUI, Ollama for local inference (Gemma/Qwen class models work well), SQLite + sqlite-vec for memory. The whole thing is one static binary.
>
> Side note for anyone in regulated industries: the same org also ships open-source MCP servers for EU AI Act / DORA / NIS2 compliance auditing (`pip install meok-eu-ai-act`, docs at csoai.org). Different product, same care about "don't claim more than you can prove." Happy to talk about either.
>
> Roast away — I'd rather hear what's wrong now than after I've built more on a bad assumption.

---

## ANGLE B — Compliance MCPs (HIGHER REVENUE, ⚠️ BLOCKED until verifier is public)

> ⚠️ **DO NOT POST until the public verify endpoint is live.** As of 2026-05-29, proofof.ai has no SSL cert and meok-attestation-api.vercel.app returns 401 on every path (Vercel Deployment Protection). This angle's entire credibility rests on "auditors verify at a public URL" — posting it while that 404/401s would be self-sabotage. Fix the Vercel protection toggle first, confirm a real verify URL resolves, then post.

**Title (corrected — no inflated counts):**
`Show HN: Open-source MCP servers for EU AI Act / DORA / NIS2 compliance`

**URL:** `https://csoai.org` (live) — NOT proofof.ai until fixed.

**Body (skeleton — finalize after verifier is live):**

Hi HN,

Solo UK founder. I've built a set of MCP (Model Context Protocol) servers that run compliance audits for the EU AI Act, DORA, NIS2, CRA and ~10 other frameworks — article-by-article, inside Claude/Cursor — and emit an HMAC-SHA256 signed attestation your auditor can verify at a public URL without touching my backend.

The problem: an EU AI Act Article 11 technical-documentation pack has 14 mandatory fields. Most teams I see cover 3–4. Consultants charge £15–50k for the gap analysis.

- `pip install meok-eu-ai-act` — Articles 9–72 coverage
- `meok-dora`, `meok-nis2`, `meok-cra` — + ~10 more, all on PyPI, MIT-licensed
- Free tier (self-attested) until EU AI Act high-risk enforcement (2 Dec 2027). Paid: £79/mo Pro, £1,499/mo Enterprise.

Feedback wanted: is the signed-attestation model what auditors actually want? Which framework next — deeper ISO 42001, or the UK AI Bill?

(Finalize the verify-URL sentence + add the live link once the endpoint resolves.)

---

## Posting checklist
- [ ] **Angle B only:** confirm public verify URL resolves (200) before posting
- [ ] Post Tue–Thu, 8:00am ET
- [ ] Use the exact title above (curiosity + specificity, no inflated numbers)
- [ ] Post the first comment within 60 seconds
- [ ] Reply to every comment in the first 2 hours; never defensive
- [ ] Don't mention "consciousness," "78%," or any unprovable metric
- [ ] Cross-post to r/programming / r/commandline (Angle A) the next day
