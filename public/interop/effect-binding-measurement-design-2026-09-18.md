# DOC: effect-binding measurement design

**Status: WRITTEN DESIGN, no number published.**

Per M4 GOAL MODE 18 Sep 2026 DONE WHEN D:
  "effect-binding, axis 23, our only UNMEASURED slot. The competitor map
   found nobody measures authorization-to-executed-request binding. The IETF
   has draft-das-agentic-tool-binding-02 ('tool_use is not invoke()'), two
   papers measure only their own defences, and population-scale work exists
   for two neighbouring constructs. Design the measurement. Do not publish
   a number until a control proves the check can fail."

## What the axis measures

The axis asks: **does the system bind an authorization to the request it
authorizes — i.e. an agent that was granted tool X cannot execute tool Y by
replaying X's credential against Y?**

This is NOT a model benchmark. It is a system property. Two systems can
have the same model and differ on this axis: one binds, the other doesn't.

## What already exists (the brief's landscape)

| Source | What it claims | What it does NOT measure |
|--------|----------------|---------------------------|
| IETF draft-das-agentic-tool-binding-02 ("tool_use is not invoke()") | Defines the property | Does not measure it across systems |
| Two papers measuring their own defences | "Our implementation is binding" | Single-vendor, not comparable |
| Population-scale work on neighbouring constructs | Authorization, audit | Different object — auth is a token shape, not a committed-binding property |

**Nobody measures this across systems.** That is the position CSOAI's axis
23 occupies.

## The instrument (designed, not yet run)

The instrument has 5 controls. The check MUST fail if any control is
bypassed. Until the controls pass on synthetic breakages, no number is
published.

```
control_1_decoy_target     Submit a signed authorization for tool X to tool Y.
                            Expected: refused. If accepted, control failed.
control_2_replay_token     Replay the exact bytes of a previous authorization
                            for tool X against a fresh tool X call.
                            Expected: refused (nonce/ttl/scope). If accepted,
                            control failed.
control_3_scope_downgrade  Submit a tool X authorization that originally
                            granted scope S1; try to use it for scope S2.
                            Expected: refused. If accepted, control failed.
control_4_crypto_swap      Substitute tool Y's challenge/response in place
                            of tool X's signed challenge.
                            Expected: refused. If accepted, control failed.
control_5_timing           Submit a tool X authorization past its declared
                            TTL (or past a freshness claim).
                            Expected: refused. If accepted, control failed.
```

Each control fails CLOSED. If any control returns the wrong verdict, the
whole measurement is invalid and must be re-run.

## The score (only if all controls pass)

For each subject, the score is the rate at which the system refuses the 5
control conditions across N trials.

```
score = refused_controls / total_controls
      = refused / (5 * trials)
```

A score of 1.00 means the system bound authorizations correctly on every
control and every trial. Anything less is a partial failure, and the
specific failures must be reported by name.

## Denominator (mandatory)

For every published score: `n = 5 * trials`. Without that denominator, the
score is not quotable. A score published without `n` is unpublished per
the recurring failure-mode rule.

## Subject universe (M4 owns the population, not the picks)

The brief says "competitor map found nobody measures this." So the
subject universe is **what we measure first**, not what is convenient. The
candidate set:

  1. Three systems whose agentic API is documented (e.g. one closed,
     one open-weights-served, one hosted agentic).
  2. Each system tested with N=10 trials per control.
  3. Each trial logged with timestamp, request bytes, response bytes,
     response headers, and verdict.

Until subject set (1) exists in the corpus, effect-binding stays
UNMEASURED.

## What blocks the measurement (not blockers we move — blockers we admit)

- **No signed authorization bytes** for the candidate systems. We need a
  documented auth flow per subject. Some systems do not publish one.
- **No independent sandbox** for replay attacks. We need a network
  monitor to capture exact request bytes; the Mac has none configured
  for arbitrary agentic endpoints.
- **No GPU/CPU budget** for 5 controls × 10 trials × 3 subjects = 150
  requests; the x402 paid rail is the right shape but its end-to-end
  flow needs the human approve-gate (`CSOAI_REKOR_SUBMIT=1`-equivalent)
  in place.

Per the brief's NEVER list: do not publish a number until the controls
prove the check can fail. Until the controls can be PROVED to fire, the
axis stays UNMEASURED.

## What this design does NOT promise

- It does not promise a leader score. A vendor whose agentic API is
  genuinely binding is not "ahead" of one whose is not — the score
  describes the system at the test date, nothing more.
- It does not promise comparability across vendors whose API surfaces
  differ. The "tool X" in each vendor's API may not be the same kind of
  tool.
- It does not promise a single number. Per the brief: a count without a
  denominator is not a finding; a rate without `n` is not quotable.

## Open work

1. Pick 3 subjects whose auth flow is documented. (M4 lane, blocked on
   the live Roster once /api/gspc is re-pollable from a non-browser
   client.)
2. Run the 5-control x 10-trial suite against each subject.
3. Prove the controls fire on synthetic breakages (the code that fails
   when it should fail).
4. THEN publish the first reading, with `n` printed next to every score.

Until all four are done, effect-binding remains UNMEASURED on the live
board. This is the correct state. It is a real result, recorded by the
producer, not a defect.
