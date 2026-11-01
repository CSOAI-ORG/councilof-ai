# Registry publisher — Friday closeout, 30 October 2026

This closes the registry publisher repair and its release verification. It does not declare the whole institutional assurance programme complete.

## Released and checked

| Check | Result and proof |
|---|---|
| Source repair | [PR #3608](https://github.com/CSOAI-ORG/councilof-ai/pull/3608) merged at 10:41:40 UTC as `0580fd0ddec80a0fcc3b783d2da22cffafa47334`. |
| Exact tree | Merged tree `28da7bf35db1abd847f903490f22edca7d0c3c60` equals the prepared tree. Five publisher/workflow/test/runbook files retained their reviewed bytes; other lane log entries were preserved. |
| Regression evidence | 33 local checks, including the original-source false-success control, passed. All seven PR workflows passed on `a777e91ac163448c299eecd3fee13353c29c963c`. [Required gates](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/41041099837). |
| Master validation | [Publisher validation](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/41042619227) passed on the merge commit. |
| Production deployment | [Deployment 41042619207](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/41042619207) completed successfully at 11:09:43 UTC, including target preflight, upload, apex/alias assertion and root witness recheck. |
| Direct live readback | At 11:34:46 UTC, both production hosts returned HTTP 200, substantive homepages and the verification marker. |
| Delayed live readback | Repeated at 11:37:00–01 UTC and 11:44:07 UTC. Both hosts remained healthy and matched each other at every read. The JavaScript asset changed between the first two reads, then remained the same for seven minutes. [Later deployment 41046896566](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/41046896566) passed on descendant `d6c7a3ba583f50f5b800f97a3eb255c3368560ee`; the five publisher files were unchanged. This is consistent with the intervening deployment. Full HTML byte equality is not claimed. |
| Discovery | At 11:35:49 UTC, the live MCP responses exposed 52 tools and 47 free tools. SSE messages were parsed before counting. The x402 catalogue retained 29 distinct IDs matching the prior buyer map. |
| Evidence handling | Fourteen raw HTTP responses retained with SHA-256 checks; the final 11:44 homepage observation is a separate digest receipt. All probes were tagged as internal self-probes; they are not customer demand. |

The repair's operational catalogue entry is **MCP registry publication integrity**: exact namespace/version binding, GET-only check mode, refusal of changed/inactive metadata, and independent post-publication readback. It is an operational control, not a new paid SKU, certification or institutional endorsement.

## Current dependencies and ownership

- **Canonical registry metadata:** the active latest `ai.councilof/gspc` 1.4.4 still describes 19 tools/14 free; the free listing describes 14. Source and release ownership remains with #3210 and the domain-ownership publisher. A reviewed new version is required; this repair does not overwrite old records.
- **Catalogue links:** #3179 remains open. The latest exact commit and the native gates must be used when it lands.
- **External x402 discovery:** the bounded Coinbase Bazaar domain query returned zero resources with `partialResults=false`. That is the result of this query, not universal absence or a paid-delivery test.
- **Human review:** #3606 and #3649 are merged; #3598 and #3610 remain drafts, and #3599 remains open at inspection. The live endpoint reports a bound store, configured operator token/signing key and an open recording path. No human decision was submitted by this lane.
- **Measurement scope:** the board reports 33 axes, 23 measured and 10 unmeasured. These are dimensions, not 33 validated industries. Configuration, source counts and hash integrity do not promote the unmeasured axes.
- **Commercial vocabulary:** 29 catalogue entries were observed. A canonical definition of the proposed 22 revenue loops has not been resolved; do not manufacture a 22-item product inventory.

## Week of 2–6 November: proposed execution order

### 2026-11-02 — Distribution source and registry release owners

Reconcile #3210 with current master; select a reviewed new version, regenerate canonical and free manifests, release through the existing domain-ownership publisher.

Done when: Exact-version registry GETs match the reviewed metadata, are active, and latest status is reported separately; live tool counts and generator checks agree.

Dependency: Canonical/free records remain at 1.4.4 with old 19/14 descriptions. Do not overwrite historical versions or use the deprecated GitHub alias as the canonical fix.

### 2026-11-03 — Discovery and commercial owners

Finish #3179 catalogue-link work and qualify external x402 discovery using the existing offer and settlement route.

Done when: Served catalogue links resolve; a matching external discovery record is read back. Settlement and receiver delivery are separately evidenced if an authorized transaction occurs.

Dependency: The scoped Bazaar query returned no matching resources. No spending, fabricated transaction or sale is authorized by this plan.

### 2026-11-04 — Commercial owner and named receiving buyer

Use the existing evidence_bundle acceptance checklist for one useful, explicitly scoped buyer task.

Done when: Agreed scope, current terms, delivered artifact digest, independent supported-card verification and explicit receiver acceptance or rejection are retained.

Dependency: A preview is not paid fulfilment. The csoai Article 50 preview was empty; the obligation-wide preview has a different scope.

### 2026-11-05 — Human-authority, adapter and receiving-host owners

Complete the current-head acceptance cases for #3598, #3599 and #3610, aligned with merged #3606.

Done when: Real host tests cover valid authority, changed arguments, expiry, revocation, replay, resume and store failure. Genuine human decisions and observed execution remain distinct.

Dependency: #3598 and #3610 are drafts; #3599 is open. Local retention correction and configured HITL do not establish a real human's identity or consent.

### 2026-11-06 — Risk-assurance lane and evidence operations owner

Repeat the bounded discovery and registry readbacks, reconcile corrections, and evaluate the first accepted delivery's actual cost and reuse.

Done when: Dated evidence and invalidations retained; unresolved states remain explicit; cost/time/repeat-use figures come from observed accepted deliveries.

Dependency: Do not reset observation times, silently change frozen methods, or promote unmeasured axes.


This is an execution plan, not a new schedule or commitment by another owner. Prices come from the current offer; signing, payments, external publication and genuine human acceptance retain their existing authorities.

## Reuse and correction

Use the existing [publication runbook](MCP-REGISTRY-PUBLICATION.md), publisher tests and source owners. Keep source observation, verification, publication, settlement, delivery and acceptance times separate. A changed source produces a new observation and linked correction; it must not rewrite old evidence or silently restamp a measurement.

No new service, scheduler, signing key, payment route or competing catalogue is created by this closeout.
