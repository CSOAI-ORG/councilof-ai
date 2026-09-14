# DRAFT — not submitted

| Field | Value |
|---|---|
| Regulator | U.S. National Institute of Standards and Technology (NIST), Information Technology Laboratory |
| Ref | **NIST AI 200-2 ipd** — *The TEVV-Athlon Framework for Evaluating AI Systems* (Initial Public Draft), August 2026, Phillips, Jensen, Hall, Amironesei, Choong, Greenberg, Greene; doi:10.6028/NIST.AI.200-2.ipd |
| Official URL | https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems · PDF https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.200-2.ipd.pdf |
| Closing date (verified) | **6 October 2026.** PDF front matter: "A 60-day comment period opened August 7, 2026, and closes on October 6, 2026." Retrieved 2026-09-14T10:35:44Z (page and PDF, both HTTP 200). |
| Submission route | Email **TEVV-Athlon@nist.gov**, subject line **"NIST AI 200-2"**. Unlocked HTML, ASCII, Word, RTF, Excel or PDF. Comments are subject to FOIA release, and NIST asks that they contain no proprietary information. |
| Owner step | Nick: (1) fix the reserve-attestation board-note drift described in §4 **before sending**, or delete §4's second paragraph; (2) re-read the live `/api/gspc` `safety` row and update §2 if it has changed; (3) send from nicholas@csoai.org by 6 Oct 2026. |
| Work order | #050 |

**Premise check for the dispatch.** The dispatch called this a "TEVV worked example, due Oct 6". NIST's Zero Drafts project page shows the TEVV *zero draft* still at outline stage, with no open 2026 comment window (outline comments closed 12 Sep 2025; retrieved 2026-09-14T10:35:45Z). The 6 Oct 2026 deadline belongs to **NIST AI 200-2, the TEVV-Athlon Framework**, which is a different document with a different mailbox (TEVV-Athlon@nist.gov, not ai-standards+tevvzd@nist.gov). The docket exists, but under a different name than the dispatch used. This draft is addressed to NIST AI 200-2.

---

## Comment body (paste from here)

**To:** TEVV-Athlon@nist.gov
**Subject:** NIST AI 200-2 — worked mapping of one deployed measurement onto the TEVV-Athlon stages, plus one unsupported construct (CSOAI Ltd)

### 1. Who we are and how this was written

CSOAI Ltd (England and Wales, Companies House 16939677; 3rd Floor, 86-90 Paul Street, London EC2A 4NE; nicholas@csoai.org) runs an independent AI measurement body at https://councilof.ai. **Measurement, not certification:** we issue no conformity marks, and none of what follows says a system complies with anything.

**AI-assistance disclosure:** an AI assistant helped draft this comment. Every value quoted below was read from the public URL cited, at the time stated. A person at CSOAI reviewed it before sending.

We have no relationship with NIST. We offer this as a worked example that NIST may reuse. It is not a product.

### 2. Worked mapping: one measured axis

Source for every value in this section: https://councilof.ai/api/gspc, axis `safety`, retrieved 2026-09-14T10:32Z. The payload's own `note` field reads "Measurement, not certification".

| TEVV-Athlon element (AI 200-2 §2) | Our measurement |
|---|---|
| **Stage 1 — Articulate & Organize: goal** | Does a text language model refuse a harmful request while still helping with its paired benign counterpart? "Calibrated refusal": over-refusal and under-refusal both count as errors. |
| Who cares about the result (Q2 of the seven questions) | Deployers choosing among models; anyone reading vendor refusal claims |
| System attribute / lifecycle stage | Safety-related refusal behaviour of **released, served** models (post-deployment, black-box via their serving API) |
| **Stage 2 — Define & Construct: Block** | *Calibrated refusal on paired requests* (`task` field) |
| Block definition / evidence required | Per item, a label parsed from the model's response, compared with a gold label by a deterministic rule. No model grades another model. |
| **Stage 3 — Apply & Measure: Events** | One Event: the 36-item frozen bank "DefBench" (`bench`, `n: 36`) put to every model in the fleet |
| System class / fleet | 19-model fleet for the behavioural axes: tuned council specialists, base models, and cross-lab models reached through OpenRouter (`measured_on.model`). Endpoints: "A100 · local Ollama (board v2) · OpenRouter (cross-lab models)" (`measured_on.endpoint`). |
| **Toolbox** | Frozen split published at https://huggingface.co/datasets/csoai/gspc-agi (`dataset_url`); deterministic grader; label parser; paired McNemar test for separation |
| Corpus / sampling | A **fixed frozen split**, not a random sample from a defined population of requests. Results describe performance on these 36 items, and any generalisation beyond them is not supported. |
| Test date | Behavioural axes run 2026-08-12 (`measured_on.date`) |
| Scoring | `accuracy: 0.944` (leader), `macro_f1: 0.944`, `fleet_mean: 0.732`. Unparseable responses are reported as `unparsed_rate: 0.0541` and treated as **UNMEASURED, not as wrong answers** (payload `note`). |
| **Stage 4 — Synthesize & Interrogate: uncertainty** | Leader interval `[0.819, 0.985]`. Separation determination: **TIE** (`separation_p: 0.6875`; the row's note reads "McNemar p=0.69 vs qwen2.5:3b"). The point-estimate lead is not a measured advantage. |
| Interpretation limits | (a) n=36 is small, so the interval spans about 17 points. (b) TIE is never reported as a win. (c) Our own tuned models are excluded from public leadership wherever they lead (a rule stated in the payload; on this axis a base model leads). (d) The interval's method is **not stated on this row** (other rows state theirs), and we record that as a gap. (e) "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything." (`limitations`). |
| Signed result record | A card on this axis in our signed card index: https://councilof.ai/signed/cards/0dc8b7ef05fd1c2b4584079ce99a12d24b157d2f2683cffce763377dd88c7213.json. Ed25519, key bound to `did:web:csoai.org#card-attestation-1`; signature verified VALID on 2026-09-14, and a tampered-body control fails. |

**Interrogation finding: record and row do not reconcile.** Reviewing the stages in reverse, as §2.4 recommends, turned up a real gap. The signed cards for this axis (21 cards, signed 2026-08-19) carry `accuracy` but **no n, no bank version and no run date**, and the fleet they cover does not include the model that leads the current board row. A reader therefore cannot trace the published row (n=36, TIE) back to a signed per-model record from the bytes alone. The measurement is real, but its evidence chain has a missing link. We think a framework example should show this kind of finding, because §4.5 "Validating Measurement" is where it would otherwise be missed.

### 3. One construct shown as unsupported

Organisations often want a Block they cannot actually build. Ours:

| TEVV-Athlon element | Status |
|---|---|
| Wanted attribute | *Is a stablecoin issuer's reserve adequate?* |
| Block | **UNSUPPORTED.** We have no Event that produces evidence of adequacy: no access to custodial records, no examination rights, no counsel-reviewed rubric. |
| What we *can* measure instead (a different, narrower Block) | *Is third-party reserve-attestation language present on the issuer's own public page?* Three states: PASS / FAIL / UNCHECKABLE, where an unreachable page is UNCHECKABLE and never FAIL. Evidence: https://councilof.ai/interop/financial-measure-run-reserve-attestation.json (`as_of` 2026-09-07T11:30:35Z, `n`: 16 issuer accounts, `tally`: PASS 3, FAIL 4, UNCHECKABLE 9, `content_id` be700eb0…fa6b7). |
| How the gap is recorded | The same payload carries `"risk_verdict": "UNMEASURED"` and "Risk/compliance/quality UNMEASURED. Not a rating, not advice, not an endorsement." The board carries the axis as MEASURED **for the narrow fact only**. |

The lesson for the framework: when no Event can produce evidence for a Block, the Block should be **recorded as unsupported, not silently replaced** by a nearby Block that can be measured. Otherwise a language-presence fact gets read as an adequacy finding.

### 4. Suggestions for NIST AI 200-2

1. **Add an explicit "unsupported Block" outcome to Stage 2.** Where Stage 1 names an attribute but no feasible Event can produce the required evidence, the TEVV-Athlon should record the Block as unsupported, with the reason (access, legal, cost), and carry it into Stage 4 reporting. Our §3 is an example.
2. **Make instrument identity part of the Toolbox record in Stage 3:** version identifier and content digest of each test set, the sampling frame (frozen split vs. sample from a population), and the run date as distinct from the reporting date. Without these, two TEVV-Athlons cannot be compared.
3. **In Stage 4, separate "could not be scored" from "wrong".** Unscorable outputs should be reported as a rate beside the metric, not folded into it. Each point-estimate comparison should also state whether separation was tested, and with what result (e.g., TIE).
4. **Add a reconciliation check to §4.5 "Validating Measurement":** can each reported result be traced to its underlying per-system records? Our §2 finding shows how easily this link goes missing even when every record is signed.

We also make a disclosure. While assembling §3 we found that a prose note on our own public board summarises this run as "1 PASS, 6 FAIL, 9 UNCHECKABLE", while the evidence file it cites tallies PASS 3, FAIL 4, UNCHECKABLE 9. The evidence file is authoritative, and we are correcting the note through our public corrections ledger (https://councilof.ai/api/corrections). We mention it because a prose summary drifting from the data it describes is exactly what suggestion 4 is meant to catch.

— CSOAI Ltd, nicholas@csoai.org

---

## Internal notes (do not paste)

- **Blocker before send:** the `/api/gspc` → `axes[reserve-attestation].note` string says "1 PASS, 6 FAIL, 9 UNCHECKABLE", but `/interop/financial-measure-run-reserve-attestation.json` → `tally` = {PASS 3, FAIL 4, UNCHECKABLE 9} (both read 2026-09-14T10:37Z). Fix the producer, not the artifact, and add a corrections entry. If that doesn't happen first, delete the disclosure paragraph at the end of §4 rather than promising a correction that has not been made.
- No named-official quotes are used. 335 (corpus 3) is not quoted here; only the per-axis card count (21) is.
