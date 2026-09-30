#!/usr/bin/env node
/**
 * harness-x render — Layer 0, generated into every platform's format from ONE source.
 *
 * Sources (read, never written, except the two well-known files' DERIVED fields):
 *   council-os/distribution.json   targets, identity, pinned doctrine hash
 *   council-os/capabilities.json   the MCP tools (kind mcp_tool), their order and payment
 *   mcp/gspc-server/server.json    the remote server version and the npm stdio version
 *   docs/DOCTRINE.md               verified against distribution.json doctrine.sha256
 *   scripts/spray/pypi/csoai-gspc  the Python client version and the Apache-2.0 LICENSE text
 *
 * Outputs: distribution/** (committed, so every artifact is reviewable), distribution/MANIFEST.json
 * (path → sha256, per-target doctrine carriers), and the derived fields of
 * public/.well-known/mcp/server-card.json and public/.well-known/mcp.json.
 *
 * Deterministic: no clock, no network, no randomness. Rendering twice is byte-identical.
 * Every count is the length of an array computed here. Nothing is published.
 *
 *   node scripts/harness-x/render.mjs                 write
 *   node scripts/harness-x/render.mjs --check         exit 1 if any committed output differs
 *   node scripts/harness-x/render.mjs --pin-doctrine  re-pin doctrine text + sha256 (deliberate)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const PIN = args.includes("--pin-doctrine");

const read = (rel) => readFileSync(join(REPO, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const j = (o) => JSON.stringify(o, null, 2) + "\n";

// ── sources ─────────────────────────────────────────────────────────────────────────────────
const DIST_PATH = "council-os/distribution.json";
const dist = readJson(DIST_PATH);
const doctrineText = read(dist.doctrine.source);
const doctrineSha = sha256(doctrineText);

if (PIN) {
  dist.doctrine.sha256 = doctrineSha;
  dist.doctrine.text = doctrineText;
  writeFileSync(join(REPO, DIST_PATH), j(dist));
  console.log(`harness-x render: doctrine re-pinned ${doctrineSha} (${doctrineText.length} B from ${dist.doctrine.source})`);
  process.exit(0);
}
if (dist.doctrine.sha256 !== doctrineSha || dist.doctrine.text !== doctrineText) {
  console.error(
    `harness-x render: REFUSED — ${dist.doctrine.source} hashes to ${doctrineSha}, pinned ${dist.doctrine.sha256 || "(none)"}.\n` +
    "  The doctrine changed (or was never pinned). Review it, then: node scripts/harness-x/render.mjs --pin-doctrine");
  process.exit(2);
}
const DOCTRINE = { sha256: doctrineSha, source: dist.doctrine.source, human_page: dist.doctrine.human_page };

const caps = readJson("council-os/capabilities.json").capabilities;
const tools = caps.filter((c) => c.kind === "mcp_tool").slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const free = tools.filter((t) => t.payment === "free");
const paid = tools.filter((t) => t.payment !== "free");
const toolNames = tools.map((t) => t.id);

const mcpServer = readJson("mcp/gspc-server/server.json");
const REMOTE_VERSION = mcpServer.version;
const npmPkg = (mcpServer.packages || []).find((p) => p.registryType === "npm");
const NPM_ID = npmPkg.identifier;
const NPM_VERSION = npmPkg.version;
const pyClientVersion = /^version\s*=\s*"([^"]+)"/m.exec(read("scripts/spray/pypi/csoai-gspc/pyproject.toml"))[1];
const APACHE = read("scripts/spray/pypi/csoai-gspc/LICENSE");
const layer0Version = readJson("packages/layer0-js/package.json").version;
const ID = dist.identity;
const AV = dist.adapter_version;
const PLUGIN = dist.plugin_name;

// First sentence, after the "PAID (…)." label the paid tools lead with (payment is stated separately).
const firstSentence = (s) => {
  s = s.replace(/^PAID \([^)]*\)\.\s*/, "");
  const m = /^(.+?[.!?])(\s|$)/.exec(s);
  return (m ? m[1] : s).trim();
};
const countWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const word = (n) => countWords[n] ?? String(n);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// One line reused everywhere a fleet is described; the numbers are array lengths.
const FLEET = `${tools.length} tools (${free.length} free, ${paid.length} x402-metered)`;
const STANCE = "Measurement only: a card is evidence, never a grade, mark or endorsement. Verification is free.";
// Every README-like output points at the data, the corrections ledger and free verification.
// check.mjs requires it offline; parity_live.py requires it of every LIVE copy.
const LINKS = `Data: ${ID.board} · Corrections ledger: ${ID.corrections} (JSON: ${ID.corrections_api}) · Verify a card, free: ${ID.verify_page}`;

// ── emit ────────────────────────────────────────────────────────────────────────────────────
const outputs = new Map(); // rel → text
const emit = (rel, text) => {
  if (outputs.has(rel)) throw new Error(`duplicate output ${rel}`);
  outputs.set(rel, text);
};

// ── 1. MCP Registry server.json, both namespaces ─────────────────────────────────────────────
const regMeta = {
  "io.modelcontextprotocol.registry/publisher-provided": {
    "ai.councilof/doctrine": DOCTRINE,
    "ai.councilof/fleet": { free: free.map((t) => t.id), paid: paid.map((t) => t.id) },
    "ai.councilof/generator": "scripts/harness-x/render.mjs from council-os/distribution.json",
  },
};
const regDescription = `${FLEET}: GSPC board, evidence, Ed25519 card verify. Measurement only.`;
if (regDescription.length > 100) throw new Error(`registry description is ${regDescription.length} chars; the 2025-12-11 schema allows 100`);
emit("distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json", j({
  $schema: mcpServer.$schema,
  name: dist.registry_names.github,
  title: ID.short_name,
  description: regDescription,
  repository: mcpServer.repository,
  version: REMOTE_VERSION,
  websiteUrl: ID.website,
  remotes: [{ type: "streamable-http", url: ID.door }],
  packages: [{ registryType: "npm", identifier: NPM_ID, version: NPM_VERSION, transport: { type: "stdio" } }],
  _meta: regMeta,
}));
// The domain name's remote is the door with a trailing slash: the bare URL is registered under the
// io.github name and the registry refuses one remote URL under two names (distribution.json explains).
const domainRow = dist.distribution.find((r) => r.id === "mcp-registry-domain") || {};
const DOMAIN_REMOTE = domainRow.remote_url || ID.door;
if (DOMAIN_REMOTE.replace(/\/$/, "") !== ID.door) throw new Error(`mcp-registry-domain remote_url ${DOMAIN_REMOTE} is not the door ${ID.door}`);
emit("distribution/mcp-registry/ai.councilof-gspc/server.json", j({
  $schema: mcpServer.$schema,
  name: dist.registry_names.domain,
  title: ID.short_name,
  description: regDescription,
  version: REMOTE_VERSION,
  websiteUrl: ID.website,
  remotes: [{ type: "streamable-http", url: DOMAIN_REMOTE }],
  _meta: regMeta,
}));

// ── 2. One plugin manifest, three platform flavours ─────────────────────────────────────────
const pluginCore = {
  name: PLUGIN,
  version: REMOTE_VERSION,
  description: `Council of AI GSPC over MCP: ${FLEET}. Read the live board, verify signed measurement cards (VALID / INVALID / UNCHECKABLE). ${STANCE}`,
  author: { name: ID.publisher, email: ID.email, url: ID.website },
  homepage: ID.website,
  license: "Apache-2.0",
  keywords: ["gspc", "csoai", "layer0", "measurement", "mcp", "ed25519", "provenance"],
};
emit("distribution/plugin/.mcp.json", j({ mcpServers: { [PLUGIN]: { type: "http", url: ID.door } } }));
emit("distribution/plugin/.claude-plugin/plugin.json", j({ ...pluginCore, mcpServers: "./.mcp.json" }));
const claudeMarketplace = j({
  name: "council-of-ai",
  owner: { name: ID.publisher, email: ID.email },
  metadata: { description: "Council of AI — Layer 0 measurement tools.", version: REMOTE_VERSION },
  plugins: [{ name: PLUGIN, source: "./", description: pluginCore.description, version: REMOTE_VERSION, license: "Apache-2.0", homepage: ID.website }],
});
emit("distribution/plugin/.claude-plugin/marketplace.json", claudeMarketplace);
// The same bytes, served at https://councilof.ai/.claude-plugin/marketplace.json (ONE-PRODUCT-PLAN lane 2).
// Its plugin source is "./", which resolves only when the marketplace is added from a git host;
// until a public one carries distribution/plugin, the working install is the free MCP door.
emit("public/.claude-plugin/marketplace.json", claudeMarketplace);
emit("distribution/plugin/.cursor-plugin/plugin.json", j({
  ...pluginCore,
  mcpServers: "./.mcp.json",
  skills: "./skills/",
  "x-csoai-doctrine": DOCTRINE,
}));
emit("distribution/plugin/.grok-plugin/marketplace.json", j({
  name: "Council of AI",
  description: `GSPC measurement plugin. ${FLEET}.`,
  owner: { name: ID.publisher, url: ID.website },
  metadata: { doctrine: DOCTRINE, version: REMOTE_VERSION },
  plugins: [{ name: PLUGIN, description: pluginCore.description, source: { type: "local", path: "./" }, homepage: ID.website, keywords: pluginCore.keywords }],
}));
const toolLines = (list) => list.map((t) => `- \`${t.id}\` — ${firstSentence(t.description)}`).join("\n");
const doctrineFooter = (indent = "") =>
  `${indent}Doctrine: \`${DOCTRINE.source}\` sha256 \`${DOCTRINE.sha256}\` (human page ${DOCTRINE.human_page}).`;
emit("distribution/plugin/skills/gspc/SKILL.md", `---
name: gspc
description: Read the Council of AI GSPC board and verify signed measurement cards through the gspc MCP server. Use when asked about GSPC, Council of AI, a measurement card, or an AI-governance measurement.
---

# GSPC (Council of AI, Layer 0)

The \`${PLUGIN}\` MCP server (${ID.door}) exposes ${FLEET}.

Free:
${toolLines(free)}

x402-metered (call without \`x_payment\` to see the challenge; a challenge is not a payment):
${toolLines(paid)}

Rules for answers:
1. Quote \`totals.public_count\` from \`board_totals\` verbatim. Never add, re-derive or round a count.
2. Verification has three states — VALID, INVALID, UNCHECKABLE. "Could not check" is never "forged".
3. UNMEASURED and UNREACHABLE are answers, not errors. Never fill an empty cell.
4. ${STANCE}

${LINKS}

${doctrineFooter()}
`);
emit("distribution/plugin/README.md", `# ${PLUGIN} — Council of AI plugin (Claude Code, Cursor, Grok)

One plugin, three manifests, generated by \`scripts/harness-x/render.mjs\` from \`council-os/distribution.json\`:

| Platform | Manifest |
|---|---|
| Claude Code | \`.claude-plugin/plugin.json\` + \`.claude-plugin/marketplace.json\` |
| Cursor | \`.cursor-plugin/plugin.json\` |
| Grok | \`.grok-plugin/marketplace.json\` |

All three point at the same remote MCP server (\`.mcp.json\` → ${ID.door}, streamable HTTP, no key)
and ship the same skill (\`skills/gspc/SKILL.md\`). Server version ${REMOTE_VERSION}; ${FLEET}.

${STANCE}

${LINKS}

Licence: Apache-2.0. ${doctrineFooter()}
`);

// ── 3. Claude connectors directory ──────────────────────────────────────────────────────────
// The directory listing points at the FREE door (${ID.door}/free), never at ${ID.door}: Anthropic
// Software Directory Policy 4.A excludes software that transfers money or crypto unless Anthropic
// permits it in writing, and the metered tools settle USDC. functions/mcp/[[path]].ts serves the free
// door from the same definitions, filtered; its tools are exactly the `free` capabilities here.
const FREE_DOOR = `${ID.door}/free`;
const connectorTools = free.map((t) => ({ name: t.id, payment: t.payment, read_only: true }));
emit("distribution/claude/connector.json", j({
  form: "Claude connectors directory — remote MCP server",
  status: "PREPARED — NOT SUBMITTED",
  name: ID.short_name,
  server_url: FREE_DOOR,
  transport: "streamable-http",
  authentication: "none",
  description: `Council of AI's ${word(free.length)} free read-only tools over the public GSPC board: read totals and axis rows, retrieve and verify Ed25519-signed measurement cards and capsules. No payment tool is served at this address. ${STANCE}`,
  company: { name: ID.publisher, company_number: ID.company_number, jurisdiction: ID.jurisdiction, website: ID.website },
  contact_email: ID.email,
  documentation_url: `${ID.website}/connect/claude/`,
  privacy_policy_url: ID.privacy,
  terms_url: ID.terms,
  support_url: ID.support,
  icon_url: ID.icon,
  server_version: REMOTE_VERSION,
  tools: connectorTools,
  tool_count: connectorTools.length,
  example_prompts: [
    "What does the Council of AI measurement board show right now? How many axes are measured?",
    "Show me the Council of AI safety axis: sample size, accuracy and interval.",
    "Verify this Council of AI signed measurement card: https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json",
    "Has Council of AI published any measurements about the MCP server at https://councilof.ai/mcp? What was checked?",
    "In Council of AI's latest census of public MCP servers, how many answered a correct handshake?",
  ],
  doctrine: DOCTRINE,
}));

// ── 4. Gemini CLI extension ─────────────────────────────────────────────────────────────────
emit("distribution/gemini/gemini-extension.json", j({
  name: `csoai-${PLUGIN}`,
  version: REMOTE_VERSION,
  description: pluginCore.description,
  contextFileName: "GEMINI.md",
  mcpServers: { [PLUGIN]: { httpUrl: ID.door, timeout: 30000 } },
}));
emit("distribution/gemini/GEMINI.md", `# Council of AI GSPC (Layer 0)

The \`${PLUGIN}\` MCP server (${ID.door}, server ${REMOTE_VERSION}) exposes ${FLEET}.

Free:
${toolLines(free)}

x402-metered:
${toolLines(paid)}

When you answer from these tools:
1. Quote \`totals.public_count\` verbatim. Never add, re-derive or round a count.
2. Card verification has three states — VALID, INVALID, UNCHECKABLE. "Could not check" is never "forged".
3. UNMEASURED and UNREACHABLE are first-class answers. Never fill an empty cell.
4. ${STANCE}

${LINKS}

${doctrineFooter()}
`);

// ── 5. OpenAI app (Apps SDK submission values) from the existing well-known files ───────────
const openaiSources = ["openai.json", "openai-tools.json", "openai-functions.json", "openai-responses.json",
  "openai-assistants.json", "openai-structured-outputs.json"]
  .map((f) => `public/.well-known/${f}`)
  .filter((rel) => existsSync(join(REPO, rel)))
  .map((rel) => ({ path: rel, sha256: sha256(read(rel)), slug: readJson(rel).slug }));
const openaiLinks = readJson("public/.well-known/openai.json").links || {};
emit("distribution/openai/app.json", j({
  form: "OpenAI Apps SDK — app submission (remote MCP connector)",
  status: "PREPARED — NOT SUBMITTED",
  app_name: ID.short_name,
  mcp_server_url: ID.door,
  authentication: "none",
  description: `Read the live GSPC measurement board and verify Ed25519-signed measurement cards. ${STANCE}`,
  developer: { name: ID.publisher, website: ID.website, email: ID.email },
  privacy_policy_url: ID.privacy,
  terms_url: ID.terms,
  support_url: ID.support,
  logo_url: ID.icon,
  server_version: REMOTE_VERSION,
  tools: tools.map((t) => ({ name: t.id, payment: t.payment, suggested_annotations: { readOnlyHint: t.payment === "free", openWorldHint: true, destructiveHint: false } })),
  tool_count: tools.length,
  live_tools_carry_annotations: false,
  test_prompts: [
    { prompt: "What does the GSPC board say right now?", expected_tool: "board_totals" },
    { prompt: "Verify this measurement card: <card JSON>", expected_tool: "verify_card" },
    { prompt: "Show the GSPC provenance axis.", expected_tool: "get_axis" },
  ],
  custom_gpt_actions: { import_url: ID.openapi_actions, authentication: "none" },
  links: openaiLinks,
  derived_from_well_known: openaiSources,
  doctrine: DOCTRINE,
}));

// ── 6. Python adapters over csoai-gspc ──────────────────────────────────────────────────────
const PY_TOOL_DESC =
  `Read the live Council of AI GSPC board (${ID.board}). With no axis, returns the board totals verbatim; ` +
  "with an axis name, returns that one axis row. Quote totals.public_count exactly as printed; never add or re-derive a count. " +
  "If the board cannot be fetched the state is UNREACHABLE and no number is returned. " + STANCE;
// VERIFICATION IS THE CORE PROMISE AND IT IS FREE (2026-09-26): until then every adapter exposed
// gspc_board alone and told the reader to go and call csoai_gspc.verify_card themselves.
const PY_VERIFY_DESC =
  "Verify one Council of AI signed measurement card — free, always. Pass card_id (the card's full 64-hex id; " +
  "it is fetched from https://councilof.ai/signed/cards/<id>.json) or card (the card JSON). Returns VALID (the body " +
  "reproduces its id and the Ed25519 signature verifies under the pinned did:web:csoai.org#card-attestation-1 key), " +
  "INVALID with the reason, or UNCHECKABLE (the check could not complete — never read that as forged). " + STANCE;
const pyBoard = `"""Shared reader: the live GSPC board and free card verification through csoai-gspc. Generated by scripts/harness-x/render.mjs."""
from __future__ import annotations

import json
from typing import Optional, Union

from csoai_gspc import BOARD_URL, fetch_board, fetch_card, get_axis, totals
from csoai_gspc import verify_card as _verify_card

DOCTRINE_SHA256 = "${DOCTRINE.sha256}"
DOCTRINE_SOURCE = "${DOCTRINE.source}"
TOOL_NAME = "gspc_board"
TOOL_DESCRIPTION = ${JSON.stringify(PY_TOOL_DESC)}
VERIFY_TOOL_NAME = "verify_card"
VERIFY_TOOL_DESCRIPTION = ${JSON.stringify(PY_VERIFY_DESC)}
RULE_URL = "https://councilof.ai/signed/HOW-TO-VERIFY.md"


def read_board(axis: Optional[str] = None) -> dict:
    """Return the live board totals, or one axis row. Three outcomes: LIVE, ABSENT, UNREACHABLE."""
    base = {"source": BOARD_URL, "doctrine_sha256": DOCTRINE_SHA256}
    try:
        board = fetch_board()
    except Exception as exc:  # network, HTTP or JSON failure: say so, never substitute a number
        return {**base, "state": "UNREACHABLE", "error": type(exc).__name__}
    if axis is None:
        return {**base, "state": "LIVE", "totals": totals(board)}
    row = get_axis(axis, board)
    if row is None:
        return {**base, "state": "ABSENT", "axis": axis}
    return {**base, "state": "LIVE", "axis_row": row}


def read_verify(card_id: Optional[str] = None, card: Optional[Union[dict, str]] = None) -> dict:
    """Verify one signed card. Three outcomes only: VALID, INVALID (with the reason), UNCHECKABLE."""
    base = {"rule": RULE_URL, "doctrine_sha256": DOCTRINE_SHA256}
    try:
        if card is not None:
            obj = json.loads(card) if isinstance(card, str) else card
        elif card_id:
            obj = fetch_card(card_id)  # ValueError for anything but a full 64-hex id, before any network
        else:
            return {**base, "state": "UNCHECKABLE", "reason": "pass card_id (64 hex) or card (the card JSON)"}
    except ValueError as exc:  # a malformed id or card JSON: could not check, did not fail
        return {**base, "state": "UNCHECKABLE", "reason": str(exc)}
    except Exception as exc:  # network, HTTP: could not check — never a verdict
        return {**base, "state": "UNCHECKABLE", "reason": f"could not fetch the card: {type(exc).__name__}"}
    if not isinstance(obj, dict):
        return {**base, "state": "UNCHECKABLE", "reason": "the card is not a JSON object"}
    v = _verify_card(obj)  # pins did:web:csoai.org#card-attestation-1 from the published DID document
    return {**base, "state": v.state, "reason": v.reason, "card_id": v.card_id}
`;
const pyInput = `class GSPCBoardInput(BaseModel):
    axis: Optional[str] = Field(default=None, description="Axis name or alias (case-insensitive, e.g. governance or gov) for one board row; omit for the board totals.")


class VerifyCardInput(BaseModel):
    card_id: Optional[str] = Field(default=None, description="The card's full id: 64 hex characters.")
    card: Optional[Union[dict, str]] = Field(default=None, description="Alternatively the card JSON (object or string).")
`;
const pyProject = ({ name, desc, deps, pkgs, kw, py = "3.9" }) => `[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "${name}"
version = "${AV}"
description = ${JSON.stringify(desc)}
readme = "README.md"
requires-python = ">=${py}"
license = { text = "Apache-2.0" }
authors = [{ name = "${ID.publisher}", email = "${ID.email}" }]
keywords = [${["csoai", "gspc", "layer0", "measurement", ...kw].map((k) => JSON.stringify(k)).join(", ")}]
classifiers = [
  "License :: OSI Approved :: Apache Software License",
  "Programming Language :: Python :: 3",
  "Topic :: Scientific/Engineering :: Artificial Intelligence",
]
dependencies = [${[`csoai-gspc>=${pyClientVersion}`, ...deps].map((d) => JSON.stringify(d)).join(", ")}]

[project.urls]
Homepage = "${ID.website}"
Board = "${ID.board}"
Doctrine = "${DOCTRINE.human_page}"

[tool.setuptools]
packages = [${pkgs.map((p) => JSON.stringify(p)).join(", ")}]

# doctrine-sha256 = "${DOCTRINE.sha256}"  (${DOCTRINE.source})
`;
const pyReadme = ({ name, title, usage }) => `# ${name}

${title} — a thin wrapper over [\`csoai-gspc\`](https://pypi.org/project/csoai-gspc/) (${pyClientVersion}+), the
reader for Council of AI's live GSPC board (${ID.board}). Two tools: \`gspc_board\` (the live board) and
\`verify_card\` (free signed-card verification — VALID / INVALID / UNCHECKABLE).

\`\`\`python
${usage}
\`\`\`

\`gspc_board\` returns one of three states: \`LIVE\` (totals or the axis row, verbatim from the board),
\`ABSENT\` (no axis by that name or alias), \`UNREACHABLE\` (the board could not be fetched — no cached or
invented number is ever returned). ${STANCE}

\`verify_card\` takes \`card_id\` (the full 64-hex id) or \`card\` (the JSON) and returns \`VALID\`,
\`INVALID\` with the reason, or \`UNCHECKABLE\` — "could not check" is never "forged". It is free, always.
The same verdicts are served by the remote MCP server at ${ID.door}.

${LINKS}

Licence: Apache-2.0. ${doctrineFooter()}
Generated by \`scripts/harness-x/render.mjs\` — do not hand-edit.
`;
// langchain-csoai
emit("distribution/python/langchain-csoai/pyproject.toml", pyProject({
  name: "langchain-csoai", desc: "LangChain tool for the Council of AI GSPC measurement board (wraps csoai-gspc).",
  deps: ["langchain-core>=0.3"], pkgs: ["langchain_csoai"], kw: ["langchain"],
}));
emit("distribution/python/langchain-csoai/README.md", pyReadme({
  name: "langchain-csoai", title: "LangChain tool for the Council of AI GSPC board",
  usage: "from langchain_csoai import GSPCBoardTool, VerifyCardTool\n\ntool = GSPCBoardTool()\nprint(tool.invoke({}))                    # board totals\nprint(tool.invoke({\"axis\": \"provenance\"}))  # one axis row\nprint(VerifyCardTool().invoke({\"card_id\": \"acf6bf0356123632758bf6c98c83d81c7a8392c3b111b311317c516cc65133a4\"}))  # free: VALID / INVALID / UNCHECKABLE",
}));
emit("distribution/python/langchain-csoai/LICENSE", APACHE);
emit("distribution/python/langchain-csoai/langchain_csoai/_board.py", pyBoard);
emit("distribution/python/langchain-csoai/langchain_csoai/tools.py", `"""LangChain BaseTool for the GSPC board. Generated by scripts/harness-x/render.mjs."""
from __future__ import annotations

from typing import Optional, Type, Union

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from ._board import TOOL_DESCRIPTION, TOOL_NAME, VERIFY_TOOL_DESCRIPTION, VERIFY_TOOL_NAME, read_board, read_verify


${pyInput}

class GSPCBoardTool(BaseTool):
    name: str = TOOL_NAME
    description: str = TOOL_DESCRIPTION
    args_schema: Type[BaseModel] = GSPCBoardInput

    def _run(self, axis: Optional[str] = None, run_manager=None) -> dict:  # noqa: ARG002
        return read_board(axis)


class VerifyCardTool(BaseTool):
    name: str = VERIFY_TOOL_NAME
    description: str = VERIFY_TOOL_DESCRIPTION
    args_schema: Type[BaseModel] = VerifyCardInput

    def _run(self, card_id: Optional[str] = None, card: Optional[Union[dict, str]] = None, run_manager=None) -> dict:  # noqa: ARG002
        return read_verify(card_id, card)
`);
emit("distribution/python/langchain-csoai/langchain_csoai/__init__.py", `"""langchain-csoai — LangChain tool for the Council of AI GSPC board."""
from ._board import DOCTRINE_SHA256, read_board, read_verify
from .tools import GSPCBoardInput, GSPCBoardTool, VerifyCardInput, VerifyCardTool

__version__ = "${AV}"
__all__ = ["GSPCBoardTool", "GSPCBoardInput", "VerifyCardTool", "VerifyCardInput", "read_board", "read_verify", "DOCTRINE_SHA256", "__version__"]
`);
// llama-index-tools-csoai
const LI = "distribution/python/llama-index-tools-csoai";
emit(`${LI}/pyproject.toml`, pyProject({
  name: "llama-index-tools-csoai", desc: "LlamaIndex tool spec for the Council of AI GSPC measurement board (wraps csoai-gspc).",
  deps: ["llama-index-core>=0.12"], pkgs: ["llama_index.tools.csoai"], kw: ["llama-index", "llamaindex"],
}));
emit(`${LI}/README.md`, pyReadme({
  name: "llama-index-tools-csoai", title: "LlamaIndex tool spec for the Council of AI GSPC board",
  usage: "from llama_index.tools.csoai import CSOAIGSPCToolSpec\n\ntools = CSOAIGSPCToolSpec().to_tool_list()  # gspc_board, verify_card\nprint(tools[0].call())  # board totals\nprint(tools[1].call(card_id=\"acf6bf0356123632758bf6c98c83d81c7a8392c3b111b311317c516cc65133a4\"))  # free verification",
}));
emit(`${LI}/LICENSE`, APACHE);
emit(`${LI}/llama_index/tools/csoai/_board.py`, pyBoard);
emit(`${LI}/llama_index/tools/csoai/base.py`, `"""LlamaIndex tool spec for the GSPC board. Generated by scripts/harness-x/render.mjs."""
from __future__ import annotations

from typing import Optional

from llama_index.core.tools.tool_spec.base import BaseToolSpec

from ._board import TOOL_DESCRIPTION, VERIFY_TOOL_DESCRIPTION, read_board, read_verify


class CSOAIGSPCToolSpec(BaseToolSpec):
    spec_functions = ["gspc_board", "verify_card"]

    def gspc_board(self, axis: Optional[str] = None) -> dict:
        return read_board(axis)

    def verify_card(self, card_id: Optional[str] = None, card: Optional[dict] = None) -> dict:
        return read_verify(card_id, card)

    gspc_board.__doc__ = TOOL_DESCRIPTION
    verify_card.__doc__ = VERIFY_TOOL_DESCRIPTION
`);
emit(`${LI}/llama_index/tools/csoai/__init__.py`, `"""llama-index-tools-csoai — LlamaIndex tool spec for the Council of AI GSPC board."""
from ._board import DOCTRINE_SHA256, read_board, read_verify
from .base import CSOAIGSPCToolSpec

__version__ = "${AV}"
__all__ = ["CSOAIGSPCToolSpec", "read_board", "read_verify", "DOCTRINE_SHA256", "__version__"]
`);
// crewai-csoai
emit("distribution/python/crewai-csoai/pyproject.toml", pyProject({
  py: "3.10", // crewai itself requires Python >= 3.10
  name: "crewai-csoai", desc: "CrewAI tool for the Council of AI GSPC measurement board (wraps csoai-gspc).",
  deps: ["crewai>=0.100"], pkgs: ["crewai_csoai"], kw: ["crewai"],
}));
emit("distribution/python/crewai-csoai/README.md", pyReadme({
  name: "crewai-csoai", title: "CrewAI tool for the Council of AI GSPC board",
  usage: "from crewai import Agent\nfrom crewai_csoai import GSPCBoardTool, VerifyCardTool\n\nanalyst = Agent(role=\"Analyst\", goal=\"Quote the GSPC board and verify its cards\", backstory=\"...\", tools=[GSPCBoardTool(), VerifyCardTool()])",
}));
emit("distribution/python/crewai-csoai/LICENSE", APACHE);
emit("distribution/python/crewai-csoai/crewai_csoai/_board.py", pyBoard);
emit("distribution/python/crewai-csoai/crewai_csoai/tools.py", `"""CrewAI BaseTool for the GSPC board. Generated by scripts/harness-x/render.mjs."""
from __future__ import annotations

from typing import Optional, Type, Union

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from ._board import TOOL_DESCRIPTION, TOOL_NAME, VERIFY_TOOL_DESCRIPTION, VERIFY_TOOL_NAME, read_board, read_verify


${pyInput}

class GSPCBoardTool(BaseTool):
    name: str = TOOL_NAME
    description: str = TOOL_DESCRIPTION
    args_schema: Type[BaseModel] = GSPCBoardInput

    def _run(self, axis: Optional[str] = None) -> dict:
        return read_board(axis)


class VerifyCardTool(BaseTool):
    name: str = VERIFY_TOOL_NAME
    description: str = VERIFY_TOOL_DESCRIPTION
    args_schema: Type[BaseModel] = VerifyCardInput

    def _run(self, card_id: Optional[str] = None, card: Optional[Union[dict, str]] = None) -> dict:
        return read_verify(card_id, card)
`);
emit("distribution/python/crewai-csoai/crewai_csoai/__init__.py", `"""crewai-csoai — CrewAI tool for the Council of AI GSPC board."""
from ._board import DOCTRINE_SHA256, read_board, read_verify
from .tools import GSPCBoardInput, GSPCBoardTool, VerifyCardInput, VerifyCardTool

__version__ = "${AV}"
__all__ = ["GSPCBoardTool", "GSPCBoardInput", "VerifyCardTool", "VerifyCardInput", "read_board", "read_verify", "DOCTRINE_SHA256", "__version__"]
`);

// ── 7. TypeScript/ESM adapters (Vercel AI SDK, Mastra) over the /mcp door + @csoai/layer0 ───
const TS_DESC =
  "Live Council of AI GSPC board totals via the board_totals MCP tool. Quote public_count exactly as printed; never add or re-derive a count. " +
  "UNREACHABLE means the door could not be read and no number is returned. " + STANCE;
const gspcClient = `// Generated by scripts/harness-x/render.mjs — do not hand-edit.
// Minimal MCP-over-HTTP client for the Council of AI door. Zero dependencies.
// Optional: pass { layer0 } (an @csoai/layer0 Layer0 instance) to run each call through
// Layer0.governed() — gate, run, attest. Without it, the call goes straight to the door.

export const DOOR = ${JSON.stringify(ID.door)};
export const DOCTRINE_SHA256 = ${JSON.stringify(DOCTRINE.sha256)};
export const FREE_TOOLS = ${JSON.stringify(free.map((t) => t.id))};
export const PAID_TOOLS = ${JSON.stringify(paid.map((t) => t.id))};
export const TOOL_DESCRIPTION = ${JSON.stringify(TS_DESC)};

function parseRpc(text) {
  const t = text.trim();
  if (t.startsWith("{")) return JSON.parse(t);
  const data = t.split("\\n").filter((l) => l.startsWith("data:"));
  if (!data.length) throw new Error("no JSON-RPC message in response");
  return JSON.parse(data[data.length - 1].slice(5));
}

export async function callGspc(name, args = {}, { door = DOOR, layer0, fetchImpl = globalThis.fetch } = {}) {
  const run = async () => {
    let res;
    try {
      res = await fetchImpl(door, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      });
    } catch (e) {
      return { state: "UNREACHABLE", door, tool: name, error: String((e && e.name) || e), doctrine_sha256: DOCTRINE_SHA256 };
    }
    if (!res.ok) return { state: "UNREACHABLE", door, tool: name, http_status: res.status, doctrine_sha256: DOCTRINE_SHA256 };
    let msg;
    try { msg = parseRpc(await res.text()); } catch (e) {
      return { state: "UNREACHABLE", door, tool: name, error: "unparseable response", doctrine_sha256: DOCTRINE_SHA256 };
    }
    if (msg.error) return { state: "ERROR", door, tool: name, error: msg.error, doctrine_sha256: DOCTRINE_SHA256 };
    return { state: "LIVE", door, tool: name, result: msg.result, doctrine_sha256: DOCTRINE_SHA256 };
  };
  if (!layer0) return run();
  const { result, decision, attestation } = await layer0.governed(\`gspc.\${name}\`, args, run);
  return { ...result, layer0: { decision, attestation } };
}
`;
const tsDts = (extra) => `// Generated by scripts/harness-x/render.mjs — do not hand-edit.
export declare const DOOR: string;
export declare const DOCTRINE_SHA256: string;
export declare const FREE_TOOLS: string[];
export declare const PAID_TOOLS: string[];
export declare const TOOL_DESCRIPTION: string;
export interface GspcCallOptions { door?: string; layer0?: { governed: (...a: any[]) => Promise<any> }; fetchImpl?: typeof fetch; }
export declare function callGspc(name: string, args?: Record<string, unknown>, opts?: GspcCallOptions): Promise<Record<string, unknown>>;
${extra}`;
const tsPkg = ({ name, desc, peer, kw }) => j({
  name,
  version: AV,
  description: desc,
  type: "module",
  main: "index.js",
  types: "index.d.ts",
  exports: { ".": { types: "./index.d.ts", default: "./index.js" }, "./client": "./gspc-client.js" },
  files: ["index.js", "index.d.ts", "gspc-client.js", "README.md", "LICENSE"],
  engines: { node: ">=18" },
  peerDependencies: { ...peer, "@csoai/layer0": `>=${layer0Version}` },
  peerDependenciesMeta: { "@csoai/layer0": { optional: true } },
  keywords: ["csoai", "gspc", "layer0", "measurement", "mcp", ...kw],
  license: "Apache-2.0",
  homepage: ID.website,
  csoai: { doctrine: DOCTRINE, door: ID.door, generator: "scripts/harness-x/render.mjs" },
});
const tsReadme = ({ name, title, usage }) => `# ${name}

${title}. Calls the Council of AI MCP door (${ID.door}, ${FLEET}) directly over HTTP;
zero runtime dependencies beyond the framework peer. One tool: GSPC board totals.

\`\`\`js
${usage}
\`\`\`

Optional Layer 0 wrapping: pass \`{ layer0: new Layer0({...}) }\` from \`@csoai/layer0\` (${layer0Version}) and every call runs
through \`Layer0.governed()\` (gate → run → attest). \`@csoai/layer0\` is an optional peer and is not yet on npm.

States: \`LIVE\`, \`ERROR\` (the door answered with a JSON-RPC error), \`UNREACHABLE\` (no number is returned).
${STANCE}

${LINKS}

Licence: Apache-2.0. ${doctrineFooter()}
Generated by \`scripts/harness-x/render.mjs\` — do not hand-edit.
`;
// Vercel AI SDK
const AIS = "distribution/npm/ai-sdk-gspc";
emit(`${AIS}/gspc-client.js`, gspcClient);
emit(`${AIS}/index.js`, `// Generated by scripts/harness-x/render.mjs — do not hand-edit.
import { tool } from "ai";
import { z } from "zod";
import { callGspc, TOOL_DESCRIPTION } from "./gspc-client.js";

export * from "./gspc-client.js";

/** Vercel AI SDK (v5+) tool: live GSPC board totals. */
export function gspcBoardTotals(opts = {}) {
  return tool({
    description: TOOL_DESCRIPTION,
    inputSchema: z.object({}),
    execute: async () => callGspc("board_totals", {}, opts),
  });
}

export const gspcTools = (opts = {}) => ({ gspc_board_totals: gspcBoardTotals(opts) });
`);
emit(`${AIS}/index.d.ts`, tsDts(`export declare function gspcBoardTotals(opts?: GspcCallOptions): any;
export declare function gspcTools(opts?: GspcCallOptions): { gspc_board_totals: any };
`));
emit(`${AIS}/package.json`, tsPkg({ name: "@csoai/ai-sdk-gspc", desc: "Vercel AI SDK tool for the Council of AI GSPC measurement board.", peer: { ai: ">=5", zod: ">=3.23" }, kw: ["ai-sdk", "vercel"] }));
emit(`${AIS}/README.md`, tsReadme({
  name: "@csoai/ai-sdk-gspc", title: "Vercel AI SDK tool for the Council of AI GSPC board",
  usage: "import { generateText } from \"ai\";\nimport { gspcTools } from \"@csoai/ai-sdk-gspc\";\n\nconst { text } = await generateText({ model, tools: gspcTools(), prompt: \"What does the GSPC board say?\" });",
}));
emit(`${AIS}/LICENSE`, APACHE);
// Mastra
const MA = "distribution/npm/mastra-gspc";
emit(`${MA}/gspc-client.js`, gspcClient);
emit(`${MA}/index.js`, `// Generated by scripts/harness-x/render.mjs — do not hand-edit.
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callGspc, TOOL_DESCRIPTION } from "./gspc-client.js";

export * from "./gspc-client.js";

/** Mastra tool: live GSPC board totals. */
export function makeGspcBoardTotalsTool(opts = {}) {
  return createTool({
    id: "gspc-board-totals",
    description: TOOL_DESCRIPTION,
    inputSchema: z.object({}),
    execute: async () => callGspc("board_totals", {}, opts),
  });
}

export const gspcBoardTotalsTool = makeGspcBoardTotalsTool();
`);
emit(`${MA}/index.d.ts`, tsDts(`export declare function makeGspcBoardTotalsTool(opts?: GspcCallOptions): any;
export declare const gspcBoardTotalsTool: any;
`));
emit(`${MA}/package.json`, tsPkg({ name: "@csoai/mastra-gspc", desc: "Mastra tool for the Council of AI GSPC measurement board.", peer: { "@mastra/core": ">=0.10", zod: ">=3.23" }, kw: ["mastra"] }));
emit(`${MA}/README.md`, tsReadme({
  name: "@csoai/mastra-gspc", title: "Mastra tool for the Council of AI GSPC board",
  usage: "import { Agent } from \"@mastra/core/agent\";\nimport { gspcBoardTotalsTool } from \"@csoai/mastra-gspc\";\n\nconst agent = new Agent({ name: \"analyst\", instructions: \"Quote the GSPC board.\", model, tools: { gspcBoardTotalsTool } });",
}));
emit(`${MA}/LICENSE`, APACHE);

// ── 8. Docker MCP catalog entry ─────────────────────────────────────────────────────────────
const DK = "distribution/docker/servers/csoai-gspc";
const yq = (s) => JSON.stringify(s); // JSON strings are valid YAML double-quoted scalars
emit(`${DK}/server.yaml`, `# GENERATED by scripts/harness-x/render.mjs — NOT SUBMITTED.
# Copy servers/csoai-gspc/ into a fork of github.com/docker/mcp-registry; open the PR from the owner's public account.
# doctrine-sha256: ${DOCTRINE.sha256} (${DOCTRINE.source})
name: csoai-gspc
type: remote
meta:
  category: ai
  tags:
    - measurement
    - ai-governance
    - provenance
    - remote
about:
  title: ${yq(ID.short_name)}
  description: ${yq(`Inspect the public GSPC board and verify Council-issued Ed25519 measurement cards. ${cap(word(free.length))} free tools and ${word(paid.length)} optional x402-metered evidence tools. Measurement only.`)}
  icon: ${yq(ID.icon)}
remote:
  transport_type: streamable-http
  url: ${yq(ID.door)}
`);
emit(`${DK}/tools.json`, j(tools.map((t) => ({ name: t.id, description: firstSentence(t.description) }))));
emit(`${DK}/readme.md`, `# ${ID.short_name}

Remote MCP: \`${ID.door}\` (streamable HTTP; no account, API key or OAuth). Server ${REMOTE_VERSION}.

## Tools

${cap(word(free.length))} free tools:

${toolLines(free)}

${cap(word(paid.length))} optional x402-metered evidence tools (payment is the explicit \`x_payment\` argument; an unpaid call
returns the challenge, which is not settlement, delivery or revenue):

${toolLines(paid)}

\`tools/list\` must return exactly these ${word(tools.length)} names.

## Evidence boundary

\`verify_card\` authenticates a Council-issued statement under a pinned public key. It does not prove the
measurement is correct, current or complete. UNMEASURED, UNREACHABLE and UNCHECKABLE are first-class states.
${STANCE} No tool determines legal compliance.

${LINKS}

Operator: ${ID.publisher}, UK Companies House ${ID.company_number}. ${doctrineFooter()}
`);

// ── 9. Hugging Face Space (Gradio MCP server) ───────────────────────────────────────────────
const HF = "distribution/hf-space/csoai-gspc-mcp";
emit(`${HF}/README.md`, `---
title: CSOAI GSPC MCP
colorFrom: gray
colorTo: blue
sdk: gradio
app_file: app.py
pinned: false
license: apache-2.0
short_description: Read the GSPC board, verify measurement cards (MCP)
tags:
  - mcp-server
  - measurement
  - ai-governance
---

# CSOAI GSPC — Gradio MCP server

A thin Gradio app over [\`csoai-gspc\`](https://pypi.org/project/csoai-gspc/) (${pyClientVersion}+) with \`mcp_server=True\`:
three functions become MCP tools at \`/gradio_api/mcp/sse\` — board totals, one axis row, and a
three-state card verify (VALID / INVALID / UNCHECKABLE). The canonical remote server with ${FLEET} is
${ID.door}; this Space is a mirror door, not a second authority. The board GET is the authority.

${STANCE}

${LINKS}

Licence: Apache-2.0. ${doctrineFooter()}
Generated by \`scripts/harness-x/render.mjs\` — do not hand-edit.
`);
emit(`${HF}/requirements.txt`, `gradio[mcp]>=5.28\ncsoai-gspc[verify]>=${pyClientVersion}\n`);
emit(`${HF}/app.py`, `"""CSOAI GSPC — Gradio MCP server. Generated by scripts/harness-x/render.mjs — do not hand-edit."""
from __future__ import annotations

import json

import gradio as gr
from csoai_gspc import BOARD_URL, fetch_board, get_axis, totals, verify_card

DOCTRINE_SHA256 = "${DOCTRINE.sha256}"


def gspc_board_totals() -> dict:
    """Live GSPC board totals, verbatim from ${ID.board}. Quote public_count exactly; never re-derive a count.

    Returns state UNREACHABLE (and no number) if the board cannot be fetched.
    """
    try:
        return {"state": "LIVE", "source": BOARD_URL, "totals": totals(fetch_board())}
    except Exception as exc:
        return {"state": "UNREACHABLE", "source": BOARD_URL, "error": type(exc).__name__}


def gspc_axis(axis: str) -> dict:
    """One GSPC axis row by name, verbatim from the live board.

    Args:
        axis: the axis name as printed on the board.
    """
    try:
        row = get_axis(axis, fetch_board())
    except Exception as exc:
        return {"state": "UNREACHABLE", "source": BOARD_URL, "error": type(exc).__name__}
    return {"state": "ABSENT", "axis": axis} if row is None else {"state": "LIVE", "axis_row": row}


def gspc_verify_card(card_json: str) -> dict:
    """Verify a Council of AI signed measurement card. Three states: VALID, INVALID, UNCHECKABLE.

    Args:
        card_json: the card as a JSON string.
    """
    try:
        card = json.loads(card_json)
    except ValueError:
        return {"state": "UNCHECKABLE", "reason": "not JSON"}
    v = verify_card(card)
    return {"state": v.state, "reason": v.reason, "card_id": v.card_id}


demo = gr.TabbedInterface(
    [
        gr.Interface(gspc_board_totals, inputs=[], outputs=gr.JSON(), title="Board totals"),
        gr.Interface(gspc_axis, inputs=gr.Textbox(label="axis"), outputs=gr.JSON(), title="Axis"),
        gr.Interface(gspc_verify_card, inputs=gr.Textbox(label="card JSON", lines=12), outputs=gr.JSON(), title="Verify card"),
    ],
    ["Board", "Axis", "Verify"],
    title="CSOAI GSPC — measurement only",
)

if __name__ == "__main__":
    demo.launch(mcp_server=True)
`);

// ── 10. Well-known descriptors: BOTH DOCUMENTS RENDERED WHOLE ───────────────────────────────
// public/.well-known/mcp/server-card.json and public/.well-known/mcp.json are generated here in
// full, from ONE set of sources (public audit 2026-09-28, fix #24):
//   identity   council-os/distribution.json identity + registry_names
//   version    mcp/gspc-server/server.json version (the MCP Registry's isLatest; check.mjs reads the
//              registry live) — and functions/mcp/[[path]].ts MCP_HTTP_SERVER_VERSION must equal it
//   tools      functions/mcp/gspc-tools.json + paid-tools.json, exactly what tools/list serves
//   doctrine   docs/DOCTRINE.md, by hash
// Until then only some fields were rendered and the rest were whatever the file last held, which
// is how the audit found a server card with a four-name axis list, no tools[] and no version, and
// an mcp.json with a stale registry version, an internal worker note and a fallback URL
// (https://csoai.org/mcp) that answers POST with a 308. Nothing in either file is hand-edited now.
//
// THE TOOL NAMES, COUNTS AND DIGESTS COME FROM WHAT tools/list SERVES (2026-09-28), not from the
// registry: functions/mcp/[[path]].ts lists gspc-tools.json then paid-tools.json on /mcp, and
// gspc-tools.json alone on /mcp/free. The contract-parity instrument (scripts/census/contract-parity.py)
// compares exactly these fields with a live tools/list. The registry must name the same fleet; if it
// does not, this render refuses rather than publish either version. The digest is the instrument's
// own: sha256 of the sorted tool names joined by "\n".
const SERVED_FREE_DEFS = readJson("functions/mcp/gspc-tools.json").tools;
const SERVED_PAID_DEFS = readJson("functions/mcp/paid-tools.json").tools;
const SERVED_FREE = SERVED_FREE_DEFS.map((t) => t.name);
const SERVED_PAID = SERVED_PAID_DEFS.map((t) => t.name);
const SERVED = [...SERVED_FREE, ...SERVED_PAID];
const namesSha = (names) => sha256([...names].sort().join("\n"));
const NAMES_SHA_RULE = 'sha256 of the tool names from tools/list, sorted, joined by "\\n" (UTF-8)';
if (SERVED.join(",") !== toolNames.join(",") || SERVED_FREE.join(",") !== free.map((t) => t.id).join(",")) {
  console.error(
    "harness-x render: REFUSED — council-os/capabilities.json mcp_tool entries and the served definitions " +
    `(functions/mcp/gspc-tools.json + paid-tools.json) name different fleets.\n  registry: ${toolNames.join(",")}\n  served:   ${SERVED.join(",")}`);
  process.exit(2);
}
// The HTTP runtime answers initialize with MCP_HTTP_SERVER_VERSION; the documents state REMOTE_VERSION.
// Two numbers for one server is the drift this section exists to stop, so a mismatch refuses.
const HTTP_VERSION = /export const MCP_HTTP_SERVER_VERSION = "([^"]+)"/.exec(read("functions/mcp/[[path]].ts"))?.[1];
if (HTTP_VERSION !== REMOTE_VERSION) {
  console.error(
    `harness-x render: REFUSED — functions/mcp/[[path]].ts MCP_HTTP_SERVER_VERSION is ${HTTP_VERSION ?? "(absent)"}, ` +
    `mcp/gspc-server/server.json version is ${REMOTE_VERSION}. initialize and the discovery documents must state one version.`);
  process.exit(2);
}
const SERVER_NAME = "csoai-gspc-mcp"; // serverInfo.name, as initialize answers it
const stdio = `npx -y ${NPM_ID}@${NPM_VERSION}`;
const fleetProse = `${word(free.length)} free readers plus ${word(paid.length)} x402-metered evidence tools`;
// The one tool-count sentence the site, /mcp and these documents share (fix #19). Array lengths.
const TOOL_COUNTS = `${SERVED_FREE.length} free tools at /mcp/free; ${SERVED.length} at /mcp ` +
  `(${SERVED_FREE.length} free + ${SERVED_PAID.length} metered). The npm package is versioned separately.`;
const WELL_KNOWN_GENERATOR =
  "scripts/harness-x/render.mjs — the whole document, from council-os/distribution.json (identity), " +
  "mcp/gspc-server/server.json (version), functions/mcp/gspc-tools.json + paid-tools.json (tools, as tools/list serves them) " +
  "and docs/DOCTRINE.md (doctrine hash). Do not hand-edit; re-render.";
const provider = { name: ID.publisher, url: ID.website, company_number: ID.company_number, jurisdiction: ID.jurisdiction };
emit("public/.well-known/mcp/server-card.json", j({
  schema_version: "2024-11-05",
  name: SERVER_NAME,
  display_name: ID.display_name,
  version: REMOTE_VERSION,
  serverInfo: { name: SERVER_NAME, title: ID.display_name, version: REMOTE_VERSION },
  description:
    "Independent AI-governance measurement body. Publishes the GSPC measurement board: quote totals.public_count from GET /api/gspc, never a typed count. " +
    "Frozen item banks and published scoring code. Measurement only: not certification, not accreditation, no conformity assessment. " +
    `MCP registry ${dist.registry_names.canonical} server ${REMOTE_VERSION} (${dist.registry_names.deprecated_alias} is its deprecated alias). ${TOOL_COUNTS}`,
  icon_url: ID.icon,
  provider,
  transport: { type: "streamable-http", url: ID.door },
  endpoints: {
    mcp: {
      primary: ID.door,
      current: ID.door,
      stdio,
      note: `Live door is ${ID.door} (GET 200). HTTP tools/list is ${word(SERVED.length)}: ${fleetProse}. witness_hash is quarantined and not advertised. Registry server ${REMOTE_VERSION}.`,
      free: FREE_DOOR,
      free_note:
        `${FREE_DOOR} serves the ${word(free.length)} free readers only, from the same definitions and handlers as ${ID.door}: ` +
        "no payment tool and no payment text. It is the address for chat clients and directories that list no payment software.",
    },
    gspc_board: {
      url: ID.board,
      method: "GET",
      description: "Live GSPC board. Per-axis n, leader, Wilson interval, separation (SEPARATED/TIE). Quote totals.public_count. Empty cells stay empty. Ties are ties. No auth required.",
    },
  },
  capabilities: {
    tools: SERVED,
    total_tools: SERVED.length,
    free_tools: SERVED_FREE.length,
    metered_tools: SERVED_PAID.length,
    tool_counts: TOOL_COUNTS,
    streaming: false,
    auth_required: false,
    tool_names_sha256: namesSha(SERVED),
    free_door_tool_names: SERVED_FREE,
    free_door_tool_names_sha256: namesSha(SERVED_FREE),
    tool_names_sha256_rule: NAMES_SHA_RULE,
    derived_from: `tools/list of ${ID.door} (functions/mcp/gspc-tools.json + paid-tools.json) and of ${FREE_DOOR} (gspc-tools.json)`,
  },
  // The full definitions tools/list serves on /mcp, in its order: name, title, description, input and
  // output schema, annotations. The first twelve are the /mcp/free list.
  tools: [...SERVED_FREE_DEFS, ...SERVED_PAID_DEFS],
  authentication: { required: false, note: "Public MCP — initialize and tools/list require no Authorization header." },
  license: "CC-BY-4.0",
  doi: "10.5281/zenodo.21991104",
  // 29 Sep 2026: the Zenodo record answers HTTP 410 (account blocked by Zenodo; appeal pending).
  // The identifier stays; this says it does not resolve. Same block GET /api/gspc serves.
  doi_status: "UNAVAILABLE",
  doi_status_note: "Zenodo record unavailable since 29 Sep 2026: account blocked by Zenodo; appeal pending.",
  doi_status_since: "2026-09-29T15:47Z",
  doi_status_url: "https://councilof.ai/interop/zenodo-status.json",
  doi_alternative: { url: "https://councilof.ai/methodology/", relation: "the live methodology page; not the deposit's bytes" },
  explicitly_not: ["certification", "accreditation", "conformity-assessment", "legal-determination", "enforcement"],
  discovery: { well_known_mcp: `${ID.website}/.well-known/mcp.json`, agent_card: `${ID.website}/.well-known/agent-card.json` },
  doctrine: DOCTRINE,
  generated_by: WELL_KNOWN_GENERATOR,
}));
emit("public/.well-known/mcp.json", j({
  schema_version: "2026-07-28",
  name: "csoai",
  description:
    "Council of AI measurement tools exposed over MCP. Independent AI-governance measurement body — not certification, not accreditation. " +
    "Live board: GET /api/gspc (quote totals.public_count).",
  servers: [
    {
      name: SERVER_NAME,
      display_name: "GSPC Measurement Tools",
      url: ID.door,
      version: REMOTE_VERSION,
      stdio,
      auth_required: false,
      registry: {
        name: dist.registry_names.canonical,
        version: REMOTE_VERSION,
        url: "https://registry.modelcontextprotocol.io",
        deprecated_alias: dist.registry_names.deprecated_alias,
      },
      free_url: FREE_DOOR,
      free_tools: SERVED_FREE,
      free_tool_names_sha256: namesSha(SERVED_FREE),
    },
  ],
  catalogue: ID.door,
  gspc_board: ID.board,
  server_card: `${ID.website}/.well-known/mcp/server-card.json`,
  measured: {
    total_tools: SERVED.length,
    free_tools: SERVED_FREE.length,
    metered_tools: SERVED_PAID.length,
    server_count: 1,
    tools: SERVED,
    tool_counts: TOOL_COUNTS,
    note:
      `POST /mcp tools/list: ${fleetProse}. witness_hash remains quarantined and is not advertised. ` +
      `MCP Registry server ${REMOTE_VERSION} points here. A listing does not prove paid settlement or delivery.`,
    tool_names_sha256: namesSha(SERVED),
    tool_names_sha256_rule: NAMES_SHA_RULE,
    derived_from: `tools/list of ${ID.door}: functions/mcp/gspc-tools.json + paid-tools.json`,
  },
  planted: {
    tools: SERVED,
    url: ID.door,
    note:
      `The product door: ${fleetProse}. The public-root readers answer VALID / INVALID / NOT_IN_THIS_CORPUS / UNCHECKABLE, never a GSPC grade. ` +
      "No jail run from MCP.",
  },
  provider: { name: ID.publisher, url: ID.website },
  doctrine: DOCTRINE,
  generated_by: WELL_KNOWN_GENERATOR,
}));

// ── 11. SUBMIT.md ───────────────────────────────────────────────────────────────────────────
const rowsById0 = Object.fromEntries(dist.distribution.map((r) => [r.id, r]));
const PY_ORDER = `Publish csoai-gspc ${pyClientVersion} to PyPI first: this package requires csoai-gspc>=${pyClientVersion}, and \`scripts/harness-x/parity_live.py\` reports that floor uninstallable until it is there. (The floor also keeps out 0.2.20260928, a snapshot release cut on 2026-09-28 from pre-2026-09-26 client code; gspc-spray.py now refuses a package source older than the one PyPI serves.)`;
const PY_NO_REUSE = `The source version is ${AV}. PyPI and npm refuse to re-upload a version, so any content change moves adapter_version; parity_live.py flags a live version whose bytes the source no longer produces.`;
const STEPS = {
  "mcp-registry-github": [
    "DEPRECATED ALIAS. The canonical name is the domain one (mcp-registry-domain). Owner step: deprecate this name in the registry (`mcp-publisher login github` as a CSOAI-ORG member, then set its status to deprecated). Publish no new versions under it.",
    "This file stays rendered so the deprecation has the descriptor it names; check.mjs still compares its version with the registry's isLatest.",
    "npm `csoai-gspc-mcp` 0.2.2 carries `mcpName: io.github.CSOAI-ORG/gspc` (the deprecated alias); the package source now carries `mcpName: ai.councilof/gspc`, so the next npm release binds the package to the canonical name.",
  ],
  "mcp-registry-domain": [
    "`mcp-publisher login http --domain councilof.ai --private-key <64-hex Ed25519 seed>` — the key whose public half is served at /.well-known/mcp-registry-auth.",
    "`mcp-publisher publish distribution/mcp-registry/ai.councilof-gspc/server.json`.",
    "CANONICAL NAME (owner ruling 2026-09-26). The live entry is remote-only; add the npm package to it only after an npm release that carries `mcpName: ai.councilof/gspc`.",
    `The remote is \`${DOMAIN_REMOTE}\` (the door plus one slash): the bare door is registered under the io.github name and the registry refuses one remote URL under two names. Publish a version above the registry's current isLatest; registry versions are immutable.`,
  ],
  "claude-plugin": [
    "Create a public repo on CouncilofAI-CSOAI (not CSOAI-ORG); copy distribution/plugin/ to its root.",
    "Test: `/plugin marketplace add CouncilofAI-CSOAI/<repo>` then `/plugin install gspc@council-of-ai`.",
    "Optional: submit the repo to Anthropic's plugin directory form.",
  ],
  "cursor-plugin": ["Same repo as claude-plugin; submit it through Cursor's marketplace publisher flow (Cursor account login)."],
  "grok-plugin": ["Same repo as claude-plugin; the marketplace file sits at .grok-plugin/marketplace.json with source `./`."],
  "claude-connector": [
    "Fill Anthropic's connectors-directory submission form from distribution/claude/connector.json (every field is there).",
    "Blocker to clear first: the live tools/list carries no MCP tool annotations (readOnlyHint etc.); directory review expects them. Add them in functions/mcp/gspc-tools.json + paid-tools.json (another lane).",
  ],
  "gemini-extension": [
    "Put distribution/gemini/ at the root of a public repo on CouncilofAI-CSOAI; add the GitHub topic `gemini-cli-extension` so the gallery indexes it.",
    "Test: `gemini extensions install https://github.com/CouncilofAI-CSOAI/<repo>`.",
  ],
  "openai-app": [
    "OpenAI organisation verification must be complete on the submitting org (owner login).",
    "Submit in the OpenAI platform dashboard using distribution/openai/app.json; use test_prompts verbatim.",
    "Blockers: (1) live tools carry no readOnlyHint/destructiveHint annotations — suggested values are in app.json; (2) owner decision whether the four x402 tools may appear in a ChatGPT app at all.",
    "Custom GPT Actions need no review: Import from URL → the openapi_actions URL.",
  ],
  "pypi-langchain-csoai": [
    PY_ORDER,
    "`cd distribution/python/langchain-csoai && python -m build && twine upload dist/*` with an owner PyPI API token.",
    PY_NO_REUSE,
  ],
  "pypi-llama-index-tools-csoai": [
    PY_ORDER,
    "`cd distribution/python/llama-index-tools-csoai && python -m build && twine upload dist/*` (owner token).",
    "Optional LlamaHub: PR to run-llama/llama_index from an unflagged account.",
  ],
  "pypi-crewai-csoai": [PY_ORDER, "`cd distribution/python/crewai-csoai && python -m build && twine upload dist/*` (owner token).", PY_NO_REUSE],
  "npm-ai-sdk-gspc": [
    "`cd distribution/npm/ai-sdk-gspc && npm publish --access public` with a granular token that has Bypass 2FA (the account is WebAuthn-only).",
    "The @csoai scope must exist and the token must be able to publish to it.",
  ],
  "npm-mastra-gspc": ["As npm-ai-sdk-gspc, from distribution/npm/mastra-gspc."],
  "docker-mcp-catalog": [
    "Fork github.com/docker/mcp-registry from CouncilofAI-CSOAI; copy distribution/docker/servers/csoai-gspc/ to servers/csoai-gspc/.",
    "Run their `task validate -- --name csoai-gspc` locally, then open the PR. Supersedes docs/press/submissions/docker-mcp-registry/.",
  ],
  "hf-space": [
    PY_ORDER.replace("this package requires", "the Space's requirements.txt requires"),
    `\`huggingface-cli upload ${rowsById0["hf-space"].space_id} distribution/hf-space/csoai-gspc-mcp . --repo-type space\` with an owner HF write token. The live Space is ${rowsById0["hf-space"].space_id}; never upload to csoai/gspc-mcp, which is the static GSPC-MCP axis printer.`,
  ],
  "well-known-server-card": ["Merge this lane; the next deploy serves the regenerated files."],
};
const rows = dist.distribution;
const missingSteps = rows.filter((r) => !STEPS[r.id]).map((r) => r.id);
if (missingSteps.length) throw new Error(`SUBMIT steps missing for: ${missingSteps.join(", ")}`);
const blocked = rows.filter((r) => r.flagged_org_affected === true);
emit("distribution/SUBMIT.md", `# Layer 0 distribution — submission steps

GENERATED by \`scripts/harness-x/render.mjs\` from \`council-os/distribution.json\`. Nothing below has been
published, submitted or registered. Every step is an owner action.

Targets: ${rows.length}. Owner approval needed: ${rows.filter((r) => r.owner_approval_needed).length}.
Affected by the flagged CSOAI-ORG GitHub account (blocked, re-routed to CouncilofAI-CSOAI, or losing GitHub-based provenance): ${blocked.length} (${blocked.map((r) => `\`${r.id}\``).join(", ")}).
Remote server version: ${REMOTE_VERSION} (from \`mcp/gspc-server/server.json\`; \`scripts/harness-x/check.mjs\` requires it to equal the live serverInfo.version).
Fleet: ${FLEET}. Doctrine sha256 \`${DOCTRINE.sha256}\`.

Before any step: \`node scripts/harness-x/render.mjs --check && node scripts/harness-x/check.mjs\`.
After any step: \`python3 scripts/harness-x/parity_live.py\` reads every live channel in \`published_channels\` and says
CONSISTENT / INCONSISTENT (quoting source and live) / UNCHECKABLE (staged daily: \`scripts/pod-loops/harness-x-parity.sh\`).

| id | format | licence | channel | approver |
|---|---|---|---|---|
${rows.map((r) => `| \`${r.id}\` | ${r.format} | ${r.licence} | ${r.listing_channel} | ${r.approver} |`).join("\n")}

${rows.map((r) => `## \`${r.id}\`

- Output: ${r.output.map((o) => `\`${o}\``).join(", ")}
- Version source: \`${dist.version_sources[r.version_source]}\`
- Flagged-org impact: ${r.flagged_org_impact}

${STEPS[r.id].map((s, i) => `${i + 1}. ${s}`).join("\n")}
`).join("\n")}
## Owner decisions (not taken in this lane)

1. **Licences.** \`councilof-mcp\` (PyPI, 1.0.1) and \`@csoai/layer0\` (\`packages/layer0-js\`, ${layer0Version}) are MIT against the
   Apache-2.0 default. Not changed here. \`@csoai/layer0\` is also not on npm, so the TS adapters take it as an optional peer.
2. **Layer0 gateway.** \`@csoai/layer0\` defaults to https://api.csoai.org, which did not answer on 2026-09-25; the TS adapters
   therefore call ${ID.door} directly and use Layer0 only when a caller passes an instance.
3. **Doctrine text.** \`docs/DOCTRINE.md\` rule 4 types a board grammar ("22 · 15 · 7") that the live board no longer prints.
   Outputs carry only the hash, so nothing stale is copied; fix the text, then \`render.mjs --pin-doctrine\`.
4. **Second registry name** (\`${dist.registry_names.domain}\`) — keep both names or one.
5. **A2A agent card signature.** \`/.well-known/agent-card.json\` has no \`signatures\` block. \`scripts/adapters/agent_card_jws.py\`
   emits the signing input; signing needs the card-attestation-1 key holder (K3 lane). Not done here.
6. **Paid tools in consumer app stores** (OpenAI, Claude directory) — list the door with all ${tools.length} tools, or wait.
`);

// ── manifest + write/check ──────────────────────────────────────────────────────────────────
const manifestEntries = [...outputs.keys()].sort().map((p) => ({ path: p, sha256: sha256(outputs.get(p)) }));
emit("distribution/MANIFEST.json", j({
  schema: "csoai.distribution-manifest/1",
  generator: "scripts/harness-x/render.mjs",
  source: DIST_PATH,
  doctrine: DOCTRINE,
  remote_version: REMOTE_VERSION,
  tools: { free: free.map((t) => t.id), paid: paid.map((t) => t.id) },
  targets: rows.map((r) => ({ id: r.id, output: r.output, doctrine_carriers: r.doctrine_carriers })),
  files: manifestEntries,
}));

// every declared output must be rendered, and every rendered distribution/ file must be declared
const declared = new Set(rows.flatMap((r) => r.output));
const undeclared = [...outputs.keys()].filter((p) => !declared.has(p) && !["distribution/SUBMIT.md", "distribution/MANIFEST.json"].includes(p));
const unrendered = [...declared].filter((p) => !outputs.has(p));
if (undeclared.length || unrendered.length) {
  console.error(`harness-x render: declaration mismatch\n  rendered but undeclared: ${undeclared.join(", ") || "-"}\n  declared but unrendered: ${unrendered.join(", ") || "-"}`);
  process.exit(3);
}

let bad = 0;
for (const [rel, text] of outputs) {
  const abs = join(REPO, rel);
  if (CHECK) {
    const cur = existsSync(abs) ? readFileSync(abs, "utf8") : null;
    if (cur !== text) { bad++; console.error(`DRIFT ${rel}: ${cur === null ? "missing" : `${cur.length} B committed vs ${text.length} B rendered`}`); }
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
}
console.log(`harness-x render: ${outputs.size} file(s) ${CHECK ? (bad ? `— ${bad} DRIFTED` : "match") : "written"} · ${rows.length} targets · ${FLEET} · server ${REMOTE_VERSION} · doctrine ${DOCTRINE.sha256.slice(0, 12)}`);
process.exit(bad ? 1 : 0);
