// gspcInstall.ts — the per-platform install matrix for "Connect GSPC to your AI".
//
// SOURCE OF TRUTH for the /connect-gspc page. Every config block here was verified
// against the platform's CURRENT official docs (Sept 2026); the docUrl is the page it
// was checked against. `verified: false` marks a shape we could not confirm against
// official docs — it is shown clearly labelled "unverified", never as a promise.
//
// The asset (already live, a STANDARD MCP server so it works on every MCP client):
//   remote HTTP MCP : https://councilof.ai/mcp   (streamable-http, no auth, 7 read tools)
//   stdio (npm)     : npx -y csoai-gspc-mcp
//   universal REST  : GET https://councilof.ai/api/gspc  (+ ?axis=), GET /api/cards
//   OpenAPI 3.1     : https://councilof.ai/openapi/gspc.json
//   function tools  : https://councilof.ai/openapi/gspc-function-tools.json
//
// We MEASURE; we never certify. The test line proves the connection with a real call.

export const MCP_URL = "https://councilof.ai/mcp";
export const STDIO_CMD = "npx -y csoai-gspc-mcp";
export const OPENAPI_URL = "https://councilof.ai/openapi/gspc.json";
export const FN_TOOLS_URL = "https://councilof.ai/openapi/gspc-function-tools.json";

// The one line that proves it worked, everywhere.
export const TEST_LINE =
  'Test it: ask your AI to call board_totals — expect the live board, currently "22 axis · 15 measured". Empty cells stay empty.';

export type Gate = "live" | "paid" | "review";

export interface ConfigBlock {
  label: string;
  lang: string;
  code: string;
}

export interface PlatformCard {
  id: string;
  name: string;
  /** mcp = native MCP client; action = OpenAPI Action; fn = raw function-calling; connector = hosted connector UI */
  kind: "mcp" | "action" | "fn" | "connector";
  verified: boolean;
  tagline: string;
  gate: Gate;
  docUrl: string;
  blocks: ConfigBlock[];
  note?: string;
}

// ── MCP-native clients (all VERIFIED Sept 2026) ────────────────────────────────
export const MCP_NATIVE: PlatformCard[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "One CLI command. HTTP transport, no auth.",
    docUrl: "https://code.claude.com/docs/en/mcp",
    blocks: [
      { label: "Remote (recommended)", lang: "bash", code: "claude mcp add --transport http csoai-gspc https://councilof.ai/mcp" },
      { label: "stdio fallback", lang: "bash", code: "claude mcp add --transport stdio csoai-gspc -- npx -y csoai-gspc-mcp" },
      { label: "Project .mcp.json", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "type": "http", "url": "https://councilof.ai/mcp" }
  }
}` },
    ],
    note: 'type "http" is Claude Code\'s alias for streamable-HTTP; it is required when a url is present.',
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "Paid plans: paste the URL in Connectors. Free: use the mcp-remote bridge.",
    docUrl: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
    blocks: [
      { label: "claude_desktop_config.json (bridge)", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://councilof.ai/mcp"]
    }
  }
}` },
      { label: "Pure stdio (no bridge)", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "command": "npx", "args": ["-y", "csoai-gspc-mcp"] }
  }
}` },
    ],
    note: "The JSON config file is stdio-only, so remote needs the mcp-remote bridge. On Pro/Max/Team/Enterprise you can instead add the URL natively under Settings → Connectors → Add custom connector.",
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "Drop into ~/.cursor/mcp.json (or project .cursor/mcp.json).",
    docUrl: "https://cursor.com/docs/context/mcp",
    blocks: [
      { label: "Remote", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "url": "https://councilof.ai/mcp" }
  }
}` },
      { label: "stdio", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "type": "stdio", "command": "npx", "args": ["-y", "csoai-gspc-mcp"] }
  }
}` },
    ],
    note: "Cursor auto-detects streamable-HTTP vs SSE from a bare url; no type field for remote.",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "~/.codeium/windsurf/mcp_config.json — uses serverUrl.",
    docUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
    blocks: [
      { label: "Remote", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "serverUrl": "https://councilof.ai/mcp" }
  }
}` },
      { label: "stdio", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "command": "npx", "args": ["-y", "csoai-gspc-mcp"] }
  }
}` },
    ],
    note: "serverUrl is Windsurf's canonical remote field (url also works).",
  },
  {
    id: "cline",
    name: "Cline",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "cline_mcp_settings.json — type is streamableHttp (camelCase).",
    docUrl: "https://docs.cline.bot/mcp/mcp-overview",
    blocks: [
      { label: "Remote", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": {
      "type": "streamableHttp",
      "url": "https://councilof.ai/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}` },
      { label: "stdio", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "command": "npx", "args": ["-y", "csoai-gspc-mcp"], "disabled": false, "autoApprove": [] }
  }
}` },
    ],
    note: 'The type MUST be "streamableHttp" (camelCase, no hyphen) or Cline falls back to SSE.',
  },
  {
    id: "zed",
    name: "Zed",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "settings.json — key is context_servers (not mcpServers).",
    docUrl: "https://zed.dev/docs/ai/mcp",
    blocks: [
      { label: "Remote", lang: "json", code: `{
  "context_servers": {
    "csoai-gspc": { "url": "https://councilof.ai/mcp" }
  }
}` },
      { label: "stdio", lang: "json", code: `{
  "context_servers": {
    "csoai-gspc": { "command": "npx", "args": ["-y", "csoai-gspc-mcp"], "env": {} }
  }
}` },
    ],
    note: "Zed uses context_servers, not mcpServers. Native remote via url; OAuth runs only if a server needs auth (ours does not).",
  },
  {
    id: "continue",
    name: "Continue",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "config.yaml — mcpServers is a YAML list; type is streamable-http (hyphen).",
    docUrl: "https://docs.continue.dev/customize/deep-dives/mcp",
    blocks: [
      { label: "Remote", lang: "yaml", code: `mcpServers:
  - name: csoai-gspc
    type: streamable-http
    url: https://councilof.ai/mcp` },
      { label: "stdio", lang: "yaml", code: `mcpServers:
  - name: csoai-gspc
    type: stdio
    command: npx
    args:
      - "-y"
      - "csoai-gspc-mcp"` },
    ],
    note: "Continue's mcpServers is an array of objects with a name field; remote type is hyphenated streamable-http.",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    kind: "mcp",
    verified: true,
    gate: "live",
    tagline: "~/.gemini/settings.json — uses httpUrl for streamable-HTTP.",
    docUrl: "https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md",
    blocks: [
      { label: "Remote", lang: "json", code: `{
  "mcpServers": {
    "councilof": { "httpUrl": "https://councilof.ai/mcp" }
  }
}` },
      { label: "stdio", lang: "json", code: `{
  "mcpServers": {
    "councilof": { "command": "npx", "args": ["-y", "csoai-gspc-mcp"] }
  }
}` },
    ],
    note: "Gemini CLI: httpUrl = Streamable HTTP, url = SSE. Free / open-source.",
  },
];

// ── Non-MCP-native / partial-MCP platforms ─────────────────────────────────────
export const NON_MCP: PlatformCard[] = [
  {
    id: "chatgpt-connector",
    name: "ChatGPT — MCP connector",
    kind: "connector",
    verified: true,
    gate: "paid",
    tagline: "Developer mode custom connector. Read-only, so any Plus/Pro user can self-serve.",
    docUrl: "https://help.openai.com/en/articles/11487775-connectors-in-chatgpt",
    blocks: [
      { label: "Steps", lang: "text", code: `Settings → Apps → Advanced → enable Developer mode
→ Create app → paste server URL:
https://councilof.ai/mcp` },
    ],
    note: "Requires a paid tier (Plus minimum) with Developer mode on. Our server is read-only, so the Plus/Pro fetch-only limit does not restrict it.",
  },
  {
    id: "chatgpt-gpt",
    name: "ChatGPT — Custom GPT Action",
    kind: "action",
    verified: true,
    gate: "paid",
    tagline: "Import the OpenAPI 3.1 spec as an Action. Auth: None.",
    docUrl: "https://developers.openai.com/api/docs/actions/getting-started",
    blocks: [
      { label: "In the GPT editor → Actions → Import", lang: "text", code: `Schema URL:
https://councilof.ai/openapi/gspc.json

Authentication: None` },
    ],
    note: "OpenAPI 3.1, servers[] + unique operationId are required (both present in our spec). Public GPT-Store listing additionally needs a privacy-policy URL + builder domain verification; a private/link-shared GPT does not.",
  },
  {
    id: "openai-api",
    name: "OpenAI API",
    kind: "fn",
    verified: true,
    gate: "live",
    tagline: "Responses API can call our MCP server directly — no OpenAPI needed.",
    docUrl: "https://developers.openai.com/api/docs/guides/tools-connectors-mcp",
    blocks: [
      { label: "Responses API tool (server-side MCP)", lang: "json", code: `{
  "type": "mcp",
  "server_label": "councilof",
  "server_url": "https://councilof.ai/mcp",
  "require_approval": "never",
  "allowed_tools": ["board_totals","get_axis","verify_card","list_cards","get_root","get_card","verify_inclusion"]
}` },
      { label: "Or a plain function tool", lang: "json", code: `{
  "type": "function",
  "function": {
    "name": "gspc_get_board",
    "description": "Fetch the live Council of AI GSPC board (totals + axes).",
    "parameters": { "type": "object", "properties": {}, "required": [] }
  }
}` },
    ],
    note: "For plain function tools your code calls GET https://councilof.ai/api/gspc. Canonical tool defs: /openapi/gspc-function-tools.json.",
  },
  {
    id: "gemini-api",
    name: "Google Gemini API",
    kind: "fn",
    verified: true,
    gate: "live",
    tagline: "Function declaration; your code calls GET /api/gspc.",
    docUrl: "https://ai.google.dev/gemini-api/docs/function-calling",
    blocks: [
      { label: "Function declaration", lang: "json", code: `{
  "name": "gspc_get_board",
  "description": "Fetch the live GSPC board (totals + axes). Optional axis returns one row.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "axis": { "type": "STRING", "description": "Optional axis name, e.g. governance." }
    }
  }
}` },
    ],
    note: "Gemini parameters is an OpenAPI-schema subset (strip $ref/oneOf). Canonical decls: /openapi/gspc-function-tools.json (gemini_function_declarations).",
  },
  {
    id: "grok",
    name: "Grok Build (xAI)",
    kind: "mcp",
    verified: false,
    gate: "live",
    tagline: "Plugin Marketplace + MCP (launched Jun 2026). Auto-reads Claude Code MCP config.",
    docUrl: "https://docs.x.ai/build/features/skills-plugins-marketplaces",
    blocks: [
      { label: "~/.grok/ mcpServers (mirror Claude Code — UNVERIFIED shape)", lang: "json", code: `{
  "mcpServers": {
    "csoai-gspc": { "type": "http", "url": "https://councilof.ai/mcp" }
  }
}` },
    ],
    note: "UNVERIFIED: Grok Build supports MCP and auto-reads Claude Code marketplaces/MCPs, but the exact ~/.grok TOML/JSON key is not shown in docs. The xAI API itself is OpenAI-compatible (function tools), but does not connect to your MCP server-side — use the function-tool path for the API.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    kind: "connector",
    verified: true,
    gate: "paid",
    tagline: "Custom Remote Connector — pick 'open authentication', paste the URL.",
    docUrl: "https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors",
    blocks: [
      { label: "Settings → Connectors → Add custom", lang: "text", code: `Remote MCP URL:  https://councilof.ai/mcp
Authentication:  open authentication (no auth)` },
    ],
    note: "Requires Pro/Max/Enterprise + Developer Mode (beta). The developer Agent API can also connect MCP servers; the exact request shape for an external MCP is unverified.",
  },
  {
    id: "universal",
    name: "Any other tool-calling AI",
    kind: "fn",
    verified: true,
    gate: "live",
    tagline: "One canonical OpenAPI 3.1 spec + function-tool defs. Read-only, no key.",
    docUrl: "https://councilof.ai/openapi/gspc.json",
    blocks: [
      { label: "OpenAPI 3.1 (for Action-style importers)", lang: "text", code: "https://councilof.ai/openapi/gspc.json" },
      { label: "Function-tool defs (OpenAI / xAI / Gemini)", lang: "text", code: "https://councilof.ai/openapi/gspc-function-tools.json" },
      { label: "Raw endpoints", lang: "text", code: `GET https://councilof.ai/api/gspc          # live board
GET https://councilof.ai/api/gspc?axis=governance
GET https://councilof.ai/api/cards         # signed-card index` },
    ],
    note: "Byte-exact Ed25519 card verification stays client-side (open /gspc-verify) or via the MCP verify_card tool — nothing you check is ever uploaded.",
  },
];

// ── Where GSPC is listed (registries / directories) ────────────────────────────
export interface RegistryRow {
  name: string;
  status: "listed" | "submitted" | "staged";
  permissionless: boolean;
  where: string; // link or identifier
  note: string;
}

export const REGISTRIES: RegistryRow[] = [
  { name: "Official MCP Registry", status: "listed", permissionless: true, where: "io.github.CSOAI-ORG/gspc", note: "Live, v1.1.0, via mcp-publisher. Downstream aggregators ingest from here." },
  { name: "A2A agent directories", status: "staged", permissionless: true, where: "/.well-known/agent-card.json", note: "Our A2A agent card is live; registration by well-known URI." },
  { name: "Smithery", status: "staged", permissionless: true, where: "smithery.ai/new", note: "Submit the HTTPS URL; auto-scans tools. Rich tool descriptions raise placement." },
  { name: "mcp.so", status: "staged", permissionless: true, where: "mcp.so/submit", note: "Submit the public repo; saving auto-publishes." },
  { name: "awesome-mcp-servers", status: "staged", permissionless: true, where: "punkpeye/awesome-mcp-servers", note: "One README line, alphabetical; 🤖🤖🤖 in the PR title fast-tracks the merge." },
  { name: "Glama", status: "staged", permissionless: true, where: "glama.ai/mcp", note: "Claim via GitHub / glama.json. Search visibility follows the Tool-Definition-Quality score." },
  { name: "PulseMCP", status: "staged", permissionless: true, where: "pulsemcp.com", note: "Ingests the official registry automatically; a submit form also exists." },
  { name: "cursor.directory", status: "staged", permissionless: false, where: "cursor.directory/plugins/new", note: "Reviewed listing; auto-detects via a repo .mcp.json." },
  { name: "Docker MCP Catalog", status: "staged", permissionless: false, where: "docker/mcp-registry", note: "PR (server.yaml + tools.json + readme.md) with Docker-team review." },
];
