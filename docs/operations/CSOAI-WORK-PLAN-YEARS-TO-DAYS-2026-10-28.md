# CSOAI — all outstanding work, mapped years → days

**Doc ID:** `csoai.work-plan-years-to-days/0.1` · **Revision:** 2026-10-28
**Surface:** the estate's own operating plan. Internal; not published.
**Doctrine:** measurement-not-certification · UNMEASURED is an answer, never 0 · a lock is not a
grade · corrections appended, never edited · the judge is never the subject.

---

## 0. How to read this

Five horizons, and one rule for every row: **a row is closed when a named artefact exists that a
stranger can check.** Nothing here is "improve X" or "work on Y". If the close test cannot be
written as a file, a URL, a digest or a number, the row is not ready to be worked on.

| horizon | what it means | who closes it |
|---|---|---|
| **YEARS** | 2–5 years. Structural standing, coverage and trust. No artefact closes a year of work; a *published body of evidence* does. | the Council |
| **MONTHS** | 1–6 months. Programme work with a defined artefact at the end. | the Council + owner acts |
| **WEEKS** | 1–4 weeks. Engineering with a shipped change. | engineering |
| **DAYS** | today → 7 days. Either closed, or blocked on a named owner act. | engineering + owner |
| **OWNER** | the acts only a human can take. Listed separately so they are never confused with engineering. | the owner |

**Alignment.** This plan does not invent priorities. It is the estate's own registers, re-derived
and re-sequenced:

- the 100-step arena plan (`docs/CSOAI_100_STEP_ARENA_PLAN_2026-08-23.md`) — the product thesis
  and the years/months spine;
- the ranked gap register (`csoai-work/gap-register.md`, 2026-10-26) — the A/B/C engineering,
  owner-gated and structural rows;
- the owner action sheet (`csoai-work/OWNER-ACTION-SHEET-2026-10-26.md`);
- and the estate's own live surface, re-read today.

**What changed on 28 Oct 2026** (measured, not asserted): the A1–A8 README rows are closed; A3's
generator bug is fixed; A12 is measured and the published Zenodo notice was wrong; the N-site
hunt is alive again after 28 days dead; and the hunt's 1,219 measurements now have a ledger
nobody had built. Detail in §6.

---

## 1. YEARS — what only time buys

### Y1 · The verified leaderboard earns a position, not a claim

The thesis is settled and written: *OpenRouter routes inference, LMArena ranks by crowd
preference, CSOAI attests it.* What is missing is not the product but the **statistical
weight** — a signed per-axis Elo that a reader can recompute and that a competitor cannot
out-argue.

**Close test:** for one axis, our per-axis Elo for a reference model set is statistically
consistent with an independent implementation (CI overlap), on ≥30 usable items, published for
four consecutive quarters, with the referee named and independent of every model in the set.

### Y2 · Regulatory standing: our evidence is cited without being asked for

EU AI Act Art 50 marking evidence, Art 53 GPAI transparency, and standards contributions
(SAFE) actually **accepted upstream** rather than prepared and filed.

**Close test:** a signed Council card is cited in a regulator document, an EU standard, or an
accepted upstream repository, without the Council asking.

### Y3 · Reproducibility becomes an institution, not a promise

`BANK-PIN-STRANGER-RECOMPUTABILITY.md` is the estate's own standing worry: a card that pins
bytes a stranger cannot reproduce is not checkable. The banks must become re-derivable from
published bytes alone.

**Close test:** a stranger with no prior context reproduces a signed card end-to-end from
published inputs, and the Council publishes the count of cards that survive that test.

### Y4 · The board measures industries, not only axes

`domains[]` on the live board carries **one** entry (`cross-border`, SCAFFOLD) against 33 axes
(A13 / C2). "Every industry we touch" cannot be evidenced on the board until this layer is real.

**Close test:** every one of the 33 axes is attributed to at least one published industry entry,
and each entry names its axes, artefacts, instruments, proof and claim boundary.

### Y5 · The financial family earns the right to answer a risk question

Sixteen issuer accounts, six covered, the EVM-side attestation backend **NOT BUILT**, risk
verdicts UNMEASURED, and facts read from mainnet while attestations ride devnet (C3 / C4).

**Close test:** 16 of 16 instruments carry mainnet attestations, and a counsel-signed rubric
converts facts into a published risk verdict.

### Y6 · The human in the loop stops being the least-proven thing

The instrument exists; the board does not; the probe is an unsigned pilot (C5 / B6).

**Close test:** a frozen bank with n≥30, a declared slot, a signed HITL artefact, and a
published authority specification naming who approves and what a decision leaves behind.

### Y7 · The substrate question is settled in writing and in code

The Council runs on MEOK. The risk is not the substrate — it is the **judge**. Three couplings
must stay broken: write scope by base (MEOK writes `meok`, `meok-mind`, `layer0`, `catalogs`,
`sites`; the `csoai` and `gspc` bases stay with the control plane), unsigned-intake only, and a
referee that is never the subject's own. The estate's own referee gave MEOK 219/237 where the
same referee gave the frontier 222/237, and 20 of 30 items were answered by a rule cascade
rather than a model — a self-graded lead is not a lead.

**Close test:** a published separation document *and* a referee implementation whose provenance
shows it is not the subject's, on every published cell.

---

## 2. MONTHS — programme work with an artefact at the end

| # | work | close test | blocked by |
|---|---|---|---|
| M1 | Build the 10 declared slots into measured axes: a frozen, sha-pinned bank each, n≥30 | each of the 10 shows MEASURED on the live board with its bank digest | **B4** — which banks first, and the compute spend |
| M2 | Reconcile the four populations (signed index 335 · `/api/cards` 336 · root 325 · Hub 438) | a published, dated, signed inclusion relation | — |
| M3 | Put `fleet_id` on every axis and every card (C7) | a reader cannot mis-join a row to a cohort | — |
| M4 | Turn the N-site ledger into a standing surface: 856 joined surfaces → per-slot subject presence | the live board carries a presence column for the slot subjects, sourced from the ledger | — |
| M5 | Domain layer v1 (A13 / C2) | see Y4 | — |
| M6 | Payments: delivery and acceptance receipts (B10) | a receipt binds artefact digest to a buyer operation | **B10** — format + funding |
| M7 | Anchor API (C6) **or** a published anchored-artefact index | a reader can tell from the site which artefacts are anchored and by whom | — |
| M8 | Financial coverage expansion + EVM attestation backend | see Y5 | — |
| M9 | Make the mirrors stop lagging: scoped npm automation token (B8), HF spray credential (B7) | README's mirror rows read "yes" again, verified live | **B7, B8** |
| M10 | Deploy a real Layer-0 signing route | `csoai_sign` returns a signature for an arbitrary artefact, and a reader can verify it offline | needs the Layer-0 key where the sign route runs |
| M11 | Standards: submit the SAFE port against the approved `SAFE.md` (A10, B2) | the upstream PR is open against the approved file | **B2** |
| M12 | Regulatory filings: NIST NCCoE identity comment (B3) | filed, with a receipt | **B3** |

---

## 3. WEEKS — engineering with a shipped change

| # | work | close test |
|---|---|---|
| W1 | Re-spray the Hugging Face mirror; it currently reads "behind" (merkle `81c2a553` ≠ live root `a2620ac3`) | the mirror's merkle equals the live root, verified by GET |
| W2 | Rebuild the measurement capsule index (A16) — 25 days behind the root | the index carries the current root `as_of` and `card_count` |
| W3 | Recompute the root-witness drift verdict (A11) — it was computed against a root the pointer no longer carries | the pointer's drift block is dated at or after the current root |
| W4 | Negative control for the N-site ledger, and for the A2A directory census (A18) | a paired dated pair proves the counter can fail |
| W5 | Re-read the **15 UNVERIFIABLE** presence rows and re-pin them, or supersede them | every row is VERIFIED, or carries a dated supersession |
| W6 | Busabase: an off-pod copy, and a **restore drill** (13 GB of snapshots exist on the pod; there is no copy off it) | a restore is performed from a snapshot into a scratch store and the row count is checked |
| W7 | Pod keepalive: start a stopped pod on a schedule (needs a RunPod API key) | a deliberately stopped pod comes back unattended |
| W8 | The GSPC GPU worker's home: a GPU pod, or the worker's CPU path re-specified | the worker runs a frozen bank end to end somewhere real |
| W9 | Every published artefact gets a cold-start stranger path (the register's own test) | each can be checked in 60 s from published bytes |

---

## 4. DAYS — today → 7 days

### Closed on 28 Oct 2026

| # | item | close test | status |
|---|---|---|---|
| D1 | N-site presence ledger: 1,219 rows, each with the digest it pinned | `public/interop/nsite-presence-ledger.json` + Busabase base `nsite-presence` | **1,203 VERIFIED · 15 UNVERIFIABLE · 1 MISSING** |
| D2 | A1–A8: every generated number on the README is live again | `scripts/github/org-readme.py --councilof README.md` | board 23→**33 axes** (10 slots shown UNMEASURED); root 319→**325**; Hub 411→**438**; buyers 2→**3** |
| D3 | The generator's stale-latest bug | `org-readme.py` now picks the newest correction by date | README reads **C-2026-1006-13 (2026-10-06)**, was C-2026-0822-01 |
| D4 | A12: the published Zenodo notice was wrong | `scripts/refresh-zenodo-status.mjs` + a dated observation | **2 of 39 DOIs resolve again**; 37 still 410; methodology DOI 21991104 → 302 → successor → 410 |
| D5 | The N-site hunt, dead 28 days | the lane runs, self-refills, and says STALE when it stops | **97 → 1,219 onboarded · 66 → 856 joined** · 1,202 bundles |
| D6 | The site census + Busabase `sites` base | `tools/sites/sites_census.mjs` → `sites` (34 rows) | 34 sites probed; `UNREACHABLE` is a state, not a zero |
| D7 | Kimi as a partner arm | attempted on the estate's frozen XRAIV bank | **FAILED**: Moonshot account suspended, 429 insufficient balance. Recorded as FAILED, not a score |
| D8 | The Layer-0 seal | `csoai_sign` | **BLOCKED**: the MCP sends no credential, and the deployed service has no `/sign` route. Receipt bytes recorded; the board key was deliberately not used |

### Open, and closable without an owner

| # | item | close test |
|---|---|---|
| D9 | A9: the SAFE contribution's board-count line | the upstream document states 33 axes · 23 measured · 10 declared, with the read date |
| D10 | A19: supersede the three dated artefacts carrying "23 axes" | a dated `-SUPERSEDES` note beside each, indexed in `public/corrections/SUPERSESSIONS.md` — **dated evidence is not edited** |
| D11 | A7: `docs/grants/README.md` and `docs/trust/ANCHOR-PREPARATION.md` pin the old root | both point at the live URL with a read date |
| D12 | A16: the capsule index | see W2 |
| D13 | A15: sign the HITL probe artefact | a signed HITL artefact exists — needs the control plane's key |
| D14 | A17: sign the x402 discovery manifest, publish the signed copy under `public/.well-known/` | the manifest a reader is told to pin has a signature and a checked-in copy |
| D15 | A18: negative control for the A2A directory census | see W4 |
| D16 | A11: recompute the witness drift | see W3 |
| D17 | A14: sign the 7 unsigned financial run artefacts | `totals.financial_run_attestations` reports 9 of 9 signed |
| D18 | The board's `doi_status` is stale in the other direction (today's finding) | the control plane re-signs the board payload with the observed DOI state |

### Open, and blocked on a named owner act

| # | item | owner act | why it cannot be engineered |
|---|---|---|---|
| B1 | The methodology DOI does not resolve; 108 files cite it | complete the Zenodo appeal, or publish a new canonical DOI + a re-pointing plan | a decision about which name is permanent |
| B2 | The SAFE contribution is prepared but not submitted | approve opening the port PR against `SAFE.md` | a human decides to send it |
| B3 | The NIST NCCoE comment is a draft | approve filing text and date | a human decides to file |
| B4 | The 10 declared slots need banks and compute | choose which banks first, release the budget | run-design + spend |
| B5 | `regulator-transparency` pages are `HIDDEN_PENDING_OWNER_GO` | an explicit go/no-go | it is withheld on purpose |
| B6 | No published HITL approval-gate specification | approve it for publication, including the authority | a governance decision |
| B7 | The HF mirror cannot be re-sprayed | add the repo secret `HF_TOKEN` used by CI, document it | a credential |
| B8 | npm publication is manual (WebAuthn) | a scoped publish-only token, or publish by hand | an account bound to the human |
| B9 | `www.csoai.org` does not resolve | add a DNS record **if** the www apex is meant to be a DID issuer | a DNS decision |
| B10 | No evidence a paid artefact was **delivered and accepted** | decide and fund the receipt format, then issue one | a format + a first receipt |
| B11 | The two approved outbound emails have not left the machine | `security add-generic-password -s meok-keystone -a PRIVATEMAIL_PASSWORD -U -w`, then "mail fixed" | the provider rejects the stored password; the value never enters the transcript |
| B12 | The Moonshot/Kimi account is suspended for balance | recharge it | money |
| B13 | Nothing can restart a stopped RunPod pod | a RunPod API key | a credential |
| B14 | The M4's data volume was at 99.8% and peer sessions are dying of ENOSPC | decide on the 48 GB game install | it is not work; only the owner can delete it |
| B15 | `micro2`'s bulk volume is 95% full | S3 keys, then the same offload | a credential |
| B16 | The RFC 5737 `example.com` citations, the `councilof.ai` vs `councilof-ai` naming split, and the four DORA/IIA shadowed-key copies | a naming + citation ruling | naming is a house decision |

---

## 5. The shape of the estate, measured today

| thing | state | evidence |
|---|---|---|
| GSPC board | 33 slots · 23 measured · 10 declared UNMEASURED · 0 of 14 model-comparison axes separated | `GET /api/gspc` |
| Public root | 325 leaves · `a2620ac3…` · as_of 2026-10-27T21:20:49Z | `GET /root.json` |
| Corrections | 93 entries · latest `C-2026-1006-13` · VALID | `GET /api/corrections` |
| Hub cells | 438 | `GET /api/hub-cards` |
| N-site hunt | 1,219 onboarded · 856 joined · 1,202 evidence bundles · queue self-refilling | the lane's own counters |
| Presence ledger | 1,219 rows · 1,203 VERIFIED · 15 UNVERIFIABLE · 1 MISSING · 7 duplicated event hashes | `public/interop/nsite-presence-ledger.json` |
| Reachable compute | 3 of 15 declared hosts; 1 with a GPU | `tools/sites/sites_census.mjs` |
| Main RunPod pod | 2 usable CPUs of 192 host threads · 1,133 GiB · no GPU · no systemd | the census + the estate's own heartbeat |
| Busabase | 11 GB primary on one pod · 13 GB of sha256-pinned snapshots · reached by SSH tunnel | the pod + the M4 |
| Disk | M4 96–98% used · M2 89% | `df -h` |
| Zenodo | 2 of 39 DOIs resolve again | `scripts/refresh-zenodo-status.mjs` |

---

## 6. What this document is not

- Not a scorecard. It asserts no coverage percentage, no market position, no revenue scale.
- Not a claim that the years rows are close. Y1–Y7 are measured by bodies of evidence, not by
  milestones.
- Not a substitute for the gap register. This is the register re-sequenced by horizon; the
  register remains the authority on the evidence for each row.
- Not a certification, a conformity assessment, or a legal determination.

Every number in §5 was read from a live endpoint or a live filesystem on 2026-10-28. Where a
number could not be re-derived, it is marked as such rather than carried forward.
