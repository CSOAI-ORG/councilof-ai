# MEOKCLAW TUI

> The sovereign terminal interface for the MEOK AI ecosystem.

[![Go Version](https://img.shields.io/badge/go-1.23-blue)](https://golang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Overview

MEOKCLAW is a terminal user interface (TUI) that brings the full MEOK AI ecosystem into your terminal:

- **🖥️ Shell** — IDE-like coding interface with file explorer, editor, and terminal
- **💬 Companion** — Character-based AI companion with 7 archetypes (Sovereign, Guardian, Scout, Strategist, Creator, Companion, Sage)
- **⚖️ Council** — Real-time PBFT-MoE council visualization with BFT voting
- **🔄 Model Switching** — Switch between Claude, GPT-4o, Gemini, DeepSeek, and more
- **🎯 Modes** — Ask, Architect, Code, Debug, Orchestrator

## Installation

### Homebrew (macOS)

```bash
brew tap csoai-org/meokclaw
brew install meokclaw
```

### From Source

```bash
git clone https://github.com/CSOAI-ORG/clawd-workspace.git
cd clawd-workspace/meokclaw-tui
make install
```

### Pre-built Binary

Download the latest release from [Releases](https://github.com/CSOAI-ORG/clawd-workspace/releases).

## Quick Start

```bash
# Start MEOKCLAW
meokclaw

# Verify license
meokclaw --verify-license

# Check version
meokclaw --version
```

## Key Bindings

| Key | Action |
|-----|--------|
| `Ctrl+C` / `q` | Quit |
| `Ctrl+N` | New session |
| `Ctrl+M` | Switch model |
| `Ctrl+B` | Toggle council |
| `Ctrl+K` | Toggle companion chat |
| `Ctrl+/` | Command palette |

## Configuration

Config is stored at `~/.config/meokclaw/config.json`:

```json
{
  "mcp_bridge_url": "http://localhost:3101/mcp",
  "active_model": "claude",
  "models": ["claude", "gpt-4o", "gpt-4.1", "gemini-2.5-pro", "o3-mini", "deepseek-r1"],
  "agent_mode": "ask"
}
```

## Architecture

```
cmd/meokclaw/          # Entry point
internal/
  auth/                # License verification (Pro/Team tiers)
  bridge/              # MCP bridge HTTP client
  config/              # Configuration management
  tui/
    model.go           # Main Bubble Tea model
    views/
      shell.go         # IDE-like shell interface
      companion.go     # Character companion panel
      council.go       # PBFT council visualization
      statusbar.go     # Bottom status bar
```

## Requirements

- Go 1.23+
- macOS (arm64) — Linux and Windows builds coming soon
- SOV3 running on `:3101` for full functionality (optional)

## License

MIT © MEOK AI Labs

## Links

- [MEOK Platform](https://meok.ai)
- [CSOAI Organization](https://csoai.org)
- [Sovereign Temple](https://sovereign.templeman-opticians.com)
