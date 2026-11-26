#!/usr/bin/env python3
"""Four real public-browser CouncilOS journeys using observed, not simulated, cases.

Read only; never posts an enquiry, executes a model/tool, signs, or stores personal data.
Requires pip package playwright and an installed Chrome/Chromium binary. This script
replays current public frontend behavior; results are site-state-specific, not an
independent authenticated human / MEOK / buyer acceptance.
"""
import argparse,hashlib,json
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

def measure(bank_text, chrome):
    cases=json.loads(bank_text)
    if len(cases)!=2 or any(x.get("realm")!="OBSERVED" for x in cases):
        raise ValueError("requires exactly two real observed source episodes")
    hosts=["https://councilof.ai","https://councilof-ai.pages.dev"]
    sizes=[{"width":390,"height":844},{"width":1280,"height":900}]
    results=[]
    with sync_playwright() as p:
        kwargs={"headless":True,"args":["--no-first-run"]}
        if chrome: kwargs["executable_path"]=chrome
        browser=p.chromium.launch(**kwargs)
        try:
            for view in sizes:
                for host in hosts:
                    page=browser.new_page(viewport=view)
                    errors=[]
                    requests=[]
                    page.on("pageerror",lambda e:errors.append(str(e)[:160]))
                    page.on("request",lambda q:requests.append((q.method,q.url)))
                    try:
                        response=page.goto(host+"/dashboard/?tab=evidence-learning",
                                           wait_until="domcontentloaded",timeout=23000)
                        page.wait_for_timeout(900)
                        panel=page.locator('[data-testid="reaction-research-review"]')
                        if panel.count()!=1:
                            raise RuntimeError("reaction panel absent from hydrated live site")
                        if page.locator('[data-testid="evidence-learning-pane"]').count()!=1:
                            raise RuntimeError("canonical evidence pane absent")
                        panel.locator("summary").click()
                        area=panel.locator("textarea")
                        area.fill(bank_text)
                        before=len(requests)
                        panel.get_by_role("button",name="Review reported stages").click()
                        output=panel.locator('[role="status"]').inner_text()
                        if not all(k in output for k in (
                            "UNQUALIFIED INPUT",
                            "observed-labelled: 2",
                            "simulated-labelled: 0",
                            "human_approval",
                            "receiver_verification",
                            "ACCEPTANCE_INCOMPLETE")):
                            raise RuntimeError("real source not displayed as unqualified observed cases")
                        count_after=len(requests)
                        # A genuine invalid-input negative control, NOT simulated model
                        # output or a production agent action.
                        area.fill('{"schema":"NOT_A_VALID_EPISODE"}')
                        panel.get_by_role("button",name="Review reported stages").click()
                        rejected="REVIEW REFUSED" in panel.locator('[role="status"]').inner_text()
                        if not rejected:raise RuntimeError("malformed source was not refused")
                        panel.get_by_role("button",name="Clear local input").click()
                        cleared=area.input_value()==""
                        if not cleared:raise RuntimeError("clear input failed")
                        overflow=page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
                        scripts=page.evaluate("""() => performance.getEntriesByType('resource').map(x=>x.name)
                           .filter(x=>x.includes('DashboardEvidenceLearningPane') && x.endsWith('.js'))""")
                        entry={"host":host,"viewport":view,"status":response.status if response else None,
                           "reaction_panel_count":panel.count(),"observed_cases":2,
                           "simulated_cases":0,"refusal_control_passed":rejected,
                           "local_clear_passed":cleared,
                           "network_requests_during_review":count_after-before,
                           "page_errors":errors,"horizontal_overflow":overflow,
                           "loaded_evidence_assets":scripts[-4:],
                           "passed":response is not None and response.status==200 and
                                not errors and not overflow and count_after==before and
                                rejected and cleared}
                        results.append(entry)
                    finally:page.close()
        finally:browser.close()
    return {"schema":"csoai.real-public-reaction-browser-readback/0.1",
       "observed_at":datetime.now(timezone.utc).isoformat(),
       "evidence_input_sha256":hashlib.sha256(bank_text.encode()).hexdigest(),
       "actual_observed_case_count":2,
       "frozen_browsers":"Authorized Chrome launched through Playwright, fresh context each journey",
       "journeys":results,"all_passed":len(results)==4 and all(x["passed"] for x in results),
       "real_browser_visited":True,"model_reinference_done_during_browser":False,
       "qualified_human_approval":False,"independent_external_receiver_acceptance":False,
       "paid_buyer_accepted":False,
       "notes":[
        "A real deployed user interface readback of two previously measured case reports.",
        "Page HTTP 200 alone is insufficient; the hydrated controls were clicked and observed.",
        "Malformed JSON negative control tests the live review refusal, not model security prevention.",
        "No live MEOK tool effect, authenticated human signer, third-party accepted outcome or new GSPC admission."
       ]}
def main():
    a=argparse.ArgumentParser()
    a.add_argument("--bank",required=True)
    a.add_argument("--chrome")
    a.add_argument("--output",required=True)
    x=a.parse_args()
    data=Path(x.bank).read_text()
    record=measure(data,x.chrome)
    with open(x.output,"x",encoding="utf8") as f:
        json.dump(record,f,indent=2,sort_keys=True);f.write("\n")
    print(json.dumps({"count":len(record["journeys"]),
                      "pass":record["all_passed"],
                      "sha256":record["evidence_input_sha256"],
                      "assets":[x["loaded_evidence_assets"] for x in record["journeys"]]}))
    if not record["all_passed"]:raise SystemExit(2)
if __name__=="__main__":main()
