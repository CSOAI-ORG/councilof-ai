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

**One correction to the register's own tiering.** A, in the gap register, means "closable by
engineering with no owner input". That is true of A7, A18 and A19, which are closed. It is **not**
true of A15, A16 and A17: each of those needs a signature, and a signature needs a
bearer for `POST /api/board-sign` that no machine on this estate currently holds (B17). They are
owner-gated in fact and engineering-gated only in the register. Two further rows were re-read
rather than acted on: **A9 is a misreading** — the document it names is a worked example about a
superseded signed freeze and already states the living board as the current authority — and
**A12 needed measuring before it could be closed**, which is what showed the published notice was
wrong in the other direction.

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
| D1 | N-site presence ledger: every row carries the digest it pinned, resolved against the bytes | `public/interop/nsite-presence-ledger.json` + Busabase base `nsite-presence` | **1,470 VERIFIED · 15 UNVERIFIABLE · 1 MISSING** of 1,486 |
| D2 | A1–A8: every generated number on the README is live again | `scripts/github/org-readme.py --councilof README.md` | board 23→**33 axes** (10 slots shown UNMEASURED); root 319→**325**; Hub 411→**438**; buyers 2→**3** |
| D3 | The generator's stale-latest bug | `org-readme.py` now picks the newest correction by date | README reads **C-2026-1006-13 (2026-10-06)**, was C-2026-0822-01 |
| D4 | A12: the published Zenodo notice was wrong | `scripts/refresh-zenodo-status.mjs` + a dated observation | **2 of 39 DOIs resolve again**; 37 still 410; methodology DOI 21991104 → 302 → successor → 410 |
| D5 | The N-site hunt, dead 28 days | the lane runs, self-refills, and says STALE when it stops | **97 → 2,202 onboarded · 66 → 1,503 joined** · 1,713 surfaces |
| D6 | The site census + Busabase `sites` base | `tools/sites/sites_census.mjs` → `sites` (34 rows) | 34 sites probed; `UNREACHABLE` is a state, not a zero |
| D7 | Kimi as a partner arm | attempted on the estate's frozen XRAIV bank | **FAILED**: Moonshot account suspended, 429 insufficient balance. Recorded as FAILED, not a score |
| D8 | The Layer-0 seal | `csoai_sign` | **BLOCKED**: the MCP sends no credential, and the deployed service has no `/sign` route. Receipt bytes recorded; the board key was deliberately not used |
| D20 | The served census carried a **machine name** — and the estate's own gate caught it | the served JSON names an environment class, never a machine | **CLOSED 30 Oct** — `functions/api/served-json-no-hostname.test.ts` failed `pr-gates` on the branch and was right: the probe recorded the remote's own hostname (`...MacBook-Air.local`, both the "MacBook machine name" pattern and the mDNS ".local" pattern). Every site now carries a role (`owner-lan-workstation`, `oracle-micro-control`, `runpod-main-engine`), the remote hostname is not recorded at all, and the host mapping stays in the tool — code, which is not served. `pr-gates` is green |
| D21 | The RunPod pod's **network volume loses every write** | the volume keeps a byte, or the volume is replaced | **OPEN — RunPod-side.** This is ALSO why the presence catalogue is MIXED: four of five publish chunks failed with "Input validation failed" — a validation-shaped symptom of a store that cannot persist the change. 1,203 rows still hold the 29 Oct observation while the rest hold the 28 Oct one, and nothing in the catalogue said so until D25 gave it a gate. | `mfs#euro-3` (fuse) accepted writes for months and then began returning **empty files** at 1 KB and 1 MB while pod-local `/opt` and `/root` were fine. Reads were never affected, so no data was lost — but the 9.4 GB Busabase store lives there and its writer could not start. The volume has still not recovered. The estate's own `WRITER.lock.stale-mfs-*` files show the same fault on 23 Oct, 25 Oct and 28 Oct |
| D22 | The Oracle micro is **thrashing** | load near core count, swap unused, volumes under 90% | **OPEN — capacity.** Load average 2.48 / 63.69 / 93.06 on **2 CPUs**, with 637 MB of swap in use on a **956 MB** box, running ~40 cron lanes. Its root is 90% full and `/evac-bulk` 95%. The estate's own rule is that scratch lives on `/workspace` (427 TB free) — the lanes do not |
| D24 | Nothing kept the estate's RunPod pods up | a pod whose container is not running is started, within the balance floor | **CLOSED 30 Oct** — `scripts/ops/runpod-pod-keepalive.sh`, installed as launchd `ai.csoai.runpod-pod-keepalive` (every 300 s). It reads `runtimeStatus`, not `desiredStatus`; it refuses to start a pod below the balance floor; it probes a pod's service only where a route exists and reports **UNPROBED** where it does not, because a state you did not measure is not a state you may publish. The estate's CPU pods are gpuCount 0 **by design** — `scripts/ops/resume-3090.sh` refuses to start Ollama on a CPU-only pod because serving the models on CPU "would be an instrument change". The CPU pods are the compute lane as designed, not a degraded GPU pod |
| D25 | Nothing reported the catalogue's own staleness | every row of the catalogue carries the newest observation, or the probe says so | **CLOSED 30 Oct** — `scripts/sites/catalogue-freshness.mjs` reads every row's `as_of`, groups them, and exits non-zero when they disagree (MIXED) or when the base is empty in the store it was asked about (EMPTY — the estate runs TWO Busabase stores, 15429 and 15430, and reading a base from the wrong one returns nothing rather than an error, which would otherwise read as "everything is current"); exit 2 when the catalogue is unreachable, which is itself a finding. The catalogue is an UPSERT, so a publish that fails part-way leaves a MIXED catalogue with no indication in the data that any of it is old — the same failure the hunt's staleness gate was written for |
| D23 | The Busabase catalogue and the ledger count different things, and the difference is not a gap | one row per surface in the catalogue, one row per measurement in the ledger | **CLOSED 30 Oct** — `nsite-presence` holds **1,713** rows (one per distinct surface); the ledger holds **2,202** (one per onboarding, 9 surfaces onboarded more than once). Every ledger domain is present in the catalogue |
| D19 | The hunt's own evidence store overwrote bundles **in place**, so 15 rows pinned bytes that no longer existed | a re-read lands on a new path, the earlier bytes survive, and a row resolves by content hash | **CLOSED 28 Oct** — evidence is now content-addressed, the rule the card signer already follows. 9 domains had been onboarded more than once (one four times); the 64 historical rows are not repairable and stay UNVERIFIABLE with both digests published |

### Open, and closable without an owner

| # | item | close test |
|---|---|---|
| D9 | A9: the SAFE contribution's board-count line | **the register misread this one.** The document is a worked example about a *superseded signed freeze*: it quotes the freeze's own "23 axes · 23 measured", states the living board's "33 axes · 23 measured", and records the freeze as `SUPERSEDED_KNOWN_CLAIM_DEFECT` with the living board as `current_authority`. Nothing to change — the doc is already right |
| D10 | A19: supersede the three dated artefacts carrying "23 axes" | **CLOSED 28 Oct** — three dated `-SUPERSEDES` notes written beside the originals (which keep their bytes), and three rows added to `public/corrections/SUPERSESSIONS.md` |
| D11 | A7: `docs/grants/README.md` and `docs/trust/ANCHOR-PREPARATION.md` pin the old root | **CLOSED 28 Oct** — both now carry a live pointer plus the dated reading (root `a2620ac3…`, 325 cards, as_of 2026-10-27T21:20:49Z), following the house rule that a count is a pointer, never a typed integer |
| D12 | A16: the capsule index | **KEY-CUSTODY-GATED** — `scripts/measurement_capsule_layout.py` consumes a *signed* index (it copies the `.signed.json` sidecar and the `.ots` proof), so a fresh capsule index needs a signed source index |
| D13 | A15: sign the HITL probe artefact | **KEY-CUSTODY-GATED** — `POST /api/board-sign` accepts a GitHub OIDC JWT or the pod caller token (Pages secret `BOARD_SIGN_POD_TOKEN`); neither is on the pod, and the attestation seed is not either. Not an engineering task; it needs a credential (see B17) |
| D14 | A17: sign the x402 discovery manifest, publish the signed copy under `public/.well-known/` | **KEY-CUSTODY-GATED** — same as D13; and `public/.well-known/x402.json` does not exist at all, so there is no signed copy to diff against |
| D15 | A18: negative control for the A2A directory census | **CLOSED 28 Oct** — `a2a-directories-20260930T103424Z.controls.json`: three controls (a real directory, a not-a-directory, and the must-fail case drawn from the census's own rule — a row answered from `ours` is never evidence about a third party). The published census's own totals reproduce under that rule, and with the exclusion removed the must-fail case flips, so the counter can fail |
| D16 | A11: recompute the witness drift | **CLOSED — by the estate's own hourly publisher, not by me.** The live witness pointer now reads `drift.status: MATCH`, `checked_at 2026-10-28T11:51:39Z`, and the drift's `live_root_sha256` **equals** the root the pointer carries. The register's A11 claim was true on 26 Oct and the `public-root` publisher has since recomputed it. My earlier "key-custody-gated, and it failed closed" note described the gate running on the POD, where `opentimestamps` is not installed and every proof therefore reads as invalid — an artefact of the missing parser, not 102 forged proofs. In CI the parser exists and the gate runs clean |
| D17 | A14: sign the 7 unsigned financial run artefacts | **NOT A DISPATCH — a source defect, and it is now named exactly.** The board's own source **hardcodes** the answer: `functions/api/_gspc_axes_fin.ts` carries `run_attestation: "CONTENT_ADDRESSED_UNSIGNED"` for the seven axes and `"ED25519_SIGNED"` for one. The allow-listed signer (`hf-fin-shells-measure`, target `financial`) signs the **card** payloads — `financial-measure-card-*.json`, all seven of which are **already signed** — not the **run** artefacts the board counts (`financial-measure-run-*.json`). So dispatching it would report "no card change" and change nothing. Closing A14 needs the run artefacts signed AND the board's source to read their signature instead of a typed string: the same "a typed value where a pointer belongs" defect, this time in the board's own source |
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
| B13 | ~~a RunPod API key~~ — **CORRECTED: the estate HAS a working RunPod path.** `runpodctl` 2.14.0 is on the operator's machine with a REST key (`~/.runpod/ssh/runpodctl-ssh-key`) and a live balance (**$15.66**), above the estate's floor of 5. `runpodctl pod start|stop|restart|list` all work, and `pod list --all` reports `runtimeStatus` — what the container is actually doing — not just `desiredStatus`. What the REST key cannot do is the GRAPHQL console API (401), and `runpodctl` has **no `volume` command**, so D21's volume replacement still needs the console. The pod keepalive is now built and running (D24) |
| B14 | The M4's data volume was at 99.8% and peer sessions are dying of ENOSPC | decide on the 48 GB game install | it is not work; only the owner can delete it |
| B15 | `micro2`'s bulk volume is 95% full | S3 keys, then the same offload | a credential |
| B16 | The RFC 5737 `example.com` citations, the `councilof.ai` vs `councilof-ai` naming split, and the four DORA/IIA shadowed-key copies | a naming + citation ruling | naming is a house decision |
| B17 | **A bearer for `POST /api/board-sign`** — the GitHub OIDC path or the pod caller token (Pages secret `BOARD_SIGN_POD_TOKEN`) | provision one of them on the build pod | this is what stands between the estate and signing the 7 unsigned financial run artefacts, the HITL probe, the x402 manifest, a fresh witness root and a fresh capsule index — five register items the register had filed as engineering work |

---

## 5. The shape of the estate, measured today

| thing | state | evidence |
|---|---|---|
| GSPC board | 33 slots · 23 measured · 10 declared UNMEASURED · 0 of 14 model-comparison axes separated | `GET /api/gspc` |
| Public root | 325 leaves · `a2620ac3…` · as_of 2026-10-27T21:20:49Z | `GET /root.json` |
| Corrections | 93 entries · latest `C-2026-1006-13` · VALID | `GET /api/corrections` |
| Hub cells | 438 | `GET /api/hub-cards` |
| N-site hunt | 2,202 onboarded · 1,503 joined · 1,713 distinct surfaces · 1,866 evidence bundles · queue self-refilling | the lane's own counters |
| Presence ledger | **2,202 rows** (one per measurement) over **1,713 distinct surfaces** · 2,138 VERIFIED · 64 UNVERIFIABLE · 0 MISSING · 8 duplicated event hashes | `public/interop/nsite-presence-ledger.json` |
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
