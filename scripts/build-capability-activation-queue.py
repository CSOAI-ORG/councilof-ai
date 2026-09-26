#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"council-os/capabilities.json"
OUT=ROOT/"build/capability-activation-queue.json"

EXPORT_RE=re.compile(r"export\s+(?:const|async\s+function|function)\s+(onRequest(?:Get|Post|Put|Patch|Delete|Options))")
STATUS_RE=re.compile(r"(?:status\s*[:=]\s*|,\s*)([2345][0-9]{2})(?:\b|\s*[,}])")

def cid(v):
    return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def handler_for(cap:dict):
    # Canonical source is strongest: nested routes and dotted filenames cannot be
    # reconstructed safely from capability ids alone.
    source=str(cap.get("source") or "").strip()
    if source:
        candidate=ROOT/source
        if candidate.is_file():
            return candidate

    route=str(cap.get("path") or cap.get("endpoint") or "").split("?",1)[0]
    if route.startswith("/api/"):
        rel=route.removeprefix("/api/").strip("/")
        for candidate in [ROOT/"functions/api"/(rel+".ts"),ROOT/"functions/api"/rel/"index.ts"]:
            if candidate.is_file():
                return candidate

    cap_id=str(cap.get("id") or "")
    base=cap_id.removeprefix("api-").removesuffix("-post")
    for candidate in [ROOT/"functions/api"/(base+".ts"),ROOT/"functions/api"/base/"index.ts"]:
        if candidate.is_file():
            return candidate
    return None

def expected_export(method:str):
    return "onRequest"+method.title()

def classify(c, handler, exports, text):
    life=c.get("lifecycle")
    method=str(c.get("method") or "GET").upper()
    export_ok=expected_export(method) in exports
    if life in {"RETIRED","DOOR_CLOSED","METHOD_NOT_ALLOWED"}:
        return "NO_ACTIVATION_BY_DESIGN"
    if handler is None:
        return "IMPLEMENTATION_GAP"
    if not export_ok:
        return "HANDLER_METHOD_DRIFT"
    fail_closed=(
        "@openapi-unavailable" in text
        or "@openapi-not-implemented" in text
        or "@openapi-post-not-implemented" in text
        or 'csoai.retired-endpoint/0.1' in text
        or 'state: "NOT_IMPLEMENTED"' in text
        or 'unavailable(' in text
    )
    if life=="QUARANTINED_PRE_RELEASE":
        return "FAIL_CLOSED_QUARANTINE" if fail_closed else ("READ_ONLY_EVIDENCE_REVIEW" if method=="GET" else "EFFECT_AUTHORITY_REVIEW")
    if life=="NOT_IMPLEMENTED":
        return "FAIL_CLOSED_NOT_IMPLEMENTED" if fail_closed else "DECLARATION_RUNTIME_CONFORMANCE_REVIEW"
    return "UNCLASSIFIED"

def main():
    doc=json.loads(SOURCE.read_text())
    rows=[]
    for c in doc.get("capabilities") or []:
        if c.get("lifecycle")=="LIVE": continue
        handler=handler_for(c)
        text=handler.read_text(errors="replace") if handler else ""
        exports=sorted(set(EXPORT_RE.findall(text)))
        statuses=sorted({int(x) for x in STATUS_RE.findall(text)})
        row={
            "capability_id":c.get("id"),
            "lifecycle":c.get("lifecycle"),
            "kind":c.get("kind"),
            "method":c.get("method"),
            "payment":c.get("payment"),
            "surfaces":c.get("surfaces") or [],
            "handler":str(handler.relative_to(ROOT)) if handler else None,
            "handler_exports":exports,
            "declared_method_export_present":expected_export(str(c.get("method") or "GET").upper()) in exports,
            "static_http_status_hints":statuses,
            "description":c.get("description") or "",
        }
        row["activation_class"]=classify(c,handler,exports,text)
        if row["activation_class"]=="READ_ONLY_EVIDENCE_REVIEW":
            row["next_gate"]="run read-only fixture with frozen public inputs; prove response boundary, error states and source derivation before lifecycle promotion"
        elif row["activation_class"]=="EFFECT_AUTHORITY_REVIEW":
            row["next_gate"]="prove exact authority/effect binding, replay behavior, failure states and receipt semantics before any lifecycle promotion"
        elif row["activation_class"]=="DECLARATION_RUNTIME_CONFORMANCE_REVIEW":
            row["next_gate"]="run bounded fixture to resolve declaration/runtime drift before considering lifecycle change"
        elif row["activation_class"]=="FAIL_CLOSED_QUARANTINE":
            row["next_gate"]="keep closed; satisfy the handler's explicit re-enable conditions and constitutional/release gate before any lifecycle change"
        elif row["activation_class"]=="FAIL_CLOSED_NOT_IMPLEMENTED":
            row["next_gate"]="implement the durable worker/store/evidence path first; current fail-closed facade is the correct behavior"
        elif row["activation_class"]=="NO_ACTIVATION_BY_DESIGN":
            row["next_gate"]="no automatic activation; only explicit product/constitution decision may reopen"
        else:
            row["next_gate"]="resolve handler/declaration drift before runtime testing"
        row["automatic_promotion"]=False
        row["content_id"]=cid(row)
        rows.append(row)
    counts=dict(sorted(Counter(r["activation_class"] for r in rows).items()))
    out={
        "schema":"csoai.capability-activation-queue/0.1",
        "source":"council-os/capabilities.json",
        "source_sha256":hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "non_live_count":len(rows),
        "counts":counts,
        "rows":rows,
        "laws":[
            "handler existence is not implementation proof",
            "static status literals are hints, not runtime evidence",
            "retired/closed/method-not-allowed surfaces are not auto-reopened",
            "POST/effectful surfaces require authority/effect-binding review",
            "lifecycle promotion requires measured evidence; queue state cannot self-promote",
        ],
    }
    out["content_id"]=cid(out)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"state":"PASS","non_live_count":len(rows),"counts":counts,"out":str(OUT)},indent=2))
if __name__=="__main__": main()
