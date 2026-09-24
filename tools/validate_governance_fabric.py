#!/usr/bin/env python3
from pathlib import Path
import json, sys

root=Path(__file__).resolve().parents[1]
errors=[]
def load(rel):
    try:
        return json.loads((root/rel).read_text())
    except Exception as e:
        errors.append(f"{rel}: {e}")
        return {}

manifest=load("public/governance/manifest.json")
authority=load("public/governance/authority-model.json")
committee=load("public/governance/committee-registry.json")
routes=load("public/governance/contribution-routes.json")
correction=load("public/governance/correction-policy.json")
wellknown=load("public/.well-known/csoai-governance.json")
schema=load("public/interop/work-evidence-capsule-v0.1.schema.json")
bundle=load("public/governance/bundle-index.json")

expected_sites={"https://councilof.ai","https://csoai.org","https://proofof.ai","https://asisecurity.ai","https://agisafe.ai","https://meok.ai","https://openmoe.ai","https://safetyof.ai"}
seen={x.get("site") for x in manifest.get("sites",[])}
if seen != expected_sites:
    errors.append(f"site set mismatch: {sorted(seen)}")

if manifest.get("canonical") != wellknown.get("canonical"):
    errors.append("well-known canonical pointer mismatch")

statuses=set(committee.get("rules",{}).get("statuses",[]))
for row in committee.get("internal_roles",[])+committee.get("external_participation",[]):
    if row.get("status") not in statuses:
        errors.append(f"invalid committee status: {row.get('id')}")

for row in committee.get("external_participation",[]):
    if row.get("status")=="OPEN_SLOT" and row.get("name"):
        errors.append(f"open slot must not publish a name: {row.get('id')}")

lanes=set(authority.get("decision_lanes",{}))
if lanes != {"owner_authorised","public_permissionless","external_governed","private_or_restricted"}:
    errors.append("authority lanes incomplete")

if len(routes.get("routes",[])) < 8:
    errors.append("contribution route coverage too small")

required_triggers={"authority or delegation changes","skill/resource digest changes","new contrary evidence"}
if not required_triggers.issubset(set(correction.get("triggers",[]))):
    errors.append("correction triggers incomplete")

if schema.get("title") != "WorkEvidenceCapsule":
    errors.append("work evidence schema missing or wrong")

if len(bundle.get("entries",[])) < 6:
    errors.append("bundle index incomplete")

for phrase in committee.get("external_not_controlled",[]):
    if not isinstance(phrase,str) or not phrase.strip():
        errors.append("external_not_controlled contains empty value")

print(json.dumps({"valid":not errors,"errors":errors,"sites":len(seen),"routes":len(routes.get("routes",[])),"committee_rows":len(committee.get("internal_roles",[]))+len(committee.get("external_participation",[])),"correction_triggers":len(correction.get("triggers",[]))},indent=2))
sys.exit(1 if errors else 0)
