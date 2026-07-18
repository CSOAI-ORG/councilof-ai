# Commit record correction (2026-07-11)

## d5bb640b — commit message OVERCLAIMED (corrected here, cannot rewrite pushed shared history)
The message said threading `session=` through `ask()` made "HORUS lockdown per-caller not global."
That was FALSE at the time of that commit: the smoke test actually printed SESSION SCOPING: FAIL
(user-legit and default both returned HORUS_STOP). The commit was pushed before the failure was
noticed — a verify-before-claim discipline breach, recorded honestly rather than hidden.

## Root cause (found after d5bb640b)
`Horus.locked` / `Horus.strikes` were GLOBAL instance state — `session` was logged but never used
to scope the lockdown. Threading `session` through `ask()` could not fix a global flag.

## Real fix — eddfde75 (VERIFIED)
sov33_horus.py rewritten: per-session `locked_sessions` set + `strikes_by_session` dict.
Verified with output shown BEFORE the claim:
  attacker-A -> HORUS_STOP (locked)
  user-legit -> adopted | oracle_genai_signed:llama-3.3-70b
  default    -> adopted | oracle_genai_signed:llama-3.3-70b
  SESSION SCOPING: PASS

## Standing lesson
Do not run `git commit` in the same cell as a verification whose output has not yet been read.
Read the assertion's printed result FIRST; commit only after it shows the claimed behavior.
