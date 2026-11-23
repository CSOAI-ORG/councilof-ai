#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Present evidence to H.I.M. / SovSpace readers without manufacturing authority.

Input = existing aggregate research reports only; no new scoring or user data.
NOT Anthropic's neural J-space. No signing keys, dashboards or HITL POSTs.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

SCHEMA="csoai.gspc-him-research-projection/0.1"
SOURCE_STATES={
 "temporal":("csoai.gspc-temporal-observer/0.1","state","PUBLIC_SOURCE_OBSERVATION"),
 "repeat":("csoai.gspc-repeated-observation-audit/0.1","state","RETROSPECTIVE_PUBLIC_REUSE"),
 "complementarity":("csoai.gspc-public-error-complementarity/0.1","evidence_state","RETROSPECTIVE_PUBLIC_REUSE"),
 "human":("csoai.him-meok-factorial-research/0.1","evidence_state","SYNTHETIC"),
 "referee":("csoai.gspc-readonly-rule-referee/0.1","verdict","DISSENT"),
 "corrections":("csoai.correction-timing-observer/0.1","state","PUBLIC_SOURCE_TIMING_REANALYSIS"),
}


def canonical(x):
    return json.dumps(x,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()


def digest(x):
    return hashlib.sha256(canonical(x)).hexdigest()


def validate(kind,r):
    schema,field,state=SOURCE_STATES[kind]
    if not isinstance(r,dict) or r.get("schema")!=schema or r.get(field)!=state:
        raise ValueError("research input has wrong schema or evidence state")
    key={"temporal":"receipt_sha256","referee":"result_sha256"}.get(kind,"report_sha256")
    claim=r.get(key)
    if not isinstance(claim,str) or claim!=digest({k:v for k,v in r.items() if k!=key}):
        raise ValueError("input report digest mismatch")
    if kind=="temporal" and r.get("not_new_measurement") is not True:
        raise ValueError("retrieval mislabelled as measurement")
    if kind=="human" and (r.get("human_authority_established") is not False or r.get("actual_end_user_outcome_measured") is not False):
        raise ValueError("fake human participation")
    if kind=="repeat" and r.get("temporal_ordering")!="NOT_ESTABLISHED":
        raise ValueError("historical repetition mislabelled as temporal")
    if kind=="complementarity" and "oracle" not in r.get("methods",{}).get("either_correct","").lower():
        raise ValueError("hidden ground-truth oracle ceiling not disclosed")
    if kind=="referee" and (r.get("panel")!="NOT_CONVENED" or
                            r.get("ruling_authority")!="NONE" or
                            r.get("new_gspc_measurement") is not False or
                            r.get("advisory_positions_unverified",{}).get("declared_votes")!=12):
        raise ValueError("referee source falsely grants ruling or measurement authority")
    if kind=="corrections" and (r.get("no_append_only_proof") is not True or
                               r.get("effect_of_correction_on_users")!="NOT_MEASURED" or
                               not isinstance(r.get("corrections_content_sha256"),str)):
        raise ValueError("corrections source falsely asserts independent custody or user outcomes")
    return claim


def card(kind,title,known,unknown,question,source_digest,scope):
    entry={
       "id":"gspc-research-"+kind,
       "title":title,
       "evidence_state":"RESEARCH_ONLY",
       "source_receipt_sha256":source_digest,
       "what_is_observed":known,
       "what_is_not_established":unknown,
       "review_question":question,
       "human_review_status":"NOT_REQUESTED",
       "independent_external_acceptance":False,
       "scope_note":scope,
    }
    entry["card_sha256"]=digest(entry)
    return entry


def render(reports):
    if set(reports)!=set(SOURCE_STATES):
        raise ValueError("exactly six distinct research report types required")
    receipts={k:validate(k,reports[k]) for k in SOURCE_STATES}
    t=reports["temporal"]
    r=reports["repeat"]
    c=reports["complementarity"]
    h=reports["human"]
    e=reports["referee"]
    q=reports["corrections"]
    cards=[
      card("temporal","What changed on the GSPC board?",
           f"The public board declared {t['n_axes']} axes, {t['n_measured_declared']} marked MEASURED, and {t['n_separated_model_axes']} separated model-axis leaders at the retrieval.",
           "New model runs, new evidence, end-user outcomes and regulator acceptance are not established by a GET.",
           "Which exact bank, model revision, timestamp and independent evaluation receipt establish any subsequent change?",
           receipts["temporal"],"Public source snapshot, not a new evaluation"),
      card("repeat","Can the same model-item result vary across archived cells?",
           f"{r['n_keys_observed_in_multiple_cells']} item keys appear in repeated cells; {r['n_grade_conflict_keys']} have conflicting correctness, including {r['grade_conflicts_by_recorded_metadata'].get('SAME_RECORDED_METADATA',0)} with the same recorded revision, route and bank.",
           "Temporal ordering, identical runtime settings, neural adaptation and actual customer impact are not established.",
           "Can the source runtimes be separately re-executed with pinned decoding and timestamps?",
           receipts["repeat"],"Historical public matched-item observations"),
      card("complementarity","When do different model errors overlap?",
           "Across "+str(c["n_eligible_axes"])+" public axes, eligible model pairs have measurable jointly wrong item fractions and theoretical either-correct ceilings.",
           "A ground-truth-aware oracle is not a deployable referee, production improvement, independent model family or BFT result.",
           "Can an independent referee choose a genuinely correct answer without seeing hidden ground truth, on new held-out tasks?",
           receipts["complementarity"],"Historical paired public-bank model correctness"),
      card("referee","Can twelve votes overrule a reproducible measurement rule?",
           f"The read-only referee independently derived {e['derived_public_source_value']} for {e['field']}, while the claim asserted {e['asserted']}; its verdict was DISSENT despite {e['advisory_positions_unverified']['advisory_concur']} of {e['advisory_positions_unverified']['declared_votes']} unauthenticated advisory positions.",
           "No real independent reviewer, live BFT quorum, truth outside the publisher source or binding human ruling exists.",
           "Can independent model reviewers reproduce the pre-registered rule and cite separately authenticated evidence, with no access to hidden outcomes?",
           receipts["referee"],"Read-only source-count check; advisory votes simulated"),
      card("corrections","Can we establish how quickly errors were corrected?",
           f"The public ledger contains {q['n_corrections']} corrections. Exact source-declared detection-to-publication intervals exist for {q['n_exact_timing_pairs_with_nonnegative_latency']} records; {q['timestamp_coverage']['published_at'].get('UNRECORDED',0)} publication times remain unrecorded.",
           "The source is not proven append-only; historical public deployment timestamps, recipient effects and correction SLAs are not independently verified.",
           "Which publication/deploy evidence can close the missing timestamp cases without backfilling invented dates?",
           receipts["corrections"],"Publisher-maintained corrections readback; no outcomes"),
      card("human","Does useful human information outperform mere presence?",
           f"The synthetic {h['n_matched_tasks']}-task factorial calculates separate information, presence, proposed-policy and time-period effects.",
           "No real user, independent outcome, model-weight change, human authority or AI consciousness was observed.",
           "What happens on registered, consenting human trials with blinded grading and externally checked user outcomes?",
           receipts["human"],"Synthetic-only methodological check"),
    ]
    out={
       "schema":SCHEMA,"state":"READ_ONLY_RESEARCH_PROJECTION",
       "source_report_count":len(SOURCE_STATES),
       "cards":cards,
       "human_authority":"NOT_GRANTED",
       "gspc_board_mutations":0,
       "model_weight_updates":0,
       "external_end_user_effects_verified":0,
       "independent_referee_acceptances":0,
       "not_neural_jspace":True,
       "limitations":[
           "Readable research projection; not a second GSPC grader, canonical evidence event or HITL authority channel",
           "Data from different axes should not be pooled into a single safety grade",
           "No personal/demographic information is collected or inferred",
           "A language model or UI summarising records cannot elevate their evidence states",
       ],
    }
    out["report_sha256"]=digest(out)
    return out


def markdown(report):
    lines=["# GSPC / H.I.M. research reading cards","","**Research only — not certification or operating approval.**",""]
    for c in report["cards"]:
        lines += [
            "## "+c["title"],"",
            "**Observed:** "+c["what_is_observed"],"",
            "**Not established:** "+c["what_is_not_established"],"",
            "**Human-review question:** "+c["review_question"],"",
            "**Evidence:** sha256:"+c["source_receipt_sha256"],"",
        ]
    lines += ["---","Source projection digest: "+report["report_sha256"],
              "No new model calls, human approvals or end-user outcomes."]
    return "\n".join(lines)+"\n"


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input",action="append",required=True,metavar="TYPE=FILE")
    p.add_argument("--format",choices=("json","markdown"),default="json")
    a=p.parse_args()
    reports={}
    for entry in a.input:
        if "=" not in entry:
            p.error("expected TYPE=FILE")
        k,path=entry.split("=",1)
        if k not in SOURCE_STATES or k in reports:
            p.error("unsupported/duplicate report type")
        file=Path(path)
        if not file.is_file() or file.is_symlink() or file.stat().st_size>1_000_000:
            p.error("not a bounded regular report file")
        reports[k]=json.loads(file.read_text())
    output=render(reports)
    print(markdown(output) if a.format=="markdown" else json.dumps(output,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
