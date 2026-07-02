import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const t = new StdioClientTransport({ command: "node", args: ["index.mjs"] });
const c = new Client({ name: "smoke", version: "0.0.1" }, { capabilities: {} });
await c.connect(t);
const tools = await c.listTools();
console.log("TOOLS:", tools.tools.map((x) => x.name).join(", "));
const sign = await c.callTool({ name: "csoai_sign", arguments: { artifact: "smoke-test artifact from an external agent" } });
const txt = sign.content?.[0]?.text || "";
console.log("SIGN → " + txt.slice(0, 220).replace(/\s+/g, " "));
const cat = await c.callTool({ name: "csoai_catalog", arguments: { query: "eu ai act" } });
console.log("CATALOG → " + (cat.content?.[0]?.text || "").slice(0, 160).replace(/\s+/g, " "));
await c.close();
