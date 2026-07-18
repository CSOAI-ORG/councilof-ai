# MEOK Claw TUI → Universal AI OS Strategy

> **Thesis:** Build MEOK Claw as the keyboard-first, terminal-native AI interface that wraps every AI, every MCP, every browser, every API, every OS — then distribute it everywhere a terminal exists (which is everywhere).

**Generated:** 2026-05-28 by Claude (Opus 4.7)
**Mandate:** Deep research on how MEOK AI Labs takes TUI architecture and uses it as the wedge to eat operating systems, AI products, Windows, iOS, browsers, APIs, MCPs, A2A — everything.
**Companion doc:** `DELBOY_MODE_FULL_SYSTEM_CARTOGRAPHY_2026-05-28.md`

---

## TABLE OF CONTENTS

- **Part 1** — Why TUI now (the strategic landscape)
- **Part 2** — Competitive map: who else is in this fight
- **Part 3** — MEOK Claw architecture (the technical spec)
- **Part 4** — Distribution: how it reaches every OS
- **Part 5** — The "eating" plan (what gets absorbed when)
- **Part 6** — Honest limits (what TUI WON'T win)
- **Part 7** — Revenue model layered on top
- **Part 8** — 12-week build plan
- **Part 9** — Kimi swarm deep-research briefs

---

# PART 1 — Why TUI now

## 1.1 The renaissance is already happening

Five years ago, TUI was niche. In 2025-2026:

- **Warp.dev** raised $73M+ on a venture-backed Electron-shell terminal with AI baked in ($1B+ rumored valuation)
- **Charm.sh** built a profitable open-source TUI ecosystem (Bubble Tea, Glow, Lazygit, Soft Serve, Crush) shipping 50K+ GitHub stars across products
- **Claude Code** is Anthropic's official CLI for engineering work (this product you're reading is Claude Code)
- **Codex CLI** is OpenAI's open-source agent CLI
- **Aider** is the open-source pair-programmer in your terminal (Paul Gauthier)
- **lazygit / lazydocker / k9s / btop / htop / helix** have re-set the bar for what a beautiful TUI looks like
- **Ratatui (Rust)** has overtaken `tui-rs` and ships in 100+ apps
- **Textual (Python, Textualize.io)** brings web-CSS-style styling to terminals
- **Ink (React renderer for TUIs)** is what Vercel built `create-next-app` interactive prompts on
- **WebTUI** projects (xterm.js, ttyd, Wetty) embed full terminals INSIDE browsers
- **Tauri 2.0** lets you wrap a TUI in a native shell on macOS/Linux/Windows/iOS/Android

The shift isn't that TUI is new — it's that the AI workload makes TUI uniquely correct.

## 1.2 Why AI workloads belong in TUI

| Property | Why it matters for AI |
|---|---|
| **Keyboard-first** | High signal-density per user action — no clicking through menus to invoke a tool |
| **Streaming text** | Perfect for token-streamed LLM output |
| **Pipe-composable** | Output of LLM → input of jq → input of curl → input of another LLM, all in one line |
| **Cross-platform with zero GUI engine** | Same Bubble Tea binary runs on macOS/Linux/Windows/WSL/Termux/SSH |
| **Works over SSH** | An agent on a server is the same UX as an agent on your laptop |
| **Small attack surface** | Compare to Electron — no Chromium, no V8 surface for malicious AI to exploit |
| **Mature accessibility** | Screen readers handle text streams natively |
| **Recordable + replayable** | `asciinema` records every keystroke + render — perfect for agent audit chains |
| **Resource-light** | Ratatui app = 5MB binary. Same Electron AI app = 200MB+ |

## 1.3 What MEOK uniquely brings to AI-TUI

This is the moat:

| MEOK asset | Why no other AI TUI has it |
|---|---|
| 82 compliance MCPs (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001/42005, AAIF, A2A, ACP, libp2p, ABCI) | Built by a year of regulatory research; no other TUI carries the same regulatory mass |
| HMAC-signed attestation chain for every action | Audit trail every regulated buyer needs — Warp doesn't have this, Claude Code doesn't have this |
| 33-node BFT Council for adjudication | "Should this agent actually do this?" — material decisions go through quorum vote |
| Care Membrane gate | Pre-inference ethical filter — refuses harm by construction |
| Public verify URL (`meok.ai/verify`) for any signed output | Anyone can audit any output the TUI produced — defensible IP |
| 5,920 monthly PyPI installs across MEOK packages | Existing distribution surface |
| UK incorporation + clean compliance posture | Regulated buyers (banking, healthcare, government) can actually buy from us |

A generic AI TUI is a feature. **MEOK Claw is a regulated-AI primitive.**

---

# PART 2 — Competitive map

## 2.1 Direct AI-in-terminal competitors

| Product | Pricing | Stack | Differentiator | Weakness |
|---|---|---|---|---|
| **Warp** | $20-40/mo per seat | Electron + Rust | Polished UI, AI baked into prompt | Closed-source, Electron weight, no compliance |
| **Claude Code** | Bundled with Anthropic API usage | Node + Ink (React for TUI) | First-class MCP support, agent workflow | Anthropic-only, no compliance gating |
| **Cursor agent** | Bundled with Cursor sub | Electron + custom | Best-in-class code-editing | Editor not terminal |
| **Codex CLI** | Pay-per-use OpenAI | Rust | Open-source, OpenAI-native | OpenAI-only, no audit chain |
| **Aider** | Free OSS + LLM API costs | Python | Best git-aware pair programmer | Code-focused, no agent loop |
| **Cline** | OSS (VSCode ext) | TS | Tool-use via VSCode | VSCode-only |
| **Continue.dev** | Freemium | TS | Local + cloud models, MCP support | IDE-tied |
| **CodeBuff** | $20/mo | TS | Multi-agent | Closed-source |
| **OpenInterpreter** | OSS | Python | Code-runs-on-machine agent | Security gaps, no audit |
| **gh copilot CLI** | Free w/ Copilot | Go | Shell-aware autocomplete | Shell-only |

## 2.2 TUI framework competitors (we'd build ON these, not against)

| Framework | Language | Stars | Notable apps |
|---|---|---|---|
| **Bubble Tea (Charm)** | Go | 30K+ | Gum, Soft Serve, Crush, Glow, Wishlist |
| **Ratatui** | Rust | 15K+ | lazygit-rs, gpt-cli, gitui |
| **Textual** | Python | 30K+ | Datasette TUI, posting (TUI HTTP client) |
| **Ink** | TypeScript | 30K+ | npm CLI, Gatsby, Prisma CLI, Claude Code |
| **Rich (subset, library)** | Python | 50K+ | Pretty printing layer used inside Textual |
| **tview / cview** | Go | 12K | k9s, lazygit |

**MEOK pick:** Bubble Tea + Lipgloss + Wish + Glow (the Charm stack) — Go binary, easy cross-compile, ships single-file static binary, runs over SSH, BSD-3 licensed. Already chosen for the Claw shell per the task log.

## 2.3 OS-native shell incumbents

| Surface | What's there |
|---|---|
| macOS Terminal / iTerm2 / Ghostty / Warp / Alacritty / Kitty | Native terminal emulators — MEOK Claw runs INSIDE them |
| Windows Terminal + PowerShell + WSL2 | Microsoft's official terminal; ships in Win10/11; supports VT100 |
| Linux gnome-terminal / konsole / alacritty / kitty / wezterm | Every distro has one |
| iOS Blink / a-Shell / iSH / Termius | Mosh + SSH-into-our-server. iSH runs ELF binaries locally |
| Android Termux | Full Debian-ish, runs arbitrary binaries, sideload-friendly |
| Browser xterm.js / ttyd / Wetty / Coder / GitHub Codespaces | Web-served TUI |
| Tauri / Electron / Neutralino | Wrap a TUI in native window |

**Key insight:** MEOK Claw doesn't compete with terminal emulators. It runs INSIDE them. That means it inherits the entire installed base for free.

---

# PART 3 — MEOK Claw architecture

## 3.1 Single-binary, multi-view design

```
┌─────────────────────────────────────────────────────────────┐
│  MEOK Claw v1                                                │
│  ┌────────────┬────────────┬────────────┬────────────────┐  │
│  │  Chat      │  Agent     │  Compliance│  System          │  │
│  │  (Ctrl-1)  │  (Ctrl-2)  │  (Ctrl-3)  │  (Ctrl-4)        │  │
│  └────────────┴────────────┴────────────┴────────────────┘  │
│                                                              │
│  ┌──── view content (live streaming) ─────────────────────┐  │
│  │                                                         │  │
│  │  > [Chat] Streaming Claude response here…              │  │
│  │                                                         │  │
│  │  Use Ctrl-K to invoke tool: meok-mcp-hardening         │  │
│  │  Use Ctrl-/ for command palette                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──── status line ────────────────────────────────────────┐  │
│  │  Model: claude-opus-4-7 · Tokens: 4.2K · Cost: £0.04   │  │
│  │  Council: ✓ approved · Care: 0.96 · Signed: ✓          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 Layered architecture (Bubble Tea / Lipgloss / Wish / Glow)

```
┌──────────────────────────────────────────────────────────┐
│   View layer    (Bubble Tea models — chat, agent, etc.) │
├──────────────────────────────────────────────────────────┤
│   Style layer   (Lipgloss — colors, padding, borders)   │
├──────────────────────────────────────────────────────────┤
│   Tool dispatcher (calls meok-mcp-router → any MCP)    │
├──────────────────────────────────────────────────────────┤
│   Model gateway (Claude, GPT, Gemini, Ollama, local)   │
├──────────────────────────────────────────────────────────┤
│   Council bridge (SOV3 33-node BFT — material decisions)│
├──────────────────────────────────────────────────────────┤
│   Care membrane (pre-inference + post-inference gates) │
├──────────────────────────────────────────────────────────┤
│   Attestation signer (every action HMAC-Ed25519)        │
├──────────────────────────────────────────────────────────┤
│   Audit log (append-only, optional Sigstore Rekor sync) │
├──────────────────────────────────────────────────────────┤
│   Storage   (SQLite local + optional Postgres remote)    │
└──────────────────────────────────────────────────────────┘
```

## 3.3 Views (the verbs of the OS)

| View | Keybind | What it does |
|---|---|---|
| **Chat** | Ctrl-1 | Multi-LLM chat with tool-use, streaming |
| **Agent** | Ctrl-2 | Autonomous task loop with budget cap |
| **Compliance** | Ctrl-3 | Direct invoke of any of 82 MEOK MCPs |
| **Browse** | Ctrl-4 | Headless Chromium via Playwright, rendered as readable text + screenshots |
| **Inbox** | Ctrl-5 | Gmail + Slack + Discord + GitHub notifications, AI-filtered |
| **Calendar** | Ctrl-6 | Google Cal + Cal.com, AI-scheduled |
| **Code** | Ctrl-7 | Repo-aware code editor (helix-like) with agent loop |
| **Files** | Ctrl-8 | File browser with semantic search across home dir |
| **Council** | Ctrl-9 | View SOV3 episode store, vote on pending decisions |
| **Ledger** | Ctrl-0 | Revenue + spend + DELBOY signals + Stripe/PyPI/GitHub stats |

Each view is a Bubble Tea model. Universal commands: `Ctrl-K` (tool call), `Ctrl-/` (command palette), `Ctrl-P` (file/cmd quickopen), `Ctrl-G` (git status / commit), `Ctrl-Space` (model picker).

## 3.4 Tool dispatch through meok-mcp-router

The MEOK MCP Router (already shipped) holds 82 MCPs behind one namespaced endpoint. Claw never has to load all 82 tool schemas — it loads the router, asks "what tools do you have for {category}?", then invokes via namespace path.

This is HOW we solve the Claude Code tool-count ceiling — by routing through one meta-MCP instead of registering 82 individually.

## 3.5 Council bridge for material decisions

```
User: "delete all branches from this repo older than 90 days"
  ↓
Care Membrane → score harm = 0.12 (medium, has rollback)
  ↓
Council → 33-node vote: 28 approve, 4 abstain, 1 reject
  ↓ approved
Attestation signed → action executes
  ↓
Audit log: "deleted 17 branches · signature 0xabc... · verify at meok.ai/verify/0xabc"
```

For low-stakes actions (read-only), bypass council. For destructive / financial / outbound-comm actions, mandatory council vote.

## 3.6 Model gateway

Routes to:
- **Anthropic API** (claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5)
- **OpenAI API** (gpt-5, gpt-5-mini)
- **Google API** (gemini-2.5-pro, gemini-2.5-flash)
- **xAI API** (grok-4)
- **Mistral La Plateforme**
- **DeepSeek** / **MiniMax** / **Hunyuan** / **Stepfun**
- **Local Ollama** (qwen3, gemma3, llama4)
- **Vast.ai-hosted Ollama** (RTX 4070S, llama3.1:8b + llama3.2:3b + nomic-embed-text)

Routing policy:
- Coding → Claude Opus / GPT-5 / Qwen3
- Reasoning-hard → Gemini 2.5 Pro / DeepSeek R1
- Cheap-throughput → Ollama local / Haiku
- Vision → Gemini 2.5 / Claude / GPT-5
- Realtime → Cerebras / Groq via OpenRouter

## 3.7 Plugin system (the network effect)

A Claw plugin is a single Go file that:
1. Registers a view OR adds tools to existing views
2. Declares MCP dependencies
3. Optionally hooks into the council
4. Optionally publishes audit events

Distribution: `claw plugin install <github-url>`. Plugin registry hosted at `claw.meok.ai/registry`.

This is the same mechanic as Helix + Neovim plugins, but explicitly designed for AI workflows.

## 3.8 The "claw config" — a YAML or HCL

```yaml
# ~/.config/meok-claw/config.yaml
provider:
  default: anthropic
  routes:
    code:     claude-opus-4-7
    reason:   gemini-2.5-pro
    cheap:    ollama:llama4:32b

council:
  endpoint: https://sovereign.templeman-opticians.com/mcp
  quorum:   23

care_membrane:
  block_threshold: 0.85
  warn_threshold:  0.40

attestation:
  signer:   hmac        # or ed25519, or sigstore
  publish:  meok.ai/verify

views:
  - chat
  - agent
  - compliance
  - browse
  - inbox
  - code
  - council
  - ledger

mcps:
  router: api.meok.ai/v1
  fallback_local: true

models:
  anthropic_api_key:   env(ANTHROPIC_API_KEY)
  openai_api_key:      env(OPENAI_API_KEY)
  ollama_endpoint:     localhost:11434
  vast_endpoint:       localhost:11436
```

## 3.9 Audit trail = product

Every Claw session writes an append-only audit log:

```jsonl
{"ts":"2026-05-28T15:00:00Z","user":"nick","view":"compliance","action":"call_mcp","mcp":"meok-eu-ai-act-art-50-mcp","tool":"check_compliance","input_hash":"sha256:abc...","output_hash":"sha256:def...","signature":"hmac-sha256:..."}
{"ts":"2026-05-28T15:00:05Z","user":"nick","view":"agent","action":"council_vote","quorum":23,"yes":28,"no":4,"abstain":1,"decision":"approve","signature":"..."}
```

Buyer perspective: "Every action my agent took yesterday is signed, timestamped, and verifiable at a public URL. My auditor signs off in 10 minutes instead of 10 days."

---

# PART 4 — Distribution: how Claw reaches every OS

## 4.1 macOS (Tier 1)

- Homebrew formula: `brew install meok-ai-labs/tap/claw`
- Universal binary (intel + arm64)
- LaunchAgent for daemon mode (optional)
- Integrates with: Raycast extension, Alfred workflow, Keyboard Maestro

## 4.2 Linux (Tier 1)

- `.deb` for Debian/Ubuntu (apt)
- `.rpm` for Fedora/RHEL (dnf)
- AUR package for Arch
- Static binary for any glibc/musl distro
- systemd service template for daemon mode
- Snap + Flatpak packages (lower priority)

## 4.3 Windows (Tier 1)

- Scoop bucket: `scoop install claw`
- Chocolatey package: `choco install claw`
- Winget: `winget install MEOK.Claw`
- WSL2 fully supported (it's a Linux binary)
- Native Windows PowerShell shim that proxies to WSL if not installed natively

## 4.4 iOS (Tier 2 — via existing terminal apps)

- **Blink Shell** ships Mosh + custom binaries; document the install path
- **iSH** runs ELF binaries; we cross-compile a x86_64-linux binary that runs on iSH
- **Termius** has a remote-Mosh path; we ship a one-line connect alias
- **a-Shell** Lua/Python scripting hooks
- Distribute via gist + readme rather than App Store (App Store would require Apple acceptance; not worth the fight at v1)

## 4.5 Android (Tier 2)

- **Termux** apt repo: ship `pkg install claw` after we host an apt repo
- F-Droid recipe (eventually)

## 4.6 Browser (Tier 1.5 — important for shareability)

- `try.meok.ai/claw` — full browser-embedded Claw via **xterm.js + WebSocket**
- Backend: a single Go binary running on Fly.io or a Vercel function (or our M2 home server)
- One-time anonymous sessions free; auth'd sessions persistent
- "Open in browser" sticker on every README

## 4.7 Desktop GUI wrapper (Tier 2)

- Tauri 2.0 wrapper: native window holding the TUI, plus a native title bar with Claw's identity
- macOS Dock icon, Windows taskbar, Linux .desktop
- Allows users who don't want to open a terminal to launch Claw like an app

## 4.8 SSH-as-a-service (Tier 1.5)

- `ssh claw.meok.ai` — Wish server (Charm's SSH server library) → drops you into a guest Claw session
- Pay to upgrade: persistent sessions, council access, MCP fleet
- Pricing: free (10 min/day), £5/mo (unlimited guest), £79/mo (Pro — same as Claw Pro)

## 4.9 IDE bridges (Tier 2)

- VSCode extension: opens Claw in the integrated terminal, plus a side-panel chat
- JetBrains plugin
- Helix integration (drop-in to runtime/themes/queries)
- Cursor extension

## 4.10 Distribution numbers (3-tier rollout)

| Phase | Surface | Reach (rough) |
|---|---|---|
| Phase 1 | brew + scoop + winget + apt + Termux + iSH | 100M+ devs/installable surface |
| Phase 2 | try.meok.ai (browser) + Tauri wrapper | adds non-CLI users |
| Phase 3 | IDE extensions + SSH-as-a-service | adds enterprise + remote teams |

---

# PART 5 — The "eating" plan

What gets absorbed and when. **Honest framing:** Claw doesn't replace iOS; it replaces the AI-shaped workflows that currently run on top of iOS/Windows/browsers etc.

## 5.1 Things Claw can credibly eat (high-confidence)

| Today's surface | What Claw absorbs |
|---|---|
| ChatGPT app on every OS | The chat workflow moves into Claw (cheaper, more private, multi-model) |
| Claude.ai web | Same — Claude Code already did this for engineers |
| Cursor / Continue / Aider | Code-aware chat in Claw's Code view |
| Slack message drafting via AI | Claw inbox view drafts replies, sends via Slack MCP |
| Gmail triage | Claw inbox view triages, drafts, archives via Gmail MCP |
| Notion / Linear / Jira ticket triage | Claw view connects to each via their MCP |
| Compliance evidence collection (spreadsheets) | Claw compliance view auto-collects via MCPs + signs |
| Manual stripe checkout management | Claw ledger view shows live revenue + DELBOY signals |
| Manual MCP installation (claude_desktop_config.json editing) | Claw discovers + installs MCPs declaratively |
| Browser-based research | Claw browse view (headless Chromium → markdown), agent extracts |
| Terminal multiplexing (tmux + nvim + lazygit) | Claw replaces those in one binary |

## 5.2 Things Claw will NOT eat (honest)

- **iOS consumer apps** (TikTok, Instagram) — wrong audience, wrong UI primitive
- **Spreadsheets for non-technical knowledge workers** — Excel/Sheets win
- **Photo + video editing** — GUI is correct primitive
- **Mobile-first social products** — TUI is wrong shape for thumbs
- **Mainstream consumer web browsing** — Chrome wins
- **Pure GUI design tools** (Figma) — wrong surface

So the realistic claim isn't "MEOK Claw eats iOS." It's:

> **"MEOK Claw becomes the keyboard-driven AI control plane for developers, SREs, compliance officers, lawyers, finance teams, and any knowledge worker whose primary tool is a terminal or a CLI."**

That market is 50M+ globally. It's a huge market. Pretending it's "every iPhone user" makes us look unserious.

## 5.3 What's the actual flywheel

```
1. Claw ships → engineers install → audit chain creates compliance value
2. Compliance value → CTOs notice → buy CSOAI Enterprise (£1,499/mo)
3. CTOs roll Claw to SecOps + DevOps + GRC teams (per-seat £79/mo)
4. Each new user installs MCPs from the registry → MCP authors earn rev share
5. MCP authors build for Claw → more capabilities → more users
6. Users contribute plugins → Claw ecosystem network effect
7. Council adjudicates ecosystem disputes (the "App Store review board" function)
8. SOV3 learns from anonymised session data → smarter routing → better Claw
```

---

# PART 6 — Honest limits (what TUI WON'T win)

| Limitation | Implication |
|---|---|
| Keyboard-required | Non-technical users won't pick it up unless wrapped in GUI |
| No rich media UI | Image editing, video editing, complex visual layouts need GUI |
| Bandwidth for streaming | Works but feels worse than a polished web/desktop app for video chat |
| Discoverability | Users who don't know "what to type" need GUI affordances |
| Mobile thumbs | Typing complex commands on phone is painful |
| Enterprise IT inertia | Many shops still don't allow installing arbitrary CLI tools — sometimes you need a browser/Electron alternative for political reasons |
| Skill-gap of buyers | Compliance officers might prefer a web form to a TUI; we need a thin web wrap on top |

**The hedge:** also ship a thin web app (xterm.js wrapped + a side-bar of GUI buttons that emit Claw commands). Same backend, two front-ends.

---

# PART 7 — Revenue model on top of Claw

## 7.1 Free tier

- Claw binary free (BSL or MIT? — likely Apache 2.0 to allow forking but mark patent-clause)
- All 82 MCPs free to invoke locally
- 100 LLM calls/day with our shared key
- Local audit log
- No council access
- No public verify URL

## 7.2 Pro (£79/mo per user)

- Unlimited LLM calls with our shared key
- Public verify URL for every signed action
- Council access (vote on decisions in your own sessions)
- 30 days of cloud-backed audit log
- Priority MCP routing
- Plugin registry access

## 7.3 Team (£299/mo for 5 users, £49/user after)

- Shared MCP fleet config
- Team-level audit log
- Compliance dashboard
- SSO via Clerk
- Audit-grade replayable sessions

## 7.4 Enterprise (£1,499/mo)

- All 82 MCPs + custom MCP authoring SLA
- Dedicated council instance
- Self-hosted attestation key (your HMAC, not ours)
- 1 year audit log retention
- SOC2 Type II report
- Quarterly review call with Nicholas
- Custom training/fine-tune of routing on your usage patterns

## 7.5 Marketplace revenue share

Plugin authors keep 70%, MEOK takes 30%. Same as Mac App Store ratio (without Apple's behavior, since plugins are OSS-distributable).

---

# PART 8 — 12-week build plan

## Weeks 1-2 (June)

- Bootstrap Go module `claw` in `~/clawd/meok-claw/`
- Bubble Tea + Lipgloss skeleton with 3 views: Chat, Agent, Compliance
- Anthropic API integration + streaming
- meok-mcp-router integration → tool dispatch
- One-command build for macOS + Linux + Windows

**Deliverable:** `brew install meok-ai-labs/tap/claw` works, shows chat view with Claude streaming. £0 revenue but Show HN ready.

## Weeks 3-4

- Council bridge — every "destructive" action gets a council vote
- Attestation signing for every action
- Audit log writer (SQLite + JSONL)
- Browse view (Playwright headless → markdown)

**Deliverable:** Show HN post — "MEOK Claw: an audit-grade AI terminal." Expect 200-2,000 stars in week.

## Weeks 5-6

- Inbox view (Gmail MCP + Slack MCP via existing Anthropic connectors)
- Code view (helix-style editor + agent loop)
- Files view (semantic search via local embeddings)
- Ledger view (DELBOY signals integration)

**Deliverable:** "If you live in your terminal, this is your operating system." 10K+ stars target.

## Weeks 7-8

- Plugin SDK + registry (`claw plugin install <gh-url>`)
- 5 reference plugins (one per MEOK substrate)
- Browser embed (`try.meok.ai`)
- Tauri wrapper for desktop GUI

**Deliverable:** Plugin ecosystem launches. Charm Cloud-style hosted plugin registry.

## Weeks 9-10

- Multi-model gateway (5+ providers + Ollama)
- Pricing engine + Stripe integration (free/pro/team/enterprise)
- Replayable sessions (asciinema-style + signed)
- Compliance dashboard view (the "GRC officer" UI)

**Deliverable:** Pro tier opens. First paying user.

## Weeks 11-12

- SSH-as-a-service (`ssh claw.meok.ai`)
- VSCode + JetBrains + Helix integrations
- Marketing site (claw.meok.ai)
- Press push (Hacker News, dev podcasts, Charm community)

**Deliverable:** £5K-£10K MRR if 50-100 Pro users land. Hits MASTER_PLAN £1K MRR target by week 8 if 13 Pro users.

---

# PART 9 — Kimi swarm deep-research briefs

### Brief K-1: "Warp deep architecture teardown"

**Question:** How does Warp's terminal-with-AI actually work? What's their team allocation between AI features vs UI vs runtime? What did they get wrong that MEOK can do right?

**Source mine:** Warp engineering blog, Hacker News threads, Glassdoor reviews, GitHub repos (`runwarp/*`), Vercel CTO panel mentions, Sequoia Capital memo (if leaked), Stripe Atlas filings.

**Acceptance:** identify 5 architecture decisions Warp made that we can avoid or copy, with cited evidence.

### Brief K-2: "Charm.sh business + ecosystem dissection"

**Question:** How does Charm monetise OSS TUI? What's the Glow / Soft Serve / Crush ARR? Could MEOK contribute upstream, get co-marketing, ride the Bubble Tea brand?

**Source mine:** Charm blog, their open-source repos, GitHub Sponsors, ICONIQ Capital filing, Charm conference talks.

**Acceptance:** ranked partnership/contribution opportunities with Charm + estimated revenue impact.

### Brief K-3: "Claude Code + Codex CLI + Aider feature gap map"

**Question:** What does each AI CLI do well, what do they miss, what would MEOK Claw add that's defensible IP?

**Source mine:** product docs, repo READMEs, changelogs, X/Reddit threads, GitHub issues.

**Acceptance:** feature matrix + MEOK's unique-to-us additions (audit chain, council, compliance MCPs, care membrane).

### Brief K-4: "iOS Blink + Termius + a-Shell technical install paths"

**Question:** Exactly what's the technical procedure for users to run a MEOK Claw binary on iOS via these terminals? What's the App Store policy line we must respect? Are there sandbox issues?

**Source mine:** Blink docs, Termius docs, a-Shell readme, Apple developer guidelines (sandbox), iOS sysctl limits, ELF compatibility tests.

**Acceptance:** documented install path per app, plus a copy-pastable command for users.

### Brief K-5: "Web-embedded terminal (xterm.js + ttyd) cost model"

**Question:** What does it cost to host `try.meok.ai/claw` for 1K / 10K / 100K monthly users? Fly.io vs Vercel functions vs M2 home server vs Cloudflare Workers.

**Source mine:** Fly.io pricing, Vercel pricing, ttyd repo, k0s/k3s benchmarks.

**Acceptance:** cost-per-user table at 3 scales + recommended deploy target.

### Brief K-6: "Plugin marketplace economics from peers"

**Question:** What share-economics work for plugin marketplaces? Compare GitHub Marketplace (70/30), npm + paid registries (Sindre's), Charm Cloud, Bun.sh, VS Code marketplace (free), Cursor's mcp.so.

**Source mine:** GitHub Marketplace docs, npm Pro pricing, Charm Cloud pricing, VS Code marketplace policies.

**Acceptance:** recommended Claw plugin economics with revenue-projection at 1K / 10K plugins.

### Brief K-7: "Audit-grade AI for regulated buyers — buyer interviews"

**Question:** What do compliance officers / SecOps leads / CTOs of banks/insurers actually want from an AI tool? What would they pay £1,499/mo for vs £79/mo?

**Source mine:** secondary research — Gartner reports, Forrester, AI Compliance Practitioner forum posts, LinkedIn posts by CISOs, ICAEW guidance.

**Acceptance:** 5-interview-pack ready for Nick to fire, plus 3 quantified value propositions.

### Brief K-8: "The 'AI OS' marketing positioning playbook"

**Question:** How did Warp, Cursor, Vercel, Linear, Notion position as "the operating system for X"? What worked, what didn't, what would land for Claw?

**Source mine:** marketing blogs from each, launch tweets, podcast appearances, hire/fire patterns at GTM heads.

**Acceptance:** 3 positioning options (technical/aspirational/utility) with messaging examples + recommended pick.

---

# Appendix A — The single sentence

> **MEOK Claw is the keyboard-first, audit-grade, compliance-native AI control plane for the 50M+ knowledge workers whose primary tool is a terminal — and the gateway through which every AI, every MCP, every browser, every API, every OS interaction can be reasoned about, voted on by the council, signed by the attestation chain, and verified publicly.**

# Appendix B — Why this beats "another chat app"

| Polished chat app | MEOK Claw |
|---|---|
| One model | Any model, routed |
| One feature surface | Plugin ecosystem |
| Vendor lock | OSS core, plugin economics |
| Closed audit trail | Public verify URL |
| Trust = vendor brand | Trust = signed attestation |
| Pricing = per-seat SaaS | Pricing = per-seat + marketplace + compliance |
| Compliance = "we have SOC2" | Compliance = "every action is signed and council-voted" |

# Appendix C — How DELBOY MODE plugs in

DELBOY MODE (revenue nervous system) becomes a Claw view (`Ctrl-0 Ledger`). It shows:
- 12-sensor real-time dashboard
- Suggested next actions (queue from DELBOY)
- One-click approval to fire queued actions
- Spend + revenue line graph
- Anomaly alerts

So Claw is both the consumer surface AND the operator surface for DELBOY.

---

## End-of-doc

*Generated 2026-05-28 by Claude (Opus 4.7) at Nick's direct request. Update this doc whenever the TUI landscape shifts (every quarter). Treat as the strategic spec; build artifacts go into `meok-claw/` (already exists per the project map).*
