import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { selectDocuments, reviewDraft, validateCatalog } from "../../council-os/working-groups/core.mjs";
import { workingGroupKit } from "./render-kit.mjs";
const root=new URL("../../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const groups=JSON.parse(read("council-os/working-groups.json"));
const tracker=JSON.parse(read("council-os/working-group-tracker.json"));
const catalog={...tracker,schema:"csoai.working-group-catalog/1",groups:groups.groups};
test("one canonical dated group mapping, unique IDs and honest unassigned drafts",()=>{
  validateCatalog(catalog);
  assert.equal(catalog.documents.length,catalog.groups.length);
  for(const doc of catalog.documents){
    assert.equal(doc.status,"draft");assert.equal(doc.editor,null);assert.deepEqual(doc.reviewers,[]);assert.equal(doc.decision,null);
  }
});
test("axis/group/status filters and an authoritative empty result",()=>{
  assert.deepEqual(selectDocuments(catalog,{query:"effect-binding"}).map(d=>d.groupId),["agent-control"]);
  assert.equal(selectDocuments(catalog,{group:"economy",query:"reserve"}).length,1);
  assert.equal(selectDocuments(catalog,{query:"nonexistent-participant"}).length,0);
  assert.equal(selectDocuments(catalog,{status:"published"}).length,0);
  assert.throws(()=>selectDocuments(catalog,{group:"__proto__"}),/Unknown/);
  assert.throws(()=>selectDocuments(catalog,{query:"x".repeat(201)}),/200/);
});
test("unknown groups, moving sources, duplicate IDs and unsupported statuses fail validation",()=>{
  for(const change of [d=>d.groupId="made-up",d=>d.source.commit="master",d=>d.source.path="../secret",d=>d.status="certified",d=>d.version+=1]){
    const x=structuredClone(catalog);change(x.documents[0]);assert.throws(()=>validateCatalog(x));
  }
  const x=structuredClone(catalog);x.documents.push(x.documents[0]);assert.throws(()=>validateCatalog(x));
});
test("adoption cannot silently appear without a human review reference and dissent record",()=>{
  const x=structuredClone(catalog);x.documents[0].status="adopted";assert.throws(()=>validateCatalog(x),/human review/);
});
test("draft is bounded, unsent, tied to a source commit and does not mutate the register",()=>{
  const before=JSON.stringify(catalog);
  const text=reviewDraft(catalog,"COAI-WG-002",{observation:"Synthetic <script>alert(1)</script> trace.",conflicts:"Test fixture only."});
  assert.match(text,/UNSENT DRAFT/);assert.match(text,/19ccbd406714/);assert.match(text,/<script>/);
  assert.equal(JSON.stringify(catalog),before);
  assert.throws(()=>reviewDraft(catalog,"unknown"));
  assert.throws(()=>reviewDraft(catalog,"COAI-WG-002",{observation:"x".repeat(8001)}));
});
test("generated public, HF and notebook snapshots agree and render deterministically",()=>{
  const doctrine=JSON.parse(read("council-os/distribution.json")).doctrine;
  const one=workingGroupKit(read,doctrine),two=workingGroupKit(read,doctrine);
  assert.deepEqual(one,two);
  assert.equal(one.get("public/working-groups/catalog.json"),one.get("distribution/working-groups/hf/catalog.json"));
  for(const [path,value] of one)assert.equal(read(path),value,path+" drifted");
  const manifest=JSON.parse(one.get("distribution/working-groups/manifest.json"));
  for(const row of manifest.files)assert.equal(createHash("sha256").update(one.get(row.path)).digest("hex"),row.sha256);
  const hf=one.get("distribution/working-groups/hf/README.md");assert.match(hf,/sdk: static/);assert.match(hf,/app_file: index.html/);
  const notebook=JSON.parse(one.get("distribution/working-groups/kaggle/working-groups.ipynb"));assert.equal(notebook.nbformat,4);
  const metadata=JSON.parse(one.get("distribution/working-groups/kaggle/kernel-metadata.template.json"));
  assert.equal(metadata.is_private,"true");assert.equal(metadata.enable_internet,"false");assert.equal(metadata.enable_gpu,"false");
});
test("static export escapes source text rather than interpreting markup",()=>{
  const poisoned=structuredClone(tracker);poisoned.documents[0].summary="<script>alert('x')</script>";
  const output=workingGroupKit(path=>path==="council-os/working-group-tracker.json"?JSON.stringify(poisoned):read(path),JSON.parse(read("council-os/distribution.json")).doctrine);
  const html=output.get("public/working-groups/index.html");
  assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes("<script>alert"));
});
test("real stdio MCP handshake lists only read and unsent-draft tools; invalid input is refused",async()=>{
  const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL("mcp/working-groups-preview/server.mjs",root))],stderr:"pipe"});
  const client=new Client({name:"working-group-test",version:"1.0.0"});
  try{
    await client.connect(transport);
    const list=await client.listTools();
    assert.deepEqual(list.tools.map(t=>t.name).sort(),["working_group_documents","working_group_research","working_group_review_draft"]);
    for(const tool of list.tools){assert.equal(tool.annotations.readOnlyHint,true);assert.equal(tool.annotations.openWorldHint,false);}
    const r=await client.callTool({name:"working_group_documents",arguments:{query:"effect-binding"}});
    assert.equal(r.structuredContent.documents[0].groupId,"agent-control");
    const empty=await client.callTool({name:"working_group_documents",arguments:{query:"nothing-matches-this"}});
    assert.deepEqual(empty.structuredContent.documents,[]);
    const draft=await client.callTool({name:"working_group_review_draft",arguments:{documentId:"COAI-WG-002",observation:"Local protocol exercise"}});
    assert.equal(draft.structuredContent.state,"UNSENT_DRAFT");
    for(const args of [{name:"working_group_review_draft",arguments:{documentId:"unknown"}},{name:"working_group_documents",arguments:{group:"__proto__"}},{name:"approve",arguments:{}}]){
      let rejected=false;
      try {const bad=await client.callTool(args);rejected=bad.isError===true;}catch(e){rejected=e instanceof Error;}
      assert.equal(rejected,true,"Unsupported calls must actually be refused.");
    }
  }finally{await client.close();}
});

test("all generated Dify tool modules compile as Python, including hyphenated axis names",()=>{
  const folder=fileURLToPath(new URL("distribution/dify/gspc/tools/",root));
  const files=readdirSync(folder).filter(name=>name.endsWith(".py")).map(name=>folder+"/"+name);
  assert.ok(files.some(file=>file.includes("axis_effect-binding.py")));
  execFileSync("python3",["-c","import sys; [compile(open(p, encoding='utf-8').read(), p, 'exec') for p in sys.argv[1:]]",...files]);
});
