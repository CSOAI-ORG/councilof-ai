# Handoff to M4 — Sovereign chat has zero factual grounding on "what is CSOAI" (2026-07-08)

## Finding (confirmed live, reproducible)
Asked the live Sovereign chat (`os.meok.ai/api/chat`) "What is CSOAI?" with no persona/queen_id
context (the default state a first-time visitor would hit). Got two different fabricated answers
across two calls (different backing models -- gpt-oss-120b then llama-3.3-70b), both generic and
wrong: "a research community or institute," "a collaborative effort... a gentle compass" -- zero
mention of AI governance, EU AI Act, cybersecurity, or anything about the actual product. When I
fed a leading question ("...for AI governance and EU AI Act compliance?") it just echoed that
framing back with filler, confirming there's no real grounding underneath, only style.

## Root cause (traced to source, `meok-os-deploy/api/chat.js`)
- Line 3: `const SYSTEM = "You belong to the user inside their own sovereign OS... Reply in 1-3 warm
  sentences... Human, warm, kind. Never corporate, never a disclaimer-bot."` -- pure persona/tone,
  zero facts.
- `buildSystem(body)` (line 28): when there's no `queen_id` and no `persona` in the request (the
  default path), it falls straight through to `'You are the MEOK Sovereign — a calm, remembering
  companion. ' + SYSTEM` -- still zero facts.
- The council data (`api/_data/council.json`) is entirely mythological (names, mottos, personality
  traits, "speaks_about" topic tags) -- no queen persona carries real product facts either, so even
  fully-personified answers would have nothing to draw on.
- By contrast, `api/govern.js` genuinely IS grounded -- a real, correct, hand-built table of
  frameworks (EU AI Act, GDPR, DORA, NIS2, HIPAA, Basel III, MiFID II, ISO 42001, etc.) keyed by
  industry. This data exists and is correct; it's just not wired into `chat.js`'s system prompt.

## Suggested fix (not made -- this file is in your active working tree, not mine to commit)
Append a short, factual "what CSOAI actually is" block to the base `SYSTEM` string (or to
`buildSystem`'s no-context fallback) -- 2-3 sentences naming the real product surface (AI
governance + cybersecurity platform, EU AI Act/DORA/NIS2 crosswalks, signed Ed25519 assurance,
378-tool MCP catalogue) so the model has something true to draw on instead of confabulating,
while keeping the "warm, 1-3 sentences, never corporate" style constraint intact. Given this is a
one-line-ish system-prompt change with no schema/API shape impact, should be low-risk to land
whenever you're next in this file.

## Why this matters
This is the single most likely first question a prospect or the demo audience asks the flagship
Sovereign character, and it currently fails completely and inconsistently (different wrong answers
on every call). It's a first-impression risk larger than most of what's in the adversarial audit
(docs/handoff/ADVERSARIAL_AUDIT_2026-07-08.md in councilof-ai) -- flagging it separately/here since
it lives in your repo, not mine.
