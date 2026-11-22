import { describe, expect, it } from "vitest";
import registry from "./gspc-tools.json";
import { toolsListResult, TOOLS_LIST_SELECTION } from "./_tools_list";
const defs = registry.tools;
const select = (name = "board_totals") => ({ _meta: { [TOOLS_LIST_SELECTION]: { version: 1, name } } });

describe("explicit bounded tools/list selection", () => {
  it("keeps legacy objects, order and serialized bytes identical", () => {
    for (const params of [undefined, {}, {cursor:"legacy"}, {_meta:{unrelated:true}}]) {
      const result = toolsListResult(defs, params);
      expect(result.tools).toBe(defs);
      expect(JSON.stringify(result)).toBe(JSON.stringify({tools:defs}));
    }
  });
  it("returns the original board descriptor with an honest partial marker", () => {
    const result = toolsListResult(defs, select());
    expect(result.tools).toEqual(defs.filter((tool) => tool.name === "board_totals"));
    expect(result.tools[0]).toBe(defs.find((tool) => tool.name === "board_totals"));
    expect(result._meta?.[TOOLS_LIST_SELECTION]).toEqual({version:1,name:"board_totals",complete:false,matches:1});
    expect(new TextEncoder().encode(JSON.stringify({jsonrpc:"2.0",id:"meok-library-abi",result})).length).toBeLessThan(65536);
  });
  it("cannot select a paid tool absent from the free definitions", () => {
    const result = toolsListResult(defs, select("commission_card"));
    expect(result.tools).toEqual([]);
    expect(result._meta?.[TOOLS_LIST_SELECTION]).toMatchObject({matches:0,error:"unknown_tool",complete:false});
  });
  it("does not return ambiguous descriptors", () => {
    const result = toolsListResult([{name:"board_totals"},{name:"board_totals"}], select());
    expect(result.tools).toEqual([]);
    expect(result._meta?.[TOOLS_LIST_SELECTION]).toMatchObject({matches:2,error:"ambiguous_tool"});
  });
  it.each([null, [], "board_totals", {version:true,name:"board_totals"},
    {version:2,name:"board_totals"}, {version:1,name:""}, {version:1,name:"x".repeat(129)},
    {version:1,name:"board_totals",extra:true}])("refuses malformed explicit selectors: %j", (selector) => {
    const result = toolsListResult(defs, {_meta:{[TOOLS_LIST_SELECTION]:selector}});
    expect(result.tools).toEqual([]);
    expect(result._meta?.[TOOLS_LIST_SELECTION]).toMatchObject({error:"invalid_selector",matches:0});
  });
  it("does not mix named selection with an unsupported pagination cursor", () => {
    const result = toolsListResult(defs, {...select(),cursor:"next"});
    expect(result.tools).toEqual([]);
    expect(result._meta?.[TOOLS_LIST_SELECTION]).toMatchObject({error:"invalid_selector"});
  });
});

import { onRequest, FREE_DEFINITIONS } from "./[[path]]";

async function listOverHttp(selected: string | null, modern: boolean, path = "/mcp/free") {
  const meta: Record<string, unknown> = modern ? {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {},
  } : {};
  if (selected) meta[TOOLS_LIST_SELECTION] = {version:1,name:selected};
  const headers: Record<string,string> = {"content-type":"application/json",accept:"application/json"};
  if (modern) Object.assign(headers, {"MCP-Protocol-Version":"2026-07-28","Mcp-Method":"tools/list"});
  const response = await onRequest({request:new Request("https://councilof.ai"+path, {
    method:"POST",headers,body:JSON.stringify({jsonrpc:"2.0",id:"bounded-test",method:"tools/list",params:{_meta:meta}}),
  }),env:{},waitUntil:()=>{}});
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const message=await response.json();
  expect(message.error).toBeUndefined();
  return message.result;
}

describe("actual MCP HTTP selection and catalogue isolation", () => {
  it.each([[false,true],[false,false],[true,true],[true,false]])(
    "does not mix selected and legacy catalogue replies (modern=%s, selected-first=%s)",
    async (modern, selectedFirst) => {
      const first=await listOverHttp(selectedFirst ? "board_totals" : null,modern);
      const second=await listOverHttp(selectedFirst ? null : "board_totals",modern);
      const selected=selectedFirst ? first : second, full=selectedFirst ? second : first;
      expect(selected.tools).toEqual(FREE_DEFINITIONS.filter((tool)=>tool.name==="board_totals"));
      expect(selected._meta[TOOLS_LIST_SELECTION]).toEqual({version:1,name:"board_totals",complete:false,matches:1});
      expect(full.tools).toEqual(FREE_DEFINITIONS);
      expect(full._meta?.[TOOLS_LIST_SELECTION]).toBeUndefined();
      if (modern) {
        expect(selected.ttlMs).toBe(0);
        expect(full.ttlMs).toBe(0);
      } else {
        expect(JSON.stringify(full)).toBe(JSON.stringify({tools:FREE_DEFINITIONS}));
      }
    });
  it("preserves full/free discovery separation through the actual handler", async () => {
    const free=await listOverHttp("commission_card",false);
    const full=await listOverHttp("commission_card",false,"/mcp");
    expect(free.tools).toEqual([]);
    expect(free._meta[TOOLS_LIST_SELECTION].error).toBe("unknown_tool");
    expect(full.tools).toHaveLength(1);
    expect(full.tools[0].name).toBe("commission_card");
  });
});
