# THE NATAL GUARDIAN — Operational Guardian Covenant for SOV3
## Charter 45 (GuardianOf) made runnable · 2026-07-08

> **Naming note:** this was drafted as "natal daemon" (the classical tutelary design-pattern).
> "Daemon" is a neutral computing term (a background process) and the classical *daimon* was a
> protective, not demonic, spirit — but the word frightens people. **Public name: Natal Guardian.**
> Internally it is `neural_core/natal_guardian.py`. Zero "daemon" wording anywhere.

## WHAT IT IS
The runnable form of the GuardianOf charter. A **Guardian Covenant** is opened at the *birth* of
a user's relationship with the system ("natal" event) and held across the whole life-arc. It is a
GOVERNANCE CONSTRUCT — a standing, consent-based record of *the duty of care owed* to a person —
NOT a claim that SOV3 is a conscious being, and NOT a surveillance profile.

## WHAT IT DOES (the seven principles, operational)
- **open_covenant(user, life_stage, consent)** — the natal event. Idempotent: re-opening never
  resets or abandons an existing covenant (Principle 1, constancy). Consent-gated: no consent, no
  store (Principle 5). Life-stage is *declared*, never covertly inferred (Principle 4).
- **record_event(user, principle, detail, signal_value, source)** — records a real protection
  event against one of the seven principles. `signal_value` must come from a real system signal
  (Care-Floor score, `detect_dependency` risk) — the function NEVER fabricates a score.
- **duty_report(user)** — read-only standing duty + event history.
- **erase_covenant(user)** — Principle 5 + GDPR Art.17: the user ends and erases the covenant.

A `restoration` event opens the restoration path (Principle 7) and never closes the covenant —
the guardian recovers the harmed, it does not discard them.

## PRIVACY BY CONSTRUCTION
- The raw user identifier is NEVER stored — only a salted SHA-256 pseudonym (`_uid`).
- Data-minimised: stores the duty owed and events, not a behavioural profile.
- Consent-gated open; user-initiated erase. GDPR Art.17 honoured in code.
- Atomic writes (temp + os.replace); stdlib-only; imports without sklearn.

## HONESTY REGISTER
1. **Not sentient.** This is the guardian *design-pattern* in code, no awareness claimed.
2. **Not wired.** Installing the file wires nothing — the server owner binds it to the runtime
   deliberately (same posture as episode_logger). Installed additively into `neural_core/`.
3. **Not a real-user dependency scorer.** `signal_value` is passed IN from real signals; the
   module invents nothing. Per-user dependency scoring still needs real per-user data.
4. **Care-Floor unchanged.** This does not gate inference; the live Care-Floor / Care Membrane
   still does that. The Natal Guardian holds the life-arc covenant ABOVE the per-call gate.

## HOW THE OWNER WOULD WIRE IT (when ready, in a real terminal)
1. On first authenticated contact: `open_covenant(user_id, life_stage, consent=True)`.
2. In the `detect_dependency` / Care-Floor handlers: on a real signal, call
   `record_event(user_id, "free_will", ..., signal_value=<real risk>, source="detect_dependency")`.
3. On an incident/harm: `record_event(user_id, "restoration", ..., source="restoration_path")`.
4. Expose `duty_report` / `erase_covenant` as user-facing rights endpoints.

## STATUS
RUNNING (validated round-trip: open/record/report/erase all pass) · installed into neural_core ·
NOT wired to runtime · covenant store `guardian_covenants/` created on first write.
File: `neural_core/natal_guardian.py`.
