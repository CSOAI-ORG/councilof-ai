import test from "node:test";
import assert from "node:assert/strict";
import { capture, interpret, ENDPOINTS } from "./public-signal-watch.mjs";

const src = id => ENDPOINTS.find(s => s.id === id);
test("platform downloads cannot turn into users", () => {
 const r = interpret(src("hf_evidence"), 200, JSON.stringify({id:"csoai/councilof-ai-evidence",downloads:167464,likes:1}));
 assert.equal(r.evidence.downloads,167464);
 assert.match(r.limitation,/NOT unique people/);
 assert.equal(interpret(src("hf_evidence"),200,'{"id":"unrelated","downloads":100000}').state,"UNPARSEABLE");
});
test("unknown funnel is not zero or institutional adoption", () => {
 const stages=Object.fromEntries(["registry_listings","gross_distribution","qualified_distribution","observed_execution","economic_use","repeat_payers","institutional_use"].map(k=>[k,{state:"UNMEASURED",value:null}]));
 const r=interpret(src("footprint"),200,JSON.stringify({schema:"csoai.footprint/0.1",funnel:{rule:"No stage implies next"},...stages}));
 assert.equal(r.evidence.stages.institutional_use.value,null);
 assert.equal(r.evidence.stages.observed_execution.state,"UNMEASURED");
 const bad=interpret(src("footprint"),200,JSON.stringify({schema:"csoai.footprint/0.1",funnel:{rule:"Rule"},...stages,economic_use:{state:"READ",value:"4"}}));
 assert.equal(bad.state,"UNPARSEABLE");
});
test("a missing live route is never inferred healthy", () => {
 assert.equal(interpret(src("institutions"),404,"not found").state,"UNAVAILABLE");
 assert.equal(interpret(src("institutions"),200,"ok").state,"LIVE_HTTP_200");
});
test("external warning remains allegation, not Council finding", () => {
 const r=interpret(src("directory_flag"),200,"MEOK AI Labs / CSOAI self-issued trust signal io.github.CSOAI-ORG/regex-ai-mcp");
 assert.equal(r.evidence.sample_listed,true);
 assert.match(r.limitation,/Unverified third-party allegation/);
});
test("independent uptime is captured from observed days, not hard-coded 30-day claim", () => {
 const page = '<title>csoai-org/gspc MCP server</title><div aria-label="Availability 100%. 67 of 67 days answered."></div>';
 const got = interpret(src("external_mcp_monitor"), 200, page);
 assert.equal(got.evidence.availability_answered_days, 67);
 assert.equal(got.evidence.availability_observed_days, 67);
 const changed = interpret(src("external_mcp_monitor"), 200, "<title>csoai-org/gspc</title>");
 assert.equal(changed.evidence.availability_observed_days, null);
});
test("one broken source does not fabricate counts or abort capture", async () => {
 const d=await capture({at:"2026-11-22T07:00:00.000Z",fetcher:async()=>{throw Error("offline")}});
 assert.equal(d.sources.length,ENDPOINTS.length);
 assert.ok(d.sources.every(x=>x.state==="UNAVAILABLE" && x.evidence===null));
 assert.equal(d.buyers_inferred_from_downloads,false);
 assert.equal(d.publication_state,"UNSIGNED_RESEARCH_CAPTURE_NOT_ADMITTED");
});