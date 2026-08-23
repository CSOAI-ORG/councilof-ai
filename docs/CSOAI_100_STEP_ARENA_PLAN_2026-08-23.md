# CSOAI — 100-Step Plan: Learn OpenRouter + LMArena, Beat them with a Signed Leaderboard Engine

**Doc ID:** `csoai-100-step-arena-plan` · **Revision:** 2026-08-23
**Surface:** councilof.ai / csoai.org — signed measurement-data + verified-rankings business
**Doctrine:** measurement-not-certification · nobody-ranked-pays · check-never-assume ·
corrections-appended-not-edited · no banned codenames public · signing key never travels ·
**pod-canonical** (the EAT loop + monorepo on runpods, Oracle backup).

---

## 0. The thesis (grounded)

Three players, three different games:

| Player | Business | Ranked by | Our edge |
|---|---|---|---|
| **OpenRouter** | API gateway/router + model marketplace | Provider usage, price, accuracy | We don't route; we **attest** |
| **LMArena** (LMSYS) | Crowdsourced Elo leaderboard | Pairwise human preference (+ style control, value-Elo) | We're **signed + deterministic + per-domain** |
| **CSOAI (ours)** | Signed measurement + verified rankings | The GSPC axis engine | **Non-gameable, reproducible, auditable** |

The winning move is NOT to replicate OpenRouter (a routing pipe) or LMArena (a crowd Elo).
It is to become the **signed verification layer that both lack**: a leaderboard whose scores a
party can **independently verify** (recompute canonical → content_id → Ed25519 → did:web key),
on a **per-domain axis** basis, that LMArena's crowd Elo cannot fake and OpenRouter's usage rank
does not measure.

**The defensible product:** *"The verified leaderboard. Every Elo, every score, every axis —
signed, reproducible, and independently verifiable."*

---

## PHASE 1 — Learn OpenRouter + LMArena (ground-truth, steps 1-20)

**Objective:** internalize the exact mechanisms we're competing with, so every later step is
measured against reality, not assumption.

1. **OpenRouter API** — exercise the gateway: list `/api/v1/models`, inspect the `providers[]`
   structure (routing provider selection, fallback, price per token, context window). Log findings.
2. **OpenRouter routing** — test `provider.routing` (allow/order/fallback), `max_tokens`,
   top-level `provider.preference`; document how to get "same model, cheaper/faster provider."
3. **OpenRouter pricing model** — capture the `/models` pricing fields (input/output/cache
   per token, per-request); map provider-price variance.
4. **OpenRouter usage/rank** — understand the usage-based ranking (the "top model" per the
   gigazine article); document what signal it encodes (adoption, not quality).
5. **OpenRouter vs direct** — build a small latency/cost benchmark: our gateway vs raw OpenAI/
   Anthropic/API. Quantify the gateway margin (this is OpenRouter's business — we don't take it).
6. **Study OpenRouter "beat" angle** — identify what it does NOT do (no signed provenance, no
   domain-axis measurement, no per-domain non-fakeable leaderboard). That gap IS our lane.
7. **LMArena methodology** — read the current Chatbot Arena spec: pairwise blind voting, Elo
   (Bradley-Terry), the "style control" de-bias, and "value-based Elo" (preference diversity).
8. **LMArena data model** — document the arena `data` lifecycle: polling page, K arms, Elo
   update (K-factor, draw/win), confidence interval, percentile/bootstrapped rank.
9. **LMArena arenas** — enumerate the specialized arenas (SWE-bench, AIME math, WebDev, Vision,
   Search, etc.); note they each measure ONE capability — the exact analogue to our axes.
10. **LMArena weaknesses** — catalog the known reliability criticisms (green-cheek spam, short
    answer bias, style-crowding, selection bias). These are the falsifiable flaws we can measure.
11. **Write a comparative memo** `docs/arena-competitive-analysis.md` (OpenRouter vs LMArena vs
    CSOAI): the 2×2 of "reproducible vs crowd" × "per-domain vs general" and where we win.
12. **Inventory our live assets** — the 3,052-round arena, 16 axes, 10,226-record signed
    dataset, gspc-scoreboard, did:web spine. State the current reproducible-capability gap.
13. **Define the "ours" differentiator** — the one line: *"we publish the verify path; neither
    OpenRouter nor LMArena does."* Socialize it in the brief.
14. **Capture the Elo math** — implement a reference `elo.py` (Bradley-Terry + K-factor +
    confidence interval) that matches LMArena's core, so our scores are comparable/auditable.
15. **Implement Style Control de-bias** — replicate LMArena's length/style control so our
    per-axis Elo is not a proxy for "longer = better" (this is the #1 LMArena reliability fix).
16. **Grounded-metrics baseline** — record which LMArena benchmark scores our engine can
    reproduce exactly (e.g. specific known Elo for a held-out model) — the "can we match them" test.
17. **Set an internal parity target** — define a measurable target: "our per-axis Elo for a
    reference model set is statistically consistent with LMArena's, with CI overlap."
18. **Do a time-boxed research session** — 2 focused hours on OpenRouter provider market +
    LMArena roadmap changes (noted in the memo), no change to code.
19. **Document the trust gap** — write the concrete "why you can't fully trust LMArena/OpenRouter"
    (no public verify path) → this becomes the marketing wedge.
20. **Phase-1 exit: publish `docs/arena-competitive-analysis.md`** + the elo.py reference, pod-canonical.

---

## PHASE 2 — Build the verified leaderboard engine (steps 21-45)

**Objective:** turn our measurement engine into a crowd-validated, signed, per-axis leaderboard
that neither competitor can fake or reproduce.

21. **Extend the GSPC engine** — add per-axis pairwise Elo (win/lose/draw) to the existing
    arena; store per-axis Elo + CI (not just a single score).
22. **Add Style Control** — run a paired human/auto judge controlling for response length/style
    so per-axis Elo measures content, not verbosity. (Reuse step 15 implementation.)
23. **Implement value-based Elo** — weight votes by diverse preference profiles (not just
    "which is better" but "which is better for X persona") — the LMArena v2 advancement.
24. **Signed scoreboard v2** — make the gspc-scoreboard emit a signed Elo table: per axis,
    per model, with CI + percentile, content-addressed (content_id) + Ed25519 signature.
25. **Publish the verify path** — add a public "verify this leaderboard" that recomputes
    canonical → content_id → signature → did:web key, with a one-click demo.
26. **Deterministic replay** — ensure a third party can re-run a probe and get the same score
    (frozen probes, seeded sampling) — the anti-gameability proof.
27. **Ship a per-axis "arena boards" page** — one page per axis (gov, care, jail, etc.) with its
    own Elo leaderboard, so a domain expert can see measurement specific to their domain.
28. **Add a "capabilities vs crowd" view** — overlaid view: our per-axis signed Elo vs LMArena's
    general Elo, so the difference we capture is visible.
29. **Model dedupe/merge** — "a model NAME is not a model; join on weights" — implement a
    canonical model identity (weight hash) so two providers serving the same weights collapse.
30. **Longitudinal drift signal** — surface the frozen-probe re-run drift as a first-class
    chart (per axis, per generation) — the unique "capability drift over time" product.
31. **Anti-Goodhart** — add the fuel law + overfit-gap reporting + AILuminate novel set + split
    salt (already in the estate) so the leaderboard resists proxy-gaming.
32. **Confidence labeling** — every score carries n, CI, and "design vs measured" — never
    overclaim a thin-n score as a ranking (estate's living-attestation discipline).
33. **Signed dataset v0.2.0** — repackage the corpus with per-axis Elo + CIs, re-signed, so the
    research/enterprise leg gets the richer artifact.
34. **Stake a domain-axes claim** — publish "the only per-domain signed leaderboard" positioning
    (vs LMArena's general crowd Elo, OpenRouter's usage rank).
35. **Regression suite** — an automated check that recomputes a reference Elo from a recorded
    round set and asserts the published score matches (integrity gate).
36. **Reference-model parity test** — run our engine on LMArena's public reference models and
    confirm our signed per-axis scores are within CI of the public record (credibility).
37. **Benchmark the benchmark** — a small study comparing our signed Elo vs crowd Elo on the
    same pair set; report the correlation + where they diverge (our value-add).
38. **RAG/retrieval axis** — add a "groundedness" axis to the engine (we already have a
    grounded /api/chat) so leaderboards include hallucination-resistance, not just preference.
39. **Provenance chain on every round** — hash-chain the arena rounds so a historical score
    cannot be altered retroactively (append-only corrections).
40. **Public audit endpoint** — `/api/arena/rounds.jsonl` + a `/api/arena/verify` that returns a
    signed verification receipt for any round/score.
41. **Bootstrap the scoring** — add the "I typed the model output" bootstrap CI (percentile
    bands) so rank is honest about uncertainty.
42. **Per-axis weighted composite** — an optional composite index that a buyer can weight by
    their domain priority (not a fake overall rank).
43. **Open the judge** — publish the judge prompt/harness so a third party can reproduce the
    axis scoring (transparency = trust).
44. **Name the bug class we kill** — document the exact failure modes we remove that LMArena
    has (style bias, spam, no verify path) — the wedge.
45. **Phase-2 exit: a live, signed, per-axis leaderboard** with public verify, deployed to
    councilof.ai, pod-canonical scoreboard data.

---

## PHASE 3 — Make it a competing data-generation business (steps 46-70)

**Objective:** convert the verified leaderboard into revenue + reputation that drains OpenRouter/
LMArena mindshare, on the doctrine-safe legs only.

46. **Enterprise data license** — license the signed per-axis Elo corpus (the enterprise leg;
    nobody-ranked-pays stays intact: the buyer licences data, is not the ranked party).
47. **Researcher verified-rankings subscription** — paid access to the signed, per-axis,
    longitudinal dataset + replay harness.
48. **Regulator attestation package** — signed evidence of a model's per-axis behavior (evidence,
    NOT a certification — honest label).
49. **Public free tier** — the signed leaderboard + verify demo stays free (the moat is
    verifiable, so free is fine — it drives adoption).
50. **OpenRouter comparison tool** — a "your model here" tool: pick a provider/model, get a
    signed per-axis scoreboard (positioned as "OpenRouter routes; we attest").
51. **LMArena cross-reference** — publish our per-axis scores alongside the LMArena general Elo
    for the same model, so an analyst sees the domain resolution LMArena lacks.
52. **Submit to LMArena** — register our reference models to LMArena itself (legitimate exposure;
    we're measuring, not gaming), so our names appear on BOTH boards.
53. **Vendor/enterprise pilot** — 1 design-partner enterprise: license the signed corpus + get a
    per-domain scorecard. (Owner-gated on legal.)
54. **Pricing surface** — add the data-license tiers to `/legal/licensing` (legal-surface-only,
    already partly done with +7.1 Data Licensing).
55. **Reputation flywheel** — each signed verifiable score is linkable; the "prove it yourself"
    demo is the shareable unit that draws in researchers.
56. **Cite-and-attribution** — make every published score carry a citation/permalink so academic
    and industry analysts reference us (the LMArena mindshare channel).
57. **Public "trust ledger"** — a page listing every verification we've issued, append-only,
    so reviewers see the corpus is real and growing.
58. **Data-licensing terms** — finalize the UK/EU database-right assertion + substantial-
    extraction license (already drafted in IP_NOTICE) tied to the signed corpus.
59. **2 design-partner case studies** — turn the first BaaS + enterprise pilots into publishable
    ROI stories ("we verified X in domain Y; here's the signed receipt").
60. **OpenRouter pricing counter-tool** — show total cost of a workflow vs OpenRouter's gateway
    margin (we're not a router, so we're not competing on price — we compete on trust).
61. **LMArena gap study** — publish the reliability critique (style bias, no verify, spam) as a
    research note; the honest "we can do better" evidence.
62. **Domain packs** — sell per-domain packs (finance, healthcare, defense compartments) with
    signed, per-axis scoreboards for that domain's regulated models.
63. **Researcher-grant program** — free access for academics publishing with our signed data
    (drives citations + independent re-verification).
64. **Benchmark registry listing** — get our benchmark into mcp.so / Glama / Kaggle so it's
    discoverable as a credible, signed leaderboard (owner-gated for some).
65. **Cross-site embedding** — a `<script>`/embed so a blog or site can show a verified per-axis
    scoreboard with a live verify link (the shareable widget).
66. **API for analysts** — a signed, rate-limited `/api/arena/leaderboard` (per-axis Elo + CI +
    verify) for data-journalists/researchers.
67. **SEO for "verified leaderboard"** — target "verified AI leaderboard", "per-domain Elo",
    "signed arena" queries (LMArena owns "elo leaderboard"; we own the "verified" modifier).
68. **Monthly "verified board" report** — a signed, dated recertification of the leaderboard
    (like LMArena's monthly updates, but auditable).
69. **Partner integrations** — GRC/integration consultancies resell the per-domain scoreboard
    into regulated sectors (service layer, not re-rank).
70. **Phase-3 exit: a live paid data-license + researcher subscription + regulator package**
    on the doctrine-safe legs, with the signed leaderboard driving reputation.

---

## PHASE 4 — Deploy + wire the EAT loop for continuous improvement (steps 71-100)

**Objective:** make the whole capability self-improving, running from the pods (not the Mac), so
the leaderboard gets better every cycle and never strands work.

71. **Automate the leaderboard publish** — a pod cron/scheduler that runs the axis-engine,
    aggregates per-axis Elo, signs the scoreboard, and commits to the monorepo (councilof-ai).
72. **Auto-verify in CI** — a GH Action step that recomputes and asserts the published Elo from
    the recorded rounds (no silent drift).
73. **Oracle backup of the leaderboard** — extend `pod-backup-oracle.sh` to include the
    per-axis Elo corpus + signed scoreboard (already have datasets in backup).
74. **Scheduled Oracle backup** — add `pod-backup-oracle.sh` to the pod crontab (alongside
    eat_loop.sh) for automatic pod→Oracle backup.
75. **A100 bench-corpus backup** — wire the A100's live bench corpus (`/workspace/bench/`, the
    highest-value raw data) into the Oracle backup too.
76. **Feed the axis-engine into the publisher** — the A100 measure loop's output auto-feeds the
    scoreboard publisher (no manual copy).
77. **Auto-signed-dataset** — `build_dataset.py` re-runs on the pod each cycle; dataset re-signed
    and pushed (v0.2.0+), surviving in Oracle backup.
78. **Monitor the engine** — a health dashboard for the measure loop: throughput, clean-rate,
    errors, signed-cards-per-cycle (currently 10 signed cards on A100).
79. **Alerting** — if the axis-engine stalls or the scoreboard verify fails, alert (pager/notify).
80. **Slack/webhook report** — a daily signed summary of new rounds, per-axis Elo deltas, and
    verify status.
81. **Auto-PR to monorepo** — the pod pushes the updated, signed leaderboard data + scoreboard
    as an auto-PR to councilof-ai (never raw-commit onto another lane — PR by name).
82. **Lean the EAT loop** — tighten the cycle: measure → package → sign → publish → deploy → verify
    → backup, all on the pods, no Mac step.
83. **Self-test the pipeline** — a deterministic end-to-end test that a fresh viewer can verify
    today's scoreboard signature (the trust demo, automated).
84. **Capacity watchdog** — ensure the fleet (3090 + A100) is healthy; don't stop the A100 (it's
    productively benching 30B). Automated start/stop guard.
85. **Model-library refresh** — keep the reference model set current (pull new open weights,
    re-measure, append — never overwrite history).
86. **Per-generation report** — a signed "drift" summary each generation (the unique longitudinal
    weekly capability-drift product).
87. **Backup integrity test** — periodically restore from Oracle and re-verify the dataset sig
    (we proved it survives; now automate the proof).
88. **Failover** — if the 3090 dies, the A100 or Oracle has the corpus + the monorepo has the
    committed ledger (recoverable from Oracle backup).
89. **Runbook** — document `docs/leaderboard-runbook.md`: the exact pod commands for every
    measure/publish/backup/verify path (operational simplicity).
90. **Everything pod-canonical check** — a recurring script that asserts no critical artifact
    exists only on the Mac (never strand on laptop).
91. **Continuous competitive watch** — a cron that re-pulls OpenRouter model list + LMArena
    board state, diffing weekly (near-real competitive intel).
92. **Gap auto-detection** — detect when a new LMArena/OpenRouter feature lands that we should
    match or counter (the "learn more" loop made automatic).
93. **Benchmark the live model set quarterly** — re-run the reference suite so the leaderboard
    tracks the frontier (signed, append-only).
94. **Community open-source the engine** — publish the measurement harness (MIT, per the 234+
    MCP servers precedent) so the methodology is auditable (the moat is verifiable).
95. **Crowd-verification beta** — a public "verify a model here" submit flow where a user can
    run a probe and check the signed result (early community-ledger).
96. **Institutional outreach** — send the signed benchmark to academic evaluation labs
    (owner-gated) to seed citations; the enter-the-room play.
97. **Publish one peer-style result** — a research note showing per-domain signed Elo resolves
    capabilities LMArena's general Elo collapses; the differentiator demonstrated.
98. **Revenue telemetry** — track data-license + researcher + regulator signups against the
    leaderboard's verify-demo traffic (the funnel).
99. **Confidence audit of the whole engine** — re-verify every signed surface scans clean
    (banned codenames, no fabricated capability, measurement-not-certification).
100. **Phase-4 exit: a self-improving, pod-canonical, verified-leaderboard engine** running EAT
    continuously, backing up to Oracle, auto-publishing to the monorepo, and demonstrably
    different from (and more verifiable than) OpenRouter + LMArena.

---

## What we are NOT doing (doctrine lines we will not cross)

- **No model vendor pays to enter / be ranked** (nobody-ranked-pays).
- **No fabricated settlement/blockchain/custody claim** — verification, measurement, attestation
  only.
- **Never label a measurement a certification** (measurement-not-certification, living attestation).
- **Never rename a live infra hostname** during a de-brand (the step-2 lesson — label codenames
  yes, live project hostnames no).
- **No banned codenames on any public surface.**
- **Signing key never leaves the signing node.**

---

## One-line positioning to carry through all 100 steps

> **OpenRouter routes inference. LMArena ranks by crowd preference. CSOAI attests it.**
