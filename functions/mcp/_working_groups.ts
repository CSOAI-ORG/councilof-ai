/**
 * Public working-group context on the existing MCP doors.
 * Fixed, build-bound bytes only: no fetch, storage, enrolment or execution.
 */
import { fromJsonSchema, type McpServer } from "@modelcontextprotocol/server";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";
import CATALOG from "../../public/working-groups/catalog.json";
import { reviewDraft, validateCatalog } from "../../council-os/working-groups/core.mjs";

export const WORKING_GROUP_CATALOG_URI = "https://councilof.ai/working-groups/catalog.json";
export const WORKING_GROUP_REVIEW_PROMPT = "working_group_review";
const catalog = validateCatalog(CATALOG);
const catalogText = JSON.stringify(catalog, null, 2) + "\n";
export const WORKING_GROUP_ACCESS = {
  register: "https://councilof.ai/working-groups/",
  resource: WORKING_GROUP_CATALOG_URI,
  prompt: WORKING_GROUP_REVIEW_PROMPT,
  as_of: catalog.asOf,
  scope: "Dated public proposals and an unsent blank review draft. No submission, appointment, decision or execution.",
  fallback: "If your client does not expose MCP resources or prompts, open the register in a browser.",
};

export function registerWorkingGroups(server: McpServer): void {
  server.registerResource("working-group-register", WORKING_GROUP_CATALOG_URI, {
    title: "Council working-group document register",
    description: "Build-bound, dated public proposals. Forming groups; no accepted-member or live measurement claims.",
    mimeType: "application/json",
    cacheHint: { ttlMs: 300_000, cacheScope: "public" },
  }, async uri => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: catalogText }],
  }));
  server.registerPrompt(WORKING_GROUP_REVIEW_PROMPT, {
    title: "Prepare a working-group review",
    description: "Return an unsent blank review for one exact public document ID. Fill evidence and conflicts locally; this prompt never submits or approves it.",
    argsSchema: fromJsonSchema<{ documentId: string }>({
      type: "object",
      properties: { documentId: { type: "string", description: "Exact ID from the public register.", enum: catalog.documents.map((d: { id: string }) => d.id) } },
      required: ["documentId"],
      additionalProperties: false,
    }, new CfWorkerJsonSchemaValidator()),
  }, async ({ documentId }) => ({
    description: "UNSENT DRAFT — public proposal review",
    messages: [{ role: "user", content: { type: "text", text: reviewDraft(catalog, documentId) } }],
  }));
}
