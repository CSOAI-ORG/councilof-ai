#!/usr/bin/env node
// Local, read-only stdio preview. No network, writes, appointments or execution tools.
import { readFileSync } from "node:fs";
import { McpServer, fromJsonSchema } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { selectDocuments, reviewDraft, validateCatalog, STATUSES } from "../../council-os/working-groups/core.mjs";
import { validateResearchPack, assessClaim } from "../../council-os/working-groups/research.mjs";
const read = file => JSON.parse(readFileSync(new URL("../../council-os/"+file, import.meta.url), "utf8"));
const catalog = validateCatalog({...read("working-group-tracker.json"),schema:"csoai.working-group-catalog/1",groups:read("working-groups.json").groups});
const server = new McpServer({name:"council-working-groups-preview",version:"0.1.0"});
const annotations = {readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const result = value => ({content:[{type:"text",text:JSON.stringify(value,null,2)}],structuredContent:value});
const schema = (properties,required=[]) => fromJsonSchema({type:"object",properties,required,additionalProperties:false});
server.registerTool("working_group_documents",{
  description:"Read this checkout's dated public working-group proposals. Not the live board or a member register.",
  annotations,inputSchema:schema({query:{type:"string",maxLength:200},group:{type:"string",enum:catalog.groups.map(g=>g.id)},status:{type:"string",enum:STATUSES}})
},async args=>result({asOf:catalog.asOf,publication:catalog.publication,scope:catalog.scope,documents:selectDocuments(catalog,args)}));
server.registerTool("working_group_review_draft",{
  description:"Prepare unsent review text for an exact public document ID. Returns text only; does not save, send, approve or appoint anyone.",
  annotations,inputSchema:schema({documentId:{type:"string",enum:catalog.documents.map(d=>d.id)},observation:{type:"string",maxLength:8000},conflicts:{type:"string",maxLength:8000}},["documentId"])
},async args=>result({state:"UNSENT_DRAFT",text:reviewDraft(catalog,args.documentId,args)}));
const research = validateResearchPack(read("working-groups/research/controlai.json"));
server.registerTool("working_group_research",{
  description:"Read a dated public research pack with source rights, policy status, correction history and bounded observations. Usability checks are not factual verification or authority. No network or writes.",
  annotations,inputSchema:schema({packId:{type:"string",enum:[research.id]},asOf:{type:"string",pattern:"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"}},["packId","asOf"])
},async args=>result({pack:research,results:research.claims.map(c=>assessClaim(research,c.id,{asOf:args.asOf})),authorityGranted:false}));
await server.connect(new StdioServerTransport());
