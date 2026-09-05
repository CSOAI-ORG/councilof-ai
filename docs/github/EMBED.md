# Embedding the living GSPC board

The board is `GET https://councilof.ai/api/gspc`. Every surface below is a **printer** of that
GET: the numbers are derived when the image is requested, never typed into a file. If the
GET cannot be read, the image says `unread — <reason>` and shows no rows and no counts — an
unread board is not a board of zeros.

Measurement, not certification. Nothing here is a grade, a rank or a score.

## GitHub README (image only)

GitHub renders Markdown with no script and no iframe, so the board goes in as one SVG:

```markdown
[![GSPC board](https://councilof.ai/badge/board.svg)](https://councilof.ai/gspc)
```

Compact (one row per axis, two columns, status dots):

```markdown
[![GSPC board](https://councilof.ai/badge/board.svg?compact=1)](https://councilof.ai/gspc)
```

Variants: `?theme=light` (default, white ground) · `?theme=dark` · `?compact=1`. The count-only
badge stays at `https://councilof.ai/badge/gspc.svg` (shields JSON: `?format=shields`).

**Caching.** GitHub serves README images through its camo proxy, which caches them; the
image itself answers `cache-control: public, max-age=300`, but a README may show a board up to
a few hours old. The caption, `as_of` and the `derived <ISO>` footer are inside the image, so
a stale copy states its own age. The live board is always `/api/gspc`.

Example of what the function renders: [`board-example.svg`](./board-example.svg) — produced by
running the function locally against the same axis roster `/api/gspc` serves.

## GitHub Copilot: the MCP server

A README cannot run the AG-UI cards — GitHub executes no script inside Markdown, so the
Council OS chat surface cannot live there. What can reach a GitHub user is the MCP server:
Copilot (VS Code, JetBrains, Copilot coding agent) can add it from the official registry.

- Registry: <https://registry.modelcontextprotocol.io> — server `io.github.CSOAI-ORG/gspc`
- npm (stdio): `csoai-gspc-mcp` — `npx -y csoai-gspc-mcp`
- Remote (streamable HTTP): `https://councilof.ai/mcp`

VS Code `mcp.json`:

```json
{
  "servers": {
    "csoai-gspc": { "type": "http", "url": "https://councilof.ai/mcp" }
  }
}
```

or, stdio:

```json
{
  "servers": {
    "csoai-gspc": { "type": "stdio", "command": "npx", "args": ["-y", "csoai-gspc-mcp"] }
  }
}
```

The tools read the same `/api/gspc` and the signed card index; they verify, they do not certify.

## Hugging Face Space

The one living Space, <https://huggingface.co/spaces/csoai/gspc-board>, frames the Council OS
dashboard (`https://councilof.ai/dashboard/?embed=1&tab=home`, the target of `/os?embed=1`)
and shows `/badge/board.svg` beneath it. Framing is allowed for exactly two ancestors,
`https://huggingface.co` and `https://*.hf.space`, by the `frame-ancestors` rule on
`/dashboard/*` in `public/_headers`; every other page on the site keeps
`X-Frame-Options: SAMEORIGIN`.

## What cannot be embedded, and why

| Host | Live board | Reason |
|---|---|---|
| GitHub README / issues / wiki | image only | no script, no iframe, no fetch in rendered Markdown; camo caches images |
| GitHub Copilot chat | via MCP | AG-UI cards cannot run inside GitHub; the MCP server is the door |
| Hugging Face Space (static) | iframe + image | needs the `frame-ancestors` rule above on our side |
| Hugging Face model / dataset cards | image only | card Markdown strips script and iframe |
| npm / PyPI READMEs | image only | Markdown, same as GitHub; npm's image proxy also caches |
