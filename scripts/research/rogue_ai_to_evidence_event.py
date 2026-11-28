#!/usr/bin/env python3
"""Convert verified upstream ROGUE-AI archive arithmetic to unsigned PARTIAL
canonical Council evidence. This does not run models or admit GSPC grades.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"docs/research/rogue-ai-public-archive-20261124/observed-audit.json"

def build_source_review_event(doc):
    spec=importlib.util.spec_from_file_location("csoai_evidence_event",ROOT/"packages/evidence-fabric/event.py")
    fabric=importlib.util.module_from_spec(spec);spec.loader.exec_module(fabric)
    if (doc.get("schema")!="csoai.external-paper-archived-outcome-audit/0.1" or
        doc.get("archive_original_bytes_sha256")!="3643f291c8a25680a30771e7db9e339fb0ac84424db20afdd05cc11075d551da" or
        doc.get("table_original_bytes_sha256")!="54c036c426af169c5d6cb3be211e0e7452e38207df96a3ac0f5fd8887860d905" or
        doc.get("row_count")!=108 or
        doc.get("reported_reproduced")!=96 or
        doc.get("reported_not_reproduced")!=12 or
        doc.get("original_paper_model_sessions_reexecuted") is not False or
        doc.get("csoai_gspc_result_admitted") is not False or
        doc.get("independent_human_recipient_accepted") is not False):
        raise ValueError("Original third-party archival evidence or claim-boundary drift")
    parts=doc.get("initial_verdict_by_final_reproduction",{})
    if (parts.get("supported:yes")!=32 or parts.get("suggestive:yes")!=23 or
        parts.get("no control:yes")!=2 or parts.get("not reproduced:yes")!=39 or
        parts.get("not reproduced:no")!=12):
        raise ValueError("Initial versus later source verdict drift")
    event=fabric.build(
      subject={"kind":"dataset","locator":
               "rogue-ai-public-archive-sha256:"+doc["archive_original_bytes_sha256"]},
      claim={
        "text":"Independent arithmetic recalculation of source authors' archived agent experiment outcome table, not a new frontier-model run",
        "source_url":doc["source_url"],
        "source_sha256":doc["archive_original_bytes_sha256"],
        "read_at":doc["observed_source_at"]
      },
      method={"id":"rogue-ai-source-csv-arithmetic-recheck","version":"0.1","holder":"csoai",
              "source_method_path":"scripts/research/audit_rogue_ai_public_archive.py"},
      declared={
         "original_research_paper":doc["paper_url"],
         "original_source_holder":"third_party:ROGUE-AI authors",
         "source_table_sha256":doc["table_original_bytes_sha256"],
         "original_row_count":108,"source_original_model_runs_only":True,
         "original_license_note":doc["licence_notice"]
      },
      observed={
        "original_publisher_reproduced_yes":doc["reported_reproduced"],
        "original_publisher_reproduced_no":doc["reported_not_reproduced"],
        "actual_source_rows_read":doc["row_count"],
        "initial_supported_and_final_yes":32,
        "initial_suggestive_and_final_yes":23,
        "initial_no_control_but_final_yes":2,
        "initial_not_reproduced_but_later_yes":39,
        "original_authors_model_session_counts":doc["authors_original_model_session_totals"],
        "aggregate_original_controls":doc["authors_aggregated_control_sessions"],
        "actual_model_inference_by_csoai":False,
        "gspc_board_admitted":False,
        "external_human_receiver_accepted":False,
        "checked_at":doc["observed_source_at"]
      },
      state="PARTIAL",value=None,
      negative_control={
        "id":"original-source-no-control-rows-are-not-causal-evidence",
        "expected":None,
        "got":"2 original rows marked no control and reproduced yes; cannot promote to causally supported"
      },
      limits=[
        "Original model sessions performed by the paper authors, not by CSOAI; this is archived arithmetic only.",
        "The 96/108 reproduction count does not imply 96 original matched-control causal demonstrations.",
        "Original labels, environmental effects, signer identities and task rights were not independently reviewed.",
        "No authenticated human approved a MEOK action, no external recipient accepted a Council outcome.",
        "Source attribution and MIT software notice retained; no raw incident transcripts republished."
      ])
    if fabric.validate(event):
        raise ValueError("Canonical evidence event rejected")
    if event["signature"] is not None or event["anchors"]["ots"]!="none":
        raise ValueError("Unsigned third-party review was promoted to signed")
    return event

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",default=str(SOURCE))
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    source=json.loads(Path(args.source).read_text())
    event=build_source_review_event(source)
    with open(args.output,"x",encoding="utf8") as f:json.dump(event,f,sort_keys=True,indent=2);f.write("\n")
    print(json.dumps({"event_id":event["event_id"],"state":event["state"],
                      "signed":False,"gspc_admitted":False,"model_reexecuted":False}))
if __name__=="__main__":main()
