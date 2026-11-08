# Bank draft: interop-conformance (declared subject slot, DRAFT v0)

## 1 · The question

Does an MCP client platform publish, verifiably and as of the read window: its
transport support (stdio / streamable HTTP), a specification-version commitment,
and a public conformance or compatibility statement?

## 2 · Subjects

MCP client platforms with a public product site. Enumeration pass v0
(2026-11-08), 32 subjects — identifier is the domain root:

openai.com (ChatGPT desktop) · claude.ai (Claude Desktop) · cursor.com ·
cline.bot · windsurf.com · codeium.com · github.com/copilot (Copilot Chat) ·
gemini.google.com (Gemini CLI) · antigravity.google · zed.dev ·
continue.dev · augmentcode.com · ampcode.com · augmentcode.com ·
trae.ai · kilocode.ai · roocode.com · goplakat.com · boltai.com ·
typingmind.com · mcp-inspector (modelcontextprotocol/inspector) ·
librechat.ai · openwebui.com · anythingllm.com · chatboxai.app ·
chatmcp.io · mcp.so · smithery.ai · pulseseek.com · mcp.run ·
composio.dev · portkey.ai

(32 rows; each resolves to the platform's MCP-documentation page at freeze.
DEAD rows stay DEAD.)

## 3 · Item grid

Per subject, three reads: its MCP support page, its transport/protocol statement,
its spec-version or changelog mention. Plain HTTP GET, no credentials.

## 4 · Grading rule

PASS/FAIL/ABSENT per item on the company-practice §4 definitions; axis MEASURED
with n = subjects graded; counts published, never a score.

## 5 · Referee

Named at freeze: an independent MCP ecosystem maintainer re-grading 10%.

## 6 · Freeze format

`csoai.bank.interop-conformance/0.1` — item grid, sha-pinned + `.ots`.

## 7 · Compute estimate

HTTP-only: one CPU pass, < 1 hour, $0 model calls.

## 8 · What flips

`interop-conformance` UNMEASURED → MEASURED (n = subject count) and its /axis page.
